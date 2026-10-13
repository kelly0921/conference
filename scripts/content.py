"""Validate the reviewed content input shared by the web and print builders."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content/playbook-v1.3.snapshot.json"


def content_hash(data):
    source = {key: value for key, value in data.items() if key != "contentSha256"}
    return hashlib.sha256(json.dumps(source, sort_keys=True, ensure_ascii=False,
                                     separators=(",", ":")).encode("utf-8")).hexdigest()


def load_snapshot(path=SOURCE):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    guides = data["guides"]
    ids = {g["id"] for g in guides}
    if len(ids) != 9 or len(guides) != 9:
        raise ValueError("Expected nine unique guides")
    if {s: sum(g["stage"] == s for g in guides) for s in data["stages"]} != {
            "before": 4, "during": 3, "after": 2}:
        raise ValueError("Expected the approved 4/3/2 stage structure")
    if set(data["templates"]) != {"funding", "pre", "follow", "recap"}:
        raise ValueError("Expected the four approved templates")
    for guide in guides:
        for field in ("title", "purpose", "checks", "details", "detailsHeading",
                      "example", "exampleTitle", "optionalBody", "notionSource"):
            if not guide.get(field):
                raise ValueError(f"{guide['id']}: missing {field}")
        if not set(guide.get("related", [])) <= ids:
            raise ValueError(f"{guide['id']}: invalid related guide")
        if not set(guide.get("officialRefs", [])) <= set(data["sources"]):
            raise ValueError(f"{guide['id']}: invalid official reference")
    if content_hash(data) != data["contentSha256"]:
        raise ValueError("Editorial checksum mismatch; review and freeze source first")
    return data


def asset_hash(path):
    # Git line-ending conversion must not change the version in index.html.
    return hashlib.sha256(Path(path).read_text(encoding="utf-8")
                          .replace("\r\n", "\n").encode("utf-8")).hexdigest()[:10]
