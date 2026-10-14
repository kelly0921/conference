"""Render release PDFs and make contact sheets for visual inspection."""
from pathlib import Path
import argparse
import shutil
import subprocess
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
folder=ROOT/".qa-cache"/"pdf-review"
folder.mkdir(parents=True,exist_ok=True)
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument("--pdftoppm",default=shutil.which("pdftoppm"))
args=parser.parse_args()
bundled=Path.home()/".cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe"
poppler=Path(args.pdftoppm) if args.pdftoppm else bundled
if not poppler.is_file():
    raise SystemExit("Install Poppler or supply its executable with --pdftoppm.")
for pdf in (ROOT/"output/pdf").glob("*.pdf"):
    current=folder/("current-"+pdf.stem)
    current.mkdir(exist_ok=True)
    prefix=current/"page"
    subprocess.run([str(poppler),"-png","-r","90",str(pdf),str(prefix)],check=True,capture_output=True)
    pages=sorted(current.glob("page-*.png"))
    pages.sort(key=lambda p:int(p.stem.split("-")[-1]))
    columns=5 if len(pages)>1 else 1
    rows=(len(pages)+columns-1)//columns
    sheet=Image.new("RGB",(columns*340,rows*468),"#edf0f1")
    draw=ImageDraw.Draw(sheet)
    for i,path in enumerate(pages):
        image=Image.open(path).convert("RGB")
        image.thumbnail((320,430))
        x=(i%columns)*340+10; y=(i//columns)*468+24
        sheet.paste(image,(x,y))
        draw.text((x,y-17),f"Page {i+1}",fill="#252b2e")
    output=folder/(pdf.stem+"-contact.jpg")
    sheet.save(output,quality=95)
    print(output)
