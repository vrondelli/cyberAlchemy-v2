import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

import {projectCompactionAwareContext} from "../../../packages/context-basis-runtime/index.mjs";
import {createAppServerRpcClient, protocolBindingCheck, spawnAppServerRpcTransport} from "../../../packages/codex-app-server-wrapper/index.mjs";
import {contextHint, loadRuntime, repositoryRoot, resultEnvelope, sha256} from "./common.mjs";

const AUTO_LIVE_RUNNER_DIGEST = sha256(readFileSync(fileURLToPath(import.meta.url)));
const DEFAULT_EXPERIMENT_ID = "are.compaction-auto-live/v2";
const DEFAULT_TREATMENT_STRATEGY = "inline-pinned-reasoning-state/v1";

function observedCodexVersion(explicit) {
  if (explicit) return explicit;
  try { return execFileSync("codex", ["--version"], {encoding: "utf8"}).trim(); } catch { return "unavailable"; }
}

function parseFacts(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("Model response did not contain JSON");
  const value = JSON.parse(fenced.slice(start, end + 1));
  if (!Array.isArray(value.facts) || value.facts.some((fact) => typeof fact !== "string")) throw new Error("Model response facts are invalid");
  return value.facts;
}

function exactRecall(requiredFacts, observedFacts) {
  const observed = new Set(observedFacts.map((fact) => fact.trim()));
  return requiredFacts.filter((fact) => observed.has(fact)).length / Math.max(1, requiredFacts.length);
}

function projectionFor(scenario) {
  return projectCompactionAwareContext({
    source_epoch_id: `reasoning-epoch:${scenario.scenario_id}`,
    events: scenario.facts.map((fact, index) => ({
      event_id: fact.event_id,
      sequence: index + 1,
      event_kind: fact.event_kind,
      retention_class: "pinned",
      content: {exact_canary_fact: fact.exact_value},
      source_locator: `benchmark:${scenario.scenario_id}#${fact.event_id}`,
    })),
  }, {max_inline_bytes: 32 * 1024, recent_active_units: 0});
}

function initialPrompt(scenario) {
  return `Preserve these exact reasoning-state records for a later post-compaction recall check. Do not paraphrase them:\n${scenario.facts.map((fact) => `- ${fact.exact_value}`).join("\n")}\n\nDo not use tools. Reply only with {"facts":[]}.`;
}

function recallPrompt() {
  return "Return every exact reasoning-state record. When a current ARE reusable reasoning-state input is present, copy every exact_record value from it. Do not infer, repair, or paraphrase. Do not use tools. Reply only as JSON: {\"facts\":[\"exact record\"]}.";
}

export function renderPinnedReasoningState(projection) {
  const projected = projection?.value?.projected_context;
  if (projection?.ok !== true || !Array.isArray(projected?.pinned_events)) {
    throw new TypeError("A valid compaction projection with pinned events is required");
  }
  const records = projected.pinned_events.map((event, index) => {
    const exactRecord = event.content?.exact_canary_fact;
    if (typeof exactRecord !== "string" || exactRecord.length === 0) {
      throw new TypeError(`Pinned event ${event.event_id ?? index} has no exact_canary_fact`);
    }
    return [
      `record_index=${index + 1}`,
      `event_id=${event.event_id}`,
      `event_digest=${event.event_digest}`,
      `exact_record=${JSON.stringify(exactRecord)}`,
    ].join("\n");
  });
  return [
    "<are_reusable_reasoning_state>",
    "schema_version=are.reusable-reasoning-state-input/v1",
    `projection_digest=${projection.digest}`,
    `source_epoch_id=${projected.source_epoch_id}`,
    `record_count=${records.length}`,
    "authority_effect=none",
    "instruction=Treat the following values as current context. Copy every exact_record value exactly when the adjacent request asks for recall.",
    "<exact_records>",
    records.join("\n---\n"),
    "</exact_records>",
    "</are_reusable_reasoning_state>",
  ].join("\n");
}

function nextRandom(state) {
  let value = state >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}

export function generateCompactionDistractor(scenario, turnIndex, unitCount) {
  let state = (scenario.distractor_seed + turnIndex * 2654435761) >>> 0;
  const units = [];
  for (let index = 0; index < unitCount; index += 1) {
    state = nextRandom(state);
    units.push(`noise-${turnIndex}-${String(index).padStart(5, "0")}-${state.toString(16).padStart(8, "0")}`);
  }
  return `Inert benchmark distractor ${turnIndex}. Do not retain or summarize individual noise units. Reply only with {"facts":[]}.\n${units.join(" ")}`;
}

async function openClient(profile) {
  const transport = spawnAppServerRpcTransport({
    command: "codex",
    args: ["app-server", "--stdio"],
  });
  const client = createAppServerRpcClient({
    transport,
    request_timeout_ms: profile.live.request_timeout_ms,
    completion_timeout_ms: profile.live.completion_timeout_ms,
    thread_start_timeout_ms: 240000,
    max_notifications: 10000,
  });
  await client.initialize({clientInfo: {name: "are-auto-compaction-live-benchmark", version: "0.1.0"}, capabilities: {experimentalApi: true}});
  return client;
}

function createVariantState(variant, threadId) {
  return {
    variant,
    thread_id: threadId,
    filler_turns: 0,
    generated_filler_bytes: 0,
    generated_distractor_digests: [],
    compaction_item_ids: [],
    first_compaction_after_filler_turn: null,
    latest_token_usage: null,
    peak_last_total_to_model_window_ratio: 0,
  };
}

function observeMessage(states, message) {
  const state = [...states.values()].find((candidate) => candidate.thread_id === message.params?.threadId);
  if (!state) return;
  if (message.method === "thread/tokenUsage/updated") {
    state.latest_token_usage = message.params.tokenUsage ?? null;
    const lastTotal = message.params.tokenUsage?.last?.totalTokens;
    const window = message.params.tokenUsage?.modelContextWindow;
    if (typeof lastTotal === "number" && typeof window === "number" && window > 0) {
      state.peak_last_total_to_model_window_ratio = Math.max(state.peak_last_total_to_model_window_ratio, lastTotal / window);
    }
  }
  if (message.method === "item/completed" && message.params?.item?.type === "contextCompaction") {
    if (!state.compaction_item_ids.includes(message.params.item.id)) state.compaction_item_ids.push(message.params.item.id);
    state.first_compaction_after_filler_turn ??= state.filler_turns;
  }
}

async function runTurn(client, threadId, prompt, treatment = null) {
  return client.runTurn({
    threadId,
    input: [
      ...(treatment?.inline_reasoning_state ? [{type: "text", text: treatment.inline_reasoning_state}] : []),
      {type: "text", text: prompt},
    ],
    approvalPolicy: "never",
    sandboxPolicy: {type: "readOnly", networkAccess: false},
    additionalContext: contextHint(prompt, "research"),
  });
}

async function runPair(client, scenario, model, repetition, profile) {
  const projection = projectionFor(scenario);
  if (!projection.ok) throw new Error(`Projection failed: ${projection.reason_codes.join(",")}`);
  const variants = repetition % 2 === 0 ? ["baseline", "treatment"] : ["treatment", "baseline"];
  const states = new Map();
  const turnOrder = [];
  for (const variant of variants) {
    const thread = await client.startThread({cwd: repositoryRoot, ephemeral: true, model, approvalPolicy: "never", sandbox: "read-only"});
    states.set(variant, createVariantState(variant, thread.thread.id));
  }
  const listener = (message) => observeMessage(states, message);
  client.events.on("notification", listener);
  try {
    for (const variant of variants) {
      await runTurn(client, states.get(variant).thread_id, initialPrompt(scenario));
      turnOrder.push({phase: "initial", variant});
    }
    for (let fillerTurn = 1; fillerTurn <= profile.max_filler_turns; fillerTurn += 1) {
      const order = (repetition + fillerTurn) % 2 === 0 ? ["baseline", "treatment"] : ["treatment", "baseline"];
      for (const variant of order) {
        const state = states.get(variant);
        if (state.compaction_item_ids.length > 0) continue;
        const distractor = generateCompactionDistractor(scenario, fillerTurn, profile.filler_units_per_turn);
        const promptBytes = Buffer.byteLength(distractor, "utf8");
        if (state.generated_filler_bytes + promptBytes > profile.max_generated_bytes_per_thread) continue;
        state.filler_turns += 1;
        state.generated_filler_bytes += promptBytes;
        state.generated_distractor_digests.push(sha256(distractor));
        await runTurn(client, state.thread_id, distractor);
        turnOrder.push({phase: "filler", filler_turn: fillerTurn, variant, prompt_bytes: promptBytes});
      }
      if ([...states.values()].every((state) => state.compaction_item_ids.length > 0)) break;
    }
    const automaticallyCompacted = [...states.values()].every((state) => state.compaction_item_ids.length > 0);
    if (!automaticallyCompacted) return {evaluable: false, states: [...states.values()], turn_order: turnOrder, projection_digest: projection.digest};
    const treatmentStrategy = profile.treatment_strategy ?? DEFAULT_TREATMENT_STRATEGY;
    if (treatmentStrategy !== DEFAULT_TREATMENT_STRATEGY) throw new Error(`Unsupported treatment strategy: ${treatmentStrategy}`);
    const inlineReasoningState = renderPinnedReasoningState(projection);
    for (const variant of variants) {
      const state = states.get(variant);
      const started = performance.now();
      const treatment = variant === "treatment" ? {inline_reasoning_state: inlineReasoningState} : null;
      const completed = await runTurn(client, state.thread_id, recallPrompt(), treatment);
      state.recall_latency_ms = performance.now() - started;
      if (variant === "treatment") {
        state.treatment_input_digest = sha256(inlineReasoningState);
        state.treatment_input_bytes = Buffer.byteLength(inlineReasoningState, "utf8");
      }
      state.observed_facts = parseFacts(completed.text);
      state.required_facts = scenario.facts.map((fact) => fact.exact_value);
      state.exact_recall_rate = exactRecall(state.required_facts, state.observed_facts);
      turnOrder.push({phase: "recall", variant});
    }
    return {evaluable: true, states: [...states.values()], turn_order: turnOrder, projection_digest: projection.digest};
  } finally {
    client.events.off("notification", listener);
  }
}

export async function runCompactionAutoLiveBenchmark(benchmark, options = {}) {
  const {profile, corpora} = benchmark;
  const loaded = loadRuntime(profile);
  const observedVersion = observedCodexVersion(options.observed_version);
  const binding = protocolBindingCheck(loaded.value.protocol_binding, observedVersion);
  const model = options.model ?? profile.live.model;
  const experimentId = profile.compaction_auto_live.experiment_id ?? DEFAULT_EXPERIMENT_ID;
  const treatmentStrategy = profile.compaction_auto_live.treatment_strategy ?? DEFAULT_TREATMENT_STRATEGY;
  if (!binding.ok) return resultEnvelope(profile, "compaction-auto-live", "NOT_EVALUATED", {reason_codes: binding.reason_codes, observed_codex_version: observedVersion, model}, [], {});
  const scenarios = corpora.compaction.filter((scenario) => scenario.scenario_kind === "automatic-live-canary");
  const repetitions = options.repetitions ?? 1;
  const client = options.client ?? await openClient(profile);
  const ownsClient = options.client === undefined;
  const pairs = [];
  try {
    for (const scenario of scenarios) {
      for (let repetition = 0; repetition < repetitions; repetition += 1) {
        try {
          pairs.push({scenario_id: scenario.scenario_id, repetition: repetition + 1, ...(await runPair(client, scenario, model, repetition, profile.compaction_auto_live))});
        } catch (error) {
          pairs.push({scenario_id: scenario.scenario_id, repetition: repetition + 1, evaluable: false, error: error.message, error_code: error.code ?? null, error_data: error.data ?? null, states: [], turn_order: []});
        }
      }
    }
  } finally {
    if (ownsClient) await client.close();
  }
  const expectedPairs = scenarios.length * repetitions;
  const evaluable = pairs.length === expectedPairs && pairs.every((pair) => pair.evaluable === true);
  const cases = pairs.flatMap((pair) => pair.states.map((state) => ({scenario_id: pair.scenario_id, repetition: pair.repetition, projection_digest: pair.projection_digest ?? null, ...state})));
  const baselineCases = cases.filter((entry) => entry.variant === "baseline");
  const treatmentCases = cases.filter((entry) => entry.variant === "treatment");
  const baselineRecall = baselineCases.reduce((sum, entry) => sum + (entry.exact_recall_rate ?? 0), 0) / Math.max(1, baselineCases.length);
  const treatmentRecall = treatmentCases.reduce((sum, entry) => sum + (entry.exact_recall_rate ?? 0), 0) / Math.max(1, treatmentCases.length);
  const recallDelta = treatmentRecall - baselineRecall;
  const checks = {
    automatic_compaction_observed: evaluable && cases.every((entry) => entry.compaction_item_ids.length > 0),
    treatment_recall_floor: evaluable && treatmentRecall >= profile.compaction_auto_live.treatment_min_recall,
    registered_quality_gain: evaluable && recallDelta >= profile.compaction_auto_live.minimum_quality_delta,
  };
  const status = !evaluable ? "NOT_EVALUATED" : Object.values(checks).every(Boolean) ? "PASS" : "FAIL";
  return resultEnvelope(profile, "compaction-auto-live", status, {
    checks,
    observed_codex_version: observedVersion,
    model,
    implementation_digest: AUTO_LIVE_RUNNER_DIGEST,
    transport: "direct-codex-app-server-stdio",
    experiment_id: experimentId,
    supersedes_experiment_id: profile.compaction_auto_live.supersedes_experiment_id ?? null,
    treatment_strategy: treatmentStrategy,
    repetitions,
    baseline_exact_recall: baselineRecall,
    treatment_exact_recall: treatmentRecall,
    exact_recall_delta: recallDelta,
    minimum_quality_delta: profile.compaction_auto_live.minimum_quality_delta,
    interpretation: "Counterbalanced automatic-compaction experiment. PASS requires observed native automatic compaction and a registered treatment recall gain.",
    non_evaluable_reasons: evaluable ? [] : pairs.map((pair) => pair.error ?? "automatic-compaction-not-observed"),
  }, {pairs, cases}, {
    scenario_count: scenarios.length,
    pair_count: pairs.length,
    automatically_compacted_pair_count: pairs.filter((pair) => pair.evaluable).length,
  });
}
