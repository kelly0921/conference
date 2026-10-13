# Project status — October 12, 2026

This repository starts with a **functional v5 HTML prototype** and a separate editorial reading-style experiment. It is **not** a deployed, finalized or attendee-tested product.

## Three-surface design pass · ready for internal review

- Priorities and Funding now use open numbered advice, worked examples, contextual interactions and inline worksheets shared with the planner.
- My Conference has a clearer suggested next move, less crowded editors, desktop/mobile task navigation and access to every existing planning step.
- User-selected palette: Charcoal & teal, with white surfaces and pale mint examples, applied consistently to the three experiences and shared navigation.
- The frozen v1.3 JSON and embedded snapshot remain unchanged. Styles and renderers are separated into static assets; the v5 storage schema and export pipeline remain in use.
- Before/after desktop and mobile screenshots, a responsive preview, design tokens and QA notes are committed. Local checks: 4 content tests and 16 runtime regression tests pass; actual Chromium layout checks cover three surfaces at six widths. Local reload persistence, keyboard validation, event separation, templates, appointments and default private export behavior were checked in the browser.
- Seven guide bodies and the other legacy screens await a design decision. No broad rollout or production approval is implied.

See [screenshot review](../design/REVIEW.md), [design system](DESIGN_SYSTEM.md) and [current QA/limits](DESIGN_QA.md).

## Implemented in the v5 HTML demo

- Nine Before / During / After guides, backed by a v1.3 editorial freeze.
- Guidance and planning workflows for GHC, SHPE, AFROTECH and custom conferences.
- Personal event-specific plans (browser-local prototype), priorities, access and application distinctions, sample/fixed appointments, four editable message templates, and field-plan print layout.
- Rules-based `Review my plan` gap checker (**not generative AI**).
- Printed sample plans and Letter/A4 workbooks were separately generated in the original v5 review package.

## Remaining work

1. Review the three representative designs, then decide whether to extend the patterns to the remaining guides and screens.
2. Continue validation and modularization of legacy editors as needed **without dropping existing flows**.
3. Make a real publishing pipeline that freezes Notion editorial changes to one versioned JSON and generates both HTML and **Letter/A4 PDFs**. The source export committed here is not automatic Notion sync.
4. Bring the reviewed PDF generation scripts and sample assets into this repository; ensure print parity and no private-data leakage.
5. Extend the completed localhost persistence/keyboard/layout checks to production-origin migration, screen readers, touch/zoom, A4/Letter pagination and cross-browser print behavior.
6. Refresh organizer links and current access facts before any public distribution. Dynamic role/scholarship/meeting availability is not confirmed.
7. Consider live AI only as an **explicit opt-in** plan reviewer after core product quality; currently none.
8. **Last phase:** voluntary attendee feedback only after hosted near-final build and internal QA.

## Development references

- [Notion project](https://app.notion.com/p/3cfb144c6b99815fbe2ffcd62b15813a)
- [Notion canonical editorial source registry](https://app.notion.com/p/3f7b144c6b99816285a3e00b9d81a596)
- [V5 QA notes](V5_QA_NOTES.md)
- [Codex design brief](CODEX_DESIGN_BRIEF.md)
