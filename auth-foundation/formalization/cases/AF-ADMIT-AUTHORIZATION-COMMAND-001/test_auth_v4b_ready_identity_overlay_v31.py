#!/usr/bin/env python3
"""Fast shape and synthetic-MIR controls; run V31 CLI for compiled roots."""

import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("auth-v4b-ready-identity-overlay-v31.py")
SPEC = importlib.util.spec_from_file_location("auth_v31_identity_overlay", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
v31 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v31)


class ReadyIdentityOverlayTests(unittest.TestCase):
    def test_mutation_is_exact_and_mirror_only(self) -> None:
        with tempfile.TemporaryDirectory(prefix="auth-v31-source-test-") as temporary:
            implementation = Path(temporary)
            path = implementation / v31.AUTHORITY
            path.parent.mkdir(parents=True)
            path.write_text(v31.MARKER + "\n" + v31.MARKER)
            with self.assertRaisesRegex(ValueError, "source changed"):
                v31.mutate(implementation)
            path.write_text("prefix\n" + v31.MARKER + "\nsuffix\n")
            v31.mutate(implementation)
            self.assertEqual(path.read_text(), "prefix\n" + v31.MUTANT + "\nsuffix\n")

    def test_independent_mir_projection_rejects_request_id(self) -> None:
        original = v31.v11.authority_mir()
        source = "_53 = &((*_2).0: std::string::String);"
        mutant = "_53 = &((*_2).2: std::string::String);"
        self.assertEqual(original.count(source), 1)
        with self.assertRaisesRegex(ValueError, "wrong-request projection missing"):
            v31.wrong_request_projection(original)
        result = v31.wrong_request_projection(original.replace(source, mutant, 1))
        self.assertTrue(result["route_id_field_projection_to_command"])
        self.assertFalse(result["request_id_field_projection_to_command"])


if __name__ == "__main__":
    unittest.main()
