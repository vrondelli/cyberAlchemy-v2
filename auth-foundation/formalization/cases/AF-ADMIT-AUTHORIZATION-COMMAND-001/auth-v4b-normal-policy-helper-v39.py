#!/usr/bin/env python3
"""Finite normal-build observations of generated Auth Rule helper roles.

Only isolated selected-package mirrors are changed. A clean ALLOW is paired
with a marked normal-feature build; six API-only false-return variants provide
causal controls. Finite silence of a public helper is not a non-reachability
proof, and an early duplicate-row DENY is not a gate-result DENY.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import importlib.util

CASE = Path(__file__).resolve().parent


def load(label: str, filename: str):
    spec = importlib.util.spec_from_file_location(label, CASE / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v38 = load("auth_v38_for_v39", "auth-v4b-normal-api-reachability-v38.py")
v37 = v38.v37
v29, v32, v36 = v37.v29, v37.v32, v37.v36
POLICY = v37.POLICY_SOURCE
POLICY_MANIFEST = v37.POLICY
READY = v37.DECISION_SOURCE
READY_MANIFEST = v37.DECISION
HELPERS = (
    "allow_iff", "unique_resolved_session", "trusted_scope",
    "session_current", "complete_active_roles", "exact_active_role_grant",
    "authorization_admissible", "default_deny",
)
ACTIVE = HELPERS[:6]
DORMANT = HELPERS[6:]
MARKER = "AUTH_V39_"
ROOTS = ("api", *v37.ROOTS)


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def policy_anchor(name: str) -> str:
    if name == "authorize":
        return v37.POLICY_ANCHOR
    signatures = {
        "complete_active_roles": "context: &EvaluationContext, session: &Session",
        "exact_active_role_grant": "context: &EvaluationContext, session: &Session",
        "session_current": "context: &EvaluationContext, session: &Session",
        "trusted_scope": "context: &EvaluationContext",
        "unique_resolved_session": "context: &EvaluationContext",
        "allow_iff": "context: &EvaluationContext",
        "authorization_admissible": "context: &EvaluationContext, session: &Session",
        "default_deny": "context: &EvaluationContext",
    }
    return f"pub fn {name}({signatures[name]}) -> bool {{\n"


def mark_policy(source: str, false_helper: str | None = None) -> str:
    require(false_helper is None or false_helper in ACTIVE,
            "V39 false-return target is not an active helper")
    for name in ("authorize", *HELPERS):
        anchor = policy_anchor(name)
        require(source.count(anchor) == 1, f"V39 policy anchor changed: {name}")
        marker = (f'    eprintln!("{MARKER}{name} request={{}}", '
                  'context.request.request_id);\n')
        mutant = "    return false;\n" if name == false_helper else ""
        source = source.replace(anchor, anchor + marker + mutant, 1)
    return source


def expected_trace(request: str, variant: str, api: bool,
                   scenario: str = "allow") -> list[str]:
    require(variant in ("clean", "marked", "duplicate-pre-gate", *ACTIVE),
            "V39 unknown variant")
    prefix = [f"{MARKER}CASE request={request}"] if api else []
    if variant == "clean" or scenario == "duplicate" or \
            variant == "duplicate-pre-gate":
        names: list[str] = []
    elif variant in ACTIVE:
        names = ["READY", "authorize", *ACTIVE[:ACTIVE.index(variant) + 1]]
    else:
        names = ["READY", "authorize", *ACTIVE]
    body = [f"{MARKER}{name} request={request}" +
            (" epoch=1" if name == "READY" else "") for name in names]
    decision = "ALLOW" if scenario == "allow" and variant in ("clean", "marked") else "DENY"
    suffix = [f"{MARKER}END request={request} decision={decision}"] if api else []
    return prefix + body + suffix


def parse_trace(output: str, request: str, variant: str, api: bool,
                scenario: str = "allow") -> list[str]:
    observed = []
    for line in output.splitlines():
        if MARKER not in line:
            continue
        require(line.count(MARKER) == 1, "V39 multiple markers on one line")
        observed.append(line[line.index(MARKER):].strip())
    expected = expected_trace(request, variant, api, scenario)
    require(observed == expected,
            f"V39 {variant}/{scenario}: marker order/count/identity changed: {observed}")
    return observed


def inspect_policy_mir(mir: str, variant: str) -> dict:
    reader = v32.v9.v5
    functions = reader.functions(mir)
    expected = variant != "clean"
    counts = {}
    for name in ("authorize", *HELPERS):
        _, body = reader.selected(functions, f"{name}(")
        token = f"{MARKER}{name}"
        require(body.count(token) == int(expected),
                f"V39 {variant}: selected {name} MIR marker changed")
        counts[name] = body.count(token)
    return {"selected_policy_function_markers": counts,
            "all_nine_policy_bodies_bound": True}


def inspect_bridge(root: str, mir: dict[str, str], identities: dict,
                   variant: str) -> dict:
    joined = None
    if variant == "clean":
        joined = v32.inspect(root, mir, identities)
        require(joined["cross_body_execution_proven"] is False and
                len(joined["normal_mir_argument_join"]) == 3,
                "V39 bridge cross-body claim changed")
    reader = v32.v9.v5
    _, ready_body = reader.selected(reader.functions(mir[READY_MANIFEST]), "authorize(")
    require(ready_body.count(f"{MARKER}READY") == int(variant != "clean"),
            f"V39 {root}/{variant}: READY MIR marker changed")
    return {"ready_marker_count": ready_body.count(f"{MARKER}READY"),
            "normal_mir_argument_join": joined["normal_mir_argument_join"]
                if joined is not None else None,
            "cross_body_execution_proven": False,
            **inspect_policy_mir(mir[POLICY_MANIFEST], variant)}


def bridge_observation(binary: Path, implementation: Path, root: str,
                       variant: str, policy_path: Path) -> dict:
    request = "request-0" if root == "tenant" else "verified-request"
    payload, policy = v37.v35.fixture(root)
    policy_path.write_text(json.dumps(policy))
    binary_sha = v29.sha(binary.read_bytes())
    env = dict(os.environ)
    env.pop("AUTH_AUTHORIZATION_TRACE_STDERR", None)
    run = subprocess.run([str(binary), str(policy_path)], cwd=implementation,
                         input=json.dumps(payload), text=True, capture_output=True,
                         env=env, timeout=30, check=False)
    require(run.returncode == 0,
            f"V39 {root}/{variant} bridge failed: {run.stderr[-900:]}")
    allowed = variant in ("clean", "marked")
    expected = {"decisions": [allowed]} if root == "tenant" else \
               {"decision": "ALLOW" if allowed else "DENY"}
    require(json.loads(run.stdout) == expected,
            f"V39 {root}/{variant} decision changed")
    trace = parse_trace(run.stderr, request, variant, False)
    require(v29.sha(binary.read_bytes()) == binary_sha,
            f"V39 {root}/{variant} binary changed during run")
    return {"binary_sha256": binary_sha, "decision": expected,
            "markers": trace, "normal_exit": True}


def bridge_root(root: str, inventory: dict) -> dict:
    manifest = v29.v6.ROOT_MANIFESTS[root]
    metadata, _ = v29.v7.root_metadata(root, manifest)
    manifests = v29.package_manifests(root, metadata)
    paths = v29.selected_files(manifests)
    before = v29.snapshot(paths)
    selected = sorted(inventory["selected_root_package_manifests"][root])
    require(set(selected) <= {str(path.relative_to(v29.ORIGINAL_IMPL))
                             for path in manifests}, "V39 bridge closure changed")
    target_name = v29.v7.expected_local_artifacts(metadata, selected)[manifest]["target_name"]
    root_source = v29.ROOT_SOURCE[root]
    require(all(path in before for path in (manifest, root_source, READY, POLICY)),
            "V39 bridge input missing")
    try:
        with tempfile.TemporaryDirectory(prefix=f"auth-v39-{root}-") as temp:
            directory = Path(temp)
            implementation = directory / "implementation"
            v29.mirror(implementation, manifests, paths)
            v36.exact_mirror(implementation, before, root)
            original = {name: (implementation / name).read_text()
                        for name in (root_source, READY, POLICY)}
            variants = {}
            with v29.overlay_modules(implementation):
                for variant in ("clean", "marked", "duplicate-pre-gate"):
                    texts = dict(original)
                    if variant != "clean":
                        texts[READY] = v37.mutate_ready(texts[READY]).replace(
                            "AUTH_V37_READY", f"{MARKER}READY")
                        texts[POLICY] = mark_policy(texts[POLICY])
                        if variant == "duplicate-pre-gate":
                            texts[root_source] = v37.mutate_duplicate_row(texts[root_source])
                    expected = dict(before)
                    for name, body in texts.items():
                        (implementation / name).write_text(body)
                        expected[name] = v29.sha(body.encode())
                    v36.exact_mirror(implementation, expected, root)
                    target = directory / f"{variant}-target"
                    build, rows = v36.capture_with_cargo_artifact(
                        root, manifest, selected, target, inventory,
                        lambda selected_root, mir, identities: inspect_bridge(
                            selected_root, mir, identities, variant))
                    same = v36.check_same_build(root, build, target_name)
                    binary = v36.bind_cargo_executable(
                        root, rows, build, manifest, target, target_name)
                    observed = bridge_observation(binary, implementation, root, variant,
                                                  directory / f"{variant}-policy.json")
                    v36.exact_mirror(implementation, expected, root)
                    variants[variant] = {**same, **observed,
                        "source_sha256": {name: expected[name] for name in texts},
                        "policy_mir_sha256": build["artifacts"][POLICY_MANIFEST]["mir_sha256"],
                        "ready_mir_sha256": build["artifacts"][READY_MANIFEST]["mir_sha256"],
                        "selected_policy_mir": build["selected_graph_inspection"]}
            require(len({row["binary_sha256"] for row in variants.values()}) == 3 and
                    variants["clean"]["policy_mir_sha256"] !=
                        variants["marked"]["policy_mir_sha256"] and
                    variants["clean"]["ready_mir_sha256"] !=
                        variants["marked"]["ready_mir_sha256"] and
                    variants["marked"]["root_mir_sha256"] !=
                        variants["duplicate-pre-gate"]["root_mir_sha256"],
                    f"V39 {root}: compiled bridge variant identity changed")
            return {"root_id": root, "manifest": manifest,
                    "source_bytes_preserved": True,
                    "normal_feature_same_build_mir_and_binary": True,
                    "variants": variants}
    finally:
        after = v29.selected_files(manifests)
        require(after == paths and v29.snapshot(after) == before,
                f"V39 {root}: original selected source/Cargo/SQL drift")


def capture_api(implementation: Path, target: Path, selected: list[str],
                variant: str) -> dict:
    require(not [name for name in v38.FORBIDDEN_ENV if os.environ.get(name)],
            "V39 ambient compiler/build override present")
    metadata, metadata_sha = v29.v7.root_metadata("api", v38.MANIFEST)
    lock = implementation / "authorization-api/Cargo.lock"
    lock_sha = v29.sha(lock.read_bytes())
    env = dict(os.environ)
    env["RUSTFLAGS"] = "--emit=mir,link"
    command = [str(v29.v7.TOOLCHAIN), "cargo", "test", "--offline", "--locked",
               "--no-run", "--test", "v38_probe",
               "--message-format=json-render-diagnostics", "--target-dir", str(target),
               "--manifest-path", str(implementation / v38.MANIFEST)]
    run = subprocess.run(command, cwd=v29.v7.ROOT, env=env, capture_output=True,
                         text=True, timeout=900, check=False)
    require(run.returncode == 0,
            f"V39 API {variant} build failed: {run.stderr[-2500:]}")
    rows = v29.v7.artifact_rows(run.stdout)
    binding, _ = v38.artifact_binding(rows, metadata, selected, target, implementation)
    policy_mir = binding["mir"][POLICY_MANIFEST]
    inspection = inspect_policy_mir(policy_mir, variant)
    joined = v32.inspect("api", binding["mir"], binding["identities"]) \
        if variant == "clean" else None
    if joined is not None:
        require(joined["cross_body_execution_proven"] is False and
                len(joined["normal_mir_argument_join"]) == 3,
                "V39 clean API normal MIR handoff changed")
    reader = v32.v9.v5
    _, ready_body = reader.selected(
        reader.functions(binding["mir"][READY_MANIFEST]), "authorize(")
    require(ready_body.count(f"{MARKER}READY") == int(variant != "clean"),
            f"V39 API {variant}: READY MIR marker changed")
    refreshed, refreshed_sha = v29.v7.root_metadata("api", v38.MANIFEST)
    require(refreshed == metadata and refreshed_sha == metadata_sha and
            v29.sha(lock.read_bytes()) == lock_sha,
            "V39 API Cargo metadata/lock drift")
    return {"binary": binding["binary"],
            "binary_sha256": binding["test_binary_sha256"],
            "metadata_sha256": metadata_sha, "lock_sha256": lock_sha,
            "test_package_id": binding["test_package_id"],
            "selected_mir_sha256": {name: binding["identities"][name]["mir_sha256"]
                                    for name in v38.SELECTED},
            "inspection": {**inspection,
                           "normal_mir_argument_join":
                               joined["normal_mir_argument_join"]
                               if joined is not None else None,
                           "cross_body_execution_proven": False,
                           "ready_marker_count": ready_body.count(f"{MARKER}READY")}}


def run_api(build: dict, implementation: Path, variant: str,
            scenario: str = "allow") -> dict:
    require(scenario in ("allow", "duplicate") and
            (scenario == "allow" or variant == "marked"),
            "V39 invalid API scenario")
    binary = build["binary"]
    require(v29.sha(binary.read_bytes()) == build["binary_sha256"],
            "V39 API binary changed before observation")
    env = dict(os.environ)
    env.pop("AUTH_AUTHORIZATION_TRACE_STDERR", None)
    env["AUTH_V39_SCENARIO"] = scenario
    decision = "ALLOW" if variant in ("clean", "marked") and \
               scenario == "allow" else "DENY"
    env["AUTH_V39_EXPECT"] = decision
    run = subprocess.run([str(binary), "v38_http_probe", "--exact", "--nocapture",
                          "--test-threads=1"], cwd=implementation, env=env,
                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                         text=True, timeout=60, check=False)
    require(run.returncode == 0 and "1 passed" in run.stdout,
            f"V39 API {variant}/{scenario} failed: {run.stdout[-1800:]}")
    request = f"auth_v38_{scenario}"
    trace = parse_trace(run.stdout, request, variant, True, scenario)
    require(v29.sha(binary.read_bytes()) == build["binary_sha256"],
            "V39 API binary changed during observation")
    return {"normal_exit": True, "scenario": scenario, "decision": decision,
            "markers": trace, "test_binary_sha256": build["binary_sha256"]}


def api_root(inventory: dict) -> dict:
    root = "api"
    metadata, _ = v29.v7.root_metadata(root, v38.MANIFEST)
    manifests = v29.package_manifests(root, metadata)
    paths = v29.selected_files(manifests)
    before = v29.snapshot(paths)
    selected = sorted(inventory["selected_root_package_manifests"][root])
    require(set(selected) <= {str(path.relative_to(v29.ORIGINAL_IMPL))
                             for path in manifests} and
            all(name in before for name in (v38.MANIFEST, READY, POLICY)),
            "V39 selected API closure changed")
    require(not (v29.ORIGINAL_IMPL / v38.TEST).exists(),
            "V39 synthetic API test collides with original")
    harness = v38.HARNESS.replace("AUTH_V38_", MARKER)
    harness_sha = v29.sha(harness.encode())
    try:
        with tempfile.TemporaryDirectory(prefix="auth-v39-api-") as temp:
            directory = Path(temp)
            implementation = directory / "implementation"
            v29.mirror(implementation, manifests, paths)
            v36.exact_mirror(implementation, before, root)
            test = implementation / v38.TEST
            test.parent.mkdir(parents=True, exist_ok=True)
            require(not test.exists(), "V39 mirror test path collision")
            test.write_text(harness)
            original = {name: (implementation / name).read_text()
                        for name in (READY, POLICY)}
            variants = {}
            with v29.overlay_modules(implementation):
                for variant in ("clean", "marked", *ACTIVE):
                    texts = dict(original)
                    if variant != "clean":
                        texts[READY] = v37.mutate_ready(texts[READY]).replace(
                            "AUTH_V37_READY", f"{MARKER}READY")
                        texts[POLICY] = mark_policy(texts[POLICY],
                                                    variant if variant in ACTIVE else None)
                    expected = {**before, v38.TEST: harness_sha}
                    for name, body in texts.items():
                        (implementation / name).write_text(body)
                        expected[name] = v29.sha(body.encode())
                    v36.exact_mirror(implementation, expected, root)
                    build = capture_api(implementation, directory / f"{variant}-target",
                                        selected, variant)
                    observations = {"allow": run_api(build, implementation, variant)}
                    if variant == "marked":
                        observations["duplicate"] = run_api(
                            build, implementation, variant, "duplicate")
                    v36.exact_mirror(implementation, expected, root)
                    variants[variant] = {
                        "source_sha256": {name: expected[name] for name in
                                          (v38.API, READY, POLICY, v38.TEST)},
                        "binary_sha256": build["binary_sha256"],
                        "metadata_sha256": build["metadata_sha256"],
                        "lock_sha256": build["lock_sha256"],
                        "test_package_id": build["test_package_id"],
                        "selected_mir_sha256": build["selected_mir_sha256"],
                        "selected_mir_inspection": build["inspection"],
                        "observations": observations,
                    }
            require(len({row["binary_sha256"] for row in variants.values()}) ==
                    len(variants), "V39 API binary variants not distinct")
            clean, marked = variants["clean"], variants["marked"]
            require(clean["selected_mir_sha256"][POLICY_MANIFEST] !=
                    marked["selected_mir_sha256"][POLICY_MANIFEST] and
                    clean["selected_mir_sha256"][READY_MANIFEST] !=
                    marked["selected_mir_sha256"][READY_MANIFEST],
                    "V39 API marked MIR identity unchanged")
            marked_source = mark_policy(original[POLICY])
            for name in ACTIVE:
                mutant = mark_policy(original[POLICY], name)
                marker_line = (f'    eprintln!("{MARKER}{name} request={{}}", '
                               'context.request.request_id);\n')
                require(mutant == marked_source.replace(
                    marker_line, marker_line + "    return false;\n", 1) and
                    variants[name]["source_sha256"][READY] == marked["source_sha256"][READY] and
                    variants[name]["source_sha256"][POLICY] != marked["source_sha256"][POLICY] and
                    variants[name]["selected_mir_sha256"][POLICY_MANIFEST] !=
                        marked["selected_mir_sha256"][POLICY_MANIFEST],
                    f"V39 API {name} causal source/MIR delta changed")
            require(all(row["metadata_sha256"] == clean["metadata_sha256"] and
                        row["lock_sha256"] == clean["lock_sha256"] and
                        row["test_package_id"] == clean["test_package_id"] and
                        row["source_sha256"][v38.TEST] == harness_sha
                        for row in variants.values()),
                    "V39 API metadata/target binding drift")
            return {"root_id": root, "manifest": v38.MANIFEST,
                    "source_bytes_preserved": True,
                    "normal_feature_same_build_mir_and_test_binary": True,
                    "mirror_only_harness_sha256": harness_sha,
                    "variants": variants}
    finally:
        after = v29.selected_files(manifests)
        require(after == paths and v29.snapshot(after) == before,
                "V39 API original selected source/Cargo/SQL drift")


def evaluate() -> dict:
    inventory, predecessor_sha = v29.v7.current_inventory()
    require(sorted(row["name"] for row in inventory["generated_policy_callables"])
            == sorted(("authorize", *HELPERS)),
            "V39 generated policy public surface changed")
    roots = {root: (api_root(inventory) if root == "api" else
                    bridge_root(root, inventory)) for root in ROOTS}
    return {"schema_version": "auth-foundation.v4b-normal-policy-helper/v39-candidate",
            "status": "indeterminate", "predecessor_sha256": predecessor_sha,
            "roots": roots, "active_helpers": ACTIVE,
            "dormant_in_observed_selected_allow": DORMANT,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Finite selected-flow helper entry and causal false-return observations in paired marked normal-feature mirrors over four roots. Two public helpers are silent in observed ALLOW and early pre-gate DENY runs, not ruled out on all paths. No gate-result DENY, clean-body direct entry, owner-wide no-call, endpoint/effect closure, or runtime guarantee."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
