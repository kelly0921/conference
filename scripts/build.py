"""Rebuild or verify the local web/PDF artifacts from one reviewed freeze."""
import argparse
import hashlib
import json
import re
import tempfile
from pathlib import Path

from build_workbook import build_all
from content import ROOT, asset_hash, load_snapshot

OUTPUT = ROOT / "output/pdf"


def web_source(html, data):
    serialized = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    serialized = serialized.replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    marker="const SNAPSHOT="
    start=html.index(marker)+len(marker)
    _,length=json.JSONDecoder().raw_decode(html[start:])
    end=start+length
    if not re.match(r";\s*const GUIDES=",html[end:]):
        raise ValueError("Embedded source boundary is invalid; refusing HTML replacement")
    result=html[:start]+serialized+html[end:]
    for name in ("assets/prototype.css", "assets/design.css", "assets/planning.js", "assets/representative.js", "assets/app.js"):
        result = re.sub('"'+re.escape(name)+r'(?:\?v=[^"]*)?"',
                        '"'+name+'?v='+asset_hash(ROOT/name)+'"',result)
    return result


def manifest(data, entries, folder):
    return {"snapshotVersion":data["snapshotVersion"], "contentSha256":data["contentSha256"],
        "sourceCheckedDate":data["sourceCheckedDate"], "guideIds":[g["id"] for g in data["guides"]],
        "templateKinds":list(data["templates"]), "files":[
            {"name":name,"pages":count,"pageSizePoints":list(size),
             "sha256":hashlib.sha256((folder/name).read_bytes()).hexdigest()}
            for name,count,size in entries]}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check",action="store_true",help="Verify artifacts without rewriting them")
    args=parser.parse_args()
    data=load_snapshot()
    index=ROOT/"index.html"
    expected=web_source(index.read_text(encoding="utf-8"),data)
    if args.check and expected!=index.read_text(encoding="utf-8"):
        raise SystemExit("Web snapshot or asset versions are stale: run scripts/build.py")
    if not args.check:
        index.write_text(expected,encoding="utf-8",newline="\n")
    temp_parent=(ROOT/".qa-cache").resolve()
    if not temp_parent.is_relative_to(ROOT):
        raise ValueError("Build staging directory must remain inside the workspace")
    temp_parent.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="conference-print-",dir=temp_parent) as tmp:
        folder=Path(tmp).resolve()
        if not folder.is_relative_to(temp_parent) or folder==temp_parent:
            raise ValueError("Invalid build staging path")
        _,entries=build_all(folder)
        meta=manifest(data,entries,folder)
        meta_text=json.dumps(meta,indent=2,ensure_ascii=False)+"\n"
        if args.check:
            for name,_,_ in entries:
                if not (OUTPUT/name).is_file() or (OUTPUT/name).read_bytes()!=(folder/name).read_bytes():
                    raise SystemExit(f"Print artifact is stale: {name}")
            if not (OUTPUT/"manifest.json").is_file() or (OUTPUT/"manifest.json").read_text(encoding="utf-8")!=meta_text:
                raise SystemExit("Print manifest is stale")
        else:
            OUTPUT.mkdir(parents=True,exist_ok=True)
            for name,_,_ in entries: (OUTPUT/name).write_bytes((folder/name).read_bytes())
            (OUTPUT/"manifest.json").write_text(meta_text,encoding="utf-8",newline="\n")
    print(f"{'Verified' if args.check else 'Built'} editorial {data['snapshotVersion']}: web + three PDFs")


if __name__ == "__main__": main()
