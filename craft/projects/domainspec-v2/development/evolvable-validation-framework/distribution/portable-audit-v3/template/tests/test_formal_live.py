#!/usr/bin/env python3
"""Real-provider acceptance and hostile-claim tests, using only a new synthetic workspace."""
import argparse
import copy
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
sys.dont_write_bytecode = True
KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT))
sys.path.insert(0, str(KIT / "tests"))
from failure_support import preserve_failure
import formal
from common import Invalid, data, digest, read, save

class RealFormalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        formal.core.check_kit()
        supplied_root = formal.core.workspace(ARGS.workspace)
        supplied_lock = read(formal.file(supplied_root, ARGS.tools))
        paths = formal.check_tools(supplied_root, supplied_lock)
        cls.temp = tempfile.TemporaryDirectory(prefix="evf-real-adapter-tests-")
        cls.root = Path(cls.temp.name) / "audit"
        shutil.copytree(KIT / "formal-example", cls.root)
        cls.tools = formal.tools_bind(cls.root, {n: str(p) for n, p in paths.items() if n in ("souffle", "alloy", "java", "cbmc", "lean", "cc", "tlc")}, True)["tools"]
        result, code = formal.run_formal(cls.root, "audit.json", cls.tools, True)
        if code:
            retained = preserve_failure(cls.root)
            raise RuntimeError("Real provider prerequisites/results did not pass; NOT skipped. Historical diagnostic copy: "
                               + str(retained) + "; " + json.dumps(result))
        cls.claim_path = Path(result["formal_claims"])
        cls.bundle = read(cls.claim_path)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def edited_bundle(self, name, edit):
        value = copy.deepcopy(self.bundle)
        edit(value)
        value.pop("bundle_digest")
        value["bundle_digest"] = digest(value)
        destination = self.root / name
        save(destination, value)
        return str(destination)

    def lean_spec(self, name, request_change=None, tools=None):
        spec = read(self.root / "audit.json")
        claim = copy.deepcopy(spec["claims"][-1])
        claim["id"] = name
        if request_change:
            request = read(self.root / claim["positive"])
            request_change(request)
            claim["positive"] = name + "-request.json"
            save(self.root / claim["positive"], request)
        spec["claims"] = [claim]
        destination = name + "-audit.json"
        save(self.root / destination, spec)
        return formal.run_formal(self.root, destination, tools or self.tools, True)

    def test_five_real_claims_and_raw_outputs_verify(self):
        result = formal.verify_formal(self.root, str(self.claim_path))
        self.assertEqual(result["claims_verified"], 5)
        self.assertFalse(result["whole_system_claim"])
        self.assertEqual(self.bundle["claims"][-1]["observed_details"]["axioms"], ["propext"])
        self.assertTrue(all(len(job["records"]) == 4 for job in self.bundle["jobs"]))

    def test_inflated_theorem_claim_is_rejected_even_with_new_bundle_digest(self):
        path = self.edited_bundle("inflated.json", lambda b: b["claims"][-1]["machine_property"].update(expected_type="False"))
        with self.assertRaises(Invalid): formal.verify_formal(self.root, path)

    def test_missing_raw_evidence_is_rejected(self):
        path = self.edited_bundle("missing-evidence.json", lambda b: b["jobs"][0]["records"].pop())
        with self.assertRaises(Invalid): formal.verify_formal(self.root, path)

    def test_changed_source_blocks_current_claim(self):
        path = self.root / "graph.json"
        original = path.read_bytes()
        try:
            path.write_bytes(original + b"\n")
            with self.assertRaises(Invalid): formal.verify_formal(self.root, str(self.claim_path))
        finally:
            path.write_bytes(original)

    def test_real_lean_wrong_theorem_type_does_not_issue_claim(self):
        result, code = self.lean_spec("wrong-type", lambda r: r["options"].update(expected_type="False"))
        self.assertEqual(code, 2)
        self.assertEqual(result["supported_claims"], 0)

    def test_real_lean_unapproved_standard_axiom_does_not_issue_claim(self):
        result, code = self.lean_spec("unapproved-axiom", lambda r: r["options"].update(allowed_axioms=[]))
        self.assertEqual(code, 2)
        self.assertEqual(result["supported_claims"], 0)

    def test_real_lean_placeholder_cannot_be_presented_as_a_proof(self):
        save_path = self.root / "Placeholder.lean"
        save_path.write_text("namespace EVF\ndef canonicalPair (a b : Nat) : Nat × Nat := (min a b, max a b)\ntheorem canonicalPair_comm (a b : Nat) : canonicalPair a b = canonicalPair b a := by sorry\nend EVF\n")
        result, code = self.lean_spec("placeholder", lambda r: r.update(source="Placeholder.lean"))
        self.assertEqual(code, 2)
        self.assertEqual(result["supported_claims"], 0)

    def test_missing_lean_runtime_is_not_evaluable(self):
        lock = read(self.root / self.tools)
        lock["tools"].pop("lean")
        name = "missing-lean-tools.json"
        save(self.root / name, lock)
        result, code = self.lean_spec("missing-runtime", tools=name)
        self.assertEqual(code, 2)
        self.assertEqual(result["supported_claims"], 0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--workspace", required=True, help="Existing workspace containing a verified tools manifest")
    parser.add_argument("--tools", required=True, help="Workspace-relative tools manifest")
    ARGS, remaining = parser.parse_known_args()
    unittest.main(argv=[sys.argv[0], *remaining], verbosity=2)
