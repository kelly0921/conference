# Repeated AI accuracy review — October 17, 2026

Later update: the missing access-evidence question is now supplied and labeled by the planner. A separate frozen twelve-case/two-run study is recorded in the [access fix and fresh evaluation](AI_ACCESS_INDEPENDENT_REVIEW_2026-10-17.md). The counts and limitations below preserve this earlier study as captured; they are not rewritten as new live results.

The broader fictional study is complete. It reproduced useful responses and several real failures that a schema-only smoke test missed. The fixes are suitable for continued internal preview; this is not a public-launch approval or a general accuracy percentage.

## Findings fixed

| Finding | Change |
| --- | --- |
| Valid networking phrases such as “interest overlap,” “peer overlap,” and a question about shared interests were rejected as scheduling claims | The wording check distinguishes common topic uses and, without a timetable, requires a temporal referent before treating generic overlap as a scheduling assertion. Actual clock claims and explicit session overlaps remain blocked. Positive captured cases and adjacent negative cases are regressions. |
| A provider response supplied a priority name without its required next action | Provider drafts now use worksheet-specific objects with required keys. Target names/actions must be nonblank. Code converts checked objects back to the existing public field-array shape; no client protocol or saved-data migration is required. |
| Timed records and saved priorities caused provider HTTP 400 errors when quoted JSON became literal schema-enum text | The model selects an opaque excerpt ID paired with its source ID. Code resolves the exact supplied excerpt, checks it and derives the public evidence IDs. User text stays out of schema enum literals. |
| The evaluator mistook valid public URLs for private links after JSON escaping | Evaluator and endpoint now share the same check over original text fields, before transport serialization. A URL followed by a newline and a saved-priority JSON source are covered. |
| A saved priority ID was returned as a timed session selection | The provider schema permits only actual session IDs and the configured activity limit; without a timetable it requires an empty selection. Code still checks feasibility, availability, breaks and duplicate IDs. |
| Valid primary IDs hid unsafe/ambiguous supplementary advice for other sessions | Unselected named session suggestions require explicit alternative/replacement language. Captured “after the main” and “second learning option later” advice is rejected. Explicit “not an additional activity” language remains valid. |
| A long timetable-conflict summary escaped a short phrase-window check | The check now covers the sentence rather than an arbitrary 80-character window. The captured response is rejected even though that particular summary agrees with the supplied calculations; timetable explanations belong to the calculated panel. |
| “List only confirmed funding as available cash” confused approval with cash timing | The captured claim is rejected. Approval can still mean later reimbursement. Existing budget calculations and AI restrictions on financial writes remain in place. This phrase check is not a comprehensive financial-reasoning verifier. |

The approved palette, character branding, reading layout, frozen guides/templates, saved-plan schema, explicit AI consent and draft-only behavior are preserved. Public quotas remain six attempts/IP/hour and 30 shared/day. Production AI remains disabled.

## Live evidence and final replay

The complete matrix contains **16 scenarios, each run twice**: title-only conflict-resolution learning; source injection; contradictory access; cash versus reimbursement; remote prototype feedback; online peers; stale archives; captions/rest; feasible timed choices; mixed timezones; ceramics learning; no external browsing; item-specific priorities; marketing versus a learning goal; social overload; and conflicting grant deadlines.

The 32 calls used the same provider configuration and application revision. All 32 candidates passed that revision's contract. Human review then identified two policy/safety defects and two incomplete answers. After adding the safety fixes, the same raw candidates were replayed through the final validator:

| Scope | Original live acceptance | Final validator replay | Manual rubric review |
| --- | --- | --- | --- |
| 32-case repeated matrix | 32 accepted | 30 accepted; 2 rejected | 28 passed; 2 need improvement; 2 failed and now rejected |
| Six focused live retests of conflict-resolution, mixed zones and grant deadlines | 6 accepted before the final alternative-wording fix | 5 accepted; 1 rejected | 3 passed; 2 need improvement; 1 failed and now rejected |

**These replay results are not 38 fresh live calls on the final build.** There were additional exploratory calls across intermediate revisions to diagnose and fix failures. Those reports are retained separately and are not combined into a single accuracy rate. The earlier “holdout” cases were consumed by debugging; this suite is now a regression/development suite. A future independent evaluation needs fresh cases.

The incomplete conflict-resolution answers were useful about tentative topic fit and obtaining an abstract, but did not explicitly request access evidence; one also copied agenda metadata into an activity name. These remain answer-quality limitations. Some responses ask redundant goal questions or use broad “low-cost” wording even when the proposed alternatives are free. None of those observations is counted as proof of reliable reasoning.

All inputs are checked-in fictional cases. Private reports preserve raw candidates, the original fingerprint, rubric notes and a separate final-validator replay result. The key is read privately from ignored `.dev.vars`, sent only to OpenAI, and excluded from Git, static deployment and reports. A separate test key is optional; a privately retained existing project key also works. No Cloudflare secret was retrieved.

Local evidence: `.qa-cache/assistant-evals/2026-10-17T18-13-58-620Z-163e5a35/report.json`, `2026-10-17T18-15-41-667Z-af062114/report.json`, `2026-10-17T18-17-57-023Z-2f148dbc/report.json`, and `repeated-review-final.json` in that directory. These files are ignored and not publicly uploaded.

## Verification and remaining gates

**162 automated checks pass:** 40 planner/runtime, 18 endpoint/privacy/quota, 94 accuracy/evaluator, and 10 editorial/pipeline. The accuracy suite includes 74 fixtures plus parser, consent, schema and evaluator checks. TypeScript, generated client/source-fingerprint parity, reproducible web/PDF artifacts and the 31-page PDF validator pass.

The new guards reject the captured defects. They do not prove arbitrary prose is free of timing, access or financial errors. Alternative detection depends on explicit English wording; aliases, negation and other paraphrases can still be missed or falsely rejected. Exact quotes establish provenance, not correctness. Approved links are not browsed or independently verified. No AI suggestion can book an appointment, mark access confirmed, set numeric finances, record an observed outcome or complete a checklist item.

Next accuracy work: add fresh independent scenarios, improve mandatory access-check questions and activity-name extraction, and test real attendee goals with consent. Keep the feature in preview while completing hosted failure/abuse checks and the existing screen-reader, Firefox/Safari, touch/zoom, browser-print and production recovery gates. See [AI setup](AI_SETUP.md), the [earlier broader review](AI_BROADER_REVIEW_2026-10-17.md), and [release QA](PLANNER_RELEASE_QA_2026-10-13.md).

The test approach follows the official guidance to combine ordinary, edge and adversarial cases with repeat runs and human review. See [OpenAI evaluation guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices). Provider shape changes use the documented [Structured Outputs subset](https://developers.openai.com/api/docs/guides/structured-outputs).

Final replay fingerprint: `5d53a801716b602d7da3d19b63a2c4f23bc772dfc45a86d4f58c0a4294e02f87`.
