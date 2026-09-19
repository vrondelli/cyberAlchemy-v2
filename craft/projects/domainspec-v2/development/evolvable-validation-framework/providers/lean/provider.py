#!/usr/bin/env python3
"""Execute one exact Lean request and emit a deterministic bounded receipt."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

try:
    from .identity import (
        IdentityError,
        canonical_digest,
        exact_ref,
        load_json,
        repository_root,
        resolve_relative,
        sha256_bytes,
        verify_exact_ref,
    )
except ImportError:  # pragma: no cover - direct script entry
    from identity import (  # type: ignore[no-redef]
        IdentityError,
        canonical_digest,
        exact_ref,
        load_json,
        repository_root,
        resolve_relative,
        sha256_bytes,
        verify_exact_ref,
    )


EVF_ROOT = Path(__file__).resolve().parents[2]
REQUEST_SCHEMA = EVF_ROOT / "contracts/lean-theorem-request.v1.schema.json"
RUNTIME_SCHEMA = EVF_ROOT / "contracts/lean-provider-manifest.v1.schema.json"
RECEIPT_SCHEMA = EVF_ROOT / "contracts/lean-theorem-receipt.v1.schema.json"
DECLARATION_RE = re.compile(
    r"^\s*(?:private\s+|protected\s+)?(?:theorem|lemma|example)\s+([A-Za-z_][A-Za-z0-9_'.]*)"
)
NAMESPACE_RE = re.compile(r"^\s*namespace\s+([A-Za-z_][A-Za-z0-9_'.]*)\s*$")
END_RE = re.compile(r"^\s*end(?:\s+[A-Za-z_][A-Za-z0-9_'.]*)?\s*$")


class ProviderError(RuntimeError):
    pass


def _validate(schema_path: Path, value: Any, label: str) -> None:
    schema = load_json(schema_path)
    Draft202012Validator.check_schema(schema)
    errors = sorted(
        Draft202012Validator(schema).iter_errors(value),
        key=lambda error: list(error.absolute_path),
    )
    if errors:
        first = errors[0]
        location = "/".join(map(str, first.absolute_path)) or "<root>"
        raise ProviderError(f"{label} invalid at {location}: {first.message}")


def _strip_lean_comments(source: str) -> str:
    output: list[str] = []
    index = 0
    block_depth = 0
    while index < len(source):
        if block_depth == 0 and source.startswith("--", index):
            newline = source.find("\n", index)
            if newline < 0:
                break
            output.append("\n")
            index = newline + 1
        elif source.startswith("/-", index):
            block_depth += 1
            index += 2
        elif block_depth and source.startswith("-/", index):
            block_depth -= 1
            index += 2
        elif block_depth:
            output.append("\n" if source[index] == "\n" else " ")
            index += 1
        else:
            output.append(source[index])
            index += 1
    return "".join(output)


def analyze_source(source: str) -> dict[str, Any]:
    stripped = _strip_lean_comments(source)
    namespace_stack: list[str] = []
    declaration_names: list[str] = []
    for line in stripped.splitlines():
        namespace_match = NAMESPACE_RE.match(line)
        if namespace_match:
            namespace_stack.append(namespace_match.group(1))
            continue
        declaration_match = DECLARATION_RE.match(line)
        if declaration_match:
            declaration_names.append(
                ".".join([*namespace_stack, declaration_match.group(1)])
            )
            continue
        if END_RE.match(line) and namespace_stack:
            namespace_stack.pop()
    names = sorted(set(declaration_names))
    forbidden = [
        name
        for name, pattern in (
            ("sorry", r"\bsorry\b"),
            ("unsafe", r"\bunsafe\b"),
            ("axiom", r"(?m)^\s*axiom\b"),
        )
        if re.search(pattern, stripped)
    ]
    return {
        "theorem_declaration_count": len(names),
        "declaration_names": names,
        "forbidden_constructs": forbidden,
    }


def bind_expected_declarations(
    analysis: dict[str, Any], expected_declarations: list[str]
) -> dict[str, Any]:
    bound = dict(analysis)
    expected = sorted(set(expected_declarations))
    bound["expected_declarations"] = expected
    bound["missing_expected_declarations"] = sorted(
        set(expected) - set(analysis["declaration_names"])
    )
    return bound


def _run_once(
    command: list[str], root: Path, limits: dict[str, int], run_id: str
) -> tuple[dict[str, Any], bytes, bytes]:
    try:
        completed = subprocess.run(
            command,
            cwd=root,
            env={},
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=limits["timeout_ms"] / 1000,
            check=False,
        )
        stdout = completed.stdout
        stderr = completed.stderr
        timed_out = False
        exit_code: int | None = completed.returncode
    except subprocess.TimeoutExpired as error:
        stdout = error.stdout or b""
        stderr = error.stderr or b""
        timed_out = True
        exit_code = None
    maximum = limits["max_output_bytes"]
    if len(stdout) + len(stderr) > maximum:
        raise ProviderError(
            f"provider output exceeds max_output_bytes ({len(stdout) + len(stderr)} > {maximum})"
        )
    row = {
        "run_id": run_id,
        "exit_code": exit_code,
        "timed_out": timed_out,
        "stdout_sha256": sha256_bytes(stdout),
        "stderr_sha256": sha256_bytes(stderr),
        "output_bytes": len(stdout) + len(stderr),
    }
    return row, stdout, stderr


def _unresolved_receipt(
    request_path: Path,
    request: dict[str, Any],
    root: Path,
    outcome: str,
    residue: list[str],
) -> dict[str, Any]:
    receipt: dict[str, Any] = {
        "schema_version": "evf.lean-theorem-receipt/v1",
        "receipt_id": f"{request['request_id']}.receipt/v1",
        "request_id": request["request_id"],
        "request_ref": exact_ref(root, request_path),
        "input_refs": [
            {key: value for key, value in request[name].items() if key != "current"}
            for name in (
                "formal_claim_lean_binding_ref",
                "theorem_statement_ref",
                "provider_profile_ref",
                "runtime_binding_ref",
                "execution_policy_ref",
            )
        ],
        "provider": {
            "provider_id": "lean4-core-typechecker",
            "provider_version": "unresolved",
            "executable_ref": {"path": "unresolved", "sha256": "0" * 64, "size_bytes": 0},
            "network_control": "declared-forbidden-closed-command-no-kernel-isolation",
        },
        "source_analysis": {
            "theorem_declaration_count": 0,
            "declaration_names": [],
            "expected_declarations": sorted(request.get("expected_declarations", [])),
            "missing_expected_declarations": sorted(request.get("expected_declarations", [])),
            "forbidden_constructs": [],
        },
        "execution": {"working_directory": ".", "environment_allowlist": [], "memory_ceiling_bytes": 1, "memory_control": "declared-not-os-enforced", "repetition_count": 0, "runs": [], "deterministic": False},
        "native_outcome": outcome,
        "normalized_outcome": "unresolved",
        "proof_status": "not-established",
        "residue": sorted(set(residue)),
        "authority_effect": "none",
        "release_admission": "not-granted",
        "claim_ceiling": "no-proof-claim",
    }
    receipt["receipt_payload_digest"] = canonical_digest(receipt)
    return receipt


def execute_request(request_path: Path, root: Path | None = None) -> dict[str, Any]:
    root = (root or repository_root(request_path)).resolve()
    request_path = request_path.resolve(strict=True)
    request = load_json(request_path)
    _validate(REQUEST_SCHEMA, request, "request")
    if request["request_state"] != "ready":
        receipt = _unresolved_receipt(
            request_path, request, root, "stale" if request["request_state"] == "stale" else "failed", [f"request_state={request['request_state']}"]
        )
        _validate(RECEIPT_SCHEMA, receipt, "receipt")
        return receipt

    try:
        bound_paths = {
            name: verify_exact_ref(root, request[name])
            for name in (
                "formal_claim_lean_binding_ref",
                "theorem_statement_ref",
                "provider_profile_ref",
                "runtime_binding_ref",
                "execution_policy_ref",
            )
        }
    except IdentityError as error:
        receipt = _unresolved_receipt(request_path, request, root, "stale", [str(error)])
        _validate(RECEIPT_SCHEMA, receipt, "receipt")
        return receipt

    runtime = load_json(bound_paths["runtime_binding_ref"])
    policy = load_json(bound_paths["execution_policy_ref"])
    _validate(RUNTIME_SCHEMA, runtime, "runtime binding")
    command = runtime["command"]
    executable = Path(command[0]).resolve(strict=True)
    executable_data = executable.read_bytes()
    if sha256_bytes(executable_data) != runtime["provider_digest"]:
        receipt = _unresolved_receipt(request_path, request, root, "stale", ["provider executable digest mismatch"])
        _validate(RECEIPT_SCHEMA, receipt, "receipt")
        return receipt
    if command[1] != request["theorem_statement_ref"]["path"]:
        receipt = _unresolved_receipt(request_path, request, root, "failed", ["runtime command does not target theorem_statement_ref"])
        _validate(RECEIPT_SCHEMA, receipt, "receipt")
        return receipt
    repetitions = policy.get("execution_controls", {}).get("deterministic_repetitions")
    if repetitions != 2 or runtime["environment_allowlist"] != [] or runtime["network"] != "forbidden":
        receipt = _unresolved_receipt(request_path, request, root, "failed", ["execution policy is outside the closed two-run provider contract"])
        _validate(RECEIPT_SCHEMA, receipt, "receipt")
        return receipt

    analysis = analyze_source(bound_paths["theorem_statement_ref"].read_text(encoding="utf-8"))
    expected_declarations = sorted(request.get("expected_declarations", []))
    analysis = bind_expected_declarations(analysis, expected_declarations)
    source_residue: list[str] = []
    if analysis["forbidden_constructs"]:
        source_residue.append(
            "forbidden Lean constructs: " + ", ".join(analysis["forbidden_constructs"])
        )
    if analysis["missing_expected_declarations"]:
        source_residue.append(
            "missing expected Lean declarations: "
            + ", ".join(analysis["missing_expected_declarations"])
        )
    if source_residue:
        receipt = _unresolved_receipt(
            request_path,
            request,
            root,
            "rejected",
            source_residue,
        )
        receipt["source_analysis"] = analysis
        receipt["receipt_payload_digest"] = canonical_digest({key: value for key, value in receipt.items() if key != "receipt_payload_digest"})
        _validate(RECEIPT_SCHEMA, receipt, "receipt")
        return receipt

    runs: list[dict[str, Any]] = []
    streams: list[tuple[bytes, bytes]] = []
    for index in range(1, repetitions + 1):
        try:
            row, stdout, stderr = _run_once(
                command, root, runtime["limits"], f"lean-run-{index:02d}"
            )
        except FileNotFoundError:
            receipt = _unresolved_receipt(request_path, request, root, "unsupported", ["Lean executable missing"])
            _validate(RECEIPT_SCHEMA, receipt, "receipt")
            return receipt
        runs.append(row)
        streams.append((stdout, stderr))

    deterministic = all(
        (row["exit_code"], row["timed_out"], row["stdout_sha256"], row["stderr_sha256"])
        == (runs[0]["exit_code"], runs[0]["timed_out"], runs[0]["stdout_sha256"], runs[0]["stderr_sha256"])
        for row in runs[1:]
    )
    if any(row["timed_out"] for row in runs):
        native = "timeout"
    elif not deterministic:
        native = "indeterminate"
    elif all(row["exit_code"] == 0 for row in runs):
        native = "checked"
    elif all(isinstance(row["exit_code"], int) and row["exit_code"] != 0 for row in runs):
        native = "rejected"
    else:
        native = "failed"

    control_residue = [
        "Memory ceiling is declared but not OS-enforced by this provider",
        "Network is forbidden by the closed Lean command contract but not isolated by a kernel network namespace",
    ]
    if native == "checked" and expected_declarations:
        normalized = "theorem-checked"
        proof_status = "lean-theorem-declarations-checked"
        ceiling = "exact-lean-theorem-declarations-checked-only"
        residue: list[str] = control_residue
    elif native == "checked" and analysis["theorem_declaration_count"] == 0:
        normalized = "elaboration-checked"
        proof_status = "not-established-no-theorem-declaration"
        ceiling = "lean-elaboration-only-no-theorem-proof"
        residue = [
            "Lean source contains no theorem, lemma, or example declaration",
            *control_residue,
        ]
    elif native == "checked":
        normalized = "elaboration-checked"
        proof_status = "not-established-no-bound-theorem-declaration"
        ceiling = "lean-elaboration-only-no-theorem-proof"
        residue = [
            "Lean request names no expected theorem declaration",
            *control_residue,
        ]
    else:
        normalized = "unresolved"
        proof_status = "not-established"
        ceiling = "no-proof-claim"
        residue = [f"Lean provider outcome: {native}", *control_residue]

    receipt = {
        "schema_version": "evf.lean-theorem-receipt/v1",
        "receipt_id": f"{request['request_id']}.receipt/v1",
        "request_id": request["request_id"],
        "request_ref": exact_ref(root, request_path),
        "input_refs": [
            {key: value for key, value in request[name].items() if key != "current"}
            for name in (
                "formal_claim_lean_binding_ref",
                "theorem_statement_ref",
                "provider_profile_ref",
                "runtime_binding_ref",
                "execution_policy_ref",
            )
        ],
        "provider": {
            "provider_id": runtime["provider_id"],
            "provider_version": runtime["provider_version"],
            "executable_ref": {
                "path": str(executable),
                "sha256": sha256_bytes(executable_data),
                "size_bytes": len(executable_data),
            },
            "network_control": "declared-forbidden-closed-command-no-kernel-isolation",
        },
        "source_analysis": analysis,
        "execution": {
            "working_directory": runtime["working_directory"],
            "environment_allowlist": runtime["environment_allowlist"],
            "memory_ceiling_bytes": runtime["limits"]["memory_ceiling_bytes"],
            "memory_control": "declared-not-os-enforced",
            "repetition_count": repetitions,
            "runs": runs,
            "deterministic": deterministic,
        },
        "native_outcome": native,
        "normalized_outcome": normalized,
        "proof_status": proof_status,
        "residue": residue,
        "authority_effect": "none",
        "release_admission": "not-granted",
        "claim_ceiling": ceiling,
    }
    receipt["receipt_payload_digest"] = canonical_digest(receipt)
    _validate(RECEIPT_SCHEMA, receipt, "receipt")
    return receipt


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--request", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        receipt = execute_request(args.request)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    except (IdentityError, ProviderError, OSError, ValueError) as error:
        print(f"LEAN_PROVIDER_ERROR={error}", file=sys.stderr)
        return 2
    print(f"LEAN_PROVIDER_OUTCOME={receipt['native_outcome']}")
    print(f"NORMALIZED_OUTCOME={receipt['normalized_outcome']}")
    print(f"PROOF_STATUS={receipt['proof_status']}")
    print(f"RECEIPT={args.output}")
    return 0 if receipt["native_outcome"] == "checked" else 1


if __name__ == "__main__":
    raise SystemExit(main())
