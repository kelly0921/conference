# Conference Leverage — content and design review

Reviewed October 13, 2026 against repository baseline `7ebd58b`, the approved editorial v1.3 snapshot, the original design reference, and the connected product proposals. This is an internal product review. The accompanying concept does not alter the application, saved plans, approved content, or PDFs.

## Latest readiness recheck — after character branding

**Verdict: ready for internal review; not ready to launch the complete conference-planning product.** The approved reading design and editorial coverage are substantially complete. The main remaining work is reliability and the advice-to-action planning flow. AI is an optional later feature, not a prerequisite for the first release.

This recheck reran ten Python and twenty Node checks, JavaScript syntax checks, deterministic web/PDF regeneration, and validation of all 31 PDF pages. All pass. Fresh browser review used a clearly fictional event on `http://localhost:4173`, a different storage origin from the user's `http://127.0.0.1:4173` plans. It covered custom setup, goal selection, learning save/reload, switching worksheets, scheduling, the field-plan export, template actions, Downloads, and phone reading. No application code, frozen guide content, live AI integration, deployment or external message was changed during this review.

### Confirmed issues to fix

| Priority | Finding | Evidence and intended behavior |
| --- | --- | --- |
| P1 | Unsaved legacy worksheet text is discarded when switching steps | Saved a fictional lesson, typed a replacement without saving, opened another worksheet, then returned. The replacement disappeared with no navigation warning; the earlier saved lesson returned. Retain an event-specific draft or offer Save / Discard / Stay before destroying it. Apply consistently to worksheet, phase, goal, event and route changes. |
| P1 | Invalid IANA timezones are accepted and exported | A fictional fixed appointment with `not/a-zone`, entered times, a venue and user-reported confirmed status saved without error. The invalid zone became the event timezone and appeared in the Field Plan. Validate timezone identifiers before saving; reject invalid zones with a field-specific message. Check dates, time ranges and buffers alongside this work. |

The tentative concern that saved learning reopened blank did **not** reproduce: saved lesson, use and action survived a full browser reload and appeared correctly in the Field Plan. It is not counted as a defect.

The invalid fictional appointment was removed through the UI after capture. The labeled QA event/lesson remains only in the separate localhost review origin; the user's 127.0.0.1 plans were not modified. Evidence: [invalid timezone in the field plan](../design/screenshots/brand/readiness-invalid-timezone.jpg).

### Product work still missing

| Area | Current state | Recommended completion |
| --- | --- | --- |
| Any-conference setup | Custom plans work, but capture only name/start date; end defaults to start, location/timezone are blank, USD is assumed, and no organizer URL/format is saved. Presets dominate setup. | Make Add your conference primary. Support an editable name, start/end dates, valid timezone, location or online format, official website and currency. Keep the three examples optional. Preserve IDs and existing records during migration. |
| Actionable checklist | Native checkboxes and four phase tabs exist, but rows mostly open worksheets. There is no applicable-progress count or task-level Not needed state. Task filtering uses date/phase; the goal-derived recruiting variable is unused. | Integrate the isolated checklist concept with real saved plans: outcome-led actions, progress, Not needed, guide links and goal/format relevance. Keep all other actions reachable and distinguish preparation from organizer confirmation. |
| Funding record | Arithmetic correctly separates pending funding, later reimbursement and upfront cash; the editor only stores totals. | Add funding source/link, covered expense, edition, deadline, status, payment method and reimbursement date as requested by the authored worksheet. |
| Learning/community | Activity editor stores name, access, next action and backup; details can be entered separately in the schedule. | Connect purpose, official source, local time/venue and useful question to the same activity record, rather than duplicate unrelated trackers. |
| Follow-up/debrief | Commitments have context, action, channel, due date and a done flag. Debrief stores insight/use/action. | Add action-versus-response status, review date, observed outcome and the ability to deliberately take no further action. |
| Local-data controls | Saves are browser-local, with clear notices and private-by-default printing. There is no v5 backup/restore or plan-deletion UI. | Add intentional plan deletion and an explicit backup/restore flow. Explain origin/browser dependence. Cloud accounts/sync can remain later work. |

The checklist and AI controls shown at `design/planning-concept.html` are still isolated demonstrations. They do not update the application's saved records. Do not count them as shipped features.

### Content and design

- All nine approved guides and all four template families are present. Web/PDF parity and the approved digest pass. The fresh canonical-registry fetch retains the locked October 12 revision; a full fresh fourteen-page drift audit was not repeated in this recheck.
- The open reading layout, numbered advice, worked examples, optional deeper instructions and charcoal/teal system are coherent. The [Panther reference](https://panther-hub.org/resources/ghc-guide) also provides an explicit preparation checklist; that remains the largest useful interaction gap. Its dated application availability is not a current fact to copy into this product.
- Keep the approved visual direction. Minor polish: use a consistent public name across the page heading, browser title and footer; add a short author/local-data explanation; consider a face-focused version of the same character for better 16 px favicon recognition. A further logo/color exploration is not the highest priority.
- Official preset dates/cities match today's checked primary pages: [GHC](https://ghc.anitab.org/) October 27–30, Anaheim; [SHPE 2026](https://shpe.org/2026/) October 28–31, Indianapolis; [AFROTECH](https://afrotechconference.com/) November 2–6, Houston. This does not verify personal access, live roles, scholarships or invitations. SHPE's source pack currently links Career Services only; add the edition-specific convention/registration page.

### Release checks still open

Complete real screen-reader, keyboard/focus, touch/zoom and Firefox/Safari checks. Generated PDFs validate, but accessible PDF tagging and browser/physical Letter/A4 print pagination remain unverified. Repeat production-origin storage/migration and source freshness checks after selecting the release domain. Prepare clear local-data/privacy controls, resolve the two confirmed issues, and include current local branding/assets in the reviewed PR/release. The latest branding and review files are still local modifications/untracked files.

AI currently means a fixed-rule gap checker, explicitly labeled non-AI. A later opt-in review could refine priorities/questions or a selected draft; it needs server-side credentials, a preview of shared fields, accept/edit/dismiss controls, limits, error handling and a non-AI fallback. It should not silently complete tasks, assert access, or become necessary for ordinary planning.

Recommended next implementation: fix the two reliability issues, then complete the universal profile and integrate the checklist with the existing data model. Close the worksheet gaps, finish release QA, and consider optional AI afterward.

## Assessment

The reader-first site now covers the approved nine-guide / four-template scope, with shared planning tools, a field plan, and Letter/A4 workbooks. The charcoal-and-teal typography and open reading layout are consistent with the approved direction. The next useful improvement is the transition from advice to a specific, usable plan: a stronger checklist, a complete custom-conference profile, and forms that can retain everything the guide asks readers to record.

This is not equivalent to completing every earlier roadmap idea or validating a public release. Live AI, general-purpose event research, advanced role workflows, tagged PDFs, screen-reader testing, and cross-browser/physical print checks remain separate work.

## References and interpretation

- [Panther GHC Guide](https://panther-hub.org/resources/ghc-guide): original visual/reading reference, inspected live. It includes an interactive “Before you hit submit...” checklist as well as numbered advice and reflective tools. Borrow the actionable checklist pattern; use Conference Leverage's own content and approved palette. Its scholarship-specific requirements and dates are not our planning rules.
- [Canonical v1.3 editorial registry](https://app.notion.com/p/3f7b144c6b99816285a3e00b9d81a596): source of the frozen nine guides and four templates. The repository snapshot is a reviewed structured transcription, not a raw Notion copy.
- [Integrated Experience & Printable Editions v1](https://app.notion.com/p/3f7b144c6b99811eadeedee686382d7b): proposal for a stage-first reader, one shared event-specific record, date-aware checklist, templates, and print outputs. Its original “not implemented” status is historical; current implementation was checked separately.
- [PDF Template Recovery, Content Gaps & AI Audit](https://app.notion.com/p/3f7b144c6b9981f4877fc35624506ce1): distinguishes verified Lite Kit material from future/full-kit ideas; proposes an optional bounded plan review rather than AI as primary navigation.

## Coverage

| Area | Current coverage | Remaining product gap |
| --- | --- | --- |
| Before | Decision, funding, registrations/access, priorities; all approved checks, details and examples | Checklist outcomes are less prominent than worksheet navigation; funding source/deadline/payment/reimbursement dates cannot be fully recorded |
| During | Time and fixed/flexible commitments, conversations, learning/community | Learning/community editor is thinner than its guide: no source, local time/venue, or purpose field of its own |
| After | Follow-up, learning/debrief, editable follow-up and optional recap templates | Follow-up has a done flag but no separate sent/response status; learning lacks review date and actual outcome |
| Templates | Four approved editable structures, local saves, copy, relevant entry points | More filled examples and story-to-question cues would improve teaching; a full question bank was not part of the verified freeze |
| Outputs | Consolidated personal field plan, private export choices, per-guide print, 15-page Letter and A4 workbooks, fictional one-page sample | PDF accessibility and cross-browser/physical print checks remain open |
| Any conference | Separate custom plans already work with the same guides and exporters | Custom setup only captures name/start date, sets end equal to start, leaves location/timezone blank, and assumes USD; no saved custom organizer URL |
| Personalization | Date-window recommendations; recruiting fields partly respond to the selected goal | Task selection itself is date-based; the declared goal variable is unused by `taskFilter`; format and role are not modeled |
| AI | Explicitly labeled fixed-rule `Review my plan` checker | No language model, service, consent flow, or AI suggestion controls exist |

The content gaps above are mainly **worksheet gaps**, not missing approved guide prose. Some activity metadata can be entered separately in the schedule, but it is not connected back to the learning/community record. Changes should extend the shared data model and exporter rather than create duplicate trackers.

## Design review

Keep the approved palette, readable typography, numbered guide sections, worked examples, optional details, and reading without setup. The current site successfully separates browsing from creating a private plan.

The planner already has native completion checkboxes, but they sit beside buttons that switch the adjacent editor. This emphasizes “which worksheet do I open?” over “what have I prepared?” A checklist should have:

- Outcome-led rows, a generous check target, one concise explanation, and an explicit relevant guide/worksheet link.
- Before / final week / at event / after groupings and a visible count of applicable completed actions.
- A manual “Not needed” option that does not erase entered work; unknown access remains unknown.
- Optional detail rather than requiring all forms to stay visible.
- Clear separation of user-marked preparation from registration, funding, or invitation confirmation.

Checklist progress must not become a universal readiness score or imply guaranteed admission. Organizer deadlines override suggested preparation windows. All tasks remain reachable when dates/goals change.

## Conference-agnostic planning

Make “Add your conference” the primary setup. Keep GHC, SHPE and AFROTECH as optional example/preset source packs, with edition and verification dates. They should not determine the planner's data model.

Minimum profile: event name, start/end dates, event timezone, location or online format, official website, currency, and main goal. Store a stable plan ID independent of display name; allow multiple editions/plans without merging them. Treat custom organizer details as user-provided until verified.

Task applicability should use phase, days until start and until end, goal, and format. Examples: online events need access links and timezone checks; recruiting adds role/application preparation; learning emphasizes sessions/questions; a multi-day event stays “at event” through its end date. Offer overrides instead of hiding all other tasks. Maintain explicit organizer deadlines separately from generic preparation timing.

Start with a conference-agnostic **attendee** planner. Speaker, exhibitor and organizer workflows need their own authored task sets; they are not covered by simply renaming an attendee plan.

Migration must preserve existing IDs, dates, user-reported statuses, drafts, and print preferences. Unknown new fields remain blank. Date and timezone validation, currency formatting, plan separation, persistence, and print/export parity need focused regression checks when implementation is authorized.

## Feasible AI addition

Recommended first feature: an optional “Check my plan” inside My Conference, after a reader has written a priority. It could identify vague actions, suggest a more answerable question, surface a missing fallback, and explain why a suggestion fits the authored guide. A second small feature could refine one selected message draft using only supplied facts.

The review should use selected user inputs, the authored guides, and explicitly supplied/verified dated sources. Return up to three suggestions with accept/edit/dismiss controls. Distinguish supplied facts, guide-derived advice, and details needing official verification. It cannot infer an invitation, live opportunity, reimbursement, or personal relationship from optimistic wording.

Actual integration needs a server-side service with protected credentials, a precise preview of the fields being shared, an intentional user action, cost/rate limits, error handling, and a working non-AI fallback. Exclude private contact channels, money, full drafts and private/tokenized URLs by default. AI cannot silently mark tasks done or change access status. Budget arithmetic, dates, local saves, templates and print remain deterministic. No personal plan was transmitted during this review.

## Recommended build order

1. Complete the universal conference profile and make it the primary setup; preserve existing plans and optional presets.
2. Implement the checklist pattern on the existing shared record, then close funding, learning/community, follow-up and debrief worksheet gaps. Add useful filled examples without changing the frozen manuscript silently.
3. Implement an opt-in AI review after those inputs are reliable. Keep source and privacy behavior visible and test failure/fallback paths.
4. Finish release QA before hosting/public distribution or attendee outreach.

## Review artifact and validation

`design/planning-concept.html` is an isolated interactive concept in the approved palette. It demonstrates a generic profile, goal/format-sensitive checklist, manual completion/skipping, phase navigation, and an explicitly illustrative AI review. The sample event and dates are fictional; the timeline uses a fixed October 13, 2026 preview date. State is memory-only and resets on reload. Guide links open the existing reader; no application storage or AI service is used.

Current UI inspection confirmed the planner's worksheet rail and preset-first/custom-name-and-date setup. Source inspection confirmed the data-model and worksheet gaps above. Earlier build/CI/PDF checks remain recorded in `PRINT_PIPELINE_QA.md`; they are not substitutes for the remaining release QA.

Concept checks: JavaScript syntax passed; manual checkbox changes updated progress; skipping excluded a row from progress and allowed re-inclusion; recruiting and online format changed the applicable tasks; all four phases rendered their own actions. Online preparation still includes costs while physical journey preparation is omitted. A three-day event remained “at event” through the end date; reversed dates produced an error. AI details showed the explicit illustrative label. Layout had no horizontal overflow at 390 px and 320 px viewport overrides, which were reset afterward. Reload restored the fictional default, confirming no persistence. These are focused browser checks, not screen-reader or cross-browser certification.

Captures: [desktop](../design/screenshots/product-review/checklist-desktop.jpg), [phone](../design/screenshots/product-review/checklist-phone.jpg). The browser's full-page screenshot API was unavailable; these are verified viewport captures.

## Source locations

- `assets/app.js`: `makePlan`, `createCustom`, `renderSetup`, `taskFilter`, `editorExperience`, `editorNotes`, `editorLearning`, `reviewPlan`, and `BUDGET_FIELDS`.
- `assets/representative.js`: `renderPlannerWorkspace`, `renderPlannerTasks`, guide worksheets.
- `content/playbook-v1.3.snapshot.json`: each guide's `optionalBody` defines the authored worksheet expectations.
- `docs/PROJECT_STATUS.md`, `docs/DESIGN_QA.md`, `docs/PRINT_PIPELINE_QA.md`: implemented scope and known verification limits.
