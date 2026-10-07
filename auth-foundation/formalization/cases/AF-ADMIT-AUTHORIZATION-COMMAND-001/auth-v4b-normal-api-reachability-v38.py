#!/usr/bin/env python3
"""Finite in-process HTTP-to-policy observation in copied normal Auth builds.

The selected checkout is read-only. A synthetic integration test is added only
to an exact selected-package mirror. Its executable and local MIR come from
one Cargo test build per variant, without the trace feature. This is neither a
network observation nor an all-path downstream no-call proof.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

CASE = Path(__file__).resolve().parent
sys.path.insert(0, str(CASE))
import importlib.util


def load(label: str, filename: str):
    spec = importlib.util.spec_from_file_location(label, CASE / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v37 = load("auth_v37_for_v38", "auth-v4b-normal-downstream-reachability-v37.py")
v29, v32 = v37.v29, v37.v32
ROOT = "api"
MANIFEST = "authorization-api/Cargo.toml"
API = "authorization-api/src/lib.rs"
TEST = "authorization-api/tests/v38_probe.rs"
READY = v37.DECISION_SOURCE
POLICY = v37.POLICY_SOURCE
ADMISSION_MANIFEST = "authorization-admission-service/Cargo.toml"
AUTHORITY_MANIFEST = "authorization-ready-authority/Cargo.toml"
READY_MANIFEST = v37.DECISION
POLICY_MANIFEST = v37.POLICY
SELECTED = (MANIFEST, ADMISSION_MANIFEST, AUTHORITY_MANIFEST,
            READY_MANIFEST, POLICY_MANIFEST)
FORBIDDEN_ENV = ("RUSTFLAGS", "CARGO_ENCODED_RUSTFLAGS", "CARGO_BUILD_RUSTFLAGS",
                 "CARGO_BUILD_TARGET", "RUSTC_WRAPPER", "RUSTC_WORKSPACE_WRAPPER",
                 "CARGO_TARGET_DIR")
HANDLER_ANCHOR = "    match state.runtime.authorize(request.into()).await {\n"
RUNTIME_ANCHOR = "        self.inner.metrics.requests.fetch_add(1, Ordering::Relaxed);\n"
WORKER_ANCHOR = "            let mut engine = pool.take()?;\n"
MARKERS = ("HTTP", "RUNTIME", "WORKER", "READY", "POLICY")


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def replace_once(source: str, old: str, new: str) -> str:
    require(source.count(old) == 1, "V38 source mutation anchor changed")
    return source.replace(old, new, 1)


def mutate_api(source: str) -> str:
    source = replace_once(
        source, HANDLER_ANCHOR,
        '    eprintln!("AUTH_V38_HTTP request={}", request.request_id);\n' +
        HANDLER_ANCHOR)
    source = replace_once(
        source, RUNTIME_ANCHOR,
        '        eprintln!("AUTH_V38_RUNTIME request={}", request.request_id);\n' +
        RUNTIME_ANCHOR)
    source = replace_once(
        source, WORKER_ANCHOR,
        WORKER_ANCHOR +
        '            eprintln!("AUTH_V38_WORKER request={}", request.request_id);\n')
    return source


HARNESS = r'''//! Mirror-only normal-feature in-process HTTP observation.
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use axum::body::{Body, to_bytes};
use axum::http::{Request, StatusCode, header};
use auth_foundation_authorization_admission_service::migrate_database;
use auth_foundation_authorization_api::{
    AUTHORIZE_PATH, AuthorizationApiConfig, authorization_router,
    authorization_runtime_from_database,
};
use rusqlite::Connection;
use tower::ServiceExt;

fn database_stage() -> (PathBuf, PathBuf) {
    // create_dir is exclusive: this test may only remove a directory that its
    // own process created, never an existing temp path with a guessed name.
    for attempt in 0..16 {
        let nonce = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let stage = std::env::temp_dir().join(format!(
            "auth-v38-{}-{nonce}-{attempt}", std::process::id()));
        match std::fs::create_dir(&stage) {
            Ok(()) => return (stage.clone(), stage.join("probe.sqlite")),
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(error) => panic!("create owned SQLite stage: {error}"),
        }
    }
    panic!("cannot create exclusive SQLite stage")
}

#[tokio::test]
async fn v38_http_probe() {
    let scenario = std::env::var("AUTH_V38_SCENARIO").expect("scenario");
    assert!(["allow", "duplicate"].contains(&scenario.as_str()));
    let expected = std::env::var("AUTH_V38_EXPECT").expect("expected decision");
    assert!(["ALLOW", "DENY"].contains(&expected.as_str()));
    let (stage, path) = database_stage();
    migrate_database(&path).expect("migrate");
    let expires_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() + 60;
    Connection::open(&path).expect("seed connection").execute_batch(&format!(
        "INSERT INTO auth_authentication_evidence
             (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at,
              evidence_revision, authenticated_subject_id)
         VALUES (1, 'auth-1', 'session-1', 1, 0, {expires_at}, 3, 'user-1');
         INSERT INTO auth_route_authorization_bindings
             (binding_row_id, route_id, resource, action, scope, scope_evidence_ref,
              complete, enabled, binding_revision)
         VALUES (1, 'documents.read', 'documents', 'read', 'tenant-7', 'scope-1', 1, 1, 5);
         INSERT INTO auth_roles (role_id) VALUES ('reader');
         INSERT INTO auth_role_permissions
             (role_id, resource, action, scope, authorization_revision)
         VALUES ('reader', 'documents', 'read', 'tenant-7', 7);
         INSERT INTO auth_sessions
             (session_row_id, session_id, user_id, status, authorization_revision, expires_at)
         VALUES (1, 'session-1', 'user-1', 'active', 7, {expires_at});
         INSERT INTO auth_session_active_roles
             (session_row_id, role_id, authorization_revision)
         VALUES (1, 'reader', 7);
         INSERT INTO auth_authorization_revisions (session_id, revision)
         VALUES ('session-1', 7);
         INSERT INTO auth_scope_evidence (evidence_ref, resource, action, scope, trusted)
         VALUES ('scope-1', 'documents', 'read', 'tenant-7', 1);"
    )).expect("seed");
    if scenario == "duplicate" {
        Connection::open(&path).expect("duplicate connection").execute_batch(
            "INSERT INTO auth_authentication_evidence
                 (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at,
                  evidence_revision, authenticated_subject_id)
             SELECT 2, evidence_ref, session_id, trusted, revoked, expires_at,
                    evidence_revision, authenticated_subject_id
             FROM auth_authentication_evidence WHERE evidence_row_id = 1;"
        ).expect("duplicate qualifying row");
    }
    let runtime = authorization_runtime_from_database(
        &path, AuthorizationApiConfig::new(
            1, Duration::from_secs(5), Duration::from_secs(10)).expect("config")
    ).expect("runtime");
    let router = authorization_router(runtime.clone());
    let request_id = format!("auth_v38_{scenario}");
    let body = serde_json::json!({
        "request_id": request_id,
        "authentication_evidence_ref": "auth-1",
        "route_id": "documents.read"
    });
    let request = Request::builder().method("POST").uri(AUTHORIZE_PATH)
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(body.to_string())).expect("request");
    eprintln!("AUTH_V38_CASE request={request_id}");
    let response = router.oneshot(request).await.expect("in-process HTTP response");
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(response.headers().get(header::CACHE_CONTROL).unwrap(), "no-store");
    let bytes = to_bytes(response.into_body(), 1024).await.expect("body");
    let value: serde_json::Value = serde_json::from_slice(&bytes).expect("JSON response");
    assert_eq!(value, serde_json::json!({"decision": expected}));
    let metrics = runtime.metrics();
    assert_eq!(metrics.requests, 1);
    assert_eq!(metrics.in_flight, 0, "worker must be terminal before no-marker check");
    assert_eq!((metrics.allows, metrics.denies),
               if expected == "ALLOW" { (1, 0) } else { (0, 1) });
    eprintln!("AUTH_V38_END request={request_id} decision={expected}");
    drop(runtime);
    std::fs::remove_file(&path).expect("remove DB");
    for name in ["probe.sqlite-wal", "probe.sqlite-shm"] {
        match std::fs::remove_file(stage.join(name)) {
            Ok(()) => (),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => (),
            Err(error) => panic!("remove owned SQLite sidecar: {error}"),
        }
    }
    std::fs::remove_dir(&stage).expect("remove empty owned SQLite stage");
}
'''


def markers(output: str, scenario: str, variant: str) -> list[str]:
    request = f"auth_v38_{scenario}"
    expected_decision = "ALLOW" if variant != "policy-deny" and scenario == "allow" else "DENY"
    middle = [] if variant == "clean" else ["HTTP", "RUNTIME", "WORKER"]
    if variant != "clean" and scenario == "allow":
        middle += ["READY", "POLICY"]
    expected = [f"AUTH_V38_CASE request={request}"] + [
        f"AUTH_V38_{name} request={request}" + (" epoch=1" if name == "READY" else "")
        for name in middle
    ] + [f"AUTH_V38_END request={request} decision={expected_decision}"]
    actual = []
    for line in output.splitlines():
        if "AUTH_V38_" not in line:
            continue
        require(line.count("AUTH_V38_") == 1, "V38 multiple markers on line")
        actual.append(line[line.index("AUTH_V38_"):].strip())
    require(actual == expected,
            f"V38 {variant}/{scenario} marker order, count, or request changed: {actual}")
    return actual


def artifact_binding(rows: list[dict], metadata: dict, manifests: list[str],
                     target: Path, implementation: Path) -> tuple[dict, dict[str, str]]:
    expected = v29.v7.expected_local_artifacts(metadata, manifests)
    require(set(SELECTED) <= set(expected), "selected API downstream closure absent")
    require(all("trace" not in identity["features"] for identity in expected.values()),
            "trace feature active in API probe")
    package = expected[MANIFEST]["package_id"]
    tests = [row for row in rows if row.get("package_id") == package and
             row.get("target", {}).get("name") == "v38_probe" and
             "test" in row.get("target", {}).get("kind", [])]
    require(len(tests) == 1, "V38 emitted test artifact ambiguous")
    test = tests[0]
    binary = Path(test.get("executable") or "")
    require(binary.is_file() and not binary.is_symlink() and
            binary.is_relative_to(target) and
            Path(test["target"]["src_path"]).resolve() ==
                (implementation / TEST).resolve() and
            "trace" not in test.get("features", []),
            "V38 test executable or feature binding changed")
    package_manifests = {row["id"]: Path(row["manifest_path"]).resolve()
                         for row in metadata["packages"]}
    selected_rows = []
    for row in rows:
        package_id = row.get("package_id")
        require(package_id in package_manifests,
                "V38 Cargo artifact package ID absent from metadata")
        manifest = package_manifests[package_id]
        if not manifest.is_relative_to(implementation):
            continue
        relative = str(manifest.relative_to(implementation))
        if relative not in expected:
            raise ValueError(f"unexpected local Cargo artifact: {relative}")
        target_row = row.get("target", {})
        identity = expected[relative]
        if target_row.get("name") == identity["target_name"] and \
                target_row.get("kind") == identity["target_kind"]:
            selected_rows.append({**row, "manifest_path": str(manifest)})
        else:
            require(relative == MANIFEST and row is test,
                    f"unexpected local target artifact: {relative}")
    mir, identities = v29.v7.bind_artifacts(selected_rows, expected, target)
    require(set(mir) == set(expected) and
            all(identities[name]["features"] == expected[name]["features"]
                for name in SELECTED),
            "V38 selected MIR coverage or features changed")
    return {"binary": binary, "mir": mir, "identities": identities,
            "test_package_id": package, "test_binary_sha256": v29.sha(binary.read_bytes())}, expected


def inspect_mir(mir: dict[str, str], identities: dict, variant: str) -> dict:
    joined = v32.inspect(ROOT, mir, identities) if variant == "clean" else None
    if joined is not None:
        require(joined["cross_body_execution_proven"] is False and
                len(joined["normal_mir_argument_join"]) == 3,
                "V38 clean API normal MIR handoff changed")
    reader = v37.v32.v9.v5
    api_functions = reader.functions(mir[MANIFEST])
    _, runtime = reader.selected(
        api_functions,
        "<impl at src/lib.rs:247:1: 247:26>::authorize::{closure#0}(")
    _, handler = reader.selected(api_functions, "authorize::{closure#0}(")
    _, ready = reader.selected(reader.functions(mir[READY_MANIFEST]), "authorize(")
    _, policy = reader.selected(reader.functions(mir[POLICY_MANIFEST]), "authorize(")
    expected = variant != "clean"
    for label, body, marker in (("runtime", runtime, "AUTH_V38_RUNTIME"),
                                ("handler", handler, "AUTH_V38_HTTP"),
                                ("ready", ready, "AUTH_V38_READY"),
                                ("policy", policy, "AUTH_V38_POLICY")):
        # Rust string literals are present in normal MIR only when emitted by
        # the compiled selected body. The run log supplies the actual entry.
        require(body.count(marker) == int(expected),
                f"V38 {variant}: selected {label} MIR sentinel changed")
    worker_count = mir[MANIFEST].count("AUTH_V38_WORKER")
    worker_functions = {name: body.count("AUTH_V38_WORKER")
                        for name, body in api_functions.items()
                        if "AUTH_V38_WORKER" in body}
    worker_prefix = "<impl at src/lib.rs:247:1: 247:26>::authorize::{closure#0}::{closure#0}("
    require(worker_count == (2 if expected else 0) and
            worker_functions == ({name: 1 for name in worker_functions}
                                 if expected else {}) and
            (not expected or (len(worker_functions) == 1 and
                              next(iter(worker_functions)).startswith(worker_prefix))),
            f"V38 {variant}: API worker MIR sentinel changed "
            f"({worker_count}; {worker_functions})")
    require("SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>" in
            mir[MANIFEST], "V38 API non-test worker handoff missing")
    return {"normal_mir_argument_join":
                joined["normal_mir_argument_join"] if joined is not None else None,
            "handoff_check_posture": "V32-clean" if joined is not None
                                     else "source-constrained-mutant-MIR-and-dynamic-entry",
            "cross_body_execution_proven": False,
            "selected_mir_sha256": {name: identities[name]["mir_sha256"] for name in SELECTED},
            "sentinels_in_selected_mir": expected,
            "worker_mir_literal_count": worker_count,
            "worker_normal_body_site_count": sum(worker_functions.values()),
            "worker_mir_literal_posture":
                "one-non-body-occurrence-and-one-selected-worker-body-site" if expected
                else "absent"}


def capture(implementation: Path, target: Path, manifests: list[str], variant: str) -> dict:
    require(not [name for name in FORBIDDEN_ENV if os.environ.get(name)],
            "ambient compiler/build override present")
    metadata, metadata_sha = v29.v7.root_metadata(ROOT, MANIFEST)
    lock = implementation / "authorization-api/Cargo.lock"
    lock_sha = v29.sha(lock.read_bytes())
    env = dict(os.environ)
    env["RUSTFLAGS"] = "--emit=mir,link"
    command = [str(v29.v7.TOOLCHAIN), "cargo", "test", "--offline", "--locked",
               "--no-run", "--test", "v38_probe",
               "--message-format=json-render-diagnostics", "--target-dir", str(target),
               "--manifest-path", str(implementation / MANIFEST)]
    run = subprocess.run(command, cwd=v29.v7.ROOT, env=env, capture_output=True,
                         text=True, timeout=900, check=False)
    require(run.returncode == 0,
            f"V38 {variant} Cargo test build failed: {run.stderr[-2500:]}")
    rows = v29.v7.artifact_rows(run.stdout)
    binding, _ = artifact_binding(rows, metadata, manifests, target, implementation)
    inspected = inspect_mir(binding["mir"], binding["identities"], variant)
    refreshed, refreshed_sha = v29.v7.root_metadata(ROOT, MANIFEST)
    require(refreshed == metadata and refreshed_sha == metadata_sha and
            v29.sha(lock.read_bytes()) == lock_sha,
            "V38 Cargo metadata or lock drift during build")
    return {"binary": binding["binary"], "binary_sha256": binding["test_binary_sha256"],
            "metadata_sha256": metadata_sha, "lock_sha256": lock_sha,
            "test_package_id": binding["test_package_id"],
            "mir": inspected}


def run_probe(build: dict, implementation: Path, variant: str, scenario: str) -> dict:
    require(variant in {"clean", "marked", "policy-deny"} and
            scenario in {"allow", "duplicate"}, "invalid V38 probe")
    binary = build["binary"]
    require(v29.sha(binary.read_bytes()) == build["binary_sha256"],
            "V38 executable bytes changed before run")
    env = dict(os.environ)
    env.pop("AUTH_AUTHORIZATION_TRACE_STDERR", None)
    env["AUTH_V38_SCENARIO"] = scenario
    env["AUTH_V38_EXPECT"] = ("ALLOW" if variant != "policy-deny" and
                              scenario == "allow" else "DENY")
    run = subprocess.run([str(binary), "v38_http_probe", "--exact", "--nocapture",
                          "--test-threads=1"], cwd=implementation, env=env,
                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                         text=True, timeout=60, check=False)
    require(run.returncode == 0 and "1 passed" in run.stdout,
            f"V38 {variant}/{scenario} test execution failed: {run.stdout[-2000:]}")
    observed = markers(run.stdout, scenario, variant)
    require(v29.sha(binary.read_bytes()) == build["binary_sha256"],
            "V38 executable bytes changed during run")
    return {"normal_exit": True, "scenario": scenario,
            "decision": "ALLOW" if variant != "policy-deny" and scenario == "allow" else "DENY",
            "markers": observed, "test_binary_sha256": build["binary_sha256"]}


def evaluate() -> dict:
    inventory, predecessor_sha = v29.v7.current_inventory()
    original_metadata, _ = v29.v7.root_metadata(ROOT, MANIFEST)
    manifests = v29.package_manifests(ROOT, original_metadata)
    paths = v29.selected_files(manifests)
    before = v29.snapshot(paths)
    relative_manifests = sorted(inventory["selected_root_package_manifests"][ROOT])
    require(set(relative_manifests) <=
            {str(path.relative_to(v29.ORIGINAL_IMPL)) for path in manifests} and
            all(name in before for name in (API, READY, POLICY, MANIFEST)),
            "V38 selected closure or source absent")
    require(not (v29.ORIGINAL_IMPL / TEST).exists(),
            "V38 synthetic test path collides with original source")
    harness_sha = v29.sha(HARNESS.encode())
    try:
        with tempfile.TemporaryDirectory(prefix="auth-v38-api-") as temporary:
            directory = Path(temporary)
            implementation = directory / "implementation"
            v29.mirror(implementation, manifests, paths)
            v37.v36.exact_mirror(implementation, before, ROOT)
            harness = implementation / TEST
            harness.parent.mkdir(parents=True, exist_ok=True)
            require(not harness.exists(), "V38 synthetic test collides with selected input")
            harness.write_text(HARNESS)
            original = {name: (implementation / name).read_text()
                        for name in (API, READY, POLICY)}
            variants = {}
            with v29.overlay_modules(implementation):
                for variant in ("clean", "marked", "policy-deny"):
                    expected = {**before, TEST: harness_sha}
                    for name in (API, READY, POLICY):
                        text = original[name]
                        if variant != "clean":
                            if name == API:
                                text = mutate_api(text)
                            elif name == READY:
                                text = v37.mutate_ready(text).replace(
                                    "AUTH_V37_READY", "AUTH_V38_READY")
                            else:
                                text = v37.mutate_policy(text, variant == "policy-deny").replace(
                                    "AUTH_V37_POLICY", "AUTH_V38_POLICY")
                        (implementation / name).write_text(text)
                        expected[name] = v29.sha(text.encode())
                    v37.v36.exact_mirror(implementation, expected, ROOT)
                    built = capture(implementation, directory / f"{variant}-target",
                                    relative_manifests, variant)
                    observations = {"allow": run_probe(built, implementation, variant, "allow")}
                    if variant == "marked":
                        observations["duplicate"] = run_probe(
                            built, implementation, variant, "duplicate")
                    v37.v36.exact_mirror(implementation, expected, ROOT)
                    variants[variant] = {
                        "source_sha256": {name: expected[name] for name in
                                          (API, READY, POLICY, TEST)},
                        "binary_sha256": built["binary_sha256"],
                        "metadata_sha256": built["metadata_sha256"],
                        "lock_sha256": built["lock_sha256"],
                        "test_package_id": built["test_package_id"],
                        "selected_mir": built["mir"],
                        "observations": observations,
                    }
            require(len({row["binary_sha256"] for row in variants.values()}) == 3 and
                    variants["clean"]["selected_mir"]["selected_mir_sha256"][MANIFEST] !=
                        variants["marked"]["selected_mir"]["selected_mir_sha256"][MANIFEST] and
                    variants["clean"]["selected_mir"]["selected_mir_sha256"][READY_MANIFEST] !=
                        variants["marked"]["selected_mir"]["selected_mir_sha256"][READY_MANIFEST] and
                    variants["marked"]["selected_mir"]["selected_mir_sha256"][POLICY_MANIFEST] !=
                        variants["policy-deny"]["selected_mir"]["selected_mir_sha256"][POLICY_MANIFEST],
                    "V38 compiled variant identities did not change")
            require(all(row["source_sha256"][TEST] == harness_sha for row in variants.values()) and
                    all(row["metadata_sha256"] == variants["clean"]["metadata_sha256"] and
                        row["lock_sha256"] == variants["clean"]["lock_sha256"] and
                        row["test_package_id"] == variants["clean"]["test_package_id"]
                        for row in variants.values()),
                    "V38 synthetic target or Cargo binding drift")
    finally:
        after = v29.selected_files(manifests)
        require(after == paths and v29.snapshot(after) == before,
                "V38 original selected source/Cargo/SQL path or byte drift")
    return {"schema_version": "auth-foundation.v4b-normal-api-reachability/v38-candidate",
            "status": "indeterminate", "predecessor_sha256": predecessor_sha,
            "root_id": ROOT, "root_manifest": MANIFEST,
            "original_source_sha256": {name: before[name] for name in (API, READY, POLICY)},
            "mirror_only_harness_sha256": harness_sha,
            "normal_feature_same_build_mir_and_test_binary": True,
            "source_bytes_preserved": True,
            "clean_http_allow": True, "instrumented_http_allow": True,
            "pre_gate_duplicate_denied_without_downstream_markers": True,
            "policy_mutant_denied_after_downstream_markers": True,
            "variants": variants,
            "candidate_promotions": [
                {"root": ROOT, "entrypoint": endpoint, "state": "reachable",
                 "witness": "v38-paired-instrumented-normal-feature-http-entry-observed"}
                for endpoint in ("api-runtime-authorize", "ready-decision", "generated-policy")],
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Finite in-process HTTP POST path in copied no-trace integration-test builds: handler, runtime, worker, READY, and policy entries observed only in marked binaries paired with clean ALLOW. V32 joins the clean MIR only; mutated MIR is source-constrained and dynamically observed, not independently V32-joined. No direct clean entry observation, real network, helper-role closure, all-path DENY no-call, or endpoint/effect closure."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "blocked", "reason": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
