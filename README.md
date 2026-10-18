# The Conference Playbook

A resource-first, interactive conference playbook for students and early-career professionals. It supports **Before / During / After** guides, saved checklists, editable worksheets, template drafting, and a portable field plan for any conference. GHC, SHPE and AFROTECH are optional starting presets.

**Status: hosted for review; public-launch QA remains incomplete.** [Production](https://conference-playbook.pages.dev/) serves the previously published version. New planner work is reviewed on the [development preview](https://develop-conference-playbook.conference-playbook.pages.dev/). See the [planner implementation and release QA](docs/PLANNER_RELEASE_QA_2026-10-13.md) for current evidence and outstanding manual checks.

## Preview locally

Run a local static server from the repository root:

```bash
python -m http.server 4173 --bind 127.0.0.1
```

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/). This is a static HTML/JavaScript site with no build step. The reviewed snapshot stays embedded in `index.html`; application/rendering styles live in `assets/`. The original design experiment is available at `/design/reading-style-study.html`.

The approved design now covers all nine guides, My Conference, the reading library, Templates and My Field Plan. Open [the full rollout review](design/ROLLOUT_REVIEW.md), or serve `/design/rollout-review.html` for desktop/phone captures and selected before/after comparisons. The [initial three-experience gallery](design/REVIEW.md) preserves the first design pass. `/design/viewport.html` previews the actual app at phone, tablet and desktop widths. See [design tokens and patterns](docs/DESIGN_SYSTEM.md) and [functional/accessibility results and limits](docs/DESIGN_QA.md). Local verification includes 22 automated checks and 114 route/width combinations in Chromium.

The selected palette is **Charcoal & teal**: white surfaces, charcoal text, teal controls and pale mint examples. `/design/palette-review.html` retains the color alternatives and opens the selected reference by default.

For a simple source validation check:

```bash
python -m unittest discover -s tests -v
node --test tests/runtime.test.cjs tests/planning.test.cjs
```

## What's here

- **`index.html` + `assets/`** — integrated v5 reading library and planner, with the approved design across all nine guides, Templates, Field Plan and shared screens. Includes the unchanged frozen editorial content.
- **`content/playbook-v1.3.snapshot.json`** — extracted copy of the same snapshot for review/refactoring, with stable guide IDs, source links and templates.
- **`design/reading-style-study.html`** — typography and reading-flow experiment; **not** the approved final design.
- **`docs/CODEX_DESIGN_BRIEF.md`** — initial design scope and authorized full rollout.
- **`docs/V5_QA_NOTES.md`** — internal testing evidence and remaining gaps.
- **`docs/PROJECT_STATUS.md`** — what's included versus what still needs implementation.
- **`tests/test_content.py`** — verifies the embedded snapshot and exported content agree.

**Letter/A4 workbooks and a fictional sample are now included** in `output/pdf/` and linked from the app. Both workbooks have fifteen pages; the rebuilt sample fits on one page. They use the unchanged approved snapshot and the sample uses the application's exporter. See [build/source workflow](docs/CONTENT_PIPELINE.md) and [print QA](docs/PRINT_PIPELINE_QA.md).

To regenerate or verify artifacts, install development dependencies first:

```sh
python -m pip install -r requirements-print.txt
python scripts/build.py
python scripts/build.py --check
python scripts/validate_print.py
```

The static site needs no build step to run. Current verification: ten Python tests, forty Node tests, all 31 PDF pages and deterministic regeneration pass. PDFs include semantic tags, logical order and embedded Unicode fonts; formal assistive-technology review remains outstanding. Four templates match Notion exactly; fourteen canonical source revisions are recorded for drift checks. New guide edits still require a reviewed structured freeze.

## Design direction

The target is a **beautifully designed, interactive field guide**: warm, modern, readable, professional but not formal. The current design experiment is inspired by the *reading experience* of the [Panther GHC Guide](https://panther-hub.org/resources/ghc-guide), especially the “My Application Tips” section, without copying its branding or content. See [Codex design brief](docs/CODEX_DESIGN_BRIEF.md).

## Editorial and privacy boundaries

- The [Notion editorial source registry](https://app.notion.com/p/3f7b144c6b99816285a3e00b9d81a596) is the living content reference. The committed JSON is a **manual reviewed freeze**, not a live Notion sync.
- Fictional attendee, role, appointment and message examples are labeled as fictional; no real jobs or invitations are confirmed.
- Plans and worksheet drafts stay in the user's browser. Private JSON backups provide off-browser recovery; restore preserves existing plans. There is no cloud sync, telemetry or live AI call.
- Do not treat a talent profile as a job application or a pending RSVP as an accepted invitation.

## Release boundaries

Review new planner work on the development preview before promoting it to production. Screen-reader, actual zoom/touch, Firefox/Safari, personal browser printing, formal PDF accessibility and production-origin recovery checks remain open. External attendee feedback is the final phase.
