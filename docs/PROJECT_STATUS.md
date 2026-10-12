# Project status — October 12, 2026

This repository starts with a **functional v5 HTML prototype** and a separate editorial reading-style experiment. It is **not** a deployed, finalized or attendee-tested product.

## Implemented in the v5 HTML demo

- Nine Before / During / After guides, backed by a v1.3 editorial freeze.
- Guidance and planning workflows for GHC, SHPE, AFROTECH and custom conferences.
- Personal event-specific plans (browser-local prototype), priorities, access and application distinctions, sample/fixed appointments, four editable message templates, and field-plan print layout.
- Rules-based `Review my plan` gap checker (**not generative AI**).
- Printed sample plans and Letter/A4 workbooks were separately generated in the original v5 review package.

## Remaining work

1. Convert the single-file app into maintainable components **without dropping existing flows**.
2. Implement the approved warm, interactive editorial design across representative pages before broad rollout.
3. Make a real publishing pipeline that freezes Notion editorial changes to one versioned JSON and generates both HTML and **Letter/A4 PDFs**. The source export committed here is not automatic Notion sync.
4. Bring the reviewed PDF generation scripts and sample assets into this repository; ensure print parity and no private-data leakage.
5. Test real browser-origin storage on reload and migration, plus keyboard, screen-reader, responsive, A4/Letter and cross-browser print behavior.
6. Refresh organizer links and current access facts before any public distribution. Dynamic role/scholarship/meeting availability is not confirmed.
7. Consider live AI only as an **explicit opt-in** plan reviewer after core product quality; currently none.
8. **Last phase:** voluntary attendee feedback only after hosted near-final build and internal QA.

## Development references

- [Notion project](https://app.notion.com/p/3cfb144c6b99815fbe2ffcd62b15813a)
- [Notion canonical editorial source registry](https://app.notion.com/p/3f7b144c6b99816285a3e00b9d81a596)
- [V5 QA notes](V5_QA_NOTES.md)
- [Codex design brief](CODEX_DESIGN_BRIEF.md)
