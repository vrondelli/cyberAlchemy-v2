#!/usr/bin/env python3
"""Finite compiled bridge observations in disposable trace-feature mirrors.

The duplicate-row variant is a selected-authority *pre-gate* DENY. A separate
mutated generated gate forces the otherwise-unreachable GateDenied branch.
Neither variant proves all-native-entrypoint no-call or normal-build closure.
"""

from __future__ import annotations

import importlib.util
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

CASE = Path(__file__).resolve().parent


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, CASE / filename)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v29 = load("auth_v29_for_v35", "auth-v4b-selected-root-overlay-v29.py")
v30 = load("auth_v30_for_v35", "auth-v4b-gate-deny-implication-v30.py")
ROOTS = ("tenant", "prototype", "https")
SERVICE_MARKER = "let mut service = SqliteAdmissionService::from_connection(db).map_err(|_| \"service\")?;"
GATE_MARKER = "if command_boundary_admissible(context) {"
DUPLICATE_SQL = (
    'db.execute("INSERT INTO auth_authentication_evidence '
    '(evidence_row_id,evidence_ref,session_id,trusted,revoked,expires_at,'
    'evidence_revision,authenticated_subject_id) '
    'SELECT 2,evidence_ref,session_id,trusted,revoked,expires_at,'
    'evidence_revision,authenticated_subject_id '
    'FROM auth_authentication_evidence WHERE evidence_row_id=1", [])?;\n    '
)
EXPECTED = {
    "clean": ("EpochOpened", "GateReady", "ReadyDecisionEntered",
              "PolicyCallBefore", "PolicyCallReturned"),
    "duplicate-pre-gate": ("EpochOpened",),
    "forced-gate-deny": ("EpochOpened", "GateDenied"),
}
TRACE = re.compile(r'^AUTH_AUTHORIZATION_TRACE Trace \{ root: (\w+), '
                   r'invocation_id: (\d+), request_id: "([^"]+)", events: \[(.*)\] \}$')
EVENT = re.compile(r'Event \{ root: (\w+), invocation_id: (\d+), '
                   r'request_id: "([^"]+)", epoch_id: Some\((\d+)\), '
                   r'kind: (\w+) \}')


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def mutate_once(source: str, marker: str, replacement: str) -> str:
    require(source.count(marker) == 1, "bridge/gate mutation anchor changed")
    return source.replace(marker, replacement, 1)


def parse_trace(stderr: str, root_id: str) -> dict:
    lines = [line for line in stderr.splitlines()
             if line.startswith("AUTH_AUTHORIZATION_TRACE ")]
    require(len(lines) == 1, f"{root_id}: expected one completed bridge trace")
    match = TRACE.fullmatch(lines[0])
    require(match is not None, f"{root_id}: trace envelope changed")
    root, invocation, request, body = match.groups()
    expected_root = {"tenant": "TenantBridge", "prototype": "PrototypeBridge",
                     "https": "HttpsBridge"}[root_id]
    expected_request = "request-0" if root_id == "tenant" else "verified-request"
    require(root == expected_root and request == expected_request and int(invocation) > 0,
            f"{root_id}: trace root/request identity changed")
    matches = list(EVENT.finditer(body))
    require(len(matches) > 0, f"{root_id}: missing trace events")
    position = 0
    for index, event in enumerate(matches):
        separator = "" if index == 0 else ", "
        require(body[position:event.start()] == separator,
                f"{root_id}: unparsed trace event prefix")
        position = event.end()
    require(position == len(body), f"{root_id}: unparsed trace event suffix")
    events = [event.groups() for event in matches]
    for event_root, event_invocation, event_request, epoch, _ in events:
        require(event_root == root and event_invocation == invocation and
                event_request == request and epoch == "1",
                f"{root_id}: event request/epoch/invocation drift")
    return {"root": root, "request_id": request, "epoch_id": 1,
            "event_kinds": tuple(event[-1] for event in events)}


def fixture(root_id: str) -> tuple[dict, dict]:
    expiry = int(time.time()) + 120
    identity = {"issuer": "local", "subject": "alice", "kind": "human",
                "client": "client", "expires_at": expiry}
    principal = {key: identity[key] for key in ("issuer", "subject", "kind", "client")}
    if root_id == "tenant":
        permission = {"resource": "documents", "action": "read", "scope": "tenant-7"}
        input_value = {"identity": {**identity, "jti": "session-1"},
                       "tenant": "tenant-7", "permissions": [permission]}
        policy = {"revision": 1, "principals": [{**principal, "enabled": True,
                   "memberships": [{"tenant": "tenant-7", "enabled": True}],
                   "sessions": [{"jti": "session-1", "enabled": True,
                                 "active_roles": ["reader"]}]}],
                  "roles": [{"id": "reader", "permissions": [permission]}]}
    else:
        input_value = identity
        policy = {"revision": 1, "principals": [{**principal, "id": "human:alice",
                                               "enabled": True, "read": True}]}
    return input_value, policy


def run_binary(implementation: Path, target: Path, root_id: str,
               variant: str, expected_files: dict[str, str]) -> dict:
    manifest = implementation / v29.v6.ROOT_MANIFESTS[root_id]
    command = [str(v30.TOOLCHAIN), "cargo", "build", "--locked", "--offline",
               "--manifest-path", str(manifest), "--target-dir", str(target),
               "--features", "trace"]
    built = subprocess.run(command, cwd=implementation, capture_output=True,
                           text=True, timeout=600, check=False)
    require(built.returncode == 0,
            f"{root_id}/{variant}: trace build failed: {built.stderr[-1600:]}")
    mirror_files = {str(path.relative_to(implementation)): v29.sha(path.read_bytes())
                    for path in implementation.rglob("*") if path.is_file()}
    require(mirror_files == expected_files,
            f"{root_id}/{variant}: mirror source path or byte drift after build")
    binary_name = "auth-tenant-bridge" if root_id == "tenant" else "auth-prototype-bridge"
    binary = target / "debug" / binary_name
    require(binary.is_file() and not binary.is_symlink() and
            binary.resolve().is_relative_to(target.resolve()),
            f"{root_id}/{variant}: mirror binary missing or escaped")
    # Fresh expiry after the build avoids mistaking a slow compilation for a
    # bridge or gate DENY.
    input_value, policy = fixture(root_id)
    policy_path = target.parent / "policy.json"
    policy_path.write_text(json.dumps(policy))
    env = dict(os.environ)
    env["AUTH_AUTHORIZATION_TRACE_STDERR"] = "1"
    observed = subprocess.run([str(binary), str(policy_path)],
                              cwd=implementation, input=json.dumps(input_value),
                              capture_output=True, text=True, env=env,
                              timeout=30, check=False)
    require(observed.returncode == 0,
            f"{root_id}/{variant}: bridge exited nonzero: {observed.stderr[-1000:]}")
    expected_output = ({"decisions": [variant == "clean"]} if root_id == "tenant"
                       else {"decision": "ALLOW" if variant == "clean" else "DENY"})
    require(json.loads(observed.stdout) == expected_output,
            f"{root_id}/{variant}: decision output changed")
    trace = parse_trace(observed.stderr, root_id)
    require(trace["event_kinds"] == EXPECTED[variant],
            f"{root_id}/{variant}: wrong admission/decision entry sequence")
    return {"variant": variant, "decision": expected_output,
            "binary_sha256": v29.sha(binary.read_bytes()),
            **{key: list(value) if isinstance(value, tuple) else value
               for key, value in trace.items()}}


def evaluate_root(root_id: str) -> dict:
    require(root_id in ROOTS, "unknown bridge root")
    manifest = v29.v6.ROOT_MANIFESTS[root_id]
    metadata, _ = v29.v7.root_metadata(root_id, manifest)
    manifests = v29.package_manifests(root_id, metadata)
    files = v29.selected_files(manifests)
    before = v29.snapshot(files)
    bridge_relative = v29.ROOT_SOURCE[root_id]
    require(bridge_relative in before and v30.GATE in before,
            f"{root_id}: bridge or gate source absent from mirror plan")
    try:
        with tempfile.TemporaryDirectory(prefix=f"auth-v35-{root_id}-") as temporary:
            directory = Path(temporary)
            implementation = directory / "implementation"
            v29.mirror(implementation, manifests, files)
            require({name: v29.sha((implementation / name).read_bytes()) for name in before}
                    == before, f"{root_id}: clean mirror differs from original")
            bridge = implementation / bridge_relative
            gate = implementation / v30.GATE
            original_bridge = bridge.read_text()
            original_gate = gate.read_text()
            target = directory / "target"
            clean = run_binary(implementation, target, root_id, "clean", before)

            bridge.write_text(mutate_once(original_bridge, SERVICE_MARKER,
                                          DUPLICATE_SQL + SERVICE_MARKER))
            duplicate_sha = v29.sha(bridge.read_bytes())
            require(duplicate_sha != before[bridge_relative],
                    f"{root_id}: duplicate-row source did not change")
            duplicate = run_binary(implementation, target, root_id,
                                   "duplicate-pre-gate",
                                   {**before, bridge_relative: duplicate_sha})
            bridge.write_text(original_bridge)

            gate.write_text(mutate_once(original_gate, GATE_MARKER,
                                        "if command_boundary_admissible(context) && false {"))
            gate_sha = v29.sha(gate.read_bytes())
            require(gate_sha != before[v30.GATE],
                    f"{root_id}: forced-gate source did not change")
            try:
                v30.check_source((implementation / v30.AUTHORITY).read_text(), gate.read_text())
            except ValueError as error:
                require(str(error) in ("gate full source identity changed",
                                       "gate decision branch structural invariant changed"),
                        f"{root_id}: wrong frozen gate rejection: {error}")
            else:
                raise ValueError(f"{root_id}: forced gate passed frozen source model")
            forced = run_binary(implementation, target, root_id,
                                "forced-gate-deny",
                                {**before, v30.GATE: gate_sha})
            require(len({clean["binary_sha256"], duplicate["binary_sha256"],
                         forced["binary_sha256"]}) == 3,
                    f"{root_id}: clean and mutant binaries were not distinct")
            return {"root_id": root_id, "clean": clean,
                    "duplicate_pre_gate": duplicate, "forced_gate_deny": forced,
                    "duplicate_bridge_source_sha256": duplicate_sha,
                    "forced_gate_source_sha256": gate_sha,
                    "frozen_gate_rejected": True}
    finally:
        after_files = v29.selected_files(manifests)
        require(after_files == files and v29.snapshot(after_files) == before,
                f"{root_id}: original selected source/Cargo/SQL path or byte drift")


def evaluate() -> dict:
    roots = {root: evaluate_root(root) for root in ROOTS}
    return {"schema_version": "auth-foundation.v4b-bridge-deny-observation/v35-candidate",
            "status": "indeterminate", "roots": roots,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Finite trace-feature bridge mirror observations: clean READY, selected-authority pre-gate duplicate DENY, and hostile forced gate DENY. Wrapper events do not cover all native entrypoints or normal-build effects; V11 unselected."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
