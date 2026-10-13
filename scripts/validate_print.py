"""Check generated page geometry, full source-text parity and sample privacy."""
import argparse
import json
import re
from pathlib import Path

import pdfplumber
from pypdf import PdfReader

from build_workbook import printable, sample_payload
from content import ROOT, load_snapshot


def normalized(text):
    return re.sub(r"\s+"," ",printable(text)).strip()


def validate(output):
    data=load_snapshot()
    manifest=json.loads((output/"manifest.json").read_text(encoding="utf-8"))
    assert manifest["contentSha256"]==data["contentSha256"],"PDF source version mismatch"
    sample=sample_payload()
    total=0
    for entry in manifest["files"]:
        path=output/entry["name"]
        reader=PdfReader(path)
        assert len(reader.pages)==entry["pages"],f"Wrong page count: {path}"
        assert data["contentSha256"] in reader.metadata.subject,"Missing source digest"
        expected_size=entry["pageSizePoints"]
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                assert all(abs(a-b)<.02 for a,b in zip((page.width,page.height),expected_size)),"Paper size mismatch"
                for char in page.chars:
                    assert -.1<=char["x0"]<=char["x1"]<=page.width+.1,(path,page.page_number,char)
                    assert -.1<=char["top"]<=char["bottom"]<=page.height+.1,(path,page.page_number,char)
                assert not any(c["text"] in ("\ufffd","\u25a0") for c in page.chars),"Broken glyph"
            total+=len(pdf.pages)
            text=normalized("\n".join(page.extract_text() or "" for page in pdf.pages))
            if "workbook" in path.name:
                assert len(pdf.pages)==15,"Expected fifteen-page reviewed layout"
                assert len(reader.outline)==15,"Missing page navigation bookmarks"
                for guide in data["guides"]:
                    for value in [guide["title"],guide["purpose"],guide["detailsHeading"],
                                  guide["exampleTitle"],guide["example"],guide["optionalHeading"],
                                  guide["optionalBody"],guide["notionSource"],*guide["details"]]:
                        assert normalized(value) in text,f"Missing {guide['id']} text: {value}"
                    for check in guide["checks"]:
                        assert normalized(check["label"]) in text and normalized(check["text"]) in text
                for template in data["templates"].values():
                    assert normalized(template["name"]) in text
                    assert normalized(template["check"]) in text
                    assert normalized(template["text"]) in text,"Template text changed"
            else:
                for section in sample["sections"]:
                    assert normalized(section["title"]) in text
                    for line in section["lines"]: assert normalized(line) in text,"Sample/export text mismatch"
                assert "fictional" in text.lower(),"Sample caveat missing"
                assert "LinkedIn" not in text,"Private channel leaked into sample"
                assert "Private budget figures" not in text and "Private message drafts" not in text
                assert "CL-DEMO-27" in text and "America/Los_Angeles" in text,"Lost role/timezone"
                assert "09:30-10:10" in text and "Demo Room A" in text,"Lost appointment fields"
        print(f"Verified {path.name}: {len(reader.pages)} pages")
    print(f"Verified all {total} pages: bounds, text, metadata, bookmarks and sample privacy")


if __name__ == "__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir",type=Path,default=ROOT/"output/pdf")
    validate(parser.parse_args().output_dir)
