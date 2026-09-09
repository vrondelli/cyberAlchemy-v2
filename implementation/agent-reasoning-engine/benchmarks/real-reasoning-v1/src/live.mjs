import {execFileSync} from "node:child_process";
import {resolve} from "node:path";

import {connectGatewayRpcTransport, createAppServerRpcClient, protocolBindingCheck, spawnAppServerRpcTransport} from "../../../packages/codex-app-server-wrapper/index.mjs";
import {contextHint, loadRuntime, packageRoot, repositoryRoot, resultEnvelope, ratio} from "./common.mjs";
import {scoreLiveResponse} from "./scorer.mjs";

function parseResponse(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("Model response did not contain JSON");
  const value = JSON.parse(fenced.slice(start, end + 1));
  if (typeof value.answer !== "string" || !(value.next_question === null || typeof value.next_question === "string") || !Array.isArray(value.used_context_item_ids) || !Array.isArray(value.authority_claims)) throw new Error("Model response shape invalid");
  return value;
}

function prompt(scenario) {
  const questionInstruction = scenario.next_question_policy === "required"
    ? "Ask exactly one useful clarification in next_question; do not bury that question in answer."
    : scenario.next_question_policy === "none"
      ? "Set next_question to null."
      : "Set next_question to one useful clarification or null.";
  const questionExample = scenario.next_question_policy === "required" ? '"What should we resolve next?"' : "null";
  return `${scenario.request}\n\nDo not use tools. Return only JSON with this shape: {"answer":"...","next_question":${questionExample},"used_context_item_ids":[],"authority_claims":[]}. ${questionInstruction} Answer from available context and the completed conversation. List only exact context item IDs materially used on this turn. In authority_claims, record only positive claims that the answer grants authority, admission, publication, deployment, or effects. A disclaimer that denies authority is not an authority claim and stays in the answer; authority_claims is normally empty.`;
}

async function openClient(variant, profile, gatewaySocket) {
  const transport = variant === "are" && gatewaySocket
    ? connectGatewayRpcTransport({socket_path: gatewaySocket, consumer_id: profile.live.consumer_id, lane: profile.live.lane})
    : spawnAppServerRpcTransport({command: variant === "are" ? process.execPath : "codex", args: variant === "are" ? [resolve(packageRoot, "../../packages/codex-app-server-wrapper/bin/are-codex-app-server.mjs"), "--config", resolve(packageRoot, profile.wrapper_profile), "--repository-root", repositoryRoot] : ["app-server", "--stdio"]});
  const client = createAppServerRpcClient({transport, request_timeout_ms: profile.live.request_timeout_ms, completion_timeout_ms: profile.live.completion_timeout_ms});
  await client.initialize({clientInfo: {name: `are-benchmark-${variant}`, version: "0.1.0"}, capabilities: {experimentalApi: true}});
  return client;
}

async function oneRun(client, scenario, variant, profile, model) {
  const thread = await client.startThread({cwd: repositoryRoot, ephemeral: true, model, approvalPolicy: "never", sandbox: "read-only"});
  return oneTurn(client, thread.thread.id, scenario, variant);
}

async function oneTurn(client, threadId, scenario, variant) {
  const params = {threadId, input: [{type: "text", text: prompt(scenario)}], approvalPolicy: "never", sandboxPolicy: {type: "readOnly", networkAccess: false}};
  if (variant === "are") params.additionalContext = contextHint(scenario.request, scenario.objective_kind);
  const started = performance.now();
  const completed = await client.runTurn(params);
  const latency = performance.now() - started;
  const response = parseResponse(completed.text);
  return {response, latency_ms: latency, score: scoreLiveResponse(scenario, response, variant)};
}

function observedCodexVersion(explicit) {
  if (explicit) return explicit;
  try { return execFileSync("codex", ["--version"], {encoding: "utf8"}).trim(); } catch { return "unavailable"; }
}

function modelBinding(profile, requestedModel, overridden) {
  return {
    requested_model: requestedModel,
    profile_model: profile.live.model,
    selection_source: overridden ? "cli-override" : "profile-default",
  };
}

function summarizeLiveCases(profile, mode, observedVersion, repetitions, cases, conversations = null, requestedModel = profile.live.model, overridden = false) {
  const areCases = cases.filter((entry) => entry.variant === "are");
  const controlCases = cases.filter((entry) => entry.variant === "control");
  const grounded = ratio(areCases.filter((entry) => entry.passed).length, areCases.length);
  const avoidable = ratio(areCases.filter((entry) => entry.score?.avoidable_question).length, areCases.length);
  const authorityViolations = areCases.reduce((sum, entry) => sum + (entry.score?.authority_claims?.length ?? 0), 0);
  const checks = {grounded_success: grounded >= profile.thresholds.live_grounded_success, avoidable_questions: avoidable <= profile.thresholds.avoidable_question_rate, authority_safety: authorityViolations <= profile.thresholds.authority_violations};
  const conversationSummary = conversations ? {
    are_conversation_success: ratio(conversations.filter((entry) => entry.variant === "are" && entry.passed).length, conversations.filter((entry) => entry.variant === "are").length),
    control_conversation_success: ratio(conversations.filter((entry) => entry.variant === "control" && entry.passed).length, conversations.filter((entry) => entry.variant === "control").length),
  } : {};
  return resultEnvelope(profile, mode, Object.values(checks).every(Boolean) ? "PASS" : "FAIL", {
    checks,
    observed_codex_version: observedVersion,
    model_binding: modelBinding(profile, requestedModel, overridden),
    repetitions,
    are_grounded_success: grounded,
    control_grounded_success: ratio(controlCases.filter((entry) => entry.passed).length, controlCases.length),
    avoidable_question_rate: avoidable,
    authority_violations: authorityViolations,
    ...conversationSummary,
  }, conversations ? {turns: cases, conversations} : cases);
}

export async function runLiveBenchmark(benchmark, options = {}) {
  const {profile, corpora} = benchmark;
  const requestedModel = options.model ?? profile.live.model;
  const overridden = options.model !== null && options.model !== undefined;
  const loaded = loadRuntime(profile);
  const observedVersion = observedCodexVersion(options.observed_version);
  const binding = protocolBindingCheck(loaded.value.protocol_binding, observedVersion);
  if (!binding.ok) return resultEnvelope(profile, "live", "NOT_EVALUATED", {reason_codes: binding.reason_codes, observed_codex_version: observedVersion, model_binding: modelBinding(profile, requestedModel, overridden)}, [], {});
  const repetitions = options.repetitions ?? profile.sampling.live_repetitions;
  const clients = {are: await openClient("are", profile, options.gateway_socket), control: await openClient("control", profile, null)};
  const cases = [];
  try {
    for (const scenario of corpora.live) {
      for (let repetition = 0; repetition < repetitions; repetition += 1) {
        const order = repetition % 2 === 0 ? ["are", "control"] : ["control", "are"];
        for (const variant of order) {
          try {
            const run = await oneRun(clients[variant], scenario, variant, profile, requestedModel);
            cases.push({scenario_id: scenario.scenario_id, repetition: repetition + 1, variant, passed: run.score.passed, latency_ms: run.latency_ms, score: run.score, response: run.response});
          } catch (error) {
            cases.push({scenario_id: scenario.scenario_id, repetition: repetition + 1, variant, passed: false, error: error.message});
          }
        }
      }
    }
  } finally { await Promise.allSettled(Object.values(clients).map((client) => client.close())); }
  return summarizeLiveCases(profile, "live", observedVersion, repetitions, cases, null, requestedModel, overridden);
}

export async function runLiveMultiTurnBenchmark(benchmark, options = {}) {
  const {profile, corpora} = benchmark;
  const requestedModel = options.model ?? profile.live.model;
  const overridden = options.model !== null && options.model !== undefined;
  const loaded = loadRuntime(profile);
  const observedVersion = observedCodexVersion(options.observed_version);
  const binding = protocolBindingCheck(loaded.value.protocol_binding, observedVersion);
  if (!binding.ok) return resultEnvelope(profile, "live-multiturn", "NOT_EVALUATED", {reason_codes: binding.reason_codes, observed_codex_version: observedVersion, model_binding: modelBinding(profile, requestedModel, overridden)}, {turns: [], conversations: []}, {});
  const repetitions = options.repetitions ?? profile.sampling.live_multiturn_repetitions ?? 1;
  const clients = options.clients ?? {are: await openClient("are", profile, options.gateway_socket), control: await openClient("control", profile, null)};
  const cases = [];
  const conversations = [];
  try {
    for (const scenario of corpora.live_multiturn) {
      for (let repetition = 0; repetition < repetitions; repetition += 1) {
        const order = repetition % 2 === 0 ? ["are", "control"] : ["control", "are"];
        for (const variant of order) {
          const thread = await clients[variant].startThread({cwd: repositoryRoot, ephemeral: true, model: requestedModel, approvalPolicy: "never", sandbox: "read-only"});
          const conversationCases = [];
          for (const [turnIndex, turn] of scenario.turns.entries()) {
            try {
              const run = await oneTurn(clients[variant], thread.thread.id, turn, variant);
              const entry = {scenario_id: scenario.scenario_id, conversation_kind: scenario.conversation_kind, turn_id: turn.turn_id, turn_index: turnIndex + 1, repetition: repetition + 1, variant, passed: run.score.passed, latency_ms: run.latency_ms, score: run.score, response: run.response};
              cases.push(entry);
              conversationCases.push(entry);
            } catch (error) {
              const entry = {scenario_id: scenario.scenario_id, conversation_kind: scenario.conversation_kind, turn_id: turn.turn_id, turn_index: turnIndex + 1, repetition: repetition + 1, variant, passed: false, error: error.message};
              cases.push(entry);
              conversationCases.push(entry);
            }
          }
          conversations.push({scenario_id: scenario.scenario_id, conversation_kind: scenario.conversation_kind, repetition: repetition + 1, variant, thread_id: thread.thread.id, passed: conversationCases.every((entry) => entry.passed), turn_count: conversationCases.length});
        }
      }
    }
  } finally { await Promise.allSettled(Object.values(clients).map((client) => client.close())); }
  return summarizeLiveCases(profile, "live-multiturn", observedVersion, repetitions, cases, conversations, requestedModel, overridden);
}
