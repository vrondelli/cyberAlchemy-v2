from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from identity import IdentityError, canonical_digest, exact_ref, verify_exact_ref


class IdentityTests(unittest.TestCase):
    def test_exact_ref_round_trip_and_drift(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / ".git").mkdir()
            target = root / "value.json"
            target.write_text('{"b":2,"a":1}\n', encoding="utf-8")
            reference = exact_ref(root, target)
            self.assertEqual(verify_exact_ref(root, reference), target)
            target.write_text("{}\n", encoding="utf-8")
            with self.assertRaisesRegex(IdentityError, "digest mismatch"):
                verify_exact_ref(root, reference)

    def test_canonical_digest_ignores_object_order(self) -> None:
        self.assertEqual(canonical_digest({"a": 1, "b": 2}), canonical_digest({"b": 2, "a": 1}))

    def test_path_escape_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaisesRegex(IdentityError, "unsafe"):
                verify_exact_ref(root, {"path": "../escape", "sha256": "0" * 64, "size_bytes": 0})


if __name__ == "__main__":
    unittest.main()
