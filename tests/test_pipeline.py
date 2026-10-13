"""Publishing regressions: a changed source must not silently produce stale outputs."""
import copy
import json
import re
import sys
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from build import web_source
from content import content_hash, load_snapshot
from editorial_audit import changed_sources, reader_content, revision_records, TEMPLATES_URL


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.data=load_snapshot()
        lock=json.loads((ROOT/"content/editorial-source-lock.json").read_text(encoding="utf-8"))
        self.export={"pages":[{"id":p["url"],"content":"Reader copy", "pageLastEditedAt":p["pageLastEditedAt"]} for p in lock["pages"]]}
        template=next(p for p in self.export["pages"] if p["id"]==TEMPLATES_URL)
        template["content"]="\n".join("## "+t["name"]+"\n"+"\n".join("> "+line for line in t["text"].split("\n")) for t in self.data["templates"].values())

    def test_reviewed_checksum_detects_text_changes(self):
        self.assertEqual(content_hash(self.data),self.data["contentSha256"])
        modified=copy.deepcopy(self.data);modified["guides"][0]["purpose"]+=" changed"
        self.assertNotEqual(content_hash(modified),self.data["contentSha256"])

    def test_web_embedding_preserves_content_and_escapes_script_boundaries(self):
        data=copy.deepcopy(self.data);data["warning"]="}; const GUIDES= text; </script><script>doSomething()</script>\u2028"
        original=(ROOT/"index.html").read_text(encoding="utf-8")
        rendered=web_source(original,data)
        start=rendered.index("const SNAPSHOT=")+len("const SNAPSHOT=")
        decoded,length=json.JSONDecoder().raw_decode(rendered[start:])
        embedded=rendered[start:start+length]
        self.assertNotIn("</script>",embedded)
        self.assertEqual(decoded,data)
        self.assertEqual(web_source(rendered,data),rendered)
        self.assertIn("const GUIDES=",rendered)

    def test_incomplete_source_exports_fail_closed(self):
        for key,value in [("truncated",True),("unknownBlockCount",2),("content","")]:
            export=copy.deepcopy(self.export);export["pages"][0][key]=value
            with self.assertRaises(ValueError): revision_records(export,self.data)
        self.export["pages"].pop(0)
        with self.assertRaises(ValueError): revision_records(self.export,self.data)
        export=copy.deepcopy(self.export);export["pages"].append(export["pages"][0])
        with self.assertRaisesRegex(ValueError,"Duplicate source"):
            revision_records(export,self.data)

    def test_all_sources_and_exact_templates_are_required(self):
        self.assertEqual(len(revision_records(self.export,self.data)),14)
        template=next(p for p in self.export["pages"] if p["id"]==TEMPLATES_URL)
        template["content"]=template["content"].replace("Hi [Name]","Hello [Name]",1)
        with self.assertRaisesRegex(ValueError,"template text differs"):
            revision_records(self.export,self.data)

    def test_reader_changes_are_reported_and_internal_notes_are_excluded(self):
        text="Reader copy\n## Editorial notes - internal\nPrivate planning note"
        self.assertEqual(reader_content(text),"Reader copy")
        self.assertEqual(changed_sources([{"url":"a","readerSha256":"old"}],
                                        [{"url":"a","readerSha256":"new"}]),["a"])
        self.assertEqual(changed_sources([{"url":"a","readerSha256":"same"}],
                                        [{"url":"a","readerSha256":"same"}]),[])

    def test_print_links_resolve_and_paper_selection_is_not_forced(self):
        for file in (ROOT/"assets/app.js",ROOT/"assets/representative.js"):
            for relative in re.findall(r"output/pdf/[\w-]+\.pdf",file.read_text(encoding="utf-8")):
                self.assertTrue((ROOT/relative).is_file(),relative)
        css=(ROOT/"assets/prototype.css").read_text(encoding="utf-8")
        self.assertRegex(css,r"@page\s*\{\s*size:\s*auto;")


if __name__=="__main__": unittest.main()
