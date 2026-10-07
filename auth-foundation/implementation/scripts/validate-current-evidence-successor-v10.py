#!/usr/bin/env python3
"""Candidate local rustc dep-info input binding for the selected Auth matrix.

The matrix runner is candidate evidence until a binding is reviewed and selected.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import re
import shutil
import subprocess
import tempfile
import sys
from pathlib import Path


SCRIPT = Path(__file__).resolve()
IMPL = SCRIPT.parents[1]
AUTH = IMPL.parent
ROOT = AUTH.parent
TOOLCHAIN = ROOT / "tools/toolchain/run"
HEX = re.compile(r"[0-9a-f]{64}\Z")
ROOTS = (
    "authorization-api", "authorization-admission-service",
    "authorization-ready-authority", "authorization-ready-decision",
    "tenant-bridge", "authentication-prototype/bridge",
    "authentication-https/bridge",
)
ROOT_TEST_TARGETS = {
    "authorization-api": {("auth_foundation_authorization_api", "lib", False),
                          ("auth_foundation_authorization_api", "lib", True),
                          ("production_pool", "test", True),
                          ("timeout_after_response", "test", True)},
    "authorization-admission-service": {
        ("auth_foundation_authorization_admission_service", "lib", True)},
    "authorization-ready-authority": {
        ("auth_foundation_authorization_ready_authority", "lib", False),
        ("auth_foundation_authorization_ready_authority", "lib", True),
        ("authority", "test", True)},
    "authorization-ready-decision": {
        ("auth_foundation_authorization_ready_decision", "lib", False),
        ("auth_foundation_authorization_ready_decision", "lib", True),
        ("decision", "test", True)},
    "tenant-bridge": {("auth-tenant-bridge", "bin", True)},
    "authentication-prototype/bridge": {("auth-prototype-bridge", "bin", True)},
    "authentication-https/bridge": {("auth-prototype-bridge", "bin", True)},
}
ROOT_NORMAL_TARGET = {
    "authorization-api": ("auth_foundation_authorization_api", "lib"),
    "authorization-admission-service": ("auth_foundation_authorization_admission_service", "lib"),
    "authorization-ready-authority": ("auth_foundation_authorization_ready_authority", "lib"),
    "authorization-ready-decision": ("auth_foundation_authorization_ready_decision", "lib"),
    "tenant-bridge": ("auth-tenant-bridge", "bin"),
    "authentication-prototype/bridge": ("auth-prototype-bridge", "bin"),
    "authentication-https/bridge": ("auth-prototype-bridge", "bin"),
}
BINDING = IMPL / "current-evidence-successor-v10/binding.json"
V9 = SCRIPT.with_name("validate-current-evidence-successor-v9.py")
V9_BINDING = IMPL / "current-evidence-successor-v9/binding.json"
SUPPORT = (
    "implementation/scripts/validate-current-evidence-successor-v10.py",
    "implementation/scripts/test-current-evidence-successor-v10.py",
    "implementation/current-evidence-successor-v10/PLAN.md",
    "implementation/current-evidence-successor-v10/README.md",
)


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def regular(path: Path, root: Path) -> bytes:
    root = Path(os.path.abspath(root))
    path = Path(os.path.abspath(path))
    require(path.is_relative_to(root) and path.is_file(),
            f"input missing or outside permitted root: {path}")
    require(not any(parent.is_symlink() for parent in (path, *path.parents)
                    if parent == root or parent.is_relative_to(root)),
            f"symlinked input or parent: {path}")
    require(path.resolve().is_relative_to(root.resolve()),
            f"input escapes permitted root: {path}")
    return path.read_bytes()


def logical_lines(raw: bytes) -> list[str]:
    try:
        source = raw.decode("utf-8")
    except UnicodeDecodeError as error:
        raise ValueError("non-UTF8 compiler dep-info") from error
    require("\r" not in source and "\0" not in source,
            "unsupported compiler dep-info character")
    result, current = [], ""
    for physical in source.splitlines():
        require(not physical.startswith("#"), "unsupported dep-info comment or env input")
        trailing = len(physical) - len(physical.rstrip("\\"))
        if trailing % 2:
            current += physical[:-1] + " "
        else:
            current += physical
            if current.strip():
                result.append(current)
            current = ""
    require(not current and result, "unfinished or empty compiler dep-info")
    return result


def words(value: str) -> list[str]:
    result, token, escape = [], [], False
    for character in value:
        if escape:
            require(character in " \\#:$", "unsupported dep-info escape")
            token.append(character)
            escape = False
        elif character == "\\":
            escape = True
        elif character.isspace():
            if token:
                result.append("".join(token))
                token = []
        else:
            require(character not in "$#%*?", "unsupported Make dep-info token")
            token.append(character)
    require(not escape, "unfinished dep-info escape")
    if token:
        result.append("".join(token))
    return result


def split_rule(line: str) -> tuple[str, list[str]]:
    escape = False
    for offset, character in enumerate(line):
        if escape:
            escape = False
        elif character == "\\":
            escape = True
        elif character == ":":
            target = words(line[:offset])
            require(len(target) == 1, "ambiguous compiler dep-info target")
            return target[0], words(line[offset + 1:])
    raise ValueError("malformed compiler dep-info rule")


def normalized_dep(name: str, package_root: Path, source_root: Path) -> tuple[str, str]:
    written = Path(name) if Path(name).is_absolute() else package_root / name
    require(written.is_absolute(), "compiler package path must be absolute")
    # Inspect the written traversal before collapsing `..`: a symlink followed
    # by `..` can otherwise be hidden by lexical normalization.
    cursor = Path(written.anchor)
    for part in written.parts[1:]:
        if part == "..":
            cursor = cursor.parent
        elif part != ".":
            cursor /= part
            require(not cursor.is_symlink(), f"symlinked compiler input path: {written}")
    lexical = Path(os.path.abspath(written))
    raw = regular(lexical, source_root)
    return lexical.relative_to(source_root).as_posix(), sha(raw)


def parsed_dep_info(raw: bytes, dep_path: Path, artifact_path: Path,
                    package_root: Path, source_root: Path,
                    target_dir: Path) -> dict[str, str]:
    """Parse all rustc Make rules and return exact local file hashes."""
    require(raw == regular(dep_path, target_dir),
            "compiler dep-info bytes changed during capture")
    regular(artifact_path, target_dir)
    rules = [split_rule(line) for line in logical_lines(raw)]
    require(len(rules) >= 3, "compiler dep-info rules incomplete")
    require(len({target for target, _ in rules}) == len(rules),
            "duplicate compiler dep-info target")
    first, second = rules[:2]
    require(Path(first[0]) == dep_path and Path(second[0]) == artifact_path,
            "compiler dep-info artifact pairing changed")
    require(first[1] and first[1] == second[1] and
            len(set(first[1])) == len(first[1]),
            "compiler dep-info dependency rules disagree or duplicate input")
    prefix = 2
    if artifact_path.suffix == ".rlib":
        metadata = artifact_path.with_suffix(".rmeta")
        require(len(rules) > 2 and Path(rules[2][0]) == metadata and
                rules[2][1] == first[1], "compiler rmeta dependency rule differs")
        regular(metadata, target_dir)
        prefix = 3
    require(len(rules) == len(first[1]) + prefix and
            {target for target, deps in rules[prefix:] if not deps} == set(first[1]) and
            all(not deps for _, deps in rules[prefix:]),
            "compiler dep-info phony rules incomplete")
    deps = dict(normalized_dep(name, package_root, source_root)
                for name in first[1])
    require(len(deps) == len(first[1]),
            "compiler dep-info normalized dependency duplicated")
    return deps


def local_packages(metadata: dict, source_root: Path) -> dict[str, dict]:
    local = {}
    for package in metadata["packages"]:
        if package.get("source") is not None:
            continue
        manifest = Path(package["manifest_path"])
        require(manifest.is_relative_to(source_root) and
                manifest.name == "Cargo.toml" and manifest.is_file(),
                f"unreviewed local Cargo package outside selected implementation: {manifest}")
        require(package["id"] not in local, "duplicate local Cargo package ID")
        local[package["id"]] = package
    require(local, "Cargo metadata has no local packages")
    return local


def parse_cargo_rows(stdout: str, source_root: Path,
                     target_dir: Path, local: dict[str, dict] | None = None) -> list[dict]:
    """Read only current invocation rows; never scan a preexisting target tree."""
    rows = []
    for line in stdout.splitlines():
        try:
            row = json.loads(line)
        except json.JSONDecodeError as error:
            raise ValueError("Cargo emitted non-JSON build row") from error
        if row.get("reason") != "compiler-artifact":
            continue
        manifest = Path(row.get("manifest_path", ""))
        if local is not None and row.get("package_id") in local:
            require(manifest == Path(local[row["package_id"]]["manifest_path"]),
                    "local Cargo artifact manifest differs from metadata")
        elif local is not None:
            require(not manifest.is_relative_to(source_root),
                    "Cargo artifact under selected implementation absent from metadata")
        if not manifest.is_relative_to(source_root):
            continue
        require(row.get("fresh") is False,
                "cached local compiler artifact in isolated build")
        require(isinstance(row.get("filenames"), list) and row["filenames"] and
                all(Path(name).is_relative_to(target_dir) for name in row["filenames"]),
                "local Cargo artifact filenames absent or outside target")
        rows.append(row)
    require(rows, "Cargo emitted no selected local compiler artifacts")
    return rows


def cargo_metadata(root: str, features: tuple[str, ...]) -> dict:
    manifest = IMPL / root / "Cargo.toml"
    command = [str(TOOLCHAIN), "cargo", "metadata", "--locked", "--offline",
               "--format-version", "1", "--manifest-path", str(manifest)]
    if features:
        command += ["--features", ",".join(features)]
    process = subprocess.run(command, cwd=IMPL / root, text=True,
                             capture_output=True, timeout=120, check=False)
    require(process.returncode == 0,
            f"Cargo metadata failed for {root}: {process.stderr[-1000:]}")
    return json.loads(process.stdout)


def row_identity(row: dict, packages: dict[str, dict], nodes: dict[str, dict], root: str,
                 mode: str, features: tuple[str, ...]) -> dict:
    package = packages.get(row.get("package_id"))
    require(package is not None, "Cargo artifact package absent from metadata")
    require(row.get("manifest_path") == package["manifest_path"],
            "Cargo artifact manifest identity differs from metadata")
    node = nodes.get(row["package_id"])
    require(node is not None and
            sorted(row.get("features", [])) == sorted(node["features"]),
            "Cargo artifact feature identity differs from resolved metadata")
    targets = [target for target in package["targets"]
               if all(row.get("target", {}).get(key) == target[key]
                      for key in ("name", "kind", "src_path", "crate_types"))]
    require(len(targets) == 1, "Cargo artifact target identity differs from metadata")
    target = targets[0]
    kind = target["kind"][0]
    require(len(target["kind"]) == 1 and kind in ("lib", "bin", "test"),
            "unsupported local compiler target kind")
    profile_test = row.get("profile", {}).get("test")
    require(type(profile_test) is bool, "Cargo artifact test profile absent")
    package_root = Path(package["manifest_path"]).parent
    is_root = package_root == IMPL / root
    if is_root:
        if mode == "normal":
            require((target["name"], kind) == ROOT_NORMAL_TARGET[root] and
                    profile_test is False,
                    "normal root target/profile differs")
        else:
            require((target["name"], kind, profile_test) in ROOT_TEST_TARGETS[root],
                    "test root target/profile differs")
    else:
        require(kind == "lib" and profile_test is False,
                "unexpected local dependency target/profile")
    require(package_root.is_relative_to(IMPL), "Cargo package outside Auth implementation")
    return {"package": package_root.relative_to(IMPL).as_posix(),
            "package_id": row["package_id"], "target": target["name"],
            "kind": kind, "src": Path(target["src_path"]).relative_to(AUTH).as_posix(),
            "crate_types": target["crate_types"], "features": sorted(row.get("features", [])),
            "profile_test": profile_test, "is_root": is_root}


def paired_dep_info(row: dict, identity: dict, target_dir: Path) -> tuple[Path, Path]:
    files = [Path(name) for name in row["filenames"]]
    if identity["kind"] == "lib" and not identity["profile_test"]:
        metadata_files = [path for path in files if path.suffix == ".rmeta"]
        require(len(metadata_files) == 1 and metadata_files[0].parent.name == "deps",
                "hashed lib metadata artifact absent")
        hashed = metadata_files[0]
        require(re.fullmatch(r"lib[a-zA-Z0-9_]+-[0-9a-f]+", hashed.stem) is not None,
                "lib artifact hash/name ambiguous")
        artifact = hashed.with_suffix(".rlib")
        require(artifact in files or artifact.is_file(),
                "hashed lib artifact absent")
        return artifact.with_name(artifact.stem[3:] + ".d"), artifact
    require(len(files) == 1, "executable compiler artifact ambiguous")
    artifact = files[0]
    if identity["kind"] == "bin" and artifact.parent == target_dir / "debug":
        candidates = [path for path in (target_dir / "debug/deps").glob(
            artifact.name.replace("-", "_") + "-*")
            if path.is_file() and path.suffix == "" and path.stat().st_ino == artifact.stat().st_ino]
        require(len(candidates) == 1, "hashed bin compiler artifact ambiguous")
        artifact = candidates[0]
    require(artifact.parent == target_dir / "debug/deps" and
            re.search(r"-[0-9a-f]+$", artifact.name) is not None,
            "hashed executable compiler artifact absent")
    return artifact.with_suffix(".d"), artifact


def run_cell(root: str, mode: str, features: tuple[str, ...],
             reference: dict[str, str]) -> dict:
    metadata = cargo_metadata(root, features)
    packages = {package["id"]: package for package in metadata["packages"]}
    local = local_packages(metadata, IMPL)
    nodes = {node["id"]: node for node in metadata["resolve"]["nodes"]}
    base = Path("/dev/shm") if shutil.disk_usage("/dev/shm").free > 3_000_000_000 else None
    with tempfile.TemporaryDirectory(prefix="auth-v10-", dir=base) as temporary:
        target_dir = Path(temporary) / "target"
        target_dir.mkdir()
        command = [str(TOOLCHAIN), "cargo", "build" if mode == "normal" else "test",
                   "--locked", "--offline", "--message-format=json",
                   "--target-dir", str(target_dir)]
        if mode == "normal":
            if root in ("tenant-bridge", "authentication-prototype/bridge",
                        "authentication-https/bridge"):
                matching = [package for package in metadata["packages"]
                            if Path(package["manifest_path"]) == IMPL / root / "Cargo.toml"]
                require(len(matching) == 1, "Cargo metadata root package ambiguous")
                bins = [target for target in matching[0]["targets"]
                        if target["kind"] == ["bin"]]
                require(len(bins) == 1, "Cargo metadata root bin ambiguous")
                command += ["--bin", bins[0]["name"]]
            else:
                command += ["--lib"]
        else:
            command += ["--no-run", "--all-targets"]
        if features:
            command += ["--features", ",".join(features)]
        before = {name: sha(regular(AUTH / name, AUTH)) for name in reference}
        require(before == reference, "v9 source inventory changed before build")
        process = subprocess.run(command, cwd=IMPL / root, text=True,
                                 capture_output=True, timeout=900, check=False)
        require(process.returncode == 0,
                f"fresh Cargo cell failed {root}/{mode}/{features}: {process.stderr[-1500:]}")
        rows = parse_cargo_rows(process.stdout, IMPL, target_dir, local)
        artifacts, observed, root_seen = [], {}, set()
        identities = set()
        for row in rows:
            identity = row_identity(row, packages, nodes, root, mode, features)
            key = (identity["package_id"], identity["target"],
                   identity["kind"], identity["profile_test"])
            require(key not in identities, "duplicate local compiler artifact identity")
            identities.add(key)
            if identity["is_root"]:
                root_seen.add((identity["target"], identity["kind"],
                               identity["profile_test"]))
            dep_path, artifact_path = paired_dep_info(row, identity, target_dir)
            deps = parsed_dep_info(regular(dep_path, target_dir), dep_path,
                                   artifact_path, IMPL / identity["package"], AUTH,
                                   target_dir)
            for name, digest in deps.items():
                require(name in reference and reference[name] == digest,
                        f"unreviewed compiler file input {name}: {digest}")
                require(name not in observed or observed[name] == digest,
                        f"compiler input bytes differ across targets: {name}")
                observed[name] = digest
            artifacts.append({**identity, "input_count": len(deps),
                              "input_map_sha256": sha(json.dumps(
                                  dict(sorted(deps.items())), sort_keys=True,
                                  separators=(",", ":")).encode())})
        if mode == "test":
            require(root_seen == ROOT_TEST_TARGETS[root],
                    f"root test target set changed: {root}: {sorted(root_seen)}")
        else:
            require(len(root_seen) == 1, "normal root compiler target count changed")
        after = {name: sha(regular(AUTH / name, AUTH)) for name in reference}
        require(after == before, "v9 source inventory changed during build")
        return {"root": root, "mode": mode, "features": list(features),
                "artifacts": sorted(artifacts, key=lambda item: (
                    item["package"], item["target"], item["profile_test"])),
                "observed_inputs_sha256": dict(sorted(observed.items()))}


def load_v9():
    spec = importlib.util.spec_from_file_location("auth_technical_v9", V9)
    require(spec is not None and spec.loader is not None, "v9 verifier missing")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def reference_inventory(v9) -> dict[str, str]:
    v7 = v9.load_v8().load_v7()
    base = v7.source_inventory({root: v7.closure(root) for root in v7.ROOTS})
    expanded = v9.expanded_inventory(v7, base)
    require(len(expanded) == 86, "v9 expanded source count changed")
    return expanded


def toolchain_identity() -> dict[str, str]:
    result = {}
    for tool, args in (("cargo", ["--version"]), ("rustc", ["--version", "--verbose"])):
        process = subprocess.run([str(TOOLCHAIN), tool, *args], text=True,
                                 capture_output=True, timeout=30, check=False)
        require(process.returncode == 0, f"{tool} identity unavailable")
        result[tool] = process.stdout.strip()
    return result


def build_inputs() -> dict[str, str]:
    paths = [TOOLCHAIN]
    local_config = set()
    for root in ROOTS:
        metadata = cargo_metadata(root, ("trace",) if root == "authorization-api" else ())
        local_packages(metadata, IMPL)
        for package in metadata["packages"]:
            manifest = Path(package["manifest_path"])
            if manifest.is_relative_to(AUTH):
                paths.append(manifest)
                lock = manifest.parent / "Cargo.lock"
                if lock.is_file():
                    paths.append(lock)
        parent = IMPL / root
        while parent.is_relative_to(ROOT):
            for name in ("rust-toolchain", "rust-toolchain.toml",
                         ".cargo/config", ".cargo/config.toml"):
                local_config.add(parent / name)
            if parent == ROOT:
                break
            parent = parent.parent
    absent = {}
    for candidate in sorted(local_config):
        require(not candidate.is_symlink(), f"symlinked local Cargo config: {candidate}")
        if candidate.is_file():
            paths.append(candidate)
        else:
            require(not candidate.exists(), f"non-file local Cargo config: {candidate}")
            absent[candidate.relative_to(ROOT).as_posix()] = "absent"
    return {**absent, **{path.relative_to(ROOT).as_posix(): sha(regular(path, ROOT))
                       for path in sorted(set(paths))}}


def expected_binding() -> dict:
    v9 = load_v9()
    v9.validate()
    reference = reference_inventory(v9)
    support_before = {name: sha(regular(AUTH / name, AUTH)) for name in SUPPORT}
    build_before = build_inputs()
    predecessor = regular(V9_BINDING, AUTH)
    tools_before = toolchain_identity()
    cells = []
    for root in ROOTS:
        cells.append(run_cell(root, "normal", (), reference))
    for root in ROOTS:
        cells.append(run_cell(root, "test", (), reference))
    cells.append(run_cell("authorization-api", "test", ("trace",), reference))
    require(len(cells) == 15, "compiler matrix cell count changed")
    observed = {}
    for cell in cells:
        for name, digest in cell["observed_inputs_sha256"].items():
            require(name not in observed or observed[name] == digest,
                    f"compiler input differs across cells: {name}")
            observed[name] = digest
    require(observed and set(observed).issubset(reference),
            "observed compiler inputs exceed v9 reviewed set")
    require(build_inputs() == build_before and
            {name: sha(regular(AUTH / name, AUTH)) for name in SUPPORT} == support_before and
            regular(V9_BINDING, AUTH) == predecessor and
            toolchain_identity() == tools_before,
            "compiler matrix support or toolchain changed during replay")
    return {
        "schema_version": "auth-foundation.current-technical-evidence-successor/v10-candidate",
        "binding_id": "AUTH-CURRENT-TECHNICAL-EVIDENCE-010",
        "predecessor_v9_sha256": sha(predecessor),
        "toolchain_identity": tools_before,
        "build_inputs_sha256": build_before,
        "support_inputs_sha256": support_before,
        "reviewed_v9_source_count": len(reference),
        "observed_local_rustc_input_count": len(observed),
        "observed_local_rustc_inputs_sha256": dict(sorted(observed.items())),
        "matrix": cells,
        "status": "enumerated-local-rustc-dep-info-v10-candidate-pass",
        "authority_effect": "none",
        "runtime_guarantees_observed": False,
        "claim_limit": "Only post-build hashes of dep-info-listed local paths, stable at pre/post snapshots, for seven normal and seven default-feature all-target test cells plus the API trace-feature test cell; not proof of the exact bytes rustc read. Build-script/proc-macro reads, compiler/Cargo environment and external configuration inputs, external crate sources, doctests, every reachable native decision effect, all-path READY dominance, runtime observation, semantic admission, TDE/F5/EVF, deployment, and publication remain unproved.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--print-expected", action="store_true")
    parser.add_argument("--probe-root", choices=ROOTS)
    parser.add_argument("--probe-mode", choices=("normal", "test"), default="normal")
    parser.add_argument("--trace", action="store_true")
    args = parser.parse_args()
    if args.probe_root:
        require(not args.trace or args.probe_root == "authorization-api",
                "trace probe only applies to authorization-api")
        reference = reference_inventory(load_v9())
        result = run_cell(args.probe_root, args.probe_mode,
                          ("trace",) if args.trace else (), reference)
        print(json.dumps({"root": result["root"], "mode": result["mode"],
                          "features": result["features"],
                          "artifact_count": len(result["artifacts"]),
                          "observed_input_count": len(result["observed_inputs_sha256"])}, indent=2))
    else:
        expected = expected_binding()
        if args.print_expected:
            print(json.dumps(expected, indent=2))
        else:
            require(regular(BINDING, AUTH) == (json.dumps(expected, indent=2) + "\n").encode(),
                    "v10 compiler-file-input binding differs from replay")
            print(json.dumps({"status": "pass", "binding": BINDING.relative_to(AUTH).as_posix(),
                              "cells": len(expected["matrix"]),
                              "observed_local_rustc_input_count": expected["observed_local_rustc_input_count"],
                              "authority_effect": "none",
                              "runtime_guarantees_observed": False}, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
