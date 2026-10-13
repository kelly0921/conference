# Branding review — October 13, 2026

## Current direction: Kelly’s character icon

The user clarified that the logo should use her character icon. The header now displays the supplied waving “Hi” character at 44 × 44 px in the existing “Playbook home” link. Matching v4 PNG/ICO files replace the KC favicon links in the app, planning concept and brand review. The root `favicon.ico` also matches v4. The original source remains an unchanged copy of `17-hi.png` from the user’s Kelly Icons folder.

The extra preparation-panel character was subsequently removed at the user’s request, along with its unused layout styles. Browser inspection confirms no images in the main content and the character home icon still loads. Twenty runtime checks, deterministic build verification and whitespace checks pass. Latest capture: [character logo only](../design/screenshots/brand/character-logo-only-desktop.jpg).

Asset verification confirms the header and all five PNG sizes exactly match direct resizes of the original artwork. The ICO contains 16/32/48 px entries. Browser inspection confirms the header loads, all nine images in the native-size review load, the home link works, and desktop/390 px layouts have no horizontal overflow. The small icons were visually reviewed on light/dark surfaces. The deterministic web/PDF build and diff whitespace checks pass. No application logic or editorial content changed in this correction.

Captures: [character desktop](../design/screenshots/brand/character-brand-desktop.jpg), [character phone](../design/screenshots/brand/character-brand-phone.jpg), [character icon sizes](../design/screenshots/brand/character-icons.jpg). Captures show page content; browser-tab configuration and actual icon files are verified separately. Temporary viewport overrides were reset.

## Previous portfolio KC identity (superseded)

The header and favicon now reuse the cream-and-pink KC monogram from [Kelly’s portfolio](https://kellychen.dev/). Live browser inspection confirmed its header source `/assets/kelly-logo.svg` and favicon `/favicon.svg?v=2`. The local source SVGs were copied unchanged; both copies match the saved portfolio byte-for-byte. The header remains a 32 px image inside a 44 × 44 px “Playbook home” link. The supplied `17-hi.png` also matches its original bytes and appears at 72 × 72 px in the Before-stage preparation panel, with decorative alternative text and explicit dimensions.

Current verification:

- All five v3 PNG sizes and the 16/32/48 px ICO entries decode; root `favicon.ico` matches v3. The copied SVGs retain the original serif font stack. PNG/ICO generation uses Georgia on Windows; the font is not bundled.
- Browser inspection confirms the header and character load. The four favicon/touch links reference v3. All nine images in the actual-size icon review load; 16/32/48 px PNGs and the SVG were visually checked on light/dark surfaces.
- The character is absent from During and After. Clicking the icon from My Conference returns to the Playbook. The isolated planning concept also loads the copied KC SVG.
- Desktop and 390/320 px widths have no horizontal overflow. At 390 px navigation sits beside the icon; at 320 px all three navigation links share a row beneath it, using narrower horizontal padding. Viewport overrides were reset.
- Ten Python and twenty Node checks pass, including guide content coverage and planner behavior. The deterministic web/PDF build check passes; the editorial snapshot and PDFs remain unchanged. Diff whitespace checks pass.

Captures: [portfolio desktop](../design/screenshots/brand/portfolio-brand-desktop.jpg), [390 px phone](../design/screenshots/brand/portfolio-brand-phone.jpg), [320 px phone](../design/screenshots/brand/portfolio-brand-phone-320.jpg), [actual-size KC icons](../design/screenshots/brand/portfolio-icons.jpg). Page captures do not include browser chrome; favicon links and actual asset files were verified separately. This is a local preview.

## Previous CL icon-only header (superseded)

The latest instruction removes the visible name/tagline from the header. It now uses the existing CL favicon SVG at 32 px inside a 44 × 44 px link labeled “Playbook home”. The browser icon stays CL. The app, isolated planning concept and brand review use the same home link. Desktop browser inspection confirms the icon loads, the link has no visible text, and the header has no horizontal overflow. At 390 px the icon/navigation share a row; at 320 px the navigation moves below the icon, with no horizontal overflow. Clicking the icon from My Conference returns to the Playbook. Ten Python checks, deterministic build verification and diff whitespace checks pass; application JS is unchanged.

Latest captures: [icon-only desktop](../design/screenshots/brand/icon-header-desktop.jpg), [icon-only phone](../design/screenshots/brand/icon-header-phone.jpg). Temporary viewport overrides were reset.

## Previous text wordmark (superseded)

The user's latest instruction supersedes the bridge selection: remove it and use simple branding. The shared header now has a single-line live-text Conference Leverage wordmark, teal on Leverage, and the existing tagline. The browser icon is a code-native white CL on teal, with SVG, PNG and ICO fallbacks and an Apple touch icon. The root `favicon.ico` now matches v2. The planning concept and current brand review use the same direction. Older bridge images are unused exploration files.

Current checks: the app header contains live text and no image; its primary color is RGB 37/43/46 and Leverage is RGB 0/109/104. Desktop and 390/320 px phone widths have no horizontal overflow. The brand review's eight PNG/SVG samples load and were visually inspected at 16/32/48 px on light/dark backgrounds. SVG parses; five PNG sizes and three ICO entries decode correctly; the root fallback matches v2 bytes. Ten Python and twenty Node checks, deterministic build verification, and diff whitespace checks pass.

Current captures: [desktop](../design/screenshots/brand/simple-desktop.jpg), [phone](../design/screenshots/brand/simple-phone.jpg), [CL icons](../design/screenshots/brand/simple-icons.jpg). No browser chrome screenshot or cross-browser certification is claimed.

## Previous bridge integration (superseded)

The user selected original concept **19 · Build a bridge** and requested it for the site and browser tab icon. Transparent lockup and symbol masters were prepared with the built-in imagegen tool from that exact reference, then saved in `assets/brand/source/`. The asset pack, prompt set and encoding script are documented in [brand assets](../assets/brand/README.md).

## Implemented

- Shared app header uses the full transparent lockup, alternative text, an accessible home link, intrinsic dimensions, and desktop/phone scaling.
- ICO and PNG favicon links plus a 180 px Apple touch icon are in `index.html`; root `favicon.ico` supports automatic legacy lookup.
- Icon PNGs are 16, 32, 48, 180 and 192 px; ICO includes 16/32/48 px. A white icon canvas preserves the charcoal figure against dark tab backgrounds.
- Versioned asset filenames avoid reusing a cached previous icon. `scripts/build.py` refreshed the normal stylesheet version.
- The isolated planning concept uses the same logo/favicon. [Brand review](../design/brand-review.html) displays the actual icon files at native size on light and dark backgrounds.

## Checks

- Transparent website lockup decodes as RGBA, 696 × 177 px; logo and mark contain transparent and opaque pixels.
- All five icon PNGs decode at their expected dimensions and are fully opaque. ICO has the three expected entries; the root fallback matches its bytes.
- Local browser confirms the header image loads at natural width 696 and displays at 232 px on desktop / 210 px on phone. The link is named “Conference Leverage home”. My Conference navigation and logo-to-home navigation work.
- Desktop and 390/320 px phone overrides have no horizontal overflow on the app; all navigation links remain visible. Viewport overrides were reset after checks.
- The isolated planning concept has no horizontal overflow at 320 px and loads the same logo. All seven logo/icon images in the brand review load at their expected dimensions; 16/32/48 px samples were visually checked on light and dark backgrounds.
- Existing ten Python and twenty Node checks pass. Deterministic `scripts/build.py --check` passes for the embedded content, stylesheet versions and three PDFs. No editorial or PDF-content change is part of this update.
- `git diff --check` passes. Git's LF/CRLF notices are informational; content and cache hashes normalize line endings.

## Captures and practical limits

- [Site desktop](../design/screenshots/brand/site-desktop.jpg)
- [Site phone](../design/screenshots/brand/site-phone.jpg)
- [Logo and actual-size icon review](../design/screenshots/brand/logo-and-icons.jpg)

The in-app browser capture exposes page content, not browser chrome. Favicon links and actual image files are verified separately through the icon review and asset decoding; an actual tab-bar screenshot is not claimed. Browser icon refresh timing may vary for an already-open tab. No cross-browser certification, deployment or public release is implied.
