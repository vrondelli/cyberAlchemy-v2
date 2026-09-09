#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


RUNTIME = Path(__file__).resolve().parents[1]
DURABLE = RUNTIME.parent
SPEC = importlib.util.spec_from_file_location("dst_runtime_validate", RUNTIME / "validate.py")
assert SPEC and SPEC.loader
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class ConformanceValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.durable = Path(self.tmp.name) / "durable-storage"
        shutil.copytree(DURABLE, self.durable, ignore=shutil.ignore_patterns("target", "__pycache__"))
        self.runtime = self.durable / "runtime"

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def result(self) -> dict[str, object]:
        return VALIDATOR.validate(self.runtime, run_commands=False)

    def assert_block(self, marker: str) -> None:
        result = self.result()
        self.assertEqual("BLOCK", result["result"])
        self.assertTrue(any(marker in error for error in result["errors"]), result["errors"])

    def test_exact_binding_baseline(self) -> None:
        self.assertEqual("PASS", self.result()["result"])

    def test_source_digest_drift_blocks(self) -> None:
        with (self.runtime / "src/lib.rs").open("a") as handle:
            handle.write("// drift\n")
        self.assert_block("implementation artifact digest drift: source")

    def test_system_ontology_drift_blocks(self) -> None:
        with (self.durable / "domainspec/generated/system-ontology.json").open("a") as handle:
            handle.write(" ")
        self.assert_block("bound predecessor digest drift: system_ontology")

    def test_proof_test_removal_blocks(self) -> None:
        path = self.runtime / "tests/durable_storage.rs"
        path.write_text(path.read_text().replace("fn exact_byte_roundtrip_requires_verified_retrieval(", "fn removed_test("))
        self.assert_block("proof test missing")

    def test_effect_self_promotion_blocks(self) -> None:
        path = self.runtime / "implementation-binding.json"
        value = json.loads(path.read_text())
        value["external_effect"] = "deployment"
        path.write_text(json.dumps(value))
        self.assert_block("effect ceiling drift")


if __name__ == "__main__":
    unittest.main()
