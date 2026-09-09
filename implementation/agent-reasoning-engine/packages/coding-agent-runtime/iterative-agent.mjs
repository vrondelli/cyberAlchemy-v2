import {createHash} from "node:crypto";

import {parseAgentEvent} from "./agent-events.mjs";
import {runTransactionalPatchSet} from "./patch-set-runtime.mjs";
import {decideToolRequest} from "./read-only-tools.mjs";
import {snapshotTree} from "./verifier.mjs";
import {openContextRecycling} from "./context-recycling.mjs";

function stable(value) { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); for (const child of Object.values(value)) freeze(child); return value; }
function result(status, fields = {}) { const material = {schema_version: "are.iterative-coding-agent-result/v1", status, ...fields, authority_effect: "none"}; return freeze({...material, result_digest: sha256(stable(material))}); }

function promptFor(input, base, history, tools, toolContracts, recycledContext = null) {
  return [
    "You are inside a bounded coding-agent loop. Return exactly one JSON object and no prose.",
    'Tool event envelope: {"schema_version":"are.coding-agent-event/v1","event_id":"unique","kind":"tool-request","tool":{"name":"one available tool name","arguments":{"exactly":"as specified by that tool contract"}},"authority_effect":"none"}',
    'Single-file final event: {"schema_version":"are.coding-agent-event/v1","event_id":"unique","kind":"final-candidate","candidate":{"schema_version":"are.next-action-candidate/v1","operation":"replace-file","path":"...","expected_base_tree_sha256":"...","expected_file_sha256":"...","utf8":"...","rationale":"...","authority_effect":"none"},"authority_effect":"none"}',
    'Multi-file final event: {"schema_version":"are.coding-agent-event/v1","event_id":"unique","kind":"final-candidate","candidate":{"schema_version":"are.patch-set-candidate/v1","expected_base_tree_sha256":"...","changes":[{"operation":"replace-file","path":"...","expected_file_sha256":"...","utf8":"..."}],"rationale":"...","authority_effect":"none"},"authority_effect":"none"}',
    `Request: ${input.request}`,
    `Base tree sha256: ${base.tree_sha256}`,
    `Mutation allowlist: ${JSON.stringify(input.mutation_allowlist ?? [])}`,
    `Available read-only tools: ${JSON.stringify(tools)}`,
    `Exact tool contracts: ${stable(toolContracts)}`,
    `Verification command: ${JSON.stringify(input.verification_command ?? [])}`,
    tools.includes("run-command")
      ? 'When using run-command for verification, pass exactly {"command":<the verification command above>}. A safely executed nonzero exit is an observation to diagnose, not a transport failure.'
      : "No sandbox diagnostic command tool is available in this turn.",
    input.integrated_context ? `Integrated context: ${stable(input.integrated_context)}` : "Integrated context: none supplied",
    ...(recycledContext ? [`Durable task context: ${stable(recycledContext)}`, "Earlier raw history may be absent from this prompt. Use read-context-evidence with history_ref and bounded offsets to retrieve exact prior observations. Do not infer that archived work is unfinished."] : []),
    `Prior events and observations: ${stable(history)}`,
  ].join("\n\n");
}

export async function runIterativeCodingAgent(input = {}) {
  if (input.context_recycling === undefined) return runLoop(input, null);
  let recycling;
  try {
    if (input.approve === true) throw new Error("recycling.proposal-only-required");
    if (typeof input.run_id !== "string" || !input.run_id) throw new Error("recycling.stable-run-id-required");
    const base = snapshotTree(input.fixture_root);
    const scope = JSON.parse(JSON.stringify({run_id: input.run_id, request: input.request, base,
      tool_names: input.tool_runtime?.tool_names, tool_contracts: input.tool_runtime?.tool_contracts ?? {},
      tool_policy: input.tool_policy ?? {}, unattended: input.unattended !== false,
      mutation_allowlist: input.mutation_allowlist ?? [], verification_command: input.verification_command ?? [],
      integrated_context: input.integrated_context ?? null, maximum_steps: input.maximum_steps ?? 8}));
    recycling = openContextRecycling({options: input.context_recycling, transport: input.model_transport, scope, fixture_root: base.root});
    const tool_runtime = {...input.tool_runtime, tool_names: scope.tool_names, tool_contracts: scope.tool_contracts,
      invoke: (...args) => input.tool_runtime.invoke(...args)};
    const {result_digest: previousDigest, ...output} = await runLoop({...input, ...scope, tool_runtime, fixture_root: base.root}, recycling);
    return result(output.status, {...output, recycling: recycling.snapshot()});
  } catch (error) {
    return result("BLOCK", {run_id: input.run_id, reason_codes: ["agent.recycling-blocked"], error: error.message,
      ...(recycling ? {recycling: recycling.snapshot()} : {}), effect_applied: false});
  } finally { recycling?.close(); }
}

async function runLoop(input, recycling) {
  const runId = typeof input.run_id === "string" && input.run_id ? input.run_id : `iterative-agent-${Date.now()}`;
  if (!input.model_transport || typeof input.model_transport.generate !== "function") return result("BLOCK", {run_id: runId, reason_codes: ["agent.model-transport-required"], effect_applied: false});
  if (!input.tool_runtime || typeof input.tool_runtime.invoke !== "function") return result("BLOCK", {run_id: runId, reason_codes: ["agent.tool-runtime-required"], effect_applied: false});
  const maximumSteps = input.maximum_steps ?? 8;
  if (!Number.isSafeInteger(maximumSteps) || maximumSteps < 1 || maximumSteps > 64) return result("BLOCK", {run_id: runId, reason_codes: ["agent.step-limit-invalid"], effect_applied: false});
  let base;
  try { base = snapshotTree(input.fixture_root); } catch (error) { return result("BLOCK", {run_id: runId, reason_codes: [`agent.repository-invalid:${error.message}`], effect_applied: false}); }
  const history = recycling ? recycling.initialHistory(input.initial_history) : Array.isArray(input.initial_history) ? structuredClone(input.initial_history) : [];
  const advertisedTools = input.tool_runtime.tool_names.filter((tool_name) => decideToolRequest({tool_name, policy: input.tool_policy, unattended: input.unattended !== false}).decision === "allow");
  const advertisedToolContracts = Object.fromEntries(advertisedTools.map((tool_name) => [tool_name, input.tool_runtime.tool_contracts?.[tool_name] ?? {arguments: {}, example: {}}]));
  if (recycling) {
    if (input.tool_runtime.tool_names.includes(recycling.tool_name)) throw new Error("recycling.tool-name-collision");
    if (decideToolRequest({tool_name: recycling.tool_name, policy: input.tool_policy, unattended: input.unattended !== false}).decision !== "allow") throw new Error("recycling.evidence-tool-permission-required");
    advertisedTools.push(recycling.tool_name);
    advertisedToolContracts[recycling.tool_name] = recycling.tool_contract;
  }
  const seenEventIds = new Set(history.map((entry) => entry?.event?.event_id).filter(Boolean));
  const record = (event_kind, content, checkpoint_kind = "manual") => input.session?.record ? input.session.record({event_kind, content, request_ref: input.request_ref ?? runId, checkpoint_kind, provenance_refs: ["coding-agent-runtime"]}) : {ok: true};
  const counterevidence = (kind, detail) => input.advanced_reasoning?.recordCounterevidence ? input.advanced_reasoning.recordCounterevidence({claim_ref: `coding-agent-request:${sha256(input.request ?? "")}`, evidence_ref: `agent-failure:${kind}:${history.length}`, source_identity: `repository-tree:${base.root}`, source_digest: base.tree_sha256, content: {kind, detail}}) : null;
  for (let step = history.length + 1; step <= maximumSteps; step += 1) {
    if (input.signal?.aborted === true || input.is_cancelled?.() === true) return result("CANCELLED", {run_id: runId, reason_codes: ["agent.cancelled"], steps: step - 1, history, effect_applied: false});
    const fresh = snapshotTree(base.root);
    if (fresh.tree_sha256 !== base.tree_sha256) return result("BLOCK", {run_id: runId, reason_codes: ["agent.repository-drift"], steps: step - 1, history, effect_applied: false});
    let generated;
    const beforeModel = record("IterativeModelRequest", {run_id: runId, step, history_digest: sha256(stable(history)), base_tree_sha256: base.tree_sha256}, "before-model-request");
    if (!beforeModel.ok) return result("BLOCK", {run_id: runId, reason_codes: beforeModel.reason_codes ?? ["agent.session-record-failed"], steps: step - 1, history, effect_applied: false});
    try { generated = recycling
      ? await recycling.generate({history, run_id: runId, render: (activeHistory, context) => promptFor(input, base, activeHistory, advertisedTools, advertisedToolContracts, context)})
      : await input.model_transport.generate({prompt: promptFor(input, base, history, advertisedTools, advertisedToolContracts), run_id: runId}); }
    catch (error) { counterevidence("model-transport-failed", error.message); return result("BLOCK", {run_id: runId, reason_codes: ["agent.model-transport-failed"], model_error: error.message, steps: step - 1, history, effect_applied: false}); }
    if (recycling && (input.signal?.aborted === true || input.is_cancelled?.() === true)) return result("CANCELLED", {run_id: runId, reason_codes: ["agent.cancelled"], steps: step - 1, history, effect_applied: false});
    const parsed = parseAgentEvent(generated.final_bytes);
    if (!parsed.ok) { counterevidence("event-invalid", parsed.reason_codes); return result("BLOCK", {run_id: runId, reason_codes: parsed.reason_codes, steps: step, history, effect_applied: false}); }
    const event = parsed.value;
    if (seenEventIds.has(event.event_id)) return result("BLOCK", {run_id: runId, reason_codes: ["event.id-duplicate"], steps: step, history, effect_applied: false});
    seenEventIds.add(event.event_id);
    if (event.kind === "tool-request") {
      const isEvidence = recycling && event.tool.name === recycling.tool_name;
      const decision = decideToolRequest({tool_name: event.tool.name, policy: input.tool_policy, unattended: input.unattended !== false});
      history.push({step, event_digest: parsed.event_digest, event, decision, transport_receipt: generated.receipt ?? null});
      const recorded = record("IterativeAgentHistory", history.at(-1));
      if (!recorded.ok) return result("BLOCK", {run_id: runId, reason_codes: recorded.reason_codes ?? ["agent.session-record-failed"], steps: step, history, effect_applied: false});
      if (decision.decision === "ask") return result("AWAITING_TOOL_APPROVAL", {run_id: runId, reason_codes: ["tool.explicit-approval-required"], steps: step, history, effect_applied: false});
      if (decision.decision !== "allow") return result("BLOCK", {run_id: runId, reason_codes: decision.reason_codes, steps: step, history, effect_applied: false});
      recycling?.beforeTool();
      const observation = isEvidence ? recycling.readEvidence(event.tool.arguments) : await input.tool_runtime.invoke(event.tool.name, event.tool.arguments);
      history.at(-1).observation = observation;
      const observed = record("IterativeToolObservation", {step, event_id: event.event_id, observation});
      if (!observed.ok) return result("BLOCK", {run_id: runId, reason_codes: observed.reason_codes ?? ["agent.session-record-failed"], steps: step, history, effect_applied: false});
      if (!observation.ok) { counterevidence("tool-failed", observation.reason_codes); return result("BLOCK", {run_id: runId, reason_codes: observation.reason_codes, steps: step, history, effect_applied: false}); }
      recycling?.completeStep(history);
      const reduced = input.advanced_reasoning?.reduceIfNeeded?.();
      if (reduced && reduced.ok === false) return result("BLOCK", {run_id: runId, reason_codes: reduced.reason_codes ?? ["agent.reasoning-reduction-failed"], steps: step, history, effect_applied: false});
      continue;
    }
    history.push({step, event_digest: parsed.event_digest, event_kind: event.kind, ...(recycling ? {event} : {}), transport_receipt: generated.receipt ?? null});
    const recorded = record("IterativeFinalCandidate", {step, event_digest: parsed.event_digest, candidate_digest: sha256(stable(event.candidate)), candidate_schema: event.candidate.schema_version}, input.approve === true ? "before-effect" : "before-continuation");
    if (!recorded.ok) return result("BLOCK", {run_id: runId, reason_codes: recorded.reason_codes ?? ["agent.session-record-failed"], steps: step, history, effect_applied: false});
    const patchSet = event.candidate.schema_version === "are.patch-set-candidate/v1" ? event.candidate : {
      schema_version: "are.patch-set-candidate/v1",
      expected_base_tree_sha256: event.candidate.expected_base_tree_sha256,
      changes: [{operation: event.candidate.operation, path: event.candidate.path, expected_file_sha256: event.candidate.expected_file_sha256, utf8: event.candidate.utf8}],
      ...(event.candidate.rationale === undefined ? {} : {rationale: event.candidate.rationale}),
      authority_effect: "none",
    };
    const candidate = runTransactionalPatchSet({...input, run_id: runId, raw_candidate: patchSet, fixture_root: base.root});
    recycling?.completeStep(history, true);
    record("IterativeAgentCompleted", {step, status: candidate.status, result_digest: candidate.result_digest}, "after-turn-completion");
    return result(candidate.status, {run_id: runId, reason_codes: candidate.reason_codes, steps: step, history, final_candidate: event.candidate, candidate_result: candidate, effect_applied: candidate.effect_applied ?? false});
  }
  return result("BLOCK", {run_id: runId, reason_codes: ["agent.step-limit-exceeded"], steps: maximumSteps, history, effect_applied: false});
}
