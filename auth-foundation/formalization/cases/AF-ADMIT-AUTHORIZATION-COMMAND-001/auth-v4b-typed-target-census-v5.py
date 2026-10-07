#!/usr/bin/env python3
"""Current normal-build MIR census of the selected Auth READY callback target.

This is a fail-closed, rustc-version-sensitive candidate check of named native
edges. It is not an exhaustive whole-program effect or runtime proof.
"""

from __future__ import annotations

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
TOOLCHAIN = ROOT / "tools/toolchain/run"
PREDECESSOR = Path(__file__).with_name("auth-v4b-native-trace-successor.mjs")
ROOTS = {
    "api": ("authorization-api", "auth_foundation_authorization_api", "--lib"),
    "admission": ("authorization-admission-service", "auth_foundation_authorization_admission_service", "--lib"),
    "authority": ("authorization-ready-authority", "auth_foundation_authorization_ready_authority", "--lib"),
    "decision": ("authorization-ready-decision", "auth_foundation_authorization_ready_decision", "--lib"),
    "tenant": ("tenant-bridge", "auth_tenant_bridge", "--bin=auth-tenant-bridge"),
    "prototype": ("authentication-prototype/bridge", "auth_prototype_bridge", "--bin=auth-prototype-bridge"),
    "https": ("authentication-https/bridge", "auth_prototype_bridge", "--bin=auth-prototype-bridge"),
}
FUNCTION = re.compile(r"(?m)^fn ([^\n]+) \{\n")
BLOCK = re.compile(r"(?m)^    (bb\d+): \{\n")
CALLBACK = re.compile(
    r"(?m)^        (_\d+) = auth_foundation_authorization_ready_decision::authorize as "
    r"for<'a, 'b> fn\(auth_foundation_authorization_ready_authority::"
    r"ReadyAuthorization<'a, 'b>\) -> auth_foundation_authorization_state_model::"
    r"BinaryAuthorizationDecision \(PointerCoercion\(ReifyFnPointer\(Safe\), Implicit\)\);$"
)
ISSUE = re.compile(
    r"(?m)^        (_\d+) = SqliteAdmissionService::with_ready::<"
    r"BinaryAuthorizationDecision>\([^\n]*, move (_\d+)\) ->"
)
POLICY_CALL = "= auth_foundation_operation_auth_exact_permission_authorize::authorize("


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def sha(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def functions(mir: str) -> dict[str, str]:
    result = {}
    for match in FUNCTION.finditer(mir):
        ending = re.search(r"(?m)^}\n", mir[match.end():])
        require(ending is not None, f"unclosed MIR function: {match.group(1)}")
        name = match.group(1)
        if name in result:
            name = f"{name}#instance-{sum(key.startswith(name) for key in result) + 1}"
        result[name] = mir[match.end():match.end() + ending.start()]
    require(len(result) >= 2, "empty MIR function inventory")
    return result


def blocks(body: str) -> dict[str, str]:
    result = {}
    for match in BLOCK.finditer(body):
        ending = re.search(r"(?m)^    }\n", body[match.end():])
        require(ending is not None, f"unclosed MIR block: {match.group(1)}")
        result[match.group(1)] = body[match.end():match.end() + ending.start()]
    require("bb0" in result, "MIR entry block missing")
    return result


def reachable(graph: dict[str, set[str]], start: str, target: str, excluded: str | None = None) -> bool:
    pending, seen = [start], set()
    while pending:
        node = pending.pop()
        if node == excluded or node in seen:
            continue
        if node == target:
            return True
        seen.add(node)
        pending.extend(graph[node] - seen)
    return False


def selected(items: dict[str, str], prefix: str) -> tuple[str, str]:
    rows = [(name, body) for name, body in items.items() if name.startswith(prefix)]
    require(len(rows) == 1, f"selected MIR function changed: {prefix} ({len(rows)})")
    return rows[0]


def root_callback(name: str, mir: str, functions_by_name: dict[str, str]) -> dict:
    """Bind the compiled function-item target to this root's one READY call."""
    require(mir.count("SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>(") == 1,
            f"{name}: selected with_ready call count")
    require(len(CALLBACK.findall(mir)) == 1, f"{name}: READY callback reification count")
    require(POLICY_CALL not in mir, f"{name}: direct generated-policy call")
    require("= AuthorizationAdapter::authorize(" not in mir and
            "= authorize_resolved(" not in mir and
            "= authorize_in_transaction(" not in mir and
            "= SqliteAuthorizationService::authorize(" not in mir,
            f"{name}: legacy decision call")
    rows = []
    for function_name, body in functions_by_name.items():
        for block_name, block in blocks(body).items():
            reified = CALLBACK.findall(block)
            issued = ISSUE.findall(block)
            if reified or issued:
                rows.append((function_name, block_name, reified, issued, block))
    require(len(rows) == 1, f"{name}: callback and READY call not in one basic block")
    function_name, block_name, reified, issued, block = rows[0]
    require(len(reified) == len(issued) == 1 and reified[0] == issued[0][1],
            f"{name}: callback target not passed to selected READY call")
    require(len(re.findall(rf"(?m)^\s*{re.escape(reified[0])} =", functions_by_name[function_name])) == 1,
            f"{name}: callback local rebound")
    require(block.index("auth_foundation_authorization_ready_decision::authorize as") <
            block.index("SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>("),
            f"{name}: callback binding order")
    if name == "api":
        require("::authorize::{closure#0}::{closure#0}::{closure#0}" in function_name and
                "debug engine =>" in functions_by_name[function_name] and
                "dyn AuthorizationEngine" not in mir,
                "api: normal concrete worker identity")
    else:
        require(function_name.startswith("evaluate(") or function_name.startswith("evaluate::{closure#"),
                f"{name}: READY call outside bridge evaluate")
    return {"function": function_name, "block": block_name, "callback_local": reified[0],
            "call_result_local": issued[0][0]}


def admission_handoff(mir: str, items: dict[str, str]) -> dict:
    # Narrow to the actual with_ready method, not another impl member.
    rows = [(n, b) for n, b in items.items() if "::with_ready(" in n and "::with_ready::{" not in n]
    require(len(rows) == 1, f"admission: with_ready method count ({len(rows)})")
    name, body = rows[0]
    require("_2: InboundAuthorizationRequest, _3: for<'a, 'b> fn(ReadyAuthorization<'a, 'b>) -> R" in name,
            "admission: bare READY function pointer signature")
    require(mir.count("= with_ready_in_transaction::") == 1,
            "admission: READY issuer count")
    matches = []
    for block_name, block in blocks(body).items():
        if "= with_ready_in_transaction::" in block:
            matches.append((block_name, block))
    require(len(matches) == 1, "admission: issuer outside selected method")
    block_name, block = matches[0]
    required = [
        "_38 = EvaluationEpoch::<'_> { identifier: copy _18, decision_time: copy _11, transaction: move _39 };",
        "_41 = &(_38.2: rusqlite::Transaction<'_>);", "_42 = &_2;",
        "_43 = copy (_38.0: std::num::NonZero<u64>);", "_44 = copy (_38.1: u64);",
        "copy _41, copy _42, move _43, move _44, copy _3)",
    ]
    require(all(fragment in block for fragment in required),
            "admission: actual transaction/request/epoch/callback handoff changed")
    require(re.search(r"(?m)^\s*_3 =", body) is None,
            "admission: callback parameter rebound")
    require(POLICY_CALL not in mir and "= authorize_resolved(" not in mir,
            "admission: direct policy decision")
    return {"function": name, "block": block_name, "callback_parameter": "_3"}


def authority_dominance(mir: str, items: dict[str, str]) -> dict:
    name, body = selected(items, "with_ready_in_transaction(")
    require("_5: fn(ReadyAuthorization<'_, '_>) -> R" in name,
            "authority: lower boundary must accept a bare READY function pointer")
    nodes = blocks(body)
    gate = [n for n, b in nodes.items() if "= admit_authorization_command(" in b]
    callback = [n for n, b in nodes.items() if re.search(r"= copy _5\(copy _\d+\) ->", b)]
    require(len(gate) == len(callback) == 1 and mir.count("= admit_authorization_command(") == 1,
            "authority: gate/callback count")
    gate, callback = gate[0], callback[0]
    result = re.search(r"(_\d+) = admit_authorization_command\(copy _\d+\) -> \[return: (bb\d+),", nodes[gate])
    require(result is not None, "authority: gate result binding")
    result_local, compare = result.groups()
    require(len(re.findall(rf"(?m)^\s*{re.escape(result_local)} =", body)) == 1,
            "authority: gate result rebound")
    comparison = nodes[compare]
    cmp_result = re.search(
        rf"(_\d+) = &{re.escape(result_local)};\s*"
        r"(_\d+) = const with_ready_in_transaction::[^;]+::promoted\[0\];\s*"
        r"(_\d+) = <CommandBoundaryDecision as PartialEq>::ne\(move \1, move \2\)"
        r" -> \[return: (bb\d+),", comparison,
    )
    require(cmp_result is not None, "authority: gate result to READY comparison")
    branch = nodes[cmp_result.group(4)]
    arms = re.search(rf"switchInt\(move {re.escape(cmp_result.group(3))}\)"
                     r" -> \[0: (bb\d+), otherwise: (bb\d+)\]", branch)
    require(arms is not None and "AdmissionOutcome::<R>::Denied" in nodes[arms.group(2)],
            "authority: READY/DENY branch")
    promoted = re.findall(r"(?ms)^const with_ready_in_transaction::promoted\[0\]: &CommandBoundaryDecision = \{(.*?)^}\n", mir)
    require(len(promoted) == 1 and promoted[0].count("CommandBoundaryDecision::Ready") == 1,
            "authority: compared value is READY")
    graph = {n: {edge for edge in re.findall(r"\bbb\d+\b", b) if edge in nodes}
             for n, b in nodes.items()}
    require(reachable(graph, "bb0", callback) and
            not reachable(graph, "bb0", callback, gate) and
            reachable(graph, arms.group(1), callback) and
            not reachable(graph, arms.group(2), callback) and
            not reachable(graph, "bb0", callback, arms.group(1)),
            "authority: gate READY arm does not dominate callback")
    callback_body = nodes[callback]
    ready = re.search(
        r"(_\d+) = ReadyAuthorization::<'_, '_> \{ transaction: copy _1, "
        r"evaluation_epoch_id: copy _3, [^;]+;", callback_body)
    binding = re.search(r"_\d+ = copy _5\(copy (_\d+)\) ->", callback_body)
    require(ready is not None and binding is not None and
            binding.group(1) == ready.group(1) and
            body.count("= copy _5(") == 1,
            "authority: READY token/callback binding changed")
    return {"gate": gate, "compare": compare, "ready_arm": arms.group(1),
            "deny_arm": arms.group(2), "callback": callback}


def decision_policy(mir: str, items: dict[str, str]) -> dict:
    name, body = selected(items, "authorize(")
    policy_result_type = "auth_foundation_operation_auth_exact_permission_authorize::AuthorizationDecision"
    typed_policy_functions = [function_name for function_name, function_body in items.items()
                              if policy_result_type in function_name or
                              policy_result_type in function_body]
    require(typed_policy_functions == [name],
            "decision: additional typed generated-policy function")
    require("= auth_foundation_operation_auth_exact_permission_authorize::authorize as " not in mir,
            "decision: generated-policy function pointer bypass")
    require("_1: ReadyAuthorization<'_, '_>" in name and
            mir.count(POLICY_CALL) == 1 and POLICY_CALL in body,
            "decision: READY-only generated-policy call changed")
    return {"function": name, "policy_calls": 1}


def check_mir(mir: dict[str, str]) -> dict:
    require(set(mir) == set(ROOTS), "selected MIR root set changed")
    parsed = {key: functions(value) for key, value in mir.items()}
    roots = {key: root_callback(key, mir[key], parsed[key])
             for key in ("api", "tenant", "prototype", "https")}
    return {"roots": roots,
            "admission": admission_handoff(mir["admission"], parsed["admission"]),
            "authority": authority_dominance(mir["authority"], parsed["authority"]),
            "decision": decision_policy(mir["decision"], parsed["decision"]),
            "function_counts": {key: len(value) for key, value in parsed.items()}}


def capture_mir() -> tuple[dict[str, str], dict[str, str]]:
    forbidden_env = ("RUSTFLAGS", "CARGO_ENCODED_RUSTFLAGS", "CARGO_BUILD_RUSTFLAGS",
                     "CARGO_BUILD_TARGET", "CARGO_PROFILE_DEV_BUILD_OVERRIDE_DEBUG")
    require(not [name for name in forbidden_env if os.environ.get(name)],
            "compiler environment override present")
    contents, digests = {}, {}
    with tempfile.TemporaryDirectory(prefix="auth-v4b-normal-mir-v5-") as temporary:
        for key, (directory, crate, target) in ROOTS.items():
            # HTTPS and prototype have the same package/crate name. Keep their
            # normal-build artifacts separate even if Cargo reuses a fingerprint.
            target_dir = Path(temporary) / ("https-target" if key == "https" else "shared-target")
            command = [str(TOOLCHAIN), "cargo", "rustc", "--offline", "--locked",
                       "--target-dir", str(target_dir), "--manifest-path",
                       str(IMPL / directory / "Cargo.toml"), target, "--", "--emit=mir"]
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                    timeout=600, check=False)
            require(result.returncode == 0,
                    f"{key}: normal MIR compile failed: {result.stderr[-1600:]}")
            candidates = sorted((target_dir / "debug/deps").glob(f"{crate}-*.mir"))
            require(len(candidates) == 1 and candidates[0].is_file() and not candidates[0].is_symlink(),
                    f"{key}: normal MIR artifact ambiguous ({len(candidates)})")
            raw = candidates[0].read_bytes()
            contents[key], digests[key] = raw.decode(), sha(raw)
    return contents, digests


def evaluate() -> dict:
    predecessor_bytes = PREDECESSOR.read_bytes()
    predecessor = subprocess.run(["node", str(PREDECESSOR)], cwd=ROOT,
                             capture_output=True, text=True, timeout=240, check=False)
    require(predecessor.returncode == 0,
            f"current source/Cargo predecessor failed: {predecessor.stderr[-1200:]}")
    prior = json.loads(predecessor.stdout)
    require(prior.get("status") == "indeterminate" and
            prior.get("runtime_guarantees_observed") is False and
            prior.get("endpoint_set_closed") is False,
            "predecessor claim changed")
    mir, digests = capture_mir()
    census = check_mir(mir)
    refreshed = subprocess.run(["node", str(PREDECESSOR)], cwd=ROOT,
                               capture_output=True, text=True, timeout=240, check=False)
    require(refreshed.returncode == 0 and PREDECESSOR.read_bytes() == predecessor_bytes and
            json.loads(refreshed.stdout) == prior,
            "predecessor source/Cargo drift during MIR capture")
    version = subprocess.run([str(TOOLCHAIN), "rustc", "-Vv"], cwd=ROOT,
                             capture_output=True, text=True, timeout=30, check=False)
    require(version.returncode == 0, "rustc version unavailable")
    return {"schema_version": "auth-foundation.v4b-typed-target-census/v5-candidate",
            "status": "indeterminate", "normal_mir_sha256": digests,
            "rustc_version_sha256": sha(version.stdout.encode()),
            "predecessor_sha256": sha(PREDECESSOR.read_bytes()),
            "census": census,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "open_effects": ["transitive iterator/callback/Drop/macro/SQL/FFI/panic effects",
                             "complete native decision endpoint inventory",
                             "whole-program cross-crate and dynamic dispatch closure",
                             "independent kernel-entry and TDE/EVF runtime evidence"],
            "claim_limit": "Current normal-build MIR binds the four selected callback function items to with_ready, and checks the known admission/READY/policy chain. It does not prove complete endpoint, implicit-effect, all-path, or runtime closure."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
