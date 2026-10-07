#!/usr/bin/env python3
"""Read-only aggregate of the current selected Auth candidate verification path."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import re
import subprocess
import sys
from pathlib import Path


AUTH = Path(__file__).resolve().parents[2]
REPO = AUTH.parent
IMPL = AUTH / "implementation"
CASE = AUTH / "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001"
TOOLCHAIN = REPO / "tools/toolchain/run"
RUST_CRATES = (
    "authorization-api", "authorization-admission-service",
    "authorization-ready-authority", "authorization-ready-decision",
    "tenant-bridge", "authentication-prototype/bridge", "authentication-https/bridge",
)
DOC_CRATES = frozenset({"authorization-api", "authorization-admission-service",
                        "authorization-ready-authority", "authorization-ready-decision"})
MIR_ROOTS = frozenset({"api", "admission", "authority", "decision", "tenant", "prototype", "https"})
PUBLIC_ROOTS = frozenset({"api", "tenant", "prototype", "https"})
PUBLIC_MANIFESTS = {"api": "authorization-api/Cargo.toml",
                    "tenant": "tenant-bridge/Cargo.toml",
                    "prototype": "authentication-prototype/bridge/Cargo.toml",
                    "https": "authentication-https/bridge/Cargo.toml"}
EXCLUDED_RAW_DECISION_MANIFESTS = [
    "authorization-service/Cargo.toml", "runtime-adapter/Cargo.toml",
    "sqlite-provider/Cargo.toml",
    "trusted-boundary-pre-resolved-v2-candidate/Cargo.toml",
    "trusted-boundary-v2/Cargo.toml", "trusted-boundary/Cargo.toml",
]
APPROVED_SQL_DATA = {
    "authorization-schema/migrations/0001_auth_state.sql",
    "authorization-schema/migrations/0001_trusted_inputs.sql",
    "authorization-schema/migrations/0002_auth_service_epoch.sql",
}
STAGES = (
    ("runtime_projection", "validate-current-runtime-successor.py"),
    ("current_trusted_input_d65", "validate-current-trusted-input-successor-v1.py"),
    ("selected_technical_v10", "validate-current-evidence-successor-v10.py"),
    ("legacy_compatibility_adapter", "validate-runtime-adapter-successor-v1.py"),
)


def progress(label: str) -> None:
    if os.environ.get("AUTH_VALIDATION_PROGRESS") == "1":
        print(f"[auth-validation] {label}", file=sys.stderr, flush=True)


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def sha(path: Path) -> str:
    require(path.is_file() and not path.is_symlink(), f"missing or symlinked protected file: {path}")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def protected_bytes() -> dict[str, str]:
    paths = [IMPL / "standard-conformance/runtime-evidence.json",
             IMPL / "standard-conformance/runtime-adapter-binding.json",
             IMPL / "standard-conformance/authorization-service-binding.json",
             IMPL / "standard-conformance/trusted-input-evidence.json",
             IMPL / "d65-chain.json",
             IMPL / "current-trusted-input-successor-v1/authorization-service-binding.v4.json",
             IMPL / "current-trusted-input-successor-v1/trusted-input-evidence.v3.json",
             IMPL / "current-trusted-input-successor-v1/d65-chain.v7.json",
             IMPL / "current-evidence-successor-v5/binding.json",
             IMPL / "current-evidence-successor-v6/binding.json",
             IMPL / "current-evidence-successor-v7/binding.json",
             IMPL / "current-evidence-successor-v8/binding.json",
             IMPL / "current-evidence-successor-v9/binding.json",
             IMPL / "current-evidence-successor-v10/binding.json"]
    paths.extend((IMPL / "current-evidence-successor-v3/preimages").iterdir())
    return {path.relative_to(AUTH).as_posix(): sha(path) for path in sorted(paths)}


def technical_source_snapshot() -> dict[str, str]:
    """Re-enumerate the v9 expanded inventory and successor support inputs."""
    script = IMPL / "scripts/validate-current-evidence-successor-v7.py"
    spec = importlib.util.spec_from_file_location("auth_technical_v7_snapshot", script)
    require(spec is not None and spec.loader is not None, "v7 snapshot instrument missing")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    closures = {root: module.closure(root) for root in module.ROOTS}
    inventory = module.source_inventory(closures)
    v9_script = IMPL / "scripts/validate-current-evidence-successor-v9.py"
    v9_spec = importlib.util.spec_from_file_location("auth_technical_v9_snapshot", v9_script)
    require(v9_spec is not None and v9_spec.loader is not None, "v9 snapshot instrument missing")
    v9 = importlib.util.module_from_spec(v9_spec)
    v9_spec.loader.exec_module(v9)
    v9.trace_package_files()
    expanded = {**inventory, **{name: sha(AUTH / name) for name in v9.ADDED}}
    v9.checked_expansion(inventory, expanded)
    support = (*module.SUPPORT,
               "implementation/scripts/validate-current-evidence-successor-v8.py",
               "implementation/scripts/test-current-evidence-successor-v8.py",
               "implementation/current-evidence-successor-v8/README.md",
               *v9.SUPPORT,
               "implementation/scripts/validate-current-evidence-successor-v10.py",
               "implementation/scripts/test-current-evidence-successor-v10.py",
               "implementation/current-evidence-successor-v10/PLAN.md",
               "implementation/current-evidence-successor-v10/README.md")
    return {**expanded, **{name: sha(AUTH / name) for name in support}}


def command(args: list[str], *, cwd: Path = REPO, strict: bool = False,
            timeout: int = 900) -> str:
    env = dict(os.environ)
    env["TMPDIR"] = "/dev/shm" if Path("/dev/shm").is_dir() else env.get("TMPDIR", "/tmp")
    if strict:
        env["RUSTFLAGS"] = "-Dwarnings"
    result = subprocess.run(args, cwd=cwd, env=env, text=True, capture_output=True,
                            timeout=timeout, check=False)
    require(result.returncode == 0,
            f"{' '.join(args)}: stdout={result.stdout[-2400:]} stderr={result.stderr[-1200:]}")
    return result.stdout


def checked_json(name: str, output: str) -> dict:
    try:
        value = json.loads(output)
    except json.JSONDecodeError as error:
        raise ValueError(f"{name}: invalid JSON: {error}") from error
    require(isinstance(value, dict) and value.get("status") == "pass",
            f"{name}: current verifier did not pass")
    require(value.get("runtime_guarantees_observed") is not True,
            f"{name}: runtime guarantee escalated")
    if name == "runtime_projection":
        require(value.get("runtime_guarantees_observed") is False
                and isinstance(value.get("targets"), list)
                and len(value["targets"]) == 3
                and all(row.get("current_target_observed") is True for row in value["targets"]),
                "runtime projection target replay incomplete")
    elif name == "current_trusted_input_d65":
        require(value.get("runtime_guarantees_observed") is False
                and value.get("authority_effect") == "none"
                and isinstance(value.get("checks"), int) and value["checks"] >= 94
                and value.get("historical_predecessors") == "preserved-source-stale"
                and value.get("service_binding") ==
                    "implementation/current-trusted-input-successor-v1/authorization-service-binding.v4.json"
                and value.get("evidence") ==
                    "implementation/current-trusted-input-successor-v1/trusted-input-evidence.v3.json"
                and value.get("d65_chain") ==
                    "implementation/current-trusted-input-successor-v1/d65-chain.v7.json",
                "current trusted-input/D65 successor incomplete")
    elif name == "selected_technical_v10":
        require(value.get("runtime_guarantees_observed") is False
                and value.get("authority_effect") == "none"
                and value.get("binding") ==
                    "implementation/current-evidence-successor-v10/binding.json"
                and value.get("cells") == 15
                and value.get("observed_local_rustc_input_count") == 28,
                "v10 technical successor identity changed")
    elif name == "legacy_compatibility_adapter":
        require(value.get("runtime_guarantees_observed") is False,
                f"{name}: candidate claim ceiling changed")
    return value


def selected_rust() -> dict[str, dict]:
    results = {}
    for relative in RUST_CRATES:
        progress(f"rust: {relative}")
        crate = IMPL / relative
        args = ["--locked", "--offline", "--all-targets"]
        command([str(TOOLCHAIN), "cargo", "fmt", "--check"], cwd=crate)
        command([str(TOOLCHAIN), "cargo", "check", *args], cwd=crate, strict=True)
        command([str(TOOLCHAIN), "cargo", "clippy", *args, "--", "-D", "warnings"], cwd=crate)
        command([str(TOOLCHAIN), "cargo", "test", *args], cwd=crate)
        if relative == "authorization-api":
            command([str(TOOLCHAIN), "cargo", "test", *args, "--features", "trace"], cwd=crate)
        if relative in DOC_CRATES:
            command([str(TOOLCHAIN), "cargo", "test", "--locked", "--offline", "--doc"], cwd=crate)
        results[relative] = {"fmt": "pass", "strict_check": "pass", "clippy": "pass",
                             "all_targets_test": "pass",
                             "trace_feature_all_targets_test": "pass" if relative == "authorization-api"
                                 else "not_applicable",
                             "doc_test": "pass" if relative in DOC_CRATES else "not_applicable"}
    return results


def endpoint_inventory(output: str) -> dict:
    require(re.search(r"(?m)^# tests 11$", output) is not None
            and re.search(r"(?m)^# pass 11$", output) is not None
            and re.search(r"(?m)^# fail 0$", output) is not None,
            "syntax endpoint inventory suite incomplete")
    return {"tests": 11, "status": "pass", "claim_ceiling": "syntax-only-indeterminate"}


def checked_mir(output: str) -> dict:
    try:
        value = json.loads(output)
    except json.JSONDecodeError as error:
        raise ValueError(f"MIR census invalid JSON: {error}") from error
    require(isinstance(value, dict)
            and value.get("status") == "indeterminate"
            and value.get("endpoint_set_closed") is False
            and value.get("all_path_ready_dominance") is False
            and value.get("runtime_guarantees_observed") is False,
            "MIR census claim ceiling changed")
    digests = value.get("normal_mir_sha256")
    require(isinstance(digests, dict) and set(digests) == MIR_ROOTS
            and all(isinstance(digest, str) and re.fullmatch(r"[a-f0-9]{64}", digest)
                    for digest in digests.values()),
            "MIR root set or compiled artifact digests changed")
    census = value.get("census")
    require(isinstance(census, dict)
            and set(census.get("roots", {})) == {"api", "tenant", "prototype", "https"}
            and all(name in census for name in ("admission", "authority", "decision")),
            "MIR selected READY chain incomplete")
    return {"status": "indeterminate", "roots": sorted(digests),
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False}


def checked_closure_mir(output: str) -> dict:
    try:
        value = json.loads(output)
    except json.JSONDecodeError as error:
        raise ValueError(f"closure MIR census invalid JSON: {error}") from error
    require(isinstance(value, dict)
            and value.get("schema_version") == "auth-foundation.v4b-selected-closure-census/v6-candidate"
            and value.get("status") == "indeterminate"
            and value.get("endpoint_set_closed") is False
            and value.get("all_path_ready_dominance") is False
            and value.get("runtime_guarantees_observed") is False,
            "closure MIR claim ceiling changed")
    digests = value.get("standalone_default_mir_sha256")
    require(isinstance(digests, dict) and len(digests) == value.get("manifest_count") == 14
            and all(isinstance(path, str) and path.endswith("/Cargo.toml")
                    and isinstance(item, str) and re.fullmatch(r"[a-f0-9]{64}", item)
                    for path, item in digests.items()),
            "closure MIR manifest set or artifact digests changed")
    features = value.get("selected_root_local_features")
    require(isinstance(features, dict) and set(features) == PUBLIC_ROOTS
            and all(isinstance(root, dict) and root and set(root) <= set(digests)
                    and all(items == [] for items in root.values())
                    for root in features.values()),
            "closure MIR selected root features changed")
    require(set().union(*(set(root) for root in features.values())) == set(digests),
            "closure MIR root union does not cover sampled packages")
    ingress = value.get("compiled_policy_ingress")
    direct = ingress.get("direct") if isinstance(ingress, dict) else None
    require(isinstance(ingress, dict)
            and isinstance(direct, list) and len(direct) == 1
            and isinstance(direct[0], dict)
            and direct[0].get("manifest") == "authorization-ready-decision/Cargo.toml"
            and isinstance(direct[0].get("line"), int)
            and ingress.get("reified") == [] and ingress.get("unresolved") == [],
            "closure MIR generated-policy ingress changed")
    effects = value.get("compiled_effect_edges")
    counts = effects.get("class_counts") if isinstance(effects, dict) else None
    require(isinstance(counts, dict) and isinstance(effects.get("function_counts"), dict)
            and set(effects["function_counts"]) == set(digests)
            and isinstance(effects.get("terminator_count"), int)
            and sum(counts.values()) == effects["terminator_count"]
            and isinstance(effects.get("unresolved_count"), int)
            and effects["unresolved_count"] > 0
            and all(counts.get(kind, 0) > 0 for kind in
                    ("generated-policy", "drop", "dynamic-target", "callback-carrier",
                     "sql-boundary", "assert-panic", "unwind-resume"))
            and counts["generated-policy"] == 1
            and isinstance(effects.get("unwind_edge_count"), int)
            and effects["unwind_edge_count"] > 0,
            "closure MIR effect inventory incomplete")
    for item in (value.get("rustc_version_sha256"), value.get("source_set_sha256"),
                 value.get("predecessor_sha256"), effects.get("edges_sha256")):
        require(isinstance(item, str) and re.fullmatch(r"[a-f0-9]{64}", item),
                "closure MIR provenance digest missing")
    return {"status": "indeterminate", "standalone_default_packages": len(digests),
            "effect_terminators": effects["terminator_count"],
            "unresolved_effect_terminators": effects["unresolved_count"],
            "source_set_sha256": value["source_set_sha256"],
            "rustc_version_sha256": value["rustc_version_sha256"],
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False}


def checked_root_context_mir(output: str) -> dict:
    try:
        value = json.loads(output)
    except json.JSONDecodeError as error:
        raise ValueError(f"root-context MIR census invalid JSON: {error}") from error
    require(isinstance(value, dict)
            and value.get("schema_version") == "auth-foundation.v4b-root-context-census/v7-candidate"
            and value.get("status") == "indeterminate"
            and value.get("instrumentation") == "RUSTFLAGS=--emit=mir,link"
            and value.get("endpoint_set_closed") is False
            and value.get("all_path_ready_dominance") is False
            and value.get("runtime_guarantees_observed") is False,
            "root-context MIR claim ceiling changed")
    roots = value.get("root_context_builds")
    require(isinstance(roots, dict) and set(roots) == PUBLIC_ROOTS,
            "root-context MIR public root set changed")
    for name, root in roots.items():
        artifacts = root.get("artifacts") if isinstance(root, dict) else None
        boundary = root.get("decision_capability_boundary") if isinstance(root, dict) else None
        ingress = root.get("generated_policy_ingress") if isinstance(root, dict) else None
        counts = root.get("effect_class_counts") if isinstance(root, dict) else None
        direct = ingress.get("direct") if isinstance(ingress, dict) else None
        require(isinstance(artifacts, dict) and len(artifacts) == root.get("local_package_count") == 11
                and PUBLIC_MANIFESTS[name] in artifacts
                and "authorization-ready-decision/Cargo.toml" in artifacts
                and isinstance(direct, list) and len(direct) == 1
                and isinstance(direct[0], dict)
                and direct[0].get("manifest") == "authorization-ready-decision/Cargo.toml"
                and isinstance(direct[0].get("line"), int)
                and ingress.get("reified") == [] and ingress.get("unresolved") == []
                and isinstance(counts, dict) and counts.get("generated-policy") == 1
                and sum(counts.values()) == root.get("effect_terminators")
                and isinstance(root.get("unresolved_effect_terminators"), int)
                and root["unresolved_effect_terminators"] > 0,
                f"{name}: root-context MIR ingress/effect inventory incomplete")
        require(isinstance(boundary, dict)
                and boundary.get("selected_downstream_entrypoint_ids") ==
                    ["generated-policy", "ready-decision"]
                and boundary.get("known_entrypoint_count") == 22
                and boundary.get("excluded_raw_decision_manifests") ==
                    EXCLUDED_RAW_DECISION_MANIFESTS
                and all(isinstance(path, str) and path.endswith("/Cargo.toml")
                        and path not in artifacts
                        for path in boundary["excluded_raw_decision_manifests"]),
                f"{name}: native decision capability boundary incomplete")
        for artifact in artifacts.values():
            require(isinstance(artifact, dict) and isinstance(artifact.get("package_id"), str)
                    and artifact.get("features") == []
                    and isinstance(artifact.get("mir_sha256"), str)
                    and re.fullmatch(r"[a-f0-9]{64}", artifact["mir_sha256"])
                    and isinstance(artifact.get("dep_info_sha256"), str)
                    and re.fullmatch(r"[a-f0-9]{64}", artifact["dep_info_sha256"])
                    and isinstance(artifact.get("rust_source_count"), int)
                    and artifact["rust_source_count"] > 0
                    and isinstance(artifact.get("data_dependency_count"), int)
                    and artifact["data_dependency_count"] >= 0
                    and isinstance(artifact.get("approved_external_data_dependencies"), list)
                    and all(path in APPROVED_SQL_DATA
                        for path in artifact["approved_external_data_dependencies"])
                    and artifact.get("unclassified_external_dependency_count") == 0,
                    f"{name}: local artifact identity/feature binding incomplete")
        for field in ("metadata_sha256", "lock_sha256", "effect_edges_sha256"):
            require(isinstance(root.get(field), str) and re.fullmatch(r"[a-f0-9]{64}", root[field]),
                    f"{name}: root-context provenance missing")
    data = value.get("approved_external_data_sha256")
    require(isinstance(data, dict) and set(data) == APPROVED_SQL_DATA
            and all(isinstance(item, str) and re.fullmatch(r"[a-f0-9]{64}", item)
                    for item in data.values()),
            "root-context approved SQL data hashes missing")
    for field in ("source_set_sha256", "rustc_version_sha256", "predecessor_sha256"):
        require(isinstance(value.get(field), str) and re.fullmatch(r"[a-f0-9]{64}", value[field]),
                f"root-context {field} missing")
    return {"status": "indeterminate", "roots": sorted(roots),
            "excluded_raw_decision_manifests": {
                name: roots[name]["decision_capability_boundary"]["excluded_raw_decision_manifests"]
                for name in sorted(roots)},
            "local_packages_per_root": {name: roots[name]["local_package_count"] for name in sorted(roots)},
            "unresolved_effect_terminators": {name: roots[name]["unresolved_effect_terminators"]
                                              for name in sorted(roots)},
            "source_set_sha256": value["source_set_sha256"],
            "rustc_version_sha256": value["rustc_version_sha256"],
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False}


def validate() -> dict:
    protected = protected_bytes()
    technical_sources = technical_source_snapshot()
    stages = {}
    for name, script in STAGES:
        progress(f"stage: {name}")
        stages[name] = checked_json(name, command(
            [sys.executable, str(IMPL / "scripts" / script)],
            timeout=2400 if name == "selected_technical_v10" else 900))
    progress("selected Rust")
    rust = selected_rust()
    progress("syntax inventory")
    syntax = endpoint_inventory(command(["node", "--test", "--test-reporter=tap",
                                         str(CASE / "auth-v4b-native-endpoint-inventory-v2.test.mjs")]))
    progress("typed target MIR")
    mir = checked_mir(command([sys.executable, str(CASE / "auth-v4b-typed-target-census-v5.py")],
                              timeout=1200))
    progress("selected closure MIR")
    closure_mir = checked_closure_mir(command(
        [sys.executable, str(CASE / "auth-v4b-selected-closure-census-v6.py")], timeout=1200))
    progress("root-context MIR")
    root_context_mir = checked_root_context_mir(command(
        [sys.executable, str(CASE / "auth-v4b-root-context-census-v7.py")], timeout=1200))
    require(root_context_mir["source_set_sha256"] == closure_mir["source_set_sha256"]
            and root_context_mir["rustc_version_sha256"] == closure_mir["rustc_version_sha256"],
            "MIR source/compiler drift between standalone and root-context captures")
    require(protected == protected_bytes(), "historical Auth evidence changed during validation")
    require(technical_sources == technical_source_snapshot(),
            "selected Auth technical sources changed during validation")
    progress("final source snapshot passed")
    return {"schema_version": "auth-foundation.current-selected-auth-validation/v1-candidate",
            "status": "pass", "selected_scope": "public Auth API and three bridges",
            "current_stages": {name: value["status"] for name, value in stages.items()},
            "selected_rust": rust, "syntax_inventory": syntax, "normal_mir": mir,
            "standalone_closure_mir": closure_mir, "root_context_mir": root_context_mir,
            "historical_legacy_runtime_evidence": "preserved-source-stale",
            "formal_proof_status": "indeterminate", "runtime_guarantees_observed": False,
            "authority_effect": "none",
            "claim_limit": "Read-only current selected Auth source/dependency/compile/tests/CLI replay, including current versioned trusted-input service/evidence/D65 sidecars, trace-feature API integration tests, the v9 86-path predecessor inventory, and the v10 15-cell local rustc dep-info-listed path snapshot. Exact bytes read by rustc, external build/config/environment inputs, build-script/proc-macro reads, and doctest compiler inputs are not established. The named MIR chain, 14-package standalone-default effect inventory, and four instrumented root-context local-MIR inventories remain indeterminate. Historical predecessors remain preserved; indirect endpoint/effect/all-path/runtime closure, formal semantic admission, TDE/F5/EVF satisfaction, deployment and publication are not established."}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.parse_args()
    print(json.dumps(validate(), indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
