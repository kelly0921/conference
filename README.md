# Conference Leverage

A resource-first, interactive conference playbook for students and early-career professionals. It supports **Before / During / After** guides, editable preparation plans, template drafting, and a portable field plan for events such as GHC, SHPE, and AFROTECH.

**Status: internal v5 prototype. Not deployed and not production-ready.** The main branch is intentionally minimal; proposed changes live in a draft pull request.

## Preview locally

Run a local static server from the repository root:

```bash
python -m http.server 4173
```

Open [http://localhost:4173/](http://localhost:4173/). The app is currently a standalone HTML prototype (`index.html`). The design experiment is available at `/design/reading-style-study.html`.

For a simple source validation check:

```bash
python -m unittest discover -s tests -v
```

## What's here

- **`index.html`** — integrated v5 reading library + planning prototype. Includes the frozen editorial content for the current demonstration.
- **`content/playbook-v1.3.snapshot.json`** — extracted copy of the same snapshot for review/refactoring, with stable guide IDs, source links and templates.
- **`design/reading-style-study.html`** — typography and reading-flow experiment; **not** the approved final design.
- **`docs/CODEX_DESIGN_BRIEF.md`** — current three-surface design implementation scope.
- **`docs/V5_QA_NOTES.md`** — internal testing evidence and remaining gaps.
- **`docs/PROJECT_STATUS.md`** — what's included versus what still needs implementation.
- **`tests/test_content.py`** — verifies the embedded snapshot and exported content agree.

The original v5 review package also contains Python build scripts and generated **Letter/A4 workbook PDFs**. Those binary PDFs and workbook-generation scripts have **not yet been committed** to this branch. They should be added from the reviewed source package as part of the next Codex implementation step; the site still requires a real production publishing pipeline.

## Design direction

The target is a **beautifully designed, interactive field guide**: warm, modern, readable, professional but not formal. The current design experiment is inspired by the *reading experience* of the [Panther GHC Guide](https://panther-hub.org/resources/ghc-guide), especially the “My Application Tips” section, without copying its branding or content. See [Codex design brief](docs/CODEX_DESIGN_BRIEF.md).

## Editorial and privacy boundaries

- The [Notion editorial source registry](https://app.notion.com/p/3f7b144c6b99816285a3e00b9d81a596) is the living content reference. The committed JSON is a **manual reviewed freeze**, not a live Notion sync.
- Fictional attendee, role, appointment and message examples are labeled as fictional; no real jobs or invitations are confirmed.
- Plans are stored in the user's browser in the prototype. **Do not add telemetry, backend storage, real AI calls, or deployment without deliberate privacy and QA review.**
- Do not treat a talent profile as a job application or a pending RSVP as an accepted invitation.

## Release boundaries

Do **not** publish, merge to main, or recruit attendees for feedback yet. Finish editorial-source synchronization, visual quality, accessibility, real-browser persistence, printable-asset integration and current-source checks first. External user feedback is the final phase.
