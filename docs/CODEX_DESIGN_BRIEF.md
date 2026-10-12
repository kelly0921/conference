# Codex assignment — Conference Leverage visual system

**Branch:** `develop/conference-playbook-v5`  
**Stage:** design implementation / internal review only, no production deployment.

## Product and user intent

We have a content-rich, interactive field guide—not an advertisement, corporate documentation portal or generic task-tracker. Readers should understand what to expect immediately, browse Before / During / After, read concise actionable resources, and optionally use a personalized planning workflow. Preserve the nine source-backed guides, templates, stage routing, event-specific notes and printable-plan semantics.

## Design reference

Study the [Panther GHC Guide](https://panther-hub.org/resources/ghc-guide) and its **“💗 My Application Tips — 15 things I wish I'd known before applying”** section. Learn from conversational numbered tips, progressive reading, clear comparisons, reflective questions, and small useful interactive elements. **Do not** copy the page, exact layout, fonts, content, colors, hearts or branding.

`design/reading-style-study.html` explores an open article layout with warmer sans-serif typography. Treat it as a hypothesis, not a definitive font/color choice.

## Phase 1 — audit

Inspect `index.html`, the embedded content snapshot, and this design study. Critique the real rendered desktop/mobile views: typography, reading widths, font sizes, layout density, contrast, crowded cards, hierarchy, interaction affordances, focus states and accessibility. Preserve existing behavior and content. Don't stop at “build succeeded.”

## Phase 2 — implement ONLY three representative experiences

1. **What should I prioritize?** Open, enjoyable editorial reading with numbered tips, a real worked example, goal-sensitive explanation, optional detailed how-to, and a small inline priority tool.
2. **How can I fund my trip?** Same visual language but distinctly presented numerical example, confirmed vs pending funding, cash-timing worksheet, and concise procedures.
3. **My Conference** planning workspace. Should feel like the same product without forcing forms to look like articles. Preserve date-aware tasks, per-event data separation, sources, user-reported access statuses, editable templates, fixed appointments, private print controls and My Field Plan.

Render desktop and mobile screenshots for each and improve iteratively, not merely once.

## Required design qualities

- Friendly, confident typography; body text about 16–17px, readable line height, restrained helper text (avoid 10–12px instructions).
- Warm, professional but not formal. Less reliance on Georgia serif headings, tiny uppercase labels, heavy borders, oversized hero ads, and repeated card shells.
- A clear article rhythm; one thought at a time; quick key steps and optional deeper detail.
- Contextual interactions with visible states, keyboard support, useful feedback, and reduced-motion accommodations.
- Print-friendly templates and field plans; no clipped URLs, missing appointments, or surprise private-data inclusions.
- Mobile-first, accessible color contrast and clear clickable targets.

## Non-negotiables

- Preserve **all nine** Before / During / After guides and their approved v1.3 meaning, access caveats, and teaching examples.
- Preserve actual saved-plan and template functionality; avoid redoing research or adding speculative features.
- Preserve event-specific source evidence and don't invent current roles, scholarship availability, booked meetings, or official eligibility.
- AI is **not implemented**. “Review my plan” is currently rules-based; no AI-as-marketing feature or autonomous messaging.
- No mandatory signup, scraping, deployment, or user recruitment.
- Work in this branch/draft PR. Do not merge into `main` without review.

## Deliverables

- Three integrated and polished representative surfaces in a maintainable component/style structure.
- Before/after desktop and mobile screenshots.
- Design tokens and reusable components documented.
- A brief architecture/build note, internal accessibility and responsiveness results, and remaining tasks.
- Explicit content/print parity check with `content/playbook-v1.3.snapshot.json`.

Stop for product review before rolling the visual system out across all nine guides.
