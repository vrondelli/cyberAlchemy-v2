#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("dst_domainspec_compile", ROOT / "compile.py")
assert SPEC and SPEC.loader
COMPILER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(COMPILER)


class CompilerTests(unittest.TestCase):
    def test_outputs_are_deterministic(self) -> None:
        self.assertEqual(COMPILER.build(), COMPILER.build())

    def test_system_ontology_is_provider_neutral(self) -> None:
        value = json.loads(COMPILER.build()["system-ontology.json"])
        self.assertEqual("none", value["provider_selection"])
        self.assertEqual(27, len(value["systems"]))
        self.assertEqual(21, len(value["relations"]))

    def test_receipt_binds_every_output(self) -> None:
        outputs = COMPILER.build()
        receipt = json.loads(outputs["compilation-receipt.json"])
        for item in receipt["outputs"]:
            self.assertEqual(item["sha256"], COMPILER.sha_bytes(outputs[item["path"]]))

    def test_source_drift_blocks_admitted_compilation(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            copied = Path(temporary) / "domainspec"
            shutil.copytree(ROOT, copied)
            path = copied / "specs/durable-storage/nodes/byte-identity.json"
            value = json.loads(path.read_text())
            value["body"]["description"] += " changed"
            path.write_text(json.dumps(value))
            with self.assertRaisesRegex(COMPILER.CompileError, "admitted source material digest drift"):
                COMPILER.build(copied)

    def test_admission_binding_drift_blocks(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            copied = Path(temporary) / "domainspec"
            shutil.copytree(ROOT, copied)
            path = copied / "binding.json"
            value = json.loads(path.read_text())
            value["claim_ceiling"] += " changed"
            path.write_text(json.dumps(value))
            with self.assertRaisesRegex(COMPILER.CompileError, "admitted binding digest drift"):
                COMPILER.build(copied)


if __name__ == "__main__":
    unittest.main()
