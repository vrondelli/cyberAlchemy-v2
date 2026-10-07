#!/usr/bin/env python3
"""Bind the current selected Auth path without upgrading source checks to proof."""

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
TOOLCHAIN = REPO / "tools/toolchain/run"
BINDING = IMPL / "current-evidence-successor-v5/binding.json"
ROOTS = (
    "authorization-api",
    "tenant-bridge",
    "authentication-prototype/bridge",
    "authentication-https/bridge",
)
FORBIDDEN = frozenset({
    "runtime-adapter", "sqlite-provider", "trusted-boundary",
    "trusted-boundary-v2", "trusted-boundary-pre-resolved-v2-candidate",
})
CASE = AUTH / "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001"


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def sha(path: Path) -> str:
    require(path.is_file() and not path.is_symlink(), f"missing or symlinked input: {path}")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str], *, timeout: int = 600) -> str:
    env = dict(os.environ)
    env["TMPDIR"] = "/dev/shm" if Path("/dev/shm").is_dir() else env.get("TMPDIR", "/tmp")
    result = subprocess.run(command, cwd=REPO, env=env, text=True, capture_output=True,
                            timeout=timeout, check=False)
    require(result.returncode == 0,
            f"{' '.join(command)}: {(result.stderr or result.stdout)[-2400:]}")
    return result.stdout


def historical_archive() -> dict[str, str]:
    script = IMPL / "scripts/validate-current-evidence-successor-v4.py"
    spec = importlib.util.spec_from_file_location("auth_historical_v4", script)
    require(spec is not None and spec.loader is not None, "historical verifier unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.archive_preimages()


def closure(root: str) -> list[str]:
    manifest = IMPL / root / "Cargo.toml"
    report = json.loads(run([str(TOOLCHAIN), "cargo", "metadata", "--locked", "--offline",
                             "--format-version", "1", "--manifest-path", str(manifest)]))
    packages = {row["id"]: row for row in report["packages"]}
    nodes = {row["id"]: row for row in report["resolve"]["nodes"]}
    selected = set()
    pending = [report["resolve"]["root"]]
    while pending:
        package_id = pending.pop()
        if package_id in selected:
            continue
        selected.add(package_id)
        pending.extend(edge["pkg"] for edge in nodes[package_id]["deps"]
                       if any(kind["kind"] != "dev" for kind in edge["dep_kinds"]))
    local = {Path(packages[pid]["manifest_path"]).parent.relative_to(IMPL).as_posix()
             for pid in selected if Path(packages[pid]["manifest_path"]).is_relative_to(IMPL)}
    require(root in local, f"Cargo root missing: {root}")
    require(not (local & FORBIDDEN), f"legacy raw decision crate reachable from {root}: {sorted(local & FORBIDDEN)}")
    require("authorization-admission-service" in local and "authorization-ready-decision" in local,
            f"selected admission or READY decision absent: {root}")
    return sorted(local)


def body(source: str, signature: str) -> str:
    executable = re.sub(r'"(?:\\.|[^"\\])*"|//[^\n]*|/\*.*?\*/',
                        lambda match: re.sub(r"[^\n]", " ", match.group()), source, flags=re.S)
    require(executable.count(signature) == 1, f"selected Rust item changed: {signature}")
    opening = executable.find("{", executable.index(signature) + len(signature))
    require(opening >= 0, f"Rust body missing: {signature}")
    depth = 0
    for index in range(opening, len(executable)):
        if executable[index] == "{":
            depth += 1
        elif executable[index] == "}":
            depth -= 1
            if depth == 0:
                return executable[opening + 1:index]
    raise ValueError(f"Rust body unclosed: {signature}")


def selected_path() -> dict:
    api = (IMPL / "authorization-api/src/lib.rs").read_text()
    admission = (IMPL / "authorization-admission-service/src/lib.rs").read_text()
    authority = (IMPL / "authorization-ready-authority/src/lib.rs").read_text()
    decision = (IMPL / "authorization-ready-decision/src/lib.rs").read_text()
    require("#[cfg(not(test))]\ntype PoolEngine = SqliteAdmissionService<SystemDecisionClock>;" in api,
            "production pool is not concrete admission service")
    require("#[cfg(test)]\ntype PoolEngine = Box<dyn AuthorizationEngine>;" in api,
            "test-only mock pool boundary changed")
    builder = body(api, "pub fn authorization_runtime_from_database(")
    require(builder.count("SqliteAdmissionService::open_with_epoch_allocator(") == 1
            and builder.count("engines.push(pool_engine(service))") == 1,
            "production admission service construction changed")
    worker = body(api, "pub async fn authorize(\n")
    require(worker.count("#[cfg(not(test))]") == 1
            and worker.count("engine.with_ready(request, authorize_ready_decision)") == 1
            and worker.count("engine.authorize(request)") == 1,
            "production READY worker or test-only mock path changed")
    require(body(api, "async fn authorize(State(state): State<ApiState>, request: Request<Body>)").count(
        "state.runtime.authorize(request.into()).await") == 1,
        "HTTP handler delegation changed")
    admitted = body(admission, "pub fn with_ready<R>(")
    require(admitted.count("with_ready_in_transaction(") == 1
            and admitted.count("continuation,") == 1,
            "admission service delegation changed")
    gated = body(authority, "pub fn with_ready_in_transaction<")
    require(gated.count("gate::admit_authorization_command(&context)") == 1
            and gated.count("AdmissionOutcome::Ready(continuation(ready))") == 1
            and gated.index("gate::admit_authorization_command(&context)")
            < gated.index("AdmissionOutcome::Ready(continuation(ready))"),
            "READY gate/continuation order changed")
    require(body(decision, "pub fn authorize(ready: ReadyAuthorization<'_, '_>)").count(
        "kernel::authorize(&context)") == 1, "READY policy call changed")
    return {"production_path": ["HTTP authorize", "AuthorizationRuntime::authorize",
                                "SqliteAdmissionService::with_ready",
                                "with_ready_in_transaction", "admit_authorization_command",
                                "ReadyAuthorization", "authorize_ready_decision", "kernel::authorize"],
            "test_mock_is_cfg_test_only": True,
            "source_shape_is_semantic_proof": False}


def source_inventory(closures: dict[str, list[str]]) -> dict[str, str]:
    paths = {
        "implementation/scripts/validate-current-evidence-successor-v5.py",
        "implementation/scripts/test-current-evidence-successor-v5.py",
        "implementation/current-evidence-successor-v5/README.md",
        "implementation/runtime-adapter/tests/legacy-capability.test.mjs",
        "implementation/scripts/validate-trusted-input.py",
        "implementation/standard-conformance/authorization-service-binding.json",
        "implementation/d65-chain.json",
        "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/AUTH-DOWNSTREAM-ENDPOINT-SCOPE.v1-owner-decision.md",
    }
    for root in (*ROOTS, "runtime-adapter", "sqlite-provider"):
        base = IMPL / root
        for path in base.rglob("*"):
            if "target" in path.relative_to(base).parts:
                continue
            require(not path.is_symlink(), f"symlinked source input: {path}")
            if path.is_file():
                paths.add(path.relative_to(AUTH).as_posix())
    for crate in set().union(*(set(names) for names in closures.values())):
        base = IMPL / crate
        for path in base.rglob("*"):
            if "target" in path.relative_to(base).parts:
                continue
            require(not path.is_symlink(), f"symlinked source input: {path}")
            if path.is_file():
                paths.add(path.relative_to(AUTH).as_posix())
    return {relative: sha(AUTH / relative) for relative in sorted(paths)}


def current_controls() -> dict:
    raw = run(["node", "--test", "--test-reporter=tap",
               str(IMPL / "runtime-adapter/tests/legacy-capability.test.mjs")])
    require("# pass 2" in raw and "# fail 0" in raw, "raw capability control incomplete")
    inspection = subprocess.run([sys.executable, str(IMPL / "scripts/inspect-evidence-freshness.py")],
                                cwd=REPO, text=True, capture_output=True, timeout=60, check=False)
    require(inspection.returncode in (0, 1), "freshness inspector failed")
    freshness = json.loads(inspection.stdout)
    references = freshness.get("references")
    require(isinstance(references, dict), "freshness references missing")
    scope_keys = ("service_binding.owner_downstream_endpoint_scope",
                  "d65_chain.owner_downstream_endpoint_scope")
    require(all(isinstance(references.get(key), dict)
                and references[key].get("status") == "current" for key in scope_keys),
            "owner-scope D65 evidence stale")
    sources = freshness.get("sources")
    require(isinstance(sources, dict), "freshness sources missing")
    stale = sorted(key for table in (sources, references) for key, row in table.items()
                   if row.get("status") != "current")
    require(freshness.get("status") == ("stale" if stale else "current")
            and stale == ["runtime_evidence.adapter_source"],
            f"unexpected evidence freshness state: {stale}")
    d65 = json.loads(read_json(IMPL / "d65-chain.json"))
    service = json.loads(read_json(IMPL / "standard-conformance/authorization-service-binding.json"))
    require(d65.get("runtime_guarantees_observed") is False
            and service.get("runtime_guarantees_observed") is False,
            "runtime guarantee claim escalated")
    return {"legacy_raw_capability_test": "pass-2", "owner_scope_freshness": "current",
            "overall_freshness": "stale", "stale_record_refs": stale,
            "runtime_guarantees_observed": False}


def read_json(path: Path) -> str:
    sha(path)
    return path.read_text()


def expected_binding() -> dict:
    archive = historical_archive()
    closures = {root: closure(root) for root in ROOTS}
    path = selected_path()
    sources = source_inventory(closures)
    controls = current_controls()
    require(archive == historical_archive(), "historical archive changed during replay")
    require(closures == {root: closure(root) for root in ROOTS}, "selected closures changed during replay")
    require(path == selected_path(), "selected source path changed during replay")
    require(sources == source_inventory(closures), "current source inputs changed during replay")
    return {
        "schema_version": "auth-foundation.current-technical-evidence-successor/v5-candidate",
        "binding_id": "AUTH-CURRENT-TECHNICAL-EVIDENCE-005",
        "historical_preimages": archive,
        "historical_provenance_limit": "Seven Git HEAD blobs verified; two observed-local bindings are exact bytes only.",
        "selected_normal_cargo_closures": closures,
        "selected_path": path,
        "current_sources": sources,
        "current_controls": controls,
        "result": "local-current-technical-v5-candidate-pass",
        "authority_effect": "none",
        "runtime_guarantees_observed": False,
        "claim_limit": "Selected normal Cargo closures, current source shapes and hashes, default-off raw API compile probes, historical preimages, and current owner-scope D65 links only. An older runtime-evidence source hash is stale. Explicit legacy opt-in remains callable outside selected roots. No all-path or runtime proof, semantic admission, TDE/F5/EVF satisfaction, deployment, or publication.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--print-expected", action="store_true", help="print candidate JSON; never write")
    args = parser.parse_args()
    expected = expected_binding()
    if args.print_expected:
        print(json.dumps(expected, indent=2))
    else:
        require(json.loads(read_json(BINDING)) == expected,
                "current v5 technical binding differs from verified inputs or results")
        print(json.dumps({"status": "pass", "binding": str(BINDING.relative_to(AUTH)),
                          "runtime_guarantees_observed": False}, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
