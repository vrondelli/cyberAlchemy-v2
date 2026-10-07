#!/usr/bin/env python3
"""Finite mirror-only API timeout while a keyed blocking worker continues."""

from __future__ import annotations

import importlib.util
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

CASE = Path(__file__).resolve().parent


def load(label: str, filename: str):
    spec = importlib.util.spec_from_file_location(label, CASE / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v40 = load("auth_v40_for_v48", "auth-v4b-normal-gate-deny-v40.py")
v29, v36, v37, v39, v38 = (v40.v29, v40.v36, v40.v37,
                           v40.v39, v40.v38)
ROOT = "api"
VARIANT = "cardinality-gate-deny"
API, MANIFEST = v38.API, v38.MANIFEST
REQUEST = v40.request_id(ROOT, "duplicate")
API_DECL = 'pub const AUTHORIZE_PATH: &str = "/v1/authorize";\n'
API_WORKER = ("            let _in_flight = InFlightGuard { metrics: &metrics };\n"
              "            let mut engine = pool.take()?;\n")
HARNESS_SHA256 = "0362036c0bf19618d67019e0417c781080b310d9220f5a0d810794e396b9ee66"
ORIGINAL_INSPECT_MIR = v40.inspect_mir

HOLD_SUPPORT = r'''
#[derive(Default)]
struct V48HoldState {
    request_id: Option<String>,
    entered: bool,
    released: bool,
}

static V48_HOLD: std::sync::OnceLock<(Mutex<V48HoldState>, std::sync::Condvar)> =
    std::sync::OnceLock::new();

fn v48_hold_cell() -> &'static (Mutex<V48HoldState>, std::sync::Condvar) {
    V48_HOLD.get_or_init(|| (Mutex::new(V48HoldState::default()), std::sync::Condvar::new()))
}

pub fn v48_install_hold(request_id: &str) {
    let (lock, _) = v48_hold_cell();
    let mut state = lock.lock().unwrap_or_else(|poison| poison.into_inner());
    assert!(state.request_id.is_none(), "V48 hold installed twice");
    state.request_id = Some(request_id.to_owned());
}

pub fn v48_held_ack(request_id: &str) -> bool {
    let (lock, _) = v48_hold_cell();
    let state = lock.lock().unwrap_or_else(|poison| poison.into_inner());
    state.request_id.as_deref() == Some(request_id) && state.entered && !state.released
}

pub fn v48_release_hold(request_id: &str) {
    let (lock, ready) = v48_hold_cell();
    let mut state = lock.lock().unwrap_or_else(|poison| poison.into_inner());
    assert_eq!(state.request_id.as_deref(), Some(request_id), "V48 release wrong request");
    state.released = true;
    ready.notify_all();
}

fn v48_hold_before_pool_take(request_id: &str) {
    let (lock, ready) = v48_hold_cell();
    let mut state = lock.lock().unwrap_or_else(|poison| poison.into_inner());
    assert_eq!(state.request_id.as_deref(), Some(request_id), "V48 worker wrong request");
    assert!(!state.entered, "V48 worker entered twice");
    state.entered = true;
    eprintln!("AUTH_V48_HOLD request={request_id}");
    ready.notify_all();
    while !state.released {
        state = ready.wait(state).unwrap_or_else(|poison| poison.into_inner());
    }
    eprintln!("AUTH_V48_PASSED request={request_id}");
}
'''

HOLD_CALL = "            v48_hold_before_pool_take(&request.request_id);\n"

HARNESS_PREFIX = r'''
use auth_foundation_authorization_api::{
    AuthorizationRuntime, v48_install_hold, v48_held_ack, v48_release_hold,
};
use std::time::Instant;

struct ReleaseOnDrop {
    request_id: String,
    released: bool,
}

impl ReleaseOnDrop {
    fn release(&mut self) {
        if !self.released {
            eprintln!("AUTH_V48_RELEASE_REQUEST request={}", self.request_id);
            v48_release_hold(&self.request_id);
            self.released = true;
        }
    }
}

impl Drop for ReleaseOnDrop {
    fn drop(&mut self) {
        if !self.released {
            v48_release_hold(&self.request_id);
            self.released = true;
        }
    }
}

struct OwnedStage {
    stage: PathBuf,
    path: PathBuf,
    runtime: Option<AuthorizationRuntime>,
    cleaned: bool,
}

impl OwnedStage {
    fn new(stage: PathBuf, path: PathBuf) -> Self {
        Self { stage, path, runtime: None, cleaned: false }
    }

    fn cleanup(&mut self) -> std::io::Result<()> {
        if self.cleaned { return Ok(()); }
        let deadline = Instant::now() + Duration::from_secs(5);
        while self.runtime.as_ref().is_some_and(|runtime| runtime.metrics().in_flight != 0)
            && Instant::now() < deadline {
            std::thread::sleep(Duration::from_millis(10));
        }
        if self.runtime.as_ref().is_some_and(|runtime| runtime.metrics().in_flight != 0) {
            eprintln!("AUTH_V48_RETAIN_OWNED_STAGE path={}", self.stage.display());
            return Err(std::io::Error::other("worker active; owned stage retained"));
        }
        self.runtime.take();
        for path in [self.path.clone(), self.stage.join("probe.sqlite-wal"),
                     self.stage.join("probe.sqlite-shm")] {
            match std::fs::remove_file(&path) {
                Ok(()) => (),
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => (),
                Err(error) => return Err(error),
            }
        }
        std::fs::remove_dir(&self.stage)?;
        self.cleaned = true;
        Ok(())
    }
}

impl Drop for OwnedStage {
    fn drop(&mut self) {
        // A request task may be queued but not yet counted in in_flight.
        // Only the explicit success path may delete this stage, after the
        // held ACK, HTTP result, release, gate evidence, and worker terminal.
        if !self.cleaned {
            eprintln!("AUTH_V48_RETAIN_OWNED_STAGE path={}", self.stage.display());
        }
    }
}
'''

HARNESS_TAIL = r'''
    eprintln!("AUTH_V48_CASE request={request_id}");
    v48_install_hold(&request_id);
    let mut release = ReleaseOnDrop { request_id: request_id.clone(), released: false };
    let worker_request = request_id.clone();
    let response_task = tokio::spawn(async move {
        router.oneshot(request).await.expect("in-process HTTP response")
    });
    let entered = tokio::time::timeout(Duration::from_secs(5), async {
        loop {
            if v48_held_ack(&worker_request) { break; }
            tokio::time::sleep(Duration::from_millis(5)).await;
        }
    }).await;
    assert!(entered.is_ok(), "keyed worker never acknowledged hold");
    assert!(!response_task.is_finished(), "HTTP completed before held ACK");
    assert!(v48_held_ack(&request_id), "worker not held after ACK");
    let response = tokio::time::timeout(Duration::from_secs(5), response_task).await
        .expect("HTTP response after evaluation timeout")
        .expect("HTTP task completion");
    assert!(v48_held_ack(&request_id), "worker released before HTTP 504");
    assert_eq!(response.status(), StatusCode::GATEWAY_TIMEOUT);
    assert_eq!(response.headers().get(header::CACHE_CONTROL).unwrap(), "no-store");
    let bytes = to_bytes(response.into_body(), 1024).await.expect("body");
    let value: serde_json::Value = serde_json::from_slice(&bytes).expect("JSON response");
    assert_eq!(value, serde_json::json!({"decision": "DENY"}));
    let before = runtime.metrics();
    assert_eq!((before.requests, before.timed_out, before.in_flight), (1, 1, 1));
    assert_eq!((before.allows, before.denies, before.worker_unavailable), (0, 0, 0));
    eprintln!("AUTH_V48_HTTP_DONE request={request_id} status=504 decision=DENY in_flight=1");
    release.release();
    let terminal = tokio::time::timeout(Duration::from_secs(5), async {
        loop {
            if runtime.metrics().in_flight == 0 { break; }
            tokio::time::sleep(Duration::from_millis(5)).await;
        }
    }).await;
    assert!(terminal.is_ok(), "released worker did not terminate");
    let after = runtime.metrics();
    assert_eq!((after.requests, after.timed_out, after.in_flight), (1, 1, 0));
    assert_eq!((after.allows, after.denies, after.worker_unavailable), (0, 0, 0));
    eprintln!("AUTH_V48_END request={request_id} in_flight=0");
    drop(release);
    drop(runtime);
    owned.cleanup().expect("cleanup exact owned SQLite stage after worker terminal");
}
'''


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError("V48 " + reason)


def mutate_api(source: str) -> str:
    require(source.count(API_DECL) == 1 and
            source.count(API_WORKER) == 1 and
            "V48_HOLD" not in source and "v48_hold_before_pool_take" not in source,
            "API declaration/worker hold source anchor changed")
    changed = source.replace(API_DECL, API_DECL + HOLD_SUPPORT, 1)
    changed = changed.replace(API_WORKER,
                              API_WORKER.replace("            let mut engine = pool.take()?;\n",
                                                 HOLD_CALL +
                                                 "            let mut engine = pool.take()?;\n"), 1)
    require(changed.count(HOLD_CALL) == 1 and
            changed.count("            let mut engine = pool.take()?;\n") == 1,
            "keyed hold not uniquely before pool.take")
    return changed


def harness() -> str:
    template = v38.HARNESS
    require(v29.sha(template.encode()) == HARNESS_SHA256,
            "V38 harness seed/response baseline changed")
    # Keep V38's database setup/seed and request construction verbatim;
    # replace only the test outcome, timeout, and add bounded guards.
    head, remainder = template.split("#[tokio::test]\nasync fn v38_http_probe() {", 1)
    require(remainder.count('    eprintln!("AUTH_V38_CASE request={request_id}");') == 1,
            "V38 request fixture tail changed")
    setup, _old_tail = remainder.split(
        '    eprintln!("AUTH_V38_CASE request={request_id}");', 1)
    old_intro = ('    let scenario = std::env::var("AUTH_V38_SCENARIO").expect("scenario");\n'
                 '    assert!(["allow", "duplicate"].contains(&scenario.as_str()));\n'
                 '    let expected = std::env::var("AUTH_V38_EXPECT").expect("expected decision");\n'
                 '    assert!(["ALLOW", "DENY"].contains(&expected.as_str()));\n')
    require(setup.count(old_intro) == 1 and
            setup.count('    let (stage, path) = database_stage();\n') == 1 and
            setup.count('let expires_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() + 60;') == 1 and
            setup.count('1, Duration::from_secs(5), Duration::from_secs(10)') == 1 and
            setup.count('    let router = authorization_router(runtime.clone());\n') == 1,
            "V38 fixture/config source anchors changed")
    setup = setup.replace(old_intro, '    let scenario = "duplicate";\n', 1)
    setup = setup.replace('    let (stage, path) = database_stage();\n',
                          '    let (stage, path) = database_stage();\n'
                          '    let mut owned = OwnedStage::new(stage.clone(), path.clone());\n', 1)
    setup = setup.replace('let expires_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() + 60;',
                          'let expires_at: u64 = std::env::var("AUTH_V48_EXPIRES_AT")\n'
                          '        .expect("fixed post-build expiry").parse().expect("numeric expiry");\n'
                          '    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();\n'
                          '    assert!(expires_at > now + 10 && expires_at <= now + 120);', 1)
    setup = setup.replace('1, Duration::from_secs(5), Duration::from_secs(10)',
                          '1, Duration::from_secs(5), Duration::from_millis(750)', 1)
    setup = setup.replace('    let router = authorization_router(runtime.clone());\n',
                          '    owned.runtime = Some(runtime.clone());\n'
                          '    let router = authorization_router(runtime.clone());\n', 1)
    assembled = (head + HARNESS_PREFIX +
                 '#[tokio::test]\nasync fn v38_http_probe() {\n' + setup + HARNESS_TAIL)
    require(assembled.count("AUTH_V48_HTTP_DONE") == 1 and
            assembled.count("AUTH_V48_EXPIRES_AT") == 1 and
            assembled.count("owned.cleanup().expect") == 1 and
            "Duration::from_millis(750)" in assembled and
            all(assembled.count(anchor) == 1 for anchor in (
                "impl Drop for ReleaseOnDrop {",
                "impl Drop for OwnedStage {",
                'if !self.cleaned {\n            eprintln!("AUTH_V48_RETAIN_OWNED_STAGE path={}", self.stage.display());',
                'return Err(std::io::Error::other("worker active; owned stage retained"));',
                "std::fs::remove_dir(&self.stage)?;",
                'assert!(v48_held_ack(&request_id), "worker released before HTTP 504");',
                'assert_eq!(response.status(), StatusCode::GATEWAY_TIMEOUT);',
                'assert_eq!(value, serde_json::json!({"decision": "DENY"}));',
                'assert_eq!(response.headers().get(header::CACHE_CONTROL).unwrap(), "no-store");',
                'assert_eq!((before.requests, before.timed_out, before.in_flight), (1, 1, 1));',
                'assert_eq!((after.requests, after.timed_out, after.in_flight), (1, 1, 0));',
                'assert_eq!((after.allows, after.denies, after.worker_unavailable), (0, 0, 0));')),
            "V48 harness transformation incomplete")
    return assembled


def inspect_mir(root: str, mir: dict[str, str], identities: dict,
                variant: str) -> dict:
    prior = ORIGINAL_INSPECT_MIR(root, mir, identities, variant)
    require(root == ROOT and variant == VARIANT and MANIFEST in mir and
            MANIFEST in identities, "selected normal API library absent")
    library = mir[MANIFEST]
    items = v39.v32.v9.v5.functions(library)
    workers = [(name, body) for name, body in items.items()
               if "::authorize::{closure#0}::{closure#0}(" in name and
               "-> Result<BinaryAuthorizationDecision, AuthorizationRuntimeError>" in name]
    require(len(workers) == 1, "selected blocking worker function ambiguous")
    name, body = workers[0]
    require(body.count("v48_hold_before_pool_take") == 1 and
            body.count("EnginePool::take") == 1 and
            body.index("v48_hold_before_pool_take") < body.index("EnginePool::take") and
            "AUTH_V48_HOLD" in library and "AUTH_V48_PASSED" in library,
            "keyed hold MIR not before pool.take")
    identity = identities[MANIFEST]
    require(identity["target_kind"] == ["lib"] and
            identity["target_name"] == "auth_foundation_authorization_api" and
            "trace" not in identity["features"] and
            identity["mir_sha256"] == v29.sha(library.encode()),
            "normal-feature API MIR identity changed")
    return {**prior, "v48_worker_function": name,
            "v48_hold_before_pool_take": True,
            "api_library_mir_sha256": identity["mir_sha256"],
            "api_library_package_id": identity["package_id"],
            "api_library_features": identity["features"]}


def strict_markers(output: str) -> list[str]:
    expected = [f"AUTH_V48_CASE request={REQUEST}",
                f"AUTH_V48_HOLD request={REQUEST}",
                f"AUTH_V48_HTTP_DONE request={REQUEST} status=504 decision=DENY in_flight=1",
                f"AUTH_V48_RELEASE_REQUEST request={REQUEST}",
                f"AUTH_V48_PASSED request={REQUEST}",
                f"{v40.PRE} request={REQUEST} epoch=1 auth_count=2 route_count=1",
                f"{v40.GATE_RESULT} request={REQUEST} epoch=1 decision=Deny",
                f"AUTH_V48_END request={REQUEST} in_flight=0"]
    actual = []
    for line in output.splitlines():
        tokens = ("AUTH_V48_", "AUTH_V40_", "AUTH_V39_")
        count = sum(line.count(token) for token in tokens)
        if count:
            require(count == 1, "coalesced or duplicate marker line")
            token = next(token for token in tokens if token in line)
            actual.append(line[line.index(token):].strip())
    require(actual == expected and
            not any("AUTH_V39_READY" in row or "AUTH_V39_authorize" in row or
                    any(f"AUTH_V39_{name}" in row for name in v39.ACTIVE)
                    for row in actual),
            f"timeout/held/release/gate marker identity or order changed:{actual}")
    return actual


def expiry_fixture(now: int | None = None) -> int:
    instant = int(time.time()) if now is None else now
    expiry = instant + 120
    require(expiry > instant + 10, "fixture expiry overflow")
    return expiry


def validate_build(build: dict, expected: dict, before: dict,
                   metadata_sha: str) -> None:
    inspection = build["inspection"]
    checks = {
        "hold_mir": inspection["v48_hold_before_pool_take"],
        "api_mir": inspection["api_library_mir_sha256"] ==
                   build["selected_mir_sha256"][MANIFEST],
        "package": inspection["api_library_package_id"] == build["test_package_id"],
        "features": "trace" not in inspection["api_library_features"],
        "selected_closure": set(build["selected_mir_sha256"]) == set(v40.SELECTED),
        "generated_gate": expected[v40.GATE] == before[v40.GATE],
        "mirror_harness": expected[v38.TEST] != before.get(v38.TEST),
        "metadata": build["metadata_sha256"] == metadata_sha,
        "lock": build["lock_sha256"] == before["authorization-api/Cargo.lock"],
    }
    require(all(checks.values()),
            "same-build API/gate/source/metadata/lock artifact binding changed: " +
            ",".join(key for key, value in checks.items() if not value))


def evaluate() -> dict:
    inventory, predecessor_sha = v29.v7.current_inventory()
    metadata, _ = v29.v7.root_metadata(ROOT, MANIFEST)
    manifests = v29.package_manifests(ROOT, metadata)
    paths = v29.selected_files(manifests)
    before = v29.snapshot(paths)
    selected = sorted(inventory["selected_root_package_manifests"][ROOT])
    require(set(selected) <= {str(path.relative_to(v29.ORIGINAL_IMPL))
                             for path in manifests} and
            all(name in before for name in
                (API, v40.AUTHORITY, v40.READY, v40.POLICY, v40.GATE)) and
            not (v29.ORIGINAL_IMPL / v38.TEST).exists(),
            "selected source closure or mirror-only harness collision")
    model = v40.check_named_v30_rejection(
        (v29.ORIGINAL_IMPL / v40.AUTHORITY).read_text(),
        (v29.ORIGINAL_IMPL / v40.GATE).read_text())
    require(before[v40.AUTHORITY] == model["authority_source_sha256"] and
            before[v40.GATE] == model["gate_source_sha256"],
            "frozen authority/gate source changed")
    previous = v40.inspect_mir
    try:
        with tempfile.TemporaryDirectory(prefix="auth-v48-api-") as temporary:
            directory = Path(temporary)
            implementation = directory / "implementation"
            v29.mirror(implementation, manifests, paths)
            v36.exact_mirror(implementation, before, ROOT)
            test = implementation / v38.TEST
            test.parent.mkdir(parents=True, exist_ok=True)
            require(not test.exists(), "mirror-only test collision")
            test_source = harness()
            test.write_text(test_source)
            original = {name: (implementation / name).read_text()
                        for name in (API, v40.AUTHORITY, v40.READY,
                                     v40.POLICY, v40.GATE)}
            texts = {API: mutate_api(original[API]),
                     v40.AUTHORITY:
                         v40.mutate_authority(original[v40.AUTHORITY], VARIANT),
                     v40.READY: v37.mutate_ready(original[v40.READY]).replace(
                         "AUTH_V37_READY", "AUTH_V39_READY"),
                     v40.POLICY: v39.mark_policy(original[v40.POLICY]),
                     v40.GATE: original[v40.GATE]}
            expected = {**before, v38.TEST: v29.sha(test_source.encode())}
            for relative, source in texts.items():
                (implementation / relative).write_text(source)
                expected[relative] = v29.sha(source.encode())
            v36.exact_mirror(implementation, expected, ROOT)
            with v29.overlay_modules(implementation):
                _, mirror_metadata_sha = v29.v7.root_metadata(ROOT, MANIFEST)
                v40.inspect_mir = inspect_mir
                build = v40.capture_api(implementation, directory / "target",
                                        selected, VARIANT)
                v36.exact_mirror(implementation, expected, ROOT)
            validate_build(build, expected, before, mirror_metadata_sha)
            expiry = expiry_fixture()
            env = dict(os.environ)
            env.pop("AUTH_AUTHORIZATION_TRACE_STDERR", None)
            env["AUTH_V48_EXPIRES_AT"] = str(expiry)
            binary = build["binary"]
            require(v29.sha(binary.read_bytes()) == build["binary_sha256"] and
                    time.time() + 10 < expiry,
                    "binary or fixed fixture expired before run")
            run = subprocess.run([str(binary), "v38_http_probe", "--exact",
                                  "--nocapture", "--test-threads=1"],
                                 cwd=implementation, env=env,
                                 stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                 text=True, timeout=45, check=False)
            require(run.returncode == 0 and "1 passed" in run.stdout and
                    time.time() < expiry,
                    "held HTTP/worker/cleanup harness failed: " + run.stdout[-2500:])
            markers = strict_markers(run.stdout)
            require(v29.sha(binary.read_bytes()) == build["binary_sha256"],
                    "binary changed after execution")
            return {"schema_version": "auth-foundation.v4b-api-timeout-race/v48-candidate",
                    "status": "indeterminate", "predecessor_sha256": predecessor_sha,
                    "source_bytes_preserved": True,
                    "normal_feature_same_build_mir_and_binary": True,
                    "source_sha256": expected,
                    "selected_mir_sha256": build["selected_mir_sha256"],
                    "api_inspection": build["inspection"],
                    "binary_sha256": build["binary_sha256"],
                    "metadata_sha256": build["metadata_sha256"],
                    "lock_sha256": build["lock_sha256"],
                    "test_package_id": build["test_package_id"],
                    "fixture": {"request_id": REQUEST, "expires_at": expiry,
                                "harness_sha256": expected[v38.TEST]},
                    "observation": {"actual_http_status": 504,
                                    "actual_http_json_decision": "DENY",
                                    "cache_control": "no-store",
                                    "held_ack_before_http": True,
                                    "in_flight_at_504": 1,
                                    "in_flight_after_release": 0,
                                    "caller_decision_counter_delta": 0,
                                    "markers": markers,
                                    "worker_terminal_before_owned_db_cleanup": True},
                    "endpoint_set_closed": False,
                    "all_path_ready_dominance": False,
                    "runtime_guarantees_observed": False,
                    "claim_limit": "One finite mirror-only cardinality-relaxed duplicate schedule: an already-started keyed blocking worker remains held before pool.take while real in-process HTTP returns 504/DENY; explicit release then reaches the generated gate DENY and worker terminal state without caller allow/deny counters. This does not prove unmodified production gate-DENY reachability, all-schedule cancellation semantics, transitive effects, all-path no-call, or owner-wide runtime guarantees."}
    finally:
        v40.inspect_mir = previous
        after = v29.selected_files(manifests)
        require(after == paths and v29.snapshot(after) == before,
                "original selected source/Cargo/SQL path or bytes drift")


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
