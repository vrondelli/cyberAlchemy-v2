import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from validate_candidate import CANDIDATE, ROOT, evaluate


class CandidateTests(unittest.TestCase):
    def test_current_candidate_is_deterministic_and_does_not_change_admission(self):
        decision = ROOT / "decisions/ontology-admission.json"
        before = decision.read_bytes()
        first = evaluate()
        self.assertEqual("PASS", first["status"], first["errors"])
        self.assertEqual(first, evaluate())
        self.assertEqual("none", first["authority_effect"])
        self.assertEqual("required-new-exact-epoch", first["owner_decision"])
        self.assertEqual(before, decision.read_bytes())

    def test_parent_tampering_blocks_and_changes_material_digest(self):
        candidate = json.loads(CANDIDATE.read_text())
        source = next(s for s in candidate["sources"] if s["id"] == "SRC-KEP-PARENT-PRODUCT-THESIS")
        source["sha256"] = "0" * 64
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sources.json"
            path.write_text(json.dumps(candidate))
            result = evaluate(path)
        self.assertEqual("BLOCK", result["status"])
        self.assertIn("source digest drift: SRC-KEP-PARENT-PRODUCT-THESIS", result["errors"])
        self.assertNotEqual(evaluate()["material_digest"], result["material_digest"])
