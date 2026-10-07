import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Current selected-source/normal-Cargo-closure check. This is deliberately a
// candidate, not a proof of arbitrary implicit effects or runtime guarantees.
const root = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const implementation = resolve(root, 'auth-foundation/implementation');
const inventoryManifest = resolve(fileURLToPath(new URL('./v4b-call-inventory/Cargo.toml', import.meta.url)));
const toolchain = resolve(root, 'tools/toolchain/run');
const paths = {
  api: 'authorization-api',
  tenant: 'tenant-bridge',
  prototype: 'authentication-prototype/bridge',
  https: 'authentication-https/bridge',
};
const sources = {
  api: 'authorization-api/src/lib.rs',
  admission: 'authorization-admission-service/src/lib.rs',
  authority: 'authorization-ready-authority/src/lib.rs',
  decision: 'authorization-ready-decision/src/lib.rs',
  tenant: 'tenant-bridge/src/main.rs',
  prototype: 'authentication-prototype/bridge/src/main.rs',
  https: 'authentication-https/bridge/src/main.rs',
  policy: 'standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs',
};
const forbidden = new Set([
  'auth-foundation-sqlite-provider', 'auth-foundation-runtime-adapter',
  'auth-foundation-authorization-service',
  'auth-foundation-trusted-boundary', 'auth-foundation-trusted-boundary-v2',
]);
const policy = 'auth-foundation-operation-auth-exact-permission-authorize';
const decision = 'auth-foundation-authorization-ready-decision';
const trace = 'auth-foundation-authorization-trace';
const fail = code => { throw new Error(`AUTH_V4B_NATIVE_TRACE_SUCCESSOR:${code}`); };
const sha = content => createHash('sha256').update(content).digest('hex');
const exactly = (items, predicate, code) => {
  const found = items.filter(predicate);
  if (found.length !== 1) fail(`${code}:${found.length}`);
  return found[0];
};

function inventory(content, selector) {
  const output = execFileSync(toolchain, [
    'cargo', 'run', '--quiet', '--locked', '--offline', '--manifest-path',
    inventoryManifest, '--', '--selector', JSON.stringify(selector),
  ], { cwd: root, input: content, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const parsed = JSON.parse(output);
  if (parsed.selected_parsed_call_nodes_exhaustive !== true ||
      parsed.implicit_operations_covered !== false ||
      parsed.macro_token_trees_expanded !== false) fail(`parser-posture:${selector.name}`);
  return parsed;
}

const free = name => ({ kind: 'free', name });
const method = (name, self_type) => ({ kind: 'impl', name, self_type, trait: null });
const selectedPosture = {
  authority: { selector: free('with_ready_in_transaction'), attributes: 1,
    parameters: ["transaction : & 'transaction Transaction < 'connection >", 'request : & InboundAuthorizationRequest',
      'evaluation_epoch_id : NonZeroU64', 'decision_time : u64',
      "continuation : fn (ReadyAuthorization < 'transaction , 'connection >) -> R"] },
  admission: { selector: method('with_ready', 'SqliteAdmissionService < C >'), attributes: 1,
    parameters: ['& mut self', 'request : InboundAuthorizationRequest',
      "continuation : for < 'transaction , 'connection > fn (ReadyAuthorization < 'transaction , 'connection > ,) -> R"] },
  decision: { selector: free('authorize'), attributes: 3,
    parameters: ["ready : ReadyAuthorization < '_ , '_ >"] },
  api: { selector: method('authorize', 'AuthorizationRuntime'), attributes: 6,
    parameters: ['& self', 'request : InboundAuthorizationRequest'] },
  tenant: { selector: free('evaluate'), attributes: 2, parameters: [] },
  prototype: { selector: free('evaluate'), attributes: 2, parameters: [] },
  https: { selector: free('evaluate'), attributes: 2, parameters: [] },
};

function selectedInventory(id, content) {
  const expected = selectedPosture[id];
  const result = inventory(content, expected.selector);
  if (result.schema_version !== 'auth-foundation.v4b-explicit-call-inventory/v1-candidate' ||
      result.selector?.kind !== expected.selector.kind ||
      result.selector?.name !== expected.selector.name ||
      result.selector?.self_type !== expected.selector.self_type ||
      result.selector?.trait !== expected.selector.trait ||
      result.function !== expected.selector.name ||
      result.owner_syntax !== (expected.selector.self_type ?? expected.selector.name) ||
      result.trait_syntax !== null ||
      result.attributes_present !== expected.attributes ||
      JSON.stringify(result.parameters) !== JSON.stringify(expected.parameters) ||
      result.sites.some(site => site.kind === 'opaque-verbatim' || site.nested_item_depth !== 0)) {
    fail(`selected-posture:${id}`);
  }
  return result;
}

export function checkShapes(content) {
  const authority = selectedInventory('authority', content.authority);
  const admission = selectedInventory('admission', content.admission);
  const readyDecision = selectedInventory('decision', content.decision);
  const api = selectedInventory('api', content.api);
  const bridges = Object.fromEntries(['tenant', 'prototype', 'https'].map(id =>
    [id, selectedInventory(id, content[id])]));

  const gate = exactly(authority.sites, site => site.callee_syntax === 'gate :: admit_authorization_command', 'gate');
  const continuation = exactly(authority.sites, site => site.callee_syntax === 'continuation', 'continuation');
  const gateTraceCall = exactly(authority.sites,
    site => site.callee_syntax === 'auth_foundation_authorization_trace :: record', 'gate-trace-call');
  const gateBinding = authority.top_level_statements[gate.pre_tail_statement] ?? '';
  const gateTrace = authority.top_level_statements[gate.pre_tail_statement + 1] ?? '';
  const gateGuard = authority.top_level_statements[gate.pre_tail_statement + 2] ?? '';
  const readyBindings = authority.local_bindings.filter(binding => binding.name === 'ready');
  const readyBinding = readyBindings[0];
  const readyStatement = authority.top_level_statements[readyBinding?.top_level_statement] ?? '';
  const continuationStatement = authority.top_level_statements[continuation.pre_tail_statement] ?? '';
  const readyInitializer = 'ReadyAuthorization { transaction , evaluation_epoch_id , decision_time , command , authenticated_subject_id , authentication_evidence_revision , route_binding_revision , state : state . into_state () , }';
  if (gate.closure_depth !== 0 || continuation.closure_depth !== 0 ||
      gate.pre_tail_statement >= continuation.pre_tail_statement ||
      gateBinding !== 'let gate_decision = gate :: admit_authorization_command (& context) ;' ||
      gateTraceCall.pre_tail_statement !== gate.pre_tail_statement + 1 ||
      gateTraceCall.closure_depth !== 0 || gateTraceCall.nested_item_depth !== 0 ||
      gateTraceCall.expression_syntax !== '# [cfg (feature = "trace")] auth_foundation_authorization_trace :: record (if gate_decision == gate :: CommandBoundaryDecision :: Ready { auth_foundation_authorization_trace :: EventKind :: GateReady } else { auth_foundation_authorization_trace :: EventKind :: GateDenied } , & request . request_id , Some (evaluation_epoch_id . get ()) ,)' ||
      !gateTrace.includes('EventKind :: GateReady') ||
      !gateTrace.includes('EventKind :: GateDenied') ||
      !gateTrace.includes('& request . request_id , Some (evaluation_epoch_id . get ())') ||
      gateGuard !== 'if gate_decision != gate :: CommandBoundaryDecision :: Ready { return AdmissionOutcome :: Denied ; }' ||
      readyBindings.length !== 1 || readyBinding.closure_depth !== 0 ||
      readyBinding.control_context.length !== 0 ||
      readyBinding.initializer_syntax !== readyInitializer ||
      readyStatement !== `let ready = ${readyInitializer} ;` ||
      readyBinding.top_level_statement <= gate.pre_tail_statement + 2 ||
      readyBinding.top_level_statement + 1 !== continuation.pre_tail_statement ||
      continuation.expression_syntax !== 'continuation (ready)' ||
      continuationStatement !== 'AdmissionOutcome :: Ready (continuation (ready))' ||
      authority.sites.some(site => /authorize/.test(site.callee_syntax))) fail('ready-dominance-shape');

  const issue = exactly(admission.sites, site => site.callee_syntax === 'with_ready_in_transaction', 'epoch-issuer');
  const epochTrace = admission.top_level_statements.find(statement => statement.includes('EventKind :: EpochOpened')) ?? '';
  if (issue.closure_depth !== 0 ||
      issue.expression_syntax !== 'with_ready_in_transaction (& epoch . transaction , & request , epoch . identifier , epoch . decision_time , continuation ,)' ||
      !epochTrace.includes('& request . request_id , Some (identifier . get ())') ||
      !content.admission.includes('continuation: for<\'transaction, \'connection> fn(') ||
      admission.sites.some(site => /authorize/.test(site.callee_syntax))) fail('admission-bypass');

  const policyCall = exactly(readyDecision.sites, site => site.callee_syntax === 'kernel :: authorize', 'policy-call');
  const statements = readyDecision.top_level_statements;
  const decisionTraceCalls = readyDecision.sites.filter(site =>
    site.callee_syntax === 'auth_foundation_authorization_trace :: record');
  const expectedDecisionTraceCalls = ['ReadyDecisionEntered', 'PolicyCallBefore', 'PolicyCallReturned']
    .map((kind, index) => ({ position: [1, 4, 6][index],
      expression: `# [cfg (feature = "trace")] auth_foundation_authorization_trace :: record (auth_foundation_authorization_trace :: EventKind :: ${kind} , & command . request_id , Some (ready . evaluation_epoch_id ()) ,)` }));
  const eventPosition = kind => statements.findIndex(statement => statement.includes(`EventKind :: ${kind}`));
  const policyPosition = statements.findIndex(statement => statement === 'let decision = kernel :: authorize (& context) ;');
  if (policyCall.closure_depth !== 0 || policyCall.expression_syntax !== 'kernel :: authorize (& context)' ||
      decisionTraceCalls.length !== expectedDecisionTraceCalls.length ||
      decisionTraceCalls.some((site, index) => site.pre_tail_statement !== expectedDecisionTraceCalls[index].position ||
        site.closure_depth !== 0 || site.nested_item_depth !== 0 ||
        site.expression_syntax !== expectedDecisionTraceCalls[index].expression) ||
      (content.decision.match(/\bkernel\s*::\s*authorize\b/g) ?? []).length !== 1 ||
      !(eventPosition('ReadyDecisionEntered') < eventPosition('PolicyCallBefore') &&
        eventPosition('PolicyCallBefore') + 1 === policyPosition &&
        policyPosition + 1 === eventPosition('PolicyCallReturned')) ||
      ['ReadyDecisionEntered', 'PolicyCallBefore', 'PolicyCallReturned'].some(kind =>
        !statements[eventPosition(kind)]?.includes('& command . request_id , Some (ready . evaluation_epoch_id ())')) ||
      !content.decision.includes("pub fn authorize(ready: ReadyAuthorization<'_, '_>)") ||
      !content.policy.includes('domainspec-operation-core-instrumentation-free: true') ||
      content.policy.includes('auth_foundation_authorization_trace')) fail('policy-wrapper-or-core');

  const dispatch = exactly(api.sites, site => site.callee_syntax === 'with_ready', 'api-dispatch');
  if (dispatch.expression_syntax !== 'engine . with_ready (request , authorize_ready_decision)' ||
      dispatch.closure_depth !== 2 ||
      !content.api.includes('#[cfg(not(test))]\n            let outcome = catch_unwind') ||
      api.sites.some(site => /kernel :: authorize|authorize_ready_decision/.test(site.callee_syntax))) {
    fail('api-bypass');
  }
  for (const [id, ast] of Object.entries(bridges)) {
    const call = exactly(ast.sites, site => site.callee_syntax === 'with_ready', `bridge-dispatch:${id}`);
    if (call.expression_syntax !== 'service . with_ready (request , authorize_ready_decision)' ||
        ast.sites.some(site => /kernel :: authorize|authorize_ready_decision/.test(site.callee_syntax))) {
      fail(`bridge-bypass:${id}`);
    }
  }
  return { gate_call_count: 1, ready_continuation_count: 1,
    selected_policy_call_count: 1, selected_root_dispatch_count: 4 };
}

function normalClosure(manifest) {
  const metadata = JSON.parse(execFileSync(toolchain, [
    'cargo', 'metadata', '--locked', '--offline', '--format-version', '1',
    '--manifest-path', resolve(implementation, manifest, 'Cargo.toml'),
  ], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
  const packages = new Map(metadata.packages.map(item => [item.id, item]));
  const nodes = new Map(metadata.resolve.nodes.map(item => [item.id, item]));
  const pending = [metadata.resolve.root];
  const seen = new Set();
  const edges = [];
  while (pending.length) {
    const id = pending.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    for (const dep of nodes.get(id)?.deps ?? []) {
      if (!dep.dep_kinds.some(kind => kind.kind === null || kind.kind === 'normal')) continue;
      pending.push(dep.pkg);
      edges.push([packages.get(id).name, packages.get(dep.pkg).name]);
    }
  }
  const names = [...seen].map(id => packages.get(id).name);
  if (names.some(name => forbidden.has(name)) || names.includes(trace) ||
      !names.includes(decision) || !names.includes(policy) ||
      edges.filter(([, target]) => target === policy).some(([from]) => from !== decision) ||
      edges.filter(([, target]) => target === policy).length !== 1) fail(`normal-closure:${manifest}`);
  return { local_crates: names.filter(name => name.startsWith('auth-')).sort(),
    policy_direct_importers: [decision], legacy_decision_crates_reachable: false,
    trace_crate_in_normal_build: false };
}

export function evaluateCurrent() {
  const content = Object.fromEntries(Object.entries(sources).map(([id, path]) =>
    [id, readFileSync(resolve(implementation, path), 'utf8')]));
  const source_sha256 = Object.fromEntries(Object.entries(content).map(([id, value]) => [id, sha(value)]));
  const shapes = checkShapes(content);
  const roots = Object.fromEntries(Object.entries(paths).map(([id, path]) => [id, normalClosure(path)]));
  return {
    schema_version: 'auth-v4b-native-trace-successor/v1-candidate',
    status: 'indeterminate',
    selected_roots: Object.values(paths),
    shapes, roots, source_sha256,
    endpoint_set_closed: false,
    all_path_ready_dominance: false,
    runtime_guarantees_observed: false,
    claim_limit: 'Current selected function shapes and normal Cargo closure exclude enumerated native bypass crates and raw-policy direct importers. Opt-in traces are finite wrapper call-site observations. This does not prove implicit effects, complete endpoint enumeration, all-path dominance, or runtime guarantees.',
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(evaluateCurrent(), null, 2)); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 2; }
}
