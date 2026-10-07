import {materializeObjectiveState, materializeRequirementSnapshot, resolveObjectiveTransition, verifyObjectiveState, digestIntentMaterial} from "../../request-intent-runtime/index.mjs";
import {createModulePort} from "../../module-port/index.mjs";
import {createSemanticTextFacade, semanticTextOutputValidators} from "../../module-port/semantic-text.mjs";
import {canonicalJson, digestValue, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {selectObjectiveMeanings} from "./objective-meanings.mjs";
import {prepareObjectiveRequirements, verifyRequirementContinuityReplay,
  materializePlanRequirementMigration, normalizePlanMigrationAccounting,
  verifyPlanRequirementMigrationReplay} from "./objective-requirements.mjs";
import {appendReasoningPlanContext, getLatestReasoningPlanContext,
  materializeReasoningPlanContext, verifyReasoningPlanContext} from "../../reasoning-state-runtime/index.mjs";

const EVENT = "objective-transition-resolved";
const MIGRATION = "plan-requirements-migrated";
const closed = (value, keys) => isRecord(value) && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const migrationKey = (key, planDigest) => digestValue([key, planDigest]);
const migrationRequestDigest = (input, planDigest) => digestValue({consumer_ref: input.consumer_ref,
  scope_ref: input.scope_ref, thread_ref: input.thread_ref, previous_continuity_digest: input.previous_continuity_digest,
  plan_context_digest: planDigest, source_ref: input.source_ref,
  accounting: normalizePlanMigrationAccounting(input.accounting).rows});
function migrationCheckpoint(ledger, event, planEvent) {
  const epochs = ledger.epochs().filter(epoch => epoch.consumer_ref === event.content.consumer_ref
    && epoch.request_ref === `host-plan-migration:${event.content.migration.plan_context_digest}`
    && epoch.event_digests.length === 2 && epoch.event_digests.includes(event.event_digest)
    && epoch.event_digests.includes(planEvent.event_digest));
  return ledger.checkpoints().find(checkpoint => checkpoint.checkpoint_kind === 'manual'
    && checkpoint.subject_digest === event.content.migration.migration_digest
    && checkpoint.head_event_digest === event.event_digest
    && epochs.some(epoch => epoch.epoch_digest === checkpoint.epoch_digest)) ?? null;
}
const keyFor = (consumer, scope) => canonicalJson([consumer, scope]);
const requestKey = (consumer, scope, request) => digestValue([consumer, scope, request]);

// Normalized references must come from the owning Host, not raw browser metadata.
function normalizeOwnedObjectiveRequest(input) {
  if (!isRecord(input) || Object.keys(input).sort().join(",") !== "consumer_ref,request,request_ref,scope_ref,thread_ref"
    || !["consumer_ref", "scope_ref", "thread_ref", "request_ref"].every(key => nonEmptyString(input[key]))
    || typeof input.request !== "string" || Buffer.byteLength(input.request) > 256 * 1024) {
    return {ok: false, reason_codes: ["objective.owned-request-invalid"]};
  }
  return {ok: true, value: input};
}

// Interpretation history only: an objective is not a completion or permission.
export function createOwnedObjectiveLifecycle({ledger, configuration = {}, provider, requirement_seed_provider, module_port, normalize_request = normalizeOwnedObjectiveRequest}) {
  if (typeof normalize_request !== "function") throw new TypeError("objective.normalizer-invalid");
  const states = new Map(), requests = new Map(), requirements = new Map();
  const threads = new Map(), migrations = new Map(), planHeads = new Map(), plans = new Map();
  const preparationsInFlight = new Set();
  const semanticText = createSemanticTextFacade(module_port ?? createModulePort({output_validators: semanticTextOutputValidators}), {consumer_id: "request-intent-runtime"});
  let fault = false;
  for (const event of ledger.snapshot()) {
    if (event.event_kind === 'plan-context-recorded') {
      const plan = event.content;
      if (!verifyReasoningPlanContext(plan).ok
        || plan.previous_plan_context_digest !== (planHeads.get(plan.thread_ref)?.content.plan_context_digest ?? null)) {
        throw new TypeError('Recovered objective plan chain diverges');
      }
      planHeads.set(plan.thread_ref, event);
      plans.set(plan.plan_context_digest, event);
      continue;
    }
    if (event.event_kind === MIGRATION) {
      const content = event.content;
      if (!closed(content, ['consumer_ref', 'scope_ref', 'thread_ref', 'plan_event_digest', 'request_digest', 'migration'])) {
        throw new TypeError('Invalid recovered plan requirement migration');
      }
      const key = keyFor(content.consumer_ref, content.scope_ref), planEvent = planHeads.get(content.thread_ref);
      const migration = content.migration, priorPlan = plans.get(planEvent?.content.previous_plan_context_digest);
      const priorContinuity = requirements.get(key), state = states.get(key);
      if (threads.get(key) !== content.thread_ref || !state || !priorContinuity || !priorPlan
        || planEvent.event_digest !== content.plan_event_digest
        || !verifyPlanRequirementMigrationReplay(migration, {previous: priorContinuity, state,
          previous_plan_context: priorPlan.content, plan_context: planEvent.content,
          accounting: migration?.accounting, source_ref: migration?.source_ref})) {
        throw new TypeError('Invalid recovered plan requirement migration');
      }
      const requestDigest = migrationRequestDigest({...content,
        previous_continuity_digest: migration.previous_continuity_digest,
        accounting: migration.accounting, source_ref: migration.source_ref}, migration.plan_context_digest);
      const checkpoint = migrationCheckpoint(ledger, event, planEvent);
      const id = migrationKey(key, migration.plan_context_digest);
      if (content.request_digest !== requestDigest || migrations.has(id) || !checkpoint) {
        throw new TypeError('Recovered plan requirement migration lacks exact checkpoint or identity');
      }
      requirements.set(key, migration.next_continuity);
      migrations.set(id, {request_digest: requestDigest, migration, event_digest: event.event_digest,
        checkpoint_digest: checkpoint.checkpoint_digest});
      continue;
    }
    if (event.event_kind !== EVENT) continue;
    const resolution = event.content?.resolution;
    const next = resolution?.next_state;
    const {resolution_digest, ...material} = resolution ?? {};
    const meaningSelection = event.content?.meaning_selection;
    if (meaningSelection) {
      const {selection_digest, ...selectionMaterial} = meaningSelection;
      if (digestValue(selectionMaterial) !== selection_digest || (event.content.composed_context ? digestValue(event.content.composed_context) : meaningSelection.selected_context_digest) !== resolution?.selected_context_digest
        || meaningSelection.authority_effect !== "none") throw new TypeError("Invalid recovered objective meaning selection");
    }
    if (!verifyObjectiveState(next) || resolution?.disposition !== "resolved" || digestIntentMaterial(material) !== resolution_digest
      || next.last_request?.request_ref !== resolution.request_ref || next.last_request?.request_digest !== resolution.request_digest
      || next.predecessor_state_digest !== resolution.previous_state_digest || resolution.authority_effect !== "none") throw new TypeError("Invalid recovered objective transition");
    const key = keyFor(next.consumer_ref, next.scope_ref);
    if (!nonEmptyString(event.content.thread_id) || (threads.has(key) && threads.get(key) !== event.content.thread_id)) {
      throw new TypeError('Recovered objective thread binding diverges');
    }
    threads.set(key, event.content.thread_id);
    const previous = states.get(key) ?? materializeObjectiveState({consumer_ref: next.consumer_ref, scope_ref: next.scope_ref});
    if (previous.state_digest !== resolution.previous_state_digest) throw new TypeError("Recovered objective transition chain diverges");
    const continuity = event.content?.requirement_continuity;
    if (continuity !== undefined) {
      if (!verifyRequirementContinuityReplay(continuity, requirements.get(key) ?? null, resolution)) throw new TypeError("Invalid recovered requirement continuity");
      requirements.set(key, continuity);
    } else if (requirements.has(key)) throw new TypeError("Recovered requirement continuity is missing");
    states.set(key, next);
    const replayKey = requestKey(next.consumer_ref, next.scope_ref, resolution.request_ref);
    if (requests.has(replayKey)) throw new TypeError("Duplicate recovered objective request");
    requests.set(replayKey, resolution);
  }
  return {
    migratePlanRequirements(input) {
      const fail = reason => ({ok: false, reason_codes: [reason], authority_effect: 'none'});
      if (configuration.enabled !== true || configuration.requirement_tracking !== true) return fail('requirements.migration-tracking-required');
      if (fault) return fail('objective.ledger-write-failed-restart-required');
      if (!closed(input, ['consumer_ref', 'scope_ref', 'thread_ref', 'previous_continuity_digest',
        'plan_input', 'source_digests', 'accounting', 'source_ref'])
        || !['consumer_ref', 'scope_ref', 'thread_ref', 'source_ref'].every(key =>
          typeof input[key] === 'string' && input[key].trim() === input[key] && input[key].length > 0 && Buffer.byteLength(input[key]) <= 512)
        || !hex(input.previous_continuity_digest)) return fail('requirements.migration-request-invalid');
      const key = keyFor(input.consumer_ref, input.scope_ref);
      if (preparationsInFlight.has(key)) return fail('objective.scope-preparation-inflight');
      if (threads.get(key) !== input.thread_ref) return fail('requirements.migration-thread-binding-invalid');
      preparationsInFlight.add(key);
      let writing = false;
      try {
        if (Buffer.byteLength(canonicalJson(input)) > 32768) return fail('requirements.migration-request-over-budget');
        const built = materializeReasoningPlanContext(input.plan_input,
          {expected_thread_ref: input.thread_ref, source_digests: input.source_digests});
        if (!built.ok) return built;
        const requestDigest = migrationRequestDigest(input, built.value.plan_context_digest);
        const id = migrationKey(key, built.value.plan_context_digest), recorded = migrations.get(id);
        // Retrying a completed Host change must not rewind later real prompts.
        if (recorded) return recorded.request_digest === requestDigest
          ? freezeResult({ok: true, disposition: 'duplicate', ...recorded, authority_effect: 'none'})
          : fail('requirements.migration-identity-conflict');
        const previous = requirements.get(key), state = states.get(key);
        if (!previous || previous.continuity_digest !== input.previous_continuity_digest) return fail('requirements.migration-stale-continuity');
        const priorPlan = getLatestReasoningPlanContext(ledger, input.thread_ref);
        const migration = materializePlanRequirementMigration({previous, state,
          previous_plan_context: priorPlan?.content, plan_context: built.value,
          accounting: input.accounting, source_ref: input.source_ref});
        // No effects until all accounting and source inputs have been checked.
        writing = true;
        const plan = appendReasoningPlanContext(ledger, input.plan_input,
          {expected_thread_ref: input.thread_ref, source_digests: input.source_digests});
        if (!plan.ok) { fault = true; return plan; }
        const appended = ledger.append({event_kind: MIGRATION, idempotency_key: `plan-requirements:${id}`,
          content: {consumer_ref: input.consumer_ref, scope_ref: input.scope_ref, thread_ref: input.thread_ref,
            plan_event_digest: plan.event.event_digest, request_digest: requestDigest, migration}, provenance_refs: [input.source_ref]});
        if (!appended.ok) { fault = true; return appended; }
        const sealed = ledger.seal({event_digests: [plan.event.event_digest, appended.event.event_digest],
          consumer_ref: input.consumer_ref, request_ref: `host-plan-migration:${built.value.plan_context_digest}`});
        if (!sealed.ok) { fault = true; return sealed; }
        const checkpoint = ledger.checkpoint({checkpoint_kind: 'manual', epoch: sealed.value, subject_digest: migration.migration_digest});
        if (!checkpoint.ok) { fault = true; return checkpoint; }
        requirements.set(key, migration.next_continuity);
        const retained = {request_digest: requestDigest, migration, event_digest: appended.event.event_digest,
          checkpoint_digest: checkpoint.digest};
        migrations.set(id, retained);
        return freezeResult({ok: true, disposition: 'migrated', ...retained, authority_effect: 'none'});
      } catch (error) {
        if (writing) fault = true;
        return fail(writing ? 'requirements.migration-write-failed-restart-required'
          : error.message.startsWith('requirements.') ? error.message : 'requirements.migration-request-invalid');
      } finally { preparationsInFlight.delete(key); }
    },
    async prepare(input_request, loadSources = null, selected_context = [], trusted_requirement_seed = null) {
      if (configuration.enabled !== true) return requirements.size > 0
        ? {ok: false, reason_codes: ["requirements.tracking-disabled-after-history"]}
        : {ok: true, disposition: "disabled", resolution: null};
      if (fault) return {ok: false, reason_codes: ["objective.ledger-write-failed-restart-required"]};
      const normalized = normalize_request(input_request);
      if (normalized?.ok !== true) return normalized;
      const {consumer_ref: consumer, scope_ref: scope, thread_ref: threadId, request_ref: requestRef, request} = normalized.value;
      const replayKey = requestKey(consumer, scope, requestRef);
      const priorRequest = requests.get(replayKey);
      if (priorRequest) return {ok: false, disposition: "replayed", reason_codes: [priorRequest.request_digest === digestIntentMaterial(request)
        ? "objective.request-already-recorded-dispatch-not-retried" : "objective.request-identity-conflict"], resolution: priorRequest};
      const key = keyFor(consumer, scope), state = states.get(key);
      if (threads.has(key) && threads.get(key) !== threadId) return {ok: false, reason_codes: ['objective.scope-thread-binding-invalid']};
      if (requirements.has(key) && configuration.requirement_tracking !== true) return {ok: false, reason_codes: ["requirements.tracking-disabled-after-history"]};
      if (preparationsInFlight.has(key)) return {ok: false, reason_codes: ["objective.scope-preparation-inflight"]};
      preparationsInFlight.add(key);
      try {
        const input = {request, request_ref: requestRef, consumer_ref: consumer, scope_ref: scope,
          ...(state ? {state, expected_state_digest: state.state_digest} : {}), selected_context, provider_timeout_ms: configuration.provider_timeout_ms ?? 1000};
        let selection = null;
        let resolution;
        async function resolveWithMeanings(selectedInput) {
          if (configuration.meaning_selection && typeof provider === "function") {
            const local = await resolveObjectiveTransition(selectedInput, null, semanticText);
            if (!selectedInput.requirement_snapshot && !local.reason_codes.includes("objective.transition-evidence-required")) return local;
            let sources;
            try { sources = typeof loadSources === "function" ? await loadSources() : null; }
            catch { return {disposition: "block", reason_codes: ["objective.meaning-source-load-failed"]}; }
            selection = selectObjectiveMeanings(sources, configuration.meaning_selection);
            if (!selection.ok) return {...selection, disposition: "block"};
            return resolveObjectiveTransition({...selectedInput, selected_context: [...selected_context, ...selection.selected_context]}, provider, semanticText);
          }
          return resolveObjectiveTransition(selectedInput, provider, semanticText);
        }
        let continuity = null;
        if (configuration.requirement_tracking === true) {
          const seedProvider = trusted_requirement_seed === null ? requirement_seed_provider : seedInput =>
            materializeRequirementSnapshot({consumer_ref: seedInput.state.consumer_ref,
              scope_ref: seedInput.state.scope_ref,
              objective_id: seedInput.state.active_objective.objective_id,
              objective_state_digest: seedInput.state.state_digest,
              requirements: trusted_requirement_seed.requirements,
              source_refs: [seedInput.request_ref, trusted_requirement_seed.source_ref]});
          const prepared = await prepareObjectiveRequirements(input, {previous: requirements.get(key) ?? null,
            resolve: resolveWithMeanings,
            resolveLocal: selectedInput => resolveObjectiveTransition(selectedInput, null, semanticText),
            seedProvider});
          if (!prepared.ok) return prepared;
          resolution = prepared.resolution;
          continuity = prepared.continuity;
        } else resolution = await resolveWithMeanings(input);
        if (resolution.disposition !== "resolved") return {ok: false, disposition: resolution.disposition, reason_codes: resolution.reason_codes, resolution};
        if (fault) return {ok: false, reason_codes: ["objective.ledger-write-failed-restart-required"]};
        const appended = ledger.append({event_kind: EVENT, idempotency_key: `objective:${replayKey}`,
          content: {consumer_ref: consumer, thread_id: threadId, resolution,
            ...(continuity ? {requirement_continuity: continuity} : {}), ...(selection ? {meaning_selection: selection.receipt, ...(selected_context.length ? {composed_context: [...selected_context, ...selection.selected_context]} : {})} : {})}, provenance_refs: [requestRef]});
        if (!appended.ok) { fault = true; return appended; }
        const sealed = ledger.seal({event_digests: [appended.event.event_digest], consumer_ref: consumer, request_ref: requestRef});
        if (!sealed.ok) { fault = true; return sealed; }
        const checkpoint = ledger.checkpoint({checkpoint_kind: "manual", epoch: sealed.value, subject_digest: resolution.resolution_digest});
        if (!checkpoint.ok) { fault = true; return checkpoint; }
        states.set(key, resolution.next_state);
        threads.set(key, threadId);
        if (continuity) requirements.set(key, continuity);
        requests.set(replayKey, resolution);
        return {ok: true, disposition: "resolved", resolution, ...(continuity ? {requirement_continuity: continuity} : {}), event_digest: appended.event.event_digest, checkpoint_digest: checkpoint.digest};
      } finally { preparationsInFlight.delete(key); }
    },
    inspect() {
      return [...states.values()].map(state => ({consumer_ref: state.consumer_ref, scope_ref: state.scope_ref, state_digest: state.state_digest,
        active_objective_id: state.active_objective?.objective_id, suspended_count: state.suspended_objectives.length,
        ...(requirements.has(keyFor(state.consumer_ref, state.scope_ref)) ? {requirement_continuity_digest: requirements.get(keyFor(state.consumer_ref, state.scope_ref)).continuity_digest} : {})}));
    },
  };
}
