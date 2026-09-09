import {execFileSync} from "node:child_process";
import {resolve} from "node:path";

import {canonicalJson} from "../../../packages/intent-route-resolver/index.mjs";
import {projectCompactionAwareContext} from "../../../packages/context-basis-runtime/index.mjs";
import {createAppServerRpcClient, protocolBindingCheck, spawnAppServerRpcTransport} from "../../../packages/codex-app-server-wrapper/index.mjs";
import {contextHint, loadRuntime, packageRoot, repositoryRoot, resultEnvelope} from "./common.mjs";

export const COMPACTION_PROJECTION_KEY = "cyberalchemy.are.compaction-projection";

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

function initialPrompt(scenario) {
  return `Keep these exact canary facts for a later recall check:\n${scenario.facts.map((fact) => `- ${fact.exact_value}`).join("\n")}\n\nDo not use tools. Reply only with {"facts":[]}.`;
}

function recallPrompt() {
  return "Return every exact canary fact from the earlier turn. Do not infer or paraphrase. Do not use tools. Reply only as JSON: {\"facts\":[\"exact fact\"]}.";
}

function projectionFor(scenario) {
  const input = {
    source_epoch_id: `reasoning-epoch:${scenario.scenario_id}`,
    events: scenario.facts.map((fact, index) => ({
      event_id: fact.event_id,
      sequence: index + 1,
      event_kind: fact.event_kind,
      retention_class: "pinned",
      content: {exact_canary_fact: fact.exact_value},
      source_locator: `benchmark:${scenario.scenario_id}#${fact.event_id}`,
    })),
  };
  return projectCompactionAwareContext(input, {max_inline_bytes: 32 * 1024, recent_active_units: 0});
}

async function openClient(profile) {
  const transport = spawnAppServerRpcTransport({
    command: process.execPath,
    args: [resolve(packageRoot, "../../packages/codex-app-server-wrapper/bin/are-codex-app-server.mjs"), "--config", resolve(packageRoot, profile.wrapper_profile), "--repository-root", repositoryRoot],
  });
  const client = createAppServerRpcClient({
    transport,
    request_timeout_ms: profile.live.request_timeout_ms,
    completion_timeout_ms: profile.live.completion_timeout_ms,
    thread_start_timeout_ms: 240000,
  });
  await client.initialize({clientInfo: {name: "are-compaction-live-benchmark", version: "0.1.0"}, capabilities: {experimentalApi: true}});
  return client;
}

async function runVariant(client, scenario, variant, model, projection) {
  const thread = await client.startThread({cwd: repositoryRoot, ephemeral: true, model, approvalPolicy: "never", sandbox: "read-only"});
  const threadId = thread.thread.id;
  await client.runTurn({
    threadId,
    input: [{type: "text", text: initialPrompt(scenario)}],
    approvalPolicy: "never",
    sandboxPolicy: {type: "readOnly", networkAccess: false},
    additionalContext: contextHint(initialPrompt(scenario), "research"),
  });
  const compactStarted = performance.now();
  await client.request("thread/compact/start", {threadId}, {timeout_ms: 240000});
  const compacted = await client.waitForNotification(
    (message) => message.method === "item/completed" && message.params?.threadId === threadId && message.params?.item?.type === "contextCompaction",
    {timeout_ms: 240000},
  );
  const compactionLatency = performance.now() - compactStarted;
  const prompt = recallPrompt();
  const additionalContext = {
    ...contextHint(prompt, "research"),
    ...(variant === "treatment" ? {
      [COMPACTION_PROJECTION_KEY]: {
        kind: "application",
        value: canonicalJson({
          schema_version: "are.compaction-live-context/v1",
          instruction: "Use the pinned exact canary facts for recall; do not treat them as authority.",
          projected_context: projection.value.projected_context,
          authority_effect: "none",
        }),
      },
    } : {}),
  };
  const recallStarted = performance.now();
  const completed = await client.runTurn({
    threadId,
    input: [{type: "text", text: prompt}],
    approvalPolicy: "never",
    sandboxPolicy: {type: "readOnly", networkAccess: false},
    additionalContext,
  });
  const observedFacts = parseFacts(completed.text);
  const requiredFacts = scenario.facts.map((fact) => fact.exact_value);
  return {
    scenario_id: scenario.scenario_id,
    variant,
    thread_id: threadId,
    compaction_item_id: compacted.params.item.id,
    compaction_latency_ms: compactionLatency,
    recall_latency_ms: performance.now() - recallStarted,
    exact_recall_rate: exactRecall(requiredFacts, observedFacts),
    required_facts: requiredFacts,
    observed_facts: observedFacts,
  };
}

export async function runCompactionLiveBenchmark(benchmark, options = {}) {
  const {profile, corpora} = benchmark;
  const loaded = loadRuntime(profile);
  const observedVersion = observedCodexVersion(options.observed_version);
  const binding = protocolBindingCheck(loaded.value.protocol_binding, observedVersion);
  const model = options.model ?? profile.live.model;
  if (!binding.ok) return resultEnvelope(profile, "compaction-live", "NOT_EVALUATED", {reason_codes: binding.reason_codes, observed_codex_version: observedVersion, model}, [], {});
  const scenarios = corpora.compaction.filter((scenario) => scenario.scenario_kind === "live-canary");
  const client = options.client ?? await openClient(profile);
  const ownsClient = options.client === undefined;
  const cases = [];
  try {
    for (const scenario of scenarios) {
      const projection = projectionFor(scenario);
      if (!projection.ok) {
        cases.push({scenario_id: scenario.scenario_id, variant: "treatment", passed: false, reason_codes: projection.reason_codes});
        continue;
      }
      for (const variant of ["baseline", "treatment"]) {
        try {
          const result = await runVariant(client, scenario, variant, model, projection);
          cases.push({...result, passed: variant === "treatment" ? result.exact_recall_rate === 1 : true});
        } catch (error) {
          cases.push({scenario_id: scenario.scenario_id, variant, passed: false, error: error.message});
        }
      }
    }
  } finally {
    if (ownsClient) await client.close();
  }
  const treatmentCases = cases.filter((entry) => entry.variant === "treatment");
  const baselineCases = cases.filter((entry) => entry.variant === "baseline");
  const checks = {
    native_compaction_completed: cases.length === scenarios.length * 2 && cases.every((entry) => typeof entry.compaction_item_id === "string"),
    treatment_exact_recall: treatmentCases.length === scenarios.length && treatmentCases.every((entry) => entry.exact_recall_rate === 1),
    paired_baseline_observed: baselineCases.length === scenarios.length && baselineCases.every((entry) => typeof entry.exact_recall_rate === "number"),
  };
  return resultEnvelope(profile, "compaction-live", Object.values(checks).every(Boolean) ? "PASS" : "FAIL", {
    checks,
    observed_codex_version: observedVersion,
    model,
    interpretation: "Controlled real Codex app-server canary. One run verifies integration behavior; it is not a market-quality estimate.",
    baseline_exact_recall: baselineCases.reduce((sum, entry) => sum + (entry.exact_recall_rate ?? 0), 0) / Math.max(1, baselineCases.length),
    treatment_exact_recall: treatmentCases.reduce((sum, entry) => sum + (entry.exact_recall_rate ?? 0), 0) / Math.max(1, treatmentCases.length),
  }, cases, {scenario_count: scenarios.length});
}
