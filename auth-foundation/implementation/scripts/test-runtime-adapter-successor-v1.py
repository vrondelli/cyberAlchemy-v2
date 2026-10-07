#!/usr/bin/env python3
"""Fast hostile controls for the versioned compatibility-adapter evidence."""

import importlib.util
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("validate-runtime-adapter-successor-v1.py")
SPEC = importlib.util.spec_from_file_location("auth_adapter_successor_v1", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class AdapterSuccessorTests(unittest.TestCase):
    def test_historical_runtime_preimage_is_preserved(self) -> None:
        self.assertEqual(len(MODULE.historical_preimages()), 9)

    def test_current_feature_boundary_is_default_off(self) -> None:
        result = MODULE.feature_boundary()
        self.assertEqual(result["default_raw_decision_exports"], "absent")
        self.assertEqual(result["explicit_opt_in_feature"], "legacy-raw-decision")

    def test_removed_feature_gate_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory(prefix="auth-adapter-successor-") as directory:
            adapter = Path(directory)
            for relative in ("Cargo.toml", "src/lib.rs", "tests/adapter.rs"):
                source = MODULE.ADAPTER / relative
                destination = adapter / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, destination)
            rust = adapter / "src/lib.rs"
            rust.write_text(rust.read_text().replace(
                '#[cfg(feature = "legacy-raw-decision")]\nmod legacy', 'mod legacy', 1))
            with patch.object(MODULE, "ADAPTER", adapter):
                with self.assertRaisesRegex(ValueError, "raw export gating changed"):
                    MODULE.feature_boundary()


if __name__ == "__main__":
    unittest.main()
