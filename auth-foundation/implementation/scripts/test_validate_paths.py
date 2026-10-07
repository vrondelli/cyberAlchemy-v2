#!/usr/bin/env python3
"""Standalone path and archival-replay checks for the Auth validator."""

import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().with_name("validate.py")
SPEC = importlib.util.spec_from_file_location("auth_validate", SCRIPT)
assert SPEC and SPEC.loader
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


class StandaloneValidatorPaths(unittest.TestCase):
    def test_checkout_paths_exist(self):
        self.assertEqual(validator.REPOSITORY, validator.AUTH_ROOT.parent)
        self.assertTrue(validator.CLI.is_file())
        self.assertTrue(Path(validator.TSX).is_file())
        self.assertTrue((validator.REPOSITORY / "capability/schemas/capability.schema.json").is_file())

    def test_known_historical_ids_map_without_changing_receipt(self):
        receipt = json.loads(validator.INSTANTIATION_RECEIPT.read_text())
        for key in ("provider", "binding"):
            record = receipt["selected_realization"][key]
            logical = record["path"]
            self.assertTrue(logical.startswith("projects/domainspec-v2/"))
            physical = validator.local_repository_path(logical)
            self.assertTrue(physical.is_file())
            self.assertEqual(hashlib.sha256(physical.read_bytes()).hexdigest(), record["sha256"])
            self.assertEqual(record["path"], logical)
        self.assertEqual(len(validator.RETIRED_ARTIFACTS), 29)
        for logical in validator.RETIRED_ARTIFACTS:
            self.assertFalse(validator.local_repository_path(logical).exists(), logical)

    def test_unknown_and_escaping_paths_rejected(self):
        for logical in ("../escape", "/etc/passwd", "projects/auth-foundation/../escape",
                        "projects/domainspec-v2//escape", "projects/other/file"):
            with self.subTest(logical=logical), self.assertRaises(ValueError):
                validator.local_repository_path(logical)
        with tempfile.TemporaryDirectory(dir=validator.temporary_root()) as directory:
            link = validator.AUTH_ROOT / "implementation/scripts/test-path-escape-link"
            try:
                link.symlink_to(directory, target_is_directory=True)
                with self.assertRaises(ValueError):
                    validator.local_repository_path("projects/auth-foundation/implementation/scripts/test-path-escape-link/file")
            finally:
                link.unlink(missing_ok=True)

    def test_archival_replay_matches_pinned_evidence(self):
        result = validator.command([str(validator.NODE), str(validator.COMMAND_BOUNDARY_TDE_REPLAY)])
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["historical_v2_bytes"], "unchanged")
        self.assertEqual(payload["evidence_sha256"], validator.digest(validator.COMMAND_BOUNDARY_TDE))


if __name__ == "__main__":
    unittest.main()
