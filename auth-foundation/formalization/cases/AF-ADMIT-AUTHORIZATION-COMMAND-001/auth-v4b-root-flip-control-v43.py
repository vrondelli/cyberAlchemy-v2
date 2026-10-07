#!/usr/bin/env python3
"""Prototype-only finite gate-DENY terminal-oracle sensitivity control.

Two normal-feature binaries share the same marked/cardinality-relaxed gate
build. Only the prototype root's matches! target changes. This is a hostile
mirror control, not production policy, all-path execution, or effect closure.
"""

from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

CASE = Path(__file__).resolve().parent


def load(label: str, name: str):
    spec = importlib.util.spec_from_file_location(label, CASE / name)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v40 = load("auth_v40_for_v43", "auth-v4b-normal-gate-deny-v40.py")
v41 = load("auth_v41_for_v43", "auth-v4b-deny-return-effect-slice-v41.py")
v42 = load("auth_v42_for_v43", "auth-v4b-bridge-deny-mapping-v42.py")
v29, v36, v37, v39 = v40.v29, v40.v36, v40.v37, v40.v39
ROOT = "prototype"
MANIFEST = v29.v6.ROOT_MANIFESTS[ROOT]
ROOT_SOURCE = v29.ROOT_SOURCE[ROOT]
OLD = v42.ROOT_MATCH
NEW = "Ok(AdmissionOutcome::Denied)"
VARIANT = "cardinality-gate-deny"


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def flip_mapping(source: str) -> str:
    require(source.count(OLD) == 1 and source.count(NEW) == 0,
            "V43 prototype mapping anchor ambiguous")
    changed = source.replace(OLD, NEW, 1)
    require(changed.count(OLD) == 0 and changed.count(NEW) == 1,
            "V43 prototype mapping flip not exact")
    return changed


def strict_trace(stderr: str) -> list[str]:
    expected = v40.expected_trace(ROOT, VARIANT, "duplicate")
    actual = stderr.splitlines()
    require(actual == expected and not any("AUTH_V39_" in row for row in actual),
            f"V43 gate-DENY marker identity/order changed:{actual}")
    # Also run V40's independent request-correlated marker parser.
    require(v40.parse_trace(stderr, ROOT, VARIANT, "duplicate") == expected,
            "V43 V40 marker parser disagreed")
    return actual


def fixture_bytes(payload: dict, policy: dict, now: int | None = None) -> tuple[bytes, bytes, int]:
    instant = int(time.time()) if now is None else now
    identity = payload
    principal = policy["principals"][0]
    expiry = identity.get("expires_at")
    require(isinstance(expiry, int) and not isinstance(expiry, bool) and
            expiry > instant + 5 and expiry <= instant + 120,
            "V43 shared fixture expired or expiry changed")
    require(all(identity.get(key) == principal.get(key)
                for key in ("issuer", "subject", "kind", "client")) and
            principal.get("enabled") is True and principal.get("read") is True,
            "V43 shared fixture/policy identity drift")
    return (json.dumps(payload, sort_keys=True, separators=(",", ":")).encode(),
            json.dumps(policy, sort_keys=True, separators=(",", ":")).encode(), expiry)


def validate_run(stdout: str, stderr: str, expected_decision: str) -> dict:
    require(expected_decision in ("DENY", "ALLOW"), "V43 invalid expected decision")
    require(stdout.strip() == json.dumps({"decision": expected_decision},
                                         separators=(",", ":")),
            f"V43 malformed or unexpected terminal {expected_decision} output")
    markers = strict_trace(stderr)
    return {"decision": expected_decision, "markers": markers,
            "normal_exit": True}


def runtime_env(base: dict[str, str] | None = None) -> dict[str, str]:
    env = dict(os.environ if base is None else base)
    env.pop("AUTH_AUTHORIZATION_TRACE_STDERR", None)
    return env


def compare_builds(baseline: dict, flipped: dict, selected: list[str]) -> None:
    require(set(baseline["source_sha256"]) == set(flipped["source_sha256"]) and
            {name for name in baseline["source_sha256"]
             if baseline["source_sha256"][name] != flipped["source_sha256"][name]}
            == {ROOT_SOURCE}, "V43 non-root source changed or root source did not")
    require(set(baseline["selected_mir_sha256"]) ==
            set(flipped["selected_mir_sha256"]) == set(selected) and
            {name for name in selected if baseline["selected_mir_sha256"][name] !=
             flipped["selected_mir_sha256"][name]} == {MANIFEST},
            "V43 non-root MIR changed or root MIR did not")
    for key in ("metadata_sha256", "lock_sha256", "root_package_id"):
        require(baseline[key] == flipped[key], f"V43 Cargo {key} drift")
    require(baseline["binary_sha256"] != flipped["binary_sha256"],
            "V43 root binaries indistinct")
    require(baseline["source_sha256"][v40.GATE] ==
            flipped["source_sha256"][v40.GATE] and
            baseline["selected_mir_sha256"][v40.GATE_MANIFEST] ==
            flipped["selected_mir_sha256"][v40.GATE_MANIFEST],
            "V43 generated gate source/MIR changed")


def run_binary(binary: Path, implementation: Path, policy_path: Path,
               payload_raw: bytes, policy_raw: bytes, expiry: int,
               expected_decision: str, binary_sha: str) -> dict:
    require(v29.sha(binary.read_bytes()) == binary_sha,
            "V43 executable changed before observation")
    require(v29.sha(policy_path.read_bytes()) == v29.sha(policy_raw) and
            time.time() + 1 < expiry,
            "V43 shared fixture changed or expired before run")
    observed = subprocess.run([str(binary), str(policy_path)], cwd=implementation,
                              input=payload_raw, capture_output=True,
                              env=runtime_env(), timeout=30, check=False)
    require(observed.returncode == 0 and time.time() < expiry,
            f"V43 {expected_decision} process failed or fixture expired")
    result = validate_run(observed.stdout.decode(), observed.stderr.decode(),
                          expected_decision)
    require(v29.sha(binary.read_bytes()) == binary_sha and
            v29.sha(policy_path.read_bytes()) == v29.sha(policy_raw),
            "V43 executable or shared policy changed during observation")
    return {**result, "binary_sha256": binary_sha,
            "payload_sha256": v29.sha(payload_raw),
            "policy_sha256": v29.sha(policy_raw), "expiry": expiry}


def evaluate() -> dict:
    inventory, predecessor_sha = v29.v7.current_inventory()
    metadata, _ = v29.v7.root_metadata(ROOT, MANIFEST)
    manifests = v29.package_manifests(ROOT, metadata)
    paths = v29.selected_files(manifests)
    before = v29.snapshot(paths)
    selected = sorted(inventory["selected_root_package_manifests"][ROOT])
    require(set(selected) <= {str(path.relative_to(v29.ORIGINAL_IMPL))
                             for path in manifests} and
            all(name in before for name in (ROOT_SOURCE, v40.AUTHORITY,
                                           v40.READY, v40.POLICY, v40.GATE)),
            "V43 selected source closure incomplete")
    model = v40.check_named_v30_rejection(
        (v29.ORIGINAL_IMPL / v40.AUTHORITY).read_text(),
        (v29.ORIGINAL_IMPL / v40.GATE).read_text())
    require(before[v40.AUTHORITY] == model["authority_source_sha256"] and
            before[v40.GATE] == model["gate_source_sha256"],
            "V43 frozen source model changed")
    target_name = v29.v7.expected_local_artifacts(metadata, selected)[MANIFEST]["target_name"]
    try:
        with tempfile.TemporaryDirectory(prefix="auth-v43-prototype-") as temp:
            directory = Path(temp)
            implementation = directory / "implementation"
            v29.mirror(implementation, manifests, paths)
            v36.exact_mirror(implementation, before, ROOT)
            original = {name: (implementation / name).read_text()
                        for name in (ROOT_SOURCE, v40.AUTHORITY, v40.READY,
                                     v40.POLICY, v40.GATE)}
            root_duplicate = v37.mutate_duplicate_row(original[ROOT_SOURCE])
            marked_ready = v37.mutate_ready(original[v40.READY]).replace(
                "AUTH_V37_READY", "AUTH_V39_READY")
            marked_policy = v39.mark_policy(original[v40.POLICY])
            shared = {v40.AUTHORITY: v40.mutate_authority(original[v40.AUTHORITY], VARIANT),
                      v40.READY: marked_ready, v40.POLICY: marked_policy,
                      v40.GATE: original[v40.GATE]}
            variants = {"baseline": root_duplicate,
                        "root-flipped": flip_mapping(root_duplicate)}
            builds = {}
            with v29.overlay_modules(implementation):
                for name, root_source in variants.items():
                    texts = {**shared, ROOT_SOURCE: root_source}
                    expected = dict(before)
                    for relative, source in texts.items():
                        (implementation / relative).write_text(source)
                        expected[relative] = v29.sha(source.encode())
                    v36.exact_mirror(implementation, expected, ROOT)
                    target = directory / f"{name}-target"
                    build, rows = v36.capture_with_cargo_artifact(
                        ROOT, MANIFEST, selected, target, inventory,
                        lambda root, mir, identities: v41.inspect_same_build(
                            root, mir, identities, VARIANT))
                    same = v36.check_same_build(ROOT, build, target_name)
                    binary = v36.bind_cargo_executable(
                        ROOT, rows, build, MANIFEST, target, target_name)
                    binary_sha = v29.sha(binary.read_bytes())
                    v36.exact_mirror(implementation, expected, ROOT)
                    builds[name] = {**same, "binary": binary,
                                    "binary_sha256": binary_sha,
                                    "source_sha256": expected,
                                    "selected_mir_sha256": {
                                        key: build["artifacts"][key]["mir_sha256"]
                                        for key in selected},
                                    "selected_mir_inspection":
                                        build["selected_graph_inspection"]}
            compare_builds(builds["baseline"], builds["root-flipped"], selected)
            # The 120-second fixture is created only after both Cargo builds.
            payload, policy = v37.v35.fixture(ROOT)
            payload_raw, policy_raw, expiry = fixture_bytes(payload, policy)
            policy_path = directory / "shared-policy.json"
            policy_path.write_bytes(policy_raw)
            require(v29.sha(policy_path.read_bytes()) == v29.sha(policy_raw),
                    "V43 shared policy bytes changed")
            observations = {
                "baseline": run_binary(builds["baseline"]["binary"], implementation,
                                       policy_path, payload_raw, policy_raw, expiry,
                                       "DENY", builds["baseline"]["binary_sha256"]),
                "root-flipped": run_binary(builds["root-flipped"]["binary"], implementation,
                                           policy_path, payload_raw, policy_raw, expiry,
                                           "ALLOW", builds["root-flipped"]["binary_sha256"]),
            }
            require(observations["baseline"]["payload_sha256"] ==
                    observations["root-flipped"]["payload_sha256"] and
                    observations["baseline"]["policy_sha256"] ==
                    observations["root-flipped"]["policy_sha256"] and
                    observations["baseline"]["expiry"] ==
                    observations["root-flipped"]["expiry"],
                    "V43 two runs did not share one fixture/policy")
            return {"schema_version": "auth-foundation.v4b-root-flip-control/v43-candidate",
                    "status": "indeterminate", "root_id": ROOT,
                    "predecessor_sha256": predecessor_sha,
                    "source_bytes_preserved": True,
                    "normal_feature_same_build_mir_and_binary": True,
                    "shared_fixture": {"payload_sha256": v29.sha(payload_raw),
                                       "policy_sha256": v29.sha(policy_raw),
                                       "expiry": expiry},
                    "builds": {name: {key: value for key, value in build.items()
                                      if key != "binary"}
                               for name, build in builds.items()},
                    "observations": observations,
                    "endpoint_set_closed": False, "all_path_ready_dominance": False,
                    "runtime_guarantees_observed": False,
                    "claim_limit": "Prototype-only finite mirror root-oracle sensitivity: one exact mapping flip changes terminal gate-DENY decision DENY to ALLOW with identical marked gate-DENY/no-READY traces and non-root builds. It does not prove production gate-DENY reachability, other roots, cross-body all-path execution, no downstream effects, or runtime guarantees."}
    finally:
        after = v29.selected_files(manifests)
        require(after == paths and v29.snapshot(after) == before,
                "V43 original selected source/Cargo/SQL path or byte drift")


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
