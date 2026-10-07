import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { extractWrapperFixture } from './auth-v2-wrapper-extract.mjs';
import { checkSelectedGraph, evaluateCurrent, extractAstPreTailInventory, extractPreResolved, extractSelectedInstanceTransfer, extractSelectedProviderRoots, extractSelectedPublicEntrySpine, extractSelectedPublicPath, extractSelectedServiceHelperGraph, extractSelectedServiceJoinGraph, extractSelectedSqliteProviderGraph, extractSelectedTrustedProviderGraph, extractServiceBinding, selectedBoundaryChain, selectedParsedSiteManifest, selectedRootedCallFrontier, selectedServiceDependencyBridge, selectedIteratorCallbackBridge, selectedIdentifierFunctionValueBridge, selectedPreResultEffectInventory, selectedReachedClosureCatalog, selectedSqlRowCallbackBridge, selectedSqlRowIteratorCallbackBridge, selectedSqlRowIteratorConsumerBridge, selectedSqlIteratorDependencySemantics, selectedSharedRequestOwnership, selectedWrapperGateBridge, selectedKernelCargoIdentity, inspectSelectedPublicHookFixture, inspectSelectedSqlRowCallbackFixture, inspectSelectedSqlRowIteratorCallbackFixture, inspectSelectedWrapperMapperFixture } from './auth-v4b-concrete-call-certificate.mjs';

const prePath = fileURLToPath(new URL('../../../implementation/trusted-boundary-pre-resolved-v2-candidate/src/lib.rs', import.meta.url));
const preCargoPath = fileURLToPath(new URL('../../../implementation/trusted-boundary-pre-resolved-v2-candidate/Cargo.toml', import.meta.url));
const wrapperPath = fileURLToPath(new URL('../../../implementation/trusted-boundary-v2/src/lib.rs', import.meta.url));
const wrapperCargoPath = fileURLToPath(new URL('../../../implementation/trusted-boundary-v2/Cargo.toml', import.meta.url));
const kernelCargoPath = fileURLToPath(new URL('../../../implementation/command-boundary-runtime-v2/Cargo.toml', import.meta.url));
const servicePath = fileURLToPath(new URL('../../../implementation/authorization-service/src/lib.rs', import.meta.url));
const serviceCargoPath = fileURLToPath(new URL('../../../implementation/authorization-service/Cargo.toml', import.meta.url));
const metadataReaderPath = fileURLToPath(new URL('../../../implementation/authorization-metadata-reader/src/lib.rs', import.meta.url));
const metadataReaderCargoPath = fileURLToPath(new URL('../../../implementation/authorization-metadata-reader/Cargo.toml', import.meta.url));
const metadataReaderLockPath = fileURLToPath(new URL('../../../implementation/authorization-metadata-reader/Cargo.lock', import.meta.url));
const apiPath = fileURLToPath(new URL('../../../implementation/authorization-api/src/lib.rs', import.meta.url));
const apiCargoPath = fileURLToPath(new URL('../../../implementation/authorization-api/Cargo.toml', import.meta.url));
const trustedProviderPath = fileURLToPath(new URL('../../../implementation/trusted-input-reader/src/lib.rs', import.meta.url));
const trustedProviderCargoPath = fileURLToPath(new URL('../../../implementation/trusted-input-reader/Cargo.toml', import.meta.url));
const trustedRuntimePath = fileURLToPath(new URL('../../../implementation/trusted-input-runtime/src/domainspec/rust/trusted-input-resolution/resolve-trusted-inputs.rs', import.meta.url));
const trustedRuntimeCargoPath = fileURLToPath(new URL('../../../implementation/trusted-input-runtime/Cargo.toml', import.meta.url));
const sqliteProviderPath = fileURLToPath(new URL('../../../implementation/sqlite-provider/src/lib.rs', import.meta.url));
const sqliteProviderCargoPath = fileURLToPath(new URL('../../../implementation/sqlite-provider/Cargo.toml', import.meta.url));
const stateReaderPath = fileURLToPath(new URL('../../../implementation/authorization-state-reader/src/lib.rs', import.meta.url));
const stateReaderCargoPath = fileURLToPath(new URL('../../../implementation/authorization-state-reader/Cargo.toml', import.meta.url));
const stateModelPath = fileURLToPath(new URL('../../../implementation/authorization-state-model/src/lib.rs', import.meta.url));
const stateModelCargoPath = fileURLToPath(new URL('../../../implementation/authorization-state-model/Cargo.toml', import.meta.url));
const runtimeAdapterPath = fileURLToPath(new URL('../../../implementation/runtime-adapter/src/lib.rs', import.meta.url));
const runtimeAdapterCargoPath = fileURLToPath(new URL('../../../implementation/runtime-adapter/Cargo.toml', import.meta.url));
const legacyBoundaryPath = fileURLToPath(new URL('../../../implementation/trusted-boundary/src/lib.rs', import.meta.url));
const implementationRoot = fileURLToPath(new URL('../../../implementation/', import.meta.url));
const serviceLockPath = fileURLToPath(new URL('../../../implementation/authorization-service/Cargo.lock', import.meta.url));
const apiLockPath = fileURLToPath(new URL('../../../implementation/authorization-api/Cargo.lock', import.meta.url));
const serviceMigrationPath = fileURLToPath(new URL('../../../implementation/authorization-service/migrations/0002_auth_service_epoch.sql', import.meta.url));
const callInventoryCargoPath = fileURLToPath(new URL('./v4b-call-inventory/Cargo.toml', import.meta.url));
const toolchainPath = fileURLToPath(new URL('../../../../tools/toolchain/run', import.meta.url));
const pre = readFileSync(prePath, 'utf8');
const preCargo = readFileSync(preCargoPath, 'utf8');
const wrapper = readFileSync(wrapperPath, 'utf8');
const wrapperCargo = readFileSync(wrapperCargoPath, 'utf8');
const kernelCargo = readFileSync(kernelCargoPath, 'utf8');
const service = readFileSync(servicePath, 'utf8');
const serviceCargo = readFileSync(serviceCargoPath, 'utf8');
const metadataReader = readFileSync(metadataReaderPath, 'utf8');
const metadataReaderCargo = readFileSync(metadataReaderCargoPath, 'utf8');
const api = readFileSync(apiPath, 'utf8');
const apiCargo = readFileSync(apiCargoPath, 'utf8');
const trustedProvider = readFileSync(trustedProviderPath, 'utf8');
const trustedProviderCargo = readFileSync(trustedProviderCargoPath, 'utf8');
const trustedRuntime = readFileSync(trustedRuntimePath, 'utf8');
const trustedRuntimeCargo = readFileSync(trustedRuntimeCargoPath, 'utf8');
const sqliteProvider = readFileSync(sqliteProviderPath, 'utf8');
const sqliteProviderCargo = readFileSync(sqliteProviderCargoPath, 'utf8');
const stateReader = readFileSync(stateReaderPath, 'utf8');
const stateReaderCargo = readFileSync(stateReaderCargoPath, 'utf8');
const stateModel = readFileSync(stateModelPath, 'utf8');
const stateModelCargo = readFileSync(stateModelCargoPath, 'utf8');
const runtimeAdapter = readFileSync(runtimeAdapterPath, 'utf8');
const runtimeAdapterCargo = readFileSync(runtimeAdapterCargoPath, 'utf8');
const legacyBoundary = readFileSync(legacyBoundaryPath, 'utf8');
const selected = extractPreResolved(pre, preCargo);
let cachedCurrent;
const currentCertificate = () => cachedCurrent ??= evaluateCurrent();

test('shared inbound request ownership and direct legacy dependency isolation fail closed', () => {
  const inputs = [stateModel, runtimeAdapter, legacyBoundary, wrapper, service, serviceCargo, api, apiCargo];
  const current = selectedSharedRequestOwnership(...inputs);
  assert.equal(current.request_owner, 'authorization-state-model');
  assert.equal(current.selected_service_and_api_legacy_boundary_dependency, false);
  assert.equal(currentCertificate().selected_shared_request_ownership.request_owner, current.request_owner);
  const mutate = (index, value) => inputs.map((item, i) => i === index ? value : item);
  assert.throws(() => selectedSharedRequestOwnership(...mutate(0, stateModel.replace('pub struct InboundAuthorizationRequest {', 'pub struct OtherRequest {'))), /shared-request-ownership/);
  assert.throws(() => selectedSharedRequestOwnership(...mutate(5, `${serviceCargo}\nauth-foundation-trusted-boundary = { path = "../trusted-boundary" }`)), /shared-request-ownership/);
  assert.throws(() => selectedSharedRequestOwnership(...mutate(7, `${apiCargo}\nauth-foundation-trusted-boundary = { path = "../trusted-boundary" }`)), /shared-request-ownership/);
});
const eagerSameInstanceFixture = () => {
  const adapter = `        &mut ResolvedDecisionService {
            expected_request_id,
            expected: &command,
            state: Some(authorization_state),
            downstream_port_calls: &mut downstream_port_calls,
        },`;
  const named = `    let mut decision_service = ResolvedDecisionService {
        expected_request_id,
        expected: &command,
        state: Some(authorization_state),
        downstream_port_calls: &mut downstream_port_calls,
    };
    let _ = V2AuthorizationDecisionService::authorize(&mut decision_service, kernel_command.clone());
    let decision = authorize_pre_resolved(`;
  assert.ok(service.includes(adapter));
  const changed = service.replace('    let decision = authorize_pre_resolved(', named)
    .replace(adapter, '        &mut decision_service,');
  assert.notEqual(changed, service);
  return changed;
};
const mixedEngineFixture = () => {
  const insertion = `    struct AlternateEngine;
    impl AuthorizationEngine for AlternateEngine {
        fn authorize(&mut self, _request: InboundAuthorizationRequest) -> BinaryAuthorizationDecision {
            BinaryAuthorizationDecision::Allow
        }
    }
    engines.push(Box::new(AlternateEngine));
`;
  const changed = api.replace('    AuthorizationRuntime::from_engines(\n        engines,',
    `${insertion}    AuthorizationRuntime::from_engines(\n        engines,`);
  assert.notEqual(changed, api);
  return changed;
};
const movedPutFixture = () => {
  const baseline = `            match outcome {
                Ok(decision) => {
                    pool.put(engine)?;
                    Ok(decision)
                }
                Err(_) => Err(AuthorizationRuntimeError::WorkerUnavailable),
            }`;
  const changed = api.replace(baseline, `            match outcome {
                Ok(decision) => Ok(decision),
                Err(_) => {
                    pool.put(engine)?;
                    Err(AuthorizationRuntimeError::WorkerUnavailable)
                }
            }`);
  assert.notEqual(changed, api);
  return changed;
};

test('current sublemma is source-derived but full V4b stays indeterminate', () => {
  const result = currentCertificate();
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.verified_sublemma, 'selected-public-path-service-tail-and-wrapper-direct-site-shape');
  assert.equal(result.selected_builder_engine_shape, 'SqliteAuthService<SystemDecisionClock>');
  assert.equal(result.selected_public_hook_shape, 'no-op');
  assert.equal(result.selected_public_entry_spine.status, 'indeterminate');
  assert.equal(result.selected_public_entry_spine.runtime_guarantees_observed, false);
  assert.equal(result.selected_instance_transfer.status, 'indeterminate');
  assert.equal(result.selected_instance_transfer.selected_origin_template_property, true);
  assert.equal(result.selected_instance_transfer.source_matched_transfer_sites.length, 11);
  assert.equal(result.selected_instance_transfer.normal_return_repool_template_property, true);
  assert.equal(result.selected_instance_transfer.ast_binding_facts.ownership_and_dispatch_proved, false);
  assert.equal(result.selected_instance_transfer.generic_from_engines_origin_set, 'unconstrained');
  assert.equal(Object.keys(result.selected_public_entry_spine.nodes).length, 16);
  assert.equal(result.selected_public_entry_spine.edges.length, 14);
  assert.equal(result.selected_detailed_in_epoch_call_occurrence, 1);
  assert.equal(result.selected_call_receiver_shape, 'ResolvedDecisionService');
  assert.equal(result.source_counter_increment_shape, 1);
  assert.equal(result.selected_call_reachable_from_tail_entry, true);
  assert.equal(result.tail_statement_count, 5);
  assert.equal(result.service_tail_ir.prefix_adapter_calls, 0);
  assert.equal(result.service_tail_ir.adapter_form, 'inline');
  assert.equal(result.graph.pre_kernel_adapter_calls, 0);
  assert.equal(result.pre_tail_inventory.syntax_binding, 'complete-lexed-prefix-equality-to-pinned-source');
  assert.equal(result.pre_tail_inventory.selected_named_call_sites.length, 6);
  assert.equal(result.pre_tail_inventory.exhaustive, false);
  assert.ok(result.pre_tail_inventory.unresolved_leaves.includes('local-helper-and-inline-closure-callees'));
  assert.equal(result.pre_tail_inventory.closure, 'open');
  assert.equal(result.ast_pre_tail_inventory.pre_tail_statement_count, 20);
  assert.equal(result.ast_pre_tail_inventory.sites.length, 65);
  assert.equal(result.ast_pre_tail_inventory.selected_parsed_call_nodes_exhaustive, true);
  assert.equal(result.ast_pre_tail_inventory.transitive_effect_closure, false);
  assert.equal(result.ast_pre_tail_inventory.attributes_present, 0);
  assert.ok(result.ast_pre_tail_inventory.sites.every((site, index) => site.ordinal === index));
  assert.ok(result.ast_pre_tail_inventory.sites.some(site => site.kind === 'method' && site.receiver_syntax));
  assert.ok(result.unresolved.includes('public-entry-to-service-tail-reachability-and-effects'));
  assert.equal(result.graph.deny_endpoint_calls, 0);
  assert.equal(result.graph.ready_endpoint_calls, 1);
  assert.equal(result.runtime_guarantees_observed, false);
  assert.ok(result.unresolved.includes('service-helper-and-callback-closure'));
  assert.equal(Object.keys(result.service_join_graph.nodes).length, 11);
  assert.equal(result.service_join_graph.edges.length, 10);
  assert.equal(result.service_join_graph.potential_decision_named_sites.length, 0);
  assert.equal(result.service_join_graph.selected_body_binding, 'whole-lexed-body-equality-to-pinned-source');
  assert.equal(result.service_join_graph.constructor_argument_mapping, 'open');
  assert.equal(result.service_join_graph.dispatch_and_effect_closure, 'open');
  assert.equal(result.selected_parsed_site_manifest.selected_body_count, 38);
  assert.equal(result.selected_parsed_site_manifest.site_count, 281);
  assert.equal(result.selected_parsed_site_manifest.bound_site_count, 62);
  assert.equal(result.selected_parsed_site_manifest.unresolved_site_count, 219);
  assert.equal(result.selected_parsed_site_manifest.runtime_guarantees_observed, false);
  assert.equal(result.selected_rooted_call_frontier.status, 'indeterminate');
  assert.equal(result.selected_rooted_call_frontier.input_mode, 'pinned-production');
  assert.equal(result.selected_rooted_call_frontier.runtime_guarantees_observed, false);
  assert.equal(result.selected_rooted_call_frontier.catalog_site_count, 541);
  assert.equal(result.selected_rooted_call_frontier.projection_overlap_count, 65);
});

test('two-root named-edge projection keeps unresolved and unentered syntax distinct', () => {
  const result = currentCertificate();
  const fixtureFrontier = (...args) => selectedRootedCallFrontier(...args, { fixture: true });
  const frontier = result.selected_rooted_call_frontier;
  assert.deepEqual(frontier.roots.map(root => root.phase), ['construction', 'invocation']);
  assert.equal(frontier.public_site_count, 186);
  assert.equal(frontier.selected_site_count, 281);
  assert.equal(frontier.boundary_site_count, 23);
  assert.equal(frontier.gate_site_count, 51);
  assert.equal(frontier.catalog_site_count, frontier.public_site_count + frontier.selected_site_count + frontier.boundary_site_count + frontier.gate_site_count);
  assert.equal(frontier.possible_site_count, 474);
  assert.equal(frontier.possible_unresolved_site_count, 352);
  assert.equal(frontier.deferred_site_count, 61);
  assert.equal(frontier.prefix_projected_edge_count, 27);
  assert.equal(frontier.iterator_callback_bridge.chains.length, 4);
  assert.equal(frontier.iterator_callback_bridge.callback_sites.length, 32);
  assert.deepEqual(frontier.iterator_callback_bridge.tail_named_helper_edges.map(edge =>
    [edge.ordinal, edge.to]), [
    [73, 'service/valid_reference'],
    [74, 'service/valid_permission_component'],
    [75, 'service/valid_permission_component'],
    [76, 'service/valid_permission_component'],
    [77, 'service/valid_reference'],
  ]);
  assert.equal(frontier.iterator_callback_bridge.status, 'indeterminate');
  for (const edge of frontier.iterator_callback_bridge.tail_named_helper_edges) {
    const row = frontier.rows.find(site => site.site_id === `${edge.from}#${edge.ordinal}`);
    assert.equal(row?.selected_target, edge.to);
    assert.equal(row?.posture, 'possible-under-listed-assumptions');
    assert.ok(row.entered_under.some(path => path.includes('iterator-collect-3-callback-may-run')));
    assert.ok(frontier.rows.some(site => site.body_id === edge.to &&
      site.body_entered_under.some(path => path.includes(edge.assumption))));
    assert.equal(row.effect_status, 'open');
  }
  for (const callback of frontier.iterator_callback_bridge.callback_sites) {
    const row = frontier.rows.find(site => site.site_id === callback.site_id);
    assert.equal(row?.posture, 'possible-under-listed-assumptions', callback.site_id);
    assert.ok(row.entered_under.some(path => path.includes(callback.assumption)), callback.site_id);
    assert.equal(row.effect_status, 'open');
  }
  for (let ordinal = 0; ordinal < 65; ordinal++) {
    const publicSite = frontier.rows.find(row => row.site_id === `public/service_in_epoch#${ordinal}`);
    const selectedSite = frontier.rows.find(row => row.site_id === `service/service_pre_tail#${ordinal}`);
    assert.ok(publicSite && selectedSite);
    assert.equal(publicSite.selected_target, selectedSite.selected_target,
      `duplicate pre-tail target ${ordinal}`);
    assert.equal(publicSite.expression_syntax, selectedSite.expression_syntax,
      `duplicate pre-tail syntax ${ordinal}`);
  }
  assert.equal(frontier.rows.find(row => row.site_id === 'public/service_in_epoch#1').selected_target,
    'service/epoch_transaction');
  assert.equal(frontier.rows.find(row => row.site_id === 'public/service_in_epoch#44').selected_target,
    'service/command_from_snapshot');
  assert.equal(frontier.rows.find(row => row.site_id === 'public/service_in_epoch#56').selected_target,
    'join/join');
  assert.equal(frontier.dependency_bridge.callback_body.effects_closed, false);
  assert.equal(frontier.gate_bridge.status, 'indeterminate');
  assert.ok(frontier.rows.some(row => row.site_id === 'wrapper/authorize#12' &&
    row.selected_target === 'kernel/admit' && row.effect_status === 'open'));
  assert.ok(frontier.rows.some(row => row.site_id === 'kernel/admit#0' &&
    row.selected_target === 'kernel/admissible' &&
    row.posture === 'possible-under-listed-assumptions'));
  assert.ok(frontier.rows.some(row => row.site_id === 'wrapper/authorize#4' &&
    row.selected_target === 'wrapper/construct_candidate'));
  assert.ok(frontier.rows.some(row => row.site_id === 'wrapper/authorize#1' &&
    row.selected_target === 'resolver/authentication'));
  assert.ok(frontier.rows.some(row => row.site_id === 'wrapper/authorize#3' &&
    row.selected_target === 'resolver/routes'));
  assert.ok(frontier.rows.some(row => row.body_id === 'public/api_builder' &&
    row.posture === 'possible-under-listed-assumptions' && row.entered_under.some(path => path.length === 0)));
  assert.ok(frontier.rows.some(row => row.body_id === 'public/api_engine_authorize' &&
    row.entered_under.some(path => path.includes('dynamic-engine-vtable-target-is-selected-service'))));
  assert.ok(frontier.rows.some(row => row.body_id === 'service/service_pre_tail' &&
    row.posture === 'possible-under-listed-assumptions'));
  assert.ok(frontier.rows.some(row => row.body_id === 'trusted/resolve' &&
    row.posture === 'possible-under-listed-assumptions' &&
    row.entered_under.some(path => path.includes('source-spelled-read-only-trusted-reader-import-target'))));
  assert.ok(frontier.rows.some(row => row.body_id === 'sqlite/resolve' &&
    row.posture === 'possible-under-listed-assumptions' &&
    row.entered_under.some(path => path.includes('source-spelled-read-only-state-reader-import-target'))));
  assert.equal(frontier.rows.some(row => row.effect_status !== 'open'), false);
  assert.ok(frontier.rows.every(row => Array.isArray(row.control_context)));
  assert.ok(frontier.rows.some(row => row.site_id === 'public/service_in_epoch#79' &&
    row.selected_target === 'pre_resolved/authorize' &&
    row.entered_under.some(path => path.includes('service-prefix-completes-and-tail-entered'))));
  assert.ok(frontier.rows.some(row => row.site_id === 'wrapper/authorize#13' &&
    row.selected_target === 'pre_resolved/borrowed' &&
    row.entered_under.some(path => path.includes('constructed-wrapper-method-target'))));
  assert.ok(frontier.rows.some(row => row.site_id === 'pre_resolved/borrowed#0' &&
    row.selected_target === 'service/adapter' &&
    row.entered_under.some(path => path.includes('kernel-ready-branch-and-borrowed-decision-target'))));
  assert.ok(frontier.rows.some(row => row.body_id === 'service/adapter' &&
    row.entered_under.some(path => path.includes('borrowed-generic-is-selected-adapter-instance'))));
  for (const [ordinal, target] of [[0, 'trusted/resolve'], [47, 'callback/selected_noop_hook'],
    [53, 'sqlite/resolve']]) {
    assert.ok(frontier.rows.some(row => row.site_id === `service/service_pre_tail#${ordinal}` &&
      row.selected_target === target && row.effect_status === 'open'));
    assert.ok(frontier.rows.some(row => row.site_id === `public/service_in_epoch#${ordinal}` &&
      row.selected_target === target && row.effect_status === 'open'));
  }

  const addedPublic = structuredClone(result.selected_public_entry_spine);
  const entry = addedPublic.nodes.service_authorize;
  entry.sites.push({ ...entry.sites[0], ordinal: entry.sites.length, kind: 'function',
    callee_syntax: 'std :: thread :: yield_now', expression_syntax: 'std :: thread :: yield_now ()',
    receiver_syntax: null, closure_depth: 0, nested_item_depth: 0 });
  const added = fixtureFrontier(addedPublic, result.selected_parsed_site_manifest,
    result.ast_pre_tail_inventory, result.selected_instance_transfer, result.selected_boundary_chain);
  assert.equal(added.public_site_count, frontier.public_site_count + 1);
  assert.equal(added.input_mode, 'fixture');
  assert.equal(added.possible_unresolved_site_count, frontier.possible_unresolved_site_count + 1);
  assert.ok(added.rows.some(row => row.body_id === 'public/service_authorize' &&
    row.callee_syntax === 'std :: thread :: yield_now' &&
    row.posture === 'possible-under-listed-assumptions' && row.selected_target === null));

  const wrongEdge = structuredClone(result.selected_public_entry_spine);
  wrongEdge.edges[0].site_ordinals = [999];
  assert.throws(() => fixtureFrontier(wrongEdge, result.selected_parsed_site_manifest,
    result.ast_pre_tail_inventory, result.selected_instance_transfer, result.selected_boundary_chain), /frontier-public-edge-site/);
  const missingEdge = structuredClone(result.selected_public_entry_spine);
  missingEdge.edges = missingEdge.edges.filter(edge =>
    !(edge.from === 'api_builder' && edge.to === 'service_open'));
  assert.throws(() => fixtureFrontier(missingEdge, result.selected_parsed_site_manifest,
    result.ast_pre_tail_inventory, result.selected_instance_transfer, result.selected_boundary_chain), /frontier-public-edges/);
  const truncatedSegment = structuredClone(result.ast_pre_tail_inventory);
  truncatedSegment.sites = [];
  assert.throws(() => fixtureFrontier(result.selected_public_entry_spine,
    result.selected_parsed_site_manifest, truncatedSegment, result.selected_instance_transfer, result.selected_boundary_chain),
    /frontier-segment-length/);
  const wrongSegment = structuredClone(result.ast_pre_tail_inventory);
  wrongSegment.sites[0].callee_syntax = 'different';
  assert.throws(() => fixtureFrontier(result.selected_public_entry_spine,
    result.selected_parsed_site_manifest, wrongSegment, result.selected_instance_transfer, result.selected_boundary_chain),
    /dependency-bridge-site-0|frontier-segment-manifest-overlap/);
  const wrongContext = structuredClone(result.ast_pre_tail_inventory);
  wrongContext.sites[1].control_context = ['forged'];
  assert.throws(() => fixtureFrontier(result.selected_public_entry_spine,
    result.selected_parsed_site_manifest, wrongContext, result.selected_instance_transfer,
    result.selected_boundary_chain), /frontier-segment-manifest-overlap/);
  const conflictingPrefix = structuredClone(result.selected_parsed_site_manifest);
  conflictingPrefix.sites.find(row => row.site_id === 'service/service_pre_tail#0').selected_target = 'join/join';
  assert.throws(() => fixtureFrontier(result.selected_public_entry_spine,
    conflictingPrefix, result.ast_pre_tail_inventory, result.selected_instance_transfer,
    result.selected_boundary_chain), /dependency-bridge-conflicting-target-0/);
  const mixedTransfer = structuredClone(result.selected_instance_transfer);
  mixedTransfer.selected_origin_template_property = false;
  assert.throws(() => fixtureFrontier(result.selected_public_entry_spine,
    result.selected_parsed_site_manifest, result.ast_pre_tail_inventory, mixedTransfer, result.selected_boundary_chain),
    /frontier-input-identity/);
  const missingBoundaryEdge = structuredClone(result.selected_boundary_chain);
  missingBoundaryEdge.edges = missingBoundaryEdge.edges.filter(edge => edge.from !== 'wrapper/authorize');
  assert.throws(() => fixtureFrontier(result.selected_public_entry_spine,
    result.selected_parsed_site_manifest, result.ast_pre_tail_inventory,
    result.selected_instance_transfer, missingBoundaryEdge), /frontier-boundary-edges/);
  const wrongTail = structuredClone(result.selected_public_entry_spine);
  wrongTail.nodes.service_in_epoch.sites[79].callee_syntax = 'other';
  assert.throws(() => fixtureFrontier(wrongTail, result.selected_parsed_site_manifest,
    result.ast_pre_tail_inventory, result.selected_instance_transfer, result.selected_boundary_chain),
    /frontier-tail-call-source-site/);
  const changedTailExpression = structuredClone(result.selected_public_entry_spine);
  changedTailExpression.nodes.service_in_epoch.sites[79].expression_syntax += ' extra';
  assert.throws(() => fixtureFrontier(changedTailExpression, result.selected_parsed_site_manifest,
    result.ast_pre_tail_inventory, result.selected_instance_transfer, result.selected_boundary_chain),
    /frontier-tail-call-source-site/);
  const missingUnresolvedSite = structuredClone(result.selected_boundary_chain);
  missingUnresolvedSite.nodes.wrapper.sites.pop();
  assert.throws(() => fixtureFrontier(result.selected_public_entry_spine,
    result.selected_parsed_site_manifest, result.ast_pre_tail_inventory,
    result.selected_instance_transfer, missingUnresolvedSite), /frontier-input-identity/);
  const forgedDenySite = structuredClone(result.selected_boundary_chain);
  forgedDenySite.nodes.wrapper.sites[13].control_context = [
    'match boundary_kernel :: admit_authorization_command (& context) arm 1 boundary_kernel :: CommandBoundaryDecision :: Deny'];
  assert.throws(() => fixtureFrontier(result.selected_public_entry_spine,
    result.selected_parsed_site_manifest, result.ast_pre_tail_inventory,
    result.selected_instance_transfer, forgedDenySite), /frontier-input-identity/);
});

test('iterator callback bridge rejects broken collect and closure bindings', () => {
  const result = currentCertificate();
  const spine = result.selected_public_entry_spine;
  const prefix = result.ast_pre_tail_inventory;
  const check = (publicSpine = spine, preTail = prefix) =>
    selectedIteratorCallbackBridge(publicSpine, preTail, { fixture: true });
  const bridge = check();
  assert.deepEqual(bridge.chains.map(chain => [chain.collect_site_ordinal,
    chain.adapter_site_ordinal, chain.iter_site_ordinal]),
  [[5, 6, 7], [10, 11, 12], [58, 59, 60], [65, 66, 67]]);
  const wrongCollect = structuredClone(spine);
  wrongCollect.nodes.service_in_epoch.sites[65].receiver_syntax = 'other_iterator';
  assert.throws(() => check(wrongCollect), /iterator-bridge-chain-3/);
  const wrongParent = structuredClone(spine);
  wrongParent.nodes.service_in_epoch.closure_nodes[0].parent_call_site_ordinal = 5;
  assert.throws(() => check(wrongParent), /iterator-bridge-chain-0/);
  const wrongNested = structuredClone(spine);
  wrongNested.nodes.service_in_epoch.closure_nodes[1].nested_site_ordinals = [13, 14];
  assert.throws(() => check(wrongNested), /iterator-bridge-chain-1/);
  const missingTail = structuredClone(spine);
  missingTail.nodes.service_in_epoch.closure_nodes.pop();
  assert.throws(() => check(missingTail), /iterator-bridge-closure-count/);
  const wrongPrefix = structuredClone(prefix);
  wrongPrefix.closure_nodes[2].parent_argument_index = 1;
  assert.throws(() => check(spine, wrongPrefix), /iterator-bridge-prefix-closure-2/);
  const wrongTailExpression = structuredClone(spine);
  wrongTailExpression.nodes.service_in_epoch.sites[74].expression_syntax =
    'valid_permission_component (& row . other_resource)';
  assert.throws(() => check(wrongTailExpression), /iterator-bridge-tail-helper-74/);
  const wrongTailDepth = structuredClone(spine);
  wrongTailDepth.nodes.service_in_epoch.sites[73].closure_depth = 0;
  assert.throws(() => check(wrongTailDepth), /iterator-bridge-nested-site-3-73/);
  const wrongTailContext = structuredClone(spine);
  wrongTailContext.nodes.service_in_epoch.sites[73].control_context = ['if false'];
  assert.throws(() => check(wrongTailContext), /iterator-bridge-tail-helper-73/);
});

test('tail validity-helper edges reject missing targets and extra public edges', () => {
  const result = currentCertificate();
  const args = [result.selected_public_entry_spine, result.selected_parsed_site_manifest,
    result.ast_pre_tail_inventory, result.selected_instance_transfer,
    result.selected_boundary_chain];
  const missingHelper = structuredClone(result.selected_parsed_site_manifest);
  missingHelper.per_node = missingHelper.per_node.filter(row =>
    !(row.group === 'service' && row.node === 'valid_permission_component'));
  assert.throws(() => selectedRootedCallFrontier(args[0], missingHelper,
    ...args.slice(2), { fixture: true }), /frontier-tail-helper-target/);
  const competing = structuredClone(result.selected_public_entry_spine);
  competing.edges.push({ ...competing.edges[0], from: 'service_in_epoch',
    to: 'service_open', site_ordinals: [73] });
  assert.throws(() => selectedRootedCallFrontier(competing, ...args.slice(1),
    { fixture: true }), /frontier-public-edges/);
});

test('identifier function value is an open latent callback, not an explicit or resolved call', () => {
  const result = currentCertificate();
  const bridge = result.selected_identifier_function_value_bridge;
  const boundary = bridge.boundaries[0];
  assert.equal(bridge.status, 'indeterminate');
  assert.equal(bridge.input_mode, 'pinned-production');
  assert.equal(bridge.runtime_guarantees_observed, false);
  assert.equal(bridge.boundaries.length, 1);
  assert.equal(boundary.driver_site_id, 'service/valid_identifier#2');
  assert.equal(boundary.receiver_site_id, 'service/valid_identifier#3');
  assert.equal(boundary.argument_index, 0);
  assert.equal(boundary.function_value_syntax, 'char :: is_control');
  assert.equal(boundary.target_resolution, 'source-spelled-function-value-only');
  assert.equal(boundary.effect_status, 'open');
  assert.equal(boundary.posture, 'possible-under-listed-assumptions');
  assert.ok(boundary.entered_under.some(path => path.includes('third-short-circuit-conjunct-evaluated') &&
    path.includes('Iterator-any-invokes-function-value-for-visited-character')));
  assert.equal(result.selected_rooted_call_frontier.rows.find(row =>
    row.site_id === boundary.driver_site_id).selected_target, null);
  assert.equal(result.selected_rooted_call_frontier.possible_unresolved_site_count, 352);
  assert.equal(result.selected_parsed_site_manifest.sites.filter(row =>
    row.callee_syntax === 'char :: is_control').length, 0);
});

test('identifier function-value bridge rejects changed argument, receiver, guard and metadata', () => {
  const result = currentCertificate();
  const helper = result.service_helper_graph;
  const manifest = result.selected_parsed_site_manifest;
  const frontier = result.selected_rooted_call_frontier;
  const check = (graph = helper, sites = manifest) =>
    selectedIdentifierFunctionValueBridge(graph, sites, frontier, { fixture: true });
  assert.equal(check().boundaries.length, 1);
  const changedArgument = structuredClone(helper);
  changedArgument.nodes.valid_identifier.sites[2].expression_syntax =
    'value . chars () . any (char :: is_whitespace)';
  assert.throws(() => check(changedArgument), /identifier-function-value-site-2/);
  const changedReceiver = structuredClone(helper);
  changedReceiver.nodes.valid_identifier.sites[2].receiver_syntax = 'other . chars ()';
  assert.throws(() => check(changedReceiver), /identifier-function-value-site-2/);
  const changedGuard = structuredClone(helper);
  changedGuard.nodes.valid_identifier.top_level_statements[0] =
    'value . is_empty () && value . len () <= maximum && ! value . chars () . any (char :: is_control)';
  assert.throws(() => check(changedGuard), /identifier-function-value-body/);
  const changedChars = structuredClone(helper);
  changedChars.nodes.valid_identifier.sites[3].receiver_syntax = 'other';
  assert.throws(() => check(changedChars), /identifier-function-value-site-3/);
  const changedContext = structuredClone(helper);
  changedContext.nodes.valid_identifier.sites[2].control_context = ['if false'];
  assert.throws(() => check(changedContext), /identifier-function-value-site-2/);
  const changedManifest = structuredClone(manifest);
  changedManifest.sites.find(row => row.site_id === 'service/valid_identifier#2').expression_syntax =
    'value . chars () . any (char :: is_whitespace)';
  assert.throws(() => check(helper, changedManifest), /identifier-function-value-manifest-site-2/);
  const changedSource = service.replace('any(char::is_control)', 'any(char::is_whitespace)');
  assert.notEqual(changedSource, service);
  assert.throws(() => extractSelectedServiceHelperGraph(changedSource, serviceCargo,
    { fixture: true }), /service-helper-body-valid_identifier/);
  const changedFrontier = structuredClone(frontier);
  changedFrontier.rows.find(row => row.site_id === 'service/valid_identifier#2').posture = 'proven';
  assert.throws(() => selectedIdentifierFunctionValueBridge(helper, manifest, changedFrontier,
    { fixture: true }), /identifier-function-value-frontier-driver/);
  const forgedPath = structuredClone(frontier);
  forgedPath.rows.find(row => row.site_id === 'service/valid_identifier#2').entered_under = [[]];
  assert.throws(() => selectedIdentifierFunctionValueBridge(helper, manifest, forgedPath),
    /identifier-function-value-input-identity/);
});

test('pre-result inventory retains kernel evaluation and open effect boundaries', () => {
  const result = currentCertificate();
  const inventory = result.selected_pre_result_effect_inventory;
  assert.equal(inventory.status, 'indeterminate');
  assert.equal(inventory.runtime_guarantees_observed, false);
  assert.equal(inventory.input_mode, 'pinned-production');
  assert.equal(inventory.coverage_level, 'parsed-sites-plus-one-latent-and-two-source-bound-mapped-function-values-only');
  assert.equal(inventory.closure_boundary_coverage, 'not-exhaustive');
  assert.equal(inventory.invocation_root, 'public/api_runtime_authorize');
  assert.equal(inventory.ready_endpoint_site_id, 'wrapper/authorize#13');
  assert.equal(inventory.reached_body_ids.length, 64);
  assert.equal(inventory.site_count, 504);
  assert.equal(inventory.physical_site_count, 439);
  assert.equal(inventory.unresolved_parsed_site_count, 381);
  assert.equal(inventory.unresolved_physical_site_count, 346);
  assert.equal(inventory.sites.length, inventory.site_count);
  assert.ok(inventory.sites.some(row => row.site_id === 'wrapper/authorize#12' &&
    row.temporal_class === 'during-kernel-before-result-candidate'));
  for (const body of ['kernel/admit', 'kernel/admissible', 'kernel/unique_authentication',
    'kernel/unique_route', 'kernel/provenance']) {
    assert.ok(inventory.reached_body_ids.includes(body));
    assert.ok(inventory.sites.some(row => row.site_id.startsWith(`${body}#`) &&
      row.effect_status === 'open'));
  }
  assert.ok(!inventory.sites.some(row => row.site_id === 'wrapper/authorize#13'));
  assert.ok(!inventory.reached_body_ids.includes('service/adapter'));
  assert.equal(inventory.named_edge_property.selected_adapter_reachable_without_ready_edge, false);
  assert.equal(inventory.named_edge_property.status, 'indeterminate');
  assert.deepEqual(inventory.latent_function_values.map(row => row.anchor_site_id),
    ['service/valid_identifier#2']);
  assert.deepEqual(inventory.mapped_function_values.map(row =>
    [row.anchor_site_id, row.source_bound_target]), [
    ['wrapper/authorize#6', 'wrapper/to_kernel_authentication_evidence'],
    ['wrapper/authorize#9', 'wrapper/to_kernel_route_binding'],
  ]);
  assert.ok(inventory.reached_body_ids.includes('wrapper/to_kernel_authentication_evidence'));
  assert.ok(inventory.reached_body_ids.includes('wrapper/to_kernel_route_binding'));
  assert.ok(inventory.sites.some(row => row.site_id === 'wrapper/to_kernel_route_binding#0' &&
    row.named_target === 'wrapper/to_kernel_permission' && row.effect_status === 'open'));
  assert.equal(inventory.deny_arm.parsed_site_count, 0);
  assert.equal(inventory.deny_arm.named_selected_downstream_edge, false);
  assert.equal(inventory.deny_arm.drop_and_unwind_effects_closed, false);
  assert.ok(inventory.coverage_boundaries.some(item => item.includes('implicit-Drop')));
});

test('pre-result inventory rejects changed gate and exposes premature selected adapter edges', () => {
  const result = currentCertificate();
  const frontier = result.selected_rooted_call_frontier;
  const bridge = result.selected_identifier_function_value_bridge;
  const manifest = result.selected_parsed_site_manifest;
  const check = changed => selectedPreResultEffectInventory(changed, bridge, manifest,
    { fixture: true });
  const changedKernel = structuredClone(frontier);
  changedKernel.rows.find(row => row.site_id === 'wrapper/authorize#12').selected_target =
    'service/adapter';
  assert.throws(() => check(changedKernel), /pre-result-inventory-kernel-call/);
  const changedReady = structuredClone(frontier);
  changedReady.rows.find(row => row.site_id === 'wrapper/authorize#13').control_context = [];
  assert.throws(() => check(changedReady), /pre-result-inventory-ready-edge/);
  const missingKernelSite = structuredClone(frontier);
  missingKernelSite.rows = missingKernelSite.rows.filter(row => row.site_id !== 'kernel/unique_route#2');
  missingKernelSite.catalog_site_count--;
  assert.throws(() => check(missingKernelSite), /pre-result-inventory-gate-body-coverage/);
  const hiddenAdapter = structuredClone(frontier);
  hiddenAdapter.rows.find(row => row.site_id === 'public/service_in_epoch#73').selected_target =
    'service/adapter';
  const exposed = check(hiddenAdapter);
  assert.equal(exposed.named_edge_property.selected_adapter_reachable_without_ready_edge, true);
  assert.equal(exposed.named_edge_property.status, 'fail');
  const fakeClosure = structuredClone(frontier);
  fakeClosure.rows.find(row => row.site_id === 'kernel/unique_route#0').effect_status = 'closed';
  assert.throws(() => check(fakeClosure), /pre-result-inventory-effect-closure-unsupported/);
  const missingLatent = structuredClone(frontier);
  missingLatent.rows.find(row => row.site_id === 'wrapper/authorize#6').expression_syntax =
    'authentication_evidence . into_iter () . map (other_callback)';
  assert.throws(() => check(missingLatent), /pre-result-inventory-mapped-function-value/);
  const harmfulNoop = structuredClone(frontier);
  harmfulNoop.rows.push({ ...harmfulNoop.rows.find(row =>
    row.site_id === 'service/adapter#1'),
    site_id: 'callback/selected_noop_hook#0', body_id: 'callback/selected_noop_hook',
    ordinal: 0, selected_target: 'service/adapter' });
  harmfulNoop.catalog_site_count++;
  assert.throws(() => check(harmfulNoop), /pre-result-inventory-noop-callback-sites/);
  const changedOverlap = structuredClone(frontier);
  changedOverlap.rows.find(row => row.site_id === 'service/service_pre_tail#8').control_context =
    ['if false'];
  assert.throws(() => check(changedOverlap), /pre-result-inventory-overlap-8/);
  const forgedDenyEdge = structuredClone(frontier);
  const forgedDenyRow = forgedDenyEdge.rows.find(row => row.site_id === 'wrapper/authorize#0');
  forgedDenyRow.control_context = ['match boundary_kernel :: admit_authorization_command (& context) arm 1 boundary_kernel :: CommandBoundaryDecision :: Deny'];
  forgedDenyRow.selected_target = 'service/adapter';
  const denyExposure = check(forgedDenyEdge);
  assert.equal(denyExposure.deny_arm.parsed_site_count, 1);
  assert.equal(denyExposure.deny_arm.named_selected_downstream_edge, true);
  assert.equal(denyExposure.named_edge_property.status, 'fail');
  assert.throws(() => selectedPreResultEffectInventory(hiddenAdapter, bridge, manifest),
    /pre-result-inventory-input-identity/);
  const forgedCollect = structuredClone(frontier);
  forgedCollect.mapped_function_value_handoffs[0].collect_site_id = 'wrapper/authorize#8';
  assert.throws(() => check(forgedCollect), /pre-result-inventory-mapped-function-value/);
  const forgedIteratorAssumption = structuredClone(frontier);
  forgedIteratorAssumption.mapped_function_value_handoffs[1].invocation_assumption =
    'mapper-always-runs';
  assert.throws(() => check(forgedIteratorAssumption), /pre-result-inventory-mapped-function-value/);
  const forgedMapperTarget = structuredClone(frontier);
  forgedMapperTarget.mapped_function_value_handoffs[1].source_bound_target = 'service/adapter';
  assert.throws(() => check(forgedMapperTarget), /pre-result-inventory-mapped-function-value/);
  const forgedMapperBody = structuredClone(frontier);
  forgedMapperBody.gate_bridge.nodes['wrapper/to_kernel_route_binding'].sites[0].callee_syntax =
    'authorize_resolved';
  assert.throws(() => check(forgedMapperBody),
    /pre-result-inventory-gate-site-wrapper\/to_kernel_route_binding-0/);
});

test('wrapper mapper fixtures reject substitutions, shadowing, extra callbacks, and changed mapper effects', () => {
  assert.equal(inspectSelectedWrapperMapperFixture(wrapper).status, 'indeterminate');
  const substituted = wrapper.replace('.map(to_kernel_authentication_evidence)',
    '.map(to_kernel_route_binding)');
  assert.notEqual(substituted, wrapper);
  assert.throws(() => inspectSelectedWrapperMapperFixture(substituted),
    /wrapper-mapper-fixture-authorize-body/);
  const shadowed = wrapper.replace('        let context = boundary_kernel::CommandBoundaryContext {',
    '        let to_kernel_route_binding = |binding| binding;\n        let context = boundary_kernel::CommandBoundaryContext {');
  assert.notEqual(shadowed, wrapper);
  assert.throws(() => inspectSelectedWrapperMapperFixture(shadowed),
    /wrapper-mapper-fixture-authorize-body/);
  const inspected = wrapper.replace('.map(to_kernel_route_binding)\n                .collect()',
    '.map(to_kernel_route_binding)\n                .inspect(|_| {})\n                .collect()');
  assert.notEqual(inspected, wrapper);
  assert.throws(() => inspectSelectedWrapperMapperFixture(inspected),
    /wrapper-mapper-fixture-authorize-body/);
  const sideEffect = wrapper.replace('    boundary_kernel::RouteAuthorizationBinding {\n        route_id:',
    '    let _ = std::fs::read_to_string("/tmp/mapper-effect");\n    boundary_kernel::RouteAuthorizationBinding {\n        route_id:');
  assert.notEqual(sideEffect, wrapper);
  assert.throws(() => inspectSelectedWrapperMapperFixture(sideEffect),
    /wrapper-mapper-fixture-route-body/);
});

test('reached closure catalog includes zero-call predicates and coalesces source aliases without closing effects', () => {
  const result = currentCertificate();
  const catalog = result.selected_reached_closure_catalog;
  assert.equal(catalog.status, 'indeterminate');
  assert.equal(catalog.runtime_guarantees_observed, false);
  assert.equal(catalog.reached_body_count, 64);
  assert.equal(catalog.closure_count, 71);
  assert.equal(catalog.physical_closure_count, 68);
  assert.equal(catalog.zero_nested_site_count, 40);
  assert.equal(catalog.possible_under_assumptions_count, 24);
  assert.ok(catalog.closures.every(row => row.effect_status === 'open'));
  assert.ok(catalog.closures.some(row => row.closure_id === 'public/service_authorize@0' &&
    row.invocation_posture === 'possible-under-listed-assumptions'));
  assert.ok(catalog.closures.some(row => row.closure_id === 'public/api_runtime_authorize@0' &&
    row.invocation_posture === 'unresolved'));
  assert.equal(Object.values(catalog.handoff_counts).reduce((sum, count) => sum + count, 0), 71);
  assert.ok(catalog.closures.some(row => row.closure_id === 'kernel/unique_authentication@0' &&
    row.nested_site_ids.length === 0));
  assert.ok(catalog.closures.some(row => row.closure_id === 'kernel/unique_route@0' &&
    row.nested_site_ids.length === 0));
  assert.ok(catalog.closures.some(row => row.closure_id.startsWith('sqlite/relation_revisions@')));
  assert.ok(catalog.closures.some(row => row.closure_id.startsWith('public/api_runtime_authorize@')));
  assert.deepEqual(catalog.callback_aliases, [{ body_id: 'callback/selected_noop_hook',
    closure_id: 'public/service_authorize@0', physical_closure_id: 'public/service_authorize@0' }]);
  assert.equal(catalog.closures.filter(row => row.physical_closure_id ===
    'service/in_epoch-source@0').length, 2);
  assert.ok(!catalog.closures.some(row => row.parent_body_id === 'service/adapter'));
});

test('eight selected SQL row callbacks bind parent, argument and row.get while effects remain open', () => {
  const result = currentCertificate();
  const bridge = result.selected_sql_row_callback_bridge;
  assert.equal(bridge.status, 'indeterminate');
  assert.equal(bridge.runtime_guarantees_observed, false);
  assert.equal(bridge.input_mode, 'pinned-production');
  assert.equal(bridge.callbacks.length, 8);
  assert.ok(bridge.callbacks.every(row => row.parent_argument_index === 2 &&
    row.effect_status === 'open' &&
    row.invocation_assumptions[0] === 'query-row-executes-and-invokes-callback-on-produced-row'));
  const missing = structuredClone(result.selected_reached_closure_catalog);
  missing.closures = missing.closures.filter(row => row.closure_id !== 'metadata/route_revision@0');
  assert.throws(() => selectedSqlRowCallbackBridge(missing,
    result.selected_rooted_call_frontier, result.selected_pre_result_effect_inventory), /sql-row-callback-set/);
  const wrongParent = structuredClone(result.selected_reached_closure_catalog);
  wrongParent.closures.find(row => row.closure_id === 'metadata/route_revision@0')
    .parent_argument_index = 1;
  assert.throws(() => selectedSqlRowCallbackBridge(wrongParent,
    result.selected_rooted_call_frontier, result.selected_pre_result_effect_inventory), /sql-row-callback-parent/);
  const wrongNested = structuredClone(result.selected_reached_closure_catalog);
  wrongNested.closures.find(row => row.closure_id === 'metadata/route_revision@0')
    .nested_site_ids = [];
  assert.throws(() => selectedSqlRowCallbackBridge(wrongNested,
    result.selected_rooted_call_frontier, result.selected_pre_result_effect_inventory), /sql-row-callback-nested/);
  const fixtureCatalog = structuredClone(result.selected_reached_closure_catalog);
  fixtureCatalog.input_mode = 'fixture';
  assert.throws(() => selectedSqlRowCallbackBridge(fixtureCatalog,
    result.selected_rooted_call_frontier, result.selected_pre_result_effect_inventory),
  /sql-row-callback-input-mode/);
  const fixtureFrontier = structuredClone(result.selected_rooted_call_frontier);
  const fixturePreResult = structuredClone(result.selected_pre_result_effect_inventory);
  fixtureFrontier.input_mode = fixturePreResult.input_mode = 'fixture';
  const fixtureBridge = selectedSqlRowCallbackBridge(fixtureCatalog,
    fixtureFrontier, fixturePreResult);
  assert.equal(fixtureBridge.input_mode, 'fixture');
  assert.match(fixtureBridge.claim_limit, /Fixture-only variation/);
});

test('eight lazy SQL row iterator callbacks bind complete nested sites without closing effects', () => {
  const result = currentCertificate();
  const bridge = result.selected_sql_row_iterator_callback_bridge;
  assert.equal(bridge.status, 'indeterminate');
  assert.equal(bridge.runtime_guarantees_observed, false);
  assert.equal(bridge.input_mode, 'pinned-production');
  assert.equal(bridge.callbacks.length, 8);
  assert.deepEqual(bridge.callbacks.map(row => row.row_get_site_ids.length),
    [2, 6, 8, 6, 1, 1, 1, 3]);
  assert.ok(bridge.callbacks.every(row => row.consumer_binding === 'unproved' &&
    row.effect_status === 'open' &&
    row.invocation_assumptions[0].includes('iterator-advances')));
  const changed = structuredClone(result.selected_reached_closure_catalog);
  changed.closures.find(row => row.closure_id === 'trusted/route_rows@1')
    .nested_site_ids.pop();
  assert.throws(() => selectedSqlRowIteratorCallbackBridge(changed,
    result.selected_rooted_call_frontier, result.selected_pre_result_effect_inventory),
  /sql-row-iterator-production-identity/);
  changed.input_mode = 'fixture';
  const fixtureFrontier = structuredClone(result.selected_rooted_call_frontier);
  const fixturePreResult = structuredClone(result.selected_pre_result_effect_inventory);
  fixtureFrontier.input_mode = fixturePreResult.input_mode = 'fixture';
  assert.throws(() => selectedSqlRowIteratorCallbackBridge(changed,
    fixtureFrontier, fixturePreResult), /sql-row-iterator-nested-count/);
  const exactFixture = structuredClone(result.selected_reached_closure_catalog);
  exactFixture.input_mode = 'fixture';
  const fixtureBridge = selectedSqlRowIteratorCallbackBridge(exactFixture,
    fixtureFrontier, fixturePreResult);
  assert.equal(fixtureBridge.input_mode, 'fixture');
  assert.match(fixtureBridge.claim_limit, /Fixture-only variation/);
});

test('eight source-pinned query_map receiver chains reach collect, but take(0) fixture fails', () => {
  const result = currentCertificate();
  const bridge = result.selected_sql_row_iterator_consumer_bridge;
  assert.equal(bridge.status, 'indeterminate');
  assert.equal(bridge.runtime_guarantees_observed, false);
  assert.equal(bridge.consumer_property, 'pass');
  assert.equal(bridge.callbacks.length, 8);
  assert.ok(bridge.callbacks.every(row => row.source_spelled_collect_receiver_bound &&
    row.consumer_property === 'pass' && row.collect_site_id && row.effect_status === 'open'));
  assert.deepEqual(bridge.callbacks[0].receiver_steps,
    ['query_map', 'ok', 'try', 'collect']);
  assert.deepEqual(bridge.callbacks[1].receiver_steps,
    ['query_map', 'map_err', 'try', 'map', 'collect']);
  const original = '.ok()?\n        .collect::<Result<Vec<_>, _>>()';
  const metadataStart = metadataReader.indexOf('fn authentication_metadata(');
  const metadataEnd = metadataReader.indexOf('\npub fn route_revision(', metadataStart);
  const body = metadataReader.slice(metadataStart, metadataEnd);
  assert.ok(body.includes(original));
  const changed = metadataReader.slice(0, metadataStart) +
    body.replace(original, '.ok()?\n        .take(0)\n        .collect::<Result<Vec<_>, _>>()') +
    metadataReader.slice(metadataEnd);
  assert.notEqual(changed, metadataReader);
  const catalog = structuredClone(result.selected_reached_closure_catalog);
  const frontier = structuredClone(result.selected_rooted_call_frontier);
  const preResult = structuredClone(result.selected_pre_result_effect_inventory);
  catalog.input_mode = frontier.input_mode = preResult.input_mode = 'fixture';
  const hostile = selectedSqlRowIteratorConsumerBridge(catalog, frontier, preResult,
    { fixtureMetadataSource: changed });
  assert.equal(hostile.input_mode, 'fixture');
  assert.equal(hostile.consumer_property, 'fail');
  assert.deepEqual(hostile.callbacks[0].receiver_steps,
    ['query_map', 'ok', 'try', 'take', 'collect']);
  assert.equal(hostile.callbacks[0].source_spelled_collect_receiver_bound, false);
  assert.equal(hostile.callbacks[0].collect_site_id, null);
  assert.ok(hostile.callbacks.slice(1).every(row => row.consumer_property === 'pass'));
  assert.throws(() => selectedSqlRowIteratorConsumerBridge(
    result.selected_reached_closure_catalog, result.selected_rooted_call_frontier,
    result.selected_pre_result_effect_inventory, { fixtureMetadataSource: changed }),
  /sql-row-consumer-input-mode/);
  const fixtureDir = mkdtempSync(join(implementationRoot, '.v4b-query-map-consumer-fixture-'));
  try {
    mkdirSync(join(fixtureDir, 'src'));
    writeFileSync(join(fixtureDir, 'Cargo.toml'), metadataReaderCargo);
    writeFileSync(join(fixtureDir, 'Cargo.lock'), readFileSync(metadataReaderLockPath));
    writeFileSync(join(fixtureDir, 'src/lib.rs'), changed);
    execFileSync(toolchainPath, ['cargo', 'check', '--offline', '--locked', '--quiet',
      '--manifest-path', join(fixtureDir, 'Cargo.toml')],
    { encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test('pinned rusqlite iterator semantics are conditional and target resolution stays open', () => {
  const result = currentCertificate();
  const semantics = result.selected_sql_iterator_dependency_semantics;
  assert.equal(semantics.status, 'indeterminate');
  assert.equal(semantics.runtime_guarantees_observed, false);
  assert.equal(semantics.target_resolution, 'open');
  assert.equal(semantics.effect_closure, 'open');
  assert.equal(semantics.all_path_reachability, 'open');
  assert.equal(semantics.selected_paths.length, 8);
  assert.ok(semantics.selected_paths.every(row => row.compiler_resolved_target === false));
  assert.equal(semantics.dependency.version, '0.40.2');
  assert.equal(semantics.dependency.archive_sha256,
    '23f2a97da3e3873c73cb2a2e71b35c40ff95e0b1eefa8d72d8499a6928c3b5b3');
  const tampered = structuredClone(result.selected_sql_row_iterator_consumer_bridge);
  tampered.callbacks[0].source_spelled_collect_receiver_bound = false;
  assert.throws(() => selectedSqlIteratorDependencySemantics(tampered),
    /sql-iterator-semantics-consumer-input/);
  const forged = structuredClone(result.selected_sql_row_iterator_consumer_bridge);
  forged.callbacks[0].closure_id = 'forged/not_query_map@0';
  forged.callbacks[0].receiver_steps = ['not_query_map', 'collect'];
  assert.throws(() => selectedSqlIteratorDependencySemantics(forged),
    /sql-iterator-semantics-consumer-input/);
  const rust = `#[cfg(test)]
mod tests {
    use rusqlite::{Connection, Error, Result};
    use std::cell::Cell;

    fn fixture() -> Connection {
        let connection = Connection::open_in_memory().unwrap();
        connection.execute_batch("CREATE TABLE t (v INTEGER); INSERT INTO t VALUES (1), (2), (3);").unwrap();
        connection
    }

    #[test]
    fn empty_and_multiple_rows() {
        let connection = fixture();
        let calls = Cell::new(0);
        let mut statement = connection.prepare("SELECT v FROM t WHERE v > ?1 ORDER BY v").unwrap();
        let empty = statement.query_map([3], |row| {
            calls.set(calls.get() + 1);
            row.get::<_, i64>(0)
        }).unwrap().collect::<Result<Vec<_>>>().unwrap();
        assert!(empty.is_empty());
        assert_eq!(calls.get(), 0);
        let values = statement.query_map([1], |row| {
            calls.set(calls.get() + 1);
            row.get::<_, i64>(0)
        }).unwrap().collect::<Result<Vec<_>>>().unwrap();
        assert_eq!(values, vec![2, 3]);
        assert_eq!(calls.get(), 2);
    }

    #[test]
    fn mapper_error_stops_before_later_rows() {
        let connection = fixture();
        let calls = Cell::new(0);
        let mut statement = connection.prepare("SELECT v FROM t ORDER BY v").unwrap();
        let result = statement.query_map([], |row| {
            calls.set(calls.get() + 1);
            if calls.get() == 1 { Err(Error::InvalidQuery) } else { row.get::<_, i64>(0) }
        }).unwrap().collect::<Result<Vec<_>>>();
        assert!(matches!(result, Err(Error::InvalidQuery)));
        assert_eq!(calls.get(), 1);
    }

    #[test]
    fn outer_map_error_stops_before_later_rows() {
        let connection = fixture();
        let row_calls = Cell::new(0);
        let outer_calls = Cell::new(0);
        let mut statement = connection.prepare("SELECT v FROM t ORDER BY v").unwrap();
        let result = statement.query_map([], |row| {
            row_calls.set(row_calls.get() + 1);
            row.get::<_, i64>(0)
        }).unwrap().map(|row| {
            outer_calls.set(outer_calls.get() + 1);
            row.and_then(|_| Err::<i64, _>(Error::InvalidQuery))
        }).collect::<Result<Vec<_>>>();
        assert!(matches!(result, Err(Error::InvalidQuery)));
        assert_eq!(row_calls.get(), 1);
        assert_eq!(outer_calls.get(), 1);
    }

    #[test]
    fn bind_failure_and_take_zero_never_invoke_mapper() {
        let connection = fixture();
        let calls = Cell::new(0);
        let mut statement = connection.prepare("SELECT v FROM t WHERE v = ?1").unwrap();
        assert!(statement.query_map([1, 2], |row| {
            calls.set(calls.get() + 1);
            row.get::<_, i64>(0)
        }).is_err());
        assert_eq!(calls.get(), 0);
        let values = statement.query_map([1], |row| {
            calls.set(calls.get() + 1);
            row.get::<_, i64>(0)
        }).unwrap().take(0).collect::<Result<Vec<_>>>().unwrap();
        assert!(values.is_empty());
        assert_eq!(calls.get(), 0);
    }
}
`;
  const fixtureDir = mkdtempSync(join(implementationRoot, '.v4b-iterator-semantics-'));
  try {
    mkdirSync(join(fixtureDir, 'src'));
    writeFileSync(join(fixtureDir, 'Cargo.toml'), serviceCargo);
    writeFileSync(join(fixtureDir, 'Cargo.lock'), readFileSync(serviceLockPath));
    writeFileSync(join(fixtureDir, 'src/lib.rs'), rust);
    execFileSync(toolchainPath, ['cargo', 'test', '--offline', '--locked', '--quiet',
      '--manifest-path', join(fixtureDir, 'Cargo.toml'), '--lib'],
    { encoding: 'utf8', timeout: 180000, maxBuffer: 4 * 1024 * 1024 });
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test('metadata-reader SQL row callback native authorization attempt fails at the crate boundary', () => {
  const original = '|row| row.get::<_, i64>(0),';
  const routeStart = metadataReader.indexOf('fn route_revision(');
  assert.ok(routeStart > 0);
  const routeBody = metadataReader.slice(routeStart);
  assert.ok(routeBody.includes(original));
  const inserted = `|row| {
                let _ = auth_foundation_sqlite_provider::authorize_in_transaction(
                    transaction,
                    AuthorizationCommand {
                        request_id: "fixture".to_string(),
                        session_id: "fixture".to_string(),
                        required_permission: Permission {
                            resource: "fixture".to_string(),
                            action: "fixture".to_string(),
                            scope: "fixture".to_string(),
                        },
                        scope_evidence_ref: "fixture".to_string(),
                    },
                    0,
                );
                row.get::<_, i64>(0)
            },`;
  const changed = metadataReader.slice(0, routeStart) + routeBody.replace(original, inserted);
  assert.notEqual(changed, metadataReader);
  const fixture = inspectSelectedSqlRowCallbackFixture(changed);
  assert.equal(fixture.input_mode, 'fixture');
  assert.equal(fixture.bounded_graph_property.status, 'fail');
  assert.equal(fixture.direct_native_decision_site_count, 1);
  assert.throws(() => inspectSelectedSqlRowCallbackFixture(changed.replace(
    'fn route_revision(', 'fn route_revision_renamed(')), /sql-row-fixture-outside-selected-body|function-identity/);
  const fixtureDir = mkdtempSync(join(implementationRoot, '.v4b-sql-row-fixture-'));
  try {
    mkdirSync(join(fixtureDir, 'src'));
    writeFileSync(join(fixtureDir, 'Cargo.toml'), metadataReaderCargo);
    writeFileSync(join(fixtureDir, 'Cargo.lock'), readFileSync(metadataReaderLockPath));
    writeFileSync(join(fixtureDir, 'src/lib.rs'), changed);
    assert.throws(() => execFileSync(toolchainPath, ['cargo', 'check', '--offline', '--locked', '--quiet',
      '--manifest-path', join(fixtureDir, 'Cargo.toml')],
    { encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 }), error =>
      /auth_foundation_sqlite_provider/.test(String(error.stderr)));
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test('metadata-reader lazy SQL iterator native authorization attempt fails at the crate boundary', () => {
  const metadataStart = metadataReader.indexOf('fn authentication_metadata(');
  const metadataEnd = metadataReader.indexOf('\npub fn route_revision(', metadataStart);
  assert.ok(metadataStart > 0 && metadataEnd > metadataStart);
  const body = metadataReader.slice(metadataStart, metadataEnd);
  const original = '.query_map([row_id], |row| {\n            Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))';
  assert.ok(body.includes(original));
  const injected = `.query_map([row_id], |row| {
            let _ = auth_foundation_sqlite_provider::authorize_in_transaction(
                transaction,
                AuthorizationCommand {
                    request_id: "fixture".to_string(),
                    session_id: "fixture".to_string(),
                    required_permission: Permission {
                        resource: "fixture".to_string(),
                        action: "fixture".to_string(),
                        scope: "fixture".to_string(),
                    },
                    scope_evidence_ref: "fixture".to_string(),
                },
                0,
            );
            Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))`;
  const changed = metadataReader.slice(0, metadataStart) + body.replace(original, injected) +
    metadataReader.slice(metadataEnd);
  assert.notEqual(changed, metadataReader);
  const fixture = inspectSelectedSqlRowIteratorCallbackFixture(changed);
  assert.equal(fixture.bounded_graph_property.status, 'fail');
  assert.equal(fixture.direct_native_decision_site_count, 1);
  assert.equal(fixture.input_mode, 'fixture');
  assert.match(fixture.claim_limit, /conditional on iterator advancement/);
  assert.throws(() => inspectSelectedSqlRowIteratorCallbackFixture(changed.replace(
    'fn authentication_metadata(', 'fn authentication_metadata_renamed(')),
  /sql-row-iterator-fixture-outside-selected-body|function-identity/);
  const fixtureDir = mkdtempSync(join(implementationRoot, '.v4b-query-map-fixture-'));
  try {
    mkdirSync(join(fixtureDir, 'src'));
    writeFileSync(join(fixtureDir, 'Cargo.toml'), metadataReaderCargo);
    writeFileSync(join(fixtureDir, 'Cargo.lock'), readFileSync(metadataReaderLockPath));
    writeFileSync(join(fixtureDir, 'src/lib.rs'), changed);
    assert.throws(() => execFileSync(toolchainPath, ['cargo', 'check', '--offline', '--locked', '--quiet',
      '--manifest-path', join(fixtureDir, 'Cargo.toml')],
    { encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 }), error =>
      /auth_foundation_sqlite_provider/.test(String(error.stderr)));
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test('reached closure catalog rejects broken parent, overlap, and production projection', () => {
  const result = currentCertificate();
  const args = (manifest = result.selected_parsed_site_manifest,
    publicSpine = result.selected_public_entry_spine) => [
    result.selected_pre_result_effect_inventory, publicSpine, manifest,
    result.selected_boundary_chain, result.selected_rooted_call_frontier];
  const badParent = structuredClone(result.selected_parsed_site_manifest);
  badParent.closure_inventories.find(row => row.body_id === 'sqlite/relation_revisions')
    .closure_nodes[0].parent_call_site_ordinal = 999;
  assert.throws(() => selectedReachedClosureCatalog(...args(badParent), { fixture: true }),
    /closure-catalog-node-sqlite\/relation_revisions-0/);
  assert.throws(() => selectedReachedClosureCatalog(...args(badParent)),
    /closure-catalog-input-identity/);
  const wrongArgument = structuredClone(result.selected_parsed_site_manifest);
  wrongArgument.closure_inventories.find(row => row.body_id === 'sqlite/relation_revisions')
    .closure_nodes[0].parent_argument_index = 999;
  assert.throws(() => selectedReachedClosureCatalog(...args(wrongArgument), { fixture: true }),
    /closure-catalog-parent-relations/);
  const wrongParentCallee = structuredClone(result.selected_parsed_site_manifest);
  wrongParentCallee.sites.find(row => row.site_id === 'sqlite/relation_revisions#1')
    .callee_syntax = 'map';
  assert.throws(() => selectedReachedClosureCatalog(...args(wrongParentCallee), { fixture: true }),
    /closure-catalog-parent-relations/);
  const wrongExistingParent = structuredClone(result.selected_parsed_site_manifest);
  wrongExistingParent.closure_inventories.find(row => row.body_id === 'sqlite/relation_revisions')
    .closure_nodes[0].parent_call_site_ordinal = 0;
  assert.throws(() => selectedReachedClosureCatalog(...args(wrongExistingParent), { fixture: true }),
    /closure-catalog-parent-relations/);
  const wrongHookArgument = structuredClone(result.selected_public_entry_spine);
  wrongHookArgument.nodes.service_authorize.closure_nodes[0].parent_argument_index = 999;
  assert.throws(() => selectedReachedClosureCatalog(...args(undefined, wrongHookArgument),
    { fixture: true }), /closure-catalog-hook-handoff/);
  const badOverlap = structuredClone(result.selected_parsed_site_manifest);
  badOverlap.closure_inventories.find(row => row.body_id === 'service/service_pre_tail')
    .closure_nodes[0].closure_syntax = '| evidence | { false }';
  assert.throws(() => selectedReachedClosureCatalog(...args(badOverlap), { fixture: true }),
    /closure-catalog-overlap-0/);
  const missingBody = structuredClone(result.selected_parsed_site_manifest);
  missingBody.closure_inventories = missingBody.closure_inventories.filter(row =>
    row.body_id !== 'sqlite/relation_revisions');
  assert.throws(() => selectedReachedClosureCatalog(...args(missingBody), { fixture: true }),
    /closure-catalog-manifest-coverage/);
  const forgedReach = structuredClone(result.selected_pre_result_effect_inventory);
  forgedReach.reached_body_ids.pop();
  assert.throws(() => selectedReachedClosureCatalog(forgedReach, ...args().slice(1)),
    /closure-catalog-input-identity/);
});

test('service-local SQLite iterator callback is rejected by graph and Cargo dependency isolation', () => {
  const before = '&& valid_reference(&evidence.session_id)\n                && evidence.trusted';
  const harmful = service.replace(before, `&& {
                    let _ = auth_foundation_sqlite_provider::authorize_in_transaction(
                        epoch.transaction(),
                        AuthorizationCommand {
                            request_id: String::new(),
                            session_id: String::new(),
                            required_permission: Permission {
                                resource: String::new(), action: String::new(), scope: String::new(),
                            },
                            scope_evidence_ref: String::new(),
                        },
                        0,
                    );
                    valid_reference(&evidence.session_id)
                }
                && evidence.trusted`);
  assert.notEqual(harmful, service);
  const prefix = extractAstPreTailInventory(harmful);
  const full = JSON.parse(execFileSync(toolchainPath, [
    'cargo', 'run', '--offline', '--locked', '--quiet', '--manifest-path', callInventoryCargoPath,
    '--', '--selector', JSON.stringify({ kind: 'free', name: 'authorize_in_epoch' }),
  ], { input: harmful, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 }));
  const direct = prefix.sites.find(site => site.callee_syntax ===
    'auth_foundation_sqlite_provider :: authorize_in_transaction');
  assert.ok(direct);
  assert.ok(prefix.closure_nodes[0].nested_site_ordinals.includes(direct.ordinal));
  assert.equal(direct.closure_depth, 1);
  const changedSpine = structuredClone(currentCertificate().selected_public_entry_spine);
  changedSpine.nodes.service_in_epoch = full;
  assert.throws(() => selectedIteratorCallbackBridge(changedSpine, prefix, { fixture: true }),
    /iterator-bridge-chain-0/);
  const fixtureDir = mkdtempSync(join(implementationRoot, '.v4b-iterator-fixture-'));
  try {
    mkdirSync(join(fixtureDir, 'src'));
    mkdirSync(join(fixtureDir, 'migrations'));
    writeFileSync(join(fixtureDir, 'Cargo.toml'), serviceCargo);
    writeFileSync(join(fixtureDir, 'Cargo.lock'), readFileSync(serviceLockPath));
    writeFileSync(join(fixtureDir, 'src/lib.rs'), harmful);
    writeFileSync(join(fixtureDir, 'migrations/0002_auth_service_epoch.sql'), readFileSync(serviceMigrationPath));
    assert.throws(() => execFileSync(toolchainPath, ['cargo', 'check', '--offline', '--locked', '--quiet',
      '--manifest-path', join(fixtureDir, 'Cargo.toml')],
    { encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 }), error =>
      /unresolved module or unlinked crate `auth_foundation_sqlite_provider`/.test(error.stderr));
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test('production frontier rejects deleted selected or public catalog rows', () => {
  const result = currentCertificate();
  const args = [result.selected_public_entry_spine, result.selected_parsed_site_manifest,
    result.ast_pre_tail_inventory, result.selected_instance_transfer, result.selected_boundary_chain];
  const missingProviderSite = structuredClone(args[1]);
  missingProviderSite.sites = missingProviderSite.sites.filter(row => row.site_id !== 'trusted/resolve#0');
  assert.equal(missingProviderSite.sites.length, args[1].sites.length - 1);
  assert.throws(() => selectedRootedCallFrontier(args[0], missingProviderSite, ...args.slice(2)),
    /frontier-production-projection/);
  const retargetedPrefix = structuredClone(args[1]);
  retargetedPrefix.sites.find(row => row.site_id === 'service/service_pre_tail#1').selected_target = 'join/join';
  assert.throws(() => selectedRootedCallFrontier(args[0], retargetedPrefix, ...args.slice(2)),
    /frontier-production-projection/);
  const missingPublicSite = structuredClone(args[0]);
  missingPublicSite.nodes.api_from_engines.sites.pop();
  assert.throws(() => selectedRootedCallFrontier(missingPublicSite, ...args.slice(1)),
    /frontier-production-projection/);
});

test('selected wrapper gate bridge names concrete resolver, candidate and kernel bodies without closing effects', () => {
  const chain = currentCertificate().selected_boundary_chain;
  const bridge = selectedWrapperGateBridge(chain);
  assert.equal(bridge.status, 'indeterminate');
  assert.equal(bridge.runtime_guarantees_observed, false);
  assert.equal(bridge.source_sha256.kernel_cargo, selectedKernelCargoIdentity(kernelCargo).cargo_sha256);
  assert.throws(() => selectedKernelCargoIdentity(kernelCargo.replace(
    'path = "src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs"',
    'path = "src/other-kernel.rs"')), /gate-bridge-kernel-cargo-identity/);
  assert.equal(Object.keys(bridge.nodes).length, 12);
  assert.equal(bridge.edges.length, 11);
  assert.deepEqual(bridge.edges.filter(edge => edge.from === 'wrapper/authorize')
    .map(edge => [edge.ordinal, edge.to]), [
      [1, 'resolver/authentication'], [3, 'resolver/routes'],
      [4, 'wrapper/construct_candidate'], [11, 'wrapper/to_kernel_command'],
      [12, 'kernel/admit'],
    ]);
  assert.deepEqual(bridge.unbound_function_values, []);
  assert.deepEqual(bridge.mapped_function_values.map(row => row.source_bound_target),
    ['wrapper/to_kernel_authentication_evidence', 'wrapper/to_kernel_route_binding']);
  assert.ok(Object.values(bridge.nodes).every(node =>
    node.selected_parsed_call_nodes_exhaustive === true && node.transitive_effect_closure === false));
  const wrongResolver = structuredClone(chain);
  wrongResolver.nodes.wrapper.sites[1].expression_syntax += ' . extra ()';
  assert.throws(() => selectedWrapperGateBridge(wrongResolver), /gate-bridge-input-identity/);
  const wrongKernel = structuredClone(chain);
  wrongKernel.nodes.wrapper.sites[12].callee_syntax = 'other_kernel';
  assert.throws(() => selectedWrapperGateBridge(wrongKernel), /gate-bridge-input-identity/);
  const wrongReadyCall = structuredClone(chain);
  wrongReadyCall.nodes.wrapper.sites[13].expression_syntax = 'self . downstream . authorize (other)';
  assert.throws(() => selectedWrapperGateBridge(wrongReadyCall), /gate-bridge-input-identity/);
  const wrongSource = structuredClone(chain);
  wrongSource.source_sha256.wrapper = 'different';
  assert.throws(() => selectedWrapperGateBridge(wrongSource), /gate-bridge-source-identity/);
});

test('selected no-op hook and provider roots reject altered source-spelled dependency joins', () => {
  const result = currentCertificate();
  const args = () => [result.selected_public_entry_spine,
    result.selected_parsed_site_manifest, result.ast_pre_tail_inventory];
  const bridge = selectedServiceDependencyBridge(...args());
  for (const group of ['trusted', 'sqlite']) {
    const missingTarget = structuredClone(result.selected_parsed_site_manifest);
    missingTarget.per_node = missingTarget.per_node.filter(row =>
      !(row.group === group && row.node === 'resolve'));
    assert.throws(() => selectedServiceDependencyBridge(result.selected_public_entry_spine,
      missingTarget, result.ast_pre_tail_inventory),
    new RegExp(`dependency-bridge-target-inventory-${group}`));
  }
  assert.equal(bridge.edges.length, 6);
  assert.equal(bridge.callback_body.parsed_site_count, 0);
  assert.equal(bridge.callback_body.explicit_statement_count, 0);
  assert.equal(bridge.callback_body.ast_binding, 'public-call-site-0-closure-node-0');
  assert.equal(bridge.callback_transfer.public_argument_index, 1);
  assert.equal(bridge.callback_body.effects_closed, false);
  const selectedHook = result.selected_public_entry_spine.nodes.service_authorize.closure_nodes;
  assert.equal(selectedHook.length, 1);
  assert.equal(selectedHook[0].parent_call_site_ordinal, 0);
  assert.equal(selectedHook[0].parent_argument_index, 1);
  assert.deepEqual(selectedHook[0].body_top_level_statements, []);
  assert.deepEqual(selectedHook[0].nested_site_ordinals, []);
  const wrongClosureParent = structuredClone(result.selected_public_entry_spine);
  wrongClosureParent.nodes.service_authorize.closure_nodes[0].parent_call_site_ordinal = null;
  assert.throws(() => selectedServiceDependencyBridge(wrongClosureParent, ...args().slice(1)),
    /dependency-bridge-hook-closure-ast/);
  const wrongClosureArgument = structuredClone(result.selected_public_entry_spine);
  wrongClosureArgument.nodes.service_authorize.closure_nodes[0].parent_argument_index = 0;
  assert.throws(() => selectedServiceDependencyBridge(wrongClosureArgument, ...args().slice(1)),
    /dependency-bridge-hook-closure-ast/);
  const nonemptyClosure = structuredClone(result.selected_public_entry_spine);
  nonemptyClosure.nodes.service_authorize.closure_nodes[0].body_top_level_statements =
    ['std :: thread :: yield_now () ;'];
  assert.throws(() => selectedServiceDependencyBridge(nonemptyClosure, ...args().slice(1)),
    /dependency-bridge-hook-closure-ast/);
  const extraClosure = structuredClone(result.selected_public_entry_spine);
  extraClosure.nodes.service_authorize.closure_nodes.push(structuredClone(selectedHook[0]));
  assert.throws(() => selectedServiceDependencyBridge(extraClosure, ...args().slice(1)),
    /dependency-bridge-hook-closure-count/);
  const wrongHook = structuredClone(result.selected_public_entry_spine);
  wrongHook.nodes.service_authorize.sites[0].expression_syntax =
    'self . authorize_detailed_with_hook (request , | _ | { std :: thread :: yield_now () })';
  assert.throws(() => selectedServiceDependencyBridge(wrongHook, ...args().slice(1)),
    /dependency-bridge-noop-hook-site/);
  const wrongForward = structuredClone(result.selected_public_entry_spine);
  wrongForward.nodes.service_detailed.sites[13].expression_syntax =
    'authorize_in_epoch (& epoch , request , | _ | { })';
  assert.throws(() => selectedServiceDependencyBridge(wrongForward, ...args().slice(1)),
    /dependency-bridge-forwarded-hook-site/);
  const wrongCall = structuredClone(result.ast_pre_tail_inventory);
  wrongCall.sites[47].callee_syntax = 'other_hook';
  assert.throws(() => selectedServiceDependencyBridge(result.selected_public_entry_spine,
    result.selected_parsed_site_manifest, wrongCall), /dependency-bridge-site-47/);
  const wrongSignature = structuredClone(result.selected_parsed_site_manifest);
  wrongSignature.provider_root_signatures.trusted[0] = 'other : & Transaction';
  assert.throws(() => selectedServiceDependencyBridge(result.selected_public_entry_spine,
    wrongSignature, result.ast_pre_tail_inventory), /dependency-bridge-provider-signatures/);
  const wrongOrdinal = structuredClone(result.selected_parsed_site_manifest);
  wrongOrdinal.sites.find(row => row.group === 'service' && row.node === 'service_pre_tail' &&
    row.ordinal === 53).ordinal = 999;
  assert.throws(() => selectedServiceDependencyBridge(result.selected_public_entry_spine,
    wrongOrdinal, result.ast_pre_tail_inventory), /dependency-bridge-site-53/);
  const redirectedImport = service.replace('TrustedInputResolution, resolve_in_transaction,',
    'TrustedInputResolution, resolve_in_transaction as other_resolver,');
  assert.notEqual(redirectedImport, service);
  assert.throws(() => extractSelectedPublicPath(api, apiCargo, redirectedImport,
    serviceCargo, { fixture: true }), /public-path-outside-selected-body/);
});

test('selected boundary chain binds AST branch sites and rejects changed branch/source claims', () => {
  const result = currentCertificate();
  const chain = result.selected_boundary_chain;
  assert.deepEqual(chain.edges.map(edge => [edge.from, edge.ordinal, edge.to]), [
    ['public/service_in_epoch', 79, 'pre_resolved/authorize'],
    ['pre_resolved/authorize', 0, 'wrapper/authorize'],
    ['wrapper/authorize', 13, 'pre_resolved/borrowed'],
    ['pre_resolved/borrowed', 0, 'service/adapter'],
  ]);
  assert.equal(chain.nodes.wrapper.sites[13].control_context[0].includes('CommandBoundaryDecision :: Ready'), true);
  assert.equal(chain.nodes.wrapper.sites.some(site => site.control_context.some(context =>
    context.includes('CommandBoundaryDecision :: Deny')) && site.callee_syntax === 'authorize'), false);
  const changedIR = extractWrapperFixture(wrapper, wrapperCargo);
  changedIR.branches.deny = ['callDownstream'];
  assert.throws(() => selectedBoundaryChain(
    extractServiceBinding(service, serviceCargo), extractPreResolved(pre, preCargo), changedIR,
    service, pre, wrapper), /boundary-chain-wrapper-deny/);
  assert.throws(() => selectedBoundaryChain(
    extractServiceBinding(service, serviceCargo), extractPreResolved(pre, preCargo),
    extractWrapperFixture(wrapper, wrapperCargo), service, pre, `${wrapper}\n// drift`),
  /boundary-chain-input-identity/);
});

test('selected parsed-site manifest partitions every site and fails closed on accounting defects', () => {
  const result = currentCertificate();
  const args = () => [result.ast_pre_tail_inventory, result.provider_root_inventories,
    result.trusted_provider_graph, result.sqlite_provider_graph, result.service_join_graph,
    result.service_helper_graph];
  const baseline = selectedParsedSiteManifest(...args());
  assert.equal(baseline.site_count, baseline.bound_site_count + baseline.unresolved_site_count);
  assert.equal(new Set(baseline.sites.map(site => site.site_id)).size, baseline.site_count);
  assert.ok(baseline.sites.every(site => site.effect_status === 'open'));
  assert.ok(baseline.sites.some(site => site.kind === 'macro' && site.unresolved_reason === 'macro-token-tree-unexpanded'));
  assert.ok(baseline.sites.some(site => site.closure_depth > 0));
  const wrongDuplicate = structuredClone(result.provider_root_inventories);
  wrongDuplicate.roots.trusted.sites.pop();
  assert.throws(() => selectedParsedSiteManifest(result.ast_pre_tail_inventory, wrongDuplicate,
    result.trusted_provider_graph, result.sqlite_provider_graph, result.service_join_graph, result.service_helper_graph), /manifest-duplicate-trusted-root/);
  const wrongOrdinal = structuredClone(result.trusted_provider_graph);
  wrongOrdinal.edges[0].site_ordinals = [999];
  assert.throws(() => selectedParsedSiteManifest(result.ast_pre_tail_inventory, result.provider_root_inventories,
    wrongOrdinal, result.sqlite_provider_graph, result.service_join_graph, result.service_helper_graph), /manifest-edge-ordinal-trusted/);
  const wrongValidSite = structuredClone(result.trusted_provider_graph);
  wrongValidSite.edges[0].site_ordinals = [0];
  assert.throws(() => selectedParsedSiteManifest(result.ast_pre_tail_inventory, result.provider_root_inventories,
    wrongValidSite, result.sqlite_provider_graph, result.service_join_graph, result.service_helper_graph), /manifest-edge-site-trusted/);
  const wrongDestination = structuredClone(result.trusted_provider_graph);
  wrongDestination.edges[0].to = 'route_rows';
  assert.throws(() => selectedParsedSiteManifest(result.ast_pre_tail_inventory, result.provider_root_inventories,
    wrongDestination, result.sqlite_provider_graph, result.service_join_graph, result.service_helper_graph), /manifest-edges-trusted/);
  const conflicting = structuredClone(result.trusted_provider_graph);
  conflicting.edges[0].site_ordinals.push(conflicting.edges[0].site_ordinals[0]);
  assert.throws(() => selectedParsedSiteManifest(result.ast_pre_tail_inventory, result.provider_root_inventories,
    conflicting, result.sqlite_provider_graph, result.service_join_graph, result.service_helper_graph), /manifest-conflicting-edge-trusted/);
  const gap = structuredClone(result.sqlite_provider_graph);
  gap.nodes.sessions.sites[0].ordinal = 100;
  assert.throws(() => selectedParsedSiteManifest(result.ast_pre_tail_inventory, result.provider_root_inventories,
    result.trusted_provider_graph, gap, result.service_join_graph, result.service_helper_graph), /manifest-site-ordinal-sqlite-sessions/);
});

test('source-added decision-named call in a selected helper remains unresolved in the manifest', () => {
  const result = currentCertificate();
  const changedSource = trustedProvider.replace(
    '    let mut statement = transaction\n        .prepare(',
    '    let _ = authorize_resolved();\n    let mut statement = transaction\n        .prepare(');
  assert.notEqual(changedSource, trustedProvider);
  const roots = extractSelectedProviderRoots(changedSource, trustedProviderCargo, stateReader, stateReaderCargo, { fixture: true });
  const graph = extractSelectedTrustedProviderGraph(changedSource, trustedProviderCargo, trustedRuntime, trustedRuntimeCargo, { fixture: true });
  const changed = selectedParsedSiteManifest(result.ast_pre_tail_inventory, roots, graph,
    result.sqlite_provider_graph, result.service_join_graph, result.service_helper_graph);
  assert.equal(changed.site_count, result.selected_parsed_site_manifest.site_count + 1);
  assert.equal(changed.unresolved_site_count, result.selected_parsed_site_manifest.unresolved_site_count + 1);
  assert.ok(changed.sites.some(site => site.callee_syntax === 'authorize_resolved' &&
    site.disposition === 'unresolved_call_boundary' && site.potential_decision_named_site));
  assert.equal(changed.status, 'indeterminate');
});

test('service and metadata-reader helper graph binds cross-crate bodies and leaves added closure calls open', () => {
  const result = currentCertificate();
  assert.equal(result.service_helper_graph.edges.length, 9);
  assert.equal(Object.keys(result.service_helper_graph.nodes).length, 8);
  assert.ok(result.service_helper_graph.function_value_effects.some(x => x.includes('char::is_control')));
  const changedHelper = service.replace('valid_identifier(value, MAX_REFERENCE_BYTES)',
    '{ authorize_resolved(); valid_identifier(value, MAX_REFERENCE_BYTES) }');
  assert.notEqual(changedHelper, service);
  assert.throws(() => extractSelectedServiceHelperGraph(changedHelper, serviceCargo, { fixture: true }),
    /service-helper-body-valid_reference/);
  const changedCallback = metadataReader.replace('Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))',
    '{ authorize_resolved(); Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?)) }');
  assert.notEqual(changedCallback, metadataReader);
  assert.throws(() => extractSelectedServiceHelperGraph(service, serviceCargo,
    { fixture: true, fixtureMetadataSource: changedCallback }),
    /service-helper-body-authentication_metadata/);
  const wrongReceiver = service.replace('authentication_metadata(epoch.transaction(), evidence.evidence_identity)',
    'authentication_metadata(other_epoch.transaction(), evidence.evidence_identity)');
  assert.notEqual(wrongReceiver, service);
  assert.throws(() => extractSelectedServiceHelperGraph(wrongReceiver, serviceCargo, { fixture: true }),
    /service-helper-arguments-service_pre_tail-authentication_metadata/);
  const wrongArgument = service.replace('authentication_metadata(epoch.transaction(), evidence.evidence_identity)',
    'authentication_metadata(epoch.transaction(), binding.binding_identity)');
  assert.notEqual(wrongArgument, service);
  assert.throws(() => extractSelectedServiceHelperGraph(wrongArgument, serviceCargo, { fixture: true }),
    /service-helper-arguments-service_pre_tail-authentication_metadata/);
  const wrongSnapshot = service.replace('command_from_snapshot(&exact_snapshot)',
    'command_from_snapshot(&other_snapshot)');
  assert.notEqual(wrongSnapshot, service);
  assert.throws(() => extractSelectedServiceHelperGraph(wrongSnapshot, serviceCargo, { fixture: true }),
    /service-helper-arguments-service_pre_tail-command_from_snapshot/);
  const wrongDestination = structuredClone(result.service_helper_graph);
  wrongDestination.edges[0].to = 'route_revision';
  assert.throws(() => selectedParsedSiteManifest(result.ast_pre_tail_inventory, result.provider_root_inventories,
    result.trusted_provider_graph, result.sqlite_provider_graph, result.service_join_graph, wrongDestination),
    /manifest-edges-service/);
  const closureSource = service.replace('valid_reference(&evidence.evidence_ref)',
    '{ authorize_resolved(); valid_reference(&evidence.evidence_ref) }');
  const closureAst = extractAstPreTailInventory(closureSource);
  const closureJoin = extractSelectedServiceJoinGraph(closureSource, serviceCargo, stateReader, stateReaderCargo,
    stateModel, stateModelCargo, { fixture: true });
  const closureHelpers = extractSelectedServiceHelperGraph(closureSource, serviceCargo, { fixture: true });
  const manifest = selectedParsedSiteManifest(closureAst, result.provider_root_inventories,
    result.trusted_provider_graph, result.sqlite_provider_graph, closureJoin, closureHelpers);
  assert.equal(manifest.site_count, result.selected_parsed_site_manifest.site_count + 1);
  assert.equal(manifest.unresolved_site_count, result.selected_parsed_site_manifest.unresolved_site_count + 1);
  assert.ok(manifest.sites.some(site => site.callee_syntax === 'authorize_resolved' &&
    site.disposition === 'unresolved_call_boundary' && site.closure_depth === 1));
  assert.equal(manifest.status, 'indeterminate');
});

test('selected join/accessor path rejects changed arguments, forwarding, field reads, and extra calls', () => {
  const check = (serviceSource = service, sqliteSource = stateReader, runtimeSource = stateModel) =>
    extractSelectedServiceJoinGraph(serviceSource, serviceCargo, sqliteSource, stateReaderCargo,
      runtimeSource, stateModelCargo, { fixture: true });
  assert.equal(check().edges.length, 10);
  const wrongArgument = service.replace(
    'authorization_state_joins_hold(epoch, &command, &authorization_state)',
    'authorization_state_joins_hold(epoch, &command, &other_state)');
  assert.notEqual(wrongArgument, service);
  assert.throws(() => check(wrongArgument), /join-graph-edge-service_pre_tail-join/);
  const extraDecision = service.replace(
    '    if command.evaluation_epoch_id != epoch.evaluation_epoch_id',
    '    let _ = authorize_resolved();\n    if command.evaluation_epoch_id != epoch.evaluation_epoch_id');
  assert.notEqual(extraDecision, service);
  assert.throws(() => check(extraDecision), /join-graph-body-/);
  const wrongForward = stateReader.replace('self.state.sessions()', 'self.state.roles()');
  assert.notEqual(wrongForward, stateReader);
  assert.throws(() => check(service, wrongForward), /join-graph-edge-|join-graph-body-/);
  const lostRoleGuard = stateReader.replace('self.state.is_complete() && self.state.roles().complete', 'self.state.is_complete()');
  assert.notEqual(lostRoleGuard, stateReader);
  assert.throws(() => check(service, lostRoleGuard), /join-graph-edge-|join-graph-body-/);
  const wrongField = stateModel.replace('        &self.sessions\n', '        &self.roles\n');
  assert.notEqual(wrongField, stateModel);
  assert.throws(() => check(service, stateReader, wrongField), /join-graph-body-/);
});

test('AST inventory sees calls inside a filter closure, a branch condition, and a macro boundary', () => {
  const closureCall = service.replace(
    'valid_reference(&evidence.evidence_ref)',
    '{ std::thread::yield_now(); valid_reference(&evidence.evidence_ref) }',
  );
  const closureSites = extractAstPreTailInventory(closureCall).sites;
  assert.equal(closureSites.length, 66);
  assert.ok(closureSites.some(site => site.callee_syntax === 'std :: thread :: yield_now' && site.closure_depth === 1));

  const branchCall = service.replace(
    'if !valid_reference(&subject_id) {',
    'if { std::thread::yield_now(); !valid_reference(&subject_id) } {',
  );
  const branchSites = extractAstPreTailInventory(branchCall).sites;
  assert.equal(branchSites.length, 66);
  assert.ok(branchSites.some(site => site.callee_syntax === 'std :: thread :: yield_now' && site.closure_depth === 0));

  const macroCall = service.replace(
    '    after_trusted_input(epoch.transaction());',
    '    after_trusted_input(epoch.transaction());\n    eprintln!("fixture");',
  );
  const macroSites = extractAstPreTailInventory(macroCall).sites;
  assert.equal(macroSites.length, 66);
  assert.ok(macroSites.some(site => site.kind === 'macro' && site.callee_syntax === 'eprintln'));
});

test('AST inventory labels nested, cfg-gated and macro-contained syntax without claiming reachability', () => {
  const nested = service.replace(
    '    let routes = snapshot',
    '    #[cfg(any())]\n    fn hidden() { std::thread::yield_now(); }\n    let routes = snapshot',
  );
  const nestedInventory = extractAstPreTailInventory(nested);
  assert.equal(nestedInventory.attributes_present, 1);
  assert.ok(nestedInventory.sites.some(site =>
    site.callee_syntax === 'std :: thread :: yield_now' && site.nested_item_depth === 1));

  const opaqueMacro = service.replace(
    '    after_trusted_input(epoch.transaction());',
    '    after_trusted_input(epoch.transaction());\n    eprintln!("{:?}", std::thread::yield_now());',
  );
  const opaqueInventory = extractAstPreTailInventory(opaqueMacro);
  assert.ok(opaqueInventory.sites.some(site => site.kind === 'macro' &&
    site.expression_syntax.includes('yield_now')));
  assert.equal(opaqueInventory.sites.filter(site => site.callee_syntax === 'std :: thread :: yield_now').length, 0);
  assert.equal(opaqueInventory.macro_token_trees_expanded, false);
});

test('selected provider roots are source-bound and expose a broader decision-call mutant', () => {
  const selected = extractSelectedProviderRoots(trustedProvider, trustedProviderCargo, stateReader, stateReaderCargo);
  assert.equal(selected.roots.trusted.function, 'resolve_in_transaction');
  assert.equal(selected.roots.sqlite.function, 'resolve_authorization_state_in_transaction');
  assert.equal(selected.roots.trusted.selected_parsed_call_nodes_exhaustive, true);
  assert.equal(selected.roots.sqlite.selected_parsed_call_nodes_exhaustive, true);
  assert.equal(selected.selected_root_potential_decision_named_sites.length, 0);
  assert.equal(selected.transitive_closure, 'open');

  const trustedInjected = trustedProvider.replace(
    '    let query = TrustedInputQuery {',
    '    let _ = authorize_resolved();\n    let query = TrustedInputQuery {',
  );
  assert.notEqual(trustedInjected, trustedProvider);
  const trustedChanged = extractSelectedProviderRoots(trustedInjected, trustedProviderCargo,
    stateReader, stateReaderCargo, { fixture: true });
  assert.equal(trustedChanged.selected_root_potential_decision_named_sites.length, 1);
  assert.equal(trustedChanged.selected_root_potential_decision_named_sites[0].root, 'trusted');
  assert.equal(trustedChanged.selected_root_potential_decision_named_sites[0].callee_syntax,
    'authorize_resolved');

  const injected = stateReader.replace(
    '    let provider = SqliteSnapshot { transaction };',
    '    let _ = authorize_resolved(command.clone(), 0, ResolvedAuthorizationState::new(Vec::new(), RoleResolution { roles: Vec::new(), complete: false }, false, 0, false));\n    let provider = SqliteSnapshot { transaction };',
  );
  assert.notEqual(injected, stateReader);
  const changed = extractSelectedProviderRoots(trustedProvider, trustedProviderCargo, injected, stateReaderCargo, { fixture: true });
  assert.equal(changed.selected_root_potential_decision_named_sites.length, 1);
  assert.equal(changed.selected_root_potential_decision_named_sites[0].callee_syntax, 'authorize_resolved');

  const qualified = stateReader.replace(
    '    let provider = SqliteSnapshot { transaction };',
    '    let _ = auth_foundation_runtime_adapter::authorize_resolved(command.clone(), 0, ResolvedAuthorizationState::new(Vec::new(), RoleResolution { roles: Vec::new(), complete: false }, false, 0, false));\n    let provider = SqliteSnapshot { transaction };',
  );
  assert.notEqual(qualified, stateReader);
  const qualifiedGraph = extractSelectedProviderRoots(trustedProvider, trustedProviderCargo, qualified, stateReaderCargo, { fixture: true });
  assert.equal(qualifiedGraph.selected_root_potential_decision_named_sites.length, 1);
  assert.equal(qualifiedGraph.selected_root_potential_decision_named_sites[0].callee_syntax, 'auth_foundation_runtime_adapter :: authorize_resolved');

  assert.throws(() => extractSelectedProviderRoots(`${trustedProvider}\nfn extra() {}`, trustedProviderCargo, stateReader, stateReaderCargo), /provider-root-source-pin/);
});

test('selected trusted-input provider chain binds its explicit local and generated edges', () => {
  const graph = extractSelectedTrustedProviderGraph(trustedProvider, trustedProviderCargo, trustedRuntime, trustedRuntimeCargo);
  assert.equal(Object.keys(graph.nodes).length, 6);
  assert.equal(graph.edges.length, 6);
  assert.equal(graph.potential_decision_sites.length, 0);
  assert.equal(graph.external_and_implicit_effect_closure, 'open');
  assert.equal(graph.edge_argument_and_extra_edge_closure, 'open');
  assert.ok(graph.edges.some(edge => edge.from === 'generated_resolve' && edge.to === 'generated_query_valid'));

  const injected = trustedProvider.replace(
    '\n    let resolution = resolve_trusted_inputs(&query, &snapshot);',
    '\n    let _ = authorize_resolved(command.clone(), 0, state);\n    let resolution = resolve_trusted_inputs(&query, &snapshot);',
  );
  assert.notEqual(injected, trustedProvider);
  const changed = extractSelectedTrustedProviderGraph(injected, trustedProviderCargo, trustedRuntime, trustedRuntimeCargo, { fixture: true });
  assert.equal(changed.potential_decision_sites.length, 1);
  assert.throws(() => extractSelectedTrustedProviderGraph(trustedProvider, trustedProviderCargo, `${trustedRuntime}\nfn extra() {}`, trustedRuntimeCargo), /trusted-graph-source-pin/);
});

test('selected SQL state-reader chain binds concrete inherent receivers and leaves externals open', () => {
  const graph = extractSelectedSqliteProviderGraph(stateReader, stateReaderCargo, stateModel, stateModelCargo);
  assert.equal(Object.keys(graph.nodes).length, 13);
  assert.equal(graph.edges.length, 15);
  assert.ok(graph.unbound_explicit_sites.length > 0);
  assert.equal(graph.potential_decision_named_sites.length, 0);
  assert.equal(graph.method_dispatch_resolution, 'selected-calls-use-inherent-SqliteSnapshot-methods-in-read-only-state-reader; compiler-check-external-to-reader; other-targets-open');
  assert.equal(graph.external_macro_implicit_effect_closure, 'open');
  assert.ok(graph.edges.some(edge => edge.from === 'resolve' && edge.to === 'sessions' && edge.receiver_syntax === 'provider'));
  assert.ok(graph.nodes.resolve.sites.some(site => site.callee_syntax === 'resolve_sessions' &&
    site.receiver_syntax === 'provider'));
  assert.equal(graph.nodes.state_new.sites.length, 0);
  assert.deepEqual(graph.constructor_mapping.argument_order,
    ['sessions', 'roles', 'trusted_scope_evidence', 'current_authorization_revision', 'revision_complete']);
  assert.equal(graph.constructor_mapping.selected_expressions.length, 5);
  assert.equal(graph.constructor_mapping.generic_dataflow_and_trait_dispatch, 'open');

  const changedReceiver = stateReader.replace('provider.resolve_sessions(&command.session_id)?',
    'other_provider.resolve_sessions(&command.session_id)?');
  assert.notEqual(changedReceiver, stateReader);
  assert.throws(() => extractSelectedSqliteProviderGraph(changedReceiver, stateReaderCargo, stateModel, stateModelCargo, { fixture: true }), /sqlite-graph-missing-edge-resolve-sessions/);
  for (const [method, edge] of [
    ['resolve_active_roles', 'roles'],
    ['current_authorization_revision', 'revision'],
    ['verify_scope_evidence', 'scope'],
  ]) {
    const changedMethod = stateReader.replace(`provider.${method}(`, `other_provider.${method}(`);
    assert.notEqual(changedMethod, stateReader);
    assert.throws(() => extractSelectedSqliteProviderGraph(changedMethod, stateReaderCargo, stateModel, stateModelCargo, { fixture: true }),
      new RegExp(`sqlite-graph-missing-edge-resolve-${edge}`));
  }
  const changedArgument = stateReader.replace('provider.verify_scope_evidence(command)?',
    'provider.verify_scope_evidence(&command)?');
  assert.notEqual(changedArgument, stateReader);
  assert.throws(() => extractSelectedSqliteProviderGraph(changedArgument, stateReaderCargo, stateModel, stateModelCargo, { fixture: true }),
    /sqlite-constructor-expression-trusted_scope_evidence/);

  const injectedDecision = stateReader.replace(
    '    let provider = SqliteSnapshot { transaction };',
    '    let _ = auth_foundation_runtime_adapter::authorize_resolved(command.clone(), 0, ResolvedAuthorizationState::new(Vec::new(), RoleResolution { roles: Vec::new(), complete: false }, false, 0, false));\n    let provider = SqliteSnapshot { transaction };',
  );
  assert.throws(() => extractSelectedSqliteProviderGraph(injectedDecision, stateReaderCargo, stateModel, stateModelCargo, { fixture: true }),
    /sqlite-constructor-resolver-body/);

  const competingInherent = `${stateReader}\nimpl<'a, 'b> SqliteSnapshot<'a, 'b> { fn resolve_sessions(&self, _: &str) -> Result<Vec<SessionRecord>, PortFailure> { Ok(Vec::new()) } }`;
  assert.throws(() => extractSelectedSqliteProviderGraph(competingInherent, stateReaderCargo, stateModel, stateModelCargo, { fixture: true }),
    /sqlite-graph-ambiguous-inherent-method-resolve_sessions/);
  assert.throws(() => extractSelectedSqliteProviderGraph(stateReader, stateReaderCargo, `${stateModel}\nfn extra() {}`, stateModelCargo), /sqlite-graph-source-pin/);
});

test('SQLite state constructor mapping rejects argument, origin, guard, and field mutations', () => {
  const check = (sqliteSource = stateReader, modelSource = stateModel) =>
    extractSelectedSqliteProviderGraph(sqliteSource, stateReaderCargo, modelSource, stateModelCargo, { fixture: true });
  const swappedArguments = stateReader.replace(
    '            trusted_scope_evidence,\n            current_authorization_revision,\n            revision_complete,',
    '            revision_complete,\n            current_authorization_revision,\n            trusted_scope_evidence,');
  assert.notEqual(swappedArguments, stateReader);
  assert.throws(() => check(swappedArguments), /sqlite-constructor-expression-state_new/);
  const shadowed = stateReader.replace('    Ok(SqliteAuthorizationStateSnapshot {',
    '    let sessions = Vec::new();\n    Ok(SqliteAuthorizationStateSnapshot {');
  assert.notEqual(shadowed, stateReader);
  assert.throws(() => check(shadowed), /sqlite-constructor-resolver-body/);
  const completeFallback = stateReader.replace(
    '            complete: false,\n        }\n    };',
    '            complete: true,\n        }\n    };');
  assert.notEqual(completeFallback, stateReader);
  assert.throws(() => check(completeFallback), /sqlite-constructor-resolver-body/);
  const missingRelationCheck = stateReader.replace(
    '            && relation_revisions_are_current(\n                transaction,\n                &command.session_id,\n                current_authorization_revision,\n            )?',
    '            && true');
  assert.notEqual(missingRelationCheck, stateReader);
  assert.throws(() => check(missingRelationCheck), /sqlite-graph-missing-edge-resolve-relation_revisions|sqlite-constructor-resolver-body/);
  const wrongAdapterField = stateModel.replace(
    '            trusted_scope_evidence,\n            current_authorization_revision,\n            complete,',
    '            trusted_scope_evidence: complete,\n            current_authorization_revision,\n            complete: trusted_scope_evidence,');
  assert.notEqual(wrongAdapterField, stateModel);
  assert.throws(() => check(stateReader, wrongAdapterField), /sqlite-constructor-fields/);
});

test('selected database builder and trait forwarding are exact-template bound', () => {
  const selected = extractSelectedPublicPath(api, apiCargo, service, serviceCargo);
  assert.equal(selected.selected_builder_engine_shape, 'SqliteAuthService<SystemDecisionClock>');
  const alternateClock = api.replace('            SystemDecisionClock,', '            AlternateClock,');
  assert.notEqual(alternateClock, api);
  assert.throws(() => extractSelectedPublicPath(alternateClock, apiCargo, service, serviceCargo, { fixture: true }), /public-path-api-body-2/);
  const alternateEngine = api.replace('SqliteAuthService::authorize(self, request)', 'BinaryAuthorizationDecision::Deny');
  assert.notEqual(alternateEngine, api);
  assert.throws(() => extractSelectedPublicPath(alternateEngine, apiCargo, service, serviceCargo, { fixture: true }), /public-path-api-body-1/);
});

test('selected clock and public no-op hook changes fail closed', () => {
  const changedClock = api.replace('SystemTime::now()', 'SystemTime::UNIX_EPOCH');
  assert.notEqual(changedClock, api);
  assert.throws(() => extractSelectedPublicPath(changedClock, apiCargo, service, serviceCargo, { fixture: true }), /public-path-api-body-0/);
  const changedHook = service.replace('self.authorize_detailed_with_hook(request, |_| {}).decision', 'self.authorize_detailed_with_hook(request, |_| { panic!("effect"); }).decision');
  assert.notEqual(changedHook, service);
  assert.throws(() => extractSelectedPublicPath(api, apiCargo, changedHook, serviceCargo, { fixture: true }), /public-path-service-body-0/);
});

test('nonempty public hook is well typed but rejected by the selected bridge source binding', () => {
  const changed = service.replace('self.authorize_detailed_with_hook(request, |_| {}).decision',
    'self.authorize_detailed_with_hook(request, |_| { std::thread::yield_now(); }).decision');
  assert.notEqual(changed, service);
  assert.throws(() => extractSelectedPublicPath(api, apiCargo, changed,
    serviceCargo, { fixture: true }), /public-path-service-body-0/);
  const fixtureDir = mkdtempSync(join(implementationRoot, '.v4b-hook-fixture-'));
  try {
    mkdirSync(join(fixtureDir, 'src'));
    mkdirSync(join(fixtureDir, 'migrations'));
    writeFileSync(join(fixtureDir, 'Cargo.toml'), serviceCargo);
    writeFileSync(join(fixtureDir, 'Cargo.lock'), readFileSync(serviceLockPath));
    writeFileSync(join(fixtureDir, 'src/lib.rs'), changed);
    writeFileSync(join(fixtureDir, 'migrations/0002_auth_service_epoch.sql'), readFileSync(serviceMigrationPath));
    execFileSync(toolchainPath, ['cargo', 'check', '--offline', '--locked', '--quiet',
      '--manifest-path', join(fixtureDir, 'Cargo.toml')],
    { encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test('service-local pre-gate SQLite hook is parsed but cannot type-check under isolated Cargo dependencies', () => {
  const baseline = inspectSelectedPublicHookFixture(service);
  assert.deepEqual(baseline.direct_sqlite_authorization_sites, []);
  assert.equal(baseline.status, 'indeterminate');
  assert.equal(baseline.bounded_graph_property.status, 'indeterminate');
  const harmful = service.replace('self.authorize_detailed_with_hook(request, |_| {}).decision',
    `self.authorize_detailed_with_hook(request, |transaction| {
        let _ = auth_foundation_sqlite_provider::authorize_in_transaction(
            transaction,
            AuthorizationCommand {
                request_id: String::new(),
                session_id: String::new(),
                required_permission: Permission {
                    resource: String::new(), action: String::new(), scope: String::new(),
                },
                scope_evidence_ref: String::new(),
            },
            0,
        );
    }).decision`);
  assert.notEqual(harmful, service);
  const fixture = inspectSelectedPublicHookFixture(harmful);
  assert.equal(fixture.input_mode, 'fixture');
  assert.equal(fixture.status, 'indeterminate');
  assert.equal(fixture.pre_gate_direct_sqlite_authorization_counterexample, false);
  assert.equal(fixture.native_endpoint_linkability, 'not-well-typed-under-pinned-service-cargo');
  assert.equal(fixture.parsed_straight_line_sqlite_authorization_sites.length, 1);
  assert.equal(fixture.bounded_graph_property.status, 'indeterminate');
  assert.equal(fixture.direct_sqlite_authorization_sites.length, 1);
  assert.equal(fixture.sites[fixture.direct_sqlite_authorization_sites[0]].closure_depth, 1);
  const unreachable = harmful.replace(
    '        let _ = auth_foundation_sqlite_provider::authorize_in_transaction(',
    '        if false { let _ = auth_foundation_sqlite_provider::authorize_in_transaction(')
    .replace('        );\n    }).decision', '        ); }\n    }).decision');
  assert.notEqual(unreachable, harmful);
  const unreachableFixture = inspectSelectedPublicHookFixture(unreachable);
  assert.equal(unreachableFixture.direct_sqlite_authorization_sites.length, 1);
  assert.equal(unreachableFixture.pre_gate_direct_sqlite_authorization_counterexample, false);
  assert.equal(unreachableFixture.bounded_graph_property.status, 'indeterminate');
  const aliased = harmful.replace(
    '        let _ = auth_foundation_sqlite_provider::authorize_in_transaction(',
    '        use auth_foundation_sqlite_provider::authorize_in_transaction as invoke_auth;\n        let _ = invoke_auth(');
  assert.notEqual(aliased, harmful);
  const aliasedFixture = inspectSelectedPublicHookFixture(aliased);
  assert.deepEqual(aliasedFixture.direct_sqlite_authorization_sites, []);
  assert.equal(aliasedFixture.bounded_graph_property.status, 'indeterminate');
  assert.throws(() => extractSelectedPublicPath(api, apiCargo, harmful,
    serviceCargo, { fixture: true }), /public-path-service-body-0/);
  const unrelated = harmful.replace('pub const MAX_REQUEST_ID_BYTES: usize = 256;',
    'pub const MAX_REQUEST_ID_BYTES: usize = 257;');
  assert.throws(() => inspectSelectedPublicHookFixture(unrelated), /hook-fixture-outside-body/);
  const fixtureDir = mkdtempSync(join(implementationRoot, '.v4b-harmful-hook-fixture-'));
  try {
    mkdirSync(join(fixtureDir, 'src'));
    mkdirSync(join(fixtureDir, 'migrations'));
    writeFileSync(join(fixtureDir, 'Cargo.toml'), serviceCargo);
    writeFileSync(join(fixtureDir, 'Cargo.lock'), readFileSync(serviceLockPath));
    writeFileSync(join(fixtureDir, 'src/lib.rs'), harmful);
    writeFileSync(join(fixtureDir, 'migrations/0002_auth_service_epoch.sql'), readFileSync(serviceMigrationPath));
    assert.throws(() => execFileSync(toolchainPath, ['cargo', 'check', '--offline', '--locked', '--quiet',
      '--manifest-path', join(fixtureDir, 'Cargo.toml')],
    { encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 }), error =>
      /unresolved module or unlinked crate `auth_foundation_sqlite_provider`/.test(error.stderr));
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test('selected detailed call template rejects duplicate or redirected text', () => {
  const call = 'authorize_in_epoch(&epoch, request, after_trusted_input)';
  const changed = service.replace(call, 'authorize_in_epoch(&epoch, request, after_trusted_input); authorize_in_epoch(&epoch, request, |_| {})');
  assert.notEqual(changed, service);
  assert.throws(() => extractSelectedPublicPath(api, apiCargo, changed, serviceCargo, { fixture: true }), /public-path-service-body-1/);
  const redirected = service.replace(call, 'authorize_in_epoch(&epoch, request, |_| {})');
  assert.notEqual(redirected, service);
  assert.throws(() => extractSelectedPublicPath(api, apiCargo, redirected, serviceCargo, { fixture: true }), /public-path-service-body-1/);
});

test('public-path source and Cargo drift outside selected bodies fail closed', () => {
  assert.throws(() => extractSelectedPublicPath(`${api}\nfn extra() { }`, apiCargo, service, serviceCargo, { fixture: true }), /public-path-outside-selected-body/);
  assert.throws(() => extractSelectedPublicPath(api, `${apiCargo}\n# changed`, service, serviceCargo, { fixture: true }), /public-path-cargo-pin/);
});

test('selected public entry spine binds builder, pool dispatch, no-op hook, and event distinctions', () => {
  const spine = currentCertificate().selected_public_entry_spine;
  assert.equal(spine.selected_root, 'authorization_runtime_from_database');
  assert.equal(spine.selected_instance, 'SqliteAuthService<SystemDecisionClock>');
  assert.ok(spine.edges.some(edge => edge.from === 'api_builder' && edge.to === 'service_open' &&
    edge.expression_syntaxes[0].includes('SystemDecisionClock')));
  assert.ok(spine.edges.some(edge => edge.from === 'api_runtime_authorize' &&
    edge.to === 'api_engine_authorize' && edge.closure_depths[0] > 0));
  assert.ok(spine.edges.some(edge => edge.from === 'service_authorize' && edge.to === 'service_detailed' &&
    edge.expression_syntaxes[0].includes('| _ | { }')));
  assert.ok(spine.nodes.api_runtime_authorize.sites.some(site => site.callee_syntax === 'timeout'));
  assert.ok(spine.nodes.service_detailed.sites.some(site => site.callee_syntax === 'with_downstream_port_calls'));
  assert.ok(spine.distinct_events.includes('kernel DENY'));
  assert.ok(spine.distinct_events.includes('post-call transaction finish failure'));
  assert.ok(spine.distinct_events.includes('API timeout or worker error'));
  assert.equal(spine.effect_status, 'open');
  assert.ok(spine.unresolved.includes('dynamic engine pool membership and vtable target'));
});

test('public entry source mutants cannot silently preserve the selected spine', () => {
  const check = (apiSource = api, serviceSource = service) =>
    extractSelectedPublicEntrySpine(apiSource, apiCargo, serviceSource, serviceCargo, { fixture: true });
  const alternateEngine = api.replace(
    '    AuthorizationRuntime::from_engines(\n        engines,',
    '    engines.push(Box::new(other_engine));\n    AuthorizationRuntime::from_engines(\n        engines,');
  assert.notEqual(alternateEngine, api);
  assert.throws(() => check(alternateEngine), /public-path-api-body-2/);
  const redirectedReceiver = api.replace('engine.authorize(request)', 'other_engine.authorize(request)');
  assert.notEqual(redirectedReceiver, api);
  assert.throws(() => check(redirectedReceiver), /public-path-outside-selected-body/);
  const changedHook = service.replace('self.authorize_detailed_with_hook(request, |_| {}).decision',
    'self.authorize_detailed_with_hook(request, |transaction| { let _ = transaction; }).decision');
  assert.notEqual(changedHook, service);
  assert.throws(() => check(api, changedHook), /public-path-service-body-0/);
  const secondPublicCall = service.replace('self.authorize_detailed_with_hook(request, |_| {}).decision',
    '{ let _ = self.authorize_detailed_with_hook(request.clone(), |_| {}); self.authorize_detailed_with_hook(request, |_| {}).decision }');
  assert.notEqual(secondPublicCall, service);
  assert.throws(() => check(api, secondPublicCall), /public-path-service-body-0/);
  const changedPool = api.replace('.push(engine);', '.push(other_engine);');
  assert.notEqual(changedPool, api);
  assert.throws(() => check(changedPool), /public-path-outside-selected-body/);
});

test('selected instance transfer exposes builder-only origin and a mixed-engine counterexample', () => {
  const baseline = extractSelectedInstanceTransfer(api, apiCargo, service, serviceCargo);
  assert.equal(baseline.form, 'selected-database-builder');
  assert.deepEqual(baseline.template_origin_set, ['SqliteAuthService<SystemDecisionClock>']);
  assert.equal(baseline.selected_origin_template_property, true);
  assert.equal(baseline.source_matched_transfer_sites.length, 11);
  assert.ok(baseline.source_matched_transfer_sites.some(step => step.site_role === 'move-vector-into-private-pool-mutex'));
  assert.ok(baseline.source_matched_transfer_sites.some(step => step.site_role === 'invoke-boxed-trait-object'));
  assert.equal(baseline.generic_from_engines_origin_set, 'unconstrained');
  assert.equal(baseline.runtime_guarantees_observed, false);
  assert.equal(baseline.ast_binding_facts.builder_vector.type_syntax,
    'Vec < Box < dyn AuthorizationEngine > >');
  assert.deepEqual(baseline.ast_binding_facts.builder_loop_push.control_context,
    ['for _ in 0 .. config . pool_size . get ()']);
  assert.equal(baseline.ast_binding_facts.pool_field.expression_syntax, 'Mutex :: new (engines)');
  assert.deepEqual(baseline.ast_binding_facts.worker_put_branch.control_context,
    ['match outcome arm 0 Ok (decision)']);

  const mixed = extractSelectedInstanceTransfer(mixedEngineFixture(), apiCargo, service, serviceCargo,
    { fixture: true });
  assert.equal(mixed.form, 'mixed-engine-fixture');
  assert.deepEqual(mixed.template_origin_set, ['SqliteAuthService<SystemDecisionClock>', 'AlternateEngine']);
  assert.equal(mixed.selected_origin_template_property, false);
  assert.ok(Number.isInteger(mixed.alternate_origin_site.ordinal));
  assert.throws(() => extractSelectedInstanceTransfer(mixedEngineFixture(), apiCargo, service, serviceCargo),
    /instance-transfer-api-pin/);
  const cleared = api.replace('    AuthorizationRuntime::from_engines(\n        engines,',
    '    engines.clear();\n    AuthorizationRuntime::from_engines(\n        engines,');
  assert.notEqual(cleared, api);
  assert.throws(() => extractSelectedInstanceTransfer(cleared, apiCargo, service, serviceCargo,
    { fixture: true }), /instance-transfer-builder-grammar/);
  const movedPut = extractSelectedInstanceTransfer(movedPutFixture(), apiCargo, service,
    serviceCargo, { fixture: true });
  assert.equal(movedPut.worker_branch_form, 'error-return-put-fixture');
  assert.equal(movedPut.normal_return_repool_template_property, false);
  assert.deepEqual(movedPut.ast_binding_facts.worker_put_branch.control_context,
    ['match outcome arm 1 Err (_)']);
  assert.throws(() => extractSelectedInstanceTransfer(movedPutFixture(), apiCargo, service,
    serviceCargo), /instance-transfer-api-pin/);
});

test('mixed-engine builder counterexample passes offline Rust type checking', () => {
  const fixtureDir = mkdtempSync(join(implementationRoot, '.v4b-api-fixture-'));
  try {
    mkdirSync(join(fixtureDir, 'src'));
    const changed = mixedEngineFixture();
    assert.equal(extractSelectedInstanceTransfer(changed, apiCargo, service, serviceCargo,
      { fixture: true }).selected_origin_template_property, false);
    writeFileSync(join(fixtureDir, 'Cargo.toml'), apiCargo);
    writeFileSync(join(fixtureDir, 'Cargo.lock'), readFileSync(apiLockPath));
    writeFileSync(join(fixtureDir, 'src/lib.rs'), changed);
    execFileSync(toolchainPath, ['cargo', 'check', '--offline', '--locked', '--quiet',
      '--manifest-path', join(fixtureDir, 'Cargo.toml')],
    { encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test('moved-put worker counterexample passes offline Rust type checking', () => {
  const fixtureDir = mkdtempSync(join(implementationRoot, '.v4b-api-worker-fixture-'));
  try {
    mkdirSync(join(fixtureDir, 'src'));
    const changed = movedPutFixture();
    assert.equal(extractSelectedInstanceTransfer(changed, apiCargo, service, serviceCargo,
      { fixture: true }).normal_return_repool_template_property, false);
    writeFileSync(join(fixtureDir, 'Cargo.toml'), apiCargo);
    writeFileSync(join(fixtureDir, 'Cargo.lock'), readFileSync(apiLockPath));
    writeFileSync(join(fixtureDir, 'src/lib.rs'), changed);
    execFileSync(toolchainPath, ['cargo', 'check', '--offline', '--locked', '--quiet',
      '--manifest-path', join(fixtureDir, 'Cargo.toml')],
    { encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test('selected service call has the adapter receiver shape and rejects substituted receiver', () => {
  const selected = extractServiceBinding(service, serviceCargo);
  assert.equal(selected.selected_call_receiver_shape, 'ResolvedDecisionService');
  const changed = service.replace('&mut ResolvedDecisionService {', '&mut AlternateDecisionService {');
  assert.notEqual(changed, service);
  assert.throws(() => extractServiceBinding(changed, serviceCargo, { fixture: true }), /service-tail-inline-wrapper-call/);
});

test('dead branch before unchanged call is rejected by closed service tail', () => {
  const changed = service.replace(
    '    let decision = authorize_pre_resolved(',
    '    if true { return AuthorizationOutcome::deny(AuthorizationDiagnostic::PolicyDenied); }\n    let decision = authorize_pre_resolved(',
  );
  assert.notEqual(changed, service);
  assert.throws(() => extractServiceBinding(changed, serviceCargo, { fixture: true }), /service-tail-/);
});

test('early return, conditional call, and extra statement cannot hide inside the tail', () => {
  const anchor = '    let decision = authorize_pre_resolved(';
  for (const inserted of [
    '    return AuthorizationOutcome::deny(AuthorizationDiagnostic::PolicyDenied);\n',
    '    if true { return AuthorizationOutcome::deny(AuthorizationDiagnostic::PolicyDenied); }\n',
    '    let _ = authorize_pre_resolved;\n',
  ]) {
    const changed = service.replace(anchor, `${inserted}${anchor}`);
    assert.notEqual(changed, service);
    assert.throws(() => extractServiceBinding(changed, serviceCargo, { fixture: true }), /service-tail-/);
  }
  const conditional = service
    .replace(anchor, '    let decision = if true { authorize_pre_resolved(')
    .replace('    );\n\n    let outcome', '    ) } else { BinaryAuthorizationDecision::Deny };\n\n    let outcome');
  assert.notEqual(conditional, service);
  assert.throws(() => extractServiceBinding(conditional, serviceCargo, { fixture: true }), /service-tail-/);
});

test('pre-tail changes now fail the selected prefix binding without claiming effect closure', () => {
  const anchor = '    let routes = snapshot';
  const changed = service.replace(anchor, '    if true { return AuthorizationOutcome::deny(AuthorizationDiagnostic::PolicyDenied); }\n    let routes = snapshot');
  assert.notEqual(changed, service);
  assert.throws(() => extractServiceBinding(changed, serviceCargo, { fixture: true }), /pre-tail-shape/);
  const additionalCall = service.replace('    after_trusted_input(epoch.transaction());', '    after_trusted_input(epoch.transaction());\n    std::thread::yield_now();');
  assert.notEqual(additionalCall, service);
  assert.throws(() => extractServiceBinding(additionalCall, serviceCargo, { fixture: true }), /pre-tail-shape/);
});

test('comments cannot spoof the executable routes-tail cutpoint', () => {
  const changed = service
    .replace('    let routes = snapshot', '    let routes_alt = snapshot')
    .replace(
      '    let expected_request_id = request.request_id.clone();',
      '    let routes = routes_alt;\n    if true { return AuthorizationOutcome::deny(AuthorizationDiagnostic::PolicyDenied); }\n    // let routes = snapshot\n    // .collect();\n    let expected_request_id = request.request_id.clone();',
    );
  assert.notEqual(changed, service);
  assert.throws(() => extractServiceBinding(changed, serviceCargo, { fixture: true }), /service-tail-routes-shape/);
});

test('a second pre-resolved invocation in the service tail is rejected', () => {
  const anchor = '    let outcome = match decision {';
  const extraCall = `    let _ = authorize_pre_resolved(
        V2InboundAuthorizationRequest {
            request_id: String::new(),
            authentication_evidence_ref: String::new(),
            route_id: String::new(),
        },
        Vec::new(),
        Vec::new(),
        &mut ResolvedDecisionService {
            expected_request_id: String::new(),
            expected: &command,
            state: None,
            downstream_port_calls: &mut downstream_port_calls,
        },
    );
`;
  const changed = service.replace(anchor, `${extraCall}${anchor}`);
  assert.notEqual(changed, service);
  assert.throws(() => extractServiceBinding(changed, serviceCargo, { fixture: true }), /service-tail-statement-count/);
});

test('parsed service tail admits same-instance eager call and C3 rejects its DENY and READY counts', () => {
  const changed = eagerSameInstanceFixture();
  const binding = extractServiceBinding(changed, serviceCargo, { fixture: true });
  assert.equal(binding.service_tail_ir.parse_source, 'syn-top-level-statements-with-closed-lexed-statement-grammar');
  assert.equal(binding.service_tail_ir.adapter_form, 'named');
  assert.equal(binding.service_tail_ir.prefix_adapter_calls, 1);
  assert.equal(binding.service_tail_ir.same_instance_receiver, true);
  const graph = checkSelectedGraph(selected, extractWrapperFixture(wrapper, wrapperCargo), binding.service_tail_ir);
  assert.equal(graph.pre_kernel_adapter_calls, 1);
  assert.equal(graph.deny_endpoint_calls, 1);
  assert.equal(graph.ready_endpoint_calls, 2);
  assert.equal(graph.branch_property, false);
});

test('same-instance eager-call source fixture passes offline Rust type checking', () => {
  const fixtureDir = mkdtempSync(join(implementationRoot, '.v4b-service-fixture-'));
  try {
    mkdirSync(join(fixtureDir, 'src'));
    mkdirSync(join(fixtureDir, 'migrations'));
    const changed = eagerSameInstanceFixture();
    const binding = extractServiceBinding(changed, serviceCargo, { fixture: true });
    assert.equal(binding.service_tail_ir.prefix_adapter_calls, 1);
    writeFileSync(join(fixtureDir, 'Cargo.toml'), serviceCargo);
    writeFileSync(join(fixtureDir, 'Cargo.lock'), readFileSync(serviceLockPath));
    writeFileSync(join(fixtureDir, 'src/lib.rs'), changed);
    writeFileSync(join(fixtureDir, 'migrations/0002_auth_service_epoch.sql'), readFileSync(serviceMigrationPath));
    execFileSync(toolchainPath, ['cargo', 'check', '--offline', '--locked', '--quiet',
      '--manifest-path', join(fixtureDir, 'Cargo.toml')],
    { encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test('tail extraction rejects wrong-instance, hidden, and opaque pre-kernel calls', () => {
  const eager = eagerSameInstanceFixture();
  const wrongInstance = eager.replace(
    'V2AuthorizationDecisionService::authorize(&mut decision_service, kernel_command.clone())',
    'V2AuthorizationDecisionService::authorize(&mut other_service, kernel_command.clone())');
  assert.notEqual(wrongInstance, eager);
  assert.throws(() => extractServiceBinding(wrongInstance, serviceCargo, { fixture: true }),
    /service-tail-eager-same-instance-call/);
  const conditional = eager.replace(
    '    let _ = V2AuthorizationDecisionService::authorize(&mut decision_service, kernel_command.clone());',
    '    if true { let _ = V2AuthorizationDecisionService::authorize(&mut decision_service, kernel_command.clone()); }');
  assert.notEqual(conditional, eager);
  assert.throws(() => extractServiceBinding(conditional, serviceCargo, { fixture: true }),
    /service-tail-eager-same-instance-call/);
  const opaque = eager.replace('    let decision = authorize_pre_resolved(',
    '    let _ = unknown_authorization_helper();\n    let decision = authorize_pre_resolved(');
  assert.notEqual(opaque, eager);
  assert.throws(() => extractServiceBinding(opaque, serviceCargo, { fixture: true }),
    /service-tail-statement-count/);
  assert.throws(() => checkSelectedGraph(selected, extractWrapperFixture(wrapper, wrapperCargo)),
    /service-tail-graph-input/);
});

test('concrete adapter counter and unselected source changes fail closed', () => {
  const changedCounter = service.replace('*self.downstream_port_calls += 1;', '*self.downstream_port_calls += 2;');
  assert.notEqual(changedCounter, service);
  assert.throws(() => extractServiceBinding(changedCounter, serviceCargo, { fixture: true }), /service-adapter-shape/);
  assert.throws(() => extractServiceBinding(`${service}\nfn extra() { }`, serviceCargo, { fixture: true }), /service-outside-selected-body/);
  assert.throws(() => extractServiceBinding(service, `${serviceCargo}\n# changed`, { fixture: true }), /service-cargo-pin/);
});

test('source-level duplicate Ready forwarding changes extracted graph and fails cardinality', () => {
  const changed = wrapper.replace(
    'CommandBoundaryDecision::Ready => self.downstream.authorize(candidate)',
    'CommandBoundaryDecision::Ready => { self.downstream.authorize(candidate.clone()); self.downstream.authorize(candidate) }',
  );
  assert.notEqual(changed, wrapper);
  const ir = extractWrapperFixture(changed, wrapperCargo);
  const graph = checkSelectedGraph(selected, ir, currentCertificate().service_tail_ir);
  assert.equal(graph.ready_endpoint_calls, 2);
  assert.equal(graph.branch_property, false);
});

test('source-level eager forwarding changes extracted graph and fails DENY zero-call', () => {
  const changed = wrapper.replace(
    '        match boundary_kernel::admit_authorization_command(&context) {',
    '        let _ = self.downstream.authorize(candidate.clone());\n        match boundary_kernel::admit_authorization_command(&context) {',
  );
  assert.notEqual(changed, wrapper);
  const graph = checkSelectedGraph(selected, extractWrapperFixture(changed, wrapperCargo),
    currentCertificate().service_tail_ir);
  assert.equal(graph.deny_endpoint_calls, 1);
  assert.equal(graph.branch_property, false);
});

test('extra pre-resolved body syntax is rejected rather than omitted from the graph', () => {
  const changed = pre.replace(
    '    TrustedAuthorizationBoundary::new(',
    '    let _ = downstream.authorize(AuthorizationCommand { request_id: String::new(), session_id: String::new(), required_permission: Permission { resource: String::new(), action: String::new(), scope: String::new() }, scope_evidence_ref: String::new() });\n    TrustedAuthorizationBoundary::new(',
  );
  assert.notEqual(changed, pre);
  assert.throws(() => extractPreResolved(changed, preCargo, { fixture: true }), /pre-resolved-call-shape/);
});

test('BorrowedDecision forwarding mutation fails its source-token check', () => {
  const changed = pre.replace('self.0.authorize(command)', 'BinaryAuthorizationDecision::Deny');
  assert.notEqual(changed, pre);
  assert.throws(() => extractPreResolved(changed, preCargo, { fixture: true }), /borrowed-forwarding/);
});

test('outside-body and Cargo mutation fail closed', () => {
  assert.throws(() => extractPreResolved(`${pre}\nfn extra() { }`, preCargo, { fixture: true }), /outside-selected-body/);
  assert.throws(() => extractPreResolved(pre, preCargo.replace('../trusted-boundary-v2', '../trusted-boundary'), { fixture: true }), /cargo-pin/);
});
