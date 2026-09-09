from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("are_ontology_validate", PACKAGE_ROOT / "scripts/validate.py")
assert SPEC and SPEC.loader
VALIDATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATE)


def load(name: str):
    return json.loads((PACKAGE_ROOT / name).read_text(encoding="utf-8"))


class NegativeMutationTests(unittest.TestCase):
    def test_rejects_unclosed_business_relation(self):
        business = load("business-ontology.json")
        business["relations"][0]["target"] = "CA2-ARE-MISSING"
        result = VALIDATE.evaluate(business=business, verify_generated_artifacts=False)
        self.assertEqual(result["status"], "BLOCK")
        self.assertTrue(any("business relation endpoint" in item for item in result["errors"]))

    def test_rejects_unsupported_bounded_realization(self):
        bridge = load("bridge.json")
        edge = next(item for item in bridge["edges"] if item["realization_status"] == "bounded-realization")
        edge["evidence_refs"] = ["CAP-SEL-ARE-SPEC"]
        result = VALIDATE.evaluate(bridge=bridge, verify_generated_artifacts=False)
        self.assertEqual(result["status"], "BLOCK")
        self.assertTrue(any("bounded realization lacks implementation evidence" in item for item in result["errors"]))

    def test_rejects_selected_source_drift(self):
        sources = load("sources.json")
        sources = copy.deepcopy(sources)
        sources["sources"][0]["sha256"] = "0" * 64
        result = VALIDATE.evaluate(sources=sources, verify_generated_artifacts=False)
        self.assertEqual(result["status"], "BLOCK")
        self.assertTrue(any("source digest drift" in item for item in result["errors"]))

    def test_rejects_benchmark_score_drift(self):
        scorecard = load("benchmark-scorecard.json")
        scorecard = copy.deepcopy(scorecard)
        row = next(item for item in scorecard["rows"] if item["row_id"] == "ARE-SCORE-REQUEST-CONTEXT")
        row["bindings"][0]["expected"] = 0.5
        result = VALIDATE.evaluate(scorecard=scorecard, verify_generated_artifacts=False)
        self.assertEqual(result["status"], "BLOCK")
        self.assertTrue(any("metric drift" in item for item in result["errors"]))

    def test_rejects_hidden_unmeasured_retrieval_surface(self):
        scorecard = load("benchmark-scorecard.json")
        scorecard = copy.deepcopy(scorecard)
        scorecard["unscored_surfaces"] = []
        result = VALIDATE.evaluate(scorecard=scorecard, verify_generated_artifacts=False)
        self.assertEqual(result["status"], "BLOCK")
        self.assertTrue(any("unmeasured full retrieval surface" in item for item in result["errors"]))

    def test_rejects_unclosed_bridge_system_endpoint(self):
        bridge = load("bridge.json")
        bridge["edges"][0]["target"] = "agent-reasoning-engine.Missing"
        result = VALIDATE.evaluate(bridge=bridge, verify_generated_artifacts=False)
        self.assertEqual(result["status"], "BLOCK")
        self.assertTrue(any("bridge system endpoint" in item for item in result["errors"]))


if __name__ == "__main__":
    unittest.main()
