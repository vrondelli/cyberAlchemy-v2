import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve, sep} from "node:path";

import {
  digestValue,
  EVALUATOR_ID,
  evaluateContextBoundSemanticJudgment,
  SCHEMA_VERSION,
  sealRecord,
  verifyFrozenContextEnvelope,
} from "../semantic-judgment-evaluator/index.mjs";
import {verifyRuntimeJournalCut} from "../runtime-journal/index.mjs";

export const SEMANTIC_INPUT_PROFILE_SCHEMA = "are.semantic-input-profile/v1";
export const SEMANTIC_DOMAIN_BINDING_SCHEMA = "are.semantic-domain-binding/v1";
export const OBSERVATION_CANDIDATE_SCHEMA = "are.observation-candidate/v1";
export const SEMANTIC_MATERIALIZATION_SCHEMA = "are.semantic-input-materialization/v1";
export const SEMANTIC_LIFECYCLE_SCHEMA = "are.semantic-lifecycle-result/v1";

const verifiedProfiles = new WeakSet();
const allowedProviderKinds = ["authority", "catalog", "validators"];

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function fail(stage, reasonCodes, residue = [], extra = {}) {
  return deepFreeze({
    schema_version: SEMANTIC_LIFECYCLE_SCHEMA,
    ok: false,
    disposition: "block",
    stage,
    reason_codes: uniqueSorted(reasonCodes),
    residue,
    evaluator_calls: 0,
    authority_effect: "none",
    ...extra,
  });
}

function success(value) {
  return deepFreeze({ok: true, value, digest: digestValue(value), authority_effect: "none"});
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isTimestamp(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function withinRoot(root, path) {
  return path === root || path.startsWith(`${root}${sep}`);
}

function hasCycle(edges) {
  const graph = new Map();
  for (const edge of edges ?? []) {
    if (typeof edge?.from !== "string" || typeof edge?.to !== "string" || !edge.from || !edge.to) return true;
    if (!graph.has(edge.from)) graph.set(edge.from, []);
    graph.get(edge.from).push(edge.to);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(node) {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of graph.get(node) ?? []) if (visit(next)) return true;
    visiting.delete(node);
    visited.add(node);
    return false;
  }
  return [...graph.keys()].some(visit);
}

function validateBinding(binding, index) {
  const reasons = [];
  const prefix = `profile.binding:${index}`;
  if (!isObject(binding) || binding.schema_version !== SEMANTIC_DOMAIN_BINDING_SCHEMA) return [`${prefix}:schema-invalid`];
  for (const field of ["binding_id", "conclusion_domain", "evaluator_id", "owner_ref", "question", "claim_ceiling"]) {
    if (typeof binding[field] !== "string" || !binding[field]) reasons.push(`${prefix}:${field}-required`);
  }
  if (binding.evaluator_id !== EVALUATOR_ID) reasons.push(`${prefix}:evaluator-unsupported`);
  if (binding.authority_effect !== "none") reasons.push(`${prefix}:authority-effect-forbidden`);
  if (!Array.isArray(binding.route_ids) || binding.route_ids.some((item) => typeof item !== "string")) reasons.push(`${prefix}:route-ids-invalid`);
  if (!Array.isArray(binding.objective_kinds) || binding.objective_kinds.some((item) => typeof item !== "string")) reasons.push(`${prefix}:objective-kinds-invalid`);
  if (!isObject(binding.providers)) reasons.push(`${prefix}:providers-invalid`);
  for (const kind of allowedProviderKinds) {
    const provider = binding.providers?.[kind];
    if (!isObject(provider) || typeof provider.provider_id !== "string" || typeof provider.path !== "string" || !/^[a-f0-9]{64}$/.test(provider.sha256 ?? "")) {
      reasons.push(`${prefix}:provider-${kind}-invalid`);
    }
  }
  const providerIds = allowedProviderKinds.map((kind) => binding.providers?.[kind]?.provider_id);
  if (providerIds.length !== new Set(providerIds).size) reasons.push(`${prefix}:provider-id-duplicate`);
  if (!isObject(binding.effort_profile) || !Array.isArray(binding.effort_profile.required_techniques) || !isObject(binding.technique_plan) || !Array.isArray(binding.technique_plan.selected_techniques)) reasons.push(`${prefix}:evaluation-plan-invalid`);
  if (!Array.isArray(binding.required_observation_fields) || binding.required_observation_fields.some((field) => typeof field !== "string" || !field) || new Set(binding.required_observation_fields).size !== binding.required_observation_fields.length) reasons.push(`${prefix}:required-observation-fields-invalid`);
  if (!isObject(binding.temporal_policy) || typeof binding.temporal_policy.require_current_envelope !== "boolean") reasons.push(`${prefix}:temporal-policy-invalid`);
  for (const lane of binding.challenge_policy?.required_lanes ?? []) {
    if (typeof lane?.lane_id !== "string" || !isTimestamp(lane?.deadline_at) || !Number.isInteger(lane?.attempt_limit) || lane.attempt_limit <= 0) reasons.push(`${prefix}:challenge-policy-invalid`);
  }
  return reasons;
}

export function loadSemanticInputProfile(profilePath, repositoryRoot) {
  const root = resolve(repositoryRoot);
  const absoluteProfile = resolve(profilePath);
  if (!withinRoot(root, absoluteProfile)) return fail("profile", ["semantic.profile-path-escape"]);
  let profile;
  try {
    profile = JSON.parse(readFileSync(absoluteProfile, "utf8"));
  } catch (error) {
    return fail("profile", [`semantic.profile-load-failed:${error.code ?? error.name}`]);
  }
  const reasons = [];
  if (!isObject(profile) || profile.schema_version !== SEMANTIC_INPUT_PROFILE_SCHEMA) reasons.push("semantic.profile-schema-invalid");
  if (typeof profile?.profile_id !== "string" || !profile.profile_id) reasons.push("semantic.profile-id-required");
  if (profile?.authority_effect !== "none") reasons.push("semantic.profile-authority-effect-forbidden");
  if (!Array.isArray(profile?.bindings)) reasons.push("semantic.profile-bindings-invalid");
  else profile.bindings.forEach((binding, index) => reasons.push(...validateBinding(binding, index)));
  const ids = (profile?.bindings ?? []).map((binding) => binding?.binding_id);
  if (ids.length !== new Set(ids).size) reasons.push("semantic.profile-binding-id-duplicate");
  if (typeof profile?.profile_digest !== "string") reasons.push("semantic.profile-digest-required");
  else {
    const {profile_digest: _digest, ...material} = profile;
    if (digestValue(material) !== profile.profile_digest) reasons.push("semantic.profile-digest-mismatch");
  }
  if (reasons.length) return fail("profile", reasons);
  const verified = deepFreeze({...profile, repository_root: root, profile_path: absoluteProfile});
  verifiedProfiles.add(verified);
  return success(verified);
}

function routeId(routeDecision) {
  return routeDecision?.selected?.route_id ?? routeDecision?.route_id ?? null;
}

export function selectSemanticDomain(requestContext, routeDecision, profile) {
  if (!verifiedProfiles.has(profile)) return fail("domain-selection", ["semantic.profile-not-verified"]);
  const route = routeId(routeDecision);
  if (typeof route !== "string" || !route) return fail("domain-selection", ["semantic.route-decision-invalid"]);
  const objective = requestContext?.objective_kind ?? null;
  const matches = profile.bindings.filter((binding) =>
    binding.route_ids.includes(route) &&
    (binding.objective_kinds.length === 0 || (typeof objective === "string" && binding.objective_kinds.includes(objective))),
  );
  if (matches.length === 0) {
    return deepFreeze({
      schema_version: SEMANTIC_LIFECYCLE_SCHEMA,
      ok: true,
      disposition: "not-applicable",
      route_id: route,
      binding: null,
      evaluator_calls: 0,
      authority_effect: "none",
    });
  }
  if (matches.length > 1) return fail("domain-selection", ["semantic.domain-binding-ambiguous"], [{binding_ids: matches.map((item) => item.binding_id).sort()}]);
  return deepFreeze({
    schema_version: SEMANTIC_LIFECYCLE_SCHEMA,
    ok: true,
    disposition: "selected",
    route_id: route,
    binding: matches[0],
    evaluator_calls: 0,
    authority_effect: "none",
  });
}

function loadProvider(root, ref, kind) {
  const path = resolve(root, ref.path);
  if (!withinRoot(root, path)) return fail("providers", [`semantic.provider-path-escape:${kind}`]);
  let bytes;
  try {
    bytes = readFileSync(path);
  } catch (error) {
    return fail("providers", [`semantic.provider-unavailable:${kind}:${error.code ?? error.name}`]);
  }
  const actual = sha256(bytes);
  if (actual !== ref.sha256) return fail("providers", [`semantic.provider-digest-drift:${kind}`], [{provider_id: ref.provider_id, expected: ref.sha256, actual}]);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    return fail("providers", [`semantic.provider-malformed:${kind}:${error.name}`]);
  }
  return {ok: true, value, snapshot: {provider_id: ref.provider_id, kind, path: ref.path, sha256: actual}};
}

function validateProviders(binding, providers, asOf) {
  const reasons = [];
  const authority = providers.authority;
  const catalog = providers.catalog;
  const validators = providers.validators;
  if (authority?.schema_version !== "are.authority-provider/v1" || !Array.isArray(authority.owners) || authority.owners.some((owner) => typeof owner !== "string") || !Array.isArray(authority.authority_edges) || typeof authority.status !== "string") reasons.push("semantic.authority-provider-malformed");
  if (catalog?.schema_version !== "are.rule-catalog-provider/v1" || !Array.isArray(catalog.rules) || catalog.rules.some((rule) => typeof rule?.rule_id !== "string") || !Array.isArray(catalog.conclusion_domain) || catalog.conclusion_domain.some((domain) => typeof domain !== "string") || !Array.isArray(catalog.precedence_edges)) reasons.push("semantic.catalog-provider-malformed");
  if (validators?.schema_version !== "are.observation-validator-provider/v1" || !Array.isArray(validators.validators) || validators.validators.some((validator) => typeof validator?.validator_id !== "string" || !Array.isArray(validator.fields) || !Array.isArray(validator.source_refs))) reasons.push("semantic.validator-provider-malformed");
  if (reasons.length) return reasons;
  if (authority.status !== "active") reasons.push("semantic.authority-inactive");
  if (!authority.owners.includes(binding.owner_ref) || catalog.issuer_ref !== binding.owner_ref) reasons.push("semantic.owner-mismatch");
  if (hasCycle(authority.authority_edges)) reasons.push("semantic.authority-cycle");
  if (hasCycle(catalog.precedence_edges)) reasons.push("semantic.catalog-precedence-cycle");
  if (catalog.evaluator_id !== binding.evaluator_id || catalog.status !== "active") reasons.push("semantic.catalog-inactive-or-unbound");
  if (catalog.revoked_at !== null) reasons.push("semantic.catalog-revoked");
  if (catalog.expires_at !== null && (!isTimestamp(catalog.expires_at) || Date.parse(asOf) >= Date.parse(catalog.expires_at))) reasons.push("semantic.catalog-expired");
  if (!catalog.conclusion_domain.includes(binding.conclusion_domain)) reasons.push("semantic.catalog-domain-mismatch");
  return reasons;
}

function baseRecord(input, recordType, payload) {
  return {
    record_type: recordType,
    schema_version: SCHEMA_VERSION,
    run_id: input.run_id,
    created_at: input.created_at,
    producer: "semantic-input-runtime@1",
    input_digests: [],
    ...payload,
  };
}

function observationEvidenceMap(input) {
  return new Map((input.observation_sources ?? []).map((item) => [item.source_ref, item]));
}

function materializeObservations(input, binding, validatorProvider) {
  const candidates = [...(input.observation_candidates ?? [])].sort((left, right) => `${left.field}:${left.source_ref ?? ""}`.localeCompare(`${right.field}:${right.source_ref ?? ""}`));
  const validators = new Map(validatorProvider.validators.map((item) => [item.validator_id, item]));
  const evidence = observationEvidenceMap(input);
  const observations = [];
  const candidateRecords = [];
  const seenRequired = new Set();
  const admittedFields = new Set();
  const candidateIds = new Set();
  const reasons = [];
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const candidateId = candidate?.candidate_id ?? `${input.run_id}:candidate:${String(index + 1).padStart(3, "0")}`;
    if (!isObject(candidate) || candidate.schema_version !== OBSERVATION_CANDIDATE_SCHEMA) reasons.push(`semantic.observation-candidate-schema-invalid:${candidateId}`);
    if (candidateIds.has(candidateId)) reasons.push(`semantic.observation-candidate-duplicate:${candidateId}`);
    candidateIds.add(candidateId);
    if (typeof candidate?.field !== "string" || !candidate.field || typeof candidate.issuer_ref !== "string" || typeof candidate.source_ref !== "string" || typeof candidate.source_digest !== "string" || typeof candidate.validator_ref !== "string" || !("value" in candidate)) {
      reasons.push(`semantic.observation-candidate-malformed:${candidateId}`);
    }
    if (!["admitted", "rejected", "unresolved"].includes(candidate?.proposed_posture)) reasons.push(`semantic.observation-candidate-posture-invalid:${candidateId}`);
  }
  if (reasons.length) return {observations, candidateRecords, reasons};
  candidateIds.clear();
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const candidateId = candidate.candidate_id ?? `${input.run_id}:candidate:${String(index + 1).padStart(3, "0")}`;
    const source = evidence.get(candidate.source_ref);
    const validator = validators.get(candidate.validator_ref);
    let sourceDigestValid = false;
    try {
      sourceDigestValid = Boolean(source && source.digest === candidate.source_digest && digestValue(source.value) === source.digest);
    } catch {
      sourceDigestValid = false;
    }
    const validatorAllows = validator && (validator.fields ?? []).includes(candidate.field) && (validator.source_refs ?? []).includes(candidate.source_ref);
    let posture = "unresolved";
    let rejectionReason = "observation evidence or validator binding unresolved";
    if (candidate.proposed_posture === "rejected") {
      posture = "rejected";
      rejectionReason = candidate.rejection_reason ?? "candidate rejected by producer";
    } else if (candidate.proposed_posture === "admitted" && sourceDigestValid && validatorAllows && candidate.issuer_ref === binding.owner_ref) {
      posture = "admitted";
      rejectionReason = null;
      seenRequired.add(candidate.field);
      if (admittedFields.has(candidate.field)) reasons.push(`semantic.observation-admitted-field-duplicate:${candidate.field}`);
      admittedFields.add(candidate.field);
    }
    const candidateMaterial = {
      schema_version: OBSERVATION_CANDIDATE_SCHEMA,
      candidate_id: candidateId,
      field: candidate.field,
      value: candidate.value,
      issuer_ref: candidate.issuer_ref,
      source_ref: candidate.source_ref,
      source_digest: candidate.source_digest,
      validator_ref: candidate.validator_ref,
      temporal_scope: candidate.temporal_scope ?? {observed_at: input.as_of},
      proposed_posture: candidate.proposed_posture,
      resolved_posture: posture,
      authority_effect: "none",
    };
    candidateRecords.push({...candidateMaterial, candidate_digest: digestValue(candidateMaterial)});
    observations.push(sealRecord(baseRecord(input, "Observation", {
      observation_id: candidateId,
      field: candidate.field,
      claim_type: "exact-provider-observation",
      value: candidate.value,
      issuer_ref: candidate.issuer_ref,
      source_ref: candidate.source_ref,
      transform_refs: [],
      validator_ref: candidate.validator_ref,
      temporal_scope: candidate.temporal_scope ?? {observed_at: input.as_of},
      posture,
      rejection_reason: rejectionReason,
    })));
  }
  for (const field of [...binding.required_observation_fields].sort()) {
    if (seenRequired.has(field) || observations.some((item) => item.field === field)) continue;
    observations.push(sealRecord(baseRecord(input, "Observation", {
      observation_id: `${input.run_id}:missing:${field}`,
      field,
      claim_type: "required-observation-gap",
      value: null,
      issuer_ref: binding.owner_ref,
      source_ref: "unresolved",
      transform_refs: [],
      validator_ref: "unresolved",
      temporal_scope: {observed_at: input.as_of},
      posture: "unresolved",
      rejection_reason: "required observation evidence missing",
    })));
  }
  observations.sort((left, right) => left.observation_id.localeCompare(right.observation_id));
  return {observations, candidateRecords, reasons};
}

function compareSourceSnapshots(previous, current, diagnostics) {
  const previousMap = new Map((previous?.selected_sources ?? []).map((item) => [item.provider_id, item.sha256]));
  const changed = current.filter((item) => previousMap.has(item.provider_id) && previousMap.get(item.provider_id) !== item.sha256)
    .map((item) => ({provider_id: item.provider_id, previous_digest: previousMap.get(item.provider_id), current_digest: item.sha256}));
  const selectedIds = new Set(current.map((item) => item.provider_id));
  const unrelated = (diagnostics ?? []).filter((item) => !selectedIds.has(item.provider_id));
  return {freshness_state: changed.length ? "successor-required" : "current", changed_selected_providers: changed, unrelated_source_drift: unrelated};
}

export function materializeSemanticRequest(input = {}) {
  const verifiedEnvelope = verifyFrozenContextEnvelope(input.context_envelope);
  if (!verifiedEnvelope.ok) return fail("context-envelope", verifiedEnvelope.reason_codes, verifiedEnvelope.residue);
  const binding = input.binding;
  const bindingReasons = validateBinding(binding, "selected");
  if (bindingReasons.length) return fail("materialization", bindingReasons);
  if (!isObject(input.request_context) || typeof input.request_context.request_id !== "string") return fail("materialization", ["semantic.request-context-invalid"]);
  if (!isTimestamp(input.as_of) || !isTimestamp(input.created_at)) return fail("materialization", ["semantic.timestamps-invalid"]);
  if (input.request_context.owner_ref !== binding.owner_ref) return fail("entry-gate", ["semantic.request-owner-missing-or-mismatch"]);
  const root = resolve(input.repository_root ?? ".");
  const providerResults = {};
  for (const kind of allowedProviderKinds) {
    const loaded = loadProvider(root, binding.providers[kind], kind);
    if (!loaded.ok) return loaded;
    providerResults[kind] = loaded;
  }
  const providerValues = Object.fromEntries(allowedProviderKinds.map((kind) => [kind, providerResults[kind].value]));
  const providerReasons = validateProviders(binding, providerValues, input.as_of);
  if (providerReasons.length) return fail("entry-gate", providerReasons);
  const sourceSnapshot = allowedProviderKinds.map((kind) => providerResults[kind].snapshot).sort((left, right) => left.provider_id.localeCompare(right.provider_id));
  const freshness = compareSourceSnapshots(input.previous_materialization, sourceSnapshot, input.current_sources);
  const runId = input.run_id ?? `semantic-run:${digestValue({request_id: input.request_context.request_id, context_epoch_id: verifiedEnvelope.value.context_epoch_id, binding_id: binding.binding_id, as_of: input.as_of})}`;
  const common = {...input, run_id: runId};
  const frame = sealRecord(baseRecord(common, "ProblemFrame", {
    frame_id: `frame:${digestValue({request_id: input.request_context.request_id, binding_id: binding.binding_id, context_epoch_id: verifiedEnvelope.value.context_epoch_id})}`,
    intent_id: input.request_context.request_id,
    conclusion_domain: binding.conclusion_domain,
    question: binding.question,
    request_context_digest: digestValue(input.request_context),
    route_decision_digest: digestValue(input.route_decision),
    evidence_handles: [...(input.request_context.evidence_refs ?? [])].sort(),
    constraints: [...(input.request_context.constraints ?? [])],
    protected_effects: [...(input.request_context.requested_effects ?? [])],
  }));
  const authority = providerValues.authority;
  const catalogSource = providerValues.catalog;
  const authoritySnapshot = sealRecord(baseRecord(common, "AuthoritySnapshot", {
    snapshot_id: authority.snapshot_id,
    status: authority.status,
    owners: [...authority.owners].sort(),
    authority_edges: [...authority.authority_edges].sort((a, b) => `${a.from}:${a.to}`.localeCompare(`${b.from}:${b.to}`)),
    provider_digest: binding.providers.authority.sha256,
  }));
  const catalog = sealRecord(baseRecord(common, "RuleCatalogManifest", {
    catalog_id: catalogSource.catalog_id,
    evaluator_id: catalogSource.evaluator_id,
    issuer_ref: catalogSource.issuer_ref,
    status: catalogSource.status,
    expires_at: catalogSource.expires_at,
    revoked_at: catalogSource.revoked_at,
    conclusion_domain: [...catalogSource.conclusion_domain].sort(),
    rules: [...catalogSource.rules].sort((a, b) => a.rule_id.localeCompare(b.rule_id)),
    precedence_edges: [...catalogSource.precedence_edges].sort((a, b) => `${a.from}:${a.to}`.localeCompare(`${b.from}:${b.to}`)),
    provider_digest: binding.providers.catalog.sha256,
  }));
  const {observations, candidateRecords, reasons: observationReasons} = materializeObservations(common, binding, providerValues.validators);
  if (observationReasons.length) return fail("observations", observationReasons);
  const requiredLanes = [...(binding.challenge_policy?.required_lanes ?? [])].sort((a, b) => a.lane_id.localeCompare(b.lane_id));
  const suppliedLanes = new Map((input.challenge_state?.required_lanes ?? []).map((lane) => [lane.lane_id, lane]));
  const challengeClosure = sealRecord(baseRecord(common, "ChallengeClosure", {
    closure_id: `challenge:${runId}`,
    required_lanes: requiredLanes.map((required) => ({...required, ...(suppliedLanes.get(required.lane_id) ?? {status: "open", attempt_count: 0})})),
    material_disputes: [...(input.challenge_state?.material_disputes ?? [])],
    admitted_defeaters: [...(input.challenge_state?.admitted_defeaters ?? [])],
  }));
  const techniquePlan = sealRecord(baseRecord(common, "TechniquePlan", {
    plan_id: `techniques:${binding.binding_id}`,
    ...structuredClone(binding.technique_plan),
  }));
  const effortProfile = sealRecord(baseRecord(common, "EffortProfile", {
    profile_id: `effort:${binding.binding_id}`,
    ...structuredClone(binding.effort_profile),
  }));
  if (input.runtime_journal !== undefined && input.runtime_journal_cut !== undefined) return fail("runtime-journal", ["semantic.runtime-journal-source-ambiguous"]);
  let journalId;
  let journalEvents;
  let sourceCutDigest = null;
  let sourceCutFirstSequence = null;
  let sourceCutLastSequence = null;
  if (input.runtime_journal_cut !== undefined) {
    const verifiedJournalCut = verifyRuntimeJournalCut(input.runtime_journal_cut);
    if (!verifiedJournalCut.ok) return fail("runtime-journal", verifiedJournalCut.reason_codes ?? ["semantic.runtime-journal-cut-invalid"]);
    journalId = input.runtime_journal_cut.journal_id;
    journalEvents = input.runtime_journal_cut.events.map((event) => ({
      sequence: event.sequence,
      event_kind: event.event_kind,
      thread_id: event.thread_id,
      turn_id: event.turn_id,
      event_digest: event.event_digest,
      content_digest: event.content_digest,
    }));
    sourceCutDigest = input.runtime_journal_cut.cut_digest;
    sourceCutFirstSequence = input.runtime_journal_cut.first_sequence;
    sourceCutLastSequence = input.runtime_journal_cut.last_sequence;
  } else {
    journalId = input.runtime_journal?.journal_id ?? `journal:${runId}`;
    journalEvents = [...(input.runtime_journal?.events ?? [])];
  }
  const runtimeJournalCut = sealRecord(baseRecord(common, "RuntimeJournalCut", {
    journal_id: journalId,
    state: "semantic-inputs-frozen",
    events: journalEvents,
    ...(sourceCutDigest ? {
      source_cut_digest: sourceCutDigest,
      source_cut_first_sequence: sourceCutFirstSequence,
      source_cut_last_sequence: sourceCutLastSequence,
    } : {}),
  }));
  const entryGate = sealRecord(baseRecord(common, "GateDecision", {
    gate_decision_id: `semantic-entry:${runId}`,
    gate_kind: "semantic-structural-eligibility",
    verdict: "pass",
    owner_ref: binding.owner_ref,
    authority_snapshot_digest: authoritySnapshot.digest,
    subject_digest: frame.digest,
    evidence_refs: sourceSnapshot.map((item) => `${item.provider_id}@sha256:${item.sha256}`),
    residue: [],
    effect_of_decision: "structural-eligibility-only",
    decided_at: input.as_of,
    authority_effect: "none",
  }));
  const semanticRequest = deepFreeze({
    schema_version: SCHEMA_VERSION,
    run_id: runId,
    created_at: input.created_at,
    as_of: input.as_of,
    mode: input.mode ?? "fresh",
    frame,
    authority_snapshot: authoritySnapshot,
    catalog,
    observations,
    challenge_closure: challengeClosure,
    technique_plan: techniquePlan,
    effort_profile: effortProfile,
    entry_gate: entryGate,
    runtime_journal_cut: runtimeJournalCut,
  });
  const material = {
    schema_version: SEMANTIC_MATERIALIZATION_SCHEMA,
    materialization_id: `semantic-materialization:${digestValue({request: semanticRequest, context_envelope_digest: verifiedEnvelope.digest, selected_sources: sourceSnapshot})}`,
    binding_id: binding.binding_id,
    binding_digest: digestValue(binding),
    evaluator_id: binding.evaluator_id,
    context_epoch_id: verifiedEnvelope.value.context_epoch_id,
    context_envelope_digest: verifiedEnvelope.digest,
    semantic_request_digest: digestValue(semanticRequest),
    selected_sources: sourceSnapshot,
    observation_candidates: candidateRecords,
    gaps: observations.filter((item) => item.posture === "unresolved").map((item) => ({observation_id: item.observation_id, field: item.field, reason: item.rejection_reason})),
    residue: [],
    freshness,
    claim_ceiling: binding.claim_ceiling,
    authority_effect: "none",
  };
  const materialization = deepFreeze({...material, canonical_digest: digestValue(material)});
  return deepFreeze({
    schema_version: SEMANTIC_MATERIALIZATION_SCHEMA,
    ok: true,
    disposition: "materialized",
    semantic_request: semanticRequest,
    materialization,
    digest: materialization.canonical_digest,
    evaluator_calls: 0,
    authority_effect: "none",
  });
}

export function composeSemanticLifecycle(input = {}) {
  const verifiedEnvelope = verifyFrozenContextEnvelope(input.context_envelope);
  if (!verifiedEnvelope.ok) return fail("context-envelope", verifiedEnvelope.reason_codes, verifiedEnvelope.residue);
  const selection = selectSemanticDomain(input.request_context, input.route_decision, input.profile);
  if (!selection.ok) return selection;
  if (selection.disposition === "not-applicable") return selection;
  const materialized = materializeSemanticRequest({...input, binding: selection.binding, repository_root: input.profile.repository_root});
  if (!materialized.ok) return materialized;
  const telemetry = input.telemetry ?? {};
  const evaluation = evaluateContextBoundSemanticJudgment({
    context_envelope: input.context_envelope,
    semantic_request: materialized.semantic_request,
  }, telemetry);
  if (!evaluation.ok) return fail("evaluation", evaluation.reason_codes ?? ["semantic.evaluation-failed"], evaluation.residue ?? [], {evaluator_calls: telemetry.evaluator_calls ?? 0});
  const value = {
    schema_version: SEMANTIC_LIFECYCLE_SCHEMA,
    disposition: "evaluated",
    binding_id: selection.binding.binding_id,
    semantic_input_materialization: materialized.materialization,
    semantic_outcome: evaluation.semantic,
    reasoning_receipt: evaluation.reasoning_receipt,
    reasoning_receipt_exact_bytes_digest: evaluation.reasoning_receipt_exact_bytes_digest,
    runtime_journal_source_cut_digest: materialized.semantic_request.runtime_journal_cut.source_cut_digest ?? null,
    evaluator_calls: telemetry.evaluator_calls ?? evaluation.evaluator_calls,
    claim_ceiling: selection.binding.claim_ceiling,
    authority_effect: "none",
  };
  return deepFreeze({schema_version: SEMANTIC_LIFECYCLE_SCHEMA, ok: true, ...value, digest: digestValue(value)});
}
