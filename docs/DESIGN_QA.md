# Three-surface design QA · October 12, 2026

Internal review only. No deployment, merge, external attendee testing or outreach.

## Automated results

20 checks pass locally: 4 existing Python snapshot/content checks and 16 Node regression checks. JavaScript syntax checks also pass. The workflow now runs both suites.

```sh
python -m unittest discover -s tests -v
node --check assets/app.js
node --check assets/representative.js
node --test tests/runtime.test.cjs
```

The Node suite exercises retained calculations, all nine rendered guides, unique IDs and labeled form controls in representative markup, separate event storage and unsaved guide drafts, goal-specific access fields, date-window/editor reachability, default privacy exclusions and explicit event-specific opt-ins, appointment export, fixed-versus-pending validation, template persistence, blocked storage, and print disclosure restoration.

These are regression checks with a small DOM/storage harness, not a real browser or assistive-technology suite. The historical 120-check report in `V5_QA_NOTES.md` describes the original prototype and has not been rerun as a 120-check suite here.

## Real-browser checks

The site ran on `http://127.0.0.1:4173` in the Codex in-app Chromium browser. The original rendering was also inspected; an isolated server at port 4174 was used to recapture a correct empty-plan mobile baseline. Browser screenshots are actual rendered views, not mockups.

Verified through the visible UI:

- Priority: goal-lens selection and explanation updates; Enter activation; detailed instructions toggle with Enter; empty-submit error and focus; saving a target with public source/action/backup; persistence after a real localhost reload; removal of the temporary test target.
- Funding: USD 1,200 total / USD 800 final / USD 1,200 upfront with USD 400 later reimbursement; changing pending funding to USD 950 does not reduce either cost; USD 200 direct coverage gives USD 600 final / USD 1,000 upfront; pending label updates; negative input is rejected and focused; saved values survive reload.
- My Conference: custom fictional plan, conference switching, separate field-plan records, builder goal removes recruiter-only profile/application fields, a budget editor remains reachable outside its suggested date window, and the next-step button focuses the editor.
- Scheduling: a Requested activity cannot be saved as fixed. A user-confirmed fictional appointment retains date, start/end, IANA timezone, venue and buffer in the field-plan renderer.
- Privacy/templates: token-bearing source is hidden by default and visible only after explicit opt-in; resetting the preference hides it again. Edited template survives reload in its own event; GHC export excludes the separate QA appointment and template.
- Keyboard: goal chips, disclosures, validation focus and Skip to content work; Skip does not disrupt the guide route.

The fictional QA data is used only to exercise local planning; it is not a current role, grant or appointment and nothing was sent.

## Visual review and refinements

Reviewed Priorities, Funding and My Conference at desktop and mobile. The screenshot set includes matched before/after top views and additional example, worksheet and editor views. See [the screenshot review](../design/REVIEW.md).

The repeatable responsive preview runs the actual app in a same-origin frame at 320, 390, 768, 800, 1,024 and 1,440 px. All 18 surface/width combinations had no horizontal overflow and no duplicate element IDs. This verifies CSS layout in Chromium; it does not emulate a phone's OS, touch input or browser UI.

Browser review caught and corrected a pending-funding input/output ID collision, a planner task disclosure that could stay hidden after changing from mobile to desktop, and wrapping phase labels. Shared control sizing and validation states were refined during this pass. The final pending label has its own ID, and the resize listener changes the task disclosure without discarding unsaved fields.

## Accessibility and verification limits

Labels, landmarks, native disclosures, selected/current states, live status feedback, contrast tokens, focus behavior, responsive layout and reduced-motion rules were reviewed. This is **not** a WCAG conformance claim or full accessibility audit.

Measured token contrast: text on paper 11.11:1, secondary text on paper 5.62:1, white on the primary blue 7.59:1, terracotta on paper 5.67:1, and secondary text on the worksheet wash 5.20:1. Control borders use a darker dedicated token rather than the decorative separator color.

- No NVDA, JAWS or VoiceOver session was performed; screen-reader announcements and the long live totals region still need real testing.
- No Firefox/Safari, OS touch/zoom, high-contrast-mode or cross-browser print test was performed.
- Guide print instructions and privacy/export behavior have regression coverage. Actual Letter/A4 pagination, font rendering and browser Print / Save as PDF dialogs have not been visually certified in this pass. The original workbook PDFs and generation scripts are not present in the repository.
- Real localhost storage/reload was verified in this Chromium session. Persistence, migration and storage restrictions must still be checked on an eventual production origin.
- The instrumented frame session logged `MutationObserver.observe` errors without source stacks. Repository scripts do not use MutationObserver; browser instrumentation is a likely source, but this was not conclusively attributed. This session is not evidence of a completely clean console. Confirm that in an uninstrumented browser before release.

## What still prevents production quality

1. Seven guides, Templates/Downloads and the personal field-plan screen retain legacy body styling; the shared header is new. This is intentionally a three-surface review, not a complete product rollout.
2. Download links to the original workbook and sample PDFs still refer to missing assets. Import the reviewed source package and establish snapshot-to-web/PDF parity before release.
3. Complete screen-reader, zoom, keyboard, touch and cross-browser print QA, including long user-entered URLs/drafts and both paper sizes.
4. The v1.3 snapshot is a reviewed manual freeze. Notion export/release governance remains unimplemented. Organizer data and current availability need a separate launch-time freshness check.
5. Local-only storage has no cloud recovery. Currency remains USD; the numeric budget is a simplified estimate without a per-expense due-date/payment calendar.
6. Original editors still need broader validation, schema/migration and privacy/threat review before a public release. Unsaved work is indicated but there is no route-change draft recovery for every legacy editor.

The design direction is ready for internal product review. Extension across the remaining guides should wait for that review.
