"""Encode website-size PNG/ICO assets from Kelly's supplied Hi character.

Only size and encoding change; the original artwork and cream background remain.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "assets/brand"


def main():
    with Image.open(ROOT / "assets/characters/kelly-hi.png") as source:
        if source.width != source.height:
            raise ValueError("The character source must be square")
        image = source.convert("RGBA")
    BRAND.mkdir(parents=True, exist_ok=True)
    image.resize((128, 128), Image.Resampling.LANCZOS).save(
        BRAND / "kelly-character-v4.png", optimize=True)
    for size in (16, 32, 48, 180, 192):
        image.resize((size, size), Image.Resampling.LANCZOS).save(
            BRAND / f"favicon-{size}-v4.png", optimize=True)
    image.resize((256, 256), Image.Resampling.LANCZOS).save(BRAND / "favicon-v4.ico", format="ICO",
                   sizes=[(16, 16), (32, 32), (48, 48)])
    (ROOT / "favicon.ico").write_bytes((BRAND / "favicon-v4.ico").read_bytes())
    print("Prepared Kelly character header and browser icons")


if __name__ == "__main__":
    main()
