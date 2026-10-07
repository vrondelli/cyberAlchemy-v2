#!/usr/bin/env node
// Disposable installed-Codex proof for the opt-in hosted feedback path.
// --first-turn-only-unsupported-history checks the fresh-thread gateway proof
// with only detailed-history reads fault-injected; the model host remains real.
import {spawn} from "node:child_process";
import {randomUUID} from "node:crypto";
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {createInterface} from "node:readline";
import {fileURLToPath} from "node:url";
import {digestValue} from "../src/canonical.mjs";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repositoryRoot = resolve(packageRoot, "../../../../../");
const checkoutRoot = resolve(repositoryRoot, "cyberAlchemy-v2");
const temporaryRoot = mkdtempSync(join(tmpdir(), "are-hosted-feedback-canary-"));
const configRoot = join(temporaryRoot, "codex-home");
const socketPath = process.platform === "win32"
  ? `\\\\.\\pipe\\are-hosted-feedback-${process.pid}-${randomUUID()}`
  : join(temporaryRoot, "gateway.sock");
const statePath = join(temporaryRoot, "client-state.json");
const token = randomUUID();
let gateway;
let client;
let ready;
let threadId;
let firstFeedback;
let replayFeedback;
let reviewedFeedback;
let replayReviewedFeedback;
let nextTurnId;
let revisedFeedback;
let thirdTurnId;
let fourthTurnId;
let gatewayDiagnostics = () => "";
let provider;
let providerFailure = null;
const providerRequests = [];
const firstTurnOnly = process.argv.includes("--first-turn-only-unsupported-history");
let ownedRuntimeProofs = 0;
let historyCompletionProofs = 0;

function responseEvents(id, text) {
  const item = {id: `msg_${id}`, type: "message", status: "completed", role: "assistant",
    content: [{type: "output_text", text, annotations: []}]};
  const events = [
    {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress"}},
    {type: "response.content_part.added", item_id: item.id, output_index: 0, content_index: 0,
      part: {type: "output_text", text: "", annotations: []}},
    {type: "response.output_text.delta", item_id: item.id, output_index: 0, content_index: 0, delta: text},
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed", output: [item],
      usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28, input_tokens_details: {cached_tokens: 0}}}},
  ];
  return events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

async function startPrivateProvider() {
  mkdirSync(configRoot);
  provider = createServer(async (request, response) => {
    try {
      if (request.method !== "POST" || !request.url.endsWith("/responses")) throw new Error("provider.request-unexpected");
      const chunks = [];
      let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        if (bytes > 2 * 1024 * 1024) throw new Error("provider.request-too-large");
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      providerRequests.push(body);
      if (providerRequests.length > 4) throw new Error("provider.unexpected-extra-turn");
      const id = `resp_are_feedback_${providerRequests.length}`;
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.end(responseEvents(id, `ARE_FEEDBACK_${providerRequests.length}_OK`));
    } catch (error) {
      providerFailure = error.message;
      response.writeHead(500);
      response.end("private provider fixture rejected request");
    }
  });
  await new Promise((resolveListen) => provider.listen(0, "127.0.0.1", resolveListen));
  const endpoint = `http://127.0.0.1:${provider.address().port}/v1`;
  writeFileSync(join(configRoot, "config.toml"), `model_provider = "are_fixture"\nmodel = "are-fixture"\n[model_providers.are_fixture]\nname = "ARE private feedback fixture"\nbase_url = ${JSON.stringify(endpoint)}\nwire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n`, {mode: 0o600});
}

function start(entry, args, schema, environment = process.env) {
  const child = spawn(process.execPath, [resolve(packageRoot, entry), ...args],
    {stdio: ["ignore", "ignore", "pipe"], env: environment});
  let diagnostic = "";
  child.stderr.on("data", (chunk) => { diagnostic = `${diagnostic}${chunk}`.slice(-4000); });
  const readiness = new Promise((resolveReady, reject) => {
    const lines = createInterface({input: child.stderr, crlfDelay: Infinity});
    const timeout = setTimeout(() => reject(new Error(`${schema} timeout: ${diagnostic}`)), 30000);
    lines.on("line", (line) => {
      try {
        const parsed = JSON.parse(line);
        if (parsed.schema_version !== schema) return;
        clearTimeout(timeout);
        lines.close();
        resolveReady(parsed);
      } catch { /* non-JSON diagnostics are retained above */ }
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      reject(new Error(`${schema} exited ${signal ?? code}: ${diagnostic}`));
    });
  });
  return {child, readiness, diagnostics: () => diagnostic};
}

async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolveExit) => child.once("exit", resolveExit));
  child.kill("SIGTERM");
  await exited;
}

async function boot({simulateUnsupportedHistory = false} = {}) {
  const gatewayRun = start("bin/are-codex-gateway.mjs", [
    "--development-live", "--config", resolve(packageRoot, "profiles/interaction-learning-canary-v1.json"),
    "--repository-root", repositoryRoot, "--listen", socketPath, "--backend", "direct-stdio",
    "--session-store", join(temporaryRoot, "sessions.jsonl"),
    "--reasoning-state-dir", join(temporaryRoot, "reasoning-state"),
  ], "are.gateway-ready/v1", {...process.env, CODEX_HOME: configRoot});
  gateway = gatewayRun.child;
  gatewayDiagnostics = gatewayRun.diagnostics;
  const gatewayReady = await gatewayRun.readiness;
  const clientRun = start("bin/are-codex-windows-client.mjs", [
    "--socket", socketPath, "--repository-root", repositoryRoot, "--cwd", checkoutRoot,
    "--state-file", statePath, "--port", "0", "--token", token,
    ...(simulateUnsupportedHistory ? ["--simulate-unsupported-history"] : []),
  ], "are.codex-windows-client-ready/v1", {...process.env,
    ...(simulateUnsupportedHistory ? {ARE_INTEGRATION_TEST_MODE: "1"} : {})});
  client = clientRun.child;
  ready = await clientRun.readiness;
  const state = await api("GET", "api/state");
  if (!state.value?.feedback_available) throw new Error("Opt-in feedback unavailable at installed host.");
  return gatewayReady;
}

async function api(method, path, body) {
  const response = await fetch(new URL(path, ready.url), {method,
    headers: {authorization: `Bearer ${token}`, ...(body ? {"content-type": "application/json"} : {})},
    ...(body ? {body: JSON.stringify(body)} : {})});
  const value = await response.json();
  if (!value.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(value)}`);
  return value;
}

async function waitForCompletion(id, timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const runtime = await api("GET", `api/threads/${encodeURIComponent(threadId)}/runtime`);
      if (runtime.value?.disposition === "idle"
        && runtime.value?.verification_source === "gateway-owned-frontier"
        && runtime.value?.turn_ref === digestValue(id)
        && runtime.value?.turn_status === "completed") { ownedRuntimeProofs += 1; return; }
      const history = await api("GET", `api/threads/${encodeURIComponent(threadId)}/history`);
      const messages = history.value?.messages ?? [];
      if (runtime.value?.disposition === "idle" && messages.some((message) => message.turn_id === id && message.role === "agent")) {
        historyCompletionProofs += 1;
        return;
      }
    } catch (error) {
      if (!/rollout at .* is empty|windows-client\.history-unavailable/.test(error.message)) throw error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
  }
  throw new Error(`Installed host turn ${id} did not complete in time.`);
}

try {
  await startPrivateProvider();
  const firstGateway = await boot({simulateUnsupportedHistory: firstTurnOnly});
  const started = await api("POST", "api/threads", {cwd: checkoutRoot, requestKey: `thread:${randomUUID()}`});
  threadId = started.value.thread.id;
  if (firstTurnOnly) {
    const freshRuntime = await api("GET", `api/threads/${encodeURIComponent(threadId)}/runtime`);
    if (freshRuntime.value?.verification_source !== "gateway-fresh-creation"
      || freshRuntime.value?.disposition !== "idle") throw new Error("Fresh owned creation was not first-turn ready.");
  }
  const firstTurn = await api("POST", "api/turns", {threadId,
    requestKey: `turn:${randomUUID()}`, text: "Explain the repository routing architecture briefly. Do not use tools."});
  await waitForCompletion(firstTurn.value.turn.id);
  if (firstTurnOnly) {
    if (providerFailure || providerRequests.length !== 1 || ownedRuntimeProofs !== 1) {
      throw new Error("First-turn proof did not complete exactly one local provider request.");
    }
    process.stdout.write(`${JSON.stringify({schema_version: "are.hosted-first-turn-installed-canary/v1", ok: true,
      observed_backend_version: firstGateway.observed_backend_version,
      verification_source: "gateway-fresh-creation", first_turn_completed: true,
      private_provider_requests: providerRequests.length, external_model_calls: 0,
      current_task_handover: false, authority_effect: "none"})}\n`);
  } else {
  const feedback = {threadId, requestKey: `feedback:${randomUUID()}`,
    text: "Your last answer was too verbose. From now on, keep responses concise."};
  firstFeedback = await api("POST", "api/feedback", feedback);
  if (firstFeedback.value.disposition !== "applied") throw new Error("Feedback was not applied.");
  const pendingText = "For this conversation, include examples.";
  const pendingFeedback = {threadId, requestKey: `feedback:${randomUUID()}`, text: pendingText};
  const pending = await api("POST", "api/feedback", pendingFeedback);
  if (pending.value.disposition !== "pending") throw new Error("Unclassified feedback did not remain pending.");
  const listed = await api("GET", `api/feedback/pending?threadId=${encodeURIComponent(threadId)}`);
  const candidate = listed.value.items.find((item) => item.feedback_id === pendingFeedback.requestKey);
  if (!candidate?.candidate_episode_ref || candidate.candidate_episode_ref !== firstFeedback.value.episode_ref) {
    throw new Error("Pending feedback has no exact completed-answer candidate for review.");
  }
  const review = {...pendingFeedback, episodeRef: candidate.candidate_episode_ref,
    quote: "include examples", instruction: "Include one example."};
  reviewedFeedback = await api("POST", "api/feedback/apply", review);
  if (reviewedFeedback.value.disposition !== "applied"
    || reviewedFeedback.value.retention_scope !== "current-interaction") {
    throw new Error("Explicit pending review was not applied to the current interaction.");
  }
  const nextTurn = await api("POST", "api/turns", {threadId,
    requestKey: `turn:${randomUUID()}`, text: "Explain the ARE reasoning state briefly. Do not use tools."});
  nextTurnId = nextTurn.value.turn.id;
  await waitForCompletion(nextTurnId);
  const lessons = await api("GET", `api/feedback/lessons?threadId=${encodeURIComponent(threadId)}`);
  const predecessor = lessons.value.items.find((item) => item.lesson_id === reviewedFeedback.value.lesson_id);
  if (!predecessor || predecessor.lesson_digest !== reviewedFeedback.value.lesson_digest) {
    throw new Error("Reviewed lesson was not selectable for an exact revision.");
  }
  const revisionText = "For this conversation, include two examples instead.";
  const revisionPending = {threadId, requestKey: `feedback:${randomUUID()}`, text: revisionText};
  const revisionReceipt = await api("POST", "api/feedback", revisionPending);
  if (revisionReceipt.value.disposition !== "pending") throw new Error("Revision feedback did not remain pending.");
  const pendingRevisions = await api("GET", `api/feedback/pending?threadId=${encodeURIComponent(threadId)}`);
  const revisionCandidate = pendingRevisions.value.items.find((item) => item.feedback_id === revisionPending.requestKey);
  if (!revisionCandidate?.candidate_episode_ref
    || revisionCandidate.candidate_episode_ref === firstFeedback.value.episode_ref) {
    throw new Error(`Revision had no second completed answer candidate: ${revisionCandidate?.candidate_episode_ref ?? "none"}.`);
  }
  revisedFeedback = await api("POST", "api/feedback/apply", {...revisionPending,
    episodeRef: revisionCandidate.candidate_episode_ref,
    quote: "include two examples instead", instruction: "Include two examples.",
    revisesLessonId: predecessor.lesson_id, expectedLessonDigest: predecessor.lesson_digest});
  if (revisedFeedback.value.disposition !== "applied"
    || revisedFeedback.value.lesson_id !== predecessor.lesson_id
    || revisedFeedback.value.predecessor_digest !== predecessor.lesson_digest
    || revisedFeedback.value.revision !== predecessor.revision + 1) {
    throw new Error("Explicit revision did not replace the exact predecessor.");
  }
  const thirdTurn = await api("POST", "api/turns", {threadId,
    requestKey: `turn:${randomUUID()}`, text: "Explain the ARE evolution engine briefly. Do not use tools."});
  thirdTurnId = thirdTurn.value.turn.id;
  await waitForCompletion(thirdTurnId);
  await stop(client);
  await stop(gateway);
  const secondGateway = await boot({simulateUnsupportedHistory: true});
  await api("POST", "api/threads/resume", {threadId, requestKey: `resume:${randomUUID()}`});
  replayFeedback = await api("POST", "api/feedback", feedback);
  if (replayFeedback.value.disposition !== "replayed"
    || replayFeedback.value.lesson_digest !== firstFeedback.value.lesson_digest) {
    throw new Error("Restart did not preserve exact feedback deduplication.");
  }
  replayReviewedFeedback = await api("POST", "api/feedback/apply", review);
  if (replayReviewedFeedback.value.disposition !== "applied" || replayReviewedFeedback.value.replayed !== true
    || replayReviewedFeedback.value.lesson_digest !== reviewedFeedback.value.lesson_digest) {
    throw new Error("Restart did not preserve pending-review application.");
  }
  const replayRevision = await api("POST", "api/feedback/apply", {...revisionPending,
    episodeRef: revisionCandidate.candidate_episode_ref, quote: "include two examples instead",
    instruction: "Include two examples.", revisesLessonId: predecessor.lesson_id,
    expectedLessonDigest: predecessor.lesson_digest});
  if (replayRevision.value.replayed !== true
    || replayRevision.value.lesson_digest !== revisedFeedback.value.lesson_digest) {
    throw new Error("Restart did not preserve exact pending revision.");
  }
  const fourthTurn = await api("POST", "api/turns", {threadId,
    requestKey: `turn:${randomUUID()}`, text: "Explain the active ARE objective briefly. Do not use tools."});
  fourthTurnId = fourthTurn.value.turn.id;
  await waitForCompletion(fourthTurnId);
  if (providerFailure) throw new Error(`Private provider failed: ${providerFailure}`);
  if (providerRequests.length !== 4) throw new Error(`Expected exactly four local model requests, observed ${providerRequests.length}.`);
  if (ownedRuntimeProofs !== 1 || historyCompletionProofs !== 3) {
    throw new Error(`Expected three host-history and one owned-runtime completion proof; observed ${historyCompletionProofs} and ${ownedRuntimeProofs}.`);
  }
  if (JSON.stringify(providerRequests[0]).includes("Keep responses concise.")) throw new Error("Lesson appeared before feedback.");
  if (!JSON.stringify(providerRequests[1]).includes("Keep responses concise.")) throw new Error("Next-turn model wire omitted the scoped lesson.");
  if (!JSON.stringify(providerRequests[1]).includes("Include one example.")) throw new Error("Next-turn model wire omitted the reviewed pending lesson.");
  const learningDevelopers = providerRequests[2].input?.filter(item => item.role === "developer"
    && /Include (?:one example|two examples)\./.test(JSON.stringify(item))) ?? [];
  if (learningDevelopers.length < 2
    || !JSON.stringify(learningDevelopers.at(-1)).includes("Include two examples.")
    || JSON.stringify(learningDevelopers.at(-1)).includes("Include one example.")) {
    throw new Error("Latest model-wire learning context did not select only the revised instruction.");
  }
  if (!JSON.stringify(providerRequests[2]).includes("are.interaction-learning-precedence/v1")
    || !JSON.stringify(providerRequests[2]).includes("Earlier versions in conversation history are superseded")) {
    throw new Error("Third model request omitted the revision precedence directive.");
  }
  const resumedLearningDevelopers = providerRequests[3].input?.filter(item => item.role === "developer"
    && /Include (?:one example|two examples)\./.test(JSON.stringify(item))) ?? [];
  if (!resumedLearningDevelopers.length
    || !JSON.stringify(resumedLearningDevelopers.at(-1)).includes("Include two examples.")
    || JSON.stringify(resumedLearningDevelopers.at(-1)).includes("Include one example.")
    || !JSON.stringify(providerRequests[3]).includes("are.interaction-learning-precedence/v1")) {
    throw new Error("Post-restart model wire did not retain the revised active lesson and precedence directive.");
  }
  process.stdout.write(`${JSON.stringify({schema_version: "are.hosted-feedback-installed-canary/v1", ok: true,
    observed_backend_version: firstGateway.observed_backend_version,
    restart_backend_version: secondGateway.observed_backend_version,
    feedback_disposition: firstFeedback.value.disposition,
    replay_disposition: replayFeedback.value.disposition,
    lesson_digest_preserved: true, next_turn_completed: true, third_turn_completed: true,
    post_restart_turn_completed: true,
    model_wire_learning_verified: true, revision_model_wire_verified: true,
    precedence_directive_verified: true,
    historical_superseded_context_retained: true,
    pending_review_applied: true, pending_review_replayed: true, revision_applied: true,
    model_turns_started: 4, private_provider_requests: providerRequests.length,
    owned_runtime_proofs: ownedRuntimeProofs,
    host_history_proofs: historyCompletionProofs,
    restarted_host_simulated_history_unavailable: true,
    post_restart_model_turns: 1,
    external_model_calls: 0, current_task_handover: false, authority_effect: "none"})}\n`);
  }
} catch (error) {
  process.stderr.write(`${JSON.stringify({schema_version: "are.hosted-feedback-installed-canary-failure/v1",
    ok: false, reason: error.message, first_feedback_disposition: firstFeedback?.value?.disposition ?? null,
    replay_feedback_disposition: replayFeedback?.value?.disposition ?? null,
    next_turn_started: Boolean(nextTurnId), third_turn_started: Boolean(thirdTurnId),
    fourth_turn_started: Boolean(fourthTurnId),
    revision_applied: Boolean(revisedFeedback), private_provider_requests: providerRequests.length,
    provider_failure: providerFailure, gateway_diagnostics: gatewayDiagnostics(), authority_effect: "none"})}\n`);
  process.exitCode = 1;
} finally {
  await stop(client);
  await stop(gateway);
  if (provider) {
    provider.closeAllConnections();
    await new Promise((resolveClose) => provider.close(resolveClose));
  }
  rmSync(temporaryRoot, {recursive: true, force: true});
}
