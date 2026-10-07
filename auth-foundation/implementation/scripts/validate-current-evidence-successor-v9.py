#!/usr/bin/env python3
"""Expanded enumerated Auth source binding beyond the v5-defined v8 set."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path


SCRIPT = Path(__file__).resolve()
IMPL = SCRIPT.parents[1]
AUTH = IMPL.parent
V8 = SCRIPT.with_name("validate-current-evidence-successor-v8.py")
V8_BINDING = IMPL / "current-evidence-successor-v8/binding.json"
BINDING = IMPL / "current-evidence-successor-v9/binding.json"
SQL = frozenset(f"implementation/{name}" for name in (
    "authorization-schema/migrations/0001_auth_state.sql",
    "authorization-schema/migrations/0001_trusted_inputs.sql",
    "authorization-schema/migrations/0002_auth_service_epoch.sql",
    "authorization-service/migrations/0002_auth_service_epoch.sql",
    "trusted-input-provider/migrations/0001_trusted_inputs.sql",
))
TRACE_DIR = IMPL / "authorization-trace"
TRACE = frozenset(f"implementation/authorization-trace/{name}" for name in (
    "Cargo.toml", "Cargo.lock", "src/lib.rs"))
ADDED = SQL | TRACE
SUPPORT = (
    "implementation/scripts/validate-current-evidence-successor-v9.py",
    "implementation/scripts/test-current-evidence-successor-v9.py",
    "implementation/current-evidence-successor-v9/README.md",
)
TEST_NAME = "concrete_timeout_deny_precedes_later_ready_policy_entry"


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def load_v8():
    spec = importlib.util.spec_from_file_location("auth_technical_v8", V8)
    require(spec is not None and spec.loader is not None, "v8 verifier missing")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def trace_package_files() -> set[str]:
    require(TRACE_DIR.is_dir() and not TRACE_DIR.is_symlink(), "trace package missing or symlinked")
    paths = set()
    for path in TRACE_DIR.rglob("*"):
        if "target" in path.relative_to(TRACE_DIR).parts:
            continue
        require(not path.is_symlink(), f"symlinked trace input: {path}")
        if path.is_file():
            paths.add(path.relative_to(AUTH).as_posix())
    require(paths == TRACE, f"trace package file set changed: {sorted(paths ^ TRACE)}")
    return paths


def checked_expansion(base: dict[str, str], expanded: dict[str, str]) -> dict[str, str]:
    require(set(expanded) == set(base) | ADDED and not (set(base) & ADDED),
            "expanded source path set changed")
    require(all(expanded[name] == value for name, value in base.items()),
            "v8-defined source hash changed")
    require(all(re.fullmatch(r"[0-9a-f]{64}", expanded[name]) for name in ADDED),
            "added source hash invalid")
    return {name: expanded[name] for name in sorted(ADDED)}


def trace_closure(v7) -> dict[str, list[str]]:
    normal = v7.closure("authorization-api")
    manifest = IMPL / "authorization-api/Cargo.toml"
    report = json.loads(v7.run([str(v7.TOOLCHAIN), "cargo", "metadata", "--locked", "--offline",
                                "--format-version", "1", "--features", "trace",
                                "--manifest-path", str(manifest)]))
    packages = {item["id"]: item for item in report["packages"]}
    nodes = {item["id"]: item for item in report["resolve"]["nodes"]}
    visited, pending = set(), [report["resolve"]["root"]]
    while pending:
        item = pending.pop()
        if item in visited:
            continue
        visited.add(item)
        pending.extend(edge["pkg"] for edge in nodes[item]["deps"]
                       if any(kind["kind"] != "dev" for kind in edge["dep_kinds"]))
    local = sorted({Path(packages[item]["manifest_path"]).parent.relative_to(IMPL).as_posix()
                    for item in visited
                    if Path(packages[item]["manifest_path"]).is_relative_to(IMPL)})
    require(set(local) == set(normal) | {"authorization-trace"},
            "trace-feature local Cargo closure changed")
    for name in ("authorization-api", "authorization-admission-service",
                 "authorization-ready-authority", "authorization-ready-decision"):
        matching = [item for item in visited
                    if Path(packages[item]["manifest_path"]).parent == IMPL / name]
        require(len(matching) == 1 and "trace" in nodes[matching[0]]["features"],
                f"trace feature not enabled for {name}")
    return {"normal": normal, "trace_feature": local}


def expanded_inventory(v7, base: dict[str, str]) -> dict[str, str]:
    trace_package_files()
    current = v7.source_inventory({root: v7.closure(root) for root in v7.ROOTS})
    require(current == base, "v8-defined source inventory changed")
    for name in ADDED:
        current[name] = sha(v7.regular(AUTH / name))
    return dict(sorted(current.items()))


def expected_binding() -> dict:
    v8 = load_v8()
    v8.validate()
    v7 = v8.load_v7()
    raw8 = v7.regular(V8_BINDING)
    v8_binding = json.loads(raw8)
    require(v8_binding["runtime_guarantees_observed"] is False
            and v8_binding["authority_effect"] == "none"
            and v8_binding["v5_defined_inventory_source_count"] == 78,
            "v8 predecessor claim changed")
    base = v7.source_inventory({root: v7.closure(root) for root in v7.ROOTS})
    require(len(base) == 78 and v7.digest(base) ==
            v8_binding["v5_defined_inventory_source_map_sha256"],
            "v8 predecessor source map changed")
    support_paths = (*v7.SUPPORT, *v8.SUPPORT, *SUPPORT)
    support_start = {name: sha(v7.regular(AUTH / name)) for name in support_paths}
    predecessor_paths = (v7.V5_BINDING, v7.V6_BINDING, v7.BINDING, V8_BINDING,
                         *(AUTH / name for name in
                           v7.predecessors()[2]["historical_preimages"]))
    predecessor_start = {str(path): sha(v7.regular(path)) for path in predecessor_paths}
    closure = trace_closure(v7)
    expanded = expanded_inventory(v7, base)
    added = checked_expansion(base, expanded)
    test = subprocess.run([str(v7.TOOLCHAIN), "cargo", "test", "--locked", "--offline",
                           "--features", "trace", "--test", "timeout_after_response",
                           TEST_NAME, "--", "--exact"],
                          cwd=IMPL / "authorization-api", text=True,
                          capture_output=True, timeout=900, check=False)
    require(test.returncode == 0 and re.search(r"(?m)^test result: ok\. 1 passed; 0 failed;",
                                                 test.stdout) is not None
            and TEST_NAME in test.stdout,
            f"named timeout witness did not pass: {(test.stderr or test.stdout)[-1200:]}")
    require(expanded == expanded_inventory(v7, base), "expanded sources changed during test")
    require(v7.regular(V8_BINDING) == raw8, "v8 predecessor changed during test")
    require(predecessor_start == {str(path): sha(v7.regular(path))
                                  for path in predecessor_paths},
            "historical predecessor changed during test")
    require(support_start == {name: sha(v7.regular(AUTH / name)) for name in support_paths},
            "successor support changed during test")
    return {
        "schema_version": "auth-foundation.current-technical-evidence-successor/v9-candidate",
        "binding_id": "AUTH-CURRENT-TECHNICAL-EVIDENCE-009",
        "predecessor_v8_sha256": sha(raw8),
        "added_source_count": len(added),
        "added_sources_sha256": added,
        "expanded_source_count": len(expanded),
        "expanded_source_map_sha256": v7.digest(expanded),
        "api_local_cargo_closures": closure,
        "named_trace_timeout_test": TEST_NAME,
        "support_inputs_sha256": {name: support_start[name] for name in SUPPORT},
        "status": "expanded-enumerated-source-v9-candidate-pass",
        "authority_effect": "none",
        "runtime_guarantees_observed": False,
        "claim_limit": "Expanded enumerated Auth source set: the v5-defined 78 paths plus five cross-package SQL include_str inputs and the three-file authorization-trace package, with trace-feature Cargo closure and named timeout test replay. Compiler dep-info completeness, indirect effects, all-path no-call, runtime guarantees, semantic admission, TDE/F5/EVF, deployment, and publication are not established.",
    }


def validate() -> dict:
    expected = expected_binding()
    v7 = load_v8().load_v7()
    require(v7.regular(BINDING) == (json.dumps(expected, indent=2) + "\n").encode(),
            "v9 expanded source binding differs from replay")
    return {"status": "pass", "binding": BINDING.relative_to(AUTH).as_posix(),
            "expanded_source_count": expected["expanded_source_count"],
            "added_source_count": expected["added_source_count"],
            "named_trace_timeout_test": TEST_NAME,
            "compiler_inputs_complete": False, "authority_effect": "none",
            "runtime_guarantees_observed": False}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--print-expected", action="store_true")
    args = parser.parse_args()
    print(json.dumps(expected_binding() if args.print_expected else validate(), indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
