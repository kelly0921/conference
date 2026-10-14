# Reviewed content to web and print

The approved `content/playbook-v1.3.snapshot.json` remains the only guide/template content input. It is a reviewed structured transcription of Notion, not a byte-for-byte copy. Its checksum remains `86a937b8c8af0f2f1529d10c44055c2ccc0d73c8fa829fd6c8208ae2a0cd7ca5`.

## Repeatable local build

Install development dependencies and run from the repository root:

```sh
python -m pip install -r requirements-print.txt
python scripts/build.py
python scripts/build.py --check
python scripts/validate_print.py
python -m unittest discover -s tests -v
node --test tests/runtime.test.cjs
```

`build.py` validates the source checksum and structure, embeds the exact source into `index.html`, updates local asset versions, and generates all three PDFs plus `output/pdf/manifest.json`. `--check` rebuilds into isolated workspace staging and compares committed bytes without changing them. Line-ending normalization keeps asset versions consistent on Windows and Linux. The static site needs no packages or build step to serve committed files.

The manifest records version, source digest, paper sizes/page counts and artifact hashes. Both workbooks have fifteen pages: contents, nine complete guides, four templates and a blank Field Plan. The fictional sample now fits on one page. `sample_plan.cjs` feeds frozen Jordan records to the actual `exportSections` and `fieldPlanText` functions in an isolated runtime; it never reads browser storage. ReportLab typesets the output. This is not a browser Print-dialog capture.

## Connected Notion revision check

`content/editorial-source-lock.json` records revisions/body hashes for fourteen canonical sources: nine guides, templates, registry, examples, export contract and official-source finder. The connected Notion tool fetched them on October 13. No truncation flags or unknown-block markers were reported; expected source bodies/revisions were present. Four template bodies match exactly. Guide prose remains the previously reviewed structured transcription.

For a fresh check, fetch every URL in the lock through the connected Notion tool and save an ignored staging export under `.qa-cache/`:

```json
{
  "exportedAt": "UTC timestamp",
  "provider": "Notion connector",
  "pages": [{
    "id": "canonical page URL",
    "pageLastEditedAt": "Notion revision timestamp",
    "truncated": false,
    "unknownBlockCount": 0,
    "content": "complete content body, excluding ancestry/properties"
  }]
}
```

Preserve unavailable completeness fields as `null`; do not invent a reported zero. Explicit truncation, unknown blocks, missing bodies/revisions/pages or changed template text fail the audit.

```sh
python scripts/editorial_audit.py .qa-cache/notion-editorial-export.json
```

The audit reports source changes without altering copy. Internal editorial notes are excluded from guide hashes. Raw exports are ignored staging files, not another manuscript or a committed copy of private project metadata.

For changed sources, reconcile the structured fields in a new reviewed version, recompute its canonical checksum, update source-path/parity expectations, then rebuild all outputs together. Record the reviewed revisions with `editorial_audit.py --write-lock` and inspect the PR's content/PDF differences. Automatic semantic Notion-to-JSON transcription, scheduled sync and public publishing are not implemented.

## Checks and limits

CI verifies content/runtime behavior, audit safeguards, reproducible artifacts, full PDF text parity, page bounds/sizes, bookmarks and sample/export consistency. Poppler renders support separate visual review. PDFs now include semantic tags, logical reading order, language, annotated source links and embedded Unicode-mapped fonts; no PDF/UA or WCAG certification is claimed. Actual screen-reader review, browser Print dialogs, physical printers, production-origin storage and organizer freshness remain release QA. See [the current planner/release evidence](PLANNER_RELEASE_QA_2026-10-13.md).
