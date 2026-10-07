#!/usr/bin/env python3
"""Instrumented root-context MIR census for the four selected Auth entry roots.

Cargo builds each root with its own resolved dependency graph and --emit=mir,link.
This is compiler evidence, not an unmodified artifact or all-path proof.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import re
import shlex
import subprocess
import sys
import tempfile
from pathlib import Path

CASE = Path(__file__).resolve().parent
ROOT = CASE.parents[3]
IMPL = ROOT / "auth-foundation/implementation"
TOOLCHAIN = ROOT / "tools/toolchain/run"
PREDECESSOR = CASE / "auth-v4b-native-endpoint-inventory-v2.mjs"
V6 = CASE / "auth-v4b-selected-closure-census-v6.py"
SPEC = importlib.util.spec_from_file_location("auth_v4b_selected_closure_census_v6", V6)
assert SPEC and SPEC.loader
v6 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v6)
HEX = re.compile(r"^[a-f0-9]{64}$")
ALLOWED_EXTERNAL_DATA = {
    IMPL / "authorization-schema/migrations/0001_auth_state.sql",
    IMPL / "authorization-schema/migrations/0001_trusted_inputs.sql",
    IMPL / "authorization-schema/migrations/0002_auth_service_epoch.sql",
}
DOWNSTREAM_SELECTED = {"ready-decision", "generated-policy"}
DOWNSTREAM_EXCLUDED = {
    "sqlite-service", "sqlite-transaction", "sqlite-snapshot",
    "runtime-adapter", "runtime-resolved", "legacy-service-facade",
    "legacy-boundary-trait", "legacy-boundary-wrapper",
    "v2-boundary-trait", "v2-boundary-wrapper",
    "pre-resolved-borrowed-dispatch", "pre-resolved-wrapper",
}
NOT_DOWNSTREAM = {
    "lower-ready-authority", "command-boundary-gate",
    "admission-service-with-ready", "api-runtime-authorize",
    "api-http-authorize", "tenant-bridge-evaluate",
    "prototype-bridge-evaluate", "https-bridge-evaluate",
}


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def external_data_snapshot() -> dict[str, str]:
    snapshot = {}
    for path in sorted(ALLOWED_EXTERNAL_DATA):
        require(path.is_file() and not path.is_symlink() and
                all(not parent.is_symlink() for parent in path.parents if
                    parent == IMPL or parent.is_relative_to(IMPL)),
                f"approved SQL data missing or symlinked: {path}")
        snapshot[str(path.relative_to(IMPL))] = sha(path.read_bytes())
    return snapshot


def current_inventory() -> tuple[dict, str]:
    run = subprocess.run(["node", str(PREDECESSOR)], cwd=ROOT, capture_output=True,
                         text=True, timeout=240, check=False)
    require(run.returncode == 0, f"endpoint inventory failed: {run.stderr[-1200:]}")
    result = json.loads(run.stdout)
    require(result.get("status") == "indeterminate" and
            result.get("endpoint_set_closed") is False and
            result.get("runtime_guarantees_observed") is False,
            "endpoint predecessor claim changed")
    return result, sha(PREDECESSOR.read_bytes())


def root_metadata(root_id: str, relative_manifest: str) -> tuple[dict, str]:
    command = [str(TOOLCHAIN), "cargo", "metadata", "--offline", "--locked",
               "--format-version", "1", "--manifest-path", str(IMPL / relative_manifest)]
    run = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                         timeout=90, check=False)
    require(run.returncode == 0, f"{root_id}: Cargo metadata failed: {run.stderr[-1200:]}")
    return json.loads(run.stdout), sha(run.stdout.encode())


def expected_local_artifacts(metadata: dict, manifests: list[str]) -> dict[str, dict]:
    packages = {Path(row["manifest_path"]).resolve(): row for row in metadata["packages"]}
    nodes = {row["id"]: row for row in metadata["resolve"]["nodes"]}
    expected = {}
    for relative in manifests:
        manifest = (IMPL / relative).resolve()
        require(manifest in packages, f"selected package absent from Cargo metadata: {relative}")
        package = packages[manifest]
        target_arg, crate = v6.target_for(manifest)
        kind = "lib" if target_arg == "--lib" else "bin"
        matching = [row for row in package["targets"] if kind in row["kind"] and
                    row["name"].replace("-", "_") == crate]
        require(len(matching) == 1 and package["id"] in nodes,
                f"selected target ambiguous in Cargo metadata: {relative}")
        expected[relative] = {"package_id": package["id"],
                              "target_name": matching[0]["name"],
                              "target_kind": matching[0]["kind"],
                              "target_source": str(Path(matching[0]["src_path"]).resolve()),
                              "features": sorted(nodes[package["id"]]["features"]),
                              "crate": crate, "kind": kind}
    return expected


def policy_direct_dependency_boundary(root_id: str, metadata: dict,
                                      expected: dict[str, dict]) -> dict:
    """Bind the sole direct normal policy dependency to current Cargo IDs.

    Cargo package membership alone permits another selected crate to acquire
    the raw generated-policy capability without calling it in sampled MIR.
    This checks declared normal edges, not function reachability or effects.
    """
    packages = metadata.get("packages")
    resolved = metadata.get("resolve")
    require(isinstance(packages, list) and isinstance(resolved, dict),
            f"{root_id}: Cargo dependency graph missing")
    nodes = resolved.get("nodes")
    require(isinstance(nodes, list) and isinstance(resolved.get("root"), str),
            f"{root_id}: Cargo resolution missing")
    by_id = {row.get("id"): row for row in packages if isinstance(row, dict)}
    by_node = {row.get("id"): row for row in nodes if isinstance(row, dict)}
    require(len(by_id) == len(packages) and len(by_node) == len(nodes) and
            None not in by_id and None not in by_node and
            resolved["root"] in by_node,
            f"{root_id}: Cargo package or node identity ambiguous")
    pending = [resolved["root"]]
    seen: set[str] = set()
    normal_edges: dict[str, set[str]] = {}
    while pending:
        package_id = pending.pop()
        if package_id in seen:
            continue
        require(package_id in by_id and package_id in by_node,
                f"{root_id}: normal dependency target missing")
        seen.add(package_id)
        dependencies = by_node[package_id].get("deps")
        require(isinstance(dependencies, list),
                f"{root_id}: Cargo dependency rows missing")
        targets: set[str] = set()
        for dependency in dependencies:
            require(isinstance(dependency, dict) and
                    isinstance(dependency.get("pkg"), str) and
                    isinstance(dependency.get("dep_kinds"), list) and
                    dependency["dep_kinds"] and
                    all(isinstance(kind, dict) and "kind" in kind and
                        kind.get("kind") in (None, "normal", "dev", "build")
                        for kind in dependency["dep_kinds"]),
                    f"{root_id}: Cargo dependency kind ambiguous")
            target = dependency["pkg"]
            require(target in by_id and target in by_node,
                    f"{root_id}: Cargo dependency package ID missing")
            if any(kind["kind"] in (None, "normal")
                   for kind in dependency["dep_kinds"]):
                targets.add(target)
        normal_edges[package_id] = targets
        pending.extend(targets - seen)

    local: dict[str, str] = {}
    for package_id in seen:
        manifest = Path(by_id[package_id]["manifest_path"]).resolve()
        if manifest.is_relative_to(IMPL):
            relative = str(manifest.relative_to(IMPL))
            require(relative not in local,
                    f"{root_id}: duplicate local manifest package ID")
            local[relative] = package_id
    require(set(local) == set(expected) and
            all(local[manifest] == identity["package_id"]
                for manifest, identity in expected.items()),
            f"{root_id}: current normal local Cargo closure drift")
    policy_id = expected[v6.POLICY_MANIFEST]["package_id"]
    allowed_id = expected[v6.ALLOWED_CALLER]["package_id"]
    incoming = {source for source, targets in normal_edges.items()
                if policy_id in targets}
    require(incoming == {allowed_id},
            f"{root_id}: generated policy direct normal dependency escaped READY decision")
    return {"normal_local_manifest_count": len(local),
            "normal_reachable_package_count": len(seen),
            "generated_policy_direct_normal_predecessor": v6.ALLOWED_CALLER,
            "claim_limit": "Current resolved all-target Cargo normal edges grant direct generated-policy capability only to the READY decision crate; this does not prove active-host call/effect reachability or READY dominance."}


def decision_capability_boundary(root_id: str, inventory: dict,
                                 expected: dict[str, dict]) -> dict:
    """Check the known native decision family against the resolved root graph.

    This is package capability isolation, not function-level reachability or
    a claim that the source-derived known family is exhaustive.
    """
    rows = inventory.get("known_entrypoints")
    require(isinstance(rows, list), "known native endpoint rows absent")
    by_id = {row.get("id"): row for row in rows if isinstance(row, dict)}
    classified = DOWNSTREAM_SELECTED | DOWNSTREAM_EXCLUDED | NOT_DOWNSTREAM
    require(len(by_id) == len(rows) and set(by_id) == classified,
            "native endpoint classification changed")
    excluded = set()
    selected = set()
    for endpoint_id, row in by_id.items():
        manifest = row.get("package_manifest")
        membership = row.get("selected_root_cargo_membership")
        require(isinstance(manifest, str) and isinstance(membership, list) and
                all(isinstance(item, str) for item in membership) and
                len(membership) == len(set(membership)) and
                set(membership) <= set(v6.ROOT_MANIFESTS) and
                (root_id in membership) == (manifest in expected),
                f"{root_id}: endpoint Cargo membership disagrees with compiled root: {endpoint_id}")
        if endpoint_id in DOWNSTREAM_EXCLUDED:
            require(manifest not in expected,
                    f"{root_id}: raw native decision capability entered selected root: {endpoint_id}")
            excluded.add(manifest)
        elif endpoint_id in DOWNSTREAM_SELECTED:
            require(manifest in expected,
                    f"{root_id}: selected READY decision capability absent: {endpoint_id}")
            selected.add(endpoint_id)
    require(selected == DOWNSTREAM_SELECTED and excluded,
            f"{root_id}: incomplete native decision capability partition")
    return {"selected_downstream_entrypoint_ids": sorted(selected),
            "excluded_raw_decision_manifests": sorted(excluded),
            "known_entrypoint_count": len(rows),
            "claim_limit": "Known raw native decision packages are absent from this root's resolved local Cargo graph; this is not function/effect reachability closure."}


def artifact_rows(stdout: str) -> list[dict]:
    result = []
    for line in stdout.splitlines():
        try:
            row = json.loads(line)
        except json.JSONDecodeError as error:
            raise ValueError(f"Cargo emitted non-JSON build row: {line[:180]}") from error
        if row.get("reason") == "compiler-artifact":
            result.append(row)
    require(result, "Cargo emitted no compiler artifacts")
    return result


def compiled_source_dependencies(dep_path: Path, target_source: Path,
                                 package_root: Path, target_dir: Path) -> dict:
    """Bind compiler dep-info to the package that emitted the paired MIR.

    Cargo's package graph alone misses Rust source brought into a crate through
    include! or #[path]. Data dependencies (for example SQL include_str!) are
    recorded but are not treated as executable Rust source.
    """
    require(dep_path.is_file() and not dep_path.is_symlink() and
            dep_path.is_relative_to(target_dir), "compiler dep-info missing or outside target")
    raw = dep_path.read_bytes()
    lines = raw.decode().splitlines()
    require(lines, "empty compiler dep-info")
    first, position = "", 0
    while position < len(lines):
        line = lines[position]
        first += line[:-1] + " " if line.endswith("\\") else line
        position += 1
        if not line.endswith("\\"):
            break
    target, separator, sources = first.partition(":")
    require(separator and Path(target).resolve() == dep_path.resolve(),
            "compiler dep-info target does not match emitted artifact")
    try:
        paths = shlex.split(sources)
    except ValueError as error:
        raise ValueError("malformed compiler dep-info dependency syntax") from error
    require(paths, "compiler dep-info has no dependencies")
    lexical = [Path(os.path.abspath(path if Path(path).is_absolute() else
                                    package_root / path)) for path in paths]
    resolved = [path.resolve() for path in lexical]
    require(len(resolved) == len(set(resolved)) and target_source.resolve() in resolved,
            "compiler dep-info missing or duplicated target source")
    rust_sources = [path for path in resolved if path.suffix == ".rs"]
    escaped = [(written, actual) for written, actual in zip(lexical, resolved) if
               not actual.is_relative_to(package_root.resolve())]
    unclassified = [written for written, _ in escaped if written not in ALLOWED_EXTERNAL_DATA]
    require(not unclassified,
            "unclassified cross-package compiler dependency: " +
            ", ".join(str(path) for path in unclassified[:5]))
    require(all(written == actual and written.is_file() and not written.is_symlink()
                for written, actual in escaped),
            "external compiler data dependency missing or symlinked")
    return {"dep_info_sha256": sha(raw), "rust_source_count": len(rust_sources),
            "data_dependency_count": len(resolved) - len(rust_sources),
            "approved_external_data_dependencies":
                sorted(str(written.relative_to(IMPL)) for written, _ in escaped),
            "unclassified_external_dependency_count": 0}


def bind_artifacts(rows: list[dict], expected: dict[str, dict], target_dir: Path) -> tuple[dict[str, str], dict[str, dict]]:
    """Join Cargo package/target/feature identity to the exact emitted MIR."""
    mirrored, identities = {}, {}
    for row in rows:
        manifest = Path(row.get("manifest_path", "")).resolve()
        if not manifest.is_relative_to(IMPL):
            continue
        relative = str(manifest.relative_to(IMPL))
        require(relative in expected, f"unexpected local build artifact: {relative}")
        require(relative not in mirrored, f"duplicate local build artifact: {relative}")
        identity = expected[relative]
        target = row.get("target", {})
        require(row.get("package_id") == identity["package_id"] and
                target.get("name") == identity["target_name"] and
                target.get("kind") == identity["target_kind"] and
                str(Path(target.get("src_path", "")).resolve()) == identity["target_source"] and
                sorted(row.get("features", [])) == identity["features"],
                f"Cargo artifact identity/features changed: {relative}")
        filenames = row.get("filenames")
        require(isinstance(filenames, list) and filenames,
                f"Cargo artifact files absent: {relative}")
        if identity["kind"] == "lib":
            rlibs = [Path(path) for path in filenames if path.endswith(".rlib")]
            require(len(rlibs) == 1 and rlibs[0].name.startswith(f"lib{identity['crate']}"),
                    f"Cargo library artifact ambiguous: {relative}")
            if rlibs[0].name == f"lib{identity['crate']}.rlib":
                # Cargo's selected root library has an unhashed public rlib;
                # its compiler-emitted MIR remains hashed under debug/deps.
                candidates = sorted((target_dir / "debug/deps").glob(f"{identity['crate']}-*.mir"))
                require(len(candidates) == 1, f"Cargo root-library MIR ambiguous: {relative}")
                mir_path = candidates[0]
            else:
                mir_path = rlibs[0].with_name(rlibs[0].name[3:-5] + ".mir")
        else:
            candidates = sorted((target_dir / "debug/deps").glob(f"{identity['crate']}-*.mir"))
            require(len(candidates) == 1, f"Cargo binary MIR ambiguous: {relative}")
            mir_path = candidates[0]
        require(mir_path.is_file() and not mir_path.is_symlink() and
                mir_path.is_relative_to(target_dir),
                f"Cargo MIR missing or outside isolated target: {relative}")
        raw = mir_path.read_bytes()
        sources = compiled_source_dependencies(mir_path.with_suffix(".d"),
                                                Path(identity["target_source"]),
                                                manifest.parent, target_dir)
        mirrored[relative] = raw.decode()
        identities[relative] = {"package_id": identity["package_id"],
                                "target_name": identity["target_name"],
                                "target_kind": identity["target_kind"],
                                "features": identity["features"],
                                "mir_sha256": sha(raw), **sources}
    require(set(mirrored) == set(expected),
            f"Cargo local MIR coverage mismatch: missing={sorted(set(expected) - set(mirrored))}")
    return mirrored, identities


def cargo_llvm_output_path(row: dict, target_dir: Path) -> Path | None:
    """Derive an LLVM sidecar only from one unambiguous Cargo artifact row."""
    target = row.get("target", {})
    crate = target.get("name", "").replace("-", "_")
    filenames = row.get("filenames")
    require(crate and isinstance(filenames, list) and filenames,
            "Cargo LLVM artifact row lacks target/files")
    candidates = set()
    for filename in filenames:
        artifact = Path(filename)
        require(artifact.is_relative_to(target_dir), "Cargo LLVM artifact escaped target dir")
        if "custom-build" in target.get("kind", []):
            match = re.search(r"-([a-f0-9]{8,32})$", artifact.parent.name)
            require(match is not None and artifact.name.replace("-", "_") == crate,
                    "Cargo build-script LLVM artifact identity ambiguous")
            candidates.add(artifact.parent / f"{crate}-{match.group(1)}.ll")
        else:
            stem = artifact.name
            if artifact.suffix in {".rlib", ".rmeta", ".so", ".dylib"}:
                stem = artifact.stem.removeprefix("lib")
            if re.fullmatch(re.escape(crate) + r"-[a-f0-9]{8,32}", stem):
                candidates.add(artifact.parent / f"{stem}.ll")
    require(len(candidates) <= 1, "Cargo row maps to multiple LLVM outputs")
    return next(iter(candidates), None)


def bind_llvm_sidecars(rows: list[dict], expected: dict[str, dict], target_dir: Path,
                       identities: dict[str, dict]) -> tuple[dict[str, str], dict[str, dict]]:
    """Bind one opt-in LLVM module to each already-bound local MIR artifact.

    One codegen unit is requested separately. Its output shape is observed here,
    not inferred from that request. Default MIR capture never calls this helper.
    """
    require(set(expected) == set(identities), "LLVM sidecar identity coverage changed")
    deps = target_dir / "debug/deps"
    llvm, augmented = {}, {key: dict(value) for key, value in identities.items()}
    expected_paths = set()
    selected_paths = {}
    for manifest, identity in expected.items():
        crate = identity["crate"]
        candidates = sorted(deps.glob(f"{crate}-*.mir"))
        matching = [path for path in candidates if path.is_file() and not path.is_symlink() and
                    sha(path.read_bytes()) == identities[manifest]["mir_sha256"]]
        require(len(matching) == 1, f"LLVM paired MIR ambiguous: {manifest}")
        llvm_path = matching[0].with_suffix(".ll")
        require(llvm_path.is_file() and not llvm_path.is_symlink() and
                llvm_path.is_relative_to(target_dir),
                f"LLVM sidecar missing or escaped: {manifest}")
        raw = llvm_path.read_bytes()
        llvm[manifest] = raw.decode()
        augmented[manifest]["llvm_sha256"] = sha(raw)
        augmented[manifest]["llvm_artifact_name"] = llvm_path.name
        expected_paths.add(llvm_path)
        selected_paths[manifest] = llvm_path
    known = {}
    for index, row in enumerate(rows):
        path = cargo_llvm_output_path(row, target_dir)
        if path is not None:
            known.setdefault(path, set()).add(index)
    # Cargo's selected binary row may name only an unhashed debug executable.
    # Its hashed LLVM filename is bound through the already-checked MIR pair,
    # then joined to the exact package/manifest artifact row.
    for manifest, identity in expected.items():
        matching_rows = [index for index, row in enumerate(rows)
                         if row.get("package_id") == identity["package_id"] and
                         Path(row.get("manifest_path", "")).resolve() ==
                         (IMPL / manifest).resolve()]
        require(len(matching_rows) == 1,
                f"selected-local LLVM Cargo row ambiguous: {manifest}")
        known.setdefault(selected_paths[manifest], set()).add(matching_rows[0])
    observed = set(target_dir.rglob("*.ll"))
    require(expected_paths <= observed, "missing selected-local LLVM sidecar")
    invalid = [(path, len(known.get(path, set()))) for path in sorted(observed)
               if not path.is_file() or path.is_symlink() or
               len(known.get(path, set())) != 1]
    require(not invalid, f"unattributed, ambiguous, or invalid LLVM output: {invalid[:4]}")
    for manifest, identity in expected.items():
        path = selected_paths[manifest]
        index = next(iter(known[path]))
        require(rows[index].get("package_id") == identity["package_id"] and
                Path(rows[index].get("manifest_path", "")).resolve() ==
                (IMPL / manifest).resolve(),
                f"selected-local LLVM output attributed to wrong Cargo row: {manifest}")
    return llvm, augmented


def capture_root(root_id: str, relative_manifest: str, manifests: list[str],
                 target_dir: Path, inventory: dict, mir_inspector=None,
                 llvm_inspector=None) -> dict:
    metadata, metadata_hash = root_metadata(root_id, relative_manifest)
    expected = expected_local_artifacts(metadata, manifests)
    policy_dependency_boundary = policy_direct_dependency_boundary(root_id, metadata, expected)
    capability_boundary = decision_capability_boundary(root_id, inventory, expected)
    lock = IMPL / relative_manifest.replace("Cargo.toml", "Cargo.lock")
    require(lock.is_file() and not lock.is_symlink(), f"{root_id}: root Cargo lock missing")
    lock_hash = sha(lock.read_bytes())
    root_target = expected[relative_manifest]
    target_arg = "--lib" if root_target["kind"] == "lib" else f"--bin={root_target['target_name']}"
    env = dict(os.environ)
    forbidden = ("RUSTFLAGS", "CARGO_ENCODED_RUSTFLAGS", "CARGO_BUILD_RUSTFLAGS",
                 "CARGO_BUILD_TARGET", "CARGO_PROFILE_DEV_BUILD_OVERRIDE_DEBUG",
                 "RUSTC_WRAPPER", "RUSTC_WORKSPACE_WRAPPER", "CARGO_TARGET_DIR")
    require(not [name for name in forbidden if env.get(name)],
            "ambient compiler/build override present")
    env["RUSTFLAGS"] = ("--emit=mir,llvm-ir,link -Ccodegen-units=1" if
                        llvm_inspector is not None else "--emit=mir,link")
    if llvm_inspector is not None:
        env["CARGO_INCREMENTAL"] = "0"
    command = [str(TOOLCHAIN), "cargo", "build", "--offline", "--locked",
               "--message-format=json-render-diagnostics", "--target-dir", str(target_dir),
               "--manifest-path", str(IMPL / relative_manifest), target_arg]
    run = subprocess.run(command, cwd=ROOT, env=env, capture_output=True, text=True,
                         timeout=900, check=False)
    require(run.returncode == 0, f"{root_id}: instrumented root build failed: {run.stderr[-1800:]}")
    rows = artifact_rows(run.stdout)
    mir, identities = bind_artifacts(rows, expected, target_dir)
    llvm = None
    if llvm_inspector is not None:
        llvm, identities = bind_llvm_sidecars(rows, expected, target_dir, identities)
    ingress = v6.compiled_policy_ingress(mir, v6.policy_callable_names(inventory))
    effects = v6.compiled_effect_edges(mir)
    inspected = mir_inspector(root_id, mir, identities) if mir_inspector is not None else None
    llvm_inspected = (llvm_inspector(root_id, mir, llvm, identities)
                      if llvm_inspector is not None else None)
    refreshed, refreshed_hash = root_metadata(root_id, relative_manifest)
    require(refreshed_hash == metadata_hash and refreshed == metadata and
            sha(lock.read_bytes()) == lock_hash,
            f"{root_id}: Cargo graph or lock drift during MIR capture")
    result = {"local_package_count": len(mir), "metadata_sha256": metadata_hash,
            "lock_sha256": lock_hash, "artifacts": identities,
            "generated_policy_dependency_boundary": policy_dependency_boundary,
            "decision_capability_boundary": capability_boundary,
            "generated_policy_ingress": ingress, "effect_terminators": effects["terminator_count"],
            "unresolved_effect_terminators": effects["unresolved_count"],
            "effect_class_counts": effects["class_counts"],
            "effect_edges_sha256": effects["edges_sha256"]}
    if mir_inspector is not None:
        result["selected_graph_inspection"] = inspected
    if llvm_inspector is not None:
        result["llvm_direct_symbol_inspection"] = llvm_inspected
    return result


def evaluate(mir_inspector=None, llvm_inspector=None) -> dict:
    data_snapshot = external_data_snapshot()
    before, predecessor_hash = current_inventory()
    closures = before["selected_root_package_manifests"]
    require(set(closures) == set(v6.ROOT_MANIFESTS), "selected public root set changed")
    version = subprocess.run([str(TOOLCHAIN), "rustc", "-Vv"], cwd=ROOT,
                             capture_output=True, text=True, timeout=30, check=False)
    require(version.returncode == 0, "rustc version unavailable")
    results = {}
    with tempfile.TemporaryDirectory(prefix="auth-v4b-root-context-mir-v7-") as temporary:
        for root_id, manifest in v6.ROOT_MANIFESTS.items():
            manifests = sorted(closures[root_id])
            require(manifest in manifests and v6.ALLOWED_CALLER in manifests,
                    f"{root_id}: selected READY chain absent")
            results[root_id] = capture_root(root_id, manifest, manifests,
                                            Path(temporary) / root_id, before,
                                            mir_inspector=mir_inspector,
                                            llvm_inspector=llvm_inspector)
    after, refreshed_hash = current_inventory()
    require(after == before and refreshed_hash == predecessor_hash,
            "endpoint source/Cargo graph drift during root-context MIR capture")
    require(external_data_snapshot() == data_snapshot,
            "approved SQL data changed during root-context MIR capture")
    return {"schema_version": "auth-foundation.v4b-root-context-census/v7-candidate",
            "status": "indeterminate", "root_context_builds": results,
            "instrumentation": ("RUSTFLAGS=--emit=mir,llvm-ir,link -Ccodegen-units=1" if
                                llvm_inspector is not None else "RUSTFLAGS=--emit=mir,link"),
            **({"incremental_mode": "CARGO_INCREMENTAL=0"} if
               llvm_inspector is not None else {}),
            "rustc_version_sha256": sha(version.stdout.encode()),
            "predecessor_sha256": predecessor_hash,
            "source_set_sha256": before["source_set_sha256"],
            "approved_external_data_sha256": data_snapshot,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "open_effects": ["indirect/trait/callback/Drop/SQL/FFI/unwind target resolution",
                             "new decision bodies in selected packages and compiler/macro semantic closure",
                             "all selected-root to decision endpoint paths and same-invocation READY dominance",
                             "external and runtime observation evidence"],
            "claim_limit": "Four isolated instrumented root-context Cargo builds bind local MIR and compiler dep-info to package IDs, targets, features, compiler, source, and lock state. The resolved all-target normal Cargo graph gives direct generated-policy capability only to the READY decision crate. Out-of-package compiler dependencies outside an exact SQL-data allowlist fail closed; macro-use semantics remain open. This does not prove complete decision-body discovery, active-host or whole-program effect closure, all-path READY dominance, or runtime guarantees."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
