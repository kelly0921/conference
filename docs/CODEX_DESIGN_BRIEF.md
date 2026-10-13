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

## Phase 2 — initial three-experience review (completed)

1. **What should I prioritize?** Open, enjoyable editorial reading with numbered tips, a real worked example, goal-sensitive explanation, optional detailed how-to, and a small inline priority tool.
2. **How can I fund my trip?** Same visual language but distinctly presented numerical example, confirmed vs pending funding, cash-timing worksheet, and concise procedures.
3. **My Conference** planning workspace. Should feel like the same product without forcing forms to look like articles. Preserve date-aware tasks, per-event data separation, sources, user-reported access statuses, editable templates, fixed appointments, private print controls and My Field Plan.

Render desktop and mobile screenshots for each and improve iteratively, not merely once.

## Phase 3 — approved rollout (authorized and implemented)

After reviewing the initial experiences and color alternatives, the user selected **Charcoal & teal** and instructed Codex to continue with the proposed rollout. This supersedes the original stop after Phase 2.

Extend the shared reading system to the other seven guides, preserving each approved example, detailed instruction, reference and optional tool. Apply the same typography and controls to the reading library, all four Templates, My Field Plan and Downloads. Preserve event-specific storage, template editing/copy/save and the existing private export choices. Record desktop/phone captures and check the actual app at six widths. Workbook integration, editorial synchronization and release QA remain separate work.

## Required design qualities

Phase 4 is authorized by the user's subsequent instruction to continue: integrate Letter/A4 PDFs and a fictional sample, establish a repeatable one-source build and connected editorial revision checks, and extend internal accessibility/print QA. The original v5 ZIP is unavailable locally; rebuilt artifacts use the approved snapshot. Preserve the draft-only/no-deployment boundary.

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

- The initial three surfaces plus the authorized rollout across the remaining guides, Templates, Field Plan and shared screens, using a maintainable component/style structure.
- Before/after desktop and mobile screenshots.
- Design tokens and reusable components documented.
- A brief architecture/build note, internal accessibility and responsiveness results, and remaining tasks.
- Explicit content/print parity check with `content/playbook-v1.3.snapshot.json`.

The initial product-review gate was satisfied by the user's palette selection and instruction to continue. The completed rollout remains in the existing draft PR for internal review; deployment and merging remain outside this assignment.
