# Conference Leverage · design system

Internal design review, October 13, 2026. The approved system covers all nine guides, My Conference, Templates, My Field Plan, the reading library and Downloads.

## Direction and reference study

The [Panther GHC Guide](https://panther-hub.org/resources/ghc-guide) makes long advice approachable with conversational headings, numbered progression, concrete comparisons, reflection, and small contextual interactions. The existing [reading-style study](../design/reading-style-study.html) tests a more open article treatment. Both were read and inspected in a browser.

This implementation develops its own white, charcoal, teal and pale mint palette selected during user review. It uses open sections, a compact reading rail, and a restrained typographic hierarchy. Examples and worksheets get a background treatment because they change the reader's mode; ordinary advice does not need a card shell. No reference branding, imagery or application content is reused.

## Tokens

Defined once in [assets/design.css](../assets/design.css).

| Purpose | Token | Value |
| --- | --- | --- |
| Page | `--paper` | `#ffffff` |
| Form/editor surface | `--surface` | `#ffffff` |
| Primary text | `--text` | `#252b2e` |
| Supporting text | `--secondary` | `#596469` |
| Quiet separator | `--rule` | `#dde3e4` |
| Control boundary | `--control-border` | `#7d8c8d` |
| Interactive accent | `--accent` | `#006d68` |
| Link/hover accent | `--accent-dark` | `#00544f` |
| Worksheet/selected wash | `--accent-wash` | `#edf6f5` |
| Example/next-move wash | `--example-wash` | `#e7f3ef` |
| Section number/emphasis | `--emphasis` | `#006d68` |
| Example/worksheet dividers | `--example-rule` / `--worksheet-rule` | `#c4dcd3` |
| Body | `--body-face` | DM Sans, Segoe UI, Arial |
| Headings | `--heading-face` | Manrope, Trebuchet MS |
| Reading column | `--reading-width` | Maximum 720 px |
| Space scale | `--space-1` … `--space-6` | 8 / 16 / 24 / 32 / 48 / 64 px |

The variable Latin web fonts total approximately 49 KB and are served from the repository. Their OFL licenses are in `assets/fonts/`. There are no remote font calls or new runtime packages.

The selected palette is **Charcoal & teal**, option 01 from the browser comparison: white page and editor surfaces, charcoal text, deep teal links/controls, and pale mint examples. Color tokens describe their purpose so palette changes stay consistent across guides and tools. The local [palette comparison](../design/palette-review.html) preserves the alternatives and opens the selected reference by default.

Body text is 16 px with a 1.65 line height. Introductions use 17–19 px; instructions use 15–16 px; supporting text generally uses 14 px. Tertiary task captions and compact status labels use 13 px. Desktop page headings reach 48 px, mobile headings 35–36 px; tip headings use 21–23 px. Inputs use 16 px, including mobile. Avoid adding further small-text tiers or uppercase instructional labels.

## Reusable patterns

### Icon-only home link and browser icon

The header and browser tab use Kelly’s supplied waving “Hi” character. The original artwork is preserved in `assets/characters/kelly-hi.png`; website-size PNG, ICO and Apple touch files use versioned v4 filenames. The earlier KC, CL and bridge assets remain archived explorations.

The character displays at 44 × 44 px inside a home link labeled “Playbook home”, with a matching hover tooltip and rounded corners. Navigation stays alongside it on phones where space allows and moves to its own row below 360 px. Current assets and archived exploration notes are documented in [brand assets](../assets/brand/README.md). The [brand review](../design/brand-review.html) shows the home link and actual-size character icons.

The character is used only for the home icon and browser icons. The preparation panel, guides, fictional examples and worksheets use their existing reading treatment. Source provenance is recorded in [character assets](../assets/characters/README.md).

| Pattern | Purpose and behavior |
| --- | --- |
| `reading-tip` | Open numbered section, one approved check per section, generous rhythm and an actionable heading. |
| `goal-chips` / `goal-response` | Example lenses, one selected state with `aria-pressed`, keyboard activation, polite live feedback. Does not silently change the saved conference goal. |
| `worked-example` | Explicit fictional case. Comparison columns stack on mobile; approved example prose remains present. |
| `funding-ledger` | Full cost, conditional confirmed reimbursement and pending funding, followed by distinct final-cost and upfront-cash results. Values come from the frozen Jordan case. |
| `inline-worksheet` | Contextual tool in the reading flow. Existing event save handlers are shared with My Conference. Anonymous use stays in memory until reload. |
| `worksheet-notes` / `guide-details` | Native keyboard-accessible disclosures. Core meaning stays visible; procedural detail remains available. Approved detailed instructions expand for guide printing and restore afterward. |
| `next-move` | One suggested incomplete step drawn from existing date windows. Suggestions are explicitly general, not official deadlines. |
| `planner-menu` | Desktop task rail; compact disclosure on mobile. Resizing changes the disclosure state without rebuilding the form. |
| `other-steps` | All editors remain reachable even when outside the suggested date window. |
| `save-state` / status toast | Distinguishes unsaved form changes, local saves and unavailable storage. Priority and budget errors focus the relevant field. |
| `resource-layout` / guide tiles | Open library links separated by quiet rules, with readable summaries and stage navigation. |
| `templayout` / `tlist` / `templatebody` | Four-template navigation, selected link with `aria-current`, event context, save/copy actions above the draft and a labeled editor. Existing save/copy handlers stay in use. |
| `privacy-controls` / `planbox` | Four native private-data choices beside the portable plan; all are excluded by default. Preview text still comes from the existing exporter. |

Buttons have at least 44 px height, main controls at least 44–46 px, and task checkboxes are 24 px. Teal focus outlines, selected text/state, native labels and explicit access statuses support keyboard use. Hover changes are short and restrained. Reduced-motion preferences remove transitions and animation; in-page reading links scroll directly and move focus to the section.

Small-screen guide shortcuts reach the worked example and optional tool without requiring a long scroll. Conversations names its tool “Copyable prompt”; the approved prompt and copy handler remain in use.

## Responsive behavior

- Above 1,050 px: a reading column and 200–300 px rail; planner steps and editor sit side by side.
- At 801–1,050 px: gutters and columns tighten while reading width remains comfortable.
- At 800 px and below: articles and the library become one column; the planner menu becomes a disclosure above the editor. The suggested-step button moves focus to the editor. Template navigation becomes a two-column list, and privacy controls move above the Field Plan.
- At 550 px and below: form pairs and comparisons stack, numerical results stack, and the navigation uses the shorter Templates label.

The print layer follows the original v5 contract: interactive tools/navigation are omitted from guide prints; approved details expand; personal field-plan text comes from the existing event-specific exporter and privacy preferences. Private numbers, contact channels, drafts and sensitive source links remain excluded by default. Field Plan hides its controls, removes the preview border and allows long sections to flow across pages; physical Letter/A4 pagination still needs browser print testing.

## Architecture and editorial boundary

`index.html` retains the exact embedded `SNAPSHOT` and `GUIDES` mapping. `content/playbook-v1.3.snapshot.json` is unchanged. The existing parity test still compares the two.

Unsaved inline drafts stay in memory under their event ID; switching events does not carry a draft into another plan. Anonymous work attaches once to a selected event and remains unsaved until the user saves it.

The original v5 application is extracted to `assets/app.js`; its original base presentation is in `assets/prototype.css`. `assets/representative.js` owns the shared guide renderer, My Conference renderer and Priority/Funding worksheet markup. All nine guides now use that renderer, with their own approved checks, instructions, examples, references and optional tools. Templates and Field Plan markup live in `assets/app.js`. `assets/design.css` applies the approved treatment through `review-surface` on app routes. The existing data schema, storage key, import behavior, template source and `exportSections` / `fieldPlanText` remain in use. Asset URLs include content hashes to prevent an older cached renderer from appearing during review. No framework or application build step is required.

The user approved Charcoal & teal, authorized the rollout, then continued with print/source work. `scripts/build.py` now generates web and PDF artifacts from the unchanged reviewed snapshot, with reproducibility and connected-source revision checks. Print editions share the white/charcoal/teal/mint treatment and use standard Helvetica. Automatic semantic Notion synchronization is not claimed. See [content pipeline](CONTENT_PIPELINE.md).
