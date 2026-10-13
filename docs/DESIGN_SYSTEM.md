# Conference Leverage · representative design system

Internal design review, October 12, 2026. Implemented for Priorities, Funding, and My Conference only. The shared navigation is updated; the other seven guide bodies retain their v5 presentation.

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

The selected palette is **Charcoal & teal**, option 01 from the browser comparison: white page and editor surfaces, charcoal text, deep teal links/controls, and pale mint examples. Color tokens describe their purpose so palette changes stay consistent across all three experiences. The local [palette comparison](../design/palette-review.html) preserves the alternatives and opens the selected reference by default.

Body text is 16 px with a 1.65 line height. Introductions use 17–19 px; instructions use 15–16 px; supporting text generally uses 14 px. Tertiary task captions and compact status labels use 13 px. Desktop page headings reach 48 px, mobile headings 35–36 px; tip headings use 21–23 px. Inputs use 16 px, including mobile. Avoid adding further small-text tiers or uppercase instructional labels.

## Reusable patterns

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

Buttons have at least 44 px height, main controls at least 44–46 px, and task checkboxes are 24 px. Teal focus outlines, selected text/state, native labels and explicit access statuses support keyboard use. Hover changes are short and restrained. Reduced-motion preferences remove transitions and animation; in-page reading links scroll directly and move focus to the section.

Small-screen guide shortcuts reach the worked example and worksheet without requiring a long scroll.

## Responsive behavior

- Above 1,050 px: a reading column and 200–300 px rail; planner steps and editor sit side by side.
- At 801–1,050 px: gutters and columns tighten while reading width remains comfortable.
- At 800 px and below: articles become one column; the planner menu becomes a disclosure above the editor. The suggested-step button moves focus to the editor.
- At 550 px and below: form pairs and comparisons stack, numerical results stack, and the navigation uses the shorter Templates label.

The print layer follows the original v5 contract: interactive tools/navigation are omitted from guide prints; approved details expand; personal field-plan text comes from the existing event-specific exporter and privacy preferences. Private numbers, contact channels, drafts and sensitive source links remain excluded by default.

## Architecture and editorial boundary

`index.html` retains the exact embedded `SNAPSHOT` and `GUIDES` mapping. `content/playbook-v1.3.snapshot.json` is unchanged. The existing parity test still compares the two.

Unsaved inline drafts stay in memory under their event ID; switching events does not carry a draft into another plan. Anonymous work attaches once to a selected event and remains unsaved until the user saves it.

The original v5 application is extracted to `assets/app.js`; its old presentation is in `assets/prototype.css`. `assets/representative.js` owns the three representative renderers and shared Priority/Funding worksheet markup. `assets/design.css` scopes the new body treatment to `review-surface`. The existing data schema, storage key, import behavior, template source and `exportSections` / `fieldPlanText` remain in use. No framework or application rebuild is required for this review.

Future work should extend these patterns after design approval, rather than accumulating page-specific style forks. Workbook generators are still absent; a release pipeline must use a reviewed versioned snapshot for both web and PDF output. This change does not claim automatic Notion synchronization.
