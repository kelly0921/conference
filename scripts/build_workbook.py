"""Print the approved snapshot. No reader text is maintained in a PDF manuscript."""
import html
import json
import re
import subprocess
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

from content import ROOT, load_snapshot

TEXT = colors.HexColor("#252b2e")
SECONDARY = colors.HexColor("#596469")
TEAL = colors.HexColor("#006d68")
MINT = colors.HexColor("#e7f3ef")
RULE = colors.HexColor("#7d8c8d")


def printable(value):
    return str(value).translate(str.maketrans({"—":" - ","–":"-","‑":"-",
        "→":" -> ","↗":"", "’":"'", "‘":"'", "“":'"', "”":'"'}))


def escaped(value):
    return html.escape(printable(value))


class Page:
    def __init__(self, path, size, snapshot, title):
        self.width, self.height = size
        self.snapshot = snapshot
        self.c = canvas.Canvas(str(path), pagesize=size, invariant=1, pageCompression=1)
        self.c.setTitle(title)
        self.c.setAuthor("Conference Leverage")
        self.c.setSubject(f"Editorial {snapshot['snapshotVersion']}; SHA256 {snapshot['contentSha256']}")
        self.c.setKeywords("Conference Leverage, internal review, fictional examples")
        self.margin = 42
        self.usable = self.width - 2*self.margin
        self.number = 0

    def start(self, caption, title, bookmark):
        self.number += 1
        self.y = self.height - self.margin
        self.c.bookmarkPage(bookmark)
        self.c.addOutlineEntry(printable(title), bookmark, level=0)
        self.c.setFillColor(TEAL)
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(self.margin, self.y, printable(caption))
        self.y -= 16
        self.paragraph(escaped(title), size=23, leading=27, bold=True, gap=11)

    def paragraph(self, text, size=11.5, leading=15, bold=False, color=TEXT,
                  gap=5, indent=0, width=None):
        style = ParagraphStyle("body", fontName="Helvetica-Bold" if bold else "Helvetica",
            fontSize=size, leading=leading, textColor=color, alignment=TA_LEFT,
            spaceAfter=0, splitLongWords=True)
        p = Paragraph(text, style)
        _, height = p.wrap(width or self.usable-indent, 10000)
        if self.y-height < 48:
            raise ValueError(f"Page {self.number} overflow: {text[:90]}")
        p.drawOn(self.c, self.margin+indent, self.y-height)
        self.y -= height+gap
        return height

    def heading(self, text):
        self.y -= 4
        self.paragraph(escaped(text), size=12, leading=15, bold=True, color=TEAL, gap=5)

    def example(self, title, text):
        style = ParagraphStyle("example", fontName="Helvetica", fontSize=11,
                               leading=14.5, textColor=TEXT)
        body = Paragraph(f"<b>{escaped(title)}</b><br/>{escaped(text)}", style)
        _, height = body.wrap(self.usable-24, 10000)
        box_height = height+24
        if self.y-box_height < 48:
            raise ValueError(f"Example overflows page {self.number}")
        self.c.setFillColor(MINT)
        self.c.roundRect(self.margin,self.y-box_height,self.usable,box_height,6,fill=1,stroke=0)
        body.drawOn(self.c,self.margin+12,self.y-height-12)
        self.y -= box_height+7

    def writing_lines(self, count, spacing=20):
        self.c.setStrokeColor(RULE)
        self.c.setLineWidth(.5)
        for _ in range(count):
            if self.y-spacing < 48:
                raise ValueError(f"Writing space overflows page {self.number}")
            self.y -= spacing
            self.c.line(self.margin,self.y,self.width-self.margin,self.y)
        self.y -= 6

    def finish(self):
        self.c.setStrokeColor(colors.HexColor("#dde3e4"))
        self.c.setLineWidth(.5)
        self.c.line(self.margin,35,self.width-self.margin,35)
        self.c.setFillColor(SECONDARY)
        self.c.setFont("Helvetica",8)
        text = f"Conference Leverage | Editorial {self.snapshot['snapshotVersion']} | Sources checked {self.snapshot['sourceCheckedDate']}"
        self.c.drawString(self.margin,23,text)
        self.c.drawRightString(self.width-self.margin,23,str(self.number))
        self.c.showPage()

    def save(self):
        self.c.save()


def build_workbook(path, size, data):
    pdf = Page(path,size,data,"Conference Leverage - Playbook and Workbook")
    pdf.start("Make the conference yours", "Conference Leverage", "start")
    pdf.paragraph("Playbook + Workbook",size=20,leading=24,color=TEAL,gap=22)
    pdf.paragraph("One worthwhile opportunity.<br/>One realistic alternative.<br/>A useful next move.",
                  size=17,leading=25,gap=26)
    pdf.paragraph("Read the nine guides, use the writing space that helps, and personalize the four message templates. You can use this workbook without an account or a saved plan.",size=12,leading=17,gap=22)
    for stage in ("before","during","after"):
        pdf.heading(data["stages"][stage])
        for i,g in enumerate(data["guides"],2):
            if g["stage"]==stage:
                pdf.paragraph(f"{escaped(g['title'])} <font color='#596469'> - page {i}</font>",size=11,leading=16,gap=3)
    pdf.heading("Templates and your portable plan")
    pdf.paragraph("Funding request - page 11<br/>Pre-conference reach-out - page 12<br/>Same-day follow-up - page 13<br/>Optional LinkedIn recap - page 14<br/>Your blank Field Plan - page 15",size=11,leading=16,gap=16)
    pdf.paragraph("Internal review edition. Examples are fictional; they do not confirm a current role, grant, appointment or event program. Verify the current edition, eligibility, access and timing through official sources.",size=10,leading=14,color=SECONDARY)
    source_finder="https://app.notion.com/p/3f7b144c6b99814aac23eb6f256f0df4"
    pdf.paragraph(f"<link href='{source_finder}' color='#006d68'>Official source finder: {source_finder}</link>",size=9,leading=12,color=SECONDARY)
    pdf.finish()
    for g in data["guides"]:
        pdf.start(data["stages"][g["stage"]],g["title"],g["id"])
        pdf.paragraph(escaped(g["purpose"]),size=11,leading=14,color=SECONDARY,gap=9)
        for i,check in enumerate(g["checks"],1):
            pdf.paragraph(f"<b>{i:02d}  {escaped(check['label'])}</b> {escaped(check['text'])}",gap=5)
        pdf.heading(g["detailsHeading"])
        for i,detail in enumerate(g["details"],1):
            pdf.paragraph(f"{i}. {escaped(detail)}",size=11,leading=14.5,gap=3)
        pdf.y -= 4
        pdf.example("Fictional example - "+g["exampleTitle"],g["example"])
        pdf.heading(g["optionalHeading"])
        pdf.paragraph(escaped(g["optionalBody"]),size=10.5,leading=14,color=SECONDARY,gap=2)
        pdf.writing_lines(2,18)
        pdf.paragraph(f"<link href='{html.escape(g['notionSource'],quote=True)}' color='#006d68'>Editorial source: {escaped(g['notionSource'])}</link>",size=8.5,leading=11,color=SECONDARY,gap=0)
        pdf.finish()
    for key,t in data["templates"].items():
        pdf.start(data["stages"][t["stage"]],t["name"],"template-"+key)
        pdf.paragraph(escaped(t["check"]),size=11,leading=15,color=SECONDARY,gap=16)
        pdf.paragraph("Personalize every bracketed detail truthfully. This is a draft; nothing is sent.",size=10,leading=14,color=TEAL,gap=15)
        for line in t["text"].split("\n"):
            if line:
                pdf.paragraph(escaped(line),size=11,leading=15,gap=3)
            else:
                pdf.y -= 9
        pdf.heading("Your notes or changes")
        available=max(0,int((pdf.y-65)//24))
        pdf.writing_lines(min(available,5),24)
        pdf.finish()
    pdf.start("Take the useful parts with you", "Your blank Field Plan", "blank-plan")
    for label in ["Event / edition / local dates and timezone", "Main goal and conditional attendance decision",
                  "One priority / public source / access status / next action", "Fixed appointment / local time / venue / confirmation",
                  "Realistic alternative / source / next action", "Follow-through / appropriate route / due date", "One insight / action / review date"]:
        pdf.heading(label)
        pdf.writing_lines(2,19)
    pdf.paragraph("Keep private contact details, financial figures, full drafts and token-bearing URLs out of shared copies. The site's personal Field Plan excludes them unless you explicitly opt in. Times and access are self-reported; verify changes.",size=9.5,leading=13,color=SECONDARY)
    pdf.finish()
    pdf.save()
    return pdf.number


def sample_payload():
    result = subprocess.run(["node", str(ROOT/"scripts/sample_plan.cjs")],
                            capture_output=True,text=True,encoding="utf-8",check=True)
    return json.loads(result.stdout)


def build_sample(path, data, sample):
    pdf = Page(path,letter,data,"Conference Leverage - Fictional Field Plan")
    pdf.start("Fictional teaching sample",sample["event"]["name"],"sample-plan")
    event=sample["event"]
    pdf.paragraph(escaped(f"{event['date']} | {event['location']} | {event['timezone']}"),color=SECONDARY,gap=10)
    pdf.paragraph(f"<b>Goal:</b> {escaped(event['goal'])}",gap=12)
    pdf.example("All case details are hypothetical", "Cedar Labs, its role and URL, the meetings, rooms and peer exchange are invented teaching records. No real employer opportunity, invitation or appointment is confirmed.")
    for section in sample["sections"]:
        pdf.heading(section["title"])
        for line in section["lines"]:
            pdf.paragraph(escaped(line),size=11,leading=15,gap=6)
    pdf.heading("What this export leaves out")
    pdf.paragraph("Private contact channels, financial figures, full edited drafts and private/token-bearing URLs are excluded by default. This sample reads only the frozen fictional case; it never reads a person's browser plans.",size=10,leading=14,color=SECONDARY)
    pdf.finish()
    pdf.save()
    return pdf.number


def build_all(output):
    data=load_snapshot()
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    entries=[]
    for name,size in [("conference-playbook-workbook-v5.pdf",letter),
                      ("conference-playbook-workbook-v5-a4.pdf",A4)]:
        count=build_workbook(output/name,size,data)
        entries.append((name,count,size))
    name="conference-playbook-sample-field-plan-v5.pdf"
    count=build_sample(output/name,data,sample_payload())
    entries.append((name,count,letter))
    return data,entries


if __name__ == "__main__":
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument("--output-dir",type=Path,default=ROOT/"output/pdf")
    args=parser.parse_args()
    _,entries=build_all(args.output_dir)
    for name,count,_ in entries: print(f"{name}: {count} pages")
