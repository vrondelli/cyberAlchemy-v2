#!/usr/bin/env python3
"""Admit an owner-evidenced authority transition without applying or consuming it."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

import authority_package


VALIDATOR_VERSION = "mint.runtime.authority-transition-check.v0.1"
PROOF_CEILING = (
    "owner-evidence transition admission only; no receipt consumption, ratification, "
    "promotion, package mutation, release, deployment, or production proof"
)
RUNTIME_DIR = Path(__file__).resolve().parent
ZERO_SHA256 = "0" * 64
CONTRACTS = {
    "request": RUNTIME_DIR / "contracts" / "authority-transition-request.v0.1.schema.json",
    "decision": RUNTIME_DIR / "contracts" / "authority-owner-decision.v0.1.schema.json",
    "owner-receipt": RUNTIME_DIR / "contracts" / "authority-owner-receipt.v0.1.schema.json",
}


def _schema_errors(document: Any, contract: Path, prefix: str) -> list[str]:
    schema = json.loads(contract.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    failures = sorted(
        Draft202012Validator(schema).iter_errors(document),
        key=lambda item: (list(item.absolute_path), item.message),
    )
    return [prefix for _ in failures]


def _read_ref(
    reference: dict[str, Any], kind: str, blockers: list[str]
) -> tuple[Any | None, dict[str, Any] | None]:
    path = Path(reference["path"])
    if not path.is_absolute():
        path = Path.cwd() / path
    if path.is_symlink() or not path.is_file():
        blockers.append(f"TRANSITION_{kind.upper().replace('-', '_')}_MISSING")
        return None, None
    try:
        payload = path.read_bytes()
    except OSError:
        blockers.append(f"TRANSITION_{kind.upper().replace('-', '_')}_UNREADABLE")
        return None, None
    digest = authority_package.sha256_bytes(payload)
    binding = {"kind": kind, "sha256": digest, "size_bytes": len(payload)}
    if digest != reference["sha256"]:
        blockers.append(f"TRANSITION_{kind.upper().replace('-', '_')}_DIGEST_MISMATCH")
        return None, binding
    try:
        return json.loads(payload), binding
    except (UnicodeError, json.JSONDecodeError):
        blockers.append(f"TRANSITION_{kind.upper().replace('-', '_')}_INVALID_JSON")
        return None, binding


def _transition_by_id(package: dict[str, Any], transition_id: str) -> dict[str, Any] | None:
    matches = [
        item
        for item in package.get("promotion_transitions", [])
        if item.get("transition_id") == transition_id
    ]
    return matches[0] if len(matches) == 1 else None


def _check_replay_ledger(ledger: Any, owner_receipt_id: str | None) -> list[str]:
    if not isinstance(ledger, dict) or set(ledger) != {"schema_version", "consumed_owner_receipt_ids"}:
        return ["TRANSITION_REPLAY_LEDGER_SCHEMA_INVALID"]
    if ledger["schema_version"] != "mint.owner-receipt-replay-ledger.v0.1":
        return ["TRANSITION_REPLAY_LEDGER_SCHEMA_INVALID"]
    consumed = ledger["consumed_owner_receipt_ids"]
    if (
        not isinstance(consumed, list)
        or any(not isinstance(item, str) or not item for item in consumed)
        or len(consumed) != len(set(consumed))
    ):
        return ["TRANSITION_REPLAY_LEDGER_SCHEMA_INVALID"]
    if owner_receipt_id is not None and owner_receipt_id in consumed:
        return ["TRANSITION_OWNER_RECEIPT_REPLAYED"]
    return []


def validate_transition(request: Any) -> dict[str, Any]:
    validator_sha256 = authority_package.sha256_file(Path(__file__).resolve())
    blockers = _schema_errors(request, CONTRACTS["request"], "TRANSITION_REQUEST_SCHEMA_INVALID")
    evidence_bindings: list[dict[str, Any]] = []
    package: Any = None
    decision: Any = None
    owner_receipt: Any = None
    replay_ledger: Any = None
    package_id: str | None = None
    package_sha256 = ZERO_SHA256

    if not blockers:
        for field, kind in (
            ("package_ref", "package"),
            ("decision_ref", "decision"),
            ("owner_receipt_ref", "owner-receipt"),
            ("replay_ledger_ref", "replay-ledger"),
        ):
            document, binding = _read_ref(request[field], kind, blockers)
            if binding is not None:
                evidence_bindings.append(binding)
            if field == "package_ref":
                package = document
            elif field == "decision_ref":
                decision = document
            elif field == "owner_receipt_ref":
                owner_receipt = document
            else:
                replay_ledger = document

    package_receipt: dict[str, Any] | None = None
    if package is not None:
        package_receipt = authority_package.validate_authority_package(package)
        package_id = package_receipt["package_id"]
        package_sha256 = package_receipt["package_sha256"]
        if package_receipt["status"] != "valid":
            blockers.append("TRANSITION_PACKAGE_INVALID")
    if decision is not None:
        blockers.extend(_schema_errors(decision, CONTRACTS["decision"], "TRANSITION_DECISION_SCHEMA_INVALID"))
    if owner_receipt is not None:
        blockers.extend(
            _schema_errors(
                owner_receipt,
                CONTRACTS["owner-receipt"],
                "TRANSITION_OWNER_RECEIPT_SCHEMA_INVALID",
            )
        )

    transition: dict[str, Any] | None = None
    if package_receipt is not None and package_receipt["status"] == "valid":
        transition = _transition_by_id(package, request["transition_id"])
        if transition is None:
            blockers.append("TRANSITION_RECORD_MISSING")
        if package_id != request["expected"]["package_id"]:
            blockers.append("TRANSITION_PACKAGE_ID_MISMATCH")

    if transition is not None:
        expected_pairs = (
            ("subject_ref", "subject_ref"),
            ("before_posture", "before_posture"),
            ("after_posture", "after_posture"),
            ("requested_effect", "requested_effect"),
        )
        if any(transition[left] != request["expected"][right] for left, right in expected_pairs):
            blockers.append("TRANSITION_EXPECTATION_MISMATCH")

    decision_schema_ok = decision is not None and not _schema_errors(
        decision, CONTRACTS["decision"], "TRANSITION_DECISION_SCHEMA_INVALID"
    )
    receipt_schema_ok = owner_receipt is not None and not _schema_errors(
        owner_receipt,
        CONTRACTS["owner-receipt"],
        "TRANSITION_OWNER_RECEIPT_SCHEMA_INVALID",
    )
    if transition is not None and decision_schema_ok:
        if (
            decision["decision_id"] != transition["owner_gate_decision_ref"]
            or decision["transition_id"] != transition["transition_id"]
            or decision["package_sha256"] != package_sha256
            or decision["selected_effect"] != transition["requested_effect"]
        ):
            blockers.append("TRANSITION_DECISION_MISMATCH")
        if decision["decision_state"] != "accepted":
            blockers.append("TRANSITION_DECISION_REJECTED")

    if transition is not None and decision_schema_ok and receipt_schema_ok:
        expected_receipt = {
            "decision_id": decision["decision_id"],
            "transition_id": transition["transition_id"],
            "package_sha256": package_sha256,
            "subject_ref": transition["subject_ref"],
            "before_posture": transition["before_posture"],
            "after_posture": transition["after_posture"],
            "requested_effect": transition["requested_effect"],
            "owner_id": decision["owner_id"],
        }
        if any(owner_receipt[field] != value for field, value in expected_receipt.items()):
            blockers.append("TRANSITION_OWNER_RECEIPT_MISMATCH")
        if owner_receipt["owner_receipt_id"] != transition["owner_receipt_ref"]:
            blockers.append("TRANSITION_OWNER_RECEIPT_MISMATCH")
        if owner_receipt["owner_receipt_id"] not in decision["evidence_refs"]:
            blockers.append("TRANSITION_OWNER_RECEIPT_NOT_IN_DECISION")

    if replay_ledger is not None:
        owner_receipt_id = (
            owner_receipt.get("owner_receipt_id") if isinstance(owner_receipt, dict) else None
        )
        blockers.extend(_check_replay_ledger(replay_ledger, owner_receipt_id))

    blockers = sorted(set(blockers))
    evidence_bindings.sort(key=lambda item: item["kind"])
    status = "blocked" if blockers else "transition-ready"
    identity = {
        "validator_version": VALIDATOR_VERSION,
        "validator_sha256": validator_sha256,
        "request_id": request.get("request_id") if isinstance(request, dict) else None,
        "transition_id": request.get("transition_id") if isinstance(request, dict) else None,
        "package_id": package_id,
        "package_sha256": package_sha256,
        "status": status,
        "evidence_bindings": evidence_bindings,
        "blockers": blockers,
        "authority_effect": "none",
    }
    return {
        "schema_version": "mint.authority-transition-validation-receipt.v0.1",
        "receipt_id": authority_package.sha256_bytes(authority_package.canonical_bytes(identity)),
        "validator_version": VALIDATOR_VERSION,
        "validator_sha256": validator_sha256,
        "request_id": identity["request_id"],
        "transition_id": identity["transition_id"],
        "package_id": package_id,
        "package_sha256": package_sha256,
        "status": status,
        "evidence_bindings": evidence_bindings,
        "blockers": blockers,
        "writes_performed": 0,
        "owner_receipt_consumed": False,
        "authority_effect": "none",
        "proof_ceiling": PROOF_CEILING,
    }


def load_and_validate(path: Path) -> dict[str, Any]:
    try:
        request = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        request = {"load_error": f"{type(exc).__name__}: {exc}"}
    return validate_transition(request)
