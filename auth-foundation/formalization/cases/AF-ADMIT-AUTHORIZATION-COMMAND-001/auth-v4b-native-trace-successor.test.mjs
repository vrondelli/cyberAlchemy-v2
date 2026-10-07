import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { checkShapes, evaluateCurrent } from './auth-v4b-native-trace-successor.mjs';

const root = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const impl = resolve(root, 'auth-foundation/implementation');
const files = {
  api: 'authorization-api/src/lib.rs',
  admission: 'authorization-admission-service/src/lib.rs',
  authority: 'authorization-ready-authority/src/lib.rs',
  decision: 'authorization-ready-decision/src/lib.rs',
  tenant: 'tenant-bridge/src/main.rs',
  prototype: 'authentication-prototype/bridge/src/main.rs',
  https: 'authentication-https/bridge/src/main.rs',
  policy: 'standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs',
};
const current = () => Object.fromEntries(Object.entries(files).map(([id, path]) =>
  [id, readFileSync(resolve(impl, path), 'utf8')]));
const mutation = (id, from, to) => {
  const source = current();
  assert.ok(source[id].includes(from), `mutation anchor: ${id}`);
  source[id] = source[id].replace(from, to);
  return source;
};

test('selected current source and normal-build closure remain candidate-only', () => {
  const result = evaluateCurrent();
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.runtime_guarantees_observed, false);
  assert.equal(result.endpoint_set_closed, false);
  for (const value of Object.values(result.roots)) {
    assert.equal(value.legacy_decision_crates_reachable, false);
    assert.equal(value.trace_crate_in_normal_build, false);
  }
});

test('rejects pre-READY continuation and unbound call-site trace', () => {
  assert.throws(() => checkShapes(mutation('authority',
    'if gate_decision != gate::CommandBoundaryDecision::Ready {',
    'if gate_decision == gate::CommandBoundaryDecision::Ready {')),
  /ready-dominance-shape/);
  assert.throws(() => checkShapes(mutation('decision',
    'EventKind::PolicyCallBefore,', 'EventKind::GateReady,')),
  /policy-wrapper-or-core/);
  assert.throws(() => checkShapes(mutation('authority',
    'if gate_decision != gate::CommandBoundaryDecision::Ready {',
    'let gate_decision = gate::CommandBoundaryDecision::Ready;\n    if gate_decision != gate::CommandBoundaryDecision::Ready {')),
  /ready-dominance-shape/);
});

test('rejects an extra selected policy call or direct bridge bypass', () => {
  assert.throws(() => checkShapes(mutation('decision',
    'let decision = kernel::authorize(&context);',
    'let _ignored = kernel::authorize(&context);\n    let decision = kernel::authorize(&context);')),
  /policy-call/);
  assert.throws(() => checkShapes(mutation('decision',
    'let decision = kernel::authorize(&context);',
    'let extra: fn(&kernel::EvaluationContext) -> kernel::AuthorizationDecision = kernel::authorize;\n    let _ = extra(&context);\n    let decision = kernel::authorize(&context);')),
  /policy-wrapper-or-core/);
  assert.throws(() => checkShapes(mutation('tenant',
    'service.with_ready(request, authorize_ready_decision)',
    'service.authorize(request)')),
  /bridge-dispatch:tenant/);
});

test('binds the private READY token to the sole immediate continuation call', () => {
  assert.throws(() => checkShapes(mutation('authority',
    'AdmissionOutcome::Ready(continuation(ready))',
    'let _first = continuation(ready);\n    AdmissionOutcome::Ready(continuation(ready))')),
  /continuation:2/);
  assert.throws(() => checkShapes(mutation('authority',
    'AdmissionOutcome::Ready(continuation(ready))',
    'let _marker = 0;\n    AdmissionOutcome::Ready(continuation(ready))')),
  /ready-dominance-shape/);
  assert.throws(() => checkShapes(mutation('authority',
    'state: state.into_state(),',
    'state: Default::default(),')),
  /ready-dominance-shape/);
});

test('rejects selected-body cfg or signature drift before source-shape claims', () => {
  assert.throws(() => checkShapes(mutation('authority',
    'pub fn with_ready_in_transaction<',
    '#[cfg(test)]\npub fn with_ready_in_transaction<')),
  /selected-posture:authority/);
  assert.throws(() => checkShapes(mutation('authority',
    'decision_time: u64,\n    continuation:',
    'decision_time: i64,\n    continuation:')),
  /selected-posture:authority/);
});

test('requires an actual gate trace call, not just event tokens', () => {
  assert.throws(() => checkShapes(mutation('authority',
    'auth_foundation_authorization_trace::record(',
    'auth_foundation_authorization_trace::record_noop(')),
  /gate-trace-call:0/);
  assert.throws(() => checkShapes(mutation('decision',
    'auth_foundation_authorization_trace::record(',
    'auth_foundation_authorization_trace::record_noop(')),
  /policy-wrapper-or-core/);
});
