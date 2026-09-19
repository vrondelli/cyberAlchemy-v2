from __future__ import annotations

import json
from pathlib import Path
import unittest

from jsonschema import Draft202012Validator
import yaml


HERE = Path(__file__).resolve().parent
VISIBILITY = HERE.parent
SCHEMA_PATH = VISIBILITY / "schemas" / "roadmap-copy.schema.json"
FIXTURES = HERE / "fixtures" / "roadmap-copy"
MANIFEST_PATH = VISIBILITY.parent / "craft" / "expected-node-edge-manifest.yml"


def _path(error) -> str:
    return ".".join(str(part) for part in error.absolute_path) or "$"


class RoadmapCopyContract:
    PAGE_TARGETS = {
        "roadmap",
        "orientation",
        "release-boundary",
        "source-guidance",
    }

    def __init__(self) -> None:
        self.schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(self.schema)
        self.validator = Draft202012Validator(self.schema)
        manifest = yaml.safe_load(MANIFEST_PATH.read_text(encoding="utf-8"))
        self.targets = {
            "node": {row["id"] for row in manifest["nodes"]},
            "frontier": {row["id"] for row in manifest["frontiers"]},
            "critical-step": set(manifest["critical_steps"]),
            "status": {row["state"] for row in manifest["nodes"]},
            "page": self.PAGE_TARGETS,
        }

    def errors(self, document: object) -> list[str]:
        failures = [
            f"{_path(error)}: {error.message}"
            for error in sorted(self.validator.iter_errors(document), key=lambda item: list(item.absolute_path))
        ]
        if not isinstance(document, dict) or not isinstance(document.get("fields"), list):
            return failures

        seen: set[str] = set()
        for index, field in enumerate(document["fields"]):
            if not isinstance(field, dict):
                continue
            field_id = field.get("field_id")
            if isinstance(field_id, str):
                if field_id in seen:
                    failures.append(f"fields.{index}: duplicate field_id {field_id!r}")
                seen.add(field_id)

            target = field.get("target")
            role = field.get("role")
            if not isinstance(target, dict) or not isinstance(role, str):
                continue
            kind = target.get("kind")
            identity = target.get("id")
            if not isinstance(kind, str) or not isinstance(identity, str):
                continue
            if kind in self.targets and identity not in self.targets[kind]:
                failures.append(f"fields.{index}: unknown {kind} target {identity!r}")
            expected_id = f"copy.{kind}.{identity}.{role}"
            if isinstance(field_id, str) and field_id != expected_id:
                failures.append(
                    f"fields.{index}: field_id mismatch; expected {expected_id!r}, got {field_id!r}"
                )
        return failures


class RoadmapCopyContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.contract = RoadmapCopyContract()

    def load_fixture(self, name: str) -> object:
        return json.loads((FIXTURES / name).read_text(encoding="utf-8"))

    def test_schema_is_valid_draft_2020_12(self) -> None:
        self.assertEqual(self.contract.schema["$schema"], "https://json-schema.org/draft/2020-12/schema")

    def test_valid_fixtures_cover_each_target_kind(self) -> None:
        names = sorted(path.name for path in FIXTURES.glob("valid.*.json"))
        self.assertEqual(names, ["valid.presentation-copy.json"])
        document = self.load_fixture(names[0])
        self.assertEqual(self.contract.errors(document), [])
        self.assertEqual(
            {field["target"]["kind"] for field in document["fields"]},
            {"node", "frontier", "critical-step", "status", "page"},
        )

    def test_each_invalid_fixture_fails_for_its_intended_reason(self) -> None:
        expected = {
            "invalid.authority-field.json": "Additional properties are not allowed",
            "invalid.blank-text.json": "does not match",
            "invalid.duplicate-field-id.json": "duplicate field_id",
            "invalid.field-id-mismatch.json": "field_id mismatch",
            "invalid.missing-role.json": "'role' is a required property",
            "invalid.unknown-node.json": "unknown node target",
        }
        self.assertEqual(
            sorted(path.name for path in FIXTURES.glob("invalid.*.json")),
            sorted(expected),
        )
        for name, message in expected.items():
            with self.subTest(name=name):
                errors = self.contract.errors(self.load_fixture(name))
                self.assertTrue(errors, f"{name} unexpectedly passed")
                self.assertTrue(
                    any(message in error for error in errors),
                    f"{name} did not report {message!r}: {errors}",
                )

    def test_node_validity_comes_from_live_manifest_not_schema_enum(self) -> None:
        target_schema = self.contract.schema["$defs"]["copy_target"]
        self.assertNotIn("enum", target_schema["properties"]["id"])
        self.assertIn("FPR-01", self.contract.targets["node"])
        self.assertNotIn("FPR-99", self.contract.targets["node"])

    def test_copy_field_cannot_carry_authority_properties(self) -> None:
        properties = set(self.contract.schema["$defs"]["copy_field"]["properties"])
        self.assertEqual(properties, {"field_id", "target", "role", "text"})
        self.assertTrue(
            {"state", "proof", "owner_route", "production_authorized"}.isdisjoint(properties)
        )


if __name__ == "__main__":
    unittest.main()
