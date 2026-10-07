import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { checkLocalClosureNames, checkLocalEdges, checkReadyShapes, evaluateCurrent } from './auth-v4b-ready-successor.mjs';
import { evaluateCurrent as evaluateConcretePool } from './auth-v4b-concrete-pool-successor.mjs';

const root = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const dir = 'auth-foundation/implementation/';
const files = {
  api: 'authorization-api/src/lib.rs',
  service: 'authorization-service/src/lib.rs',
  authority: 'authorization-ready-authority/src/lib.rs',
  decision: 'authorization-ready-decision/src/lib.rs',
  admission: 'command-boundary-runtime-v2/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs',
  policy: 'standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs',
  tenant: 'tenant-bridge/src/main.rs',
  prototype: 'authentication-prototype/bridge/src/main.rs',
  https: 'authentication-https/bridge/src/main.rs',
};
const sources = () => Object.fromEntries(Object.entries(files).map(([id, path]) =>
  [id, readFileSync(resolve(root, dir, path), 'utf8')]));
const change = (id, before, after) => {
  const source = sources();
  assert.ok(source[id].includes(before), `fixture marker ${id}`);
  source[id] = source[id].replace(before, after);
  return source;
};
let current;

test('historical READY successor rejects the changed API while current concrete pool stays indeterminate', () => {
  assert.throws(() => evaluateCurrent(), /source-drift:api/);
  current = evaluateConcretePool();
  assert.equal(current.status, 'indeterminate');
  assert.equal(current.runtime_guarantees_observed, false);
  assert.equal(current.graph.selectors.length, 13);
  for (const item of Object.values(current.cargo)) assert.equal(item.legacy_decision_crates_reachable, false);
});

test('pre-gate extra decision call is rejected', () => {
  const fixture = change('service',
    'let admitted = with_ready_in_transaction(',
    'let _ = authorize_ready_decision(ready);\n    let admitted = with_ready_in_transaction(');
  assert.throws(() => checkReadyShapes(fixture), /service-issuer|service-pre-gate-policy|service-actual-epoch-request/);
});

test('changed READY issuer branch is rejected', () => {
  const fixture = change('authority',
    'gate::admit_authorization_command(&context) != gate::CommandBoundaryDecision::Ready',
    'gate::admit_authorization_command(&context) == gate::CommandBoundaryDecision::Ready');
  assert.throws(() => checkReadyShapes(fixture), /authority-ready-dominance-shape/);
});

test('bridge service redirection is rejected', () => {
  const fixture = change('tenant',
    'service.authorize(InboundAuthorizationRequest',
    'other.authorize(InboundAuthorizationRequest');
  assert.throws(() => checkReadyShapes(fixture), /bridge-service-call:tenant/);
});

test('extra bridge service call is rejected', () => {
  const fixture = change('prototype',
    'Ok(service.authorize(InboundAuthorizationRequest',
    'let _ = service.authorize(InboundAuthorizationRequest{request_id:"extra".into(),authentication_evidence_ref:"verified".into(),route_id:"documents.read".into()}); Ok(service.authorize(InboundAuthorizationRequest');
  assert.throws(() => checkReadyShapes(fixture), /bridge-service-call:prototype|bridge-extra-decision:prototype/);
});

test('private engine redirection is rejected', () => {
  const fixture = change('api',
    'SqliteAuthService::authorize(self, request)',
    'AlternateEngine::authorize(self, request)');
  assert.throws(() => checkReadyShapes(fixture), /api-concrete-engine/);
});

test('changed Cargo closure rejects both legacy and novel local decision dependencies', () => {
  const selected = current.cargo.api.local_crates;
  assert.throws(() => checkLocalClosureNames('authorization-api/Cargo.toml',
    [...selected, 'auth-foundation-runtime-adapter']), /cargo-closure-set|cargo-forbidden/);
  assert.throws(() => checkLocalClosureNames('authorization-api/Cargo.toml',
    [...selected, 'unexpected-local-decision-crate']), /cargo-closure-set/);
});

test('changed normal local Cargo edges are rejected even with the same crate set', () => {
  const selected = current.cargo.api.local_edges;
  assert.throws(() => checkLocalEdges('authorization-api/Cargo.toml',
    [...selected, 'auth-foundation-trusted-input-reader->auth-foundation-operation-auth-exact-permission-authorize']),
  /cargo-edge-set/);
  assert.throws(() => checkLocalEdges('authorization-api/Cargo.toml', selected.slice(1)),
    /cargo-edge-set/);
});
