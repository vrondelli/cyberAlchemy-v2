from __future__ import annotations

import copy
import json
from pathlib import Path
import unittest

from jsonschema import Draft202012Validator


HERE = Path(__file__).resolve().parent
VISIBILITY = HERE.parent
SCHEMA_PATH = VISIBILITY / "schemas" / "roadmap-event.schema.json"
FIXTURES = HERE / "fixtures" / "roadmap-events"
SEMANTIC_MESSAGE_LIMIT = 12 * 1024
CANVAS_REQUEST_LIMIT = 16 * 1024


def _repo_root() -> Path:
    for parent in HERE.parents:
        if (parent / "projects" / "ide-extension" / "schemas").is_dir():
            return parent
    raise RuntimeError("Could not resolve repository root from roadmap event tests")


REPO_ROOT = _repo_root()
CANVAS_SCHEMA_PATH = REPO_ROOT / "projects" / "ide-extension" / "schemas" / "canvas-interaction-request.schema.json"


def _path(error) -> str:
    return ".".join(str(part) for part in error.absolute_path) or "$"


def _leaf_errors(error):
    if error.context:
        for child in error.context:
            yield from _leaf_errors(child)
        return
    yield error


def _serialized_size(document: object) -> int:
    return len(json.dumps(document, separators=(",", ":"), sort_keys=True).encode("utf-8"))


class RoadmapEventContract:
    def __init__(self) -> None:
        self.schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        self.canvas_schema = json.loads(CANVAS_SCHEMA_PATH.read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(self.schema)
        Draft202012Validator.check_schema(self.canvas_schema)
        self.validator = Draft202012Validator(self.schema)
        self.canvas_validator = Draft202012Validator(self.canvas_schema)

    def errors(self, message: object) -> list[str]:
        failures = [
            f"{_path(error)}: {error.message}"
            for top_error in sorted(self.validator.iter_errors(message), key=lambda item: list(item.absolute_path))
            for error in _leaf_errors(top_error)
        ]
        if _serialized_size(message) > SEMANTIC_MESSAGE_LIMIT:
            failures.append(f"$: serialized message exceeds {SEMANTIC_MESSAGE_LIMIT} bytes")
        return failures

    def canvas_errors(self, request: object) -> list[str]:
        return [
            f"{_path(error)}: {error.message}"
            for error in sorted(self.canvas_validator.iter_errors(request), key=lambda item: list(item.absolute_path))
        ]

    def compose_canvas_request(self, message: dict) -> dict:
        return {
            "schema_version": "1",
            "surface_id": "surface-roadmap-lab-contract",
            "revision_id": "revision-roadmap-lab-contract",
            "event_name": message["eventName"],
            "payload": message["payload"],
        }


class RoadmapEventContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.contract = RoadmapEventContract()

    def load_fixture(self, name: str) -> object:
        return json.loads((FIXTURES / name).read_text(encoding="utf-8"))

    def test_schema_is_valid_draft_2020_12(self) -> None:
        self.assertEqual(self.contract.schema["$schema"], "https://json-schema.org/draft/2020-12/schema")
        self.assertEqual(
            self.contract.schema["description"],
            "Exact private message contract carried inside the existing generic ide-extension Canvas interaction. Canvas surface and revision bindings are parent-owned outer request fields and are intentionally forbidden in these payloads.",
        )

    def test_valid_fixtures_cover_events_classes_and_canvas_composition(self) -> None:
        names = sorted(path.name for path in FIXTURES.glob("valid.*.json"))
        self.assertEqual(
            names,
            [
                "valid.disposition.accepted.json",
                "valid.orientation.json",
                "valid.proposal.continuation.json",
                "valid.proposal.graph-or-claim.json",
                "valid.proposal.presentation-copy.json",
                "valid.proposal.protected-or-unsupported.json",
                "valid.proposal.research-evidence.json",
                "valid.restatement.json",
                "valid.source-request.json",
            ],
        )

        event_names: set[str] = set()
        proposal_classes: set[str] = set()
        for name in names:
            with self.subTest(name=name):
                message = self.load_fixture(name)
                self.assertIsInstance(message, dict)
                self.assertEqual(set(message), {"type", "eventName", "payload"})
                self.assertEqual(self.contract.errors(message), [])
                self.assertLessEqual(_serialized_size(message), SEMANTIC_MESSAGE_LIMIT)

                event_names.add(message["eventName"])
                payload = message["payload"]
                self.assertNotIn("surface_id", payload)
                self.assertNotIn("revision_id", payload)
                if message["eventName"] == "roadmap.improvement.proposed":
                    proposal_classes.add(payload["proposal_class"])

                request = self.contract.compose_canvas_request(message)
                self.assertEqual(self.contract.canvas_errors(request), [])
                self.assertLessEqual(_serialized_size(request), CANVAS_REQUEST_LIMIT)

        self.assertEqual(
            event_names,
            {
                "roadmap.orientation.acknowledged",
                "roadmap.restatement.submitted",
                "roadmap.source.requested",
                "roadmap.improvement.proposed",
                "roadmap.proposal.disposition.recorded",
            },
        )
        self.assertEqual(
            proposal_classes,
            {
                "presentation-copy",
                "graph-or-claim",
                "continuation",
                "research-evidence",
                "protected-or-unsupported",
            },
        )

    def test_each_invalid_fixture_fails_for_its_intended_reason(self) -> None:
        expected = {
            "invalid.additional-top-level.json": "Additional properties are not allowed",
            "invalid.disposition-missing-evidence.json": "'evidence_ref' is a required property",
            "invalid.editable-canvas-binding.json": "Additional properties are not allowed",
            "invalid.missing-fingerprint.json": "'input_fingerprint' is a required property",
            "invalid.payload-array.json": "is not of type 'object'",
            "invalid.proposal-class-target-mismatch.json": "'field_id' is a required property",
            "invalid.source-traversal.json": "does not match",
            "invalid.wrong-participant-type.json": "is not of type 'string'",
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

    def test_canvas_binding_is_outer_parent_owned_state(self) -> None:
        message = self.load_fixture("valid.orientation.json")
        request = self.contract.compose_canvas_request(message)
        self.assertEqual(self.contract.canvas_errors(request), [])

        for binding in ("surface_id", "revision_id"):
            with self.subTest(binding=binding):
                missing_binding = dict(request)
                missing_binding.pop(binding)
                errors = self.contract.canvas_errors(missing_binding)
                self.assertTrue(any(f"'{binding}' is a required property" in error for error in errors), errors)

        editable_binding = self.load_fixture("invalid.editable-canvas-binding.json")
        self.assertTrue(any("Additional properties are not allowed" in error for error in self.contract.errors(editable_binding)))

    def test_total_semantic_message_limit_is_enforced(self) -> None:
        message = self.load_fixture("valid.proposal.presentation-copy.json")
        oversized = copy.deepcopy(message)
        oversized["payload"]["proposed_change"] = "x" * 13000
        errors = self.contract.errors(oversized)
        self.assertTrue(
            any(f"serialized message exceeds {SEMANTIC_MESSAGE_LIMIT} bytes" in error for error in errors),
            errors,
        )

    def test_schema_keeps_domain_semantics_out_of_canvas_request_contract(self) -> None:
        self.assertNotIn("roadmap.orientation.acknowledged", json.dumps(self.contract.canvas_schema))
        self.assertNotIn("roadmap.improvement.proposed", json.dumps(self.contract.canvas_schema))
        self.assertEqual(set(self.contract.canvas_schema["required"]), {"schema_version", "surface_id", "revision_id", "event_name", "payload"})


if __name__ == "__main__":
    unittest.main()
