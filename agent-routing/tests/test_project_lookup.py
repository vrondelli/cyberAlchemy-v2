#!/usr/bin/env python3
"""Product examples and hostile inputs for user-cited source lookup."""

import copy
import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("lookup", PACKAGE_ROOT / "scripts/locate.py")
assert SPEC and SPEC.loader
LOOKUP = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(LOOKUP)
LIVE_INDEX = json.loads((PACKAGE_ROOT / "project-index.json").read_text())


class ProjectLookupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.index = copy.deepcopy(LIVE_INDEX)
        for entry in self.index["entries"]:
            (self.root / entry["root"]).mkdir(parents=True, exist_ok=True)
            for source in entry["sources"]:
                path = self.root / source["path"]
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(source["path"])
                source["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()

    def lookup(self, query):
        return LOOKUP.locate(query, self.index, self.root)

    def test_actual_user_citations(self):
        for name, status in [("alchLang", "resolved"), ("KEP", "resolved"), ("agent runtime", "ambiguous")]:
            with self.subTest(name=name):
                result = LOOKUP.locate(name, LIVE_INDEX)
                self.assertEqual(result["status"], status, result)

    def test_aliases_and_identity(self):
        for name in ["Knowledge Expansion Protocol", "CyberAlchemy Exchange", "CA2-PROJECT-KNOWLEDGE-EXCHANGE-SOLANA-PROOF", "  kep  "]:
            self.assertEqual(self.lookup(name)["matches"][0]["entry_id"], "kep")
        self.assertEqual(self.lookup("ESSAYS-AGENT-RUNTIME")["status"], "resolved")

    def test_ambiguity_not_first_match(self):
        result = self.lookup("agent run time")
        self.assertEqual(result["status"], "ambiguous")
        self.assertEqual({m["entry_id"] for m in result["matches"]}, {"essays-agent-runtime", "are-coding-agent-runtime"})

    def test_unknown_and_substrings_require_discovery(self):
        for query in ["no-such-project", "agent", "lang"]:
            result = self.lookup(query)
            self.assertEqual(result["status"], "not_found")
            self.assertIn("discovery before asking", result["next_action"])

    def test_empty_query(self):
        self.assertEqual(self.lookup("---")["status"], "not_evaluable")

    def test_selected_drift_and_missing_source(self):
        source = self.index["entries"][0]["sources"][0]
        path = self.root / source["path"]
        path.write_text("drift")
        self.assertEqual(self.lookup("alchLang")["status"], "not_evaluable")
        path.unlink()
        self.assertEqual(self.lookup("alchLang")["status"], "not_evaluable")

    def test_unrelated_drift_does_not_block(self):
        source = self.index["entries"][1]["sources"][0]
        (self.root / source["path"]).unlink()
        self.assertEqual(self.lookup("alchLang")["status"], "resolved")

    def test_stale_candidate_does_not_disappear(self):
        entry = next(e for e in self.index["entries"] if e["entry_id"] == "essays-agent-runtime")
        (self.root / entry["sources"][0]["path"]).unlink()
        result = self.lookup("agent runtime")
        self.assertEqual(result["status"], "not_evaluable")
        self.assertEqual(len(result["matches"]), 2)

    def test_path_escape_and_public_sources(self):
        for bad in ["../secret", "/etc/passwd", "arcanum/README.md", ".git/config", "a/../../secret", "a\\secret"]:
            with self.subTest(path=bad):
                self.index["entries"][0]["root"] = bad
                self.assertEqual(self.lookup("alchLang")["status"], "not_evaluable")

    def test_symlink_escape(self):
        source = self.index["entries"][0]["sources"][0]
        path = self.root / source["path"]
        path.unlink()
        path.symlink_to("/etc/passwd")
        self.assertEqual(self.lookup("alchLang")["status"], "not_evaluable")

    def test_invalid_index_and_unpinned_reads(self):
        self.index["entries"][0]["read_first"].append("unbound.json")
        self.assertEqual(self.lookup("alchLang")["status"], "not_evaluable")
        self.index["entries"][0]["sources"] = "malformed"
        self.assertEqual(self.lookup("alchLang")["status"], "not_evaluable")

    def test_authority_and_duplicate_id_mutations(self):
        self.index["authority_effect"] = "admit"
        self.assertEqual(self.lookup("KEP")["status"], "not_evaluable")
        self.index["authority_effect"] = "none"
        self.index["entries"].append(copy.deepcopy(self.index["entries"][0]))
        self.assertEqual(self.lookup("KEP")["status"], "not_evaluable")

    def test_deterministic_and_read_only(self):
        def snapshot():
            return {str(p.relative_to(self.root)): p.read_bytes() for p in self.root.rglob("*") if p.is_file()}
        before = snapshot()
        first = self.lookup("KEP")
        self.assertEqual(first, self.lookup("KEP"))
        self.assertEqual(before, snapshot())
        self.assertEqual(first["authority_effect"], "none")


if __name__ == "__main__":
    unittest.main()
