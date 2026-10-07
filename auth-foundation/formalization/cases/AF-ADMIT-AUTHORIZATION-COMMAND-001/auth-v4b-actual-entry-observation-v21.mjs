#!/usr/bin/env node
// Candidate diagnostic: instrument copied Rust sources, never the selected source.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const implementation = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../implementation");
const toolchain = path.resolve(implementation, "../../tools/toolchain/run");
const policyRelative = "standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs";
const readyDecisionRelative = "authorization-ready-decision/src/lib.rs";
const apiRelative = "authorization-api/src/lib.rs";
const testRelative = "authorization-api/tests/production_pool.rs";
const expectedSource = {
  [policyRelative]: "13c696a8f17b4d6bff1529b2cb75d1780aca38f45277f8c454cf7ec024b7efe9",
  [readyDecisionRelative]: "5fc42188c7b07013bae83c552d5a534c9bfede377007c11c6d283596bbb62b7d",
  [apiRelative]: "c5a8f845e6ebb388f0599be559b46379ec281ff5c5960d4708e9393b2c2652ca",
  [testRelative]: "145daeeb0740c3e5b0de6645e9a1ac52e354bc724fbabc67a4e32be139529fe5",
};
export const protectedFunctions = [
  "complete_active_roles", "exact_active_role_grant", "session_current",
  "trusted_scope", "unique_resolved_session", "allow_iff",
  "authorization_admissible", "default_deny", "authorize",
];
export const observedFunctions = [...protectedFunctions, "ready_decision_authorize", "api_worker"];
const apiCases = [
  "allow", "route_missing", "duplicate_auth", "duplicate_route",
  "admission_probe", "policy_deny",
];
export const apiRequestIds = Object.fromEntries(apiCases.map(name => [name, `auth_v21_${name}`]));
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const fail = (reason) => { throw new Error(reason); };

function sourceSnapshot(root, ignoreTransientLock = false) {
  const rows = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      if (ignoreTransientLock && path.relative(root, absolute) === "standard-runtime/Cargo.lock") continue;
      if (entry.isSymbolicLink() || (entry.isDirectory() && entry.name === "target")) continue;
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const bytes = fs.readFileSync(absolute);
        rows.push([path.relative(root, absolute), bytes.length, sha256(bytes)]);
      } else fail(`unsupported-source-entry:${absolute}`);
    }
  }
  visit(root);
  return { file_count: rows.length, digest: sha256(JSON.stringify(rows)) };
}

export function parseEntryLog(log, expectedCases, requestIds) {
  if (new Set(Object.values(requestIds)).size !== expectedCases.length ||
      expectedCases.some(name => !/^[A-Za-z0-9_]+$/u.test(requestIds[name] ?? "")))
    fail("invalid-case-request-ids");
  const segments = {};
  let active = null;
  let next = 0;
  // libtest may print "test name ... " before the first stderr marker.
  for (const line of log.split(/\r?\n/u)) {
    const index = line.indexOf("AUTH_V21_");
    if (index < 0) continue;
    if (line.lastIndexOf("AUTH_V21_") !== index) fail("multiple-markers-on-line");
    const marker = line.slice(index).trim();
    const match = /^AUTH_V21_(CASE|ENTRY):([A-Za-z0-9_]+)(?::([A-Za-z0-9_]+))?$/u.exec(marker);
    if (!match) fail(`malformed-marker:${marker}`);
    const [, kind, name, requestId] = match;
    if (kind === "CASE") {
      const expected = next < expectedCases.length ? expectedCases[next] : "end";
      if (name !== expected) fail(`case-order:${name}:${expected}`);
      if (name === "end") {
        if (requestId !== undefined) fail("end-with-request-id");
        active = null; next += 1;
      } else {
        if (requestId !== requestIds[name]) fail(`case-request-id:${name}`);
        segments[name] = []; active = name; next += 1;
      }
    } else {
      if (!observedFunctions.includes(name)) fail(`unknown-entry:${name}`);
      if (active === null) fail(`unassigned-entry:${name}`);
      if (requestId !== requestIds[active]) fail(`entry-request-id:${name}:${active}`);
      segments[active].push(name);
    }
  }
  if (next !== expectedCases.length + 1) fail(`incomplete-case-markers:${next}`);
  return segments;
}

export function verifyApiSegments(segments) {
  for (const name of ["route_missing", "duplicate_auth", "duplicate_route"]) {
    const entries = segments[name] ?? [];
    if (entries.filter(entry => entry === "api_worker").length !== 1)
      fail(`worker-entry-count:${name}`);
    if (entries.length !== 1) fail(`pre-ready-entry:${name}`);
  }
  for (const name of ["allow", "admission_probe", "policy_deny"]) {
    const entries = segments[name] ?? [];
    const publicCase = name !== "admission_probe";
    const workerCount = entries.filter(entry => entry === "api_worker").length;
    if (workerCount !== (publicCase ? 1 : 0)) fail(`worker-entry-count:${name}`);
    if (publicCase && entries[0] !== "api_worker") fail(`worker-after-ready:${name}`);
    const wrapper = entries.indexOf("ready_decision_authorize");
    if (wrapper < 0) fail(`missing-ready-decision-entry:${name}`);
    if (entries.lastIndexOf("ready_decision_authorize") !== wrapper)
      fail(`duplicate-ready-decision-entry:${name}`);
    if (wrapper !== (publicCase ? 1 : 0)) fail(`protected-entry-before-ready-decision:${name}`);
    const generated = entries.indexOf("authorize");
    if (generated < 0) fail(`missing-callee-entry:${name}`);
    if (entries.lastIndexOf("authorize") !== generated)
      fail(`duplicate-callee-entry:${name}`);
    if (wrapper > generated) fail(`generated-before-ready-decision:${name}`);
  }
}

function instrumentApiWorker(source) {
  const anchor = "let worker = tokio::task::spawn_blocking(move || {";
  if (source.split(anchor).length !== 2) fail("api-worker-anchor-count");
  return source.replace(anchor,
    `${anchor}\n            eprintln!("AUTH_V21_ENTRY:api_worker:{}", request.request_id);`);
}

function instrumentReadyDecision(source) {
  const declaration = "pub fn authorize(ready: ReadyAuthorization<'_, '_>) -> BinaryAuthorizationDecision {";
  if (source.split(declaration).length !== 2) fail("ready-decision-declaration-count");
  return source.replace(declaration,
    `${declaration}\n    eprintln!("AUTH_V21_ENTRY:ready_decision_authorize:{}", ready.command().request_id);`);
}

function instrumentPolicy(source) {
  let instrumented = source;
  for (const name of protectedFunctions) {
    const declaration = new RegExp(`\\bpub fn ${name}\\([^\\n]*\\)\\s*->\\s*[^\\n{]+\\{`, "gu");
    const matches = [...instrumented.matchAll(declaration)];
    if (matches.length !== 1) fail(`policy-declaration-count:${name}:${matches.length}`);
    instrumented = instrumented.replace(declaration, (head) =>
      `${head}\n    eprintln!("AUTH_V21_ENTRY:${name}:{}", context.request.request_id);`);
  }
  return instrumented + `

#[cfg(test)]
mod v21_entry_positive_control {
    use super::*;

    #[test]
    fn v21_all_generated_functions_are_observable() {
        let session = Session {
            session_id: "s".into(), user_id: "u".into(), status: SessionStatus::Inactive,
            active_role_ids: BTreeSet::new(), authorization_revision: 1, expires_at: 2,
        };
        let context = EvaluationContext {
            request: AuthorizationRequest {
                request_id: "r".into(), session_id: "s".into(),
                required_permission: Permission {
                    resource: "x".into(), action: "read".into(), scope: "t".into(),
                },
                scope_evidence_ref: "scope".into(), decision_time: 1,
                current_authorization_revision: 1,
            },
            resolved_sessions: vec![session.clone()], resolved_roles: Vec::new(),
            trusted_scope_evidence: true, role_relation_complete: true,
        };
        eprintln!("AUTH_V21_CASE:positive:r");
        let _ = complete_active_roles(&context, &session);
        let _ = exact_active_role_grant(&context, &session);
        let _ = session_current(&context, &session);
        let _ = trusted_scope(&context);
        let _ = unique_resolved_session(&context);
        let _ = allow_iff(&context);
        let _ = authorization_admissible(&context, &session);
        let _ = default_deny(&context);
        let _ = authorize(&context);
        eprintln!("AUTH_V21_CASE:end");
    }
}
`;
}

function instrumentApiTest(source) {
  const publicCases = ["allow", "route_missing", "duplicate_auth", "duplicate_route", "policy_deny"];
  const expectedRoutes = ["documents.read", "documents.write", "documents.read", "documents.read", "documents.read"];
  let next = 0;
  let result = source.replace(/runtime\.authorize\(request\("([^"]+)"\)\)\.await/gu, (call, route) => {
    if (next >= publicCases.length || route !== expectedRoutes[next]) fail(`public-call-shape:${next}:${route}`);
    const name = publicCases[next++];
    return `{ eprintln!("AUTH_V21_CASE:${name}:${apiRequestIds[name]}"); let mut selected = request("${route}"); selected.request_id = "${apiRequestIds[name]}".into(); runtime.authorize(selected).await }`;
  });
  if (next !== publicCases.length) fail(`public-call-count:${next}`);
  const probe = 'probe.with_ready(request("documents.read"), authorize_ready_decision)';
  if (result.split(probe).length !== 2) fail("direct-probe-count");
  result = result.replace(probe, `{ eprintln!("AUTH_V21_CASE:admission_probe:${apiRequestIds.admission_probe}"); let mut selected = request("documents.read"); selected.request_id = "${apiRequestIds.admission_probe}".into(); probe.with_ready(selected, authorize_ready_decision) }`);
  const traceAssertion = 'assert_eq!(trace.request_id, "request-1");';
  if (result.split(traceAssertion).length !== 2) fail("trace-request-assertion-count");
  result = result.replace(traceAssertion, 'assert_eq!(trace.request_id, expected_id);');
  const traceSignature = 'fn one_trace(runtime: &auth_foundation_authorization_api::AuthorizationRuntime) -> Trace {';
  if (result.split(traceSignature).length !== 2) fail("trace-signature-count");
  result = result.replace(traceSignature,
    'fn one_trace(runtime: &auth_foundation_authorization_api::AuthorizationRuntime, expected_id: &str) -> Trace {');
  const publicTraceCases = ["allow", "route_missing", "duplicate_auth", "duplicate_route", "policy_deny"];
  let traceIndex = 0;
  result = result.replace(/one_trace\(&runtime\)/gu, () => {
    if (traceIndex >= publicTraceCases.length) fail("too-many-public-traces");
    return `one_trace(&runtime, "${apiRequestIds[publicTraceCases[traceIndex++]]}")`;
  });
  if (traceIndex !== publicTraceCases.length) fail("public-trace-count");
  if (result.split("drop(runtime);").length !== 2) fail("runtime-drop-count");
  result = result.replace("drop(runtime);", 'eprintln!("AUTH_V21_CASE:end");\n    drop(runtime);');
  return result;
}

function runCargo(stage, name, manifest, filter, extra = []) {
  const logPath = path.join(stage, `${name}.log`);
  const logFd = fs.openSync(logPath, "w", 0o600);
  const args = ["cargo", "test", "--offline", ...(manifest === "authorization-api/Cargo.toml" ? ["--locked"] : []),
    "--manifest-path", path.join(stage, "implementation", manifest),
    ...extra, filter, "--", "--nocapture", "--test-threads=1"];
  let result;
  try {
    result = spawnSync(toolchain, args, {
      cwd: stage,
      env: { ...process.env, CARGO_TARGET_DIR: path.join(stage, "target"), TMPDIR: stage },
      stdio: ["ignore", logFd, logFd],
      timeout: 600_000,
    });
  } finally {
    fs.closeSync(logFd);
  }
  const log = fs.readFileSync(logPath, "utf8");
  if (result.error || result.signal || result.status !== 0)
    fail(`cargo-${name}:${result.error?.message ?? result.signal ?? result.status}: ${log.slice(-3500)}`);
  return log;
}

function main() {
  const originalSnapshot = sourceSnapshot(implementation);
  for (const [relative, digest] of Object.entries(expectedSource)) {
    if (sha256(fs.readFileSync(path.join(implementation, relative))) !== digest)
      fail(`selected-source-drift:${relative}`);
  }
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), "auth-v21-"));
  try {
    const stagedImplementation = path.join(stage, "implementation");
    fs.cpSync(implementation, stagedImplementation, {
      recursive: true,
      filter: (source) => {
        // Live .runtime links are out of scope and must not be dereferenced.
        if (fs.lstatSync(source).isSymbolicLink()) return false;
        return !path.relative(implementation, source).split(path.sep).includes("target");
      },
    });
    const stagedSnapshot = sourceSnapshot(stagedImplementation, true);
    if (JSON.stringify(stagedSnapshot) !== JSON.stringify(originalSnapshot))
      fail("staged-source-closure-drift");
    for (const relative of Object.keys(expectedSource)) {
      if (sha256(fs.readFileSync(path.join(stagedImplementation, relative))) !== expectedSource[relative])
        fail(`staged-source-drift:${relative}`);
    }
    fs.writeFileSync(path.join(stagedImplementation, policyRelative),
      instrumentPolicy(fs.readFileSync(path.join(stagedImplementation, policyRelative), "utf8")));
    fs.writeFileSync(path.join(stagedImplementation, readyDecisionRelative),
      instrumentReadyDecision(fs.readFileSync(path.join(stagedImplementation, readyDecisionRelative), "utf8")));
    fs.writeFileSync(path.join(stagedImplementation, apiRelative),
      instrumentApiWorker(fs.readFileSync(path.join(stagedImplementation, apiRelative), "utf8")));
    fs.writeFileSync(path.join(stagedImplementation, testRelative),
      instrumentApiTest(fs.readFileSync(path.join(stagedImplementation, testRelative), "utf8")));
    const instrumentedSnapshot = sourceSnapshot(stagedImplementation, true);
    const positiveLog = runCargo(stage, "positive", "standard-runtime/Cargo.toml",
      "v21_all_generated_functions_are_observable", ["--lib"]);
    const positive = parseEntryLog(positiveLog, ["positive"], { positive: "r" });
    for (const name of protectedFunctions)
      if (!positive.positive.includes(name)) fail(`unlive-positive-probe:${name}`);
    const apiLog = runCargo(stage, "api", "authorization-api/Cargo.toml",
      "production_pool_distinguishes_ready_allow_gate_deny_and_policy_deny",
      ["--features", "trace", "--test", "production_pool"]);
    const api = parseEntryLog(apiLog, apiCases, apiRequestIds);
    verifyApiSegments(api);
    if (JSON.stringify(sourceSnapshot(stagedImplementation, true)) !== JSON.stringify(instrumentedSnapshot))
      fail("post-build-instrumented-source-drift");
    for (const [relative, digest] of Object.entries(expectedSource)) {
      if (sha256(fs.readFileSync(path.join(implementation, relative))) !== digest)
        fail(`post-run-source-drift:${relative}`);
    }
    if (JSON.stringify(sourceSnapshot(implementation)) !== JSON.stringify(originalSnapshot))
      fail("post-run-source-closure-drift");
    process.stdout.write(JSON.stringify({
      status: "indeterminate",
      instrumented_selected_path_observed: true,
      copied_build_worker_handoff_observed: true,
      selected_source_sha256: expectedSource,
      source_snapshot: originalSnapshot,
      instrumented_source_snapshot: instrumentedSnapshot,
      selected_feature: "authorization-api/trace",
      positive_probe_set: protectedFunctions,
      ready_decision_entry_positive_cases: ["allow", "admission_probe", "policy_deny"],
      sampled_request_ids: apiRequestIds,
      api_segments: api,
      endpoint_set_closed: false,
      all_path_ready_dominance: false,
      runtime_guarantees_observed: false,
      claim_limit: "Temporary instrumented API worker, READY-decision, and generated-policy copies; finite selected API cases only. No all-native endpoint closure, same-request all-path dominance, normal-build equivalence, provider authentication, or F5 satisfaction.",
    }) + "\n");
  } finally {
    if (path.dirname(stage) !== os.tmpdir() || !path.basename(stage).startsWith("auth-v21-"))
      fail("unsafe-owned-stage");
    fs.rmSync(stage, { recursive: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) {
    process.stderr.write(`auth-v21-error: ${error.message}\n`);
    process.exitCode = 1;
  }
}
