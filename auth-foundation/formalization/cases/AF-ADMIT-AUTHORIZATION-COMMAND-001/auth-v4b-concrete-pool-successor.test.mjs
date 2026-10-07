import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { checkReadyShapes, evaluateCurrent } from './auth-v4b-concrete-pool-successor.mjs';

const root = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const base = 'auth-foundation/implementation/';
const paths = {
  api: 'authorization-api/src/lib.rs',
  production_test: 'authorization-api/tests/production_pool.rs',
  service: 'authorization-service/src/lib.rs',
  authority: 'authorization-ready-authority/src/lib.rs',
  decision: 'authorization-ready-decision/src/lib.rs',
  admission: 'command-boundary-runtime-v2/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs',
  policy: 'standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs',
  tenant: 'tenant-bridge/src/main.rs',
  prototype: 'authentication-prototype/bridge/src/main.rs',
  https: 'authentication-https/bridge/src/main.rs',
};
const sources = () => Object.fromEntries(Object.entries(paths).map(([id, path]) =>
  [id, readFileSync(resolve(root, base, path), 'utf8')]));
const changed = (id, before, after) => {
  const selected = sources();
  assert.ok(selected[id].includes(before), `fixture marker ${id}`);
  selected[id] = selected[id].replace(before, after);
  return selected;
};

test('current concrete production-pool successor remains indeterminate', () => {
  const result = evaluateCurrent();
  assert.equal(result.schema_version, 'auth-foundation.v4b-concrete-pool-successor/v3-candidate');
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.runtime_guarantees_observed, false);
  assert.equal(result.graph.selectors.length, 13);
  assert.ok(result.graph.source_spelled_edges.includes(
    'production concrete PoolEngine -> service authorize -> authorize_detailed -> authorize_in_epoch'));
});

test('production alias redirected to a trait object is rejected', () => {
  const fixture = changed('api',
    'type PoolEngine = SqliteAuthService<SystemDecisionClock>;',
    'type PoolEngine = Box<dyn AuthorizationEngine>;');
  assert.throws(() => checkReadyShapes(fixture), /api-production-concrete-dispatch/);
});

test('production constructor changed to box or alternate engine is rejected', () => {
  const boxed = changed('api',
    'fn pool_engine(service: SqliteAuthService<SystemDecisionClock>) -> PoolEngine {\n    service\n}',
    'fn pool_engine(service: SqliteAuthService<SystemDecisionClock>) -> PoolEngine {\n    Box::new(service)\n}');
  assert.throws(() => checkReadyShapes(boxed), /api-production-concrete-dispatch/);
  const alternate = changed('api',
    'SqliteAuthService::open_with_epoch_allocator(',
    'AlternateEngine::open_with_epoch_allocator(');
  assert.throws(() => checkReadyShapes(alternate), /api-concrete-builder/);
});

test('post-READY service path and three bridges remain source-bound', () => {
  const preGate = changed('service',
    'let admitted = with_ready_in_transaction(',
    'let _ = authorize_ready_decision(ready);\n    let admitted = with_ready_in_transaction(');
  assert.throws(() => checkReadyShapes(preGate),
    /service-issuer|service-pre-gate-policy|service-actual-epoch-request/);
  const redirected = changed('tenant',
    'service.authorize(InboundAuthorizationRequest',
    'other.authorize(InboundAuthorizationRequest');
  assert.throws(() => checkReadyShapes(redirected), /bridge-service-call:tenant/);
});
