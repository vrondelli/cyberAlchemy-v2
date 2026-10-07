import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {loadVerifiedDecisionProfile, routeRequest as routeRequestWithoutDefaults, admitDecisionProfile} from '../index.mjs';
import {semanticModulePort} from './semantic-module-fixture.mjs';

const root = fileURLToPath(new URL('../../../../../../', import.meta.url));
const profilePath = fileURLToPath(new URL('../profiles/cyberalchemy-v1.json', import.meta.url));
const loaded = loadVerifiedDecisionProfile(profilePath, root);
assert.equal(loaded.ok, true, loaded.reason_codes?.join(','));
const modulePort = semanticModulePort();
const routeRequest = (input, profile) => routeRequestWithoutDefaults(input, profile, modulePort);
const context = (text, objective = null, effects = []) => ({schema_version:'are.request-context/v1',request_id:'lookup-regression',raw_request:text,objective_kind:objective,requested_effects:effects,target_refs:[],constraints:[],evidence_refs:['user'],field_postures:{request_id:'inferred',raw_request:'explicit',objective_kind:objective===null?'absent':'explicit',requested_effects:effects.length?'explicit':'absent',target_refs:'absent',constraints:'absent',evidence_refs:'explicit'}});

test('lookup policy is read-only and complete against the declared route', () => {
  const policy = loaded.value.routes.find(r => r.route_id === 'CA2-ROUTE-DOMAINSPEC-CORE');
  assert.deepEqual(policy.effect_classes, ['local-read']);
  assert.equal(policy.owner_gate_ref, null);
  const registry = JSON.parse(readFileSync(root + '/cyberAlchemy-v2/agent-routing/routes.json'));
  for (const phrase of registry.routes.find(r => r.route_id === policy.route_id).match) {
    const result = routeRequest(context(phrase), loaded.value);
    assert.equal(result.kind, 'direct', phrase);
    assert.equal(result.selected.route_id, policy.route_id, phrase);
  }
});
test('explicit locate objective resolves an alias request', () => {
  const result = routeRequest(context('Locate co-op inside ../domainspec-core', 'locate-domainspec-core'), loaded.value);
  assert.equal(result.kind, 'direct');
  assert.equal(result.selected.route_id, 'CA2-ROUTE-DOMAINSPEC-CORE');
});
test('lookup cannot suppress publication or implementation effect conflicts', () => {
  for (const effect of ['publication', 'implementation']) {
    const result = routeRequest(context('Find inside ../domainspec-core', 'locate-domainspec-core', [effect]), loaded.value);
    assert.notEqual(result.kind, 'direct');
  }
});
test('negated lookup and unmatched requests do not gain a fallback', () => {
  assert.equal(routeRequest(context('Do not find inside ../domainspec-core.'), loaded.value).kind, 'block');
  assert.equal(routeRequest(context('Have a pleasant afternoon.'), loaded.value).kind, 'block');
});
test('provenance tampering still invalidates the profile digest', () => {
  const profile = JSON.parse(readFileSync(profilePath));
  profile.provenance.find(s => s.id === 'route-registry').sha256 = '0'.repeat(64);
  assert.equal(admitDecisionProfile(profile).ok, false);
});
