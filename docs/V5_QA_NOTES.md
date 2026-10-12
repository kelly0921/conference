# Conference Playbook v5 — Internal Integration & Print Review

**Date:** October 12, 2026  
**Version:** Editorial snapshot `1.3.0` / integrated HTML review build `v5`  
**Release status:** **INTERNAL REVIEW ONLY** — not hosted, not attendee-tested, no real AI.

## Start here

Open `conference-playbook-v5.html`. All PDFs are linked relatively, so keep them in the same folder. It is a static browser-local prototype with nine guides, stage-first navigation, editable resources, and separate conference plans. It does not automatically submit applications, confirm attendance, or contact people.

The printable files are:
- `conference-playbook-workbook-v5.pdf` — 15-page US Letter workbook, usable without a saved plan.
- `conference-playbook-workbook-v5-a4.pdf` — 15-page A4 version, built from the same source.
- `conference-playbook-sample-field-plan-v5.pdf` — two-page fictional GHC attendee example produced from the actual website print renderer. The invented company, roles, rooms, confirmations, and conversations are teaching data, **not real GHC opportunities**.

## One-source content pipeline

`playbook-content-v1.3.snapshot.json` is the frozen **structured editorial transcription** of the nine Notion v1.3 guides and four user-authored message-template families. It records the Notion source URL for every guide, the official source links and last-reviewed date, fictional examples, tool mapping and source hash.

The snapshot is the **only guide/template content input** used by:
- `src/build_web.py` → integrated HTML (`SNAPSHOT` embedded for offline browsing).
- `src/build_workbook.py` → both workbook PDF page sizes.
- `src/build_fixtures.py` → GHC, SHPE and AFROTECH fictional test records.

The **editable canonical editorial records remain in Notion**. This snapshot was reviewed and structured manually, not downloaded as byte-for-byte Notion Markdown. A fresh Notion edit still requires a new reviewed source freeze; automatic Notion-to-snapshot publishing is **not implemented**. Do not edit HTML and PDF guide prose separately.

Run from the `src` directory:

```bash
python create_snapshot.py
python build_web.py
python build_workbook.py
PLAYBOOK_PAPER=A4 python build_workbook.py
python build_fixtures.py
python ../tests/test_integration.py
python ../tests/validate_content.py
```

The source pack includes the V4 HTML baseline and the v1.3 source registry so these scripts can be rerun after extraction. A production repository should replace this single-file HTML patching step with modular, maintainable components and a Notion-backed editorial export.

## What works in v5

- **Nine v1.3 resources** in Before (4), During (3), After (2); short checks plus expandable detailed procedures, fictional examples, related official references.
- **Same content for the web and workbook**, with the original four template families shared.
- **Date-aware general task windows** and relevant access checks for recruiting versus building/learning. These are suggestions, **not organizer deadlines**.
- **Saved priorities with source URL and role/event ID**, action, question, status and backup. These appear in the copied and printed personal field plan.
- **Activity editor** for exact local date, start/end, IANA timezone, venue, buffer, source, access and confirmation reference; a tentative activity cannot be marked fixed without the attendee explicitly marking it confirmed.
- **Follow-up record** including context, next action, due date, optional private channel and completion.
- **Private-by-default field plan**: contact channels, full message drafts, financial totals and token-bearing access links stay excluded until deliberately selected. Copy and print use the same event-specific export sections.
- **Multiple plans** in one browser, plus an explicit opt-in import path for earlier V4 records. No automatic merge of different conferences.
- **Rules-based gap review** remains labeled non-AI. Everything works without a live model.

## Verification completed

- **120 / 120 in-memory Chromium checks passed**, covering all nine guides, stage navigation, templates, date/goal logic, access semantics, target editor and role ID, exact appointments, source/venue/timezone export, privacy toggles, event isolation, simulated browser-state reload, six responsive widths, and GHC/SHPE/AFROTECH fictional scenarios. No page JavaScript exceptions.
- **Content/publishing checks passed**: checksum consistency, nine unique guides, 4/3/2 distribution, four templates, related/source references, both 15-page PDF variants and no out-of-page text detected.
- **Printed personal field plan** was generated through the website itself from the fictional GHC test record and rendered visually. It spans two pages; private channel and funding are excluded by default.
- **Individual guide print** now expands detailed instructions; previously a print test revealed hidden quick-check text and collapsed instructions, both corrected.
- Official source links for GHC, AnitaB Talent Network, SHPE Career Services, and AFROTECH were re-opened on October 12, 2026. This does **not** establish any attendee's personal access or a particular job/RSVP.

## Still blocking production

1. **Real browser-origin localStorage after reload** could not be tested because the managed browser blocks normal localhost/file navigation. Tests use an in-memory storage shim; no real cloud sync exists. Test in the selected production domain.
2. **Screen reader, keyboard/focus, A4 print across real browsers** need deeper QA. The PDFs were checked as US Letter/A4 files, but that is not an assistive-technology audit.
3. **Automatic Notion export and release governance** remain to be built. Do not claim auto-sync from Notion; the snapshot is a reviewed frozen transcription.
4. **Fresh dynamic organizer data** and specific conference access conditions must be checked as part of a launch process. Current organizer URLs are reference links, not availability confirmations.
5. **International currency controls** remain basic: the budget interface displays USD by default even for custom non-US conferences; do not advertise full FX/currency support.
6. **Sensitive data and trust review**: local-only plan model is demonstrated but needs threat/privacy testing before a public hosted release.
7. **No external attendee feedback** until internal release-candidate QA is complete, per the project decision.

## Provenance

Canonical Notion registry: https://app.notion.com/p/3f7b144c6b99816285a3e00b9d81a596

Four template bank: https://app.notion.com/p/3f7b144c6b998111a9b6c04438a99a89

Worked examples: https://app.notion.com/p/3f7b144c6b998172b901ea6ed67941ce

Export/privacy contract: https://app.notion.com/p/3f7b144c6b998174aaa3e86cc0ec9cae

*User-authored Lite Kit and Monica's credited research informed the project. No third-party PDF has been republished inside these deliverables.*