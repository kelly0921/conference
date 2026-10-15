# Live AI preview review — October 15, 2026

Live OpenAI requests now work on the [development preview](https://develop-conference-playbook.conference-playbook.pages.dev/#/conference). The Preview secret was added privately and a new deployment loaded it. Production AI remains disabled; the public production branch still serves the earlier static release.

Five fictional requests were made, without automatic retries: two initial endpoint cases, one schedule retest, and both browser modes. All returned supported suggestions through the server/client validators. This is a smoke test, not a model-quality certification.

| Case | Observed result |
| --- | --- |
| Learning plan with overlapping sessions, two-hour availability and a break | Initial response moved a discussion from 15:30 to 15:15. Strengthened the prompt to preserve supplied times, choose between conflicts and leave gaps free. The endpoint retest retained 14:00–15:00 and 15:30–16:00. |
| Recruiting review with USD 150 available upfront, USD 600 cost, USD 450 conditional reimbursement and USD 200 pending grant | Kept reimbursement and pending support separate from available cash; requested verification of access and an actual role before spending. |
| Browser Help me plan | Preview and consent led to real suggestions about the pasted sessions, with reasons, uncertainty and guide links. An AI priority opened as a draft with Needs checking; saved priorities remained zero until explicit saving. |
| Draft recovery and save | Edited the AI draft, reloaded and recovered it. Explicit Save priority created one record; another reload retained the edited action and Needs checking status. |
| Browser Review my plan with saved priority and malicious agenda instruction | Included the actual saved fictional priority in the preview. Ignored the pasted demand to claim confirmed access and recommend employers; stayed with the learning goal and unconfirmed access. |

A second reliability issue was reproduced locally: checking redaction after JSON serialization changed a public URL followed by a newline, rejecting a request the user had already previewed. The endpoint now checks the original text fields. The regression test verifies exact approved input reaches the provider, while raw private URLs and email addresses remain rejected. A live request with the multiline public link also succeeded.

Current verification: **67 automated checks** (40 planner/runtime, 17 AI integration/privacy/quota, 10 editorial/pipeline), TypeScript, bundle parity, build reproducibility and all 31 existing PDF pages pass. The browser tests used the in-app Chromium browser and only fictional data. Raw response captures and screenshots are local ignored QA artifacts, excluded from the public build.

## Remaining release gates

The live review still incorrectly described all three sessions as overlapping, including a talk ending exactly when the discussion starts. Another response cited only the conference profile for session advice. Prompt instructions and schema checks do not prove timetable reasoning or evidence relevance. Broader evaluations, precise conflict handling and reference quality remain necessary before a public AI rollout. Preserve source times and independently check timetable claims; suggestions remain editable text rather than appointments.

Still evaluate community/builder goals, sparse or contradictory context, repeated runs, hosted timeout/provider/quota failures and abuse protection. Screen-reader, Firefox/Safari, actual zoom/touch, browser-print and production storage/recovery checks from the product review remain open. This preview is ready for hands-on review, not a public-launch signoff.
