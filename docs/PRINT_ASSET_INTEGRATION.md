# Asset and workbook integration

The v5 internal-review package includes two generated offline workbooks (US Letter and A4, 15 pages), a fictional two-page example field plan, Python source scripts and fixture tests.

**This initial GitHub branch commits the static v5 application, the embedded/extracted editorial snapshot, the design experiment and QA notes.** The downloadable binary PDF artifacts and their original generation scripts have **not yet been copied to GitHub**; they remain in the v5 review package supplied in the conversation. Don't infer that the repo currently regenerates PDFs by itself.

Next Codex task: import the reviewed `src/build_workbook.py`, `src/build_web.py` (as reference only), `src/create_snapshot.py`, fixture scenarios and validation scripts from that package, then wire both print sizes to `content/playbook-v1.3.snapshot.json`. Regenerate, compare text/source versions, and add CI print checks. Avoid committing source documents or third-party PDFs that are not owned by this project.

**Print privacy:** exclude private contact channels, token-bearing URLs, draft messages and personal funding figures by default. Only include them in a user's locally printed output following explicit opt-in.
