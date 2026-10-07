#!/usr/bin/env python3
"""Check that selected Auth bridge binaries cannot import legacy decision crates.

This is a dependency/source boundary check, not an all-path runtime proof.
"""

from __future__ import annotations

import json
import hashlib
import subprocess
import sys
import tomllib
from pathlib import Path


IMPLEMENTATION = Path(__file__).resolve().parents[1]
TOOLCHAIN = IMPLEMENTATION.parents[1] / "tools/toolchain/run"
BRIDGES = (
    IMPLEMENTATION / "tenant-bridge",
    IMPLEMENTATION / "authentication-prototype/bridge",
    IMPLEMENTATION / "authentication-https/bridge",
)
SOURCE_SHA256 = {
    "tenant-bridge": "91a52bec443c3ab1dc71b7ebe3302b3d58931c207288a396f40398146638a05a",
    "authentication-prototype/bridge": "0e62668e0317086105ad55c0b864714ecd21598e68c827e85487ea6f1fbca6c1",
    "authentication-https/bridge": "0e62668e0317086105ad55c0b864714ecd21598e68c827e85487ea6f1fbca6c1",
}
FORBIDDEN = frozenset({
    "runtime-adapter",
    "sqlite-provider",
    "trusted-boundary",
    "trusted-boundary-v2",
    "trusted-boundary-pre-resolved-v2-candidate",
    "trusted-input-provider",
})
SELECTED_DEPENDENCIES = frozenset({
    "authorization-service",
    "authorization-ready-authority",
    "authorization-ready-decision",
    "authorization-state-model",
    "authorization-state-reader",
    "authorization-metadata-reader",
    "command-boundary-runtime-v2",
    "standard-runtime",
    "trusted-input-reader",
    "trusted-input-runtime",
})


def check_bridge(bridge: Path) -> dict:
    manifest = tomllib.loads((bridge / "Cargo.toml").read_text())
    local = [
        (bridge / spec["path"]).resolve()
        for spec in manifest["dependencies"].values()
        if isinstance(spec, dict) and "path" in spec
    ]
    expected_direct = {IMPLEMENTATION / "authorization-service",
                       IMPLEMENTATION / "authorization-state-model"}
    if len(local) != 2 or set(local) != expected_direct:
        raise ValueError(f"{bridge}: direct local dependency paths changed: {sorted(map(str, local))}")
    source_bytes = (bridge / "src/main.rs").read_bytes()
    source_sha256 = hashlib.sha256(source_bytes).hexdigest()
    if source_sha256 != SOURCE_SHA256[bridge.relative_to(IMPLEMENTATION).as_posix()]:
        raise ValueError(f"{bridge}: pinned source/call-site bytes changed")
    source = source_bytes.decode()
    if ("use auth_foundation_authorization_state_model::" not in source
            or "SqliteAuthService::from_connection(db)" not in source
            or "service.authorize(InboundAuthorizationRequest" not in source):
        raise ValueError(f"{bridge}: selected service call/source import changed")
    result = subprocess.run(
        [str(TOOLCHAIN), "cargo", "metadata", "--locked", "--offline",
         "--format-version", "1", "--manifest-path", str(bridge / "Cargo.toml")],
        cwd=IMPLEMENTATION.parents[1], capture_output=True, text=True, check=False,
    )
    if result.returncode:
        raise ValueError(f"{bridge}: locked offline Cargo metadata failed: {result.stderr[-1200:]}")
    metadata = json.loads(result.stdout)
    packages = {package["id"]: package for package in metadata["packages"]}
    nodes = {node["id"]: node for node in metadata["resolve"]["nodes"]}
    roots = [package_id for package_id, package in packages.items()
             if Path(package["manifest_path"]) == bridge / "Cargo.toml"]
    if len(roots) != 1:
        raise ValueError(f"{bridge}: bridge root ambiguous")
    reached = set()
    queue = roots[:]
    while queue:
        package_id = queue.pop()
        if package_id in reached:
            continue
        reached.add(package_id)
        queue.extend(edge["pkg"] for edge in nodes[package_id]["deps"])
    local_packages = [packages[package_id] for package_id in reached
                      if packages[package_id].get("source") is None]
    escaped = [package["manifest_path"] for package in local_packages
               if not Path(package["manifest_path"]).resolve().is_relative_to(IMPLEMENTATION.resolve())]
    if escaped:
        raise ValueError(f"{bridge}: local Cargo paths escape Auth implementation: {escaped}")
    selected_packages = local_packages
    selected = {Path(package["manifest_path"]).parent.name for package in selected_packages}
    expected = SELECTED_DEPENDENCIES | {bridge.name}
    missing = expected - selected
    unexpected = selected - expected
    forbidden = FORBIDDEN & selected
    wrong_paths = [package["manifest_path"] for package in selected_packages
                   if Path(package["manifest_path"]).resolve() !=
                   (bridge / "Cargo.toml" if Path(package["manifest_path"]).parent == bridge
                    else IMPLEMENTATION / Path(package["manifest_path"]).parent.name / "Cargo.toml").resolve()]
    if missing or unexpected or forbidden or wrong_paths or len(selected_packages) != len(expected):
        raise ValueError(f"{bridge}: missing={sorted(missing)} unexpected={sorted(unexpected)} forbidden={sorted(forbidden)} wrong_paths={wrong_paths} package_count={len(selected_packages)}")
    return {"bridge": bridge.relative_to(IMPLEMENTATION).as_posix(),
            "source_sha256": source_sha256,
            "local_crates": sorted(selected), "legacy_decision_crates_reachable": False}


def main() -> int:
    try:
        bridges = [check_bridge(bridge) for bridge in BRIDGES]
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        return 1
    print(json.dumps({"status": "pass", "bridges": bridges,
                      "runtime_guarantees_observed": False,
                      "claim_limit": "Exact selected bridge local-crate set and pinned source bytes only; no transitive edge/effect or all-path runtime guarantee."},
                     indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
