#!/usr/bin/env python3
"""Normal-build MIR census for every local package in selected Auth closures.

This checks direct and reified generated-policy ingress across compiled local
packages and inventories compiled call/effect terminators. Indirect, external,
and all-path effects remain explicitly open.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
CASE = Path(__file__).resolve().parent
IMPL = ROOT / "auth-foundation/implementation"
TOOLCHAIN = ROOT / "tools/toolchain/run"
PREDECESSOR = CASE / "auth-v4b-native-endpoint-inventory-v2.mjs"
POLICY = "auth_foundation_operation_auth_exact_permission_authorize::authorize"
POLICY_CRATE = POLICY.rsplit("::", 1)[0]
POLICY_MANIFEST = "standard-runtime/Cargo.toml"
ALLOWED_CALLER = "authorization-ready-decision/Cargo.toml"
FUNCTION_START = re.compile(r"^fn (.+) \{$")
BLOCK_START = re.compile(r"^\s+(bb\d+): \{$")
CALL_TERMINATOR = re.compile(r"^\s*(_\d+ = )?(.+)\((.*)\) -> \[return: (bb\d+), (.+)\];$")
ASSERT_TERMINATOR = re.compile(r"^\s*assert\(.+\) -> \[success: bb\d+, .+\];$")
OPAQUE_CLASSES = {"dynamic-target", "callback-carrier", "drop", "sql-boundary",
                  "ffi-boundary", "decision-endpoint-candidate", "unparsed-terminator",
                  "assert-panic", "unwind-resume", "abort", "yield"}
ROOT_MANIFESTS = {
    "api": "authorization-api/Cargo.toml",
    "tenant": "tenant-bridge/Cargo.toml",
    "prototype": "authentication-prototype/bridge/Cargo.toml",
    "https": "authentication-https/bridge/Cargo.toml",
}
DECISION_TARGETS = (
    "SqliteAuthorizationService::authorize", "authorize_in_transaction",
    "SqliteAuthorizationStateSnapshot::authorize", "AuthorizationAdapter::authorize",
    "authorize_resolved", "SqliteAuthService::authorize",
    "TrustedAuthorizationBoundary::authorize", "authorize_pre_resolved",
    "auth_foundation_authorization_ready_decision::authorize",
)


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def selected_manifests(predecessor: dict) -> list[str]:
    closures = predecessor.get("selected_root_package_manifests")
    require(isinstance(closures, dict) and set(closures) == {"api", "tenant", "prototype", "https"},
            "selected Cargo closure set changed")
    manifests = sorted(set(path for paths in closures.values() for path in paths))
    require(all((IMPL / path).is_file() and path.endswith("/Cargo.toml") for path in manifests),
            "selected manifest missing")
    require(ALLOWED_CALLER in manifests and "standard-runtime/Cargo.toml" in manifests,
            "selected policy chain missing")
    return manifests


def root_feature_map() -> dict[str, dict[str, list[str]]]:
    result = {}
    for root_id, path in ROOT_MANIFESTS.items():
        command = [str(TOOLCHAIN), "cargo", "metadata", "--offline", "--locked",
                   "--format-version", "1", "--manifest-path", str(IMPL / path)]
        run = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                             timeout=60, check=False)
        require(run.returncode == 0, f"{root_id}: Cargo feature metadata failed")
        metadata = json.loads(run.stdout)
        packages = {package["id"]: package for package in metadata["packages"]}
        result[root_id] = {
            str(Path(packages[node["id"]]["manifest_path"]).relative_to(IMPL)): sorted(node["features"])
            for node in metadata["resolve"]["nodes"]
            if Path(packages[node["id"]]["manifest_path"]).is_relative_to(IMPL)
        }
    return result


def target_for(manifest: Path) -> tuple[str, str]:
    data = tomllib.loads(manifest.read_text())
    name = data["package"]["name"]
    if "lib" in data or (manifest.parent / "src/lib.rs").is_file():
        return "--lib", name.replace("-", "_")
    bins = data.get("bin", [])
    if bins:
        require(len(bins) == 1, f"multiple bin targets: {manifest}")
        return f"--bin={bins[0]['name']}", bins[0]["name"].replace("-", "_")
    require((manifest.parent / "src/main.rs").is_file(), f"unknown target: {manifest}")
    return f"--bin={name}", name.replace("-", "_")


def policy_callable_names(inventory: dict) -> tuple[str, ...]:
    rows = inventory.get("generated_policy_callables")
    require(isinstance(rows, list) and len(rows) == 9,
            "source-bound generated policy callable set missing")
    names = [row.get("name") for row in rows if isinstance(row, dict)]
    require(len(names) == 9 and len(set(names)) == 9 and "authorize" in names and
            all(isinstance(name, str) and re.fullmatch(r"[a-z][a-z0-9_]*", name)
                for name in names), "invalid generated policy callable names")
    return tuple(sorted(names))


def compiled_policy_ingress(mir: dict[str, str], callable_names: tuple[str, ...]) -> dict:
    require(ALLOWED_CALLER in mir, "READY decision MIR absent")
    require(POLICY_MANIFEST in mir, "generated policy MIR absent")
    require(len(callable_names) == 9 and len(set(callable_names)) == 9 and
            "authorize" in callable_names and all(
                isinstance(name, str) and re.fullmatch(r"[a-z][a-z0-9_]*", name)
                for name in callable_names), "invalid policy callable set")
    symbol = re.compile(r"\b" + re.escape(POLICY_CRATE) +
                        r"::(" + "|".join(re.escape(name) for name in callable_names) + r")\b")
    direct, internal_direct, reified, unresolved = [], [], [], []
    for manifest, source in mir.items():
        for number, line in enumerate(source.splitlines(), 1):
            for match in symbol.finditer(line):
                name = match.group(1)
                reference = {"manifest": manifest, "line": number, "name": name}
                tail = line[match.end():]
                if re.search(r"=\s*$", line[:match.start()]) and tail.startswith("("):
                    (internal_direct if manifest == POLICY_MANIFEST else direct).append(reference)
                elif re.search(r"=\s*$", line[:match.start()]) and tail.startswith(" as "):
                    reified.append(reference)
                else:
                    unresolved.append({**reference, "fragment": line[:240]})
    require(not any(row["name"] != "authorize" for row in direct),
            "generated policy helper ingress outside sole READY decision")
    require(len(direct) == 1 and direct[0]["manifest"] == ALLOWED_CALLER,
            "generated policy direct ingress outside sole READY decision")
    require(not reified, "generated policy function-pointer ingress")
    require(not unresolved, "unclassified generated policy MIR reference")
    return {"direct": direct, "internal_direct": internal_direct,
            "reified": reified, "unresolved": unresolved}


def effect_class(target: str) -> str:
    if target == "drop":
        return "drop"
    if re.search(r"\b" + re.escape(POLICY_CRATE) + r"::[a-z][a-z0-9_]*\b", target):
        return "generated-policy"
    if any(fragment in target for fragment in DECISION_TARGETS):
        return "decision-endpoint-candidate"
    if re.fullmatch(r"(?:copy |move )?_\d+", target) or "dyn " in target:
        return "dynamic-target"
    if any(fragment in target for fragment in ("FnOnce", "FnMut", " as Fn>",
                                               " as Iterator>", " as IntoIterator>",
                                               "spawn_blocking", "thread::spawn", "tokio::spawn")):
        return "callback-carrier"
    if "rusqlite::" in target or "libsqlite3_sys::" in target:
        return "sql-boundary"
    if "extern " in target or "std::sys::" in target or target.startswith("asm!"):
        return "ffi-boundary"
    return "direct-static"


def compiled_effect_edges(mir: dict[str, str]) -> dict:
    """Inventory terminators; do not mistake their syntax for effect closure."""
    rows = []
    function_counts = {}
    for manifest, source in sorted(mir.items()):
        function = None
        block = None
        function_counts[manifest] = 0
        for number, line in enumerate(source.splitlines(), 1):
            opened = FUNCTION_START.match(line)
            if opened:
                function = opened.group(1)
                block = None
                function_counts[manifest] += 1
                continue
            if line == "}":
                function = None
                block = None
                continue
            entered = BLOCK_START.match(line)
            if entered:
                block = entered.group(1)
                continue
            stripped = line.strip()
            if stripped in {"resume;", "abort;"} or stripped.startswith("yield("):
                kind = "unwind-resume" if stripped == "resume;" else (
                    "abort" if stripped == "abort;" else "yield")
                rows.append({"manifest": manifest, "function": function, "block": block,
                             "line": number, "target": stripped, "class": kind,
                             "unwind": "unknown"})
                continue
            if ASSERT_TERMINATOR.match(line):
                rows.append({"manifest": manifest, "function": function, "block": block,
                             "line": number, "target": stripped[:240], "class": "assert-panic",
                             "unwind": "assert-success-and-unwind"})
                continue
            if "-> [return:" not in line:
                continue
            match = CALL_TERMINATOR.match(line)
            if match is None:
                rows.append({"manifest": manifest, "function": function, "block": block, "line": number,
                             "target": line.strip()[:240], "class": "unparsed-terminator",
                             "unwind": "unknown"})
                continue
            target = match.group(2)
            rows.append({"manifest": manifest, "function": function, "block": block, "line": number,
                         "target": target, "class": effect_class(target),
                         "unwind": match.group(5)})
    require(all(value > 0 for value in function_counts.values()), "empty compiled MIR package")
    require(rows, "empty compiled MIR effect inventory")
    counts = {kind: sum(row["class"] == kind for row in rows)
              for kind in sorted({row["class"] for row in rows})}
    unresolved = [row for row in rows if row["class"] in OPAQUE_CLASSES]
    unwind = [row for row in rows if row["unwind"] != "unknown" and
              row["unwind"] != "unwind unreachable"]
    return {"function_counts": function_counts, "terminator_count": len(rows),
            "class_counts": counts, "unresolved_count": len(unresolved),
            "unwind_edge_count": len(unwind),
            "unresolved_sample": unresolved[:16],
            "edges_sha256": digest(json.dumps(rows, sort_keys=True, separators=(",", ":")).encode())}


def capture(manifests: list[str]) -> tuple[dict[str, str], dict[str, str]]:
    forbidden = ("RUSTFLAGS", "CARGO_ENCODED_RUSTFLAGS", "CARGO_BUILD_RUSTFLAGS",
                 "CARGO_BUILD_TARGET", "CARGO_PROFILE_DEV_BUILD_OVERRIDE_DEBUG")
    require(not [name for name in forbidden if os.environ.get(name)],
            "compiler environment override present")
    contents, hashes = {}, {}
    with tempfile.TemporaryDirectory(prefix="auth-v4b-closure-mir-v6-") as temporary:
        for relative in manifests:
            manifest = IMPL / relative
            target, crate = target_for(manifest)
            locked = manifest.with_name("Cargo.lock").is_file()
            if not locked:
                # These two generated kernels have no dependencies or includes.
                # An isolated copy permits normal Cargo lock generation without
                # mutating the checkout's historical/generated source tree.
                require(relative in {"standard-runtime/Cargo.toml", "trusted-input-runtime/Cargo.toml"},
                        f"unlocked selected package: {relative}")
                manifest_data = tomllib.loads(manifest.read_text())
                require(not manifest_data.get("dependencies") and not manifest_data.get("build-dependencies"),
                        f"unlocked package has dependencies: {relative}")
                source = manifest.parent / manifest_data["lib"]["path"]
                require(source.is_file() and not source.is_symlink() and
                        not any(token in source.read_text() for token in ("include!", "include_str!", "include_bytes!", "mod ")),
                        f"unlocked package source not self-contained: {relative}")
                copied = Path(temporary) / "isolated" / manifest.parent.name
                copied_source = copied / manifest_data["lib"]["path"]
                copied_source.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(manifest, copied / "Cargo.toml")
                shutil.copy2(source, copied_source)
                manifest = copied / "Cargo.toml"
            # The two bridge packages have the same crate name; isolate their
            # output without changing normal feature selection.
            target_dir = Path(temporary) / ("https" if relative.startswith("authentication-https/") else "shared")
            command = [str(TOOLCHAIN), "cargo", "rustc", "--offline",
                       *(["--locked"] if locked else []),
                       "--target-dir", str(target_dir), "--manifest-path", str(manifest),
                       target, "--", "--emit=mir"]
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True,
                                    timeout=600, check=False)
            require(result.returncode == 0,
                    f"{relative}: normal MIR compile failed: {result.stderr[-1400:]}")
            candidates = sorted((target_dir / "debug/deps").glob(f"{crate}-*.mir"))
            require(len(candidates) == 1 and candidates[0].is_file() and not candidates[0].is_symlink(),
                    f"{relative}: normal MIR artifact ambiguous ({len(candidates)})")
            raw = candidates[0].read_bytes()
            contents[relative], hashes[relative] = raw.decode(), digest(raw)
    return contents, hashes


def evaluate() -> dict:
    prior_raw = PREDECESSOR.read_bytes()
    prior_run = subprocess.run(["node", str(PREDECESSOR)], cwd=ROOT,
                               capture_output=True, text=True, timeout=240, check=False)
    require(prior_run.returncode == 0, f"endpoint predecessor failed: {prior_run.stderr[-1200:]}")
    prior = json.loads(prior_run.stdout)
    require(prior.get("status") == "indeterminate" and prior.get("endpoint_set_closed") is False,
            "predecessor claim changed")
    manifests = selected_manifests(prior)
    features = root_feature_map()
    require({key: sorted(value) for key, value in features.items()} ==
            {key: sorted(paths) for key, paths in prior["selected_root_package_manifests"].items()},
            "root Cargo feature/package census drift")
    require(all(not feature_names for root in features.values() for feature_names in root.values()),
            "selected package feature activation differs from standalone default MIR sample")
    mir, hashes = capture(manifests)
    ingress = compiled_policy_ingress(mir, policy_callable_names(prior))
    effects = compiled_effect_edges(mir)
    refreshed = subprocess.run(["node", str(PREDECESSOR)], cwd=ROOT,
                               capture_output=True, text=True, timeout=240, check=False)
    require(refreshed.returncode == 0 and PREDECESSOR.read_bytes() == prior_raw and
            json.loads(refreshed.stdout) == prior, "Cargo/source drift during MIR capture")
    version = subprocess.run([str(TOOLCHAIN), "rustc", "-Vv"], cwd=ROOT,
                             capture_output=True, text=True, timeout=30, check=False)
    require(version.returncode == 0, "rustc version unavailable")
    return {"schema_version": "auth-foundation.v4b-selected-closure-census/v6-candidate",
            "status": "indeterminate", "manifest_count": len(manifests),
            "standalone_default_mir_sha256": hashes, "compiled_policy_ingress": ingress,
            "compiled_effect_edges": effects,
            "selected_root_local_features": features,
            "rustc_version_sha256": digest(version.stdout.encode()),
            "predecessor_sha256": digest(prior_raw), "source_set_sha256": prior["source_set_sha256"],
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "open_effects": ["non-policy decision endpoint reachability and dynamic targets",
                             "transitive callbacks, Drop, SQL, FFI, panic/unwind, and external crates",
                             "same-invocation READY dominance and runtime observation"],
            "claim_limit": "All local manifests in the four selected normal Cargo closures were compiled as standalone default packages to MIR, with current root-local feature sets checked empty. The sampled generated-policy direct ingress is unique to the READY decision crate and call/effect terminators are inventoried. Root-context cfg, indirect/external targets, and all-path runtime behavior remain unclosed."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
