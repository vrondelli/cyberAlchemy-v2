from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator


RUNTIME = Path(__file__).resolve().parents[1]
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "authority-package" / "valid-minimal.json"


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


authority_package = load("authority_package", RUNTIME / "authority_package.py")
lifecycle = load("authority_lifecycle", RUNTIME / "authority_lifecycle.py")


def canonical_write(path: Path, value: object) -> None:
    path.write_bytes(authority_package.canonical_bytes(value))


def file_ref(path: Path) -> dict[str, str]:
    return {"path": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def transition_package() -> dict:
    package = json.loads(FIXTURE.read_text(encoding="utf-8"))
    receipt_id = "RECEIPT.OWNER.RATIFY.001"
    decision = package["decisions"][0]
    decision["selected_option"] = "ratify"
    decision["decision_state"] = "accepted"
    decision["evidence_refs"] = ["EVIDENCE.CANDIDATE-PACKAGE", receipt_id]
    decision["lifecycle"]["lifecycle_status"] = "accepted"
    package["promotion_transitions"] = [
        {
            "transition_id": "TRANSITION.RATIFY.001",
            "subject_ref": "KIND.MARKETPLACE-CANDIDATE",
            "before_posture": "proposed",
            "after_posture": "ratified",
            "requested_effect": "ratify",
            "owner_gate_decision_ref": decision["decision_id"],
            "owner_receipt_ref": receipt_id,
            "last_action_ref": "ACTION.VALIDATE-PACKAGE",
            "lifecycle": {
                "artifact_kind": "promotion-transition",
                "lifecycle_status": "accepted",
                "evidence_state": "authored",
                "commitment_state": "provisional",
                "provenance_refs": ["SRC.MARKETPLACE.PRIMARY"],
                "owner_route": "marketplace-authority-owner",
                "residue_refs": [],
            },
        }
    ]
    package["record_inventory"]["promotion_transitions"] = ["TRANSITION.RATIFY.001"]
    package["source_bindings"][0]["owning_record_refs"].append("TRANSITION.RATIFY.001")
    package["source_set_sha256"] = authority_package.source_set_digest(package)
    package["canonical_record_set_sha256"] = authority_package.record_set_digest(package)
    assert authority_package.validate_authority_package(package)["status"] == "valid"
    return package


def create_bundle(root: Path) -> tuple[Path, dict[str, Path], dict]:
    package = transition_package()
    package_path = root / "package.json"
    canonical_write(package_path, package)
    package_sha256 = authority_package.validate_authority_package(package)["package_sha256"]
    decision = {
        "schema_version": "mint.authority-owner-decision.v0.1",
        "decision_id": "DECISION.OWNER-GATE",
        "transition_id": "TRANSITION.RATIFY.001",
        "package_sha256": package_sha256,
        "selected_effect": "ratify",
        "decision_state": "accepted",
        "owner_id": "OWNER.MARKETPLACE-AUTHORITY",
        "evidence_refs": ["RECEIPT.OWNER.RATIFY.001"],
    }
    owner_receipt = {
        "schema_version": "mint.authority-owner-receipt.v0.1",
        "owner_receipt_id": "RECEIPT.OWNER.RATIFY.001",
        "decision_id": "DECISION.OWNER-GATE",
        "transition_id": "TRANSITION.RATIFY.001",
        "package_sha256": package_sha256,
        "subject_ref": "KIND.MARKETPLACE-CANDIDATE",
        "before_posture": "proposed",
        "after_posture": "ratified",
        "requested_effect": "ratify",
        "decision_state": "accepted",
        "nonce": "owner-nonce-00000001",
        "owner_id": "OWNER.MARKETPLACE-AUTHORITY",
    }
    ledger = {
        "schema_version": "mint.owner-receipt-replay-ledger.v0.1",
        "consumed_owner_receipt_ids": [],
    }
    paths = {
        "package": package_path,
        "decision": root / "decision.json",
        "owner-receipt": root / "owner-receipt.json",
        "replay-ledger": root / "replay-ledger.json",
    }
    canonical_write(paths["decision"], decision)
    canonical_write(paths["owner-receipt"], owner_receipt)
    canonical_write(paths["replay-ledger"], ledger)
    request = {
        "schema_version": "mint.authority-transition-request.v0.1",
        "request_id": "REQUEST.TRANSITION.RATIFY.001",
        "package_ref": file_ref(paths["package"]),
        "decision_ref": file_ref(paths["decision"]),
        "owner_receipt_ref": file_ref(paths["owner-receipt"]),
        "replay_ledger_ref": file_ref(paths["replay-ledger"]),
        "transition_id": "TRANSITION.RATIFY.001",
        "expected": {
            "package_id": "PKG.MARKETPLACE.MINIMAL",
            "subject_ref": "KIND.MARKETPLACE-CANDIDATE",
            "before_posture": "proposed",
            "after_posture": "ratified",
            "requested_effect": "ratify",
        },
        "authority_effect": "none",
    }
    request_path = root / "request.json"
    canonical_write(request_path, request)
    paths["request"] = request_path
    return request_path, paths, request


class AuthorityLifecycleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.receipt_schema = json.loads(
            (RUNTIME / "contracts" / "authority-transition-validation-receipt.v0.1.schema.json").read_text()
        )

    def assert_receipt_schema(self, receipt: dict) -> None:
        Draft202012Validator(self.receipt_schema).validate(receipt)

    def test_contracts_are_valid_draft_2020_12(self) -> None:
        for name in (
            "authority-transition-request.v0.1.schema.json",
            "authority-owner-decision.v0.1.schema.json",
            "authority-owner-receipt.v0.1.schema.json",
            "authority-transition-validation-receipt.v0.1.schema.json",
        ):
            schema = json.loads((RUNTIME / "contracts" / name).read_text())
            self.assertEqual(schema["$schema"], "https://json-schema.org/draft/2020-12/schema")
            Draft202012Validator.check_schema(schema)

    def test_matching_owner_evidence_is_transition_ready_but_not_consumed(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            request_path, paths, _ = create_bundle(Path(temp))
            before = {name: path.read_bytes() for name, path in paths.items()}
            receipt = lifecycle.load_and_validate(request_path)
            self.assertEqual(receipt["status"], "transition-ready")
            self.assertEqual(receipt["blockers"], [])
            self.assertEqual(receipt["writes_performed"], 0)
            self.assertFalse(receipt["owner_receipt_consumed"])
            self.assertEqual(receipt["authority_effect"], "none")
            self.assertEqual(before, {name: path.read_bytes() for name, path in paths.items()})
            self.assert_receipt_schema(receipt)

    def test_missing_or_changed_evidence_blocks(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            request_path, paths, request = create_bundle(Path(temp))
            request["decision_ref"]["path"] = str(Path(temp) / "missing.json")
            canonical_write(request_path, request)
            missing = lifecycle.load_and_validate(request_path)
            self.assertIn("TRANSITION_DECISION_MISSING", missing["blockers"])
            request_path, paths, request = create_bundle(Path(temp))
            paths["decision"].write_bytes(paths["decision"].read_bytes() + b" ")
            changed = lifecycle.load_and_validate(request_path)
            self.assertIn("TRANSITION_DECISION_DIGEST_MISMATCH", changed["blockers"])

    def test_rejected_decision_blocks(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            request_path, paths, request = create_bundle(Path(temp))
            decision = json.loads(paths["decision"].read_text())
            decision["decision_state"] = "rejected"
            canonical_write(paths["decision"], decision)
            request["decision_ref"] = file_ref(paths["decision"])
            canonical_write(request_path, request)
            receipt = lifecycle.load_and_validate(request_path)
            self.assertIn("TRANSITION_DECISION_REJECTED", receipt["blockers"])

    def test_mismatched_owner_receipt_blocks(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            request_path, paths, request = create_bundle(Path(temp))
            owner_receipt = json.loads(paths["owner-receipt"].read_text())
            owner_receipt["after_posture"] = "active"
            canonical_write(paths["owner-receipt"], owner_receipt)
            request["owner_receipt_ref"] = file_ref(paths["owner-receipt"])
            canonical_write(request_path, request)
            receipt = lifecycle.load_and_validate(request_path)
            self.assertIn("TRANSITION_OWNER_RECEIPT_MISMATCH", receipt["blockers"])

    def test_replayed_owner_receipt_blocks_without_consuming(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            request_path, paths, request = create_bundle(Path(temp))
            ledger = json.loads(paths["replay-ledger"].read_text())
            ledger["consumed_owner_receipt_ids"] = ["RECEIPT.OWNER.RATIFY.001"]
            canonical_write(paths["replay-ledger"], ledger)
            request["replay_ledger_ref"] = file_ref(paths["replay-ledger"])
            canonical_write(request_path, request)
            receipt = lifecycle.load_and_validate(request_path)
            self.assertIn("TRANSITION_OWNER_RECEIPT_REPLAYED", receipt["blockers"])
            self.assertFalse(receipt["owner_receipt_consumed"])

    def test_receipt_is_deterministic_and_path_independent(self) -> None:
        with tempfile.TemporaryDirectory() as left, tempfile.TemporaryDirectory() as right:
            left_path, _, _ = create_bundle(Path(left))
            right_path, _, _ = create_bundle(Path(right))
            first = lifecycle.load_and_validate(left_path)
            second = lifecycle.load_and_validate(right_path)
            self.assertEqual(first, second)

    def test_cli_emits_transition_ready_receipt(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            request_path, _, _ = create_bundle(Path(temp))
            run = subprocess.run(
                [sys.executable, str(RUNTIME / "mint.py"), "transition-check", "--request", str(request_path)],
                capture_output=True,
                check=False,
            )
            self.assertEqual(run.returncode, 0, run.stderr.decode())
            self.assertEqual(json.loads(run.stdout)["status"], "transition-ready")


if __name__ == "__main__":
    unittest.main()
