"""Check that the static V5 prototype and the exported v1.3 content agree.

Uses only Python's standard library. It does not assert production readiness.
"""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ContentSnapshotTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.data = json.loads(
            (ROOT / "content" / "playbook-v1.3.snapshot.json").read_text(encoding="utf-8")
        )

    def test_embedded_snapshot_matches_export(self):
        m = re.search(r"const SNAPSHOT=(\{.*?\});\s*const GUIDES=", self.html, re.S)
        self.assertIsNotNone(m, "V5 embedded snapshot is missing")
        self.assertEqual(json.loads(m.group(1)), self.data)

    def test_expected_guide_count_and_stages(self):
        guides = self.data["guides"]
        self.assertEqual(len(guides), 9)
        self.assertEqual(len({g["id"] for g in guides}), 9)
        counts = {k: sum(g["stage"] == k for g in guides) for k in ("before", "during", "after")}
        self.assertEqual(counts, {"before": 4, "during": 3, "after": 2})

    def test_templates_and_links(self):
        self.assertEqual(set(self.data["templates"]), {"funding", "pre", "follow", "recap"})
        ids = {g["id"] for g in self.data["guides"]}
        for g in self.data["guides"]:
            self.assertTrue(g["purpose"])
            self.assertTrue(g["checks"])
            self.assertTrue(g["notionSource"].startswith("https://app.notion.com/"))
            self.assertTrue(set(g.get("related", [])) <= ids)

    def test_review_not_claimed_production(self):
        self.assertEqual(self.data["snapshotVersion"], "1.3.0")
        self.assertIn("internal", self.data["contentStatus"].lower())


if __name__ == "__main__":
    unittest.main()
