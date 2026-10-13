# Project status — October 13, 2026

This repository starts with a **functional v5 HTML prototype** and a separate editorial reading-style experiment. It is **not** a deployed, finalized or attendee-tested product.

## Approved design rollout · ready for internal review

- Priorities and Funding now use open numbered advice, worked examples, contextual interactions and inline worksheets shared with the planner.
- My Conference has a clearer suggested next move, less crowded editors, desktop/mobile task navigation and access to every existing planning step.
- User-selected palette: Charcoal & teal, with white surfaces and pale mint examples, now applied across all nine guides, the reading library, Templates, Field Plan and shared screens.
- The remaining seven guides use the same numbered advice and reading rail, with their approved examples, detailed instructions and optional planner links or copyable prompt. Templates have a compact navigation rail and visible local save status; Field Plan has readable sections and explicit privacy controls.
- The frozen v1.3 JSON and embedded snapshot remain unchanged. Styles and renderers are separated into static assets; the v5 storage schema and export pipeline remain in use.
- Desktop and phone captures cover eleven rollout views, with matched before/after pairs for a guide, Templates and Field Plan. Local checks: 4 content tests and 18 runtime regression tests pass; Chromium layout checks cover 19 routes at six widths (114 combinations). Template reload persistence, event separation, private draft opt-in/reset and a long save label at 320 px were checked through the UI. Earlier checks for the initial three experiences remain documented separately.

See [full rollout review](../design/ROLLOUT_REVIEW.md), [initial screenshot review](../design/REVIEW.md), [design system](DESIGN_SYSTEM.md) and [current QA/limits](DESIGN_QA.md).

## Implemented in the v5 HTML demo

- Nine Before / During / After guides, backed by a v1.3 editorial freeze.
- Guidance and planning workflows for GHC, SHPE, AFROTECH and custom conferences.
- Personal event-specific plans (browser-local prototype), priorities, access and application distinctions, sample/fixed appointments, four editable message templates, and field-plan print layout.
- Rules-based `Review my plan` gap checker (**not generative AI**).
- Printed sample plans and Letter/A4 workbooks were separately generated in the original v5 review package.

## Remaining work

1. Review the completed rollout using the localhost app and desktop/phone gallery.
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
