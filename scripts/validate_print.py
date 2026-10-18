"""Check generated page geometry, full source-text parity and sample privacy."""
import argparse
import json
import re
from pathlib import Path

import pdfplumber
from pypdf import PdfReader
from pypdf.generic import ContentStream

from build_workbook import printable, sample_payload
from content import ROOT, load_snapshot


def normalized(text):
    return re.sub(r"\s+"," ",printable(text)).strip()


def validate_structure(reader):
    root=reader.trailer["/Root"]
    assert root.get("/Lang")=="en-US","Missing document language"
    assert root["/MarkInfo"]["/Marked"],"PDF is not marked as tagged"
    tree=root["/StructTreeRoot"]
    document=tree["/K"]
    assert document["/S"]=="/Document","Missing logical document root"
    sections=document["/K"]
    assert len(sections)==len(reader.pages),"Reading order lost a page"
    nums=tree["/ParentTree"]["/Nums"]
    parents={int(nums[i]):nums[i+1] for i in range(0,len(nums),2)}
    for page,section_ref in zip(reader.pages,sections):
        section=section_ref.get_object()
        children=[child.get_object() for child in section["/K"]]
        assert any(child["/S"]=="/H1" for child in children),"Missing page heading"
        mapping=parents[int(page["/StructParents"])].get_object()
        expected=[int(child["/K"][0] if isinstance(child["/K"],list) else child["/K"]) for child in children]
        found, used_fonts, marked = [],set(),[]
        current_font=None
        for operands,operator in ContentStream(page.get_contents(),reader).operations:
            if operator in (b"BDC",b"BMC"):
                marked.append(operands[0])
                if operator==b"BDC" and "/MCID" in operands[1]:
                    mcid=int(operands[1]["/MCID"])
                    found.append(mcid)
                    assert mapping[mcid].get_object()["/S"]==operands[0],"Content/tag role mismatch"
            elif operator==b"EMC":
                assert marked,"Unbalanced marked content"
                marked.pop()
            elif operator in (b"Tj",b"TJ"):
                assert marked,"Untagged text"
                used_fonts.add(current_font)
            elif operator==b"Tf": current_font=operands[0]
        assert not marked and found==expected,"Incorrect logical reading order"
        for name in used_fonts:
            font=page["/Resources"]["/Font"][name]
            assert "/ToUnicode" in font,"Font lacks Unicode character mapping"
            desc=font["/FontDescriptor"]
            assert "/FontFile2" in desc or "/FontFile3" in desc,"Unembedded text font"
        for annotation in page.get("/Annots",[]):
            a=annotation.get_object()
            if a.get("/Subtype")=="/Link":
                assert a.get("/Contents"),"Source link lacks an accessible label"
                assert parents[int(a["/StructParent"])].get_object()["/S"]=="/Link","Source annotation lacks a Link tag"


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
        validate_structure(reader)
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
    print(f"Verified all {total} pages: bounds, text, metadata, bookmarks, logical structure, embedded fonts and sample privacy")


if __name__ == "__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir",type=Path,default=ROOT/"output/pdf")
    validate(parser.parse_args().output_dir)
