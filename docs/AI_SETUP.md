# AI planning preview

The saved planner now offers **Help me plan** and **Review my plan**. Both use an optional, explicit preview of the request. Only a user-approved request reaches OpenAI. Suggestions include an action, reason, uncertainty, relevant guide, exact supporting quotes and proposed worksheet text. “Use in worksheet” creates a recoverable draft; the user reviews it and saves through the normal editor. Existing drafts cannot be overwritten by AI. See the [current repeated review](AI_REPEATED_REVIEW_2026-10-17.md) for tested behavior and open quality gates.

## Enable the development preview

The Cloudflare Pages project is `conference-playbook`. Its Git preview branch is `develop/conference-playbook-v5`.

1. Open [Cloudflare Workers & Pages](https://dash.cloudflare.com/287d7ca568f2cce8a0325468d1722265/workers-and-pages), select **conference-playbook**, then **Settings → Variables and Secrets**.
2. Select the **Preview** environment. Add a **Secret** named `OPENAI_API_KEY`, using your OpenAI project API key. Enter it directly in Cloudflare; never put it in chat, Git, a frontend file or a URL.
3. Redeploy the latest **preview** deployment on `develop/conference-playbook-v5` after saving the secret. Do not retry the older `main` deployment to test AI: that commit predates the AI feature and its `package.json`. Reload the preview site. The AI page should say **Live AI is available**. `/api/assistant` also returns `available: true` when all required bindings exist.

The repository's `wrangler.jsonc` already configures the preview model, enable flag and `AI_LIMITS` database binding. Database `conference-playbook-ai-limits` was created for this feature. It holds request counters only; the handler initializes its own table. Production remains disabled until the release is reviewed. Setting a production key alone does not enable production AI.

The shared Pages output directory is `dist`. Its build command handles both the current preview and the older static production commit, which has no `package.json`:

```sh
if [ -f package.json ]; then npm run build; else mkdir -p dist/output && cp index.html favicon.ico dist/ && cp -R assets design dist/ && cp -R output/pdf dist/output/; fi
```

The legacy branch copies only public assets. An empty build command leaves `dist` missing; an unconditional `npm run build` fails on the old production commit. Once both branches contain the package-based build, this can be simplified to `npm run build`.

Secrets are environment-specific. Adding `OPENAI_API_KEY` in **Production** does not make it available to **Preview**. Cloudflare will not reveal an existing encrypted value for copying; add the key directly in Preview using your privately saved value. Never paste it into chat.

If the dashboard environment selector is hard to find, run this from the project folder and enter the value only at Wrangler's private prompt:

```powershell
npx.cmd wrangler pages secret put OPENAI_API_KEY --project-name conference-playbook --env preview
```

Then redeploy the preview. `wrangler pages secret list --project-name conference-playbook --env preview` lists names only. The Preview secret and live deployment were verified on October 15; see the [live review](AI_LIVE_REVIEW_2026-10-15.md) for the tested behavior and remaining quality issues.

Use fictional input for the initial provider smoke test. Check both modes, a small pasted agenda, a changed request, a worksheet draft and reload. Model usefulness and hallucination checks need actual provider responses; mocked tests establish integration behavior, not model quality.

## Privacy and limits

- Conference profile and the typed goal/constraints/agenda are shown in the preview. Saved priorities are selected initially; schedule, budget totals, learning and commitment summaries are off initially.
- Contact channels, private confirmation references, funding-source details and full templates are excluded. Selected free text can still contain sensitive information. Automatic redaction removes common email/phone/key patterns and credential/query/fragment URLs, but is not an anonymization guarantee.
- The request is stateless, uses `store: false`, and does not use provider web tools. OpenAI's [API data policy](https://developers.openai.com/api/docs/guides/your-data) describes standard abuse-monitoring retention, which can be up to 30 days. `store: false` does not mean zero retention.
- No request body or model result is logged or saved by application code on the server. The counter database stores an HMAC of the IP scoped to a day, hourly counts, a global daily count and expiry. Old counters are removed on a later request. Cloudflare infrastructure may process ordinary connection metadata.
- Six attempts per visitor/IP per UTC hour; 30 attempts across the preview per UTC day. Reservations occur before provider calls and failures count. Concurrent quotas are atomic in SQLite. No automatic retries. IP limits are not authentication; shared networks share a quota. The global cap bounds anonymous abuse and can be tightened in the handler. Add stronger visitor controls before a larger public rollout.
- Default model: `gpt-5.4-mini`, at most 3,500 output tokens per request. Requests and upstream bodies are bounded, with a 25-second provider timeout. Review OpenAI project spending controls separately.
- All proposed text is escaped. Server and client validate the schema, guide/evidence references and allowed worksheet fields. AI cannot write access statuses, appointments, money, observed outcomes or checklist completion. Source URLs in generated advice or draft fields must belong to the separately approved source set shown in the preview. These checks do not guarantee the truth of prose; the user still verifies claims.

## Local development and checks

### Session comparison

Protocol 3 adds **Public source links for worksheet drafts**. Enter eligible public URLs there, one per line. The included conference organizer URL, sources from shared saved priorities and confirmed sessions are also eligible. Agenda prose can contain untrusted links, but those cannot become source fields merely by appearing in the text. The preview displays the eligible link list separately. Eligibility does not independently verify a source. Private query/credential/fragment links are rejected. Older AI tabs must reload before sending; their request is rejected before quota reservation.

Open **Check session times (optional)**. Enter `Session name | 14:00 | 15:00`, one per line, using the chosen session date and IANA timezone. Optional columns are `| timezone | public URL | reset minutes`. For overnight or different-date sessions, use a full local date in both columns, for example `2027-03-08T23:30 | 2027-03-09T00:30`. Up to eighteen combined pasted/saved sessions can be compared. Complete saved appointments can also be included through **Saved schedule**. Plain agenda notes and incomplete appointments are not converted into checked session records.

Use **Check session times**, review the displayed original details and calculated findings, then confirm the session details before previewing the request. Changing timing, availability, break, activity-limit or saved-schedule controls invalidates that confirmation. The separate OpenAI sharing consent is still required. A repeated or nonexistent daylight-saving local time must be corrected; the checker will not silently choose an offset. Optional availability is a window on the selected date.

The model proposes an ID selection; code checks its feasibility and renders times from the input. The provider chooses paired source/excerpt options; code validates the quotes and derives the public evidence ID list. Quotes do not prove correct reasoning or independently verified facts. No schedule, access, cash, status or checklist write is performed by AI.

### Offline and live evaluations

`npm ci`, `npm run build:assistant`, `npm run typecheck`, `npm run test:assistant`, `npm run test:accuracy`, `npm run eval:assistant`.

The default evaluation is offline. An explicit fictional provider run uses the deployed preview and its normal quota:

```powershell
npm.cmd run eval:assistant -- --live --base https://develop-conference-playbook.conference-playbook.pages.dev --limit 5
```

To retest one regression case, add `--case recruiting-goal-with-unknown-access --limit 1`. For the broader suite:

```powershell
npm.cmd run eval:assistant -- --live --base https://develop-conference-playbook.conference-playbook.pages.dev --suite quality --cases quality-conflict-resolution,quality-source-injection --repeat 2 --limit 4
```

`--limit` bounds total attempts, including repeats. Hosted runs permit at most six attempts, stop on quota/unavailable-service responses, and require the deployed source fingerprint to match the local build. The ordinary hourly/shared daily limits still apply. Reports are saved incrementally in distinct ignored `.qa-cache/assistant-evals/<run>/report.json` folders. There are no automatic error retries. Keep human review separate from contract acceptance. The six validator replays are constructed regressions, not fresh baseline model calls.

For a larger private test batch, add your privately retained OpenAI project key directly to ignored `.dev.vars` (a separate test key is optional) as `OPENAI_API_KEY=...`; never put its value in chat or Git. Then use:

```powershell
npm.cmd run eval:assistant -- --live --direct --suite quality --repeat 2 --limit 24 --budget-usd 0.50
```

Direct mode sends only checked-in fictional cases to `api.openai.com`, using the same payload and validators as Pages. It does not change public limits or add an evaluation endpoint. It accepts at most 24 attempts and three repeats, with an estimated cost guard of USD 0.50 by default and USD 1 maximum. Configure provider-project spending controls separately. The 16-case example above runs every case once and, if the budget allows, the first eight again; choose a smaller balanced `--cases` list if every selected case must repeat twice. Original development/holdout labels are retained for audit. The October 17 study consumed those holdouts during debugging, so this corpus is now a regression suite; create fresh independent cases before another held-out evaluation.

Do not replace fictional fixtures with real personal plans. Successful direct provider responses, including rejected candidates, are retained locally for diagnosis; credentials and non-2xx provider bodies are excluded. Requests use `store: false`, with the same provider retention caveat documented above. Direct batches and their manual-review limitations are recorded in the repeated review.

`npm run dev:assistant` serves the full Pages app at `http://127.0.0.1:4174`. Live calls are disabled by default. Static port 4173 can show the interface and fictional example but cannot run the API. No key is required for tests: they use fictional provider responses and local Cloudflare SQLite.

`wrangler.local.jsonc` is only an input for generating binding declarations (`wrangler types types/assistant-env.d.ts --config wrangler.local.jsonc --strict-vars=false --include-runtime=false`); Pages dev uses normal configuration and CLI bindings. Do not deploy the local declaration config. `.dev.vars*`, `.env*`, runtime state and QA artifacts are ignored and excluded from static uploads.

The committed client bundle is reproducible from `src/assistant-client.js` and the shared contract. Build/test modules live under ignored `.qa-cache`. CI checks parity with the bundle, endpoint types, security/limit behavior and all existing editorial/print checks. `npm run build` prepares the allowlisted public assets in `dist`. Cloudflare's dependency-install step also prepares these assets through `postinstall`. `.node-version` selects Node 22 for hosted builds. `wrangler.jsonc` selects `dist` as the output directory. Keep the shared legacy-compatible build command above until the production branch also contains `package.json`. Server sources, dependencies, QA files and secrets are never copied into the public directory.
