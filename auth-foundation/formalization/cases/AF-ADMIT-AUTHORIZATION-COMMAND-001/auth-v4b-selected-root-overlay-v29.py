#!/usr/bin/env python3
"""Isolated real-root compiled hostile controls for the unselected V28 census.

Only selected Cargo package inputs and three SQL include_str inputs are
mirrored. The original checkout is read-only. A clean mirror must pass before
the same root is mutated; the mutant must compile, carry the intended MIR
change, and fail at the named candidate verifier. These are detection controls,
not runtime DENY/no-call proof or a selected evidence binding.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import re
import shutil
import sys
import tempfile
import tomllib
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import patch

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_capability_for_v29", CASE / "auth-v4b-native-capability-cut-v28.py")
assert SPEC and SPEC.loader
v28 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v28)
v7, v6 = v28.v7, v28.v6
ORIGINAL_IMPL = v7.IMPL
SQL = (
    "authorization-schema/migrations/0001_auth_state.sql",
    "authorization-schema/migrations/0001_trusted_inputs.sql",
    "authorization-schema/migrations/0002_auth_service_epoch.sql",
)
SKIP_DIRS = {"target", ".git", "__pycache__", "node_modules"}
ROOT_SOURCE = {
    "api": "authorization-api/src/lib.rs",
    "tenant": "tenant-bridge/src/main.rs",
    "prototype": "authentication-prototype/bridge/src/main.rs",
    "https": "authentication-https/bridge/src/main.rs",
}
HANDOFF = {
    "api": "engine.with_ready(request, authorize_ready_decision)",
    "tenant": "service.with_ready(request, authorize_ready_decision)",
    "prototype": "service.with_ready(request, authorize_ready_decision)",
    "https": "service.with_ready(request, authorize_ready_decision)",
}
VARIANTS = {"extra-reference", "replace-callback"}


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def local_manifest(path: Path) -> Path:
    """Reject lexical symlink hops before normalizing a local Cargo path."""
    lexical = Path(os.path.abspath(path))
    require(lexical.is_relative_to(ORIGINAL_IMPL) and
            lexical.is_file() and not lexical.is_symlink(),
            f"local manifest escaped, missing, or symlinked: {lexical}")
    parent = lexical.parent
    while parent.is_relative_to(ORIGINAL_IMPL):
        require(not parent.is_symlink(), f"local manifest parent symlink: {parent}")
        if parent == ORIGINAL_IMPL:
            break
        parent = parent.parent
    require(lexical.resolve() == lexical, f"local manifest path changed: {lexical}")
    return lexical


def local_dependencies(manifest: Path) -> set[Path]:
    data = tomllib.loads(manifest.read_text())
    tables = [data.get(key, {}) for key in
              ("dependencies", "dev-dependencies", "build-dependencies")]
    for target in data.get("target", {}).values():
        tables.extend(target.get(key, {}) for key in
                      ("dependencies", "dev-dependencies", "build-dependencies"))
    paths = set()
    for table in tables:
        require(isinstance(table, dict), f"dependency table invalid: {manifest}")
        for dependency in table.values():
            if not isinstance(dependency, dict) or "path" not in dependency:
                continue
            relative = dependency["path"]
            require(isinstance(relative, str), f"dependency path invalid: {manifest}")
            paths.add(local_manifest(manifest.parent / relative / "Cargo.toml"))
    return paths


def package_manifests(root_id: str, metadata: dict) -> list[Path]:
    """Include all resolved local packages and optional path dependencies."""
    root = ORIGINAL_IMPL / v6.ROOT_MANIFESTS[root_id]
    found = {local_manifest(root)}
    for package in metadata["packages"]:
        manifest = Path(package["manifest_path"])
        if Path(os.path.abspath(manifest)).is_relative_to(ORIGINAL_IMPL):
            found.add(local_manifest(manifest))
    pending = list(found)
    while pending:
        for dependency in local_dependencies(pending.pop()):
            if dependency not in found:
                found.add(dependency)
                pending.append(dependency)
    return sorted(found)


def selected_files(manifests: list[Path]) -> list[Path]:
    """Bounded original-byte inventory; never walk target or follow symlinks."""
    paths = set()
    for manifest in manifests:
        package = manifest.parent
        require(package.is_relative_to(ORIGINAL_IMPL) and not package.is_symlink(),
                "source package escaped or is symlinked")
        for base, directories, files in os.walk(package, followlinks=False):
            directories[:] = [name for name in directories if name not in SKIP_DIRS]
            for name in [*directories, *files]:
                require(not (Path(base) / name).is_symlink(),
                        f"source package symlink: {Path(base) / name}")
            for name in files:
                path = Path(base) / name
                if path.parent == package and name in {"Cargo.toml", "Cargo.lock", "build.rs"}:
                    paths.add(path)
                elif path.is_relative_to(package / "src"):
                    paths.add(path)
    for relative in SQL:
        path = ORIGINAL_IMPL / relative
        require(path.is_file() and not path.is_symlink(), f"SQL input missing: {relative}")
        paths.add(path)
    return sorted(paths)


def snapshot(paths: list[Path]) -> dict[str, str]:
    require(all(path.is_file() and not path.is_symlink() for path in paths),
            "source inventory changed or became symlinked")
    return {str(path.relative_to(ORIGINAL_IMPL)): sha(path.read_bytes()) for path in paths}


def mirror(implementation: Path, manifests: list[Path], files: list[Path]) -> None:
    """Copy precisely inventoried files, retaining package-relative layout."""
    allowed = {path.relative_to(ORIGINAL_IMPL) for path in files}
    for path in files:
        destination = implementation / path.relative_to(ORIGINAL_IMPL)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, destination)
    require(all((implementation / path.relative_to(ORIGINAL_IMPL)).is_file()
                for path in manifests) and
            {path.relative_to(implementation) for path in implementation.rglob("*")
             if path.is_file()} == allowed,
            "mirror file coverage mismatch")


def mutate(root_id: str, variant: str, implementation: Path) -> str:
    require(variant in VARIANTS, "unknown hostile variant")
    path = implementation / ROOT_SOURCE[root_id]
    source = path.read_text()
    marker = HANDOFF[root_id]
    require(source.count(marker) == 1, f"{root_id}: selected handoff source changed")
    if variant == "extra-reference":
        # A typed function pointer forces reification in compiled MIR. The
        # black_box use prevents an unused binding from disappearing.
        mutation = ("{ let unexpected_callback: fn(_) -> _ = authorize_ready_decision; "
                    "std::hint::black_box(unexpected_callback); " + marker + " }")
    else:
        mutation = marker.replace("authorize_ready_decision",
                                  "|_ready| BinaryAuthorizationDecision::Deny")
    path.write_text(source.replace(marker, mutation, 1))
    return sha(path.read_bytes())


@contextmanager
def overlay_modules(implementation: Path):
    sql = {implementation / relative for relative in SQL}
    with patch.object(v7, "IMPL", implementation), \
         patch.object(v7, "ALLOWED_EXTERNAL_DATA", sql), \
         patch.object(v6, "IMPL", implementation):
        yield


def compiled_reference_count(mir: dict[str, str]) -> int:
    return sum(len(v28.READY_REFERENCE.findall(source)) for source in mir.values())


def run_case(root_id: str, variant: str, inventory: dict) -> dict:
    require(root_id in v6.ROOT_MANIFESTS, "unknown selected root")
    require(variant in VARIANTS, "unknown hostile variant")
    root_manifest = v6.ROOT_MANIFESTS[root_id]
    metadata, _ = v7.root_metadata(root_id, root_manifest)
    manifests = package_manifests(root_id, metadata)
    paths = selected_files(manifests)
    before = snapshot(paths)
    relative_manifests = sorted(inventory["selected_root_package_manifests"][root_id])
    require(set(relative_manifests) <= {str(path.relative_to(ORIGINAL_IMPL))
                                      for path in manifests},
            "selected compiled package missing from mirror plan")
    try:
        with tempfile.TemporaryDirectory(prefix=f"auth-v29-{root_id}-{variant}-") as temporary:
            directory = Path(temporary)
            implementation = directory / "implementation"
            mirror(implementation, manifests, paths)
            mirrored_bytes = {
                relative: sha((implementation / relative).read_bytes())
                for relative in before
            }
            require(mirrored_bytes == before,
                    f"{root_id}: clean mirror differs from pre-copy original bytes")
            with overlay_modules(implementation):
                baseline = v7.capture_root(root_id, root_manifest,
                                           relative_manifests, directory / "baseline-target",
                                           inventory, mir_inspector=v28.inspect)
                require(baseline["selected_graph_inspection"]["status"] == "indeterminate" and
                        baseline["selected_graph_inspection"]["endpoint_set_closed"] is False,
                        "clean mirror did not preserve candidate verdict")
                mutant_sha = mutate(root_id, variant, implementation)
                seen = {}

                def hostile_inspector(selected_root: str, mir: dict[str, str], identities: dict):
                    count = compiled_reference_count(mir)
                    seen["count"] = count
                    expected = 2 if variant == "extra-reference" else 0
                    require(count == expected,
                            f"{selected_root}: intended hostile MIR reference count absent: {count}")
                    return v28.inspect(selected_root, mir, identities)

                try:
                    v7.capture_root(root_id, root_manifest, relative_manifests,
                                    directory / "mutant-target", inventory,
                                    mir_inspector=hostile_inspector)
                except ValueError as error:
                    reason = str(error)
                    expected_reason = ("READY decision compiled reference count changed"
                                       if variant == "extra-reference" else
                                       "READY callback target count")
                    require("count" in seen and expected_reason in reason,
                            f"{root_id}:{variant}: wrong failure stage: {reason}")
                else:
                    raise ValueError(f"{root_id}:{variant}: hostile root passed candidate")
            return {"root_id": root_id, "variant": variant,
                    "clean_mirror_status": "indeterminate",
                    "mutant_compiled_reference_count": seen["count"],
                    "mutant_source_sha256": mutant_sha,
                    "candidate_rejected": True,
                    "claim_limit": "Isolated selected-root compiler mutant and exact candidate rejection only; not a DENY-path, whole-program, or runtime no-call witness."}
    finally:
        after_paths = selected_files(manifests)
        require(after_paths == paths and snapshot(after_paths) == before,
                f"{root_id}: original selected source/Cargo/lock/SQL path or byte drift")


def evaluate(roots: list[str], variants: list[str]) -> dict:
    inventory, predecessor_sha = v7.current_inventory()
    require(set(roots) <= set(v6.ROOT_MANIFESTS) and
            set(variants) <= VARIANTS and roots and variants,
            "invalid selected-root overlay request")
    cases = [run_case(root_id, variant, inventory)
             for root_id in roots for variant in variants]
    return {"schema_version": "auth-foundation.v4b-selected-root-overlay/v29-candidate",
            "status": "indeterminate", "predecessor_sha256": predecessor_sha,
            "cases": cases, "endpoint_set_closed": False,
            "all_path_ready_dominance": False, "runtime_guarantees_observed": False,
            "claim_limit": "Clean and hostile isolated selected-root Cargo/MIR builds with exact composed candidate rejection (V28 census for extra references; V9 handoff for callback replacement); no live request, gate-result DENY witness, all-native endpoint closure, or runtime guarantee."}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", choices=[*v6.ROOT_MANIFESTS, "all"], default="api")
    parser.add_argument("--variant", choices=[*sorted(VARIANTS), "all"],
                        default="extra-reference")
    args = parser.parse_args()
    roots = list(v6.ROOT_MANIFESTS) if args.root == "all" else [args.root]
    variants = sorted(VARIANTS) if args.variant == "all" else [args.variant]
    try:
        print(json.dumps(evaluate(roots, variants), sort_keys=True,
                         separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)},
                         sort_keys=True), file=sys.stderr)
        raise SystemExit(1)
