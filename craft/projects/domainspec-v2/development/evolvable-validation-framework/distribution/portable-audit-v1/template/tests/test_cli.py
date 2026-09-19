#!/usr/bin/env python3
"""Real-process integration tests; no source repository, Cargo cache, or network needed."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
import uuid

KIT = Path(__file__).resolve().parents[1]


class PortableAuditTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        result = subprocess.run([sys.executable, str(KIT / "evf"), "doctor"], capture_output=True, text=True, timeout=60)
        if result.returncode:
            raise RuntimeError("Required execution platform unavailable; tests are NOT passing: " + result.stdout + result.stderr)
        cls.temporary = tempfile.TemporaryDirectory(prefix="evf-portable-tests-")
        cls.base = Path(cls.temporary.name)

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def cli(self, *args, code=0, env=None):
        result = subprocess.run([sys.executable, str(KIT / "evf"), *map(str, args)], capture_output=True,
                                text=True, timeout=60, env=env)
        self.assertEqual(result.returncode, code, result.stdout + result.stderr)
        return json.loads(result.stdout)

    def example(self):
        root = self.base / ("case-" + uuid.uuid4().hex)
        self.cli("init", root)
        self.cli("build-example", "--workspace", root)
        return root

    def change_spec(self, root, change):
        path = root / "audit.json"
        value = json.loads(path.read_text())
        change(value)
        path.write_text(json.dumps(value, indent=2) + "\n")

    def freeze(self, root):
        return self.cli("freeze", "--workspace", root)["profile"]

    def run_audit(self, root, profile, code=0):
        return self.cli("run", "--workspace", root, "--profile", profile, "--trust-local-providers", code=code)

    def test_pass_replay_and_independent_verification(self):
        root = self.example()
        profile = self.freeze(root)
        self.assertEqual(profile, self.freeze(root))
        first = self.run_audit(root, profile)
        evidence = Path(first["evidence"])
        original = evidence.read_bytes()
        result = self.cli("verify", "--workspace", root, "--evidence", evidence.relative_to(root))
        self.assertEqual(result["verdict"], "passed")
        self.assertEqual(result["aggregate_state"], "passed")
        second = self.run_audit(root, profile)
        self.assertNotEqual(first["run_path"], second["run_path"])
        self.assertEqual(first["evidence_payload_digest"], second["evidence_payload_digest"])
        self.assertEqual(original, evidence.read_bytes())

    def test_valid_evidence_can_describe_failed_positive_check(self):
        root = self.example()
        self.change_spec(root, lambda s: s["checks"][0]["expected"].update(cases=7))
        result = self.run_audit(root, self.freeze(root), code=1)
        self.assertEqual(result["status"], "failed")
        verified = self.cli("verify", "--workspace", root, "--evidence", result["evidence"])
        self.assertEqual(verified["verdict"], "passed")
        self.assertEqual(verified["aggregate_state"], "failed")

    def test_surviving_negative_control_fails_audit(self):
        root = self.example()
        self.change_spec(root, lambda s: s["checks"][0]["negative_controls"][0].update(input="positive.txt"))
        result = self.run_audit(root, self.freeze(root), code=1)
        self.assertEqual(result["status"], "failed")
        verified = self.cli("verify", "--workspace", root, "--evidence", result["evidence"])
        self.assertEqual(verified["aggregate_state"], "failed")

    def test_wrong_negative_reason_is_rejected_before_execution(self):
        root = self.example()
        self.change_spec(root, lambda s: s["checks"][0]["negative_controls"][0].update(reason_code="UNRELATED"))
        result = self.cli("freeze", "--workspace", root, code=2)
        self.assertIn("reason_code", result["reason"])
        self.assertFalse((root / ".evf-runs").exists())

    def test_missing_negative_control_is_rejected(self):
        root = self.example()
        self.change_spec(root, lambda s: s["checks"][0].update(negative_controls=[]))
        self.cli("freeze", "--workspace", root, code=2)

    def test_uncovered_obligation_is_rejected(self):
        root = self.example()
        self.change_spec(root, lambda s: s["obligations"].append("uncovered.requirement"))
        self.cli("freeze", "--workspace", root, code=2)

    def test_duplicate_check_is_rejected(self):
        root = self.example()
        self.change_spec(root, lambda s: s["checks"].append(dict(s["checks"][0])))
        self.cli("freeze", "--workspace", root, code=2)

    def test_source_drift_is_blocked(self):
        root = self.example()
        profile = self.freeze(root)
        with (root / "provider.c").open("a") as stream:
            stream.write("\n/* changed after freeze */\n")
        self.run_audit(root, profile, code=2)
        self.assertEqual(list((root / ".evf-runs").rglob("EVIDENCE.json")), [])

    def test_tampered_evidence_is_rejected(self):
        root = self.example()
        result = self.run_audit(root, self.freeze(root))
        original = Path(result["evidence"])
        # Preserve relative evidence references but change the saved aggregate in a copy.
        target = root / "tampered"
        shutil.copytree(original.parent, target)
        path = target / "EVIDENCE.json"
        value = json.loads(path.read_text())
        value["aggregate_state"] = "failed"
        path.write_text(json.dumps(value))
        self.cli("verify", "--workspace", root, "--evidence", path, code=2)

    def test_existing_workspace_and_binary_are_preserved(self):
        root = self.example()
        before = (root / "order-provider").read_bytes()
        self.cli("init", root, code=2)
        self.cli("build-example", "--workspace", root, code=2)
        self.assertEqual(before, (root / "order-provider").read_bytes())

    def test_external_source_symlink_is_rejected(self):
        root = self.example()
        outside = self.base / ("outside-" + uuid.uuid4().hex)
        outside.write_text("outside workspace")
        (root / "external.md").symlink_to(outside)
        self.change_spec(root, lambda s: s.update(sources=["external.md"]))
        self.cli("freeze", "--workspace", root, code=2)

    def test_trust_acknowledgement_is_required(self):
        root = self.example()
        profile = self.freeze(root)
        self.cli("run", "--workspace", root, "--profile", profile, code=2)
        self.assertFalse((root / ".evf-runs").exists())

    def test_duplicate_json_fields_are_rejected(self):
        root = self.example()
        path = root / "audit.json"
        path.write_text('{"audit_id":"duplicate",' + path.read_text()[1:])
        result = self.cli("freeze", "--workspace", root, code=2)
        self.assertIn("Duplicate JSON field", result["reason"])

    def test_missing_isolation_has_no_fallback(self):
        empty = self.base / ("empty-path-" + uuid.uuid4().hex)
        empty.mkdir()
        result = self.cli("doctor", code=2, env=dict(os.environ, PATH=str(empty)))
        self.assertIn("not found", result["reason"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
