import {composeSemanticLifecycle, selectSemanticDomain} from "../../semantic-input-runtime/index.mjs";
import {verifyRecordDigest} from "../../semantic-judgment-evaluator/index.mjs";
import {verifyRuntimeJournalCut} from "../../runtime-journal/index.mjs";
import {digestValue, fail, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

export const CODEX_SEMANTIC_COMPLETION_SCHEMA = "are.codex-semantic-completion/v1";
export const CODEX_REASONING_RECEIPT_BINDING_SCHEMA = "are.codex-reasoning-receipt-binding/v1";

const verifiedSemanticCompletions = new WeakSet();

function verified(value) {
  const result = freezeResult(value);
  verifiedSemanticCompletions.add(result);
  return result;
}

export function isVerifiedSemanticCompletion(value) {
  return isRecord(value) && verifiedSemanticCompletions.has(value);
}

function disabled() {
  return verified({
    schema_version: CODEX_SEMANTIC_COMPLETION_SCHEMA,
    ok: true,
    disposition: "disabled",
    notify: false,
    evaluator_calls: 0,
    authority_effect: "none",
  });
}

function receiptBinding(result, turnState, binding) {
  const receipt = result.reasoning_receipt;
  const outcome = result.semantic_outcome?.outcome;
  const receiptDigest = result.reasoning_receipt_exact_bytes_digest;
  const reasons = [];
  if (!isRecord(receipt)) reasons.push("semantic.reasoning-receipt-required");
  else if (!verifyRecordDigest(receipt)) reasons.push("semantic.reasoning-receipt-record-digest-invalid");
  if (!nonEmptyString(receiptDigest) || (isRecord(receipt) && digestValue(receipt) !== receiptDigest)) reasons.push("semantic.reasoning-receipt-digest-invalid");
  if (!nonEmptyString(outcome) || receipt?.terminal_outcome !== outcome) reasons.push("semantic.reasoning-receipt-outcome-mismatch");
  if (receipt?.context_epoch_id !== turnState?.context_epoch_id) reasons.push("semantic.reasoning-receipt-context-epoch-mismatch");
  if (receipt?.context_envelope_digest !== turnState?.context_envelope_digest
    || receipt?.input_digests?.context_envelope !== turnState?.context_envelope_digest) {
    reasons.push("semantic.reasoning-receipt-context-envelope-mismatch");
  }
  if (result.semantic_input_materialization?.context_epoch_id !== turnState?.context_epoch_id
    || result.semantic_input_materialization?.context_envelope_digest !== turnState?.context_envelope_digest) {
    reasons.push("semantic.materialization-context-mismatch");
  }
  if (binding?.binding_id !== result.binding_id) reasons.push("semantic.reasoning-receipt-domain-binding-mismatch");
  if (reasons.length > 0) return fail("semantic-receipt-binding", reasons);
  const material = {
    schema_version: CODEX_REASONING_RECEIPT_BINDING_SCHEMA,
    thread_id: turnState.thread_id,
    turn_id: turnState.turn_id,
    context_epoch_id: turnState.context_epoch_id,
    context_envelope_digest: turnState.context_envelope_digest,
    binding_id: result.binding_id,
    conclusion_domain: binding.conclusion_domain,
    owner_ref: binding.owner_ref,
    evaluator_id: binding.evaluator_id,
    semantic_materialization_id: result.semantic_input_materialization.materialization_id,
    semantic_materialization_digest: result.semantic_input_materialization.canonical_digest,
    semantic_outcome: outcome,
    reasoning_receipt_digest: receiptDigest,
    runtime_journal_cut_digest: result.runtime_journal_source_cut_digest,
    authority_effect: "none",
  };
  return freezeResult({...material, binding_digest: digestValue(material)});
}

function summary(result, turnState = null, binding = null) {
  if (!result.ok) {
    const value = {
      schema_version: CODEX_SEMANTIC_COMPLETION_SCHEMA,
      ok: false,
      disposition: "block",
      stage: result.stage ?? "semantic-lifecycle",
      reason_codes: result.reason_codes ?? ["semantic.completion-blocked"],
      semantic_materialization_id: null,
      semantic_outcome: null,
      reasoning_receipt_digest: null,
      evaluator_calls: result.evaluator_calls ?? 0,
      notify: true,
      authority_effect: "none",
    };
    return verified({...value, summary_digest: digestValue(value)});
  }
  const boundReceipt = result.disposition === "evaluated" ? receiptBinding(result, turnState, binding) : null;
  if (boundReceipt && boundReceipt.ok === false) return summary(boundReceipt);
  const value = {
    schema_version: CODEX_SEMANTIC_COMPLETION_SCHEMA,
    ok: true,
    disposition: result.disposition,
    binding_id: result.binding_id ?? null,
    semantic_materialization_id: result.semantic_input_materialization?.materialization_id ?? null,
    semantic_materialization_digest: result.semantic_input_materialization?.canonical_digest ?? null,
    semantic_outcome: result.semantic_outcome?.outcome ?? null,
    reasoning_receipt_digest: result.reasoning_receipt_exact_bytes_digest ?? null,
    reasoning_receipt_binding: boundReceipt,
    evaluator_calls: result.evaluator_calls ?? 0,
    notify: true,
    claim_ceiling: result.claim_ceiling ?? null,
    authority_effect: "none",
  };
  return verified({...value, summary_digest: digestValue(value)});
}

export async function evaluateSemanticCompletion(input = {}) {
  const configuration = input.configuration;
  if (!isRecord(configuration) || configuration.enabled !== true) return disabled();
  if (configuration.trigger !== "turn/completed") return summary(fail("semantic-completion", ["semantic.trigger-unsupported"]));
  if (!isRecord(input.semantic_profile)) return summary(fail("semantic-completion", ["semantic.profile-required"]));
  if (!isRecord(input.turn_state)) return summary(fail("semantic-completion", ["semantic.turn-state-missing"]));
  const verifiedJournalCut = verifyRuntimeJournalCut(input.runtime_journal_cut);
  if (!verifiedJournalCut.ok) return summary(fail("semantic-completion", verifiedJournalCut.reason_codes ?? ["semantic.runtime-journal-cut-invalid"]));
  const journalEvents = input.runtime_journal_cut.events;
  if (journalEvents.some((event) => event.thread_id !== input.turn_state.thread_id || event.turn_id !== input.turn_state.turn_id)) {
    return summary(fail("semantic-completion", ["semantic.runtime-journal-cut-turn-mismatch"]));
  }
  const boundTurn = journalEvents.find((event) => event.event_kind === "turn-state-bound");
  if (!boundTurn || boundTurn.content.context_envelope_digest !== input.turn_state.context_envelope_digest) {
    return summary(fail("semantic-completion", ["semantic.runtime-journal-cut-context-mismatch"]));
  }

  const selection = selectSemanticDomain(input.turn_state.request_context, input.turn_state.route_decision, input.semantic_profile);
  if (!selection.ok || selection.disposition === "not-applicable") return summary(selection);

  let supplied = {};
  if (typeof input.semantic_input_provider === "function") {
    try {
      supplied = await input.semantic_input_provider({
        completion_message: input.completion_message,
        turn_state: input.turn_state,
      }) ?? {};
    } catch (error) {
      return summary(fail("semantic-input-provider", [`semantic.input-provider-failed:${error?.name ?? "Error"}`]));
    }
  }
  if (!isRecord(supplied)) return summary(fail("semantic-input-provider", ["semantic.input-provider-result-invalid"]));
  if (Object.hasOwn(supplied, "runtime_journal") || Object.hasOwn(supplied, "runtime_journal_cut")) {
    return summary(fail("semantic-input-provider", ["semantic.runtime-journal-provider-injection-forbidden"]));
  }
  const lifecycle = typeof input.semantic_lifecycle === "function" ? input.semantic_lifecycle : composeSemanticLifecycle;
  const telemetry = {};
  const requestContext = freezeResult({
    ...input.turn_state.request_context,
    ...(typeof supplied.owner_ref === "string" ? {owner_ref: supplied.owner_ref} : {}),
  });
  let result;
  try {
    result = await lifecycle({
      context_envelope: input.turn_state.context_envelope,
      request_context: requestContext,
      route_decision: input.turn_state.route_decision,
      profile: input.semantic_profile,
      as_of: supplied.as_of,
      created_at: supplied.created_at,
      mode: supplied.mode,
      observation_candidates: supplied.observation_candidates,
      observation_sources: supplied.observation_sources,
      challenge_state: supplied.challenge_state,
      runtime_journal_cut: input.runtime_journal_cut,
      previous_materialization: supplied.previous_materialization,
      current_sources: supplied.current_sources,
      telemetry,
    });
  } catch (error) {
    return summary(fail("semantic-lifecycle", [`semantic.lifecycle-threw:${error?.name ?? "Error"}`]));
  }
  return summary(result, input.turn_state, selection.binding);
}
