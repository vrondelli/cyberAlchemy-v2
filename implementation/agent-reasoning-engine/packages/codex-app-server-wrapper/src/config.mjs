import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {isAbsolute, resolve} from "node:path";
import {loadVerifiedDecisionProfile} from "../../request-decision-router/index.mjs";
import {loadSemanticInputProfile} from "../../semantic-input-runtime/index.mjs";
import {loadReasoningPolicy} from "../../reasoning-policy-runtime/index.mjs";
import {sha256HexText} from "../../intent-route-resolver/index.mjs";
import {fail, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {materializeDefinitionCatalog, materializeOntologySnapshot} from "./source-adapters.mjs";
import {validMeaningSelection} from "./objective-meanings.mjs";
import {validInteractionLearningConfiguration} from "./interaction-learning-lifecycle.mjs";

const SOURCE_HASH_IMPLEMENTATIONS = new Set(["node-crypto-sha256", "portable-js-sha256"]);

function sourceTextDigest(text, implementation) {
  return implementation === "node-crypto-sha256"
    ? createHash("sha256").update(text, "utf8").digest("hex")
    : sha256HexText(text);
}

function absolute(repositoryRoot, path) {
  return isAbsolute(path) ? path : resolve(repositoryRoot, path);
}

function readBoundJson(repositoryRoot, binding) {
  if (!isRecord(binding) || !nonEmptyString(binding.path) || !nonEmptyString(binding.sha256)) {
    return fail("config", ["config.source-binding-invalid"]);
  }
  const path = absolute(repositoryRoot, binding.path);
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return fail("config", ["config.source-unreadable"], [{path: binding.path}]);
  }
  const actual = sha256HexText(text);
  if (actual !== binding.sha256) return fail("config", ["config.source-digest-drift"], [{path: binding.path, expected: binding.sha256, actual}]);
  try {
    return {ok: true, document: JSON.parse(text), path, sha256: actual};
  } catch {
    return fail("config", ["config.source-json-invalid"], [{path: binding.path}]);
  }
}

function readLiveJson(repositoryRoot, binding, hashImplementation) {
  if (!isRecord(binding) || !nonEmptyString(binding.path)) return fail("config", ["config.source-binding-invalid"]);
  const path = absolute(repositoryRoot, binding.path);
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return fail("config", ["config.source-unreadable"], [{path: binding.path}]);
  }
  const actual = sourceTextDigest(text, hashImplementation);
  try {
    return {ok: true, document: JSON.parse(text), path, source_identity: binding.path, source_digest: actual};
  } catch {
    return fail("config", ["config.source-json-invalid"], [{path: binding.path}]);
  }
}

function readLiveText(repositoryRoot, binding, hashImplementation) {
  if (!isRecord(binding) || !nonEmptyString(binding.path)) return fail("config", ["config.source-binding-invalid"]);
  const path = absolute(repositoryRoot, binding.path);
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return fail("config", ["config.source-unreadable"], [{path: binding.path}]);
  }
  return {ok: true, text, path, source_identity: binding.path, source_digest: sourceTextDigest(text, hashImplementation)};
}

function loadLiveContextSources(profile, repositoryRoot, hashImplementation) {
  const sources = profile.sources ?? {};
  const decisionSource = readLiveJson(repositoryRoot, sources.decision_profile, hashImplementation);
  if (!decisionSource.ok) return decisionSource;
  const decisionProfile = loadVerifiedDecisionProfile(decisionSource.path, repositoryRoot);
  if (!decisionProfile.ok) return fail("config", decisionProfile.reason_codes ?? ["config.decision-profile-unverified"]);
  const definitionSources = [];
  const sourceSnapshot = [{source_identity: sources.decision_profile.path, source_digest: decisionSource.source_digest}];
  for (const binding of Array.isArray(sources.definition_sources) ? sources.definition_sources : []) {
    const loaded = readLiveJson(repositoryRoot, binding, hashImplementation);
    if (!loaded.ok) return loaded;
    definitionSources.push({document: loaded.document, source_identity: loaded.source_identity, source_digest: loaded.source_digest});
    sourceSnapshot.push({source_identity: loaded.source_identity, source_digest: loaded.source_digest});
  }
  for (const binding of Array.isArray(sources.canonical_definition_sources) ? sources.canonical_definition_sources : []) {
    const loaded = readLiveText(repositoryRoot, binding, hashImplementation);
    if (!loaded.ok) return loaded;
    definitionSources.push({format: "canonical-definitions-markdown/v1", text: loaded.text, source_identity: loaded.source_identity, source_digest: loaded.source_digest});
    sourceSnapshot.push({source_identity: loaded.source_identity, source_digest: loaded.source_digest});
  }
  const catalog = materializeDefinitionCatalog({sources: definitionSources});
  if (!catalog.ok) return catalog;
  const ontologySource = readLiveJson(repositoryRoot, sources.system_ontology, hashImplementation);
  if (!ontologySource.ok) return ontologySource;
  sourceSnapshot.push({source_identity: ontologySource.source_identity, source_digest: ontologySource.source_digest});
  const snapshot = materializeOntologySnapshot({
    document: ontologySource.document,
    source_identity: ontologySource.source_identity,
    source_digest: ontologySource.source_digest,
    required_edge_ids_by_node: profile.context?.required_edge_ids_by_node,
  });
  if (!snapshot.ok) return snapshot;
  const instructions = [];
  for (const [index, binding] of (sources.instruction_sources ?? []).entries()) {
    const loaded = readLiveText(repositoryRoot, binding, hashImplementation);
    if (!loaded.ok) return loaded;
    instructions.push({
      instruction_id: nonEmptyString(binding.instruction_id) ? binding.instruction_id.trim() : `repository-instruction:${index}`,
      source_ref: loaded.source_identity,
      source_digest: loaded.source_digest,
      authority_posture: binding.authority_posture ?? "repository-instruction",
      content: loaded.text,
    });
    sourceSnapshot.push({source_identity: loaded.source_identity, source_digest: loaded.source_digest});
  }
  const supplementalContextItems = [];
  for (const binding of sources.context_sources ?? []) {
    const loaded = readLiveJson(repositoryRoot, binding, hashImplementation);
    if (!loaded.ok) return loaded;
    if (binding.format !== "ontology-registry/v1" || loaded.document.schema_version !== "cav2-ontology-runtime-registry/v1" || !Array.isArray(loaded.document.entries)) {
      return fail("config", ["config.context-source-format-invalid"], [{path: binding.path}]);
    }
    supplementalContextItems.push({
      context_item_id: binding.context_item_id ?? "ontology-catalog:repository",
      item_kind: "ontology-catalog",
      source_ref: loaded.source_identity,
      source_digest: loaded.source_digest,
      authority_posture: "diagnostic-catalog-not-admission",
      match_terms: binding.match_terms ?? ["ontology", "ontologies", "ontology catalog"],
      transform_refs: ["ontology-registry-catalog-projection/v1"],
      content: {
        registry_id: loaded.document.registry_id,
        ontologies: loaded.document.entries.map((entry) => ({ontology_id: entry.ontology_id, package_root: entry.package_root, owner_route: entry.owner_route, authority_effect: entry.authority_effect})),
      },
    });
    sourceSnapshot.push({source_identity: loaded.source_identity, source_digest: loaded.source_digest});
  }
  sourceSnapshot.sort((a, b) => a.source_identity.localeCompare(b.source_identity));
  return {
    ok: true,
    decision_profile: decisionProfile.value,
    definition_catalog: catalog.value,
    ontology_snapshot: snapshot.value,
    instructions: freezeResult(instructions.sort((a, b) => a.instruction_id.localeCompare(b.instruction_id))),
    supplemental_context_items: freezeResult(supplementalContextItems.sort((a, b) => a.context_item_id.localeCompare(b.context_item_id))),
    source_snapshot: freezeResult(sourceSnapshot),
    authority_effect: "none",
  };
}

function probeLiveContextSignature(profile, repositoryRoot, hashImplementation) {
  const sources = profile.sources ?? {};
  const bindings = [sources.decision_profile, ...(sources.definition_sources ?? []), ...(sources.canonical_definition_sources ?? []), sources.system_ontology, ...(sources.instruction_sources ?? []), ...(sources.context_sources ?? [])];
  const entries = [];
  for (const binding of bindings) {
    if (!isRecord(binding) || !nonEmptyString(binding.path)) return fail("config", ["config.source-binding-invalid"]);
    let text;
    try {
      text = readFileSync(absolute(repositoryRoot, binding.path), "utf8");
    } catch {
      return fail("config", ["config.source-unreadable"], [{path: binding.path}]);
    }
    entries.push({source_identity: binding.path, source_digest: sourceTextDigest(text, hashImplementation)});
  }
  entries.sort((a, b) => a.source_identity.localeCompare(b.source_identity));
  return {ok: true, signature: sha256HexText(JSON.stringify(entries)), entries};
}

function createLiveContextSourceProvider(profile, repositoryRoot, initialLive, hashImplementation) {
  let cached = initialLive;
  let probe = probeLiveContextSignature(profile, repositoryRoot, hashImplementation);
  let signature = probe.ok ? probe.signature : null;
  return () => {
    probe = probeLiveContextSignature(profile, repositoryRoot, hashImplementation);
    if (!probe.ok) return probe;
    if (cached?.ok && probe.signature === signature) return cached;
    const refreshed = loadLiveContextSources(profile, repositoryRoot, hashImplementation);
    if (!refreshed.ok) return refreshed;
    cached = refreshed;
    signature = probe.signature;
    return cached;
  };
}

export function loadRepositoryProfile(profilePath, repositoryRoot, options = {}) {
  let profile;
  try {
    profile = JSON.parse(readFileSync(profilePath, "utf8"));
  } catch {
    return fail("config", ["config.profile-unreadable"]);
  }
  if (!isRecord(profile) || !["are.codex-wrapper-repository-profile/v1", "are.codex-wrapper-repository-profile/v2", "are.codex-wrapper-repository-profile/v3", "are.codex-wrapper-repository-profile/v4"].includes(profile.schema_version)) {
    return fail("config", ["config.profile-version-unsupported"]);
  }
  const sourceRefreshProfile = isRecord(profile.context_source_refresh)
    ? profile.context_source_refresh
    : {hash_implementation: "node-crypto-sha256", verification: "read-and-hash-every-selected-source"};
  const sourceHashImplementation = options.source_hash_implementation ?? sourceRefreshProfile.hash_implementation ?? "node-crypto-sha256";
  if (!SOURCE_HASH_IMPLEMENTATIONS.has(sourceHashImplementation)) return fail("config", ["config.context-source-hash-implementation-invalid"]);
  if ((sourceRefreshProfile.verification ?? "read-and-hash-every-selected-source") !== "read-and-hash-every-selected-source") {
    return fail("config", ["config.context-source-verification-invalid"]);
  }
  const sources = profile.sources ?? {};
  let live;
  if (["are.codex-wrapper-repository-profile/v2", "are.codex-wrapper-repository-profile/v3", "are.codex-wrapper-repository-profile/v4"].includes(profile.schema_version)) {
    live = loadLiveContextSources(profile, repositoryRoot, sourceHashImplementation);
  } else {
    const decisionProfileBinding = readBoundJson(repositoryRoot, sources.decision_profile);
    if (!decisionProfileBinding.ok) return decisionProfileBinding;
    const decisionProfile = loadVerifiedDecisionProfile(decisionProfileBinding.path, repositoryRoot);
    if (!decisionProfile.ok) return fail("config", decisionProfile.reason_codes ?? ["config.decision-profile-unverified"]);
    const definitionSources = [];
    for (const binding of Array.isArray(sources.definition_sources) ? sources.definition_sources : []) {
      const loaded = readBoundJson(repositoryRoot, binding);
      if (!loaded.ok) return loaded;
      definitionSources.push({document: loaded.document, source_identity: binding.path, source_digest: loaded.sha256});
    }
    const catalog = materializeDefinitionCatalog({sources: definitionSources});
    if (!catalog.ok) return catalog;
    const ontologySource = readBoundJson(repositoryRoot, sources.system_ontology);
    if (!ontologySource.ok) return ontologySource;
    const snapshot = materializeOntologySnapshot({document: ontologySource.document, source_identity: sources.system_ontology.path, source_digest: ontologySource.sha256, required_edge_ids_by_node: profile.context?.required_edge_ids_by_node});
    if (!snapshot.ok) return snapshot;
    live = {ok: true, decision_profile: decisionProfile.value, definition_catalog: catalog.value, ontology_snapshot: snapshot.value, instructions: freezeResult([]), supplemental_context_items: freezeResult([]), source_snapshot: freezeResult([]), authority_effect: "none"};
  }
  if (!live.ok) return live;

  const exactSources = {};
  for (const bindingName of ["interface", "protocol_observation", "continuation_selection", "context_basis_receipt"]) {
    const loaded = readBoundJson(repositoryRoot, sources[bindingName]);
    if (!loaded.ok) return loaded;
    exactSources[bindingName] = loaded;
  }
  if (sources.protocol_projection !== undefined) {
    const loaded = readBoundJson(repositoryRoot, sources.protocol_projection);
    if (!loaded.ok) return loaded;
    exactSources.protocol_projection = loaded;
  }
  const protocolBinding = profile.protocol_binding;
  const observation = exactSources.protocol_observation.document;
  const protocolReasons = [];
  if (!isRecord(observation) || !["are.codex-app-server-protocol-observation/v1", "are.codex-app-server-protocol-observation/v2"].includes(observation.schema_version) || observation.authority_effect !== "none") {
    protocolReasons.push("config.protocol-observation-invalid");
  }
  if (!isRecord(protocolBinding)) protocolReasons.push("config.protocol-binding-invalid");
  else if (isRecord(observation)) {
    if (protocolBinding.interface_sha256 !== exactSources.interface.sha256) protocolReasons.push("config.protocol-interface-binding-drift");
    if (protocolBinding.observation_sha256 !== exactSources.protocol_observation.sha256) protocolReasons.push("config.protocol-observation-binding-drift");
    if (protocolBinding.observed_codex_version !== observation.observed_codex_version) protocolReasons.push("config.protocol-observed-version-drift");
    if (protocolBinding.selected_projection_sha256 !== observation.selected_projection_sha256) protocolReasons.push("config.protocol-selected-projection-drift");
    if (observation.compatible_interface_sha256 !== undefined && observation.compatible_interface_sha256 !== exactSources.interface.sha256) protocolReasons.push("config.protocol-compatible-interface-drift");
    if (observation.selected_projection_ref !== undefined && !exactSources.protocol_projection) protocolReasons.push("config.protocol-projection-source-required");
    if (exactSources.protocol_projection) {
      const projection = exactSources.protocol_projection.document;
      if (!isRecord(projection) || projection.schema_version !== "are.codex-app-server-selected-projection/v1" || projection.authority_effect !== "none") protocolReasons.push("config.protocol-projection-invalid");
      else {
        if (protocolBinding.selected_projection_sha256 !== exactSources.protocol_projection.sha256) protocolReasons.push("config.protocol-projection-binding-drift");
        if (projection.observed_codex_version !== observation.observed_codex_version) protocolReasons.push("config.protocol-projection-version-drift");
        if (JSON.stringify(projection.selectors) !== JSON.stringify(observation.observed_surfaces)) protocolReasons.push("config.protocol-projection-selector-drift");
      }
    }
  }
  if (protocolReasons.length > 0) return fail("config", protocolReasons);

  const semanticEvaluation = isRecord(profile.semantic_evaluation)
    ? profile.semantic_evaluation
    : {enabled: false, trigger: "turn/completed"};
  if (semanticEvaluation.enabled !== true && semanticEvaluation.enabled !== false) return fail("config", ["config.semantic-enabled-invalid"]);
  if (semanticEvaluation.trigger !== "turn/completed") return fail("config", ["config.semantic-trigger-unsupported"]);
  const evolutionSignals = isRecord(profile.evolution_signals)
    ? profile.evolution_signals
    : {enabled: false, trigger: "turn/completed"};
  if (evolutionSignals.enabled !== true && evolutionSignals.enabled !== false) return fail("config", ["config.evolution-signals-enabled-invalid"]);
  if (evolutionSignals.trigger !== "turn/completed") return fail("config", ["config.evolution-signals-trigger-unsupported"]);
  const intentCompilation = isRecord(profile.intent_compilation)
    ? profile.intent_compilation
    : {enabled: false, trigger: "turn/start", control_profile: {visibility: "quiet"}};
  if (intentCompilation.enabled !== true && intentCompilation.enabled !== false) return fail("config", ["config.intent-compilation-enabled-invalid"]);
  if ((intentCompilation.trigger ?? "turn/start") !== "turn/start") return fail("config", ["config.intent-compilation-trigger-unsupported"]);
  const cacheTelemetry = isRecord(profile.cache_telemetry) ? profile.cache_telemetry : {enabled: false, usage_paths: []};
  const objectiveResolution = profile.objective_resolution ?? {enabled: false};
  const interactionLearning = profile.interaction_learning ?? {enabled: false};
  if (!validInteractionLearningConfiguration(interactionLearning)) return fail("config", ["config.interaction-learning-invalid"]);
  if (!isRecord(objectiveResolution) || typeof objectiveResolution.enabled !== "boolean"
    || Object.keys(objectiveResolution).some(key => !["enabled", "provider_timeout_ms", "meaning_selection", "requirement_tracking"].includes(key))
    || (objectiveResolution.requirement_tracking !== undefined && typeof objectiveResolution.requirement_tracking !== "boolean")
    || (objectiveResolution.requirement_tracking === true && objectiveResolution.enabled !== true)
    || (objectiveResolution.meaning_selection !== undefined && !validMeaningSelection(objectiveResolution.meaning_selection))
    || !Number.isSafeInteger(objectiveResolution.provider_timeout_ms ?? 1000)
    || (objectiveResolution.provider_timeout_ms ?? 1000) < 1 || (objectiveResolution.provider_timeout_ms ?? 1000) > 30000) return fail("config", ["config.objective-resolution-invalid"]);
  if (cacheTelemetry.enabled !== true && cacheTelemetry.enabled !== false) return fail("config", ["config.cache-telemetry-enabled-invalid"]);
  if (!Array.isArray(cacheTelemetry.usage_paths) || cacheTelemetry.usage_paths.some((path) => !nonEmptyString(path))) return fail("config", ["config.cache-telemetry-usage-paths-invalid"]);
  const contextProjection = isRecord(profile.context_projection) ? profile.context_projection : {max_inline_bytes: 32768};
  if (contextProjection.reuse_compatible_interaction_projection !== undefined
    && typeof contextProjection.reuse_compatible_interaction_projection !== "boolean") {
    return fail("config", ["config.context-projection-interaction-reuse-invalid"]);
  }
  const runtimeJournal = isRecord(profile.runtime_journal)
    ? profile.runtime_journal
    : {journal_id: `are-codex-runtime:${profile.profile_id}`, max_events: 4096, max_closed_turns: 256};
  if (!nonEmptyString(runtimeJournal.journal_id)) return fail("config", ["config.runtime-journal-id-invalid"]);
  for (const field of ["max_events", "max_closed_turns"]) {
    if (!Number.isSafeInteger(runtimeJournal[field]) || runtimeJournal[field] < 0) {
      return fail("config", [`config.runtime-journal-${field.replaceAll("_", "-")}-invalid`]);
    }
  }
  const reasoningState = isRecord(profile.reasoning_state)
    ? profile.reasoning_state
    : {ledger_id: `are-reasoning-state:${profile.profile_id}`, storage_mode: "process-memory"};
  if (!nonEmptyString(reasoningState.ledger_id)) return fail("config", ["config.reasoning-state-ledger-id-invalid"]);
  if (!["process-memory", "append-only-file-fsync"].includes(reasoningState.storage_mode)) return fail("config", ["config.reasoning-state-storage-mode-invalid"]);
  if (reasoningState.storage_mode === "append-only-file-fsync" && !nonEmptyString(reasoningState.log_path)) return fail("config", ["config.reasoning-state-log-path-required"]);
  const reasoningPolicySource = readBoundJson(repositoryRoot, sources.reasoning_policy_profile);
  if (!reasoningPolicySource.ok) return reasoningPolicySource;
  const loadedReasoningPolicy = loadReasoningPolicy(reasoningPolicySource.path, repositoryRoot);
  if (!loadedReasoningPolicy.ok) return fail("config", loadedReasoningPolicy.reason_codes ?? ["config.reasoning-policy-unverified"]);
  const gateway = isRecord(profile.gateway) ? profile.gateway : {
    backend_mode: "direct-stdio",
    max_clients: 8,
    max_buffered_messages_per_client: 256,
    reconnect: true,
    detach_timeout_ms: 300000,
    idle_timeout_ms: 1800000,
    max_retained_bytes_per_session: 4194304,
    max_reasoning_log_bytes_per_session: 67108864,
    expiration_tombstone_ttl_ms: 3600000,
    eviction_retry_ms: 1000,
    allowed_clients: [
      {consumer_id: "codex:human-chat", lane: "interaction-bound"},
      {consumer_id: "codex:plan", lane: "plan-bound", window_ref: "plan:persistent-codex", request_id: "request:persistent-codex-plan"},
    ],
  };
  if (!["direct-stdio", "daemon-proxy", "websocket"].includes(gateway.backend_mode)) return fail("config", ["config.gateway-backend-invalid"]);
  for (const field of ["max_clients", "max_buffered_messages_per_client"]) {
    if (!Number.isSafeInteger(gateway[field]) || gateway[field] < 1) return fail("config", [`config.gateway-${field.replaceAll("_", "-")}-invalid`]);
  }
  for (const field of ["detach_timeout_ms", "idle_timeout_ms"]) {
    const value = gateway[field] ?? (field === "detach_timeout_ms" ? 300000 : 1800000);
    if (!Number.isSafeInteger(value) || value < 0) return fail("config", [`config.gateway-${field.replaceAll("_", "-")}-invalid`]);
  }
  const gatewayPositiveDefaults = {max_retained_bytes_per_session: 4194304, max_reasoning_log_bytes_per_session: 67108864, expiration_tombstone_ttl_ms: 3600000, eviction_retry_ms: 1000};
  for (const [field, fallback] of Object.entries(gatewayPositiveDefaults)) {
    const value = gateway[field] ?? fallback;
    if (!Number.isSafeInteger(value) || value < 1) return fail("config", [`config.gateway-${field.replaceAll("_", "-")}-invalid`]);
  }
  if (gateway.reconnect !== true && gateway.reconnect !== false) return fail("config", ["config.gateway-reconnect-invalid"]);
  const gatewayReasoningState = isRecord(gateway.reasoning_state)
    ? gateway.reasoning_state
    : {mode: "process-memory", directory: null, single_writer: false};
  if (!["process-memory", "file-per-consumer"].includes(gatewayReasoningState.mode)) return fail("config", ["config.gateway-reasoning-state-mode-invalid"]);
  if (gatewayReasoningState.mode === "file-per-consumer" && !nonEmptyString(gatewayReasoningState.directory)) return fail("config", ["config.gateway-reasoning-state-directory-required"]);
  if (gatewayReasoningState.mode === "file-per-consumer" && gatewayReasoningState.single_writer !== true) return fail("config", ["config.gateway-reasoning-state-single-writer-required"]);
  const gatewaySessionStore = isRecord(gateway.session_store) ? gateway.session_store : {mode: "process-memory", path: null, single_writer: false};
  if (!["process-memory", "append-only-file-fsync"].includes(gatewaySessionStore.mode)) return fail("config", ["config.gateway-session-store-mode-invalid"]);
  if (gatewaySessionStore.mode === "append-only-file-fsync" && !nonEmptyString(gatewaySessionStore.path)) return fail("config", ["config.gateway-session-store-path-required"]);
  if (gatewaySessionStore.mode === "append-only-file-fsync" && gatewaySessionStore.single_writer !== true) return fail("config", ["config.gateway-session-store-single-writer-required"]);
  if (!Array.isArray(gateway.allowed_clients) || gateway.allowed_clients.length === 0) return fail("config", ["config.gateway-clients-required"]);
  const gatewayClients = [];
  const gatewayConsumerIds = new Set();
  for (const client of gateway.allowed_clients) {
    if (!isRecord(client) || !nonEmptyString(client.consumer_id) || !["plan-bound", "interaction-bound"].includes(client.lane) || gatewayConsumerIds.has(client.consumer_id) || (client.lane === "plan-bound" && (!nonEmptyString(client.window_ref) || !nonEmptyString(client.request_id)))) {
      return fail("config", ["config.gateway-client-invalid"]);
    }
    gatewayConsumerIds.add(client.consumer_id);
    gatewayClients.push({consumer_id: client.consumer_id, lane: client.lane, window_ref: client.lane === "plan-bound" ? client.window_ref : null, request_id: client.lane === "plan-bound" ? client.request_id : null});
  }
  let semanticProfile = null;
  if (isRecord(sources.semantic_input_profile)) {
    const semanticProfileSource = readBoundJson(repositoryRoot, sources.semantic_input_profile);
    if (!semanticProfileSource.ok) return semanticProfileSource;
    const loadedSemanticProfile = loadSemanticInputProfile(semanticProfileSource.path, repositoryRoot);
    if (!loadedSemanticProfile.ok) return fail("config", loadedSemanticProfile.reason_codes ?? ["config.semantic-profile-unverified"], loadedSemanticProfile.residue ?? []);
    semanticProfile = loadedSemanticProfile.value;
  }

  return {
    ok: true,
    value: freezeResult({
      schema_version: "are.codex-wrapper-loaded-profile/v5",
      profile_id: profile.profile_id,
      protocol_binding: protocolBinding,
      context: profile.context,
      turn_bindings: profile.turn_bindings,
      effect_defaults: profile.effect_defaults,
      context_projection: contextProjection,
      context_source_refresh: freezeResult({hash_implementation: sourceHashImplementation, verification: "read-and-hash-every-selected-source"}),
      semantic_evaluation: freezeResult({enabled: semanticEvaluation.enabled, trigger: semanticEvaluation.trigger}),
      evolution_signals: freezeResult({enabled: evolutionSignals.enabled, trigger: evolutionSignals.trigger}),
      intent_compilation: freezeResult({enabled: intentCompilation.enabled, trigger: intentCompilation.trigger ?? "turn/start", control_profile: isRecord(intentCompilation.control_profile) ? intentCompilation.control_profile : {visibility: "quiet"}}),
      interaction_learning: freezeResult(interactionLearning),
      objective_resolution: freezeResult({enabled: objectiveResolution.enabled, provider_timeout_ms: objectiveResolution.provider_timeout_ms ?? 1000,
        ...(objectiveResolution.requirement_tracking !== undefined ? {requirement_tracking: objectiveResolution.requirement_tracking} : {}),
        ...(objectiveResolution.meaning_selection ? {meaning_selection: objectiveResolution.meaning_selection} : {})}),
      cache_telemetry: freezeResult({enabled: cacheTelemetry.enabled, usage_paths: cacheTelemetry.usage_paths, fields: isRecord(cacheTelemetry.fields) ? cacheTelemetry.fields : {}}),
      runtime_journal: freezeResult({
        journal_id: runtimeJournal.journal_id,
        max_events: runtimeJournal.max_events,
        max_closed_turns: runtimeJournal.max_closed_turns,
      }),
      reasoning_state: freezeResult({
        ledger_id: reasoningState.ledger_id.trim(),
        storage_mode: reasoningState.storage_mode,
        log_path: nonEmptyString(reasoningState.log_path) ? absolute(repositoryRoot, reasoningState.log_path) : null,
        single_writer: reasoningState.single_writer === true,
        checkpoints: freezeResult({before_model_request: true, before_effect: true, before_continuation: true}),
      }),
      reasoning_policy: loadedReasoningPolicy.value,
      gateway: freezeResult({
        backend_mode: gateway.backend_mode,
        max_clients: gateway.max_clients,
        max_buffered_messages_per_client: gateway.max_buffered_messages_per_client,
        reconnect: gateway.reconnect,
        detach_timeout_ms: gateway.detach_timeout_ms ?? 300000,
        idle_timeout_ms: gateway.idle_timeout_ms ?? 1800000,
        max_retained_bytes_per_session: gateway.max_retained_bytes_per_session ?? 4194304,
        max_reasoning_log_bytes_per_session: gateway.max_reasoning_log_bytes_per_session ?? 67108864,
        expiration_tombstone_ttl_ms: gateway.expiration_tombstone_ttl_ms ?? 3600000,
        eviction_retry_ms: gateway.eviction_retry_ms ?? 1000,
        reasoning_state: freezeResult({
          mode: gatewayReasoningState.mode,
          directory: nonEmptyString(gatewayReasoningState.directory) ? absolute(repositoryRoot, gatewayReasoningState.directory) : null,
          single_writer: gatewayReasoningState.mode === "file-per-consumer",
        }),
        session_store: freezeResult({
          mode: gatewaySessionStore.mode,
          path: nonEmptyString(gatewaySessionStore.path) ? absolute(repositoryRoot, gatewaySessionStore.path) : null,
          single_writer: gatewaySessionStore.mode === "append-only-file-fsync",
        }),
        allowed_clients: gatewayClients.sort((a, b) => a.consumer_id.localeCompare(b.consumer_id)),
      }),
      authority_effect: "none",
    }),
    decision_profile: live.decision_profile,
    definition_catalog: live.definition_catalog,
    ontology_snapshot: live.ontology_snapshot,
    instructions: live.instructions,
    supplemental_context_items: live.supplemental_context_items,
    source_snapshot: live.source_snapshot,
    context_source_provider: createLiveContextSourceProvider(profile, repositoryRoot, live, sourceHashImplementation),
    semantic_profile: semanticProfile,
  };
}
