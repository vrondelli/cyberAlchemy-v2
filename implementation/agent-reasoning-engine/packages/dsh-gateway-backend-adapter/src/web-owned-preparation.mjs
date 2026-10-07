import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {digestValue, freezeResult} from "../../codex-app-server-wrapper/src/canonical.mjs";
import {loadVerifiedRepositoryRuntimeBundle}
  from "../../codex-app-server-wrapper/src/repository-runtime-bundle.mjs";
import {evaluateOwnedRequestPreflight} from "../../codex-app-server-wrapper/src/preflight.mjs";
import {createOwnedObjectiveLifecycle}
  from "../../codex-app-server-wrapper/src/objective-session-lifecycle.mjs";
import {createNativeSemanticModulePort} from "../../module-port/native-semantic-adapter.mjs";
import {createDshOwnedObjectiveNormalizer, createDshOwnedBindingReader} from "./web-objective-binding.mjs";
import {loadDshHostPlanSelection, loadDshPlanSourceDigests} from "./web-host-plan-selection.mjs";
import {compactDshPlannedModelContext} from './web-model-context-batch.mjs';
import {projectDshPlanProgress, emptyDshPlanHeadSummary} from '../../codex-app-server-wrapper/src/dsh-objective-checkpoint-observation.mjs';
import {appendReasoningPlanContext, getLatestReasoningPlanContext}
  from "../../reasoning-state-runtime/index.mjs";

const adapter = "deepseek-harness-web/are-v1";
const runtimeBundle = fileURLToPath(new URL(
  "../../codex-app-server-wrapper/profiles/repository-runtime-v1.json", import.meta.url));
const wireDigest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** Own this factory and ledger inside the existing private ARE gateway process.
 * Explicit startup seeds belong to the Host, never a browser request field.
 */
export function createDshOwnedPreparationRuntime({session_store, ledger,
  module_port = createNativeSemanticModulePort(), requirement_seed = null, plan_selection = null,
  load_sources = () => loadVerifiedRepositoryRuntimeBundle(runtimeBundle)}) {
  if (!ledger || ledger.inspect().durability !== "append-only-file-fsync"
    || typeof load_sources !== "function") throw new TypeError("dsh-web.objective-durable-ledger-required");
  if (requirement_seed !== null && (!Array.isArray(requirement_seed.requirements)
    || Object.keys(requirement_seed).sort().join(",") !== "requirements,source_ref"
    || typeof requirement_seed.source_ref !== "string" || !requirement_seed.source_ref.trim()
    || requirement_seed.requirements.length > 64
    || requirement_seed.requirements.some(value => typeof value !== "string" || !value.trim()
      || value !== value.trim() || Buffer.byteLength(value) > 2048)
    || new Set(requirement_seed.requirements).size !== requirement_seed.requirements.length
    || Buffer.byteLength(JSON.stringify(requirement_seed)) > 16384)) {
    throw new TypeError("dsh-web.objective-host-seed-invalid");
  }
  if (plan_selection !== null && requirement_seed !== null) {
    throw new TypeError("dsh-web.objective-host-seed-conflict");
  }
  if (plan_selection !== null && (typeof plan_selection !== "object" || Array.isArray(plan_selection)
    || Object.keys(plan_selection).sort().join(",") !== "selection_digest,selection_path,workspace"
    || !/^[0-9a-f]{64}$/u.test(plan_selection.selection_digest ?? ""))) {
    throw new TypeError("dsh-web.objective-host-plan-descriptor-invalid");
  }
  const selectedPlan = plan_selection === null ? null : loadDshHostPlanSelection(plan_selection);
  if (selectedPlan === null && ledger.snapshot().some(event => event.event_kind === "plan-context-recorded")) {
    throw new TypeError("dsh-web.objective-retained-plan-selection-required");
  }
  const seed = selectedPlan?.requirement_seed
    ?? (requirement_seed === null ? null : freezeResult(structuredClone(requirement_seed)));
  const normalize = createDshOwnedObjectiveNormalizer({session_store, backend_adapter_id: adapter,
    expected_workspace_ref: selectedPlan === null ? null : digestValue({
      workspace: selectedPlan.descriptor.workspace, preset_id: "are-read-only"})});
  const readBinding = createDshOwnedBindingReader({session_store, backend_adapter_id: adapter,
    expected_workspace_ref: selectedPlan === null ? null : digestValue({
      workspace: selectedPlan.descriptor.workspace, preset_id: 'are-read-only'})});
  const lifecycle = createOwnedObjectiveLifecycle({ledger, module_port,
    configuration: {enabled: true, requirement_tracking: seed !== null}});
  let faulted = false;
  return Object.freeze({
    readPlan(input) {
      if (faulted) throw new Error('dsh-web.objective-ledger-faulted');
      if (!input || Object.keys(input).sort().join(',') !== 'owned_binding,session_id'
        || !input.owned_binding || Object.keys(input.owned_binding).sort().join(',') !== 'binding_id,consumer_id,generation,writer_ref') {
        throw new Error('dsh-web.objective-owned-input-required');
      }
      const joined = readBinding({...input.owned_binding, session_id: input.session_id});
      const head = getLatestReasoningPlanContext(ledger, joined.identity.thread_ref);
      if (!head) return emptyDshPlanHeadSummary('not-retained');
      // Never substitute an earlier checkpoint when the latest event is unsealed.
      const checkpoint = ledger.checkpoints().findLast(row => {
        const epoch = ledger.getEpoch(row.epoch_digest);
        return epoch?.consumer_ref === joined.identity.consumer_ref
          && epoch.event_digests.includes(head.event_digest);
      });
      if (!checkpoint) throw new Error('dsh-web.objective-plan-head-uncheckpointed');
      const plan_progress = projectDshPlanProgress(head.content);
      const {thread_ref: _thread, previous_plan_context_digest: _previous, authority_effect: _authority,
        identity_scope: _identity, plan_context_digest: _digest, schema_version: _schema, ...template} = head.content;
      let sources = 'verified-at-read';
      let current = selectedPlan;
      try {
        current = loadDshHostPlanSelection(selectedPlan.descriptor);
        if (digestValue(head.content.source_refs) !== digestValue(current.template.source_refs)) {
          loadDshPlanSourceDigests(selectedPlan.descriptor.workspace, head.content.source_refs);
        }
      }
      catch { sources = 'unverified-at-read'; }
      return freezeResult({schema_version: 'are.dsh-plan-head-summary/v1', status: 'checkpoint-retained',
        checkpoint_digest: checkpoint.checkpoint_digest, plan_context_digest: head.content.plan_context_digest,
        plan_progress, sources, selection_relation: digestValue(template) === current.template_digest
          ? 'matches-startup' : 'different-from-startup'});
    },
    async prepare(input) {
      if (faulted) throw new Error("dsh-web.objective-ledger-faulted");
      if (!input || Object.keys(input).sort().join(",") !== "content,owned_binding,request_id,session_id"
        || !input.owned_binding
        || Object.keys(input.owned_binding).sort().join(",") !== "binding_id,consumer_id,generation,writer_ref") {
        throw new Error("dsh-web.objective-owned-input-required");
      }
      const joined = normalize({...input.owned_binding, session_id: input.session_id,
        request_id: input.request_id, content: input.content});
      const sources = load_sources();
      if (!sources?.ok) throw new Error("dsh-web.objective-sources-unavailable");
      let planContext = null;
      let planEvent = null;
      if (selectedPlan !== null) {
        // Recheck the exact selection and sources before each interpretation;
        // startup validation does not make changed bytes trustworthy forever.
        const verifiedPlan = loadDshHostPlanSelection(selectedPlan.descriptor);
        const thread = joined.objective_request.thread_ref;
        const previous = getLatestReasoningPlanContext(ledger, thread);
        const predecessor = verifiedPlan.transition?.predecessors.find(row => row.thread_ref === thread);
        // An advancing startup profile names existing exact thread heads. It
        // cannot silently initialize a new thread or cross-bind a predecessor.
        if (verifiedPlan.transition && (!previous || !predecessor)) {
          throw new Error("dsh-web.objective-plan-transition-unbound");
        }
        if (verifiedPlan.transition?.kind === 'replace') {
          const count = ledger.snapshot().length;
          const migrated = lifecycle.migratePlanRequirements({
            consumer_ref: joined.objective_request.consumer_ref, scope_ref: joined.objective_request.scope_ref,
            thread_ref: thread, previous_continuity_digest: predecessor.continuity_digest,
            plan_input: {...verifiedPlan.template, thread_ref: thread,
              previous_plan_context_digest: predecessor.plan_context_digest},
            source_digests: verifiedPlan.source_digests, accounting: predecessor.accounting,
            source_ref: verifiedPlan.requirement_seed.source_ref});
          if (!migrated.ok) {
            if (ledger.snapshot().length !== count) faulted = true;
            throw new Error(`dsh-web.objective-plan-replacement-denied:${migrated.reason_codes?.join('+') ?? 'invalid'}`);
          }
          const retained = getLatestReasoningPlanContext(ledger, thread);
          if (retained?.content.plan_context_digest !== migrated.migration.plan_context_digest) {
            throw new Error('dsh-web.objective-plan-transition-stale');
          }
          planContext = retained.content;
          planEvent = retained;
        } else {
        let appendPlan = previous === null;
        if (previous) {
          const {thread_ref: _thread, previous_plan_context_digest: _previous,
            authority_effect: _authority, identity_scope: _identity,
            plan_context_digest: _digest, schema_version: _schema, ...template} = previous.content;
          if (digestValue(template) !== verifiedPlan.template_digest) {
            if (!predecessor || predecessor.plan_context_digest !== previous.content.plan_context_digest) {
              throw new Error("dsh-web.objective-retained-plan-selection-conflict");
            }
            // Advancement may change selected sources, declared statuses,
            // questions and active slice, but never reseed or drop obligations.
            const obligations = value => value.feature_obligations.map(row => ({
              obligation_id: row.obligation_id, summary: row.summary}));
            if (template.parent_plan_ref !== verifiedPlan.template.parent_plan_ref
              || digestValue(obligations(template)) !== digestValue(obligations(verifiedPlan.template))) {
              throw new Error("dsh-web.objective-plan-advancement-requirements-changed");
            }
            appendPlan = true;
          } else if (predecessor && previous.content.previous_plan_context_digest !== predecessor.plan_context_digest) {
            // Reopening an already applied transition is idempotent only when
            // its exact predecessor remains part of this recorded plan head.
            throw new Error("dsh-web.objective-plan-transition-stale");
          }
          planContext = previous.content;
          planEvent = previous;
        }
        if (appendPlan) {
          try {
            const appendedPlan = appendReasoningPlanContext(ledger, {...verifiedPlan.template,
              thread_ref: thread, previous_plan_context_digest: previous?.content.plan_context_digest ?? null},
            {expected_thread_ref: thread, source_digests: verifiedPlan.source_digests});
            if (!appendedPlan.ok) throw new Error("append");
            planContext = appendedPlan.value;
            planEvent = appendedPlan.event;
            // A rejected interpretation must not leave an uncheckpointed plan
            // tail that prevents recovery. This is selection retention only.
            const sealedPlan = ledger.seal({event_digests: [planEvent.event_digest],
              consumer_ref: joined.objective_request.consumer_ref,
              request_ref: joined.objective_request.request_ref});
            if (!sealedPlan.ok || !ledger.checkpoint({checkpoint_kind: "manual", epoch: sealedPlan.value,
              subject_digest: planContext.plan_context_digest}).ok) throw new Error("checkpoint");
          } catch {
            faulted = true;
            throw new Error("dsh-web.objective-plan-checkpoint-failed");
          }
        }
        }
      }
      const interpreted = await lifecycle.prepare(joined.objective_request, null, [], seed);
      if (!interpreted.ok) throw new Error(`dsh-web.objective-preparation-denied:${
        interpreted.reason_codes?.join("+") ?? interpreted.disposition}`);
      // Retain the interpretation independently of later preflight, source,
      // binding and native admission checks. This record never admits a turn.
      const interpretationMaterial = {kind: "dsh-objective-interpretation-observed",
        thread_ref: joined.objective_request.thread_ref, turn_ref: null,
        binding_id_digest: digestValue(joined.binding_evidence.binding_id),
        generation: joined.binding_evidence.generation,
        request_ref_digest: digestValue(joined.objective_request.request_ref),
        scope_digest: digestValue(joined.objective_request.scope_ref),
        objective_state_digest: interpreted.resolution.next_state.state_digest,
        resolution_digest: interpreted.resolution.resolution_digest,
        interpretation_event_digest: interpreted.event_digest,
        checkpoint_digest: interpreted.checkpoint_digest,
        requirement_continuity_digest: interpreted.requirement_continuity?.continuity_digest ?? null,
        plan_context_digest: planContext?.plan_context_digest ?? null,
        ...(planContext ? {plan_progress: projectDshPlanProgress(planContext)} : {}), authority_effect: "none"};
      const retainedInterpretation = session_store.append({event_kind: "host-observation",
        consumer_id: joined.binding_evidence.consumer_id,
        content: {observation: {...interpretationMaterial,
          observation_digest: digestValue(interpretationMaterial)}}});
      if (!retainedInterpretation.ok) {
        faulted = true;
        throw new Error("dsh-web.objective-interpretation-observation-failed");
      }
      if (selectedPlan !== null) loadDshHostPlanSelection(selectedPlan.descriptor);
      const current = normalize({...input.owned_binding, session_id: input.session_id,
        request_id: input.request_id, content: input.content});
      if (digestValue(current.binding_evidence) !== digestValue(joined.binding_evidence)) {
        throw new Error("dsh-web.objective-binding-changed");
      }
      const preflight = evaluateOwnedRequestPreflight({owned_request: joined.objective_request,
        objective_resolution: interpreted.resolution,
        turn_binding: {lane: "interaction-bound", consumer_ref: joined.objective_request.consumer_ref,
          purpose: "repository-request", source_epoch: digestValue(sources.source_snapshot),
          turn_id: joined.objective_request.request_ref, interaction_id: joined.objective_request.request_ref},
        decision_profile: sources.decision_profile, definition_catalog: sources.definition_catalog,
        ontology_snapshot: sources.ontology_snapshot, context: sources.value.context,
        instructions: sources.instructions, supplemental_context_items: sources.supplemental_context_items,
        current_sources: sources.source_snapshot, projection_policy: sources.value.context_projection,
      }, {module_port});
      if (preflight.action !== "prepared" || !preflight.context_envelope?.ok) {
        throw new Error("dsh-web.are-owned-preflight-not-direct");
      }
      const envelope = preflight.context_envelope;
      if (envelope.value.included_items.length > 64 || envelope.value.inline_bytes > 32 * 1024) {
        throw new Error("dsh-web.are-context-envelope-invalid");
      }
      const r = interpreted.resolution;
      const continuity = interpreted.requirement_continuity;
      const checkpointMaterial = {binding_evidence: joined.binding_evidence,
        objective_resolution_digest: r.resolution_digest,
        objective_state_digest: r.next_state.state_digest,
        requirement_continuity_digest: continuity?.continuity_digest ?? null,
        interpretation_event_digest: interpreted.event_digest,
        preflight_directive: preflight.directive, context_envelope_digest: envelope.digest,
        ...(planContext ? {plan_context_digest: planContext.plan_context_digest,
          plan_event_digest: planEvent.event_digest, plan_selection_digest: selectedPlan.selection_digest} : {})};
      let checkpoint;
      let appended;
      try {
        appended = ledger.append({event_kind: "dsh-owned-preflight-prepared",
          idempotency_key: `dsh-preflight:${digestValue(joined.objective_request.request_ref)}`,
          content: checkpointMaterial, provenance_refs: [joined.objective_request.request_ref]});
        if (!appended.ok) throw new Error("append");
        const sealed = ledger.seal({event_digests: [appended.event.event_digest,
          ...(planEvent ? [planEvent.event_digest] : [])],
          consumer_ref: joined.objective_request.consumer_ref, request_ref: joined.objective_request.request_ref});
        if (!sealed.ok) throw new Error("seal");
        checkpoint = ledger.checkpoint({checkpoint_kind: "before-model-request", epoch: sealed.value,
          subject_digest: digestValue(checkpointMaterial)});
        if (!checkpoint.ok) throw new Error("checkpoint");
      } catch {
        faulted = true;
        throw new Error("dsh-web.objective-preflight-checkpoint-failed");
      }
      const bindingMaterial = {schema_version: `are.dsh-objective-binding/v${planContext ? 2 : 1}`,
        ...joined.binding_evidence, scope_digest: digestValue(joined.objective_request.scope_ref),
        request_ref_digest: digestValue(joined.objective_request.request_ref),
        objective_state_digest: r.next_state.state_digest, resolution_digest: r.resolution_digest,
        requirement_continuity_digest: continuity?.continuity_digest ?? null,
        preflight_event_digest: appended.event.event_digest, checkpoint_digest: checkpoint.digest,
        ...(planContext ? {plan_context_digest: planContext.plan_context_digest} : {})};
      const objectiveBinding = {...bindingMaterial, binding_digest: digestValue(bindingMaterial)};
      let modelContext = JSON.stringify({schema_version: "are.dsh-web-model-context/v2",
        context_envelope_digest: envelope.digest,
        route_id: preflight.directive.selected_route_or_candidates[0],
        selected_items: envelope.value.included_items.filter(item => item.item_kind !== "request"),
        objective: {active_objective: r.next_state.active_objective,
          state_digest: r.next_state.state_digest, resolution_digest: r.resolution_digest,
          transition: r.transition, requirement_snapshot: continuity?.snapshots
            .find(snapshot => snapshot.objective_id === r.next_state.active_objective.objective_id) ?? null,
          requirement_continuity_digest: continuity?.continuity_digest ?? null,
          objective_binding_digest: objectiveBinding.binding_digest, authority_effect: "none",
          ...(planContext ? {plan_context: planContext} : {})}});
      if (planContext && Buffer.byteLength(modelContext) > 32 * 1024) {
        modelContext = JSON.stringify(compactDshPlannedModelContext(JSON.parse(modelContext)));
      }
      if (Buffer.byteLength(modelContext) > 32 * 1024) throw new Error("dsh-web.are-model-context-too-large");
      return freezeResult({schema_version: "are.dsh-web-prompt-preparation/v2",
        session_id: input.session_id, request_id: input.request_id,
        content_digest: wireDigest(input.content), route_id: preflight.directive.selected_route_or_candidates[0],
        route_receipt_digest: digestValue({directive: preflight.directive, objective_binding: objectiveBinding}),
        context_result_digest: digestValue(checkpointMaterial), context_envelope_digest: envelope.digest,
        model_context: modelContext, model_context_digest: wireDigest(modelContext),
        objective_binding: objectiveBinding, ...(planContext ? {plan_progress: projectDshPlanProgress(planContext)} : {}),
        authority_effect: "none"});
    },
    inspect: lifecycle.inspect,
  });
}
