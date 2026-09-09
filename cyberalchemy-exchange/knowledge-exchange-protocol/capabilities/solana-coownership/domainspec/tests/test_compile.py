from __future__ import annotations

import copy
import importlib.util
import unittest
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("solana_domainspec_compile", PACKAGE_ROOT / "compile.py")
assert SPEC and SPEC.loader
COMPILER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(COMPILER)


class DeterministicCompilationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.outputs = COMPILER.build_outputs()

    def test_two_builds_are_byte_identical(self) -> None:
        second = COMPILER.build_outputs()
        self.assertEqual(self.outputs, second)

    def test_outputs_have_closed_candidate_ceiling(self) -> None:
        for name in ["compiled-graph.json", "system-ontology.json", "compilation-receipt.json"]:
            value = COMPILER.json.loads(self.outputs[name])
            self.assertEqual("none", value["authority_effect"])
        system = COMPILER.json.loads(self.outputs["system-ontology.json"])
        self.assertEqual("candidate", system["lifecycle_status"])
        self.assertEqual("not_evaluable", system["boundaries"]["external_durable_storage"]["realization_state"])

    def test_admission_digest_mismatch_fails_closed(self) -> None:
        admission = COMPILER.load_json(COMPILER.ADMISSION_PATH)
        preflight = COMPILER.run_source_preflight(PACKAGE_ROOT)
        drifted = copy.deepcopy(preflight)
        drifted["candidate_material_digest"] = "0" * 64
        with self.assertRaisesRegex(COMPILER.CompileError, "admitted candidate material digest"):
            COMPILER.verify_admission_contract(admission, COMPILER.sha256_file(PACKAGE_ROOT / "binding.json"), drifted)


if __name__ == "__main__":
    unittest.main()
