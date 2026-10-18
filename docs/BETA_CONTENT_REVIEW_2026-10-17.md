# Content improvements for a small beta — October 17, 2026

This pass implements the four content improvements agreed after the beta-readiness review: a short starting path, a complete non-recruiting example, more specific follow-up teaching and broader attendee language. The beta task, invitation text and feedback questionnaire are ready in [the review kit](BETA_REVIEW_KIT.md). No invitations were sent, participant data collected or public release promoted.

## What changed

- The Before landing page introduces a five-minute starting path: name one outcome, choose one real priority with a backup, then read the field plan. Saved plans use the existing decision/priority editors; the panel collapses once a specific outcome and a priority/action/backup are saved. This records notes, not readiness or organizer confirmation. The checklist and all other worksheets remain available.
- A new read-only example at `#/example/learning` follows fictional Leena through a nontechnical community-history gathering: a specific skill, affordable upfront cost, session-description fit, separate workshop access, one primary and a replacement, notes/rest, deliberate no-message follow-up, practice and an imperfect later outcome. The page never inserts example records into the user's plan. Entry links are on the landing page, setup and relevant guides.
- Follow-up templates now have contextual, copyable examples for a promised resource and one answerable question, plus an explanation of when no message is needed. Copying does not replace saved or unfinished drafts. The original same-day structure remains editable, with a reminder to change “today” when appropriate.
- The introduction addresses conference attendees across learning, community, careers and project sharing. The goal “Technical learning” becomes “Learning / skills”; old plans, imported backups and unfinished profile selections retain their learning intent. Learning remains exempt from unrelated recruiting/outreach recommendations. Unknown/custom goal strings are retained.
- The default priority-guide example lens is Learning. One redundant generic disclaimer under worked examples was removed; fictional labels, current-source checks, access distinctions, privacy controls and the application-owned AI access question remain.
- The field-plan exporter now includes a saved specific outcome even when the decision's next-action field is blank. Previously that outcome disappeared behind the next-action condition. The starter path makes that omission consequential, so it is covered by a behavioral regression.

## Editorial scope

The approved v1.3 snapshot and digest remain unchanged, as do all nine guide bodies, four original message structures and three PDF editions. New material is supplemental web teaching, not a silent replacement manuscript or a new freeze. Web/PDF parity assertions continue to cover the original approved content; the workbooks do not yet contain the supplemental learning journey or message examples. No AI prompt, provider schema, validator, model, client bundle or quota was changed, and no new paid model calls were needed for this pass. The earlier frozen evaluation remains historical evidence rather than a new claim of attendee usefulness.

## Verification and limits

Three behavioral checks cover starter-note completion and field-plan output, legacy learning goals/draft restoration, and copying example text without replacing drafts. Existing planner, API and editorial checks are also run. Browser review uses only fictional data on a separate development-deployment origin.

All 170 automated checks pass: 43 planner/runtime, 18 endpoint/privacy/quota, 99 accuracy/evaluator and 10 editorial/pipeline. TypeScript, syntax, reproducible web/PDF artifacts and all 31 PDF pages pass. The Cloudflare SQLite endpoint tests needed normal local process/loopback access after a sandboxed runtime startup failed; with that access all 18 passed. No production setting was changed.

The five-minute wording is a suggested starting investment, not measured completion time. The beta should measure actual time, assistance required, the specificity of a final action, missing content, and storage understanding. Neither a simulated browser walkthrough nor fictional AI cases establish real attendee usefulness. Screen-reader, cross-browser, touch/zoom, browser-print and production-origin recovery checks remain open in the [release QA](PLANNER_RELEASE_QA_2026-10-13.md).
