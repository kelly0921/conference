# Design rollout QA · October 13, 2026

This records the earlier reading-design rollout. See [the later planner/release QA](PLANNER_RELEASE_QA_2026-10-13.md) for completed draft recovery, currency/profile support, checklist integration, worksheet coverage and PDF structure. The remaining manual accessibility/cross-browser/print checks still apply. Historical counts below describe that earlier pass.

Internal review only. No deployment, merge, external attendee testing or outreach.

## Automated results

The design rollout initially passed 22 checks. The subsequent print/source phase passes 30: ten Python content/pipeline checks and twenty Node runtime checks. JavaScript syntax checks pass. CI also verifies regeneration and PDF contents/layout; see [print/source QA](PRINT_PIPELINE_QA.md).

```sh
python -m unittest discover -s tests -v
node --check assets/app.js
node --check assets/representative.js
node --check design/palette-review.js
node --test tests/runtime.test.cjs
```

The Node suite exercises retained calculations, all nine rendered guides, all four templates, Field Plan, unique IDs and labeled form controls, separate event storage and unsaved guide drafts, goal-specific access fields, date-window/editor reachability, default privacy exclusions and explicit event-specific opt-ins, appointment export, fixed-versus-pending validation, template persistence, blocked storage, and print disclosure restoration. New checks verify approved optional-guide text and the conversations prompt, correct planner destinations, and the Field Plan renderer's excluded-by-default drafts and four privacy choices.

These are regression checks with a small DOM/storage harness, not a real browser or assistive-technology suite. The historical 120-check report in `V5_QA_NOTES.md` describes the original prototype and has not been rerun as a 120-check suite here.

## Real-browser checks

The site ran on `http://127.0.0.1:4173` in the Codex in-app Chromium browser. The original rendering was also inspected; an isolated server at port 4174 was used to recapture a correct empty-plan mobile baseline. Browser screenshots are actual rendered views, not mockups.

The initial three-experience pass verified these behaviors through the visible UI:

- Priority: goal-lens selection and explanation updates; Enter activation; detailed instructions toggle with Enter; empty-submit error and focus; saving a target with public source/action/backup; persistence after a real localhost reload; removal of the temporary test target.
- Funding: USD 1,200 total / USD 800 final / USD 1,200 upfront with USD 400 later reimbursement; changing pending funding to USD 950 does not reduce either cost; USD 200 direct coverage gives USD 600 final / USD 1,000 upfront; pending label updates; negative input is rejected and focused; saved values survive reload.
- My Conference: custom fictional plan, conference switching, separate field-plan records, builder goal removes recruiter-only profile/application fields, a budget editor remains reachable outside its suggested date window, and the next-step button focuses the editor.
- Scheduling: a Requested activity cannot be saved as fixed. A user-confirmed fictional appointment retains date, start/end, IANA timezone, venue and buffer in the field-plan renderer.
- Privacy/templates: token-bearing source is hidden by default and visible only after explicit opt-in; resetting the preference hides it again. Edited template survives reload in its own event; GHC export excludes the separate QA appointment and template.
- Keyboard: goal chips, disclosures, validation focus and Skip to content work; Skip does not disrupt the guide route.

The fictional QA data is used only to exercise local planning; it is not a current role, grant or appointment and nothing was sent.

The full rollout additionally verified through the visible UI:

- A pre-conference draft in the clearly labeled fictional QA event changes from Unsaved changes to Saved in this browser, survives a full app reload, and stays separate from GHC's draft.
- Field Plan initially has all four privacy choices unchecked and excludes the edited message. Explicitly including full edited drafts makes it visible; unchecking and reloading excludes it again.
- The long Save to event label wraps without horizontal overflow at an actual 320 px viewport.
- The Learning guide's optional tool opens the existing Apply one lesson editor in My Conference.

GHC was restored as the selected event after testing. The labeled fictional QA event remains browser-local. The copy handlers retain regression coverage; no new clipboard or message send action was performed during this rollout.

## Visual review and refinements

The initial pass reviewed Priorities, Funding and My Conference at desktop and mobile, with matched top views and additional example, worksheet and editor captures. See [the initial screenshot review](../design/REVIEW.md).

The user selected **Charcoal & teal** (option 01) after live color comparison, then authorized extending it across the remaining guides and tools. White surfaces, charcoal text, teal accents and pale mint examples now apply throughout the app. The ten initial after/detail captures remain in `design/screenshots/selected/`; the initial 18-layout results remain in `design/viewport-checks.json`. The palette comparison remains a separate review tool and defaults to the selected option.

The rollout has 22 after captures covering seven newly styled guides, Templates, Field Plan, the reading library and Downloads, using 1,440 × 1,000 and 390 × 844 px viewports. Phone rasters are 843–844 px tall. Six matched before captures for Worth, Templates and Field Plan use commit `051f10f`, after the palette selection and before the rollout. See [the full gallery and notes](../design/ROLLOUT_REVIEW.md).

The repeatable responsive preview runs the actual app in a same-origin frame at 320, 390, 768, 800, 1,024 and 1,440 px. All **114 route/width combinations** (19 routes × six widths) had no horizontal overflow or duplicate element IDs. The routes cover all nine guides, My Conference, three library stages, four templates, Field Plan and Downloads. Expected headings and template selections were checked; dimensions, font, accent and results are recorded in `design/rollout-viewport-checks.json`. This verifies CSS layout in Chromium; it does not emulate a phone's OS, touch input or browser UI.

Browser review caught and corrected a pending-funding input/output ID collision, a planner task disclosure that could stay hidden after changing from mobile to desktop, and wrapping phase labels. Shared control sizing and validation states were refined during this pass. The final pending label has its own ID, and the resize listener changes the task disclosure without discarding unsaved fields.

Rollout review moved template actions above the long draft so Save and Copy are visible without scrolling past the editor. The library's stage bar was simplified to a quiet separator and selected teal state. Conversations now labels its shortcut “Copyable prompt.” Content-hashed asset URLs ensure a fresh app load uses the reviewed renderer and styles.

## Accessibility and verification limits

Labels, landmarks, native disclosures, selected/current states, live status feedback, contrast tokens, focus behavior, responsive layout and reduced-motion rules were reviewed. This is **not** a WCAG conformance claim or full accessibility audit.

Selected Charcoal & teal token contrast: charcoal on white 14.35:1, secondary text on white 6.08:1, white on the primary teal 6.20:1, secondary text on the worksheet wash 5.53:1, and secondary text on the mint example panels 5.35:1. Control boundaries are 3.50:1 against white and use a dedicated token rather than the decorative separator color.

- No NVDA, JAWS or VoiceOver session was performed; screen-reader announcements and the long live totals region still need real testing.
- No Firefox/Safari, OS touch/zoom, high-contrast-mode or cross-browser print test was performed.
- Guide print instructions and privacy/export behavior have regression coverage. Rebuilt Letter/A4 workbooks and a one-page exporter-based sample are included; all 31 generated PDF pages have text/geometry and visual checks. Browser Print dialogs and cross-browser personal-plan pagination remain unverified. See [print/source QA](PRINT_PIPELINE_QA.md).
- Real localhost storage/reload was verified in this Chromium session. Persistence, migration and storage restrictions must still be checked on an eventual production origin.
- The instrumented frame session logged `MutationObserver.observe` errors without source stacks. Repository scripts do not use MutationObserver; browser instrumentation is a likely source, but this was not conclusively attributed. This session is not evidence of a completely clean console. Confirm that in an uninstrumented browser before release.

## What still prevents production quality

1. Complete tagged-PDF accessibility and browser/physical print testing. Download links now resolve to generated artifacts, with snapshot-to-web/PDF parity verified.
2. Complete screen-reader, zoom, keyboard, touch and cross-browser print QA, including long user-entered URLs/drafts and both paper sizes.
3. The v1.3 snapshot is a reviewed manual freeze. Connected-source drift checks are now available; semantic reconciliation of future edits and release governance remain manual. Organizer availability needs a launch-time freshness check.
4. Local-only storage has no cloud recovery. Currency remains USD; the numeric budget is a simplified estimate without a per-expense due-date/payment calendar.
5. Original editors still need broader validation, schema/migration and privacy/threat review before a public release. Unsaved work is indicated but there is no route-change draft recovery for every legacy editor.

The approved design rollout is ready for internal product review. These results do not certify release readiness.
