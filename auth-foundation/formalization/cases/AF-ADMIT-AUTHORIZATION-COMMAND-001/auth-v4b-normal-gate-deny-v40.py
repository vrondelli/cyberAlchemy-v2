#!/usr/bin/env python3
"""Counterfactual generated-gate DENY in four isolated normal Auth builds.

The generated gate is unchanged. An exact authority cardinality relaxation
lets two qualifying authentication rows reach it. This is a finite branch
control, not an unmodified-production gate-DENY witness or all-path no-call.
"""

from __future__ import annotations

import importlib.util
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

CASE = Path(__file__).resolve().parent


def load(label: str, filename: str):
    spec = importlib.util.spec_from_file_location(label, CASE / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v39 = load("auth_v39_for_v40", "auth-v4b-normal-policy-helper-v39.py")
v30 = load("auth_v30_for_v40", "auth-v4b-gate-deny-implication-v30.py")
v29, v32, v36, v37, v38 = v39.v29, v39.v32, v39.v36, v39.v37, v39.v38
ROOTS = v39.ROOTS
AUTHORITY = v30.AUTHORITY
AUTHORITY_MANIFEST = "authorization-ready-authority/Cargo.toml"
GATE = v30.GATE
GATE_MANIFEST = "command-boundary-runtime-v2/Cargo.toml"
READY = v39.READY
READY_MANIFEST = v39.READY_MANIFEST
POLICY = v39.POLICY
POLICY_MANIFEST = v39.POLICY_MANIFEST
CARDINALITY_OLD, CARDINALITY_NEW, _ = v30.MUTANTS["cardinality"]
PRE_ANCHOR = "    let ([evidence], [binding]) = (\n"
GATE_ANCHOR = "    let gate_decision = gate::admit_authorization_command(&context);\n"
DENY_ANCHOR = ("    if gate_decision != gate::CommandBoundaryDecision::Ready {\n"
               "        return AdmissionOutcome::Denied;\n    }\n")
PRE = "AUTH_V40_PRE"
GATE_RESULT = "AUTH_V40_GATE"
SELECTED = (v38.MANIFEST, v38.ADMISSION_MANIFEST,
            AUTHORITY_MANIFEST, READY_MANIFEST, POLICY_MANIFEST, GATE_MANIFEST)


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def replace_once(source: str, old: str, new: str, label: str) -> str:
    require(source.count(old) == 1, f"V40 {label} source anchor changed")
    return source.replace(old, new, 1)


def mutate_authority(source: str, variant: str) -> str:
    require(variant in ("clean", "marked", "marked-duplicate",
                        "cardinality-gate-deny", "bypass-deny"),
            "V40 unknown authority variant")
    if variant == "clean":
        return source
    marked = replace_once(
        source, PRE_ANCHOR,
        '    eprintln!("AUTH_V40_PRE request={} epoch={} auth_count={} route_count={}", '
        'request.request_id, evaluation_epoch_id.get(), '
        'qualifying_authentication.len(), qualifying_routes.len());\n' + PRE_ANCHOR,
        "pre-cardinality")
    marked = replace_once(
        marked, GATE_ANCHOR,
        GATE_ANCHOR +
        '    eprintln!("AUTH_V40_GATE request={} epoch={} decision={:?}", '
        'request.request_id, evaluation_epoch_id.get(), gate_decision);\n',
        "gate-result")
    if variant in ("cardinality-gate-deny", "bypass-deny"):
        marked = replace_once(marked, CARDINALITY_OLD, CARDINALITY_NEW,
                              "cardinality relaxation")
    if variant == "bypass-deny":
        marked = replace_once(marked, DENY_ANCHOR,
                              DENY_ANCHOR.replace("if gate_decision != "
                                                  "gate::CommandBoundaryDecision::Ready",
                                                  "if false"), "gate-DENY bypass")
    return marked


def check_named_v30_rejection(authority: str, gate: str) -> dict:
    baseline = v30.check_source(authority, gate, frozen=True)
    counterfactual = replace_once(authority, CARDINALITY_OLD, CARDINALITY_NEW,
                                  "V30 cardinality baseline")
    try:
        v30.check_source(counterfactual, gate, frozen=False)
    except ValueError as error:
        require("occurrence cardinality" in str(error),
                f"V40 V30 rejected wrong clause: {error}")
    else:
        raise ValueError("V40 V30 accepted relaxed authority cardinality")
    return {**baseline, "frozen_source_model_checked": True,
            "exact_cardinality_relaxation_rejected_as": "occurrence cardinality"}


def request_id(root: str, scenario: str) -> str:
    return f"auth_v38_{scenario}" if root == "api" else \
           "request-0" if root == "tenant" else "verified-request"


def expected_trace(root: str, variant: str, scenario: str) -> list[str]:
    require(root in ROOTS and variant in
            ("clean", "marked", "marked-duplicate",
             "cardinality-gate-deny", "bypass-deny") and
            scenario in ("allow", "duplicate"), "V40 invalid trace request")
    request = request_id(root, scenario)
    api = root == "api"
    trace = [f"AUTH_V39_CASE request={request}"] if api else []
    if variant != "clean":
        auth_count = 1 if scenario == "allow" else 2
        trace.append(f"{PRE} request={request} epoch=1 auth_count={auth_count} route_count=1")
        if scenario == "allow" or variant in ("cardinality-gate-deny", "bypass-deny"):
            gate = "Ready" if scenario == "allow" else "Deny"
            trace.append(f"{GATE_RESULT} request={request} epoch=1 decision={gate}")
        if scenario == "allow" or variant == "bypass-deny":
            trace.extend([f"AUTH_V39_READY request={request} epoch=1",
                          f"AUTH_V39_authorize request={request}"])
            trace.extend(f"AUTH_V39_{name} request={request}" for name in v39.ACTIVE)
    decision = "ALLOW" if scenario == "allow" or variant == "bypass-deny" else "DENY"
    if api:
        trace.append(f"AUTH_V39_END request={request} decision={decision}")
    return trace


def parse_trace(output: str, root: str, variant: str, scenario: str) -> list[str]:
    actual = []
    for line in output.splitlines():
        markers = [marker for marker in ("AUTH_V39_", "AUTH_V40_") if marker in line]
        if not markers:
            continue
        require(sum(line.count(marker) for marker in ("AUTH_V39_", "AUTH_V40_")) == 1,
                "V40 coalesced or duplicate marker line")
        actual.append(line[line.index(markers[0]):].strip())
    expected = expected_trace(root, variant, scenario)
    require(actual == expected,
            f"V40 {root}/{variant}/{scenario}: marker order/identity changed: {actual}")
    return actual


def inspect_mir(root: str, mir: dict[str, str], identities: dict,
                variant: str) -> dict:
    require(AUTHORITY_MANIFEST in mir and GATE_MANIFEST in mir and
            READY_MANIFEST in mir and POLICY_MANIFEST in mir,
            "V40 selected native MIR closure incomplete")
    reader = v32.v9.v5
    _, authority_body = reader.selected(reader.functions(mir[AUTHORITY_MANIFEST]),
                                        "with_ready_in_transaction(")
    _, gate_body = reader.selected(reader.functions(mir[GATE_MANIFEST]),
                                   "admit_authorization_command(")
    require(authority_body.count(PRE) == int(variant != "clean") and
            authority_body.count(GATE_RESULT) == int(variant != "clean") and
            gate_body.count("AUTH_V40_") == 0,
            f"V40 {root}/{variant}: authority/gate MIR sentinel changed")
    policy = v39.inspect_policy_mir(mir[POLICY_MANIFEST], variant)
    _, ready_body = reader.selected(reader.functions(mir[READY_MANIFEST]), "authorize(")
    require(ready_body.count("AUTH_V39_READY") == int(variant != "clean"),
            f"V40 {root}/{variant}: READY MIR sentinel changed")
    if variant == "clean":
        join = v32.inspect(root, mir, identities)
        require(join["cross_body_execution_proven"] is False and
                len(join["normal_mir_argument_join"]) == 3,
                "V40 clean selected normal MIR argument join changed")
    else:
        join = None
    return {"authority_pre_marker_count": authority_body.count(PRE),
            "authority_gate_marker_count": authority_body.count(GATE_RESULT),
            "ready_marker_count": ready_body.count("AUTH_V39_READY"),
            "gate_mir_sha256": identities[GATE_MANIFEST]["mir_sha256"],
            "authority_mir_sha256": identities[AUTHORITY_MANIFEST]["mir_sha256"],
            "policy_mir_sha256": identities[POLICY_MANIFEST]["mir_sha256"],
            "normal_mir_argument_join": join["normal_mir_argument_join"]
                if join is not None else None,
            "cross_body_execution_proven": False, **policy}


def capture_api(implementation: Path, target: Path, selected: list[str],
                variant: str) -> dict:
    require(not [name for name in v38.FORBIDDEN_ENV if os.environ.get(name)],
            "V40 ambient compiler/build override present")
    metadata, metadata_sha = v29.v7.root_metadata("api", v38.MANIFEST)
    lock = implementation / "authorization-api/Cargo.lock"
    lock_sha = v29.sha(lock.read_bytes())
    env = dict(os.environ)
    env["RUSTFLAGS"] = "--emit=mir,link"
    command = [str(v29.v7.TOOLCHAIN), "cargo", "test", "--offline", "--locked",
               "--no-run", "--test", "v38_probe",
               "--message-format=json-render-diagnostics", "--target-dir", str(target),
               "--manifest-path", str(implementation / v38.MANIFEST)]
    built = subprocess.run(command, cwd=v29.v7.ROOT, env=env, capture_output=True,
                           text=True, timeout=900, check=False)
    require(built.returncode == 0,
            f"V40 API {variant} build failed: {built.stderr[-2500:]}")
    rows = v29.v7.artifact_rows(built.stdout)
    binding, expected = v38.artifact_binding(rows, metadata, selected,
                                             target, implementation)
    require(set(SELECTED) <= set(expected), "V40 API required package closure changed")
    inspected = inspect_mir("api", binding["mir"], binding["identities"], variant)
    refreshed, refreshed_sha = v29.v7.root_metadata("api", v38.MANIFEST)
    require(refreshed == metadata and refreshed_sha == metadata_sha and
            v29.sha(lock.read_bytes()) == lock_sha,
            "V40 API Cargo metadata or lock drift")
    return {"binary": binding["binary"],
            "binary_sha256": binding["test_binary_sha256"],
            "metadata_sha256": metadata_sha, "lock_sha256": lock_sha,
            "test_package_id": binding["test_package_id"],
            "selected_mir_sha256": {name: binding["identities"][name]["mir_sha256"]
                                    for name in SELECTED},
            "inspection": inspected}


def run_api(build: dict, implementation: Path, variant: str,
            scenario: str) -> dict:
    binary = build["binary"]
    require(v29.sha(binary.read_bytes()) == build["binary_sha256"],
            "V40 API binary changed before run")
    expected = "ALLOW" if scenario == "allow" or variant == "bypass-deny" else "DENY"
    env = dict(os.environ)
    env.pop("AUTH_AUTHORIZATION_TRACE_STDERR", None)
    env["AUTH_V39_SCENARIO"] = scenario
    env["AUTH_V39_EXPECT"] = expected
    run = subprocess.run([str(binary), "v38_http_probe", "--exact", "--nocapture",
                          "--test-threads=1"], cwd=implementation, env=env,
                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                         text=True, timeout=60, check=False)
    require(run.returncode == 0 and "1 passed" in run.stdout,
            f"V40 API {variant}/{scenario} failed: {run.stdout[-2200:]}")
    markers = parse_trace(run.stdout, "api", variant, scenario)
    require(v29.sha(binary.read_bytes()) == build["binary_sha256"],
            "V40 API binary changed after run")
    return {"decision": expected, "normal_exit": True, "scenario": scenario,
            "markers": markers, "test_binary_sha256": build["binary_sha256"]}


def run_bridge(binary: Path, implementation: Path, root: str,
               variant: str, scenario: str, policy_path: Path) -> dict:
    payload, policy = v37.v35.fixture(root)
    policy_path.write_text(json.dumps(policy))
    binary_sha = v29.sha(binary.read_bytes())
    env = dict(os.environ)
    env.pop("AUTH_AUTHORIZATION_TRACE_STDERR", None)
    run = subprocess.run([str(binary), str(policy_path)], cwd=implementation,
                         input=json.dumps(payload), text=True, capture_output=True,
                         env=env, timeout=30, check=False)
    require(run.returncode == 0,
            f"V40 {root}/{variant}/{scenario} bridge failed: {run.stderr[-1200:]}")
    allowed = scenario == "allow" or variant == "bypass-deny"
    expected = {"decisions": [allowed]} if root == "tenant" else \
               {"decision": "ALLOW" if allowed else "DENY"}
    require(json.loads(run.stdout) == expected,
            f"V40 {root}/{variant}/{scenario} decision changed")
    markers = parse_trace(run.stderr, root, variant, scenario)
    require(v29.sha(binary.read_bytes()) == binary_sha,
            f"V40 {root}/{variant}/{scenario} binary changed during run")
    return {"decision": expected, "normal_exit": True, "scenario": scenario,
            "markers": markers, "binary_sha256": binary_sha}


def evaluate_root(root: str, inventory: dict, model: dict) -> dict:
    api = root == "api"
    manifest = v38.MANIFEST if api else v29.v6.ROOT_MANIFESTS[root]
    metadata, _ = v29.v7.root_metadata(root, manifest)
    manifests = v29.package_manifests(root, metadata)
    paths = v29.selected_files(manifests)
    before = v29.snapshot(paths)
    selected = sorted(inventory["selected_root_package_manifests"][root])
    require(set(selected) <= {str(path.relative_to(v29.ORIGINAL_IMPL))
                             for path in manifests} and
            all(name in before for name in (manifest, AUTHORITY, GATE, READY, POLICY)),
            f"V40 {root}: selected source closure incomplete")
    require(before[AUTHORITY] == model["authority_source_sha256"] and
            before[GATE] == model["gate_source_sha256"],
            f"V40 {root}: frozen gate model source changed")
    root_source = v38.API if api else v29.ROOT_SOURCE[root]
    require(root_source in before and
            (not api or not (v29.ORIGINAL_IMPL / v38.TEST).exists()),
            f"V40 {root}: root source or synthetic test collision")
    target_name = None if api else \
        v29.v7.expected_local_artifacts(metadata, selected)[manifest]["target_name"]
    harness = v38.HARNESS.replace("AUTH_V38_", "AUTH_V39_") if api else None
    harness_sha = v29.sha(harness.encode()) if harness is not None else None
    variants = ("clean", "marked", "cardinality-gate-deny", "bypass-deny") if api else \
               ("clean", "marked", "marked-duplicate", "cardinality-gate-deny")
    try:
        with tempfile.TemporaryDirectory(prefix=f"auth-v40-{root}-") as temp:
            directory = Path(temp)
            implementation = directory / "implementation"
            v29.mirror(implementation, manifests, paths)
            v36.exact_mirror(implementation, before, root)
            if api:
                test = implementation / v38.TEST
                test.parent.mkdir(parents=True, exist_ok=True)
                require(not test.exists(), "V40 mirror-only API test collision")
                test.write_text(harness)
            original = {name: (implementation / name).read_text()
                        for name in (root_source, AUTHORITY, GATE, READY, POLICY)}
            result = {}
            with v29.overlay_modules(implementation):
                for variant in variants:
                    texts = dict(original)
                    texts[AUTHORITY] = mutate_authority(texts[AUTHORITY], variant)
                    if variant != "clean":
                        texts[READY] = v37.mutate_ready(texts[READY]).replace(
                            "AUTH_V37_READY", "AUTH_V39_READY")
                        texts[POLICY] = v39.mark_policy(texts[POLICY])
                        if not api and variant in ("marked-duplicate",
                                                   "cardinality-gate-deny"):
                            texts[root_source] = v37.mutate_duplicate_row(texts[root_source])
                    expected = dict(before)
                    if api:
                        expected[v38.TEST] = harness_sha
                    for name, source in texts.items():
                        (implementation / name).write_text(source)
                        expected[name] = v29.sha(source.encode())
                    v36.exact_mirror(implementation, expected, root)
                    target = directory / f"{variant}-target"
                    if api:
                        build = capture_api(implementation, target, selected, variant)
                        observations = {"allow": run_api(build, implementation,
                                                         variant, "allow")}
                        if variant != "clean":
                            observations["duplicate"] = run_api(
                                build, implementation, variant, "duplicate")
                        output = {"binary_sha256": build["binary_sha256"],
                                  "metadata_sha256": build["metadata_sha256"],
                                  "lock_sha256": build["lock_sha256"],
                                  "test_package_id": build["test_package_id"],
                                  "selected_mir_sha256": build["selected_mir_sha256"],
                                  "selected_mir_inspection": build["inspection"],
                                  "observations": observations}
                    else:
                        build, rows = v36.capture_with_cargo_artifact(
                            root, manifest, selected, target, inventory,
                            lambda selected_root, mir, identities: inspect_mir(
                                selected_root, mir, identities, variant))
                        same = v36.check_same_build(root, build, target_name)
                        binary = v36.bind_cargo_executable(
                            root, rows, build, manifest, target, target_name)
                        scenario = "allow" if variant in ("clean", "marked") else "duplicate"
                        observations = {scenario: run_bridge(
                            binary, implementation, root, variant, scenario,
                            directory / f"{variant}-policy.json")}
                        output = {**same,
                                  "binary_sha256": observations[scenario]["binary_sha256"],
                                  "selected_mir_sha256": {
                                      name: build["artifacts"][name]["mir_sha256"]
                                      for name in SELECTED if name in build["artifacts"]},
                                  "selected_mir_inspection": build["selected_graph_inspection"],
                                  "observations": observations}
                    v36.exact_mirror(implementation, expected, root)
                    result[variant] = {**output,
                        "source_sha256": {name: expected[name] for name in
                                          (*texts, *((v38.TEST,) if api else ()))}}
            require(len({row["binary_sha256"] for row in result.values()}) == len(result),
                    f"V40 {root}: compiled variants not distinct")
            gate_mir = {row["selected_mir_sha256"][GATE_MANIFEST]
                        for row in result.values()}
            require(len(gate_mir) == 1 and
                    all(row["source_sha256"][GATE] == before[GATE]
                        for row in result.values()),
                    f"V40 {root}: unchanged generated gate source/MIR diverged")
            marked = result["marked"]
            marked_duplicate = result["marked-duplicate"] if not api else marked
            counterfactual = result["cardinality-gate-deny"]
            require(marked_duplicate["selected_mir_sha256"][AUTHORITY_MANIFEST] !=
                    counterfactual["selected_mir_sha256"][AUTHORITY_MANIFEST] and
                    marked_duplicate["selected_mir_sha256"][READY_MANIFEST] ==
                    counterfactual["selected_mir_sha256"][READY_MANIFEST] and
                    marked_duplicate["selected_mir_sha256"][POLICY_MANIFEST] ==
                    counterfactual["selected_mir_sha256"][POLICY_MANIFEST],
                    f"V40 {root}: authority-only compiled mutation not observed")
            if not api:
                require(marked["selected_mir_sha256"][AUTHORITY_MANIFEST] ==
                        marked_duplicate["selected_mir_sha256"][AUTHORITY_MANIFEST] and
                        marked["root_mir_sha256"] !=
                        marked_duplicate["root_mir_sha256"] and
                        marked["source_sha256"][root_source] == before[root_source] and
                        marked_duplicate["source_sha256"][root_source] != before[root_source],
                        f"V40 {root}: duplicate root-only overlay changed")
            if api:
                bypass = result["bypass-deny"]
                require(bypass["selected_mir_sha256"][AUTHORITY_MANIFEST] !=
                        counterfactual["selected_mir_sha256"][AUTHORITY_MANIFEST] and
                        bypass["selected_mir_sha256"][GATE_MANIFEST] ==
                        counterfactual["selected_mir_sha256"][GATE_MANIFEST],
                        "V40 API gate-DENY bypass compiled delta missing")
            return {"root_id": root, "manifest": manifest,
                    "source_bytes_preserved": True,
                    "normal_feature_same_build_mir_and_binary": True,
                    "mirror_only_harness_sha256": harness_sha,
                    "generated_gate_unchanged": True,
                    "variants": result}
    finally:
        after = v29.selected_files(manifests)
        require(after == paths and v29.snapshot(after) == before,
                f"V40 {root}: original selected source/Cargo/SQL path or byte drift")


def evaluate() -> dict:
    authority = (v29.ORIGINAL_IMPL / AUTHORITY).read_text()
    gate = (v29.ORIGINAL_IMPL / GATE).read_text()
    model = check_named_v30_rejection(authority, gate)
    inventory, predecessor_sha = v29.v7.current_inventory()
    roots = {root: evaluate_root(root, inventory, model) for root in ROOTS}
    return {"schema_version": "auth-foundation.v4b-normal-gate-deny/v40-candidate",
            "status": "indeterminate", "predecessor_sha256": predecessor_sha,
            "v30_cardinality_control": model, "roots": roots,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Finite normal-feature counterfactual gate-DENY branches in four copied public roots, with the generated gate unchanged and a cardinality-relaxed authority. API-only compiled bypass demonstrates downstream observer sensitivity. Ordinary duplicate inputs deny before the gate. No unmodified-production gate-result DENY, branch-unreachability proof, owner-wide no-call, endpoint/effect closure, or runtime guarantee."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
