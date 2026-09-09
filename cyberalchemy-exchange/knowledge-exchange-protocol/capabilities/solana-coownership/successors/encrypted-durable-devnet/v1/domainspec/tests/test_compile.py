from __future__ import annotations

import copy
import importlib.util
import json
import unittest
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("kep_sol2_domainspec_compile", PACKAGE_ROOT / "compile.py")
assert SPEC and SPEC.loader
COMPILER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(COMPILER)


class DeterministicCompilationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.outputs = COMPILER.build_outputs()

    def test_two_builds_are_byte_identical(self) -> None:
        self.assertEqual(self.outputs, COMPILER.build_outputs())

    def test_outputs_have_closed_candidate_ceiling(self) -> None:
        for name in ["compiled-graph.json", "system-ontology.json", "compilation-receipt.json"]:
            value = json.loads(self.outputs[name])
            self.assertEqual("none", value["authority_effect"])
            self.assertEqual("none", value.get("external_effect", "none"))
        system = json.loads(self.outputs["system-ontology.json"])
        self.assertEqual("candidate", system["lifecycle_status"])
        self.assertEqual("not-authorized-by-this-candidate", system["successor_authorization"]["system_ontology_admission"])

    def test_admission_digest_mismatch_fails_closed(self) -> None:
        admission = COMPILER.load_json(COMPILER.ADMISSION_PATH)
        preflight = COMPILER.run_source_preflight(PACKAGE_ROOT)
        drifted = copy.deepcopy(preflight)
        drifted["candidate_material_digest"] = "0" * 64
        with self.assertRaisesRegex(COMPILER.CompileError, "admitted candidate material digest"):
            COMPILER.verify_admission_contract(admission, COMPILER.sha256_file(PACKAGE_ROOT / "binding.json"), drifted)

    def test_all_business_relations_survive_reverse_projection(self) -> None:
        binding = COMPILER.load_json(PACKAGE_ROOT / "binding.json")
        graph = json.loads(self.outputs["compiled-graph.json"])
        observed = {
            relation_id
            for edge in graph["edges"]
            for relation_id in edge["semantic_bindings"]["ontology_relation_ids"]
        }
        self.assertEqual(set(binding["ontology_relation_mappings"]), observed)

    def test_all_proof_obligations_remain_not_evaluable(self) -> None:
        binding = COMPILER.load_json(PACKAGE_ROOT / "binding.json")
        system = json.loads(self.outputs["system-ontology.json"])
        obligations = {item["proof_requirement_id"]: item for item in system["proof_obligations"]}
        self.assertEqual(set(binding["proof_requirement_mappings"]), set(obligations))
        self.assertTrue(all(item["evidence_state"] == "not_evaluable" for item in obligations.values()))

    def test_every_system_boundary_selector_resolves(self) -> None:
        system = json.loads(self.outputs["system-ontology.json"])
        selectors = {item["domainspec_selector"] for item in system["nodes"]}
        selected: set[str] = set()

        def collect(value) -> None:
            if isinstance(value, str) and value.startswith(f"{COMPILER.FEATURE_ID}:"):
                selected.add(value)
            elif isinstance(value, list):
                for child in value:
                    collect(child)
            elif isinstance(value, dict):
                for child in value.values():
                    collect(child)

        collect(system["boundaries"])
        self.assertTrue(selected)
        self.assertEqual(set(), selected - selectors)


if __name__ == "__main__":
    unittest.main()
