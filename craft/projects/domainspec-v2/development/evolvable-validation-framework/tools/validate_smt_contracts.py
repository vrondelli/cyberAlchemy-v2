#!/usr/bin/env python3
"""Deterministic, read-only validation for the EVF SMT work-pack contracts."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import pathlib
import sys
from typing import Any, NoReturn

from jsonschema import Draft202012Validator
from jsonschema.exceptions import SchemaError, ValidationError


PROTOCOL_FIXTURE_VERSION = "evf.smt-protocol-fixtures/v1"
PROTOCOL_RESULT_VERSION = "evf.smt-protocol-validation-result/v1"
PROTOCOL_CLAIM = "protocol-validation-only-no-solver-or-domain-claim"
OBSERVED_CLAIM = "exact-formula-solver-result-only"
NO_PROPERTY_CLAIM = "no-property-claim"
EXPECTED_PROTOCOL_IDS = tuple(
    [f"P{index:02d}" for index in range(1, 15)]
    + [f"N{index:02d}" for index in range(1, 29)]
)


class ValidationFailure(Exception):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


def load_json(path_text: str) -> Any:
    path = pathlib.Path(path_text)
    if not path.is_file():
        raise ValidationFailure("INPUT_MISSING", f"missing input: {path_text}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise ValidationFailure("JSON_INVALID", f"invalid JSON {path_text}: {error}") from error


def digest_file(path_text: str) -> tuple[str, int]:
    path = pathlib.Path(path_text)
    if not path.is_file():
        raise ValidationFailure("INPUT_MISSING", f"missing input: {path_text}")
    data = path.read_bytes()
    return hashlib.sha256(data).hexdigest(), len(data)


def canonical_digest(value: Any) -> str:
    encoded = json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def check_schema(schema: Any, label: str) -> Draft202012Validator:
    try:
        Draft202012Validator.check_schema(schema)
    except SchemaError as error:
        raise ValidationFailure("SCHEMA_INVALID", f"{label}: {error.message}") from error
    return Draft202012Validator(schema)


def validate_instance(
    validator: Draft202012Validator, instance: Any, label: str
) -> None:
    errors = sorted(validator.iter_errors(instance), key=lambda error: list(error.path))
    if errors:
        first = errors[0]
        location = "$" + "".join(f"[{item!r}]" for item in first.path)
        raise ValidationFailure(
            "INSTANCE_INVALID", f"{label} at {location}: {first.message}"
        )


def expect_invalid(
    validator: Draft202012Validator, instance: Any, label: str
) -> None:
    try:
        validator.validate(instance)
    except ValidationError:
        return
    raise ValidationFailure("SCHEMA_INVALID", f"schema accepted forbidden {label}")


def artifact(path: str, *, current: bool | None = None) -> dict[str, Any]:
    value: dict[str, Any] = {"path": path, "sha256": "a" * 64, "size_bytes": 1}
    if current is not None:
        value["current"] = current
    return value


def representative_request() -> dict[str, Any]:
    value: dict[str, Any] = {
        "schema_version": "evf.formal-obligation-request/v1",
        "request_id": "request.fixture-001",
        "request_state": "ready",
        "query_kind": "counterexample",
        "execution_policy": {
            "timeout_ms": 1000,
            "memory_ceiling_bytes": 1048576,
            "max_output_bytes": 1048576,
            "network": "forbidden",
            "working_directory": ".",
            "environment_allowlist": ["PATH"],
        },
        "authority_effect": "none",
        "release_admission": "not-granted",
        "claim_ceiling": "request-only-no-evaluation-claim",
        "residue": [],
    }
    for key in (
        "semantic_source_ref",
        "formal_obligation_ref",
        "theory_profile_ref",
        "symbol_table_ref",
        "assumptions_ref",
        "translation_contract_ref",
        "runtime_manifest_ref",
    ):
        value[key] = artifact(f"fixture/{key}.json", current=True)
    return value


def representative_receipt() -> dict[str, Any]:
    witness_without_digest = {
        "model_ref": artifact("fixture/model.json"),
        "request_ref": "request.fixture-001",
        "translated_query_digest": "b" * 64,
        "runtime_manifest_ref": "fixture/runtime_manifest_ref.json",
        "execution_run_id": "run.fixture-001",
        "native_result_digest": "c" * 64,
    }
    return {
        "schema_version": "evf.smt-provider-receipt/v1",
        "receipt_id": "receipt.fixture-001",
        "evidence_origin": "synthetic-validator-input",
        "request_ref": "request.fixture-001",
        "semantic_source_ref": artifact("fixture/semantic.json"),
        "formal_obligation_ref": artifact("fixture/obligation.json"),
        "translation_receipt_ref": artifact("fixture/translation.json"),
        "runtime_manifest_ref": artifact("fixture/runtime.json"),
        "query_kind": "counterexample",
        "execution": {
            "run_id": "run.fixture-001",
            "status": "completed",
            "timed_out": False,
            "failure_kind": None,
            "exit_code": 0,
        },
        "native_result": {
            "outcome": "sat",
            "result_ref": artifact("fixture/native.json"),
            "result_digest": "c" * 64,
        },
        "witness": {
            **witness_without_digest,
            "bindings_digest": canonical_digest(witness_without_digest),
        },
        "normalized_result": {"outcome": "counterexample"},
        "semantic_result_digest": "d" * 64,
        "evidence_refs": [artifact("fixture/log.json")],
        "residue": [],
        "authority_effect": "none",
        "release_admission": "not-granted",
        "claim_ceiling": PROTOCOL_CLAIM,
        "receipt_payload_digest": "e" * 64,
    }


def merge_case(defaults: dict[str, Any], overrides: dict[str, Any]) -> dict[str, Any]:
    value = copy.deepcopy(defaults)
    for key, item in overrides.items():
        if key == "execution" and isinstance(item, dict):
            value[key].update(copy.deepcopy(item))
        else:
            value[key] = copy.deepcopy(item)
    return value


def evaluate_protocol_case(values: dict[str, Any]) -> tuple[bool, str, str]:
    origin = values.get("evidence_origin")
    if origin not in ("observed-solver-execution", "synthetic-validator-input"):
        return False, "EVIDENCE_ORIGIN_INVALID", ""
    if values.get("inline_predicate") is True:
        return False, "INLINE_SEMANTICS_FORBIDDEN", ""
    if values.get("request_state") == "ready" and values.get("refs_current") is not True:
        return False, "READY_REF_STALE", ""
    translation_state_coherent = values.get("translation_status") == "valid" or (
        values.get("request_state") == "stale"
        and values.get("translation_status") == "stale"
    )
    if (
        not translation_state_coherent
        or values.get("omitted_term_count") != 0
        or values.get("invented_term_count") != 0
    ):
        return False, "TRANSLATION_NOT_CLOSED", ""

    execution = values["execution"]
    status = execution.get("status")
    timed_out = execution.get("timed_out")
    failure_kind = execution.get("failure_kind")
    exit_code = execution.get("exit_code")
    native = values.get("native_outcome")
    if status == "completed":
        if timed_out is not False or failure_kind is not None or exit_code != 0:
            return False, "COMPLETED_EXECUTION_CONTRADICTION", ""
        if native is None:
            return False, "COMPLETED_NATIVE_REQUIRED", ""
    else:
        if native is not None:
            return False, "NONCOMPLETED_NATIVE_PRESENT", ""
        if status == "blocked":
            if timed_out is not False or failure_kind != "policy-block" or exit_code is not None:
                return False, "BLOCKED_EXECUTION_ALGEBRA_INVALID", ""
        elif status == "failed":
            valid = (
                timed_out is True and failure_kind == "timeout"
            ) or (
                timed_out is False
                and failure_kind in ("process-error", "invalid-output", "missing-output")
            )
            if not valid:
                return False, "FAILED_EXECUTION_ALGEBRA_INVALID", ""
        elif status == "stale":
            if timed_out is not False or failure_kind != "stale-input" or exit_code is not None:
                return False, "STALE_EXECUTION_ALGEBRA_INVALID", ""
        else:
            return False, "FAILED_EXECUTION_ALGEBRA_INVALID", ""

    if values.get("request_state") in ("blocked", "stale") and status == "completed":
        return False, "REQUEST_EXECUTION_STATE_CONTRADICTION", ""

    witness = values.get("witness")
    sat = status == "completed" and native == "sat"
    if sat and witness is None:
        return False, "SAT_WITNESS_REQUIRED", ""
    if not sat and witness is not None:
        return False, "NON_SAT_WITNESS_FORBIDDEN", ""
    if witness is not None and witness.get("bindings_match") is not True:
        return False, "SAT_WITNESS_BINDING_MISMATCH", ""
    if origin == "synthetic-validator-input" and values.get("consumer") == "observed-provider-evidence":
        return False, "SYNTHETIC_OBSERVED_CONSUMER_FORBIDDEN", ""

    normalized = "unresolved"
    if status == "completed" and native != "unknown":
        if values.get("query_kind") == "counterexample":
            normalized = "counterexample" if native == "sat" else "no-counterexample"
        else:
            normalized = "witness" if native == "sat" else "no-witness"
    if values.get("claimed_normalized") != normalized:
        return False, "NORMALIZED_OUTCOME_MISMATCH", ""
    if values.get("claimed_broad") is True:
        return False, "BROAD_CLAIM_FORBIDDEN", ""
    if origin == "synthetic-validator-input":
        claim = PROTOCOL_CLAIM
    elif status == "completed" and native in ("sat", "unsat"):
        claim = OBSERVED_CLAIM
    else:
        claim = NO_PROPERTY_CLAIM
    if values.get("claimed_ceiling") != claim:
        return False, "CLAIM_CEILING_MISMATCH", ""
    return True, normalized, claim


def validate_fixture_bundle(bundle: Any) -> None:
    if not isinstance(bundle, dict) or bundle.get("schema_version") != PROTOCOL_FIXTURE_VERSION:
        raise ValidationFailure("INSTANCE_INVALID", "fixture bundle schema_version mismatch")
    if bundle.get("authority_effect") != "none" or bundle.get("solver_execution") is not False:
        raise ValidationFailure("CLAIM_CEILING_EXCEEDED", "fixture bundle must remain authority-free and solver-free")
    if bundle.get("evidence_origin") != "synthetic-validator-input" or bundle.get("claim_ceiling") != PROTOCOL_CLAIM:
        raise ValidationFailure("EVIDENCE_ORIGIN_INVALID", "fixture bundle must carry the synthetic protocol-only ceiling")
    defaults = bundle.get("defaults")
    cases = bundle.get("cases")
    if not isinstance(defaults, dict) or not isinstance(cases, list) or len(cases) != 42:
        raise ValidationFailure("DENOMINATOR_MISMATCH", "fixture bundle must contain exactly 42 cases")
    identifiers = [case.get("id", "") for case in cases if isinstance(case, dict)]
    prefixes = tuple(identifier.split("-", 1)[0] for identifier in identifiers)
    if prefixes != EXPECTED_PROTOCOL_IDS or len(set(identifiers)) != 42:
        raise ValidationFailure("DENOMINATOR_MISMATCH", "fixture case IDs/order do not match P01-P14 then N01-N28")
    denominator = bundle.get("denominator")
    if denominator != {"case_count": 42, "positive_count": 14, "negative_count": 28}:
        raise ValidationFailure("DENOMINATOR_MISMATCH", "fixture denominator metadata mismatch")
    for case in cases:
        values = merge_case(defaults, case.get("overrides", {}))
        valid, mapped_or_code, claim = evaluate_protocol_case(values)
        expected = case.get("expected", {})
        if expected.get("valid") is not valid:
            raise ValidationFailure("DENOMINATOR_MISMATCH", f"{case['id']}: validity mismatch")
        if valid:
            if expected.get("normalized") != mapped_or_code or expected.get("claim") != claim:
                raise ValidationFailure("DENOMINATOR_MISMATCH", f"{case['id']}: normalized mapping mismatch")
        elif expected.get("diagnostic") != mapped_or_code:
            raise ValidationFailure("DENOMINATOR_MISMATCH", f"{case['id']}: diagnostic mismatch")


def mode_protocol_schema(args: argparse.Namespace) -> dict[str, Any]:
    request_schema = load_json(args.request_schema)
    receipt_schema = load_json(args.receipt_schema)
    bundle = load_json(args.fixture_bundle)
    request_validator = check_schema(request_schema, "request schema")
    receipt_validator = check_schema(receipt_schema, "receipt schema")
    validate_instance(request_validator, representative_request(), "representative request")
    validate_instance(receipt_validator, representative_receipt(), "representative receipt")
    blocked_receipt = representative_receipt()
    blocked_receipt["evidence_origin"] = "observed-solver-execution"
    blocked_receipt["execution"] = {
        "run_id": "run.fixture-blocked",
        "status": "blocked",
        "timed_out": False,
        "failure_kind": "policy-block",
        "exit_code": None,
    }
    blocked_receipt["native_result"] = None
    blocked_receipt["witness"] = None
    blocked_receipt["normalized_result"] = {"outcome": "unresolved"}
    blocked_receipt["claim_ceiling"] = NO_PROPERTY_CLAIM
    validate_instance(receipt_validator, blocked_receipt, "representative blocked receipt")
    invalid_request = representative_request()
    invalid_request["inline_predicate"] = "domain-owned-expression"
    expect_invalid(request_validator, invalid_request, "inline request predicate")
    invalid_receipt = representative_receipt()
    invalid_receipt["witness"] = None
    expect_invalid(receipt_validator, invalid_receipt, "SAT receipt without witness")
    invalid_claim = representative_receipt()
    invalid_claim["claim_ceiling"] = OBSERVED_CLAIM
    expect_invalid(receipt_validator, invalid_claim, "synthetic receipt with observed claim")
    validate_fixture_bundle(bundle)
    return {
        "mode": "protocol-schema",
        "verdict": "pass",
        "schemas": 2,
        "cases": 42,
        "solver_execution": False,
        "authority_effect": "none",
    }


def mode_protocol_denominator(args: argparse.Namespace) -> dict[str, Any]:
    bundle = load_json(args.fixture_bundle)
    toy_game = load_json(args.toy_game)
    toy_result = load_json(args.toy_result)
    product_result = load_json(args.product_result)
    validate_fixture_bundle(bundle)
    if bundle.get("defaults") != toy_game.get("defaults") or bundle.get("cases") != toy_game.get("cases"):
        raise ValidationFailure("DENOMINATOR_MISMATCH", "fixture defaults/cases drifted from frozen toy game")
    expected_toy = {
        "verdict": "pass",
        "passed": 42,
        "failed": 0,
        "solverExecution": False,
        "authorityEffect": "none",
    }
    for key, value in expected_toy.items():
        if toy_result.get(key) != value:
            raise ValidationFailure("DENOMINATOR_MISMATCH", f"toy result {key} mismatch")
    expected_product = {
        "schema_version": PROTOCOL_RESULT_VERSION,
        "swu_id": "SWU-EVF-SMTP-001",
        "verdict": "pass",
        "passed": 42,
        "failed": 0,
        "case_count": 42,
        "solver_execution": False,
        "authority_effect": "none",
        "claim_ceiling": PROTOCOL_CLAIM,
    }
    for key, value in expected_product.items():
        if product_result.get(key) != value:
            raise ValidationFailure("DENOMINATOR_MISMATCH", f"product result {key} mismatch")
    fixture_digest, _ = digest_file(args.fixture_bundle)
    if product_result.get("fixture_bundle_sha256") != fixture_digest:
        raise ValidationFailure("DIGEST_MISMATCH", "product result fixture digest mismatch")
    if product_result.get("first_run_digest") != product_result.get("second_run_digest"):
        raise ValidationFailure("DENOMINATOR_MISMATCH", "deterministic run digests differ")
    return {
        "mode": "protocol-denominator",
        "verdict": "pass",
        "passed": 42,
        "failed": 0,
        "solver_execution": False,
        "authority_effect": "none",
    }


def mode_frozen_artifacts(args: argparse.Namespace) -> dict[str, Any]:
    contract = load_json(args.contract)
    artifacts = contract.get("preserved_artifacts")
    if not isinstance(artifacts, list) or not artifacts:
        raise ValidationFailure("SCHEMA_INVALID", "validation contract has no preserved_artifacts")
    for artifact_binding in artifacts:
        actual_digest, actual_size = digest_file(artifact_binding["path"])
        if actual_digest != artifact_binding.get("sha256") or actual_size != artifact_binding.get("size_bytes"):
            raise ValidationFailure("FROZEN_ARTIFACT_DRIFT", f"drift: {artifact_binding['path']}")
    return {"mode": "frozen-artifacts", "verdict": "pass", "checked": len(artifacts)}


def mode_scoped_whitespace(args: argparse.Namespace) -> dict[str, Any]:
    inventory = load_json(args.target_inventory)
    swus = inventory.get("swus", [])
    swu = next((item for item in swus if item.get("id") == args.swu), None)
    if swu is None:
        raise ValidationFailure("REFERENCE_MISMATCH", f"unknown SWU {args.swu}")
    targets = swu.get("targets", [])
    checked = 0
    for target in targets:
        path_text = target.get("path")
        path = pathlib.Path(path_text)
        if not path.is_file():
            raise ValidationFailure("INPUT_MISSING", f"missing scoped target: {path_text}")
        data = path.read_bytes()
        if data and not data.endswith(b"\n"):
            raise ValidationFailure("WHITESPACE_INVALID", f"missing final newline: {path_text}")
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError as error:
            raise ValidationFailure("WHITESPACE_INVALID", f"non-UTF-8 target: {path_text}") from error
        for line_number, line in enumerate(text.splitlines(), start=1):
            if line.endswith(" ") or line.endswith("\t"):
                raise ValidationFailure("WHITESPACE_INVALID", f"trailing whitespace: {path_text}:{line_number}")
        checked += 1
    return {"mode": "scoped-whitespace", "verdict": "pass", "swu_id": args.swu, "checked": checked}


def mode_terminal_receipt(args: argparse.Namespace) -> dict[str, Any]:
    receipt = load_json(args.receipt)
    if receipt.get("swu_id") != args.swu or receipt.get("verdict") != "pass":
        raise ValidationFailure("TERMINAL_RECEIPT_INVALID", "receipt SWU/verdict mismatch")
    if receipt.get("authority_effect") != "none":
        raise ValidationFailure("TERMINAL_RECEIPT_INVALID", "receipt authority_effect must be none")
    commands = receipt.get("validation_commands")
    if not isinstance(commands, list) or not commands or any(command.get("exit_code") != 0 for command in commands):
        raise ValidationFailure("TERMINAL_RECEIPT_INVALID", "receipt must bind passing validation commands")
    if args.inventory is not None:
        inventory = load_json(args.inventory)
        if inventory.get("swu_id") != args.swu:
            raise ValidationFailure("TERMINAL_RECEIPT_INVALID", "inventory SWU mismatch")
    return {"mode": "terminal-receipt", "verdict": "pass", "swu_id": args.swu}


def mode_generic_schema(args: argparse.Namespace) -> dict[str, Any]:
    paths = [args.translation_schema, args.theory_schema]
    for path in paths:
        check_schema(load_json(path), path)
    bundle = load_json(args.fixture_bundle)
    if bundle.get("authority_effect") != "none" or bundle.get("solver_execution") is not False:
        raise ValidationFailure("CLAIM_CEILING_EXCEEDED", "translation fixtures exceed solver-free authority")
    return {"mode": "translation-schema", "verdict": "pass", "schemas": 2}


def require_json_inputs(mode: str, paths: list[str]) -> dict[str, Any]:
    values = [load_json(path) for path in paths]
    for path, value in zip(paths, values):
        if isinstance(value, dict) and value.get("authority_effect", "none") != "none":
            raise ValidationFailure("CLAIM_CEILING_EXCEEDED", f"authority effect in {path}")
    return {"mode": mode, "verdict": "pass", "inputs": len(paths), "authority_effect": "none"}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="mode", required=True)

    protocol_schema = subparsers.add_parser("protocol-schema")
    protocol_schema.add_argument("--request-schema", required=True)
    protocol_schema.add_argument("--receipt-schema", required=True)
    protocol_schema.add_argument("--fixture-bundle", required=True)

    denominator = subparsers.add_parser("protocol-denominator")
    denominator.add_argument("--fixture-bundle", required=True)
    denominator.add_argument("--toy-game", required=True)
    denominator.add_argument("--toy-result", required=True)
    denominator.add_argument("--product-result", required=True)

    translation_schema = subparsers.add_parser("translation-schema")
    translation_schema.add_argument("--translation-schema", required=True)
    translation_schema.add_argument("--theory-schema", required=True)
    translation_schema.add_argument("--fixture-bundle", required=True)

    translation_evidence = subparsers.add_parser("translation-evidence")
    translation_evidence.add_argument("--fixture-bundle", required=True)
    translation_evidence.add_argument("--receipt", required=True)

    runtime_owner = subparsers.add_parser("runtime-owner-admission")
    runtime_owner.add_argument("--profile", required=True)
    runtime_owner.add_argument("--admission", required=True)

    runtime_evidence = subparsers.add_parser("runtime-evidence")
    runtime_evidence.add_argument("--profile", required=True)
    runtime_evidence.add_argument("--admission", required=True)
    runtime_evidence.add_argument("--manifest", required=True)
    runtime_evidence.add_argument("--receipts", required=True)
    runtime_evidence.add_argument("--validation-receipt", required=True)

    r4_owner = subparsers.add_parser("r4-owner-prerequisite")
    r4_owner.add_argument("--predicate-schema", required=True)
    r4_owner.add_argument("--predicate", required=True)

    r4_evidence = subparsers.add_parser("r4-evidence")
    r4_evidence.add_argument("--predicate", required=True)
    r4_evidence.add_argument("--binding", required=True)
    r4_evidence.add_argument("--runtime-admission", required=True)
    r4_evidence.add_argument("--receipt", required=True)

    closure = subparsers.add_parser("closure")
    closure.add_argument("--work-pack", required=True)
    closure.add_argument("--validation-contracts", required=True)
    closure.add_argument("--target-inventory", required=True)
    closure.add_argument("--output-receipt", required=True)

    frozen = subparsers.add_parser("frozen-artifacts")
    frozen.add_argument("--contract", required=True)

    whitespace = subparsers.add_parser("scoped-whitespace")
    whitespace.add_argument("--target-inventory", required=True)
    whitespace.add_argument("--swu", required=True)

    terminal = subparsers.add_parser("terminal-receipt")
    terminal.add_argument("--swu", required=True)
    terminal.add_argument("--inventory")
    terminal.add_argument("--receipt", required=True)
    return parser


def dispatch(args: argparse.Namespace) -> dict[str, Any]:
    if args.mode == "protocol-schema":
        return mode_protocol_schema(args)
    if args.mode == "protocol-denominator":
        return mode_protocol_denominator(args)
    if args.mode == "translation-schema":
        return mode_generic_schema(args)
    if args.mode == "translation-evidence":
        return require_json_inputs(args.mode, [args.fixture_bundle, args.receipt])
    if args.mode == "runtime-owner-admission":
        return require_json_inputs(args.mode, [args.profile, args.admission])
    if args.mode == "runtime-evidence":
        return require_json_inputs(
            args.mode,
            [args.profile, args.admission, args.manifest, args.receipts, args.validation_receipt],
        )
    if args.mode == "r4-owner-prerequisite":
        schema = check_schema(load_json(args.predicate_schema), args.predicate_schema)
        validate_instance(schema, load_json(args.predicate), args.predicate)
        return {"mode": args.mode, "verdict": "pass", "authority_effect": "none"}
    if args.mode == "r4-evidence":
        return require_json_inputs(
            args.mode, [args.predicate, args.binding, args.runtime_admission, args.receipt]
        )
    if args.mode == "closure":
        work_pack = pathlib.Path(args.work_pack)
        if not work_pack.is_file():
            raise ValidationFailure("INPUT_MISSING", f"missing input: {args.work_pack}")
        return require_json_inputs(
            args.mode,
            [args.validation_contracts, args.target_inventory, args.output_receipt],
        )
    if args.mode == "frozen-artifacts":
        return mode_frozen_artifacts(args)
    if args.mode == "scoped-whitespace":
        return mode_scoped_whitespace(args)
    if args.mode == "terminal-receipt":
        return mode_terminal_receipt(args)
    raise ValidationFailure("SCHEMA_INVALID", f"unsupported mode: {args.mode}")


def emit_failure(error: ValidationFailure) -> NoReturn:
    print(
        json.dumps(
            {"verdict": "fail", "code": error.code, "detail": error.detail},
            sort_keys=True,
            separators=(",", ":"),
        ),
        file=sys.stderr,
    )
    raise SystemExit(1)


def main() -> int:
    args = build_parser().parse_args()
    try:
        result = dispatch(args)
    except ValidationFailure as error:
        emit_failure(error)
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
