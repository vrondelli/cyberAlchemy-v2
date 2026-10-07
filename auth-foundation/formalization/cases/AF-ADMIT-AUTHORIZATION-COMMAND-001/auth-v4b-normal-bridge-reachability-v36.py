#!/usr/bin/env python3
"""Unselected existential reachability witness for three normal Auth bridges.

The MIR and executable for each observation come from one no-trace Cargo
build of an isolated copy of the selected root. This proves only that the
admission service is reachable for the tested valid input, not that any DENY
path avoids every native decision entrypoint.
"""

from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

CASE = Path(__file__).resolve().parent


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, CASE / filename)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v29 = load("auth_v29_for_v36", "auth-v4b-selected-root-overlay-v29.py")
v32 = load("auth_v32_for_v36", "auth-v4b-same-request-handoff-v32.py")
v35 = load("auth_v35_for_v36", "auth-v4b-bridge-deny-observation-v35.py")
ROOTS = ("tenant", "prototype", "https")
READY = "authorization-ready-decision/Cargo.toml"
ADMISSION = "authorization-admission-service/Cargo.toml"
CALLBACK_SENTINEL = "AUTH_V36_CALLBACK_ENTERED"


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def selected_binary(target: Path, target_name: str) -> Path:
    require(target_name in ("auth-tenant-bridge", "auth-prototype-bridge"),
            "unexpected bridge target name")
    binary = target / "debug" / target_name
    require(binary.is_file() and not binary.is_symlink() and
            binary.resolve().is_relative_to(target.resolve()),
            "same-build bridge executable missing or escaped")
    return binary


def run_binary(binary: Path, implementation: Path, root_id: str,
               policy_path: Path, expected_allow: bool,
               expected_stderr: str = "") -> dict:
    input_value, policy = v35.fixture(root_id)
    policy_path.write_text(json.dumps(policy))
    before = v29.sha(binary.read_bytes())
    env = dict(os.environ)
    env.pop("AUTH_AUTHORIZATION_TRACE_STDERR", None)
    observed = subprocess.run([str(binary), str(policy_path)],
                              cwd=implementation, input=json.dumps(input_value),
                              capture_output=True, text=True, env=env,
                              timeout=30, check=False)
    require(observed.returncode == 0 and observed.stderr == expected_stderr,
            f"{root_id}: normal bridge execution failed: {observed.stderr[-1000:]}")
    expected = ({"decisions": [expected_allow]} if root_id == "tenant" else
                {"decision": "ALLOW" if expected_allow else "DENY"})
    require(json.loads(observed.stdout) == expected,
            f"{root_id}: normal bridge result changed")
    require(v29.sha(binary.read_bytes()) == before,
            f"{root_id}: executable bytes changed during observation")
    return {"binary_sha256": before, "output": expected,
            "normal_exit": True,
            "callback_sentinel_count": observed.stderr.count(CALLBACK_SENTINEL)}


def exact_mirror(implementation: Path, expected: dict[str, str], root_id: str) -> None:
    actual = {str(path.relative_to(implementation)): v29.sha(path.read_bytes())
              for path in implementation.rglob("*") if path.is_file()}
    require(actual == expected,
            f"{root_id}: mirror source path or byte set drift")


def mutate_callback(implementation: Path, root_id: str) -> str:
    path = implementation / v29.ROOT_SOURCE[root_id]
    source = path.read_text()
    marker = v29.HANDOFF[root_id]
    require(source.count(marker) == 1,
            f"{root_id}: selected callback mutation anchor changed")
    replacement = marker.replace(
        "authorize_ready_decision",
        f'|_ready| {{ eprintln!("{CALLBACK_SENTINEL}"); '
        "BinaryAuthorizationDecision::Deny }",
    )
    path.write_text(source.replace(marker, replacement, 1))
    return v29.sha(path.read_bytes())


def capture_with_cargo_artifact(root_id: str, manifest: str,
                                relative_manifests: list[str], target: Path,
                                inventory: dict, inspector) -> tuple[dict, list[dict]]:
    captured: list[list[dict]] = []
    original = v29.v7.artifact_rows

    def retain_rows(stdout: str) -> list[dict]:
        rows = original(stdout)
        captured.append(rows)
        return rows

    with patch.object(v29.v7, "artifact_rows", side_effect=retain_rows):
        build = v29.v7.capture_root(root_id, manifest, relative_manifests,
                                    target, inventory, mir_inspector=inspector)
    require(len(captured) == 1,
            f"{root_id}: Cargo artifact row capture changed")
    return build, captured[0]


def bind_cargo_executable(root_id: str, rows: list[dict], build: dict,
                          manifest: str, target: Path, target_name: str) -> Path:
    binary = selected_binary(target, target_name)
    package_id = build["artifacts"][manifest]["package_id"]
    matches = [row for row in rows
               if row.get("package_id") == package_id and
               row.get("target", {}).get("name") == target_name and
               "bin" in row.get("target", {}).get("kind", [])]
    require(len(matches) == 1 and matches[0].get("executable") == str(binary),
            f"{root_id}: runnable binary not bound to Cargo emitted root artifact")
    return binary


def check_same_build(root_id: str, build: dict, target_name: str) -> dict:
    manifest = v29.v6.ROOT_MANIFESTS[root_id]
    artifacts = build["artifacts"]
    require(manifest in artifacts and ADMISSION in artifacts and READY in artifacts,
            f"{root_id}: selected same-build local artifacts missing")
    require(all("trace" not in row["features"] for row in artifacts.values()),
            f"{root_id}: trace feature active in normal build")
    require(artifacts[manifest]["target_name"] == target_name and
            "bin" in artifacts[manifest]["target_kind"],
            f"{root_id}: executable target identity changed")
    return {"root_mir_sha256": artifacts[manifest]["mir_sha256"],
            "admission_mir_sha256": artifacts[ADMISSION]["mir_sha256"],
            "ready_decision_mir_sha256": artifacts[READY]["mir_sha256"],
            "root_package_id": artifacts[manifest]["package_id"],
            "metadata_sha256": build["metadata_sha256"],
            "lock_sha256": build["lock_sha256"]}


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
            f"{root_id}: selected compiled package absent from mirror")
    target_name = v29.v7.expected_local_artifacts(metadata, relative_manifests)[manifest]["target_name"]
    root_source = v29.ROOT_SOURCE[root_id]
    require(root_source in before and manifest in before,
            f"{root_id}: root source or manifest absent from snapshot")
    try:
        with tempfile.TemporaryDirectory(prefix=f"auth-v36-{root_id}-") as temporary:
            directory = Path(temporary)
            implementation = directory / "implementation"
            v29.mirror(implementation, manifests, files)
            exact_mirror(implementation, before, root_id)
            with v29.overlay_modules(implementation):
                clean_target = directory / "clean-target"
                clean_build, clean_rows = capture_with_cargo_artifact(
                    root_id, manifest, relative_manifests, clean_target, inventory,
                    v32.inspect)
                clean_join = clean_build["selected_graph_inspection"]
                require(clean_join["status"] == "indeterminate" and
                        len(clean_join["normal_mir_argument_join"]) == 3 and
                        clean_join["cross_body_execution_proven"] is False,
                        f"{root_id}: normal MIR handoff join changed")
                clean_identity = check_same_build(root_id, clean_build, target_name)
                clean = run_binary(bind_cargo_executable(root_id, clean_rows, clean_build,
                                                         manifest, clean_target, target_name),
                                   implementation, root_id,
                                   directory / "clean-policy.json", True)
                require(clean["callback_sentinel_count"] == 0,
                        f"{root_id}: clean callback sentinel unexpectedly emitted")
                exact_mirror(implementation, before, root_id)

                # The hostile source is an exact replacement of the selected
                # callback at the one direct admission call. It must still
                # compile and run, but the normal-MIR join must reject it.
                mutant_source_sha256 = mutate_callback(implementation, root_id)
                mirror_after_mutation = {**before, root_source: mutant_source_sha256}
                exact_mirror(implementation, mirror_after_mutation, root_id)
                rejection = {}

                def hostile_inspector(selected_root: str, mir: dict[str, str],
                                      identities: dict) -> dict:
                    count = v29.compiled_reference_count(mir)
                    require(count == 0,
                            f"{selected_root}: callback mutant MIR reference still present")
                    try:
                        v32.inspect(selected_root, mir, identities)
                    except ValueError as error:
                        require("READY callback target count" in str(error),
                                f"{selected_root}: wrong callback rejection: {error}")
                        rejection["reason"] = str(error)
                    else:
                        raise ValueError(f"{selected_root}: callback mutant passed MIR handoff")
                    return {"status": "rejected", "reason": rejection["reason"]}

                mutant_target = directory / "mutant-target"
                mutant_build, mutant_rows = capture_with_cargo_artifact(
                    root_id, manifest, relative_manifests, mutant_target, inventory,
                    hostile_inspector)
                require(rejection.get("reason") and
                        mutant_build["selected_graph_inspection"]["status"] == "rejected",
                        f"{root_id}: callback mutant rejection missing")
                mutant_identity = check_same_build(root_id, mutant_build, target_name)
                mutant = run_binary(bind_cargo_executable(root_id, mutant_rows, mutant_build,
                                                          manifest, mutant_target, target_name),
                                    implementation, root_id,
                                    directory / "mutant-policy.json", False,
                                    CALLBACK_SENTINEL + "\n")
                require(mutant["callback_sentinel_count"] == 1,
                        f"{root_id}: callback sentinel count changed")
                require(clean["binary_sha256"] != mutant["binary_sha256"] and
                        clean_identity["root_mir_sha256"] != mutant_identity["root_mir_sha256"],
                        f"{root_id}: clean and hostile artifacts not distinct")
                exact_mirror(implementation, mirror_after_mutation, root_id)
            result = {
                "normal_feature_same_build_mir_and_binary": True,
                "clean_allow": True,
                "callback_mutant_denied": True,
                "source_bytes_preserved": True,
                "manifest": manifest,
                "manifest_sha256": before[manifest],
                "root_source": root_source,
                "clean_root_source_sha256": before[root_source],
                "mutant_root_source_sha256": mutant_source_sha256,
                "clean": {**clean_identity, **clean},
                "callback_mutant": {**mutant_identity, **mutant,
                                    "v32_rejection": rejection["reason"]},
            }
    finally:
        after_files = v29.selected_files(manifests)
        require(after_files == files and v29.snapshot(after_files) == before,
                f"{root_id}: original selected source/Cargo/SQL path or byte drift")
    return result


def evaluate() -> dict:
    inventory, predecessor_sha = v29.v7.current_inventory()
    roots = {root: evaluate_root(root, inventory) for root in ROOTS}
    return {
        "schema_version": "auth-foundation.v4b-normal-bridge-reachability/v36-candidate",
        "status": "indeterminate",
        "predecessor_sha256": predecessor_sha,
        "roots": roots,
        "candidate_promotions": [
            {"root": root, "entrypoint": "admission-service-with-ready",
             "state": "reachable", "witness": "normal-same-build-allow-handoff"}
            for root in ROOTS
        ],
        "endpoint_set_closed": False,
        "all_path_ready_dominance": False,
        "runtime_guarantees_observed": False,
        "claim_limit": "Existential admission-service reachability in three normal bridge builds for finite valid inputs; no API, all-path DENY no-call, or endpoint/effect closure claim.",
    }


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)},
                         sort_keys=True), file=sys.stderr)
        raise SystemExit(1)
