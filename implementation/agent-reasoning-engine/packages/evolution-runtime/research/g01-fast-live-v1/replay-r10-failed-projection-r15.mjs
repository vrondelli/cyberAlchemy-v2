// No-generation replay of r10's exposed failed candidate exchange.
// Uses frozen event bytes, prior measured envelopes, and at most eighteen new
// same-account tokenizer calls. Never prints prompts, outputs, or credentials.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {pathToFileURL} from "node:url";

const root = "/opt/are/evolution-runtime/g01-source-r10-prospective-r15";
const rel = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench";
const eventPath = "/opt/are/evolution-runtime/g01-product-replication-r10/cpp-json-b8ef1754/candidate/runs/00/events.jsonl";
const helperPath = `${root}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/hen-11-live-contextbench-v1/vps-local-glm-v1.mjs`;
const sha = value => createHash("sha256").update(value).digest("hex");
const [{createBoundedExchangeArchive}, {bodyForReceipt, stable}, {createVpsLocalPost, verifyHen11VpsTopology}] =
  await Promise.all([
    import(pathToFileURL(`${root}/${rel}/ranked-source-hints-views-r1.mjs`).href),
    import(pathToFileURL(`${root}/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs`).href),
    import(pathToFileURL(helperPath).href)
  ]);
verifyHen11VpsTopology();
const eventBytes = await readFile(eventPath);
const events = eventBytes.toString("utf8").trim().split("\n").map(JSON.parse);
const raw = events.filter(event => event.kind === "frontier-raw-exchange").at(-1);
const fallback = events.findLast(event => event.kind === "frontier-reasoning-view-fallback");
assert(raw && fallback && fallback.original_denial_reason === "mandatory-request-envelope-does-not-fit");
const oldAttempts = events.filter(event => event.kind === "frontier-projection-attempt" &&
  event.archive_sha256 === raw.archive_sha256).slice(0, fallback.original_attempts.length);
assert.equal(oldAttempts.length, fallback.original_attempts.length);
const oldEnvelopes = new Map(oldAttempts.map((attempt, i) =>
  [attempt.prompt_sha256, fallback.original_attempts[i].envelope_tokens]));
assert(oldEnvelopes.size === oldAttempts.length);
const first = JSON.parse(oldAttempts[0].prompt);
const ids = raw.exchange.assistant.tool_calls.map(call => call.id);
const assistantIndex = first.messages.findLastIndex(message => message.role === "assistant" &&
  JSON.stringify(message.tool_calls?.map(call => call.id)) === JSON.stringify(ids));
assert(assistantIndex >= 0);
assert.equal(stable(first.messages[assistantIndex]), stable(raw.exchange.assistant));
assert.deepEqual(first.messages.slice(assistantIndex + 1).map(message => message.role),
  ids.map(() => "tool"));
const input = {messages: first.messages.slice(0, assistantIndex), tools: first.tools,
  assistant: raw.exchange.assistant, results: raw.exchange.results};
const post = createVpsLocalPost();
const url = new URL("https://api.z.ai/api/paas/v4/tokenizer");
async function promptTokens(prompt) {
  const body = JSON.stringify(bodyForReceipt(prompt,
    {model: "glm-5.3-flash", output_cap: 2048, reasoning_effort: "low"}));
  const response = await post(url, body,
    {apiKey: "container-owned-marker", timeout_ms: 30000, maximum_response_bytes: 65536});
  assert.equal(response.status, 200);
  const tokens = response.payload?.usage?.prompt_tokens;
  assert(Number.isSafeInteger(tokens) && tokens > 0);
  return tokens;
}
const offsetA = fallback.original_attempts[0].envelope_tokens - await promptTokens(oldAttempts[0].prompt);
const offsetB = fallback.original_attempts.at(-1).envelope_tokens - await promptTokens(oldAttempts.at(-1).prompt);
assert.equal(offsetA, offsetB);
assert(offsetA > 0 && offsetA < 8000);
let newTokenizerCalls = 0, reusedOldMeasurements = 0;
const emitted = [], projections = [], newMeasurements = new Map();
const archive = createBoundedExchangeArchive({limit: 8000, maximum_probes: 16,
  omit_reasoning_on_denial: true, persist: async event => {
    emitted.push(event.kind);
    if(event.kind === "frontier-projection-attempt") projections.push(event.prompt);
  },
  measure: async prompt => {
    const hash = sha(prompt);
    if (oldEnvelopes.has(hash)) {
      reusedOldMeasurements++;
      return oldEnvelopes.get(hash);
    }
    newTokenizerCalls++;
    assert(newTokenizerCalls <= 16);
    const envelope = await promptTokens(prompt) + offsetA;
    newMeasurements.set(hash, envelope);
    return envelope;
  }});
const result = await archive.admit(input);
assert.equal(result.archive_sha256, raw.archive_sha256);
assert.equal(stable(archive.rawExchange(raw.archive_sha256)), stable(raw.exchange));
const last = projections.at(-1), compactWire = JSON.parse(last);
const fallbackEnvelope = oldEnvelopes.get(sha(last)) ?? newMeasurements.get(sha(last));
let metadataRowsRemoved = 0;
for (const message of compactWire.messages.filter(message => message.role === "tool")) {
  const payload = JSON.parse(message.content);
  const recovery = payload.deferred?.archive_recovery;
  if (Array.isArray(recovery?.observations)) {
    metadataRowsRemoved += recovery.observations.length;
    delete recovery.observations;
    recovery.metadata_status = "not-delivered; rerun the pinned search with deferred.resume";
    message.content = stable(payload);
  }
}
const compactPrompt = stable(compactWire);
const compactEnvelope = metadataRowsRemoved > 0
  ? await promptTokens(compactPrompt) + offsetA : fallbackEnvelope;
console.log(JSON.stringify({status: result.status, reason: result.reason ?? null,
  envelope_tokens: result.envelope_tokens ?? null, probes: result.probes,
  reused_old_measurements: reusedOldMeasurements, new_tokenizer_calls: newTokenizerCalls,
  fallback_envelope_tokens: fallbackEnvelope, compact_metadata_envelope_tokens: compactEnvelope,
  compact_metadata_rows_removed: metadataRowsRemoved,
  fallback_prompt_bytes: Buffer.byteLength(last), compact_prompt_bytes: Buffer.byteLength(compactPrompt),
  calibrated_envelope_offset: offsetA, raw_exchange_sha256: raw.archive_sha256,
  event_log_sha256: sha(eventBytes), reasoning_view_policy: result.view?.reasoning_view_policy ?? null,
  archived_raw_events: emitted.filter(kind => kind === "frontier-raw-exchange").length,
  model_calls: 0, claim_ceiling: "Exposed no-generation projection admission only; not task completion or benchmark superiority"}));
