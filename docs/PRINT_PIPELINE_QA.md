# Print, source and accessibility checks - October 13, 2026

This records the earlier print integration. The [subsequent planner/release pass](PLANNER_RELEASE_QA_2026-10-13.md) adds PDF tags, logical order, language, tagged links and embedded Unicode fonts; its rebuilt editions retain all 31 pages and approved content. The original untagged/Helvetica limitation below describes the earlier artifacts. Actual PDF assistive-technology and browser/physical printing checks remain open.

## Automated verification

30 checks pass: ten Python content/pipeline tests and twenty Node runtime tests. Byte-for-byte artifact regeneration also passes. PDF validation covers all 31 pages: 15 Letter, 15 A4 and the one-page fictional sample.

Each workbook contains every approved check, detailed instruction, example, optional-tool text and template. Geometry checks found no out-of-page characters, incorrect dimensions or replacement-square glyphs. Metadata identifies the source digest/version; all fifteen workbook pages have bookmarks. Sample sections match the actual exporter, retaining invented role/source IDs, local dates/times, timezone and venue while excluding private channel/budget/draft sections.

The connected-source audit fetched fourteen Notion pages. Four templates match exactly; guides remain the approved structured transcription. The source lock records body hashes/revisions. Incomplete exports fail and later changes are reported; this does not approve new prose or overwrite the freeze.

## Visual and browser evidence

All pages were rendered with bundled Poppler. Both edition contact sheets and individual dense funding, template, blank-plan and sample pages were inspected. Text, writing lines, source URLs, headers, separators and page numbers remain readable within margins. Detailed instructions use 11 pt text; primary guide text uses 11.5 pt. Supporting/source labels are smaller.

The browser downloaded all three files from the actual Downloads links; their SHA256 values match the generated artifacts. Enter on Skip to content focuses `main` and preserves the Downloads route. Downloads now uses h1/h2 sections and hides decorative PDF/MY marks from assistive technology. The library uses a stage h2 and guide h3 titles. Tests prevent repeated identical Unsaved changes status writes while typing.

Native browser review confirmed the library's h1/h2/h3 hierarchy and no desktop overflow. Downloads was also checked at 320 px with no horizontal overflow. [Download page capture](../design/screenshots/print/downloads-desktop.jpg), [Letter overview](../design/screenshots/print/letter-overview.png), [A4 overview](../design/screenshots/print/a4-overview.png) and [fictional sample](../design/screenshots/print/fictional-sample.png) preserve visual evidence.

CSS review found that personal prints forced Letter. `@page` now uses `size: auto`. Existing wrapping/section-flow rules remain, along with regression checks for private defaults/opt-ins, expanded guide instructions and disclosure restoration after printing.

Poppler emitted missing display-font configuration warnings for Symbol/ArialUnicode. The PDFs use standard Helvetica; rendered pages and text checks found no missing glyphs. Every viewer/printer is not thereby certified.

## Remaining limits

- No NVDA, JAWS or VoiceOver session; native keyboard/semantic checks are not a full accessibility audit.
- PDFs contain selectable text/bookmarks but are untagged; PDF/UA or WCAG conformance is not claimed.
- Generated workbook sizes/pagination are verified. Browser Print/Save as PDF dialogs, very long opted-in personal drafts, physical printers and Firefox/Safari printing still need testing.
- Semantic reconciliation of Notion edits still requires a reviewed freeze; no scheduled sync or public publishing is configured.
- Production-origin storage/migration, security/privacy review and organizer freshness remain launch work.

The historical 120-check v5 report was not rerun as a 120-check suite. This phase adds the specific evidence above to the prior design rollout checks.
