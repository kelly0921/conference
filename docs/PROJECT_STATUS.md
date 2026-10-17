# Project status — October 17, 2026

The previously reviewed v5 site is hosted at https://conference-playbook.pages.dev/. The current planner upgrade is prepared for internal review on the development preview. It is not a finalized or attendee-tested product.

Optional AI planning and review now work on the development preview. The current accuracy layer calculates session comparisons in code, requires confirmed timing inputs and exact supporting quotes, and rejects unsupported results. Verification includes 107 automated checks and the existing 31-page print validation. One recruiting response was rejected during live testing; its retest reached the normal quota. The final evidence-boundary/reference hardening still needs a fresh provider run. See the [current accuracy review](AI_ACCURACY_REVIEW_2026-10-17.md) for evidence and remaining limits. Production AI is disabled. The historical rollout sections below retain their original context and counts.

## Current planner pass

Priorities 1–4 from the product review are implemented: persistent worksheet drafts, valid timezones, a complete conference profile, an integrated actionable checklist, and funding/community/follow-up/debrief details. Browser-local backup/restore and selected-plan deletion are available. The storage key remains compatible with existing v5 plans; records migrate to schema version 6.

Verification now includes 40 Node and 10 Python checks, all 31 PDF pages, tagged-document structure and embedded Unicode fonts. In-app Chromium testing covers fictional profile creation, draft/navigation/reload recovery, timezone validation, checklist skipping and backup restore. The profile and field plan were checked at 320 px; a fictional HTTPS-preview profile also survives reload. Existing character branding and the approved palette/reading layout remain; browser/heading/footer/PDF naming is consistent.

See [planner implementation and release QA](PLANNER_RELEASE_QA_2026-10-13.md). Screen readers, actual zoom/touch, Firefox/Safari, browser/physical printing, formal PDF accessibility and exact production-origin migration/recovery remain manual release checks. The AI preview is documented above; no public feedback campaign has begun.

The sections below preserve evidence from the earlier design rollout and print integration. Their historical test counts and original limitations are superseded where the current planner report records a completed change.

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
- Rebuilt Letter/A4 workbooks and a one-page fictional sample are included and linked. They use the unchanged v1.3 snapshot and actual exporter; the original source ZIP was unavailable locally.
- A repeatable web/PDF build, manifest, CI parity checks and connected Notion revision audit are implemented. Current checks: ten Python and twenty Node tests, all 31 PDF pages, matching browser downloads and deterministic regeneration. See [print/source QA](PRINT_PIPELINE_QA.md).

## Remaining work

1. Review the completed rollout using the localhost app and desktop/phone gallery.
2. Continue validation and modularization of legacy editors as needed **without dropping existing flows**.
3. Use the build/source-review pipeline for future approved freezes. Automated semantic Notion-to-JSON transcription and release governance remain separate work; drift checks do not approve new prose.
4. Complete tagged-PDF accessibility and browser/physical print QA; generated workbook and exporter-based sample parity are now checked.
5. Extend the completed localhost persistence/keyboard/layout checks to production-origin migration, screen readers, touch/zoom, A4/Letter pagination and cross-browser print behavior.
6. Refresh organizer links and current access facts before any public distribution. Dynamic role/scholarship/meeting availability is not confirmed.
7. Complete the optional AI preview's accuracy and public-rollout gates in the current review linked above.
8. **Last phase:** voluntary attendee feedback only after hosted near-final build and internal QA.

## Development references

- [Notion project](https://app.notion.com/p/3cfb144c6b99815fbe2ffcd62b15813a)
- [Notion canonical editorial source registry](https://app.notion.com/p/3f7b144c6b99816285a3e00b9d81a596)
- [V5 QA notes](V5_QA_NOTES.md)
- [Codex design brief](CODEX_DESIGN_BRIEF.md)
