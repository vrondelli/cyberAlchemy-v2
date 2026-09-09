from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


RUNTIME_PATH = Path(__file__).resolve().parents[1] / "runtime.py"
SPEC = importlib.util.spec_from_file_location("cav2_ontology_runtime", RUNTIME_PATH)
assert SPEC and SPEC.loader
runtime = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(runtime)


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def tree_digest(root: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(item for item in root.rglob("*") if item.is_file()):
        digest.update(path.relative_to(root).as_posix().encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


class Fixture:
    def __init__(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.package = self.root / "ontology"
        self.package.mkdir()
        write_json(
            self.package / "profile.json",
            {"ontology_id": "fixture.ontology", "authority_effect": "none"},
        )
        write_json(
            self.package / "nodes.json",
            {"nodes": [{"id": "NODE-1", "label": "One"}]},
        )
        write_json(
            self.package / "relations.json",
            {"relations": [{"id": "REL-1", "source": "NODE-1", "target": "NODE-1"}]},
        )
        write_json(
            self.package / "residue.json",
            {"residue": [{"id": "RES-1", "status": "open"}]},
        )
        (self.root / "definitions.md").write_text(
            "## Selected\nalpha\n\n## Other\nbeta\n",
            encoding="utf-8",
        )
        (self.root / "validator.py").write_text(
            "import json\nprint(json.dumps({'status':'BLOCK','authority_effect':'none','errors':['fixture blocker']}))\nraise SystemExit(1)\n",
            encoding="utf-8",
        )
        system_path = self.root / runtime.SYSTEM_ONTOLOGY_REF
        system_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(runtime.REPOSITORY_ROOT / runtime.SYSTEM_ONTOLOGY_REF, system_path)
        selected = runtime.heading_section_bytes(self.root / "definitions.md", "## Selected")
        self.entry = {
            "ontology_id": "fixture.ontology",
            "package_root": "ontology",
            "profile_ref": "profile.json",
            "adapter": "cav2-json-ontology/v1",
            "material_files": ["profile.json", "nodes.json", "relations.json", "residue.json"],
            "expected_material_digest": runtime.material_digest(
                self.package,
                ["profile.json", "nodes.json", "relations.json", "residue.json"],
            ),
            "source_selections": [
                {
                    "selection_id": "SELECTED",
                    "path": "definitions.md",
                    "scope_kind": "heading-section",
                    "selector": "## Selected",
                    "expected_digest": runtime.sha256_bytes(selected),
                }
            ],
            "record_sources": [
                {"path": "nodes.json", "collection": "nodes", "kind": "node", "id_field": "id"},
                {"path": "relations.json", "collection": "relations", "kind": "relation", "id_field": "id"},
                {"path": "residue.json", "collection": "residue", "kind": "residue", "id_field": "id"},
            ],
            "native_validator": {
                "argv": ["python3", "validator.py"],
                "timeout_seconds": 5,
                "expected_authority_effect": "none",
            },
            "owner_route": "fixture owner",
            "authority_effect": "none",
        }
        self.registry = {
            "schema_version": "cav2-ontology-runtime-registry/v1",
            "registry_id": "cav2.ontology-runtime.local-registry",
            "entries": [self.entry],
            "authority_effect": "none",
        }

    def close(self) -> None:
        self.temporary.cleanup()


class OntologyRuntimeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.fixture = Fixture()

    def tearDown(self) -> None:
        self.fixture.close()

    def snapshot(self, registry: dict | None = None) -> dict:
        return runtime.compile_snapshot(
            "fixture.ontology",
            repository_root=self.fixture.root,
            registry=registry or self.fixture.registry,
        )

    def test_snapshot_is_byte_deterministic_and_bounded(self) -> None:
        first = self.snapshot()
        second = self.snapshot()
        self.assertEqual("PASS", first["status"])
        self.assertEqual(runtime.canonical_json_bytes(first), runtime.canonical_json_bytes(second))
        self.assertEqual(3, len(first["snapshot"]["records"]))
        self.assertEqual("none", first["authority_effect"])

    def test_unrelated_heading_churn_does_not_change_snapshot(self) -> None:
        first = self.snapshot()
        (self.fixture.root / "definitions.md").write_text(
            "## Selected\nalpha\n\n## Other\nchanged outside selected bytes\n",
            encoding="utf-8",
        )
        second = self.snapshot()
        self.assertEqual("PASS", second["status"])
        self.assertEqual(first["snapshot"]["snapshot_id"], second["snapshot"]["snapshot_id"])

    def test_selected_heading_drift_blocks(self) -> None:
        (self.fixture.root / "definitions.md").write_text(
            "## Selected\nchanged selected bytes\n\n## Other\nbeta\n",
            encoding="utf-8",
        )
        result = self.snapshot()
        self.assertEqual("BLOCK", result["status"])
        self.assertIn("SOURCE_SELECTION_DIGEST_DRIFT:SELECTED", result["errors"])

    def test_registered_material_drift_blocks(self) -> None:
        write_json(
            self.fixture.package / "nodes.json",
            {"nodes": [{"id": "NODE-1", "label": "Changed"}]},
        )
        result = self.snapshot()
        self.assertEqual("BLOCK", result["status"])
        self.assertIn("PACKAGE_MATERIAL_DIGEST_DRIFT", result["errors"])

    def test_duplicate_registration_identity_blocks(self) -> None:
        registry = copy.deepcopy(self.fixture.registry)
        registry["entries"].append(copy.deepcopy(registry["entries"][0]))
        result = self.snapshot(registry)
        self.assertEqual("BLOCK", result["status"])
        self.assertIn("REGISTRATION_CARDINALITY:fixture.ontology:2", result["errors"])
        self.assertIn("REGISTRATION_IDS_NOT_UNIQUE", result["errors"])

    def test_path_escape_is_rejected(self) -> None:
        with self.assertRaisesRegex(runtime.RuntimeContractError, "UNSAFE_RELATIVE_PATH"):
            runtime.resolve_bounded(self.fixture.root, "../outside", kind="file")

    def test_get_record_uses_kind_and_logical_id(self) -> None:
        result = runtime.get_record(
            "fixture.ontology",
            "node",
            "NODE-1",
            repository_root=self.fixture.root,
            registry=self.fixture.registry,
        )
        self.assertEqual("PASS", result["status"])
        self.assertEqual("One", result["record"]["payload"]["label"])
        missing = runtime.get_record(
            "fixture.ontology",
            "node",
            "ABSENT",
            repository_root=self.fixture.root,
            registry=self.fixture.registry,
        )
        self.assertEqual("BLOCK", missing["status"])

    def test_native_block_is_preserved_as_runtime_success(self) -> None:
        result = runtime.run_native_validation(
            "fixture.ontology",
            repository_root=self.fixture.root,
            registry=self.fixture.registry,
        )
        self.assertEqual("BLOCK", result["status"])
        self.assertEqual("succeeded", result["runtime_status"])
        self.assertEqual("BLOCK", result["native_status"])
        self.assertEqual(1, result["native_exit_code"])
        self.assertEqual(["fixture blocker"], result["native_result"]["errors"])
        (self.fixture.root / "validator.py").write_text(
            "import json\nprint(json.dumps({'overall':'BLOCK','authority_effect':'none','errors':['fixture blocker']}))\nraise SystemExit(1)\n",
            encoding="utf-8",
        )
        overall_result = runtime.run_native_validation(
            "fixture.ontology",
            repository_root=self.fixture.root,
            registry=self.fixture.registry,
        )
        self.assertEqual("BLOCK", overall_result["status"])
        self.assertEqual("succeeded", overall_result["runtime_status"])
        self.assertEqual("BLOCK", overall_result["native_status"])

    def test_route_preflight_preserves_selected_route_and_grants_no_effect(self) -> None:
        result = runtime.route_preflight(
            "fixture.ontology",
            "mutate",
            "CA2-ROUTE-IMPLEMENT",
            repository_root=self.fixture.root,
            registry=self.fixture.registry,
        )
        self.assertEqual("PASS", result["status"])
        self.assertEqual("CA2-ROUTE-IMPLEMENT", result["selected_route"])
        self.assertTrue(result["selected_route_preserved"])
        self.assertFalse(result["effect_authorized"])
        self.assertTrue(result["repeat_after_material_mutation"])

    def test_route_preflight_blocks_unregistered_target(self) -> None:
        result = runtime.route_preflight(
            "fixture.absent",
            "inspect",
            "CA2-ROUTE-ONTOLOGY",
            repository_root=self.fixture.root,
            registry=self.fixture.registry,
        )
        self.assertEqual("BLOCK", result["status"])
        self.assertTrue(any("REGISTRATION_CARDINALITY" in item for item in result["errors"]))

    def test_route_preflight_validation_preserves_native_block(self) -> None:
        result = runtime.route_preflight(
            "fixture.ontology",
            "validate",
            "CA2-ROUTE-VALIDATE",
            repository_root=self.fixture.root,
            registry=self.fixture.registry,
        )
        self.assertEqual("BLOCK", result["status"])
        self.assertEqual("BLOCK", result["native_status"])
        self.assertFalse(result["effect_authorized"])

    def test_read_operations_preserve_fixture_bytes(self) -> None:
        before = tree_digest(self.fixture.root)
        runtime.catalog(repository_root=self.fixture.root, registry=self.fixture.registry)
        runtime.get_record(
            "fixture.ontology",
            "node",
            "NODE-1",
            repository_root=self.fixture.root,
            registry=self.fixture.registry,
        )
        runtime.run_native_validation(
            "fixture.ontology",
            repository_root=self.fixture.root,
            registry=self.fixture.registry,
        )
        self.assertEqual(before, tree_digest(self.fixture.root))


class LiveBindingTests(unittest.TestCase):
    def test_live_route_preflight_is_deterministic(self) -> None:
        first = runtime.route_preflight(
            "cav2.ontology-product", "inspect", "CA2-ROUTE-ONTOLOGY"
        )
        second = runtime.route_preflight(
            "cav2.ontology-product", "inspect", "CA2-ROUTE-ONTOLOGY"
        )
        self.assertEqual("PASS", first["status"])
        self.assertEqual(first, second)
        self.assertFalse(first["effect_authorized"])

    def test_live_snapshot_is_deterministic_and_system_bound(self) -> None:
        first = runtime.compile_snapshot("cav2.ontology-product")
        second = runtime.compile_snapshot("cav2.ontology-product")
        self.assertEqual("PASS", first["status"])
        self.assertEqual(first, second)
        self.assertEqual(runtime.SYSTEM_ONTOLOGY_DIGEST, first["snapshot"]["system_ontology_digest"])
        define_first = runtime.compile_snapshot("cav2.define.system-runtime.v1")
        define_second = runtime.compile_snapshot("cav2.define.system-runtime.v1")
        self.assertEqual("PASS", define_first["status"])
        self.assertEqual(define_first, define_second)
        self.assertEqual(
            "cav2.define.system-runtime.v1",
            define_first["snapshot"]["ontology_id"],
        )
        self.assertEqual(
            "e749cf97622b3affa6e3e505727eaa7536470920f7db4d5a3fa44da2833c11af",
            define_first["snapshot"]["material_digest"],
        )
        capability_first = runtime.compile_snapshot("cav2.capability")
        capability_second = runtime.compile_snapshot("cav2.capability")
        self.assertEqual("PASS", capability_first["status"])
        self.assertEqual(capability_first, capability_second)
        self.assertEqual(
            "33deb5c8623904a1e01055a8ea4a401c93fcb70f6a8620a7a49c3e804827288a",
            capability_first["snapshot"]["material_digest"],
        )

    def test_live_bounded_retrieval(self) -> None:
        result = runtime.get_record("cav2.ontology-product", "node", "CA2-PRODUCT-ONTOLOGY")
        self.assertEqual("PASS", result["status"])
        self.assertEqual("CyberAlchemy Ontology Product", result["record"]["payload"]["label"])
        define = runtime.get_record(
            "cav2.define.system-runtime.v1", "node", "define-session-runtime.DefineSession"
        )
        self.assertEqual("PASS", define["status"])
        self.assertEqual("Entity", define["record"]["payload"]["kind"])
        capability = runtime.get_record(
            "cav2.capability", "capability-reference", "CAP-REF-AGENT-INVOKE-DEFINE"
        )
        self.assertEqual("PASS", capability["status"])
        self.assertEqual("agent", capability["record"]["payload"]["capability_kind"])
        decision_product = runtime.get_record(
            "cav2.capability", "capability-reference",
            "CAP-REF-PRODUCT-RESOLVE-CONSEQUENTIAL-DECISIONS",
        )
        self.assertEqual("PASS", decision_product["status"])
        self.assertEqual("product", decision_product["record"]["payload"]["capability_kind"])
        decision_agent = runtime.get_record(
            "cav2.capability", "capability-reference", "CAP-REF-AGENT-DECISION-GATE"
        )
        self.assertEqual("PASS", decision_agent["status"])
        self.assertEqual("agent", decision_agent["record"]["payload"]["capability_kind"])
        ladder_product = runtime.get_record(
            "cav2.capability", "capability-reference", "CAP-REF-PRODUCT-EXPLAIN-COMPLEXITY"
        )
        self.assertEqual("PASS", ladder_product["status"])
        self.assertEqual("product", ladder_product["record"]["payload"]["capability_kind"])
        ladder_agent = runtime.get_record(
            "cav2.capability", "capability-reference",
            "CAP-REF-AGENT-COMPLEXITY-EXAMPLE-LADDER",
        )
        self.assertEqual("PASS", ladder_agent["status"])
        self.assertEqual("agent", ladder_agent["record"]["payload"]["capability_kind"])

    def test_live_native_block_is_not_upgraded(self) -> None:
        result = runtime.run_native_validation("cav2.ontology-product")
        self.assertEqual("BLOCK", result["status"])
        self.assertEqual("succeeded", result["runtime_status"])
        self.assertEqual("BLOCK", result["native_status"])
        self.assertTrue(result["native_result"]["errors"])


if __name__ == "__main__":
    unittest.main()
