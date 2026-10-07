#!/usr/bin/env python3
"""Hostile controls for the current Auth service/evidence/D65 sidecar DAG."""

from __future__ import annotations

import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate-current-trusted-input-successor-v1.py")
SPEC = importlib.util.spec_from_file_location("auth_current_trusted_successor", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CurrentTrustedInputSuccessorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.trusted = MODULE.load_trusted()
        self.old = MODULE.predecessor_objects()
        self.new = {path: json.loads(MODULE.regular_bytes(path)) for path in (
            self.trusted.CURRENT_SERVICE, self.trusted.CURRENT_EVIDENCE,
            self.trusted.CURRENT_CHAIN)}
        self.trusted.VIRTUAL_ARTIFACTS.clear()
        self.trusted.VIRTUAL_ARTIFACTS.update({
            path: MODULE.regular_bytes(path) for path in self.new})

    def test_exact_reviewed_dag_and_frozen_predecessors(self) -> None:
        MODULE.check_deltas(self.old, self.new, self.trusted)
        self.assertEqual(len(MODULE.PREDECESSORS), 3)
        self.assertFalse(self.new[self.trusted.CURRENT_SERVICE]["runtime_guarantees_observed"])
        self.assertFalse(self.new[self.trusted.CURRENT_CHAIN]["runtime_guarantees_observed"])

    def test_source_test_census_and_claim_mutants_fail_closed(self) -> None:
        changed = copy.deepcopy(self.new)
        changed[self.trusted.CURRENT_SERVICE]["selected_admission_service"]["sha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "admission source delta"):
            MODULE.check_deltas(self.old, changed, self.trusted)
        changed = copy.deepcopy(self.new)
        names = changed[self.trusted.CURRENT_EVIDENCE]["verification"]["admission_service_test_names"]
        names.remove(MODULE.NEW_ROUTE_TEST)
        with self.assertRaisesRegex(ValueError, "admission test census"):
            MODULE.check_deltas(self.old, changed, self.trusted)
        changed = copy.deepcopy(self.new)
        changed[self.trusted.CURRENT_CHAIN]["runtime_guarantees_observed"] = True
        with self.assertRaisesRegex(ValueError, "more than reviewed D65 references|claim ceiling"):
            MODULE.check_deltas(self.old, changed, self.trusted)

    def test_predecessor_and_stage_reference_mutants_fail_closed(self) -> None:
        changed = copy.deepcopy(self.new)
        changed[self.trusted.CURRENT_SERVICE]["predecessor"]["sha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "service predecessor link"):
            MODULE.check_deltas(self.old, changed, self.trusted)
        changed = copy.deepcopy(self.new)
        stage = next(row for row in changed[self.trusted.CURRENT_CHAIN]["stages"]
                     if row["stage"] == "authorization_service_implementation")
        stage["path"] = "implementation/standard-conformance/authorization-service-binding.json"
        with self.assertRaisesRegex(ValueError, "D65 current authorization_service_implementation link"):
            MODULE.check_deltas(self.old, changed, self.trusted)

    def test_regular_input_rejects_symlink_and_escape(self) -> None:
        with tempfile.TemporaryDirectory(dir=MODULE.AUTH) as directory:
            link = Path(directory) / "link.json"
            link.symlink_to(self.trusted.CURRENT_SERVICE)
            with self.assertRaisesRegex(ValueError, "symlinked"):
                MODULE.regular_bytes(link)
        with tempfile.TemporaryDirectory() as directory:
            external = Path(directory) / "outside.json"
            external.write_text("{}", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "escapes Auth root"):
                MODULE.regular_bytes(external)

    def test_stored_byte_identity_matters_for_dag_hashes(self) -> None:
        service = self.trusted.CURRENT_SERVICE
        original = self.trusted.VIRTUAL_ARTIFACTS[service]
        changed = original + b" \n"
        self.assertEqual(json.loads(changed), json.loads(original))
        self.assertNotEqual(changed, original)
        self.assertNotEqual(MODULE.sha(changed), MODULE.sha(original))
        duplicate_key = original.replace(b'"schema_version":',
                                         b'"schema_version": "forged", "schema_version":', 1)
        self.assertEqual(json.loads(duplicate_key), json.loads(original))
        self.assertNotEqual(duplicate_key, original)
        self.assertNotEqual(MODULE.sha(duplicate_key), MODULE.sha(original))
        with tempfile.TemporaryDirectory(dir=MODULE.AUTH) as directory:
            path = Path(directory) / "service.json"
            path.write_bytes(original)
            MODULE.checked_exact_sidecar(path, original)
            for mutant in (changed, duplicate_key):
                path.write_bytes(mutant)
                with self.assertRaisesRegex(ValueError, "sidecar differs from replay"):
                    MODULE.checked_exact_sidecar(path, original)

    def test_legacy_write_switch_cannot_overwrite_predecessors(self) -> None:
        before = {path: MODULE.sha(MODULE.regular_bytes(path)) for path in MODULE.PREDECESSORS}
        with self.assertRaisesRegex(AssertionError, "historical trusted-input receipts are frozen"):
            self.trusted.validate(True, [])
        result = subprocess.run(
            [sys.executable, str(self.trusted.SCRIPT), "--write-receipt"],
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn("historical trusted-input receipts are frozen", result.stdout)
        parent = subprocess.run(
            [sys.executable, str(self.trusted.IMPLEMENTATION / "scripts/validate.py"),
             "--write-receipt"],
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(parent.returncode, 1)
        self.assertIn("historical Auth receipts are frozen", parent.stdout)
        self.assertEqual(
            before, {path: MODULE.sha(MODULE.regular_bytes(path)) for path in MODULE.PREDECESSORS})


if __name__ == "__main__":
    unittest.main()
