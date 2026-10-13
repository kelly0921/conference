"""Check a fresh connected Notion export against the reviewed source revisions.

The export is an ignored staging input, not a second manuscript. Source changes
are reported for editorial reconciliation; this command never changes reader copy.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

from content import ROOT, load_snapshot

LOCK = ROOT / "content/editorial-source-lock.json"
TEMPLATES_URL = "https://app.notion.com/p/3f7b144c6b998111a9b6c04438a99a89"


def page_id(url):
    matches=re.findall(r"[0-9a-f]{32}",str(url).replace("-","").lower())
    if not matches: raise ValueError(f"Invalid source page ID: {url}")
    return matches[-1]


def reader_content(content):
    return re.split(r"\n## (?:Editorial (?:notes|sources|use)|How this page)",
                    content.replace("\r\n","\n"),maxsplit=1)[0].strip()


def template_texts(content):
    result=[]
    for section in re.split(r"(?m)^## ",content)[1:]:
        lines=re.findall(r"(?m)^> ?(.*)$",section)
        if lines:
            text="\n".join(lines).replace("\\[","[").replace("\\]","]").strip()
            result.append(text)
    return result


def revision_records(export, snapshot):
    pages={}
    for page in export["pages"]:
        id=page_id(page["id"])
        if id in pages: raise ValueError(f"Duplicate source in export: {page['id']}")
        pages[id]=page
    required=[g["notionSource"] for g in snapshot["guides"]]+[TEMPLATES_URL,
        snapshot["registrySource"],
        "https://app.notion.com/p/3f7b144c6b998172b901ea6ed67941ce",
        "https://app.notion.com/p/3f7b144c6b998174aaa3e86cc0ec9cae",
        "https://app.notion.com/p/3f7b144c6b99814aac23eb6f256f0df4"]
    records=[]
    for url in required:
        id=page_id(url)
        if id not in pages: raise ValueError(f"Missing canonical source: {url}")
        page=pages[id]
        if page.get("truncated") or page.get("unknownBlockCount",0):
            raise ValueError(f"Incomplete source export: {url}")
        if not page.get("content") or not page.get("pageLastEditedAt"):
            raise ValueError(f"Missing source body/revision metadata: {url}")
        body=reader_content(page["content"])
        if "<unknown" in body or "<truncated" in body:
            raise ValueError(f"Unsupported block in source: {url}")
        records.append({"url":url,"pageLastEditedAt":page["pageLastEditedAt"],
            "readerSha256":hashlib.sha256(body.encode("utf-8")).hexdigest()})
    actual=template_texts(pages[page_id(TEMPLATES_URL)]["content"])
    expected=[t["text"] for t in snapshot["templates"].values()]
    if actual!=expected:
        raise ValueError("Canonical template text differs from the reviewed snapshot; reconcile before freezing")
    return records


def changed_sources(previous,current):
    old={p["url"]:p["readerSha256"] for p in previous}
    now={p["url"]:p["readerSha256"] for p in current}
    return sorted(url for url in old.keys()|now.keys() if old.get(url)!=now.get(url))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("export",type=Path,help="Fresh Notion connector export (staging JSON)")
    parser.add_argument("--write-lock",action="store_true",help="Record revisions after editorial review")
    args=parser.parse_args()
    snapshot=load_snapshot()
    export=json.loads(args.export.read_text(encoding="utf-8"))
    records=revision_records(export,snapshot)
    lock={"snapshotVersion":snapshot["snapshotVersion"],"contentSha256":snapshot["contentSha256"],
          "sourceMode":snapshot["sourceMode"],"exportedAt":export["exportedAt"],
          "provider":export["provider"],"templateTextMatches":True,"pages":records}
    if args.write_lock:
        if LOCK.exists():
            previous=json.loads(LOCK.read_text(encoding="utf-8"))
            changed=set(changed_sources(previous["pages"],records))
            guide_urls={g["notionSource"] for g in snapshot["guides"]}
            if changed & guide_urls and previous["snapshotVersion"]==snapshot["snapshotVersion"]:
                raise SystemExit("Changed guide sources require a new reviewed editorial version before recording the lock")
        LOCK.write_text(json.dumps(lock,ensure_ascii=False,indent=2)+"\n",encoding="utf-8",newline="\n")
        print(f"Recorded {len(records)} source revisions; no guide/template copy changed")
    else:
        previous=json.loads(LOCK.read_text(encoding="utf-8"))
        if previous["contentSha256"]!=snapshot["contentSha256"]:
            raise SystemExit("Source lock refers to a different editorial freeze")
        changes=changed_sources(previous["pages"],records)
        if changes:
            raise SystemExit("Source changes need review:\n"+"\n".join(changes))
        print(f"No reader-source drift across {len(records)} canonical pages; four templates match exactly")


if __name__ == "__main__": main()
