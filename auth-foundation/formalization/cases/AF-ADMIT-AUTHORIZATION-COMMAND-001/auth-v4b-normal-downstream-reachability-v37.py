#!/usr/bin/env python3
"""Unselected, finite normal-build reachability witness for two Auth decisions.

Each bridge variant is an isolated selected-package mirror. Its executable and
MIR sidecars are emitted by the same no-trace Cargo build. The observations are
existential; they neither close the native effect set nor prove DENY no-call.
The READY marker is after command projection, early in the selected body, not
literally its first instruction. A clean ALLOW is paired with an instrumented
normal-feature mirror; the clean executable has no direct entry observation.
"""

from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

CASE = Path(__file__).resolve().parent


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, CASE / filename)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v36 = load("auth_v36_for_v37", "auth-v4b-normal-bridge-reachability-v36.py")
v35 = v36.v35
v29 = v36.v29
v32 = v36.v32
ROOTS = v36.ROOTS
DECISION = "authorization-ready-decision/Cargo.toml"
POLICY = "standard-runtime/Cargo.toml"
DECISION_SOURCE = "authorization-ready-decision/src/lib.rs"
POLICY_SOURCE = "standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs"
READY_MARKER = "AUTH_V37_READY"
POLICY_MARKER = "AUTH_V37_POLICY"
READY_ANCHOR = "    let command = ready.command();\n"
POLICY_ANCHOR = "pub fn authorize(context: &EvaluationContext) -> AuthorizationDecision {\n"
ALLOW_ANCHOR = "    if allow_iff(context) {\n        AuthorizationDecision::Allow\n"


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def replace_once(source: str, old: str, new: str) -> str:
    require(source.count(old) == 1, "V37 source mutation anchor changed")
    return source.replace(old, new, 1)


def mutate_ready(source: str) -> str:
    return replace_once(
        source, READY_ANCHOR,
        READY_ANCHOR +
        '    eprintln!("AUTH_V37_READY request={} epoch={}", '
        'command.request_id, ready.evaluation_epoch_id());\n',
    )


def mutate_policy(source: str, force_deny: bool) -> str:
    marked = replace_once(
        source, POLICY_ANCHOR,
        POLICY_ANCHOR +
        '    eprintln!("AUTH_V37_POLICY request={}", context.request.request_id);\n',
    )
    if force_deny:
        marked = replace_once(
            marked, ALLOW_ANCHOR,
            "    if allow_iff(context) {\n"
            "        AuthorizationDecision::Deny(DenyReason::NoExactActiveRoleGrant)\n",
        )
    return marked


def mutate_duplicate_row(source: str) -> str:
    return replace_once(source, v35.SERVICE_MARKER,
                        v35.DUPLICATE_SQL + v35.SERVICE_MARKER)


def markers(stderr: str, root_id: str, variant: str) -> list[str]:
    request_id = "request-0" if root_id == "tenant" else "verified-request"
    expected = [] if variant in ("clean", "duplicate-pre-gate") else [
        f"{READY_MARKER} request={request_id} epoch=1",
        f"{POLICY_MARKER} request={request_id}",
    ]
    lines = stderr.splitlines()
    require(lines == expected,
            f"{root_id}/{variant}: downstream marker order/identity changed: {lines}")
    return lines


def run_binary(binary: Path, implementation: Path, root_id: str,
               variant: str, policy_path: Path) -> dict:
    input_value, policy = v35.fixture(root_id)
    policy_path.write_text(json.dumps(policy))
    before = v29.sha(binary.read_bytes())
    env = dict(os.environ)
    env.pop("AUTH_AUTHORIZATION_TRACE_STDERR", None)
    observed = subprocess.run([str(binary), str(policy_path)],
                              cwd=implementation, input=json.dumps(input_value),
                              capture_output=True, text=True, env=env,
                              timeout=30, check=False)
    require(observed.returncode == 0,
            f"{root_id}/{variant}: bridge execution failed: {observed.stderr[-1000:]}")
    allow = variant in ("clean", "marked")
    expected = ({"decisions": [allow]} if root_id == "tenant" else
                {"decision": "ALLOW" if allow else "DENY"})
    require(json.loads(observed.stdout) == expected,
            f"{root_id}/{variant}: bridge output changed")
    observed_markers = markers(observed.stderr, root_id, variant)
    require(v29.sha(binary.read_bytes()) == before,
            f"{root_id}/{variant}: executable bytes changed during observation")
    return {"binary_sha256": before, "stdout": expected, "decision": expected,
            "markers": observed_markers, "normal_exit": True}


def inspect_mir(root_id: str, mir: dict[str, str], identities: dict,
                variant: str) -> dict:
    joined = v32.inspect(root_id, mir, identities)
    require(joined["cross_body_execution_proven"] is False and
            DECISION in mir and POLICY in mir,
            f"{root_id}/{variant}: selected decision/policy MIR absent")
    reader = v32.v9.v5
    _, ready_body = reader.selected(reader.functions(mir[DECISION]), "authorize(")
    _, policy_body = reader.selected(reader.functions(mir[POLICY]), "authorize(")
    should_mark = variant != "clean"
    require((READY_MARKER in ready_body) == should_mark and
            (POLICY_MARKER in policy_body) == should_mark,
            f"{root_id}/{variant}: selected downstream MIR sentinel changed")
    require(ready_body.count(READY_MARKER) == int(should_mark) and
            policy_body.count(POLICY_MARKER) == int(should_mark),
            f"{root_id}/{variant}: duplicate downstream MIR sentinel")
    return {"normal_mir_argument_join": joined["normal_mir_argument_join"],
            "cross_body_execution_proven": False,
            "selected_ready_mir_sha256": identities[DECISION]["mir_sha256"],
            "selected_policy_mir_sha256": identities[POLICY]["mir_sha256"],
            "ready_sentinel_site": should_mark,
            "policy_sentinel_site": should_mark}


def evaluate_root(root_id: str, inventory: dict) -> dict:
    require(root_id in ROOTS, "unknown bridge root")
    manifest = v29.v6.ROOT_MANIFESTS[root_id]
    metadata, _ = v29.v7.root_metadata(root_id, manifest)
    manifests = v29.package_manifests(root_id, metadata)
    files = v29.selected_files(manifests)
    before = v29.snapshot(files)
    relative_manifests = sorted(inventory["selected_root_package_manifests"][root_id])
    require(set(relative_manifests) <=
            {str(path.relative_to(v29.ORIGINAL_IMPL)) for path in manifests},
            f"{root_id}: selected package absent from mirror")
    target_name = v29.v7.expected_local_artifacts(metadata, relative_manifests)[manifest]["target_name"]
    root_source = v29.ROOT_SOURCE[root_id]
    require(all(item in before for item in
                (manifest, root_source, DECISION_SOURCE, POLICY_SOURCE)),
            f"{root_id}: selected source or manifest absent")
    try:
        with tempfile.TemporaryDirectory(prefix=f"auth-v37-{root_id}-") as temporary:
            directory = Path(temporary)
            implementation = directory / "implementation"
            v29.mirror(implementation, manifests, files)
            v36.exact_mirror(implementation, before, root_id)
            original_ready = (implementation / DECISION_SOURCE).read_text()
            original_policy = (implementation / POLICY_SOURCE).read_text()
            original_root = (implementation / root_source).read_text()
            variants: dict[str, dict] = {}
            with v29.overlay_modules(implementation):
                for variant in ("clean", "marked", "policy-deny", "duplicate-pre-gate"):
                    if variant == "clean":
                        expected = before
                    else:
                        ready = mutate_ready(original_ready)
                        policy = mutate_policy(original_policy,
                                               force_deny=variant == "policy-deny")
                        (implementation / DECISION_SOURCE).write_text(ready)
                        (implementation / POLICY_SOURCE).write_text(policy)
                        expected = {**before,
                                    DECISION_SOURCE: v29.sha(ready.encode()),
                                    POLICY_SOURCE: v29.sha(policy.encode())}
                        if variant == "duplicate-pre-gate":
                            root = mutate_duplicate_row(original_root)
                            (implementation / root_source).write_text(root)
                            expected[root_source] = v29.sha(root.encode())
                        else:
                            (implementation / root_source).write_text(original_root)
                    v36.exact_mirror(implementation, expected, root_id)
                    target = directory / f"{variant}-target"
                    build, rows = v36.capture_with_cargo_artifact(
                        root_id, manifest, relative_manifests, target, inventory,
                        lambda selected, mir, identities: inspect_mir(
                            selected, mir, identities, variant))
                    same_build = v36.check_same_build(root_id, build, target_name)
                    require(POLICY in build["artifacts"] and
                            build["selected_graph_inspection"]["ready_sentinel_site"] ==
                            (variant != "clean"),
                            f"{root_id}/{variant}: same-build downstream artifact absent")
                    binary = v36.bind_cargo_executable(
                        root_id, rows, build, manifest, target, target_name)
                    observation = run_binary(binary, implementation, root_id,
                                             variant, directory / f"{variant}-policy.json")
                    v36.exact_mirror(implementation, expected, root_id)
                    variants[variant] = {
                        **same_build,
                        "policy_mir_sha256": build["artifacts"][POLICY]["mir_sha256"],
                        "selected_graph_inspection": build["selected_graph_inspection"],
                        "source_sha256": {name: expected[name] for name in
                                          (root_source, DECISION_SOURCE, POLICY_SOURCE)},
                        **observation,
                    }
            require(len({row["binary_sha256"] for row in variants.values()}) == 4,
                    f"{root_id}: clean and hostile binary identities not distinct")
            require(variants["clean"]["root_mir_sha256"] !=
                    variants["duplicate-pre-gate"]["root_mir_sha256"] and
                    variants["marked"]["ready_decision_mir_sha256"] !=
                    variants["clean"]["ready_decision_mir_sha256"] and
                    variants["marked"]["policy_mir_sha256"] !=
                    variants["clean"]["policy_mir_sha256"] and
                    variants["policy-deny"]["policy_mir_sha256"] !=
                    variants["marked"]["policy_mir_sha256"],
                    f"{root_id}: expected compiled mutation absent")
            return {"manifest": manifest, "manifest_sha256": before[manifest],
                    "root_source": root_source,
                    "normal_feature_same_build_mir_and_binary": True,
                    "clean_allow": True, "instrumented_allow": True,
                    "policy_mutant_denied": True, "negative_control_silent": True,
                    "source_bytes_preserved": True,
                    "clean": variants["clean"],
                    "instrumented": variants["marked"],
                    "policy_mutant": variants["policy-deny"],
                    "negative": variants["duplicate-pre-gate"]}
    finally:
        after_files = v29.selected_files(manifests)
        require(after_files == files and v29.snapshot(after_files) == before,
                f"{root_id}: original selected source/Cargo/SQL path or byte drift")


def evaluate() -> dict:
    inventory, predecessor_sha = v29.v7.current_inventory()
    roots = {root: evaluate_root(root, inventory) for root in ROOTS}
    return {
        "schema_version": "auth-foundation.v4b-normal-downstream-reachability/v37-candidate",
        "status": "indeterminate", "predecessor_sha256": predecessor_sha,
        "roots": roots,
        "candidate_promotions": [
            {"root": root, "entrypoint": entrypoint, "state": "reachable",
             "witness": "v37-paired-instrumented-normal-build-entry-observed"}
            for root in ROOTS for entrypoint in ("ready-decision", "generated-policy")
        ],
        "endpoint_set_closed": False, "all_path_ready_dominance": False,
        "runtime_guarantees_observed": False,
        "claim_limit": "Existential READY-decision early-body and generated-policy entry observations in marked normal-feature binaries paired with clean ALLOW builds for finite valid requests in three bridges; clean entry is not directly observed, and there is no API, all-path DENY no-call, or endpoint/effect closure claim.",
    }


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
