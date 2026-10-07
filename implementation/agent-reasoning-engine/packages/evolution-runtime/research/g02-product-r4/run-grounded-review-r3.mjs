// Receipt-bound G02 reviewer on 32 already exposed packets. No fresh holdout.
// Freeze/check perform no provider calls. Run requires a same-secret preflight.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {prompt, validateGroundedReview} from "./grounded-review-contract-r1.mjs";

const base = "/opt/are/evolution-runtime";
const packets = `${base}/g02-r4-reviewer-packets-r1`;
const output = `${base}/g02-r4-grounded-reviewer-development-r3`;
const packetSealSha = "11cc658044a9429d4a8a77682460336c578eb65c39db6a5cdc0192a38685682d";
const transportPath = `${base}/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs`;
const secretPath = "/opt/are-keld-presentation/secrets/model_api_key";
const model = "glm-5.3-flash";
const tokenizerEndpoint = "https://api.z.ai/api/paas/v4/tokenizer";
const generationEndpoint = "https://api.z.ai/api/paas/v4/chat/completions";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const digest = path => sha(readFileSync(path));
const read = path => JSON.parse(readFileSync(path, "utf8"));
const write = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, {flag: "wx", mode: 0o600});
const need = (ok, reason) => {if (!ok) throw Error(`g02-grounded-r3.${reason}`);};
const self = fileURLToPath(import.meta.url);

function bindings() {
  need(digest(`${packets}/SEAL.json`) === packetSealSha, "packet-seal-drift");
  const seal = read(`${packets}/SEAL.json`);
  need(seal.packets?.length === 32, "pair-count");
  for (const item of seal.packets) {
    need(item.path.startsWith(`${packets}/`) && digest(item.path) === item.sha256, "packet-drift");
  }
  return seal.packets.map(({cohort, pair, path, sha256}) => ({cohort, pair, path, sha256}));
}

function freezeValue() {
  const rows = bindings();
  const contract = fileURLToPath(new URL("./grounded-review-contract-r1.mjs", import.meta.url));
  return {schema_version: "are.g02-grounded-reviewer-development-freeze/v3",
    status: "frozen-before-model-dispatch", posture: "exposed-development-only",
    packet_seal_sha256: packetSealSha, runner_sha256: digest(self),
    contract_sha256: digest(contract), transport_sha256: digest(transportPath),
    model, tokenizer_endpoint: tokenizerEndpoint, generation_endpoint: generationEndpoint,
    maximum_packet_calls: 32, maximum_output_tokens: 1024, request_timeout_ms: 120000,
    automatic_retries: 0, prompt, prompt_sha256: sha(prompt), ordered_pairs: rows,
    invalid_output_policy: "preserve-original-prediction-and-count-invalid",
    transport_failure_policy: "write-attempt-receipt-and-stop-without-retry-or-replacement",
    claim_ceiling: "Exposed development only; no fresh G02 matched-arm superiority claim."};
}

async function postSafe(postOnce, endpoint, body, key, timeoutMs) {
  const start = Date.now();
  try {
    const response = await postOnce(new URL(endpoint), body,
      {apiKey: key, timeout_ms: timeoutMs, maximum_response_bytes: 262144});
    return {...response, elapsed_ms: Date.now() - start};
  } catch (error) {
    return {status: null, payload: null, bytes: 0, elapsed_ms: Date.now() - start,
      failure_code: String(error?.code ?? error?.message ?? "request-failed").slice(0, 80)};
  }
}

async function preflight(postOnce, stable, key, attempt) {
  const path = `${output}/PREFLIGHT-${attempt}.json`;
  need(!existsSync(path), "preflight-attempt-reused");
  const tiny = [{role: "user", content: "ARE G02 exposed development readiness. Reply OK."}];
  const tokenizerBody = stable({model, messages: tiny});
  const tok = await postSafe(postOnce, tokenizerEndpoint, tokenizerBody, key, 30000);
  const promptTokens = tok.payload?.usage?.prompt_tokens;
  const tokOk = tok.status === 200 && Number.isSafeInteger(promptTokens) && promptTokens > 0;
  const row = {schema_version: "are.g02-grounded-reviewer-provider-preflight/v1",
    status: "not-ready", checked_at: new Date().toISOString(), model,
    tokenizer_request_sha256: sha(tokenizerBody), automatic_retries: 0,
    tokenizer: {http_status: tok.status, prompt_tokens: tokOk ? promptTokens : null,
      error_code: String(tok.payload?.error?.code ?? tok.payload?.code ?? tok.failure_code ?? "").slice(0, 40),
      elapsed_ms: tok.elapsed_ms}, tiny_generation: {status: "not-attempted"},
    provider_requests: 1, packet_calls: 0};
  if (tokOk) {
    const generationBody = stable({model, messages: tiny, stream: false,
      max_completion_tokens: 64});
    const generated = await postSafe(postOnce, generationEndpoint, generationBody, key, 30000);
    const completionTokens = generated.payload?.usage?.completion_tokens;
    const content = generated.payload?.choices?.[0]?.message?.content;
    const generationOk = generated.status === 200 && Number.isSafeInteger(completionTokens) &&
      completionTokens > 0 && typeof content === "string" && content.trim().length > 0;
    row.generation_request_sha256 = sha(generationBody);
    row.tiny_generation = {status: generationOk ? "ready" : "not-ready", http_status: generated.status,
      completion_tokens: generationOk ? completionTokens : null,
      error_code: String(generated.payload?.error?.code ?? generated.payload?.code ?? generated.failure_code ?? "").slice(0, 40),
      elapsed_ms: generated.elapsed_ms};
    row.provider_requests = 2;
    row.status = generationOk ? "ready" : "not-ready";
  }
  write(path, row);
  return {path, row};
}

async function run(attempt) {
  need(/^[A-Za-z0-9_-]{1,60}$/.test(attempt ?? ""), "attempt-id");
  const expected = freezeValue();
  need(digest(`${output}/FREEZE.json`) === sha(`${JSON.stringify(expected, null, 2)}\n`), "freeze-drift");
  need(!existsSync(`${output}/RUN-RESULT.json`), "already-complete");
  const {postOnce, stable, MODEL} = await import(transportPath);
  need(MODEL === model, "transport-model-drift");
  const key = readFileSync(secretPath, "utf8").trim();
  need(key.length >= 8 && key.length <= 8192, "secret-shape");
  const ready = await preflight(postOnce, stable, key, attempt);
  process.stdout.write(`${JSON.stringify({preflight: ready.row.status, receipt_path: ready.path,
    tokenizer_status: ready.row.tokenizer.http_status})}\n`);
  if (ready.row.status !== "ready") {process.exitCode = 2; return;}
  for (const item of expected.ordered_pairs) {
    const dir = join(output, `${item.cohort}-${item.pair}`);
    const responsePath = join(dir, "RESPONSE.json");
    if (existsSync(responsePath)) continue; // Never re-dispatch an attempted packet.
    need(!existsSync(dir), `unsettled-attempt:${item.pair}`);
    const packet = read(item.path);
    mkdirSync(dir, {mode: 0o700});
    const body = stable({model, messages: [{role: "system", content: prompt},
      {role: "user", content: JSON.stringify(packet)}], tools: [], stream: false,
      max_tokens: 1024, thinking: {type: "enabled", clear_thinking: false}, reasoning_effort: "low"});
    need(Buffer.byteLength(body) <= 262144, "packet-request-too-large");
    write(join(dir, "STARTED.json"), {cohort: item.cohort, pair: item.pair,
      packet_sha256: item.sha256, request_sha256: sha(body), started_at: new Date().toISOString()});
    const response = await postSafe(postOnce, generationEndpoint, body, key, 120000);
    const choice = response.payload?.choices?.[0];
    const content = choice?.message?.content;
    let review = null;
    let validationError = null;
    if (response.status === 200 && choice?.finish_reason === "stop" && typeof content === "string") {
      try {review = validateGroundedReview(JSON.parse(content), packet);}
      catch (error) {validationError = String(error.message).slice(0, 160);}
    }
    const record = {schema_version: "are.g02-grounded-reviewer-response/v3",
      cohort: item.cohort, pair: item.pair, packet_sha256: item.sha256,
      request_sha256: sha(body), status: review ? "valid" : "invalid",
      http_status: response.status, provider_code: String(response.payload?.error?.code ?? response.payload?.code ?? ""),
      failure_code: response.failure_code ?? null, finish_reason: choice?.finish_reason ?? null,
      validation_error: validationError, elapsed_ms: response.elapsed_ms,
      response_bytes: response.bytes ?? 0, usage: response.payload?.usage ?? null,
      content: typeof content === "string" ? content : null, review};
    write(responsePath, record);
    process.stdout.write(`${JSON.stringify({pair: item.pair, status: record.status,
      http_status: record.http_status, abstained: review?.abstained ?? null})}\n`);
    if (response.status !== 200 || response.failure_code) {process.exitCode = 2; return;}
  }
  const responsePaths = expected.ordered_pairs.map(item => join(output, `${item.cohort}-${item.pair}`, "RESPONSE.json"));
  need(responsePaths.every(path => existsSync(path)), "missing-response");
  write(`${output}/RUN-RESULT.json`, {schema_version: "are.g02-grounded-reviewer-run/v3",
    status: "completed-exposed-diagnostic", completed: responsePaths.length,
    expected: expected.ordered_pairs.length, response_paths: responsePaths,
    claim_ceiling: expected.claim_ceiling});
  process.stdout.write(`${JSON.stringify({status: "completed-exposed-diagnostic", pairs: responsePaths.length})}\n`);
}

const [mode, attempt] = process.argv.slice(2);
if (mode === "check" && process.argv.length === 3) {
  const expected = freezeValue();
  process.stdout.write(`${JSON.stringify({status: "check-passed-no-write", packets: expected.ordered_pairs.length,
    freeze_projection_sha256: sha(`${JSON.stringify(expected, null, 2)}\n`)})}\n`);
} else if (mode === "freeze" && process.argv.length === 3) {
  need(!existsSync(output), "output-exists");
  const expected = freezeValue();
  mkdirSync(output, {mode: 0o700});
  const path = `${output}/FREEZE.json`;
  write(path, expected);
  process.stdout.write(`${JSON.stringify({status: "frozen-no-model", path,
    sha256: digest(path), packets: expected.ordered_pairs.length})}\n`);
} else if (mode === "run" && process.argv.length === 4) {
  await run(attempt);
} else throw Error("usage: run-grounded-review-r3.mjs check|freeze|run <attempt-id>");
