#!/usr/bin/env python3
"""Fail-closed census of decision-typed bodies in four selected Auth MIR builds.

This identifies a bounded compiled *shape*, not all semantic policy clones or
runtime reachability. Ingress/carrier roles remain candidate classifications.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_root_context_census_v7", CASE / "auth-v4b-root-context-census-v7.py")
assert SPEC and SPEC.loader
v7 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v7)

DECISION = re.compile(r"(?<![A-Za-z0-9_])(?:BinaryAuthorizationDecision|AuthorizationDecision)(?:::|\b)")
CONSTRUCTOR = re.compile(
    r"(?<![A-Za-z0-9_])(?:BinaryAuthorizationDecision|AuthorizationDecision)::(Allow|Deny)\b")
LOCAL_SOURCE = str(v7.IMPL)
BASE_COUNTS = {
    "state-enum-support": 4,
    "policy-enum-clone": 1,
    "policy-enum-support": 6,
    "policy-decision-producer": 1,
    "policy-deny-variant-constructor": 2,
    "post-ready-decision-mapper": 1,
}
API_COUNTS = {
    "api-runtime-poll-carrier": 1,
    "api-blocking-worker-carrier": 1,
    "api-ready-callback-carrier": 1,
    "api-handler-poll-carrier": 1,
    "api-deny-response-projection": 1,
    "api-response-projection": 1,
}
EXPECTED_CONSTRUCTORS = {
    "state-enum-support": {},
    "policy-enum-clone": {"Allow": 1, "Deny": 1},
    "policy-enum-support": {},
    "policy-decision-producer": {"Allow": 1, "Deny": 1},
    "policy-deny-variant-constructor": {"Deny": 1},
    "post-ready-decision-mapper": {"Allow": 1, "Deny": 1},
    **{role: {} for role in API_COUNTS},
    "bridge-result-carrier": {},
}
EXPECTED_SUPPORT_METHODS = {
    "state-enum-support": {"clone", "fmt", "eq", "assert_fields_are_eq"},
    "policy-enum-support": {"fmt", "eq", "assert_fields_are_eq",
                            "partial_cmp", "cmp", "hash"},
}


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def decision_bodies(mir: dict[str, str]) -> tuple[list[dict], dict[str, int]]:
    """Parse every MIR function before filtering decision-typed signatures/bodies."""
    rows, counts = [], {}
    for manifest, source in sorted(mir.items()):
        require(isinstance(manifest, str) and isinstance(source, str),
                "MIR package shape changed")
        signature, start, body = None, None, []
        counts[manifest] = 0

        def finish() -> None:
            if signature is None:
                return
            raw_body = "\n".join(body)
            if not DECISION.search(signature + "\n" + raw_body):
                return
            matches = CONSTRUCTOR.findall(raw_body)
            constructors = {kind: matches.count(kind) for kind in ("Allow", "Deny")}
            constructors = {kind: count for kind, count in constructors.items() if count}
            rows.append({"manifest": manifest, "signature": signature,
                         "line": start, "return_type": signature.rsplit(") -> ", 1)[-1]
                         if ") -> " in signature else "unknown",
                         "constructors": constructors,
                         "body_sha256": hashlib.sha256(raw_body.encode()).hexdigest()})

        for number, line in enumerate(source.splitlines(), 1):
            opened = v7.v6.FUNCTION_START.match(line)
            if line.startswith("fn ") and opened is None:
                raise ValueError(f"{manifest}:{number}: unparsed MIR function header")
            if opened:
                require(signature is None, f"{manifest}:{number}: nested MIR function header")
                signature, start, body = opened.group(1), number, []
                counts[manifest] += 1
            elif line == "}" and signature is not None:
                finish()
                signature, start, body = None, None, []
            elif signature is not None:
                body.append(line)
        require(signature is None and counts[manifest] > 0,
                f"{manifest}: incomplete or empty MIR function set")
    return rows, counts


def role_for(row: dict) -> str:
    manifest = row["manifest"]
    signature = row["signature"]
    state = "authorization-state-model/Cargo.toml"
    policy = "standard-runtime/Cargo.toml"
    ready = "authorization-ready-decision/Cargo.toml"
    api = "authorization-api/Cargo.toml"
    if manifest == state and re.fullmatch(
            rf"<impl at {re.escape(LOCAL_SOURCE)}/authorization-state-model/src/lib\.rs:\d+:\d+: \d+:\d+>::(?:clone|fmt|eq|assert_fields_are_eq)\(.+",
            signature):
        return "state-enum-support"
    if manifest == policy:
        if signature == "authorize(_1: &EvaluationContext) -> AuthorizationDecision":
            return "policy-decision-producer"
        if signature == "AuthorizationDecision::Deny(_1: DenyReason) -> AuthorizationDecision":
            return "policy-deny-variant-constructor"
        match = re.fullmatch(
            rf"<impl at {re.escape(LOCAL_SOURCE)}/standard-runtime/src/domainspec/rust/auth-exact-permission/authorize\.rs:\d+:\d+: \d+:\d+>::(clone|fmt|eq|assert_fields_are_eq|partial_cmp|cmp|hash)\(.+",
            signature)
        if match:
            return "policy-enum-clone" if match.group(1) == "clone" else "policy-enum-support"
    if manifest == ready and signature == (
            "authorize(_1: ReadyAuthorization<'_, '_>) -> BinaryAuthorizationDecision"):
        return "post-ready-decision-mapper"
    if manifest == api:
        prefix = r"<impl at src/lib\.rs:\d+:\d+: \d+:\d+>::authorize::\{closure#0\}"
        if re.fullmatch(prefix + r"\(.+\) -> Poll<Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>>", signature):
            return "api-runtime-poll-carrier"
        if re.fullmatch(prefix + r"::\{closure#0\}\(.+\) -> Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>", signature):
            return "api-blocking-worker-carrier"
        if re.fullmatch(prefix + r"::\{closure#0\}::\{closure#0\}\(.+\) -> BinaryAuthorizationDecision", signature):
            return "api-ready-callback-carrier"
        if re.fullmatch(r"authorize::\{closure#0\}\(.+\) -> Poll<Response<Body>>", signature):
            return "api-handler-poll-carrier"
        if signature == "deny(_1: StatusCode) -> Response<Body>":
            return "api-deny-response-projection"
        if signature == "respond(_1: StatusCode, _2: BinaryAuthorizationDecision) -> Response<Body>":
            return "api-response-projection"
    if manifest in {
            "tenant-bridge/Cargo.toml",
            "authentication-prototype/bridge/Cargo.toml",
            "authentication-https/bridge/Cargo.toml",
    } and re.fullmatch(r"evaluate(?:\:\:\{closure#\d+\})?\(.*\) -> (?:bool|Result<bool, Box<dyn StdError>>)", signature):
        return "bridge-result-carrier"
    raise ValueError(f"unclassified compiled decision-shaped body: {manifest}:{row['line']}:{signature}")


def classify_row(row: dict) -> dict:
    role = role_for(row)
    require(row["constructors"] == EXPECTED_CONSTRUCTORS[role],
            f"compiled decision constructors changed: {row['manifest']}:{row['line']}:{role}")
    return {**row, "role": role}


def check_support_methods(root_id: str, classified: list[dict]) -> None:
    for role, methods in EXPECTED_SUPPORT_METHODS.items():
        observed = []
        for row in classified:
            if row["role"] != role:
                continue
            match = re.search(r">::([a-z_]+)\(", row["signature"])
            require(match is not None, f"{root_id}: {role} method identity missing")
            observed.append(match.group(1))
        require(len(observed) == len(set(observed)) and set(observed) == methods,
                f"{root_id}: {role} method set changed")


def check_role_profile(root_id: str, classified: list[dict]) -> dict[str, int]:
    expected = {**BASE_COUNTS, **(API_COUNTS if root_id == "api" else
                                 {"bridge-result-carrier": 1})}
    actual = {role: sum(row["role"] == role for row in classified)
              for role in set(row["role"] for row in classified)}
    require(actual == expected, f"{root_id}: compiled decision role counts changed: {actual}")
    check_support_methods(root_id, classified)
    return actual


def inspect(root_id: str, mir: dict[str, str], identities: dict[str, dict]) -> dict:
    require(root_id in v7.v6.ROOT_MANIFESTS and set(mir) == set(identities),
            "root-context MIR identity set changed")
    rows, counts = decision_bodies(mir)
    classified = [classify_row(row) for row in rows]
    actual = check_role_profile(root_id, classified)
    return {"root_id": root_id, "compiled_function_count": sum(counts.values()),
            "decision_shaped_body_count": len(classified), "role_counts": actual,
            "decision_shaped_bodies": classified,
            "semantic_endpoint_roles_closed": False,
            "claim_limit": "Every current local MIR body mentioning the two decision enums is classified by current signature and Allow/Deny constructor count. Ingress/carrier labels are candidate source roles, not a proof of no independent policy behavior, call reachability, or all native endpoints."}


def evaluate() -> dict:
    result = v7.evaluate(mir_inspector=inspect)
    return {"schema_version": "auth-foundation.v4b-compiled-decision-body/v20-candidate",
            "status": "indeterminate", "root_context": result,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Four source-bound root-context MIR builds classify current decision-typed local bodies and decision-enum constructor counts. This rejects an added decision-typed body or constructor but does not detect Boolean policy clones, resolve indirect/external effects, prove every native endpoint or same-request READY dominance, or observe runtime guarantees."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
