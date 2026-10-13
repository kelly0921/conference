# Conference Leverage brand assets

Current direction: use Kelly’s supplied waving “Hi” character as the logo. It displays at 44 px inside a home link labeled “Playbook home”, with matching browser icons. KC, CL and bridge files remain archived explorations.

## Current browser icons

- [Header PNG](kelly-character-v4.png), 128 × 128 px, displayed at 44 px.
- Browser PNGs: [16 px](favicon-16-v4.png), [32 px](favicon-32-v4.png), [48 px](favicon-48-v4.png).
- [ICO](favicon-v4.ico), containing 16/32/48 px; copied to repository-root `favicon.ico`.
- [Apple touch icon](favicon-180-v4.png), [192 px icon](favicon-192-v4.png).

The source is the user-supplied `17-hi.png` in `C:/Users/kelly/Downloads/Kelly Icons`, copied unchanged to `assets/characters/kelly-hi.png`. The original character and cream background are preserved. No source-folder or portfolio files were edited.

Run `scripts/prepare_brand.py` with Python and Pillow to regenerate v4 assets. It only resizes and encodes the supplied character; no cropping, redrawing, background removal or image generation is used. No font dependency remains.

The character’s source and usage are documented separately in [character assets](../characters/README.md).

## Archived KC files

The v3 header/favicon SVGs were copied unchanged from the saved portfolio’s `public/assets/kelly-logo.svg` and `public/favicon.svg`. Its source project is `C:/Users/kelly/OneDrive/Documents/Kelly's Portfolio`. The live portfolio was previously checked and uses these KC assets. They and their v3 PNG/ICO fallbacks are no longer referenced by this app, planning concept or brand review.

## Archived CL files

The v2 SVG/PNG/ICO files contain the earlier white CL initials on teal. They are not referenced by the app, planning concept or current brand review.

## Archived bridge files

- [Full transparent website lockup](conference-leverage-logo-v1.png), 696 × 177 px, previously displayed at 232 px wide on desktop and 210 px on phones.
- [Transparent symbol](build-a-bridge-mark-v1.png), 384 px wide.
- Browser PNGs: [16 px](favicon-16-v1.png), [32 px](favicon-32-v1.png), [48 px](favicon-48-v1.png).
- [Multi-size ICO](favicon-v1.ico), with 16/32/48 px entries; previously copied to repository-root `favicon.ico`.
- [Apple touch icon](favicon-180-v1.png), 180 px; [larger icon](favicon-192-v1.png), 192 px.
- Transparent masters: [logo](source/build-a-bridge-logo.png), [symbol](source/build-a-bridge-mark.png).

These older bridge favicons have a white canvas. Versioned filenames distinguish the current character icons from cached older ones.

## Preparation

The **built-in imagegen tool** was used, with the user-selected image as an edit target and `transparent_background: true`. No CLI/API fallback was used. The masters preserve the selected concept, remove the review artboard/annotations, and retain transparent edges. They are saved in this workspace so the site never depends on a generated-image directory outside the project.

The bridge pack was originally made by trimming spare transparent canvas and encoding PNG/ICO outputs. The current preparation script generates only the character assets. The ordinary content build refreshes stylesheet and application versions independently; the editorial freeze and PDF content remain unchanged.

## Imagegen prompt set

Shared prompt:

> Use case: background-extraction.
> Input image: the selected "19 · Build a bridge" logo is the edit target, not a stylistic reference.
> Prepare an asset for actual use on the website. Preserve the selected design faithfully: the two separate circular heads, charcoal left person, deep teal right person, and the distinct teal bridge arch with the white negative-space gap separating it from the shoulders. Do not substitute the continuous bridge or interlocking variants. Keep the exact silhouettes, spacing, proportions and geometry.
> Make the background genuinely transparent (alpha), remove the white artboard and all bottom presentation annotations. No white rectangle, no checkerboard painted into the image, no shadows, no mockup, no new decorative elements. Preserve smooth antialiased edges. Charcoal #252b2e and deep teal #006d68. No gradients or grain. Tightly frame the requested asset with a small safe transparent margin.

Website lockup addition:

> Keep the COMPLETE horizontal logo lockup: the symbol at left and the exact existing two-line wordmark "Conference" / "Leverage" at right. Conference stays charcoal and Leverage stays teal. Preserve the original wordmark lettering, weight, scale relative to the symbol and spacing. Remove ONLY the background and bottom concept label/explanation. Output a wide transparent logo asset containing no other text.

Browser-symbol addition:

> Keep ONLY the symbol of two people and the shared bridge. Remove the wordmark as well as the bottom label and explanation. Preserve the original mark exactly, including its separate bridge arch and thin surrounding negative-space gap. Center the symbol on a transparent square canvas, filling about 88 percent of the width while preserving its original aspect ratio. This will be the basis of the favicon. No lettering of any kind.

## Verification

Asset decoding, ICO entries, alpha, local browser loading, shared header navigation, actual-size icon review, and phone layout checks are recorded in `docs/BRAND_QA.md` after review. The browser automation captures page content, not browser chrome; favicon configuration and the actual asset are verified separately.
