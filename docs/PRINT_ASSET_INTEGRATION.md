# Workbook and sample integration

Generated files now live in `output/pdf/` and are linked from guides, library, Templates and Downloads: fifteen-page Letter and A4 workbooks, plus a one-page fictional Jordan Field Plan populated by the application's exporter.

The original v5 ZIP/generators were described in the earlier ChatGPT conversation but were unavailable in this workspace or Notion attachments. These are rebuilt artifacts from the unchanged approved JSON and selected Charcoal & teal design. The original two-page sample in `V5_QA_NOTES.md` is historical; recovery of its binaries/scripts is not claimed.

`scripts/build.py` regenerates the web snapshot, asset versions, PDFs and manifest. `scripts/validate_print.py` checks full guide/template text, dimensions/bounds, bookmarks and the sample's exported role/source/time/venue fields. Both paper sizes and the sample were rendered and inspected. Actual browser downloads returned hashes matching the generated artifacts.

**Print privacy:** the sample uses only frozen fictional records in an isolated runtime. Personal exports still exclude private contact channels, token-bearing URLs, drafts and financial figures by default. Browser page CSS now respects the chosen paper size instead of forcing Letter.

See [build/source workflow](CONTENT_PIPELINE.md) and [QA/limits](PRINT_PIPELINE_QA.md). Tagged-PDF accessibility and cross-browser Print dialogs still need dedicated review.
