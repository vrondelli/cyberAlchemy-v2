#!/usr/bin/env python3
"""Validate a WP-FMP-002 Task Session terminal receipt and its exact closeout chain."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any, Iterable

from jsonschema import Draft202012Validator


PHASE_SEQUENCE = [
    "resolved",
    "governed",
    "admitted",
    "ticketed",
    "execution-received",
    "reconciled",
    "closeout-joined",
    "observed",
]


class ContractError(RuntimeError):
    pass


def canonical_sha256(value: Any) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(payload).hexdigest()


def file_identity(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    return {
        "path": "",
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
    }


def load_json(path: Path, label: str) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ContractError(f"{label} is not readable JSON: {exc}") from exc


def resolve_inside(root: Path, raw_path: str, label: str) -> Path:
    candidate = Path(raw_path)
    if candidate.is_absolute() or ".." in candidate.parts:
        raise ContractError(f"{label} path is not repository-relative: {raw_path}")
    resolved = (root / candidate).resolve()
    try:
        resolved.relative_to(root)
    except ValueError as exc:
        raise ContractError(f"{label} path escapes repository root: {raw_path}") from exc
    if not resolved.is_file():
        raise ContractError(f"{label} path is missing or not a file: {raw_path}")
    return resolved


def validate_schema(instance: Any, schema: Any, label: str) -> None:
    errors = sorted(Draft202012Validator(schema).iter_errors(instance), key=lambda e: list(e.path))
    if errors:
        first = errors[0]
        selector = "/" + "/".join(str(part) for part in first.path)
        raise ContractError(f"{label} schema violation at {selector}: {first.message}")


def iter_exact_refs(value: Any) -> Iterable[dict[str, Any]]:
    if isinstance(value, dict):
        if set(value) == {"path", "sha256", "size_bytes"}:
            yield value
            return
        for nested in value.values():
            yield from iter_exact_refs(nested)
    elif isinstance(value, list):
        for nested in value:
            yield from iter_exact_refs(nested)


def verify_exact_ref(root: Path, ref: dict[str, Any], label: str) -> Path:
    path = resolve_inside(root, ref["path"], label)
    actual = file_identity(path)
    if actual["sha256"] != ref["sha256"] or actual["size_bytes"] != ref["size_bytes"]:
        raise ContractError(
            f"exact reference digest mismatch for {label}: {ref['path']}"
        )
    return path


def exact_ref_for(root: Path, raw_path: str) -> dict[str, Any]:
    path = resolve_inside(root, raw_path, "bound artifact")
    identity = file_identity(path)
    identity["path"] = raw_path
    return identity


def require_equal(actual: Any, expected: Any, label: str) -> None:
    if actual != expected:
        raise ContractError(f"{label}: expected {expected!r}, got {actual!r}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository-root", required=True)
    parser.add_argument("--terminal-receipt", required=True)
    parser.add_argument("--receipt-bindings", required=True)
    parser.add_argument("--swu-manifest", required=True)
    parser.add_argument("--swu-contracts", required=True)
    parser.add_argument("--closeout-contracts", required=True)
    parser.add_argument("--report")
    args = parser.parse_args()

    root = Path(args.repository_root).resolve()
    try:
        terminal_path = resolve_inside(root, args.terminal_receipt, "terminal receipt")
        bindings_path = resolve_inside(root, args.receipt_bindings, "receipt bindings")
        swu_manifest_path = resolve_inside(root, args.swu_manifest, "SWU manifest")
        swu_contracts_path = resolve_inside(root, args.swu_contracts, "SWU contracts")
        closeout_contracts_path = resolve_inside(root, args.closeout_contracts, "closeout contracts")

        bindings = load_json(bindings_path, "receipt bindings")
        manifest = load_json(swu_manifest_path, "SWU manifest")
        swu_contracts = load_json(swu_contracts_path, "SWU contracts")
        closeout_contracts = load_json(closeout_contracts_path, "closeout contracts")
        terminal = load_json(terminal_path, "terminal receipt")

        require_equal(bindings.get("schema_version"), "fmp.receipt-bindings.v1", "receipt bindings schema_version")
        require_equal(bindings.get("work_pack_id"), "WP-FMP-002", "receipt bindings work_pack_id")
        require_equal(manifest.get("work_pack_id"), "WP-FMP-002", "SWU manifest work_pack_id")
        require_equal(swu_contracts.get("work_pack_id"), "WP-FMP-002", "SWU contracts work_pack_id")
        require_equal(closeout_contracts.get("work_pack_id"), "WP-FMP-002", "closeout contracts work_pack_id")

        bound_paths: dict[str, Path] = {}
        for key in [
            "terminal_schema_ref",
            "precloseout_schema_ref",
            "validation_receipt_schema_ref",
            "owner_receipt_schema_ref",
            "semantic_validator_ref",
        ]:
            ref = bindings.get(key)
            if not isinstance(ref, dict):
                raise ContractError(f"receipt bindings missing {key}")
            bound_paths[key] = verify_exact_ref(root, ref, f"receipt binding {key}")

        invoked_validator = Path(__file__).resolve()
        if invoked_validator != bound_paths["semantic_validator_ref"]:
            raise ContractError("semantic validator invocation does not match the exact bound validator path")

        terminal_schema = load_json(bound_paths["terminal_schema_ref"], "terminal schema")
        precloseout_schema = load_json(bound_paths["precloseout_schema_ref"], "precloseout schema")
        validation_schema = load_json(bound_paths["validation_receipt_schema_ref"], "validation receipt schema")
        owner_schema = load_json(bound_paths["owner_receipt_schema_ref"], "owner receipt schema")
        validate_schema(terminal, terminal_schema, "terminal receipt")

        for index, ref in enumerate(iter_exact_refs(terminal)):
            verify_exact_ref(root, ref, f"terminal exact ref {index}")

        swu_id = terminal["swu_id"]
        manifest_units = {item["swu_id"]: item for item in manifest["units"]}
        contract_units = {item["swu_id"]: item for item in swu_contracts["contracts"]}
        closeout_units = {item["swu_id"]: item for item in closeout_contracts["contracts"]}
        if swu_id not in manifest_units or swu_id not in contract_units or swu_id not in closeout_units:
            raise ContractError(f"terminal swu_id is not declared in all Plan contracts: {swu_id}")
        manifest_unit = manifest_units[swu_id]
        contract_unit = contract_units[swu_id]
        closeout_unit = closeout_units[swu_id]
        expected_task_id = Path(contract_unit["parent_task"]).stem
        require_equal(terminal["task_id"], expected_task_id, "terminal task_id")
        require_equal(manifest_unit["task"], contract_unit["parent_task"], "task contract binding")
        require_equal(manifest_unit["successor"], contract_unit["successor"], "SWU successor binding")
        require_equal(contract_unit["successor"], closeout_unit["successor"], "closeout successor binding")
        require_equal(args.terminal_receipt, closeout_unit["execution_receipt"], "terminal receipt path")

        require_equal(terminal.get("receipt_profile"), "precloseout-execution-v1", "terminal receipt_profile")
        require_equal(terminal["precloseout_execution_schema_ref"], bindings["precloseout_schema_ref"], "terminal precloseout schema ref")
        precloseout_ref = terminal["precloseout_execution_receipt_ref"]
        require_equal(precloseout_ref["path"], closeout_unit["precloseout_execution_receipt"], "precloseout receipt path")
        precloseout_path = verify_exact_ref(root, precloseout_ref, "precloseout receipt")
        precloseout = load_json(precloseout_path, "precloseout receipt")
        validate_schema(precloseout, precloseout_schema, "precloseout receipt")
        for index, ref in enumerate(iter_exact_refs(precloseout)):
            verify_exact_ref(root, ref, f"precloseout exact ref {index}")

        for field in ["run_id", "task_id", "swu_id"]:
            require_equal(precloseout[field], terminal[field], f"precloseout {field}")
        require_equal(precloseout["closeout_contract"]["source_receipt_path"], precloseout_ref["path"], "closeout source receipt path")
        require_equal(precloseout["closeout_contract"]["source_schema_ref"], bindings["precloseout_schema_ref"], "closeout source schema ref")
        require_equal(precloseout["closeout_contract"]["expected_owner_receipt_path"], closeout_unit["owner_receipt"], "closeout owner receipt path")
        require_equal(precloseout["closeout_contract"]["expected_owner_receipt_schema_ref"], bindings["owner_receipt_schema_ref"], "closeout owner schema ref")
        require_equal(precloseout["closeout_contract"]["final_terminal_receipt_path"], closeout_unit["execution_receipt"], "final terminal receipt path")
        require_equal(precloseout["closeout_contract"]["final_terminal_schema_ref"], bindings["terminal_schema_ref"], "final terminal schema ref")

        validation_digest = canonical_sha256(contract_unit["validation_commands"])
        require_equal(precloseout["validation_contract_digest"], validation_digest, "precloseout validation_contract_digest")
        validation_path = verify_exact_ref(root, precloseout["validation_receipt_ref"], "validation receipt")
        validation_receipt = load_json(validation_path, "validation receipt")
        validate_schema(validation_receipt, validation_schema, "validation receipt")
        require_equal(validation_receipt["evaluation_kind"], "validation", "validation receipt evaluation_kind")
        require_equal(validation_receipt["outcome"], "PASS", "validation receipt outcome")
        require_equal(validation_receipt["input_sha256"], validation_digest, "validation receipt input_sha256")
        require_equal(validation_receipt["diagnostics"], [], "validation receipt diagnostics")

        phase_sequence = [item["phase"] for item in terminal["phase_receipts"]]
        require_equal(phase_sequence, PHASE_SEQUENCE, "terminal phase sequence")
        join = terminal["closeout_join"]
        require_equal(join["required_owner_capabilities"], ["invoke"], "required owner capabilities")
        if len(join["joined_owner_receipts"]) != 1:
            raise ContractError("terminal must join exactly one Invoke owner receipt")
        joined = join["joined_owner_receipts"][0]
        require_equal(joined["owner_capability"], "invoke", "joined owner capability")
        require_equal(joined["result"], "pass", "joined owner result")
        require_equal(joined["receipt_ref"]["path"], closeout_unit["owner_receipt"], "joined owner receipt path")
        owner_path = verify_exact_ref(root, joined["receipt_ref"], "owner receipt")
        owner_receipt = load_json(owner_path, "owner receipt")
        validate_schema(owner_receipt, owner_schema, "owner receipt")
        require_equal(owner_receipt["work_pack_id"], "WP-FMP-002", "owner work_pack_id")
        require_equal(owner_receipt["swu_id"], swu_id, "owner swu_id")
        require_equal(owner_receipt["execution_receipt_sha256"], precloseout_ref["sha256"], "owner execution_receipt_sha256")
        require_equal(owner_receipt["postimage_inventory_sha256"], precloseout["target_result_inventory_ref"]["sha256"], "owner postimage_inventory_sha256")
        require_equal(owner_receipt["successor"], closeout_unit["successor"], "owner successor")
        require_equal(owner_receipt["result"], "pass", "owner result")
        require_equal(owner_receipt["lifecycle_owner_validation"]["status"], "pass", "owner lifecycle validation")
        require_equal(owner_receipt["blockers"], [], "owner blockers")
        require_equal(owner_receipt["authority_effect"], "none", "owner authority_effect")

        continuation = join["continuation"]
        successor = closeout_unit["successor"]
        if successor is None:
            require_equal(continuation["cursor_ref"], None, "terminal successor cursor")
        else:
            cursor_ref = continuation["cursor_ref"]
            if not isinstance(cursor_ref, dict):
                raise ContractError("non-terminal SWU requires an exact continuation cursor ref")
            cursor_path = verify_exact_ref(root, cursor_ref, "continuation cursor")
            cursor = load_json(cursor_path, "continuation cursor")
            require_equal(cursor.get("work_pack_id"), "WP-FMP-002", "cursor work_pack_id")
            require_equal(cursor.get("current_swu"), swu_id, "cursor current_swu")
            require_equal(cursor.get("successor"), successor, "cursor successor")

        if terminal["result"] == "pass":
            if not terminal["output_refs"]:
                raise ContractError("pass terminal output_refs must be non-empty")
            if terminal["residue"]:
                raise ContractError("pass terminal residue must be empty")
            require_equal(precloseout["result"], "pass", "precloseout result")
            require_equal(precloseout["residue"], [], "precloseout residue")
            if precloseout["target_result_inventory_ref"] not in terminal["output_refs"]:
                raise ContractError("pass terminal output_refs must include the target result inventory")

        report = {
            "schema_version": "fmp.terminal-receipt-semantic-validation.v1",
            "status": "pass",
            "work_pack_id": "WP-FMP-002",
            "swu_id": swu_id,
            "terminal_receipt": exact_ref_for(root, args.terminal_receipt),
            "validated_refs": len(list(iter_exact_refs(terminal))) + len(list(iter_exact_refs(precloseout))),
            "successor": successor,
            "authority_effect": "none",
        }
        output = json.dumps(report, indent=2, sort_keys=True) + "\n"
        if args.report:
            Path(args.report).write_text(output, encoding="utf-8")
        else:
            sys.stdout.write(output)
        return 0
    except ContractError as exc:
        sys.stderr.write(f"BLOCK: {exc}\n")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
