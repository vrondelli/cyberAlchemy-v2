#!/usr/bin/env python3
"""Normal-build MIR call census for the selected Auth roots; not an effect proof."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
IMPL = ROOT / "auth-foundation/implementation"
CASE = Path(__file__).resolve().parent
TOOLCHAIN = ROOT / "tools/toolchain/run"
PREDECESSOR = CASE / "auth-v4b-concrete-pool-successor.mjs"
BINDING = CASE / "AUTH-V4B-TYPED-CALL-CENSUS.v4-candidate.json"
DOC = CASE / "AUTH-V4B-TYPED-CALL-CENSUS.v4-candidate.md"
TEST = CASE / "test_auth_v4b_typed_call_census_v4.py"
ROOTS = {
    "api": ("authorization-api", "auth_foundation_authorization_api", "--lib"),
    "service": ("authorization-service", "auth_foundation_authorization_service", "--lib"),
    "authority": ("authorization-ready-authority", "auth_foundation_authorization_ready_authority", "--lib"),
    "decision": ("authorization-ready-decision", "auth_foundation_authorization_ready_decision", "--lib"),
    "tenant": ("tenant-bridge", "auth_tenant_bridge", "--bin=auth-tenant-bridge"),
    "prototype": ("authentication-prototype/bridge", "auth_prototype_bridge", "--bin=auth-prototype-bridge"),
    "https": ("authentication-https/bridge", "auth_prototype_bridge", "--bin=auth-prototype-bridge"),
}
FUNCTION = re.compile(r"(?m)^fn ([^\n]+) \{\n")
BLOCK = re.compile(r"(?m)^    (bb\d+): \{\n")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def functions(mir: str) -> dict[str, str]:
    """Split rustc's text MIR at top-level function boundaries, fail closed."""
    result = {}
    for match in FUNCTION.finditer(mir):
        ending = re.search(r"(?m)^}\n", mir[match.end():])
        require(ending is not None, f"unclosed MIR function: {match.group(1)}")
        body = mir[match.end():match.end() + ending.start()]
        name = match.group(1)
        if name in result:
            name = f"{name}#instance-{sum(key.startswith(name) for key in result) + 1}"
        result[name] = body
    require(len(result) >= 2, "empty MIR function inventory")
    return result


def selected(items: dict[str, str], prefix: str) -> tuple[str, str]:
    rows = [(name, body) for name, body in items.items() if name.startswith(prefix)]
    require(len(rows) == 1, f"MIR selected function changed: {prefix} ({len(rows)})")
    return rows[0]


def occurrence(mir: str, needle: str, count: int, scope: str) -> None:
    actual = len(re.findall(re.escape(needle), mir))
    require(actual == count, f"{scope}: {needle}: expected {count}, found {actual}")


def blocks(body: str) -> dict[str, str]:
    result = {}
    for match in BLOCK.finditer(body):
        ending = re.search(r"(?m)^    }\n", body[match.end():])
        require(ending is not None, f"unclosed MIR block: {match.group(1)}")
        result[match.group(1)] = body[match.end():match.end() + ending.start()]
    require("bb0" in result, "MIR entry block missing")
    return result


def reachable(graph: dict[str, set[str]], start: str, target: str, excluded: str | None = None) -> bool:
    pending = [start]
    seen = set()
    while pending:
        node = pending.pop()
        if node == excluded or node in seen:
            continue
        if node == target:
            return True
        seen.add(node)
        pending.extend(graph[node] - seen)
    return False


def gate_dominance(body: str, whole: str) -> dict[str, str]:
    nodes = blocks(body)
    gate_nodes = [name for name, text in nodes.items()
                  if re.search(r"= admit_authorization_command\(copy _\d+\) ->", text)]
    callback_nodes = [name for name, text in nodes.items() if "as FnOnce<" in text and "::call_once(" in text]
    require(len(gate_nodes) == len(callback_nodes) == 1, "gate or READY callback count changed")
    gate, callback = gate_nodes[0], callback_nodes[0]
    gate_result = re.search(r"(_\d+) = admit_authorization_command\(copy _\d+\) -> \[return: (bb\d+),",
                            nodes[gate])
    require(gate_result is not None, "admission result def-use changed")
    graph = {name: {edge for edge in re.findall(r"\bbb\d+\b", text) if edge in nodes}
             for name, text in nodes.items()}
    require(reachable(graph, "bb0", callback), "READY callback unreachable in MIR")
    require(not reachable(graph, "bb0", callback, gate), "admission call does not dominate callback")
    compare = [name for name, text in nodes.items() if "<CommandBoundaryDecision as PartialEq>::ne" in text]
    require(len(compare) == 1 and compare[0] == gate_result.group(2),
            "admission-to-READY comparison edge changed")
    promoted = re.findall(r"(?ms)^const with_ready_in_transaction::promoted\[0\]: &CommandBoundaryDecision = \{(.*?)^}\n",
                          whole)
    require(len(promoted) == 1 and promoted[0].count("CommandBoundaryDecision::Ready") == 1
            and "CommandBoundaryDecision::Deny" not in promoted[0]
            and "::promoted[0]" in nodes[compare[0]],
            "READY comparison constant changed")
    def_use = re.search(
        rf"(_\d+) = &{re.escape(gate_result.group(1))};\s*"
        r"(_\d+) = const with_ready_in_transaction::[^;]+::promoted\[0\];\s*"
        r"(_\d+) = <CommandBoundaryDecision as PartialEq>::ne\(move \1, move \2\)"
        r" -> \[return: (bb\d+),",
        nodes[compare[0]],
    )
    require(def_use is not None, "admission result to READY comparison def-use changed")
    branch = def_use.group(4)
    match = re.search(rf"switchInt\(move {re.escape(def_use.group(3))}\)"
                      r" -> \[0: (bb\d+), otherwise: (bb\d+)\]", nodes[branch])
    require(match is not None and "AdmissionOutcome::<R>::Denied" in nodes[match.group(2)],
            "READY/DENY branch changed")
    ready_next, deny_next = match.group(1), match.group(2)
    require(reachable(graph, gate, branch), "gate does not reach READY branch")
    require(reachable(graph, ready_next, callback), "READY arm does not reach callback")
    require(not reachable(graph, deny_next, callback), "DENY arm reaches callback")
    require(not reachable(graph, "bb0", callback, ready_next), "READY arm does not dominate callback")
    require("ReadyAuthorization::<'_, '_> { transaction: copy _1" in body,
            "READY comparison or transaction-bound value changed")
    return {"gate_block": gate, "ready_branch": branch, "ready_arm": ready_next,
            "deny_arm": deny_next, "callback_block": callback}


def check_mir(mir: dict[str, str]) -> dict:
    require(set(mir) == set(ROOTS), "selected MIR root set changed")
    parsed = {key: functions(value) for key, value in mir.items()}
    policy_call = "= auth_foundation_operation_auth_exact_permission_authorize::authorize("
    policy_context_type = "auth_foundation_operation_auth_exact_permission_authorize::EvaluationContext"
    policy_result_type = "auth_foundation_operation_auth_exact_permission_authorize::AuthorizationDecision"
    legacy_calls = ("= AuthorizationAdapter::authorize(", "= authorize_resolved(",
                    "= authorize_in_transaction(", "= SqliteAuthorizationStateSnapshot::authorize(",
                    "= SqliteAuthorizationService::authorize(")
    qualified_legacy_calls = (
        r"= (?:[A-Za-z_]\w*::)+AuthorizationAdapter::authorize\(",
        r"= (?:[A-Za-z_]\w*::)+authorize_resolved\(",
        r"= (?:[A-Za-z_]\w*::)+authorize_in_transaction\(",
        r"= (?:[A-Za-z_]\w*::)+SqliteAuthorizationStateSnapshot::authorize\(",
        r"= (?:[A-Za-z_]\w*::)+SqliteAuthorizationService::authorize\(",
    )
    for key, value in mir.items():
        if key != "decision":
            occurrence(value, policy_call, 0, f"{key} direct generated-policy call")
            for name, body in parsed[key].items():
                if (policy_context_type in name or policy_context_type in body
                        or policy_result_type in name or policy_result_type in body):
                    require(not re.search(r"= (?:[\w:]+::)?authorize\(", body),
                            f"{key} typed generated-policy call outside READY decision: {name}")
        for call in legacy_calls:
            occurrence(value, call, 0, f"{key} legacy decision call")
        for pattern in qualified_legacy_calls:
            require(re.search(pattern, value) is None, f"{key} qualified legacy decision call")
    api_workers = [(name, body) for name, body in parsed["api"].items()
                   if "::authorize::{closure#0}::{closure#0}::{closure#0}" in name
                   and "debug engine =>" in body]
    require(len(api_workers) == 1, "production API worker changed")
    api_name, api_worker = api_workers[0]
    require("&mut auth_foundation_authorization_service::SqliteAuthService" in api_worker,
            "production API worker not concrete")
    occurrence(mir["api"], "= SqliteAuthService::authorize(", 1, "api service call")
    require("= SqliteAuthService::authorize(" in api_worker, "API service call outside worker")

    _, service_epoch = selected(parsed["service"], "authorize_in_epoch(")
    service_ready_name, service_ready = selected(parsed["service"], "authorize_in_epoch::{closure#0}(")
    occurrence(mir["service"], "= with_ready_in_transaction::", 1, "service READY issuer")
    require("= with_ready_in_transaction::" in service_epoch and "= authorize(copy _2)" in service_ready
            and "_2: &ReadyAuthorization<'_, '_>" in service_ready_name,
            "service request/READY decision handoff changed")
    occurrence(mir["service"], "= authorize(copy _2)", 1, "service READY decision")

    _, authority = selected(parsed["authority"], "with_ready_in_transaction(")
    occurrence(mir["authority"], "= admit_authorization_command(", 1, "authority admission")
    require("= admit_authorization_command(" in authority, "admission outside authority issuer")
    dominance = gate_dominance(authority, mir["authority"])

    decision_name, decision = selected(parsed["decision"], "authorize(")
    occurrence(mir["decision"], policy_call, 1, "generated policy")
    typed_policy_sites = []
    for name, body in parsed["decision"].items():
        if (policy_context_type in name or policy_context_type in body
                or policy_result_type in name or policy_result_type in body):
            typed_policy_sites.extend((name, line.strip()) for line in body.splitlines()
                                      if re.search(r"= (?:[\w:]+::)?authorize\(", line))
    require(len(typed_policy_sites) == 1 and typed_policy_sites[0][0] == decision_name
            and policy_call in typed_policy_sites[0][1],
            "READY decision contains extra or redirected typed policy call")
    require("&ReadyAuthorization<'_, '_>" in decision_name
            and policy_call in decision,
            "policy call outside READY decision")
    for key in ("tenant", "prototype", "https"):
        occurrence(mir[key], "= SqliteAuthService::authorize(", 1, f"{key} service call")
        require(any((name.startswith("evaluate(") or name.startswith("evaluate::{closure#"))
                    and "= SqliteAuthService::authorize(" in body
                    for name, body in parsed[key].items()), f"{key} service call outside evaluate")
    return {"functions_per_crate": {key: len(value) for key, value in parsed.items()},
            "api_worker": api_name, "authority_cfg": dominance,
            "sensitive_calls": {"api_service": 1, "service_ready_issuer": 1,
                                "service_ready_decision": 1, "authority_admission": 1,
                                "ready_decision_generated_policy": 1,
                                "bridge_service": {key: 1 for key in ("tenant", "prototype", "https")}}}


def capture_mir() -> tuple[dict[str, str], dict[str, str]]:
    contents, digests = {}, {}
    forbidden = ("RUSTFLAGS", "CARGO_ENCODED_RUSTFLAGS", "CARGO_BUILD_RUSTFLAGS",
                 "CARGO_BUILD_TARGET", "CARGO_PROFILE_DEV_BUILD_OVERRIDE_DEBUG")
    require(not [name for name in forbidden if os.environ.get(name)], "compiler environment override present")
    with tempfile.TemporaryDirectory(prefix="auth-v4b-normal-mir-") as temporary:
        target_dir = Path(temporary) / "target"
        for key, (directory, crate, target) in ROOTS.items():
            manifest = IMPL / directory / "Cargo.toml"
            command = [str(TOOLCHAIN), "cargo", "rustc", "--offline", "--locked",
                       "--target-dir", str(target_dir), "--manifest-path", str(manifest),
                       target, "--", "--emit=mir"]
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                    timeout=600, check=False)
            require(result.returncode == 0, f"{key} normal MIR compile failed: {result.stderr[-1600:]}")
            candidates = sorted((target_dir / "debug/deps").glob(f"{crate}-*.mir"))
            require(len(candidates) == 1 and candidates[0].is_file() and not candidates[0].is_symlink(),
                    f"{key} normal MIR artifact identity ambiguous: {len(candidates)}")
            raw = candidates[0].read_bytes()
            contents[key], digests[key] = raw.decode(), sha(raw)
    return contents, digests


def evaluate() -> dict:
    predecessor = subprocess.run(["node", str(PREDECESSOR)], cwd=ROOT, capture_output=True,
                                 text=True, timeout=240, check=False)
    require(predecessor.returncode == 0, f"V4b concrete predecessor failed: {predecessor.stderr[-1600:]}")
    previous = json.loads(predecessor.stdout)
    require(previous.get("status") == "indeterminate" and previous.get("runtime_guarantees_observed") is False,
            "V4b predecessor claim changed")
    mir, digests = capture_mir()
    census = check_mir(mir)
    version = subprocess.run([str(TOOLCHAIN), "rustc", "-Vv"], cwd=ROOT,
                             capture_output=True, text=True, timeout=30, check=False)
    require(version.returncode == 0, "locked rustc version unavailable")
    return {"schema_version": "auth-foundation.v4b-typed-call-census/v4-candidate",
            "status": "indeterminate", "rustc_mir_sha256": digests, "census": census,
            "rustc_version_sha256": sha(version.stdout.encode()),
            "predecessor_source_sha256": sha(PREDECESSOR.read_bytes()),
            "candidate_sources_sha256": {"checker": sha(Path(__file__).read_bytes()),
                                         "tests": sha(TEST.read_bytes()), "readme": sha(DOC.read_bytes())},
            "open_effects": ["whole-function def-use and cross-crate call targets beyond selected sensitive symbols",
                             "transitive callbacks, iterators, Drop, SQL, async wakeups, FFI, macros, and panic effects",
                             "same-invocation request and transaction identity across every indirect edge",
                             "per-endpoint request/epoch-correlated runtime traces"],
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Normal-build rustc MIR for seven selected roots counts known sensitive calls and checks the admission-to-continuation CFG shape. It is a partial compiler-typed census, not an exhaustive call/effect or runtime proof."}


if __name__ == "__main__":
    try:
        parser = argparse.ArgumentParser()
        parser.add_argument("--verify", action="store_true", help="compare to saved candidate; never write")
        args = parser.parse_args()
        result = evaluate()
        if args.verify:
            require(BINDING.is_file() and not BINDING.is_symlink(), "candidate binding missing")
            require(json.loads(BINDING.read_text()) == result, "candidate binding differs from current MIR")
            print(json.dumps({"status": "pass", "binding": str(BINDING.relative_to(ROOT)),
                              "runtime_guarantees_observed": False}, indent=2))
        else:
            print(json.dumps(result, indent=2))
    except (OSError, ValueError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
