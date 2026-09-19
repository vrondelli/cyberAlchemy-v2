from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

import yaml


HERE = Path(__file__).resolve().parent
BUILDER = HERE.parent / "tools" / "build-roadmap.py"
TEMPLATE = HERE.parent / "roadmap.template.html"
SPEC = importlib.util.spec_from_file_location("build_roadmap", BUILDER)
assert SPEC and SPEC.loader
build_roadmap = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(build_roadmap)


class BuildRoadmapTests(unittest.TestCase):
    def setUp(self) -> None:
        self.manifest = yaml.safe_load(build_roadmap.MANIFEST_PATH.read_text(encoding="utf-8"))
        self.craft = yaml.safe_load(build_roadmap.CRAFT_PATH.read_text(encoding="utf-8"))
        self.copy_doc = json.loads(build_roadmap.COPY_PATH.read_text(encoding="utf-8"))

    def write_fixture(self, directory: Path, manifest=None, craft=None) -> tuple[Path, Path]:
        manifest_path = directory / "manifest.yml"
        craft_path = directory / "ledger.yml"
        manifest_path.write_text(yaml.safe_dump(manifest or self.manifest, sort_keys=False), encoding="utf-8")
        craft_path.write_text(yaml.safe_dump(craft or self.craft, sort_keys=False), encoding="utf-8")
        return manifest_path, craft_path

    def write_copy_fixture(self, directory: Path, copy_doc=None) -> Path:
        copy_path = directory / "roadmap-copy.json"
        copy_path.write_text(json.dumps(copy_doc or self.copy_doc, indent=2) + "\n", encoding="utf-8")
        return copy_path

    def test_live_baseline_counts_and_authority(self) -> None:
        payload = build_roadmap.build_payload()
        self.assertEqual(payload["counts"]["nodes"], 18)
        self.assertEqual(payload["counts"]["edges"], 40)
        self.assertEqual(payload["counts"]["frontiers"], 5)
        self.assertEqual(payload["counts"]["critical_steps"], 14)
        self.assertEqual(payload["copy"]["coverage"]["required_fields"], 74)
        self.assertEqual(payload["copy"]["coverage"]["provided_fields"], 74)
        self.assertEqual(payload["copy"]["coverage"]["missing_fields"], 0)
        self.assertEqual(payload["copy"]["coverage"]["unused_fields"], 0)
        self.assertIs(payload["read_model"]["production_authorized"], False)
        self.assertEqual(payload["current"]["stage"], "plan")
        self.assertEqual(payload["current"]["gate"], "block")
        self.assertEqual(len({item["id"] for item in payload["nodes"]}), 18)
        self.assertEqual(len({item["id"] for item in payload["frontiers"]}), 5)
        self.assertEqual(len(payload["sources"]), 7)
        self.assertIn(
            "projects/domainspec-v2/development/first-production-release/visibility/roadmap-copy.json",
            {source["path"] for source in payload["sources"]},
        )

    def test_generation_is_deterministic_and_embedded(self) -> None:
        first = build_roadmap.generate()
        second = build_roadmap.generate()
        self.assertEqual(first, second)
        data, html = first
        parsed = json.loads(data)
        self.assertIn(parsed["read_model"]["input_fingerprint"], html)
        self.assertEqual(parsed["read_model"]["input_fingerprint"], parsed["build"]["input_fingerprint"])
        self.assertEqual(parsed["build"]["input_manifest"]["manifest_version"], build_roadmap.BUILD_INPUT_MANIFEST_VERSION)
        self.assertNotIn(build_roadmap.DATA_MARKER, html)
        self.assertNotIn(str(build_roadmap.REPO_ROOT), data)

    def test_build_manifest_embeds_relative_inputs_and_rendered_targets(self) -> None:
        payload = build_roadmap.build_payload()
        build = payload["build"]["input_manifest"]
        refs = [
            build["inputs"]["graph_manifest"],
            build["inputs"]["craft_ledger"],
            build["inputs"]["presentation_copy"],
            *build["inputs"]["declared_sources"],
        ]
        self.assertTrue(all(ref["sha256"].startswith("sha256:") for ref in refs))
        self.assertTrue(all(not Path(ref["path"]).is_absolute() for ref in refs))
        self.assertIn("copy.node.FPR-01.title", build["rendered_targets"]["fpr_01_field_ids"])
        self.assertIn("copy.node.FPR-01.summary", build["rendered_targets"]["fpr_01_field_ids"])
        self.assertEqual(len(build["rendered_targets"]["node_ids"]), 18)
        self.assertEqual(len(build["rendered_targets"]["copy_field_ids"]), 74)
        self.assertEqual(build["coverage"]["missing_fields"], 0)
        self.assertEqual(build["coverage"]["unused_fields"], 0)

    def test_material_input_mutations_change_fingerprint(self) -> None:
        cases = {
            "manifest": lambda manifest, craft, copy_doc: manifest["nodes"][1].update({"title": "mutated authority baseline"}),
            "craft": lambda manifest, craft, copy_doc: craft["contexts"][0].update({"next_move": "mutated next move"}),
            "copy": lambda manifest, craft, copy_doc: copy_doc["fields"][0].update({"text": "Mutated product direction"}),
        }
        for name, mutate in cases.items():
            with self.subTest(name=name), tempfile.TemporaryDirectory(dir=HERE.parent) as temporary:
                root = Path(temporary)
                manifest = copy.deepcopy(self.manifest)
                craft = copy.deepcopy(self.craft)
                copy_doc = copy.deepcopy(self.copy_doc)
                manifest_path, craft_path = self.write_fixture(root, manifest, craft)
                copy_path = self.write_copy_fixture(root, copy_doc)
                baseline = build_roadmap.build_payload(manifest_path, craft_path, copy_path)["read_model"]["input_fingerprint"]
                mutate(manifest, craft, copy_doc)
                manifest_path, craft_path = self.write_fixture(root, manifest, craft)
                copy_path = self.write_copy_fixture(root, copy_doc)
                changed = build_roadmap.build_payload(manifest_path, craft_path, copy_path)["read_model"]["input_fingerprint"]
                self.assertNotEqual(baseline, changed)

    def test_declared_source_content_mutation_changes_fingerprint(self) -> None:
        with tempfile.TemporaryDirectory(dir=HERE.parent) as temporary:
            root = Path(temporary)
            source_path = root / "source.md"
            source_path.write_text("alpha\n", encoding="utf-8")
            manifest = copy.deepcopy(self.manifest)
            manifest["sources"] = {
                "temporary_source": source_path.resolve().relative_to(build_roadmap.REPO_ROOT).as_posix()
            }
            manifest_path, craft_path = self.write_fixture(root, manifest, self.craft)
            copy_path = self.write_copy_fixture(root, self.copy_doc)
            baseline = build_roadmap.build_payload(manifest_path, craft_path, copy_path)["read_model"]["input_fingerprint"]
            source_path.write_text("beta\n", encoding="utf-8")
            changed = build_roadmap.build_payload(manifest_path, craft_path, copy_path)["read_model"]["input_fingerprint"]
            self.assertNotEqual(baseline, changed)

    def test_every_current_surface_has_human_copy(self) -> None:
        payload = build_roadmap.build_payload()
        copy_model = payload["copy"]
        template = TEMPLATE.read_text(encoding="utf-8")
        for node in self.manifest["nodes"]:
            self.assertIn(node["id"], copy_model["nodes"])
            self.assertIn("title", copy_model["nodes"][node["id"]])
            self.assertIn("summary", copy_model["nodes"][node["id"]])
        for frontier in self.manifest["frontiers"]:
            self.assertIn(frontier["id"], copy_model["frontiers"])
            self.assertIn("title", copy_model["frontiers"][frontier["id"]])
            self.assertIn("summary", copy_model["frontiers"][frontier["id"]])
        for step in self.manifest["critical_steps"]:
            self.assertIn(step, copy_model["critical_steps"])
        for state in {node["state"] for node in self.manifest["nodes"]}:
            self.assertIn(state, copy_model["status"])
        self.assertNotIn("Read the exact contract below.", template)
        self.assertNotIn("const FRONTIER_COPY = {", template)
        self.assertNotIn("const STEP_COPY = {", template)

    def test_copy_contract_blocks_missing_duplicate_unused_and_unknown_fields(self) -> None:
        cases = {
            "missing required": (
                lambda document: document.update(
                    {
                        "fields": [
                            field
                            for field in document["fields"]
                            if field["field_id"] != "copy.node.FPR-01.title"
                        ]
                    }
                ),
                "missing required copy field: copy.node.FPR-01.title",
            ),
            "duplicate": (
                lambda document: document["fields"].append(copy.deepcopy(document["fields"][0])),
                "duplicate copy field: copy.node.FPR-00.title",
            ),
            "unused": (
                lambda document: document["fields"].append(
                    {
                        "field_id": "copy.node.FPR-01.label",
                        "target": {"kind": "node", "id": "FPR-01"},
                        "role": "label",
                        "text": "Unused label",
                    }
                ),
                "unused copy field: copy.node.FPR-01.label",
            ),
            "unknown": (
                lambda document: document["fields"].__setitem__(
                    0,
                    {
                        "field_id": "copy.node.FPR-99.title",
                        "target": {"kind": "node", "id": "FPR-99"},
                        "role": "title",
                        "text": "Unknown node",
                    },
                ),
                "references unknown node: FPR-99",
            ),
        }
        for name, (mutate, message) in cases.items():
            with self.subTest(name=name), tempfile.TemporaryDirectory() as temporary:
                copy_doc = copy.deepcopy(self.copy_doc)
                mutate(copy_doc)
                copy_path = self.write_copy_fixture(Path(temporary), copy_doc)
                with self.assertRaisesRegex(build_roadmap.ContractError, message):
                    build_roadmap.build_payload(copy_path=copy_path)

    def test_human_layer_preserves_claim_boundary_and_exact_contract(self) -> None:
        template = TEMPLATE.read_text(encoding="utf-8")
        self.assertIn("The direction is agreed. The release is not.", template)
        self.assertIn("Release status: not authorized", template)
        self.assertIn("Show exact Craft state", template)
        self.assertIn("Show exact technical contract", template)
        self.assertIn("How we try to break the claim", template)
        self.assertIn("Where this page gets its facts", template)

    def test_check_reports_stale_and_accepts_exact_outputs(self) -> None:
        data, html = build_roadmap.generate()
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            data_path = root / "roadmap-data.json"
            html_path = root / "roadmap.html"
            self.assertEqual(
                build_roadmap.check_outputs(data_path, html_path, data, html),
                ["missing generated output: roadmap-data.json", "missing generated output: roadmap.html"],
            )
            data_path.write_text(data, encoding="utf-8")
            html_path.write_text(html, encoding="utf-8")
            self.assertEqual(build_roadmap.check_outputs(data_path, html_path, data, html), [])
            html_path.write_text(html + "stale", encoding="utf-8")
            self.assertEqual(build_roadmap.check_outputs(data_path, html_path, data, html), ["stale generated output: roadmap.html"])

    def test_unknown_edge_endpoint_blocks(self) -> None:
        self.manifest["edges"][0]["to"] = "FPR-UNKNOWN"
        with tempfile.TemporaryDirectory() as temporary:
            manifest, craft = self.write_fixture(Path(temporary))
            with self.assertRaisesRegex(build_roadmap.ContractError, "unknown target"):
                build_roadmap.build_payload(manifest, craft)

    def test_missing_craft_frontier_join_blocks(self) -> None:
        frontier_id = self.manifest["frontiers"][0]["id"]
        self.craft["gaps"] = [gap for gap in self.craft["gaps"] if gap.get("gap_id") != frontier_id]
        with tempfile.TemporaryDirectory() as temporary:
            manifest, craft = self.write_fixture(Path(temporary))
            with self.assertRaisesRegex(build_roadmap.ContractError, "no matching Craft gap"):
                build_roadmap.build_payload(manifest, craft)

    def test_production_authorization_blocks(self) -> None:
        self.manifest["production_authorized"] = True
        with tempfile.TemporaryDirectory() as temporary:
            manifest, craft = self.write_fixture(Path(temporary))
            with self.assertRaisesRegex(build_roadmap.ContractError, "must be exactly false"):
                build_roadmap.build_payload(manifest, craft)

    def test_missing_declared_source_blocks(self) -> None:
        self.manifest["sources"]["evidence"] = "projects/domainspec-v2/does-not-exist.md"
        with tempfile.TemporaryDirectory() as temporary:
            manifest, craft = self.write_fixture(Path(temporary))
            with self.assertRaisesRegex(build_roadmap.ContractError, "declared manifest source is missing"):
                build_roadmap.build_payload(manifest, craft)

    def test_dependency_cycle_blocks(self) -> None:
        self.manifest["nodes"][0]["dependencies"] = ["FPR-15"]
        with tempfile.TemporaryDirectory() as temporary:
            manifest, craft = self.write_fixture(Path(temporary))
            with self.assertRaisesRegex(build_roadmap.ContractError, "cycle"):
                build_roadmap.build_payload(manifest, craft)


if __name__ == "__main__":
    unittest.main()
