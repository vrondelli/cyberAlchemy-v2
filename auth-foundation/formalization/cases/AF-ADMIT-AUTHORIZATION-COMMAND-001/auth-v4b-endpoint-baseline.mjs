import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';
import { evaluateCurrent } from './auth-v4b-concrete-call-certificate.mjs';

const repositoryRoot = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const manifestPath = fileURLToPath(new URL('./AUTH-V4B-ENDPOINT-BASELINE.v1-candidate.json', import.meta.url));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const reject = code => { throw new Error(`endpoint-baseline:${code}`); };
const sourcePaths = {
  api: 'auth-foundation/implementation/authorization-api/src/lib.rs',
  service: 'auth-foundation/implementation/authorization-service/src/lib.rs',
  metadata_reader: 'auth-foundation/implementation/authorization-metadata-reader/src/lib.rs',
  trusted: 'auth-foundation/implementation/trusted-input-reader/src/lib.rs',
  trusted_facade: 'auth-foundation/implementation/trusted-input-provider/src/lib.rs',
  pre_resolved: 'auth-foundation/implementation/trusted-boundary-pre-resolved-v2-candidate/src/lib.rs',
  wrapper: 'auth-foundation/implementation/trusted-boundary-v2/src/lib.rs',
  legacy_boundary: 'auth-foundation/implementation/trusted-boundary/src/lib.rs',
  admission_kernel: 'auth-foundation/implementation/command-boundary-runtime-v2/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs',
  sqlite: 'auth-foundation/implementation/sqlite-provider/src/lib.rs',
  state_reader: 'auth-foundation/implementation/authorization-state-reader/src/lib.rs',
  state_model: 'auth-foundation/implementation/authorization-state-model/src/lib.rs',
  runtime_adapter: 'auth-foundation/implementation/runtime-adapter/src/lib.rs',
  policy_kernel: 'auth-foundation/implementation/standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs',
};
const policyKernelPin = '13c696a8f17b4d6bff1529b2cb75d1780aca38f45277f8c454cf7ec024b7efe9';
const expectedEndpoints = {
  'selected-service-adapter': ['service', 'ResolvedDecisionService::authorize', 'selected trait implementation; explicit body in pinned source'],
  'sqlite-service': ['sqlite', 'SqliteAuthorizationService::authorize', 'known public native entrypoint; reachability open'],
  'sqlite-snapshot': ['sqlite', 'SqliteAuthorizationStateSnapshot::authorize', 'known public native entrypoint; reachability open'],
  'sqlite-transaction': ['sqlite', 'authorize_in_transaction', 'known public native entrypoint; selected reachability open'],
  'runtime-generic-adapter': ['runtime_adapter', 'AuthorizationAdapter::authorize', 'known public native entrypoint; reachability open'],
  'runtime-resolved': ['runtime_adapter', 'authorize_resolved', 'selected adapter direct call target inferred from import, not compiler-resolved'],
  'generated-policy-kernel': ['policy_kernel', 'authorize', 'runtime resolved target inferred, not compiler-resolved'],
};
const expectedCallPathSurfaces = {
  'legacy-boundary': ['legacy_boundary', 'TrustedAuthorizationBoundary::authorize', 'legacy public boundary dispatch surface; downstream target and reachability open'],
};
const expectedClasses = {
  'public/api_runtime_authorize#14': 'public-dispatch',
  'public/api_engine_authorize#0': 'public-entry',
  'public/service_authorize#0': 'orchestration',
  'public/service_detailed#13': 'orchestration',
  'public/service_in_epoch#79': 'admission-bridge',
  'pre_resolved/authorize#0': 'admission-wrapper',
  'pre_resolved/borrowed#0': 'post-ready-forwarding',
  'wrapper/authorize#12': 'admission-evaluator-not-downstream',
  'wrapper/authorize#13': 'post-ready-forwarding',
  'service/adapter#1': 'policy-endpoint-candidate-unresolved-target',
};
const claimCeiling = 'Source-pinned, authorize/admit-spelled site baseline only. Aliases, dynamic targets, dependency and transitive effect closure, path dominance, endpoint-set completeness, and runtime guarantees remain unproved.';
const candidate = row => /authorize|admit_authorization_command/.test(
  `${row.callee_syntax ?? ''} ${row.selected_target ?? ''}`);

export function checkEndpointBaseline(certificate, manifest, readSource = readFileSync) {
  if (manifest?.schema_version !== 'auth-v4b-endpoint-baseline/v1-candidate' ||
      manifest?.status !== 'candidate-indeterminate' ||
      manifest?.scope !== 'selected public Auth builder and authorize path; explicit authorize/admit-spelled syntax only' ||
      certificate?.status !== 'indeterminate' ||
      certificate?.runtime_guarantees_observed !== false) reject('input-posture');
  const sources = new Map();
  for (const source of manifest.source_files ?? []) {
    if (!/^[a-z][a-z_]*$/.test(source.id) || sources.has(source.id) ||
        sourcePaths[source.id] !== source.path ||
        !/^[a-f0-9]{64}$/.test(source.sha256)) reject('source-shape');
    const path = resolve(repositoryRoot, source.path);
    if (!path.startsWith(`${repositoryRoot}${sep}`)) reject('source-path');
    if (digest(readSource(path)) !== source.sha256) reject(`source-drift:${source.id}`);
    sources.set(source.id, source);
  }
  if (sources.size !== 14) reject('source-count');
  if (sources.get('policy_kernel')?.sha256 !== policyKernelPin) reject('policy-kernel-pin');
  const certificateSources = certificate.selected_rooted_call_frontier?.source_sha256;
  for (const [sourceId, certificateId] of [
    ['api', 'api'], ['service', 'service'], ['metadata_reader', 'metadata_reader'], ['pre_resolved', 'pre_resolved'],
    ['trusted', 'trusted'], ['trusted_facade', 'trusted_facade'],
    ['wrapper', 'wrapper'], ['admission_kernel', 'kernel'],
    ['sqlite', 'sqlite_facade'], ['state_reader', 'state_reader'],
    ['state_model', 'state_model'], ['runtime_adapter', 'runtime_adapter'],
  ]) {
    if (sources.get(sourceId)?.sha256 !== certificateSources?.[certificateId]) {
      reject(`certificate-source:${sourceId}`);
    }
  }
  const endpoints = new Map();
  for (const endpoint of manifest.known_policy_endpoint_definitions ?? []) {
    if (typeof endpoint.id !== 'string' || endpoints.has(endpoint.id) ||
        !sources.has(endpoint.source_id) ||
        endpoint.source_id !== expectedEndpoints[endpoint.id]?.[0] ||
        endpoint.symbol !== expectedEndpoints[endpoint.id]?.[1] ||
        endpoint.binding !== expectedEndpoints[endpoint.id]?.[2]) reject('endpoint-shape');
    endpoints.set(endpoint.id, endpoint);
  }
  if (endpoints.size !== 7) reject('endpoint-count');
  const callPathSurfaces = new Map();
  for (const surface of manifest.known_call_path_surfaces ?? []) {
    if (typeof surface.id !== 'string' || callPathSurfaces.has(surface.id) ||
        endpoints.has(surface.id) || !sources.has(surface.source_id) ||
        surface.source_id !== expectedCallPathSurfaces[surface.id]?.[0] ||
        surface.symbol !== expectedCallPathSurfaces[surface.id]?.[1] ||
        surface.binding !== expectedCallPathSurfaces[surface.id]?.[2]) reject('call-path-surface-shape');
    callPathSurfaces.set(surface.id, surface);
  }
  if (callPathSurfaces.size !== 1) reject('call-path-surface-count');
  const classified = new Map();
  for (const site of manifest.classified_named_sites ?? []) {
    if (typeof site.site_id !== 'string' || classified.has(site.site_id) ||
        typeof site.callee_syntax !== 'string' ||
        (site.selected_target !== null && typeof site.selected_target !== 'string') ||
        site.classification !== expectedClasses[site.site_id]) {
      reject('classification-shape');
    }
    classified.set(site.site_id, site);
  }
  const rows = certificate.selected_rooted_call_frontier?.rows;
  if (!Array.isArray(rows)) reject('frontier-shape');
  const candidateRows = rows.filter(candidate);
  if (candidateRows.length !== classified.size) reject('candidate-count');
  for (const row of candidateRows) {
    const entry = classified.get(row.site_id);
    if (!entry) reject(`unclassified-candidate:${row.site_id}`);
    if (entry.callee_syntax !== row.callee_syntax ||
        entry.selected_target !== row.selected_target) reject(`candidate-drift:${row.site_id}`);
  }
  for (const siteId of classified.keys()) {
    if (!candidateRows.some(row => row.site_id === siteId)) reject(`stale-classification:${siteId}`);
  }
  if (manifest.open_questions_ref !==
      'goals/plans/domainspec-alchlang-review-repair/AUTH-V4B-CAPABILITY-ISOLATION-PLAN.v1-candidate.md#open-questions') {
    reject('open-questions-ref');
  }
  if (manifest.claim_ceiling !== claimCeiling) reject('claim-ceiling');
  return {
    schema_version: 'auth-v4b-endpoint-baseline-result/v1-candidate',
    status: 'indeterminate',
    source_sha256: Object.fromEntries([...sources].map(([id, source]) => [id, source.sha256])),
    classified_named_site_count: candidateRows.length,
    noncandidate_explicit_site_count: rows.length - candidateRows.length,
    known_policy_endpoint_definition_count: endpoints.size,
    known_call_path_surface_count: callPathSurfaces.size,
    possible_unresolved_site_count: certificate.selected_rooted_call_frontier.possible_unresolved_site_count,
    transitive_effect_closure: false,
    dependency_closure: false,
    alias_and_dynamic_target_resolution: 'open',
    endpoint_set_closed: false,
    runtime_guarantees_observed: false,
    claim_ceiling: claimCeiling,
  };
}

export function evaluateCurrentEndpointBaseline() {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return checkEndpointBaseline(evaluateCurrent(), manifest);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(evaluateCurrentEndpointBaseline(), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
