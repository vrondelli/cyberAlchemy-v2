import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { evaluateCurrent } from './auth-v4b-concrete-call-certificate.mjs';
import { checkEndpointBaseline } from './auth-v4b-endpoint-baseline.mjs';

const manifest = JSON.parse(readFileSync(new URL('./AUTH-V4B-ENDPOINT-BASELINE.v1-candidate.json', import.meta.url)));
const certificate = evaluateCurrent();
const baseline = () => checkEndpointBaseline(certificate, manifest);

test('source-bound endpoint baseline keeps broad policy scope and open closure', () => {
  const result = baseline();
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.classified_named_site_count, 10);
  assert.equal(result.known_policy_endpoint_definition_count, 7);
  assert.equal(result.known_call_path_surface_count, 1);
  assert.ok(result.possible_unresolved_site_count > 0);
  assert.equal(result.endpoint_set_closed, false);
  assert.equal(result.transitive_effect_closure, false);
  assert.equal(result.dependency_closure, false);
  assert.equal(result.alias_and_dynamic_target_resolution, 'open');
  assert.equal(result.runtime_guarantees_observed, false);
});

test('new authorize-spelled or redirected named sites fail classification', () => {
  const inserted = structuredClone(certificate);
  inserted.selected_rooted_call_frontier.rows.push({
    site_id: 'fixture/pre_gate#0', callee_syntax: 'authorize_in_transaction',
    selected_target: null,
  });
  assert.throws(() => checkEndpointBaseline(inserted, manifest), /candidate-count|unclassified-candidate/);
  const redirected = structuredClone(certificate);
  redirected.selected_rooted_call_frontier.rows.find(row =>
    row.site_id === 'service/adapter#1').selected_target = 'sqlite/authorize_in_transaction';
  assert.throws(() => checkEndpointBaseline(redirected, manifest), /candidate-drift/);
  const alias = structuredClone(certificate);
  alias.selected_rooted_call_frontier.rows.push({
    site_id: 'fixture/pre_gate#1', callee_syntax: 'invoke_policy',
    selected_target: 'opaque/execute',
  });
  const limited = checkEndpointBaseline(alias, manifest);
  assert.equal(limited.status, 'indeterminate');
  assert.equal(limited.alias_and_dynamic_target_resolution, 'open');
  assert.equal(limited.noncandidate_explicit_site_count,
    baseline().noncandidate_explicit_site_count + 1);
});

test('source and admission-classification drift fail closed', () => {
  const staleSource = structuredClone(manifest);
  staleSource.source_files.find(source => source.id === 'sqlite').sha256 = '0'.repeat(64);
  assert.throws(() => checkEndpointBaseline(certificate, staleSource), /source-drift:sqlite/);
  const misclassifiedGate = structuredClone(manifest);
  misclassifiedGate.classified_named_sites.find(site => site.site_id === 'wrapper/authorize#12')
    .classification = 'policy-endpoint';
  assert.throws(() => checkEndpointBaseline(certificate, misclassifiedGate), /classification-shape/);
  const forgedEndpoint = structuredClone(manifest);
  forgedEndpoint.known_policy_endpoint_definitions[0].symbol = 'DefinitelyNotTheRealSymbol';
  assert.throws(() => checkEndpointBaseline(certificate, forgedEndpoint), /endpoint-shape/);
  const missingSnapshot = structuredClone(manifest);
  missingSnapshot.known_policy_endpoint_definitions = missingSnapshot.known_policy_endpoint_definitions
    .filter(endpoint => endpoint.id !== 'sqlite-snapshot');
  assert.throws(() => checkEndpointBaseline(certificate, missingSnapshot), /endpoint-count/);
  const missingLegacy = structuredClone(manifest);
  missingLegacy.known_call_path_surfaces = [];
  assert.throws(() => checkEndpointBaseline(certificate, missingLegacy), /call-path-surface-count/);
  const misclassifiedLegacy = structuredClone(manifest);
  misclassifiedLegacy.known_policy_endpoint_definitions.push(misclassifiedLegacy.known_call_path_surfaces[0]);
  assert.throws(() => checkEndpointBaseline(certificate, misclassifiedLegacy), /endpoint-shape/);
  const forgedClaim = structuredClone(manifest);
  forgedClaim.claim_ceiling = 'All paths proved; runtime guarantees observed';
  assert.throws(() => checkEndpointBaseline(certificate, forgedClaim), /claim-ceiling/);
});
