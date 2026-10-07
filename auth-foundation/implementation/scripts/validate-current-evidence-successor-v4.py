#!/usr/bin/env python3
"""Fail-closed local Auth evidence lineage and selected-service technical replay."""

from __future__ import annotations

import argparse
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


AUTH = Path(__file__).resolve().parents[2]
REPO = AUTH.parent
IMPL = AUTH / "implementation"
TOOLCHAIN = REPO / "tools/toolchain/run"
PACKAGE = IMPL / "current-evidence-successor-v4"
PREIMAGES = IMPL / "current-evidence-successor-v3/preimages"
BINDING = PACKAGE / "binding.json"
OWNER_SCOPE_PATH = "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/AUTH-DOWNSTREAM-ENDPOINT-SCOPE.v1-owner-decision.md"
MANIFEST_SHA256 = "1e944ee7ab4e88611a511326601a83494276f020bc9a4a2a003f1419bfe90955"
V2_BINDING_SHA256 = "57919ac37736fbcdd0611fea95b70ff911c9ad1c7fb85481ff02b19edba66c6a"
ARCHIVE_COMMIT = "fb23addf01acc82d9ae6db99eddde9ead53e3e1a"
EXPECTED_CRATES = frozenset({
    "authorization-metadata-reader", "authorization-ready-authority",
    "authorization-ready-decision", "authorization-service", "authorization-state-model",
    "authorization-state-reader", "command-boundary-runtime-v2", "standard-runtime",
    "trusted-input-reader", "trusted-input-runtime",
})
GENERATED = frozenset({"command-boundary-runtime-v2", "standard-runtime", "trusted-input-runtime"})
TEST_ONLY_CRATES = frozenset({"command-boundary-runtime"})
EXTRA_CURRENT = (
    "implementation/authorization-api/Cargo.toml",
    "implementation/authorization-api/Cargo.lock",
    "implementation/authorization-api/src/lib.rs",
    "implementation/authorization-api/tests/production_pool.rs",
    "implementation/tenant-bridge/Cargo.toml",
    "implementation/tenant-bridge/Cargo.lock",
    "implementation/tenant-bridge/src/main.rs",
    "implementation/authentication-prototype/bridge/Cargo.toml",
    "implementation/authentication-prototype/bridge/Cargo.lock",
    "implementation/authentication-prototype/bridge/src/main.rs",
    "implementation/authentication-https/bridge/Cargo.toml",
    "implementation/authentication-https/bridge/Cargo.lock",
    "implementation/authentication-https/bridge/src/main.rs",
    "implementation/scripts/validate-current-evidence-successor-v4.py",
    "implementation/scripts/test-current-evidence-successor-v4.py",
    "implementation/scripts/validate-current-evidence-successor-v3.py",
    "implementation/scripts/test-current-evidence-successor-v3.py",
    "implementation/scripts/validate-bridge-decision-isolation.py",
    "implementation/scripts/test-bridge-decision-isolation.py",
    "implementation/scripts/validate-current-evidence-successor-v2.py",
    "implementation/scripts/validate-trusted-input.py",
    "implementation/scripts/inspect-evidence-freshness.py",
    "implementation/scripts/test_inspect_evidence_freshness.py",
    "implementation/scripts/validate-current-runtime-successor.py",
    "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-concrete-call-certificate.mjs",
    "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-concrete-pool-successor.mjs",
    "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-concrete-pool-successor.test.mjs",
    "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-native-endpoint-inventory.mjs",
    "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-native-endpoint-inventory.test.mjs",
    "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v2-rust-extract.mjs",
    "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v2-wrapper-extract.mjs",
    "implementation/current-evidence-successor-v4/README.md",
    "implementation/current-evidence-successor-v3/README.md",
    "implementation/current-runtime-successor-v1/binding.json",
    "implementation/command-boundary-source-v2/project.json",
    "implementation/standard-conformance/trusted-input-system-ontology.json",
    "implementation/standard-conformance/authorization-service-binding.json",
    "implementation/standard-conformance/trusted-input-evidence.json",
    "implementation/standard-conformance/provider-binding.json",
    "implementation/provider-construction-binding.json",
    "implementation/trusted-input-construction-binding.json",
    "implementation/d65-chain.json",
    "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/BUSINESS-MEANING.v1-clarified-accepted.json",
    OWNER_SCOPE_PATH,
    "formalization/decisions/AF-ADMIT-AUTHORIZATION-COMMAND-001/business-meaning-v1-clarified-acceptance.json",
)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def read_regular(path: Path) -> bytes:
    require(path.is_file() and not path.is_symlink(), f"missing or symlinked input: {path}")
    return path.read_bytes()


def run(command: list[str], cwd: Path, *, timeout: int = 240) -> str:
    env = dict(os.environ)
    env["TMPDIR"] = "/dev/shm" if Path("/dev/shm").is_dir() else env.get("TMPDIR", "/tmp")
    result = subprocess.run(command, cwd=cwd, env=env, text=True, capture_output=True,
                            timeout=timeout, check=False)
    if result.returncode:
        raise ValueError(f"{cwd.name}: {' '.join(command)}: {(result.stderr or result.stdout)[-2400:]}")
    return result.stdout


def archive_preimages() -> dict[str, str]:
    raw = read_regular(PREIMAGES / "manifest.json")
    require(sha(raw) == MANIFEST_SHA256, "preimage manifest changed")
    manifest = json.loads(raw)
    rows = manifest.get("entries")
    require(isinstance(rows, list) and len(rows) == 9, "preimage count changed")
    require(manifest.get("git_head_commit") == ARCHIVE_COMMIT, "preimage provenance commit changed")
    require(manifest.get("pin_source") == "implementation/current-evidence-successor-v2/binding.json#historical_snapshots",
            "preimage pin source changed")
    require({p.name for p in PREIMAGES.iterdir()} == {"manifest.json", *(row["archived_relative_path"] for row in rows)},
            "preimage archive file set changed")
    binding_raw = read_regular(IMPL / "current-evidence-successor-v2/binding.json")
    require(sha(binding_raw) == V2_BINDING_SHA256, "v2 binding substituted")
    v2 = json.loads(binding_raw)
    pins = v2.get("historical_snapshots")
    require(isinstance(pins, dict) and len(pins) == 8, "v2 historical pin set changed")
    require(len({row["original_logical_path"] for row in rows}) == 9, "duplicate preimage logical path")
    expected_paths = set(pins) | {"implementation/current-evidence-successor-v2/binding.json"}
    require({row["original_logical_path"] for row in rows} == expected_paths, "preimage logical paths changed")
    hashes: dict[str, str] = {}
    git_rows = 0
    for row in rows:
        logical = row["original_logical_path"]
        value = row["sha256"]
        require(re.fullmatch(r"[a-f0-9]{64}", value) is not None, f"invalid preimage SHA: {logical}")
        require(row["archived_relative_path"] == f"{value}.json", f"preimage archive name changed: {logical}")
        actual = read_regular(PREIMAGES / row["archived_relative_path"])
        require(sha(actual) == value, f"preimage missing or modified: {logical}")
        if logical in pins:
            require(pins[logical] == value and row.get("v2_historical_pin_sha256") == value,
                    f"v2 pin substitution: {logical}")
        else:
            require(value == V2_BINDING_SHA256 and "v2_historical_pin_sha256" not in row,
                    "v2 binding archive changed")
        provenance = row["provenance"]
        if provenance["kind"] == "git-head-blob":
            git_rows += 1
            require(provenance["git_head_commit"] == ARCHIVE_COMMIT, f"commit changed: {logical}")
            git_path = f"auth-foundation/{logical}"
            blob = run(["git", "rev-parse", f"{ARCHIVE_COMMIT}:{git_path}"], REPO).strip()
            require(blob == provenance["git_blob_oid"], f"Git blob OID changed: {logical}")
            committed = subprocess.run(["git", "show", f"{ARCHIVE_COMMIT}:{git_path}"], cwd=REPO,
                                       capture_output=True, check=False)
            require(committed.returncode == 0 and committed.stdout == actual,
                    f"Git commit/preimage bytes differ: {logical}")
        else:
            require(provenance["kind"] == "observed-local-untracked" and logical in {
                "implementation/current-evidence-successor-v1/binding.json",
                "implementation/current-evidence-successor-v2/binding.json",
            }, f"unsupported preimage provenance: {logical}")
        hashes[logical] = value
    require(git_rows == 7, "Git provenance count changed")
    return hashes


def cargo_graph() -> tuple[tuple[str, ...], dict[str, dict[str, str]]]:
    output = run([str(TOOLCHAIN), "cargo", "metadata", "--locked", "--offline", "--format-version", "1",
                  "--manifest-path", str(IMPL / "authorization-service/Cargo.toml")], REPO)
    metadata = json.loads(output)
    packages = {p["id"]: p for p in metadata["packages"]}
    nodes = {n["id"]: n for n in metadata["resolve"]["nodes"]}
    roots = [p["id"] for p in packages.values() if Path(p["manifest_path"]) == IMPL / "authorization-service/Cargo.toml"]
    require(len(roots) == 1, "service Cargo root unresolved")
    reached: set[str] = set()
    queue = roots[:]
    while queue:
        package_id = queue.pop()
        if package_id in reached:
            continue
        reached.add(package_id)
        queue.extend(edge["pkg"] for edge in nodes[package_id]["deps"])
    local = {pid: packages[pid] for pid in reached
             if Path(packages[pid]["manifest_path"]).is_relative_to(IMPL)}
    names = {Path(p["manifest_path"]).parent.name for p in local.values()}
    require(names == EXPECTED_CRATES and len(local) == len(EXPECTED_CRATES),
            f"selected local crate set changed: missing={sorted(EXPECTED_CRATES - names)} extra={sorted(names - EXPECTED_CRATES)}")
    require("trusted-input-provider" not in names, "legacy trusted-input provider entered selected closure")
    require("trusted-boundary" not in names and "sqlite-provider" not in names,
            "legacy decision facade entered selected service closure")
    edges: dict[str, dict[str, str]] = {}
    for pid, package in local.items():
        crate = Path(package["manifest_path"]).parent
        name = crate.name
        data = tomllib.loads(read_regular(crate / "Cargo.toml").decode())
        declared: dict[str, str] = {}
        tables = [data.get(key, {}) for key in ("dependencies", "build-dependencies", "dev-dependencies")]
        for target in data.get("target", {}).values():
            tables.extend(target.get(key, {}) for key in ("dependencies", "build-dependencies", "dev-dependencies"))
        for table in tables:
            for alias, spec in table.items():
                if not isinstance(spec, dict) or "path" not in spec:
                    continue
                target = (crate / spec["path"]).resolve()
                require(target.is_relative_to(IMPL) and target.is_dir(), f"local Cargo path escapes: {name}/{alias}")
                alias = alias.replace("-", "_")
                require(alias not in declared or declared[alias] == target.name,
                        f"ambiguous local Cargo alias: {name}/{alias}")
                declared[alias] = target.name
        # Package metadata includes declared dev/build edges even when this
        # service-root resolve does not activate their features or tests.
        resolved = {}
        for dependency in package["dependencies"]:
            if dependency.get("path") is None:
                continue
            dep_path = Path(dependency["path"])
            if dep_path.is_relative_to(IMPL):
                alias = (dependency.get("rename") or dependency["name"]).replace("-", "_")
                resolved[alias] = dep_path.name
        active = {}
        for edge in nodes[pid]["deps"]:
            dep = packages[edge["pkg"]]
            dep_path = Path(dep["manifest_path"]).parent
            if dep_path.is_relative_to(IMPL):
                active[edge["name"]] = dep_path.name
        require(declared == resolved, f"direct local Cargo edges differ: {name}: declared={declared} resolved={resolved}")
        require(set(resolved.values()) <= names | TEST_ONLY_CRATES,
                f"uninventoried declared local Cargo target: {name}")
        require(all(declared.get(alias) == target for alias, target in active.items()),
                f"active local Cargo edge not declared: {name}")
        require(set(active.values()) <= names, f"unreached active local dependency: {name}")
        edges[name] = dict(sorted(resolved.items()))
    return tuple(sorted(names)), dict(sorted(edges.items()))


def public_api_closure() -> tuple[str, ...]:
    output = run([str(TOOLCHAIN), "cargo", "metadata", "--locked", "--offline", "--format-version", "1",
                  "--manifest-path", str(IMPL / "authorization-api/Cargo.toml")], REPO)
    metadata = json.loads(output)
    packages = {p["id"]: p for p in metadata["packages"]}
    nodes = {n["id"]: n for n in metadata["resolve"]["nodes"]}
    roots = [p["id"] for p in packages.values()
             if Path(p["manifest_path"]) == IMPL / "authorization-api/Cargo.toml"]
    require(len(roots) == 1, "public API Cargo root unresolved")
    reached: set[str] = set()
    queue = roots[:]
    while queue:
        package_id = queue.pop()
        if package_id in reached:
            continue
        reached.add(package_id)
        queue.extend(edge["pkg"] for edge in nodes[package_id]["deps"])
    names = {Path(packages[pid]["manifest_path"]).parent.name for pid in reached
             if Path(packages[pid]["manifest_path"]).is_relative_to(IMPL)}
    expected = EXPECTED_CRATES | {"authorization-api"}
    require(names == expected,
            f"public API local closure changed: missing={sorted(expected - names)} extra={sorted(names - expected)}")
    require(not {"trusted-boundary", "sqlite-provider", "trusted-input-provider"} & names,
            "legacy decision facade entered public API closure")
    return tuple(sorted(names))


def source_inventory(crates: tuple[str, ...]) -> dict[str, str]:
    paths = set(EXTRA_CURRENT)
    for name in (*crates, *sorted(TEST_ONLY_CRATES), "authorization-api"):
        root = IMPL / name
        for path in root.rglob("*"):
            if "target" in path.relative_to(root).parts:
                continue
            require(not path.is_symlink(), f"symlinked selected crate input: {path}")
            if path.is_file():
                paths.add(path.relative_to(AUTH).as_posix())
    for path in (IMPL / "command-boundary-source-v2").rglob("*"):
        if path.is_file():
            paths.add(path.relative_to(AUTH).as_posix())
    # This facade is not selected Cargo closure. Pin its exact current inputs separately.
    for path in (IMPL / "trusted-input-provider").rglob("*"):
        if "target" not in path.relative_to(IMPL / "trusted-input-provider").parts and path.is_file():
            paths.add(path.relative_to(AUTH).as_posix())
    return {relative: sha(read_regular(AUTH / relative)) for relative in sorted(paths)}


def rust_body(source: str, signature: str) -> str:
    # Narrow source-shape check, not a Rust parser or a control-flow proof.
    # Remove comments and ordinary string contents so tokens inside them cannot
    # satisfy an edge check. Exact source bytes are pinned separately below.
    executable = re.sub(r'"(?:\\.|[^"\\])*"|//[^\n]*|/\*.*?\*/',
                        lambda match: re.sub(r"[^\n]", " ", match.group()), source, flags=re.S)
    require(executable.count(signature) == 1, f"selected Rust item changed: {signature}")
    start = executable.index(signature)
    opening = executable.find("{", start + len(signature))
    require(opening >= 0, f"selected Rust body missing: {signature}")
    depth = 0
    for index in range(opening, len(executable)):
        if executable[index] == "{":
            depth += 1
        elif executable[index] == "}":
            depth -= 1
            if depth == 0:
                return executable[opening + 1:index]
    raise ValueError(f"selected Rust body unclosed: {signature}")


def source_path_checks() -> dict:
    sources = {name: read_regular(IMPL / name).decode() for name in (
        "authorization-api/src/lib.rs", "authorization-service/src/lib.rs",
        "authorization-ready-authority/src/lib.rs", "authorization-ready-decision/src/lib.rs",
        "authorization-metadata-reader/src/lib.rs", "authorization-state-reader/src/lib.rs",
        "trusted-input-reader/src/lib.rs",
    )}
    api = sources["authorization-api/src/lib.rs"]
    service = sources["authorization-service/src/lib.rs"]
    authority = sources["authorization-ready-authority/src/lib.rs"]
    decision = sources["authorization-ready-decision/src/lib.rs"]
    for name, source in (("API", api), ("service", service), ("READY authority", authority),
                         ("READY decision", decision)):
        require("cfg!(" not in source, f"selected {name} configuration-dependent path")
    require("pub trait AuthorizationEngine" not in api
            and "#[cfg(test)]\ntrait AuthorizationEngine: Send + 'static" in api
            and "#[cfg(test)]\ntype PoolEngine = Box<dyn AuthorizationEngine>;" in api
            and "#[cfg(not(test))]\ntype PoolEngine = SqliteAuthService<SystemDecisionClock>;" in api
            and "engines: Mutex<Vec<PoolEngine>>" in api
            and "engines: Vec<PoolEngine>" in api,
            "public API production concrete pool or test-only capability changed")
    engine = rust_body(api, "impl AuthorizationEngine for SqliteAuthService<SystemDecisionClock>")
    require(engine.count("SqliteAuthService::authorize(self, request)") == 1,
            "public API test engine changed")
    require("#[cfg(test)]\nimpl AuthorizationEngine for SqliteAuthService<SystemDecisionClock>" in api
            and "#[cfg(not(test))]\nfn pool_engine(service: SqliteAuthService<SystemDecisionClock>) -> PoolEngine {\n    service\n}" in api,
            "public API production pool constructor changed")
    api_builder = rust_body(api, "pub fn authorization_runtime_from_database(")
    require(api_builder.count("SqliteAuthService::open_with_epoch_allocator(") == 1
            and api_builder.count("engines.push(pool_engine(service))") == 1
            and api_builder.count("AuthorizationRuntime::from_engines(") == 1,
            "public API production engine construction changed")
    integration = read_regular(IMPL / "authorization-api/tests/production_pool.rs").decode()
    require("authorization_runtime_from_database" in integration
            and "BinaryAuthorizationDecision::Allow" in integration
            and "BinaryAuthorizationDecision::Deny" in integration,
            "non-test production pool integration control changed")
    api_route = rust_body(api, "pub fn authorization_router(runtime: AuthorizationRuntime)")
    require(".route(AUTHORIZE_PATH, post(authorize))" in api_route,
            "public API authorization route changed")
    api_handler = rust_body(api, "async fn authorize(State(state): State<ApiState>, request: Request<Body>)")
    require(api_handler.count("state.runtime.authorize(request.into()).await") == 1,
            "public API handler delegation changed")
    api_worker = rust_body(api, "pub async fn authorize(\n")
    require(api_worker.count("tokio::task::spawn_blocking(") == 1
            and api_worker.count("engine.authorize(request)") == 1,
            "public API worker delegation changed")
    service_entry = rust_body(service, "pub fn authorize(\n")
    require(service_entry.count("self.authorize_detailed(request).decision") == 1,
            "selected service entry changed")
    service_detailed = rust_body(service, "fn authorize_detailed(")
    require(service_detailed.count("authorize_in_epoch(&epoch, request)") == 1,
            "selected service epoch delegation changed")
    service_epoch = rust_body(service, "fn authorize_in_epoch(")
    require(service_epoch.count("with_ready_in_transaction(") == 1
            and service_epoch.count("authorize_ready_decision(ready)") == 1
            and service_epoch.count("downstream_port_calls += 1") == 1,
            "selected service READY continuation changed")
    require(service_epoch.index("with_ready_in_transaction(") < service_epoch.index("authorize_ready_decision(ready)"),
            "selected service READY call order changed")
    authority_entry = rust_body(authority, "pub fn with_ready_in_transaction<")
    gate = "gate::admit_authorization_command(&context)"
    continuation = "AdmissionOutcome::Ready(continuation(ready))"
    require(authority_entry.count(gate) == 1 and authority_entry.count(continuation) == 1
            and authority_entry.index(gate) < authority_entry.index(continuation),
            "READY authority gate/continuation changed")
    require(authority_entry.count("let ready = ReadyAuthorization {") == 1
            and authority_entry.index("let ready = ReadyAuthorization {") > authority_entry.index(gate),
            "READY authority value issuance changed")
    require("pub struct ReadyAuthorization<'transaction, 'connection>" in authority
            and "#[derive(Clone" not in authority[authority.index("pub struct ReadyAuthorization"):authority.index("impl ReadyAuthorization")],
            "READY authority type changed")
    require(len(re.findall(r"\bpub fn authorize\s*\(", decision)) == 1,
            "READY decision public entrypoint set changed")
    decision_entry = rust_body(decision, "pub fn authorize(ready: ReadyAuthorization<'_, '_>)")
    require(decision_entry.count("kernel::authorize(&context)") == 1
            and "let command = ready.command()" in decision_entry
            and "let state = ready.state()" in decision_entry,
            "READY decision bridge changed")
    for name, method in (("authorization-metadata-reader", "pub fn authentication_metadata("),
                         ("authorization-state-reader", "pub fn resolve_authorization_state_in_transaction"),
                         ("trusted-input-reader", "pub fn resolve_in_transaction(")):
        require(method in sources[f"{name}/src/lib.rs"], f"read-only entrypoint changed: {name}")
    return {"selected_public_entry_path": ["authorization-api/authorization_router",
                                          "authorization-api/AuthorizationRuntime::authorize",
                                          "authorization-service/SqliteAuthService::authorize"],
            "selected_admission_path": ["authorization-service/authorize_in_epoch",
                                        "authorization-ready-authority/with_ready_in_transaction",
                                        "command-boundary-runtime-v2/admit_authorization_command"],
            "post_ready_decision_path": ["authorization-ready-authority/ReadyAuthorization",
                                         "authorization-ready-decision/authorize", "standard-runtime/authorize"],
            "direct_readers": ["authorization-metadata-reader", "authorization-state-reader", "trusted-input-reader"],
            "source_check_scope": "cfg-selected concrete production pool and integration control, selected-item source shape, and exact current source hashes; not Rust semantic or all-path proof",
            "legacy_trusted_input_provider": "tracked-unselected-facade",
            "all_native_entrypoints_closed": False}


def inventory(output: str, *, allow_empty: bool = False) -> dict:
    names = sorted(line.rsplit(": test", 1)[0] for line in output.splitlines() if line.endswith(": test"))
    require((allow_empty or bool(names)) and len(names) == len(set(names)), "empty or duplicate Rust test inventory")
    return {"test_count": len(names), "test_names_sha256": sha(("\n".join(names) + "\n").encode()), "test_runs": 2}


def replay() -> tuple[dict, str]:
    # Reuse only the prior verifier's standalone replay helpers; its stale wiring/binding are never checked.
    import importlib.util
    script = IMPL / "scripts/validate-current-evidence-successor-v2.py"
    spec = importlib.util.spec_from_file_location("auth_v2_replay_helpers", script)
    require(spec is not None and spec.loader is not None, "v2 replay helper unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    current = json.loads(run([sys.executable, str(IMPL / "scripts/validate-current-runtime-successor.py")], REPO,
                             timeout=600))
    require(current.get("status") == "pass", "current CLI replay failed")
    return current, module.replay_v2_projection()


def v4b_predecessor() -> dict:
    script = AUTH / "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-concrete-call-certificate.mjs"
    return {"status": "stale-predecessor", "executed_as_current_verifier": False,
            "certificate_source_sha256": sha(read_regular(script)),
            "reason": "certificate targets retired wrapper/adapter source path; no result transfers to current READY path",
            "runtime_guarantees_observed": False}


def v4b_current_successor() -> dict:
    script = AUTH / "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-concrete-pool-successor.mjs"
    result = json.loads(run(["node", str(script)], REPO, timeout=180))
    require(result.get("schema_version") == "auth-foundation.v4b-concrete-pool-successor/v3-candidate"
            and result.get("status") == "indeterminate"
            and result.get("runtime_guarantees_observed") is False,
            "current concrete pool successor changed")
    return {"status": "indeterminate", "source_sha256": sha(read_regular(script)),
            "runtime_guarantees_observed": False,
            "claim_limit": "bounded source/Cargo projection only; no all-path runtime proof"}


def owner_scope_lineage() -> dict:
    scope_sha = sha(read_regular(AUTH / OWNER_SCOPE_PATH))
    service = json.loads(read_regular(IMPL / "standard-conformance/authorization-service-binding.json"))
    selected = service.get("owner_downstream_endpoint_scope")
    require(isinstance(selected, dict) and selected.get("path") == OWNER_SCOPE_PATH
            and selected.get("sha256") == scope_sha,
            "authorization service owner-scope lineage changed")
    chain = json.loads(read_regular(IMPL / "d65-chain.json"))
    stages = chain.get("stages")
    require(isinstance(stages, list), "D65 owner-scope stages changed")
    rows = [row for row in stages if isinstance(row, dict)
            and row.get("stage") == "owner_downstream_endpoint_scope"]
    require(rows == [{"stage": "owner_downstream_endpoint_scope",
                      "state": "owner-selected-open-inventory-not-runtime-proof",
                      "path": OWNER_SCOPE_PATH, "sha256": scope_sha}],
            "D65 owner-scope lineage changed")
    freshness = json.loads(run([sys.executable, str(IMPL / "scripts/inspect-evidence-freshness.py")],
                               REPO, timeout=60))
    references = freshness.get("references")
    keys = ("service_binding.owner_downstream_endpoint_scope", "d65_chain.owner_downstream_endpoint_scope")
    require(freshness.get("status") == "current" and isinstance(references, dict)
            and all(isinstance(references.get(key), dict)
                    and references[key].get("path") == OWNER_SCOPE_PATH
                    and references[key].get("expected_sha256") == scope_sha
                    and references[key].get("actual_sha256") == scope_sha
                    and references[key].get("status") == "current" for key in keys),
            "owner-scope D65 freshness changed")
    return {"status": "current", "path": OWNER_SCOPE_PATH, "sha256": scope_sha,
            "service_binding": "current", "d65_chain": "current", "freshness": "current",
            "claim_limit": "exact selected owner-scope lineage and read-only freshness; not semantic or runtime proof"}


def bridge_decision_isolation() -> dict:
    report = json.loads(run([sys.executable, str(IMPL / "scripts/validate-bridge-decision-isolation.py")],
                            REPO, timeout=180))
    bridges = report.get("bridges")
    require(report.get("status") == "pass" and report.get("runtime_guarantees_observed") is False
            and isinstance(bridges, list) and len(bridges) == 3
            and all(isinstance(row, dict) for row in bridges)
            and {row.get("bridge") for row in bridges} == {
                "tenant-bridge", "authentication-prototype/bridge", "authentication-https/bridge"
            } and all(row.get("legacy_decision_crates_reachable") is False for row in bridges),
            "selected bridge decision isolation changed")
    for row in bridges:
        source = IMPL / row["bridge"] / "src/main.rs"
        require(row.get("source_sha256") == sha(read_regular(source)),
                f"selected bridge source digest changed: {row['bridge']}")
    return {"status": "pass", "bridges": [{"path": row["bridge"], "source_sha256": row["source_sha256"]}
                                         for row in bridges],
            "legacy_decision_crates_reachable": False,
            "claim_limit": "selected bridge Cargo closure and source spelling only; not an all-path runtime proof"}


def verify_crates(crates: tuple[str, ...]) -> dict:
    results = {}
    for name in crates:
        original = IMPL / name
        # Several generated standalone crates intentionally have no Cargo.lock.
        # Copy them to run-local scratch so Cargo's offline lock generation
        # cannot modify current source or create a new repository file.
        with tempfile.TemporaryDirectory(prefix=f"auth-v3-{name}-") as scratch:
            has_lock = (original / "Cargo.lock").is_file()
            cwd = original if has_lock else Path(scratch) / name
            if not has_lock:
                shutil.copytree(original, cwd, ignore=shutil.ignore_patterns("target"))
            flags = ["--locked", "--offline"] if has_lock else ["--offline"]
            fmt = "GENERATED_EXCEPTION_EXACT_REPLAY" if name == "trusted-input-runtime" else "PASS"
            if fmt == "PASS":
                run([str(TOOLCHAIN), "cargo", "fmt", "--check"], cwd)
            run([str(TOOLCHAIN), "cargo", "check", *flags, "--all-targets"], cwd, timeout=600)
            strict_env = dict(os.environ, RUSTFLAGS="-Dwarnings")
            strict = subprocess.run([str(TOOLCHAIN), "cargo", "check", *flags, "--all-targets"],
                                    cwd=cwd, env=strict_env, text=True, capture_output=True, timeout=600, check=False)
            require(strict.returncode == 0, f"{name}: strict Cargo check failed: {(strict.stderr or strict.stdout)[-2400:]}")
            if name not in GENERATED:
                run([str(TOOLCHAIN), "cargo", "clippy", *flags, "--all-targets", "--", "-D", "warnings"],
                    cwd, timeout=600)
            for _ in range(2):
                run([str(TOOLCHAIN), "cargo", "test", *flags, "--all-targets"], cwd, timeout=600)
            names = inventory(run([str(TOOLCHAIN), "cargo", "test", *flags, "--all-targets", "--", "--list"],
                                  cwd, timeout=600), allow_empty=name in GENERATED or name == "authorization-state-model")
            results[name] = {**names, "fmt": fmt, "check": "PASS", "strict_check": "PASS",
                             "clippy": "SKIPPED_GENERATED" if name in GENERATED else "PASS",
                             "lock_mode": "locked-offline" if has_lock else "scratch-offline-lockless"}
            if name == "authorization-service":
                run([str(TOOLCHAIN), "cargo", "check", "--release", *flags, "--all-targets"],
                    cwd, timeout=600)
                run([str(TOOLCHAIN), "cargo", "test", "--release", *flags, "--all-targets"],
                    cwd, timeout=600)
                results[name]["release_check_and_test"] = "PASS"
    return results


def expected_binding() -> dict:
    archive = archive_preimages()
    crates, edges = cargo_graph()
    api_crates = public_api_closure()
    architecture = source_path_checks()
    before = source_inventory(crates)
    v4b = v4b_predecessor()
    v4b_current = v4b_current_successor()
    owner_scope = owner_scope_lineage()
    bridges = bridge_decision_isolation()
    cli, projection = replay()
    results = verify_crates(crates)
    require(archive == archive_preimages(), "preimages changed during run")
    require((crates, edges) == cargo_graph(), "selected Cargo graph changed during run")
    require(api_crates == public_api_closure(), "public API Cargo graph changed during run")
    require(before == source_inventory(crates), "current Auth inputs changed during run")
    require(architecture == source_path_checks(), "selected source path changed during run")
    require(v4b == v4b_predecessor(), "stale V4b predecessor bytes changed during run")
    require(v4b_current == v4b_current_successor(), "current V4b source projection changed during run")
    require(owner_scope == owner_scope_lineage(), "owner-scope lineage changed during run")
    require(bridges == bridge_decision_isolation(), "selected bridge decision isolation changed during run")
    return {
        "schema_version": "auth-foundation.current-technical-evidence-successor/v4-candidate",
        "binding_id": "AUTH-CURRENT-TECHNICAL-EVIDENCE-004",
        "historical_preimages": archive,
        "historical_provenance_limit": "Seven Git HEAD blobs verified; v1 and v2 bindings are exact observed-local bytes only, not proven earlier chronology.",
        "current_sources": before,
        "selected_cargo_closure": {"root": "authorization-service", "crates": list(crates), "local_edges": edges},
        "public_api_cargo_closure": {"root": "authorization-api", "crates": list(api_crates)},
        "architecture": architecture,
        "verification": {"current_cli_replay": cli["status"], "v2_clean_projection": projection,
                         "v4b_predecessor": v4b, "v4b_current_successor": v4b_current,
                         "owner_scope_lineage": owner_scope,
                         "bridge_decision_isolation": bridges,
                         "crates": results},
        "result": "local-current-technical-v4-candidate-pass",
        "authority_effect": "none",
        "runtime_guarantees_observed": False,
        "claim_limit": "Selected service-root, public API-root, and three bridge local Cargo closures, cfg-selected concrete production API pool plus non-test integration control, selected-item source-shape checks, exact owner-scope lineage/freshness, and exact service replay only; stale V4b certificate does not transfer; no all-native-entrypoint closure, semantic admission, TDE/F5/EVF satisfaction, publication, deployment, or runtime guarantee.",
    }


def verify(record: dict, expected: dict) -> None:
    require(record == expected, "current v4 technical binding differs from verified inputs or results")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--print-expected", action="store_true", help="print candidate JSON; never write")
    args = parser.parse_args()
    expected = expected_binding()
    if args.print_expected:
        print(json.dumps(expected, indent=2))
    else:
        verify(json.loads(read_regular(BINDING)), expected)
        print(json.dumps({"status": "pass", "binding": str(BINDING.relative_to(AUTH)),
                          "authority_effect": "none", "runtime_guarantees_observed": False}, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)

