# Planner implementation and release QA — October 13, 2026

This pass implements priorities 1–4 from the product review and adds recovery and PDF structure for priority 5. The approved white/charcoal/teal palette, reading layout, character header/favicon, nine-guide editorial freeze and four template bodies are retained. AI remains deferred; “Review my plan” uses fixed rules.

## Implemented

| Area | Result |
| --- | --- |
| Worksheet reliability | Input drafts are kept separately from saved worksheet records, scoped to the conference and worksheet, and restored after navigation or reload. A resume control opens the latest unfinished worksheet. Priorities use stable IDs so removing another target cannot move a draft to the wrong item. |
| Time validation | Profile, activity, community and funding-deadline timezones use the browser’s timezone database. Invalid dates, URL schemes, malformed times and invalid travel buffers are rejected with focused errors. Fixed appointments still require user-confirmed access and venue. Legacy invalid appointments are retained for correction and moved out of the confirmed export section. |
| Any conference | “Add your conference” is the primary setup. It includes start/end dates, timezone, in-person/online/hybrid format, location/platform, organizer URL, currency and goal. Details can be edited. The three events remain optional starting presets. Event-local calendar dates and the end date determine the suggested phase. Currency selection labels amounts; it does not convert them. |
| Saved checklist | Native checkboxes, phase progress, reversible “Not needed,” guide links and goal/format-sensitive recommendations are part of the actual saved planner. Every editor remains reachable. Preparation checkmarks do not certify admission or funding. |
| Funding | Provider, official URL, covered-expense/eligibility terms, edition, deadline date/time/timezone, self-reported status, payment method, expected reimbursement date and next action. Source records remain separate from numeric totals to avoid counting a contribution twice. |
| Community | Purpose, source, local date/time/timezone, place/platform, question, access, next action and alternative. |
| Follow-up and debrief | Editable follow-up records distinguish the person’s action status from the recipient’s response and record outcomes. Debrief retains original goal, observed experience, lesson, intended use, action/no-action/revisit choice, review date and outcome. |
| Data recovery | Private JSON backup, validated restore, separate copies for duplicate IDs, and a confirmation dialog for deleting one selected plan. Restore preserves existing plans. Failed storage writes are described as memory-only; a failed delete does not remove the in-memory plan. |
| Printing and branding | Personal exports include dates, format, organizer source and the new worksheet details, with funding/contacts/drafts/private URLs excluded unless selected. URL credentials, encoded tokens and fragment secrets are also redacted by default. Heading, browser title, footer and workbook cover use The Conference Playbook. |
| PDF structure | All three PDFs now have document/section/heading/paragraph/link structure, logical content order, language, tagged link annotations, decorative artifacts and embedded Unicode-mapped fonts. This is not a PDF/UA certification. |

Storage keeps the existing conference-playbook-integrated-v5 key and migrates records to schema version 6. Existing data, checked steps and explicit export preferences are preserved. Unknown format or organizer information is left blank rather than inferred. v4 imports also receive stable record identities. Plans remain private browser-local data with no account, telemetry, backend storage or AI request.

## Verification

- **50 automated checks:** 40 Node behavior checks and 10 Python content/pipeline checks. Shared draft listeners update the save announcement once while typing continues.
- The canonical content digest remains 86a937b8c8af0f2f1529d10c44055c2ccc0d73c8fa829fd6c8208ae2a0cd7ca5.
- **31 PDF pages:** 15 Letter, 15 A4, one fictional sample. Full approved text, template parity, paper size, character bounds, bookmarks, source metadata and sample privacy pass.
- PDF checks also require marked text, page reading order, content-to-structure mappings, heading structure, language, embedded fonts/Unicode mappings and accessible source annotations. All pages were rendered with Poppler and reviewed in contact sheets; the dense funding page was inspected separately.
- In-app Chromium browser testing used explicitly fictional records on localhost:4173, separate from the user's 127.0.0.1 plans. A multi-day online EUR profile was created; an unfinished debrief survived switching and reload; a valid appointment saved; not/a-zone was rejected and focus moved to the field; skipping/reincluding an action changed its denominator; a JSON backup restored an additional conference and its unfinished story without overwriting existing conferences.
- At 320 CSS pixels, the profile form and personal field plan have no horizontal overflow. Form controls are at least 44 pixels high; checkbox labels and checklist actions provide larger hit areas. After a planner refresh, keyboard focus remains on the phase/checkbox/button that triggered it. Narrow-screen reflow is not evidence of actual OS touch or browser zoom testing.
- Automated tests cover selected-plan deletion isolation and failed storage writes. Browser review confirmed the native confirmation dialog has a named heading, starts focus on “Keep plan,” and cancels without deleting the fictional plan. A fictional funding source also saved in the browser without changing its separate EUR 75 budget total.
- Hosted development-preview review confirmed the new universal setup is deployed and a fictional multi-day online EUR profile survives reload on that HTTPS origin. GitHub source checks and Cloudflare deployment passed for the initial planner commit; exact production-origin migration still remains a separate release check.

Reproduce:

~~~sh
python -m unittest discover -s tests -v
node --test tests/runtime.test.cjs tests/planning.test.cjs
python scripts/build.py --check
python scripts/validate_print.py
~~~

Regenerate PDFs and asset hashes with python scripts/build.py. The render_print_review.py helper accepts --pdftoppm /path/to/pdftoppm and creates ignored visual-review images. The build/test runtime never reads a person's actual browser plans.

## Release checks still required

The code is ready for another internal workflow review, not a fully verified public launch. This environment exposes Chromium browser controls; it does not expose Firefox/Safari, native screen readers or physical printers. These checks are outstanding rather than represented as passed:

| Check | Concrete acceptance step |
| --- | --- |
| Screen readers | With NVDA/Firefox or Chrome and VoiceOver/Safari, use keyboard alone through setup, validation, checklist skipping, resume, restore and the delete dialog. Confirm labels, progress/error/save announcements, focus order and modal containment. |
| Zoom/touch | Test actual 200% and 400% browser zoom, text-only zoom, OS high-contrast and iOS/Android touch. Ensure date/time controls, menus, errors and keyboard fields stay usable. |
| Firefox/Safari | Create, switch, save, reload and restore plans; repeat tests with storage restricted/private mode. Check timezone/currency support and native file chooser/dialog behavior. |
| Personal plan printing | Print long user-entered URLs, many notes and opted-in long drafts to both Letter and A4 using real browser dialogs. Confirm flow, page breaks, privacy exclusions, readable repeated headings and physical output. Browser-created PDFs may have different tagging from the generated workbook. |
| PDF assistive technology | Read all three generated files with actual PDF screen-reader tools and run a formal accessibility checker. Confirm headings, link labels and reading order. No claim of complete PDF/UA or WCAG conformance is made. |
| Production storage | After a reviewed release is promoted to the production URL, repeat migration/save/reload/backup/restore on that exact origin. Localhost and preview-origin storage do not transfer automatically. Use a private backup to move plans. Test storage-full/blocked behavior and concurrent tabs. |
| Recovery limits | Browser-data deletion is recoverable only if a backup was saved elsewhere. There is no cloud sync or automatic off-device backup. Corrupt legacy storage and concurrent edits require broader recovery testing. |
| Organizer facts | Refresh edition-specific references, dates, access instructions and terms before inviting public users. No actual job, grant or invitation is verified by the planner. |

No new AI integration or public feedback campaign is included in this pass.
