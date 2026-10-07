import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateCurrent } from './auth-v4b-concrete-pool-successor.mjs';

const root = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const manifestPath = fileURLToPath(new URL('./AUTH-V4B-NATIVE-ENDPOINT-INVENTORY.v1-candidate.json', import.meta.url));
const legacyPaths = {
  sqlite: 'auth-foundation/implementation/sqlite-provider/src/lib.rs',
  runtime_adapter: 'auth-foundation/implementation/runtime-adapter/src/lib.rs',
};
const legacyCrates = ['auth-foundation-sqlite-provider', 'auth-foundation-runtime-adapter'];
const selected = [
  ['ready-decision', 'decision', 'auth_foundation_authorization_ready_decision::authorize',
    'source-spelled-after-READY; transitive effects open'],
  ['generated-policy', 'policy', 'auth_kernel::authorize',
    'source-spelled-through-ready-decision; only ready-decision has a direct selected-root Cargo dependency; raw public API remains open to future direct dependencies'],
];
const legacy = [
  ['sqlite-service', 'sqlite', 'SqliteAuthorizationService::authorize'],
  ['sqlite-transaction', 'sqlite', 'authorize_in_transaction'],
  ['sqlite-snapshot', 'sqlite', 'SqliteAuthorizationStateSnapshot::authorize'],
  ['runtime-adapter', 'runtime_adapter', 'AuthorizationAdapter::authorize'],
  ['runtime-resolved', 'runtime_adapter', 'authorize_resolved'],
];
const legacyDecisionEdges = [
  ['sqlite-transaction-failure-fallback', 'sqlite', 'SqliteAuthorizationService::authorize',
    'authorize_with_failed_ports', 'AuthorizationAdapter::authorize', false],
];
const nonPolicy = [
  ['admission-evaluator', 'admission', 'produces READY or DENY; excluded from downstream policy family'],
  ['service-entry', 'service', 'request orchestration; downstream policy call remains counted'],
  ['api-engine', 'api', 'dispatch surface; downstream policy call remains counted'],
];
const roots = ['authorization-api', 'tenant-bridge', 'authentication-prototype/bridge', 'authentication-https/bridge'];
const policyCrate = 'auth-foundation-operation-auth-exact-permission-authorize';
const policyDirectEdge = `auth-foundation-authorization-ready-decision->${policyCrate}`;
const effects = ['trait-and-dynamic-dispatch', 'general-def-use-and-cfg-dominance',
  'callbacks-and-iterators', 'sql-and-external-effects', 'async-worker-and-ffi',
  'raw-public-generated-kernel'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { throw new Error(`AUTH_V4B_NATIVE_ENDPOINTS:${code}`); };
const same = (a, b, code) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(code); };

// This verifies an enumerated *candidate* against current exact-byte/source and
// Cargo evidence. It deliberately cannot certify completeness or runtime behavior.
export function checkNativeEndpointInventory(manifest, successor, readSource = readFileSync) {
  if (manifest?.schema_version !== 'auth-v4b-native-endpoint-inventory/v1-candidate' ||
      manifest?.status !== 'candidate-indeterminate' ||
      manifest?.owner_scope_ref !== 'AUTH-DOWNSTREAM-ENDPOINT-SCOPE.v1-owner-decision.md' ||
      successor?.schema_version !== 'auth-foundation.v4b-concrete-pool-successor/v3-candidate' ||
      successor?.status !== 'indeterminate' || successor?.runtime_guarantees_observed !== false) {
    fail('posture');
  }
  same(manifest.selected_roots, roots, 'roots');
  same(successor.selected_roots, roots, 'successor-roots');
  same(manifest.known_selected_policy_endpoints.map(e => [e.id, e.source_id, e.symbol, e.reachability]), selected,
    'selected-endpoints');
  same(manifest.known_legacy_policy_endpoints.map(e => [e.id, e.source_id, e.symbol]), legacy,
    'legacy-endpoints');
  same(manifest.known_legacy_decision_edges.map(e => [e.id, e.source_id, e.caller,
    e.via, e.target, e.selected_root_cargo_reachable]), legacyDecisionEdges,
  'legacy-decision-edges');
  same(manifest.non_policy_surfaces.map(e => [e.id, e.source_id, e.reason]), nonPolicy, 'non-policy');
  if (manifest.known_legacy_policy_endpoints.some(e => e.selected_root_cargo_reachable !== false)) {
    fail('endpoint-classification');
  }
  for (const [id, path] of Object.entries(legacyPaths)) {
    if (sha(readSource(resolve(root, path))) !== manifest.legacy_source_sha256?.[id]) fail(`legacy-drift:${id}`);
  }
  same(Object.keys(manifest.legacy_source_sha256).sort(), Object.keys(legacyPaths).sort(), 'legacy-sources');
  for (const id of ['api', 'service', 'authority', 'decision', 'admission', 'policy', 'tenant', 'prototype', 'https']) {
    if (!/^[a-f0-9]{64}$/.test(successor.source_sha256?.[id] ?? '')) fail(`successor-source:${id}`);
  }
  for (const id of ['api', 'tenant', 'prototype', 'https']) {
    const closure = successor.cargo?.[id];
    if (!Array.isArray(closure?.local_crates) || !Array.isArray(closure?.local_edges) ||
        closure.legacy_decision_crates_reachable !== false ||
        !closure.local_crates.includes('auth-foundation-authorization-ready-decision') ||
        !closure.local_crates.includes(policyCrate) ||
        legacyCrates.some(name => closure.local_crates.includes(name))) fail(`cargo-closure:${id}`);
    // A transitive crate is not directly importable by every predecessor.
    // The current graph permits a direct policy import only in the gated
    // ready-decision crate; adding one to API/service/authority must fail.
    same(closure.local_edges.filter(edge => edge.endsWith(`->${policyCrate}`)),
      [policyDirectEdge], `policy-direct-edge:${id}`);
  }
  same(manifest.open_effect_classes, effects, 'open-effects');
  if (manifest.endpoint_set_closed !== false || manifest.all_path_ready_dominance !== false ||
      manifest.runtime_guarantees_observed !== false ||
      manifest.open_questions_ref !== 'AUTH-V4B-CONCRETE-POOL-SUCCESSOR.v3-candidate.md#open-questions' ||
      !successor.open_edges?.some(e => e.includes('generated policy remains a public raw-context function'))) {
    fail('false-closure');
  }
  return {
    schema_version: 'auth-v4b-native-endpoint-inventory-result/v1-candidate',
    status: 'indeterminate', selected_root_count: roots.length,
    known_selected_policy_endpoint_count: selected.length,
    known_legacy_policy_endpoint_count: legacy.length,
    known_legacy_decision_edge_count: legacyDecisionEdges.length,
    selected_policy_direct_importers: ['auth-foundation-authorization-ready-decision'],
    excluded_legacy_crate_closure_count: roots.length,
    open_effect_classes: effects,
    endpoint_set_closed: false, all_path_ready_dominance: false,
    runtime_guarantees_observed: false,
    claim_limit: 'Exact current READY-successor pins and local Cargo direct edges plus exact legacy source bytes support this finite classification only. The policy crate is transitively present but directly importable only by ready-decision in the selected graph. Dynamic/implicit effects, endpoint-set completeness, all-path dominance, and runtime observation remain open.',
  };
}

export function evaluateCurrentNativeEndpointInventory() {
  return checkNativeEndpointInventory(JSON.parse(readFileSync(manifestPath, 'utf8')), evaluateCurrent());
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(evaluateCurrentNativeEndpointInventory(), null, 2)); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 2; }
}
