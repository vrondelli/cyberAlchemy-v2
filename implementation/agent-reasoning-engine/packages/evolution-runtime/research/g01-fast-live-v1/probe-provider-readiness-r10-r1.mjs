// One tokenizer request, then (only if it passes) one tiny generation.
// Run on the pinned GLM VPS. No provider payload, credential, or answer is exported.
import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-readiness.${reason}`);};
const model = "glm-5.3-flash";
const tokenizerUrl = new URL("https://api.z.ai/api/paas/v4/tokenizer");
const generationUrl = new URL("https://api.z.ai/api/paas/v4/chat/completions");
const tokenizerBody = JSON.stringify({model, messages: [{role: "user", content: "ARE G01 r10 provider readiness. Count this prompt only."}]});
const generationBody = JSON.stringify({model, messages: [{role: "user", content: "Reply with OK."}], max_completion_tokens: 64, stream: false});
const safeCode = value => /^[A-Za-z0-9_.-]{1,40}$/.test(String(value ?? "")) ? String(value) : null;

async function call(post, url, body) {
  const started = Date.now();
  try {
    const response = await post(url, body, {apiKey: "container-owned-marker", timeout_ms: 30000, maximum_response_bytes: 65536});
    return {status: response.status, payload: response.payload, bytes: response.bytes, elapsed_ms: Date.now() - started};
  } catch (error) {
    return {status: null, error_code: safeCode(String(error?.message).split(":")[0]), elapsed_ms: Date.now() - started};
  }
}

export async function probeProviderReadiness({post, topology, now = () => new Date().toISOString(), helperSha256, scriptSha256}) {
  need(typeof post === "function" && topology && /^[a-f0-9]{64}$/.test(helperSha256) && /^[a-f0-9]{64}$/.test(scriptSha256), "inputs");
  const base = {schema_version: "are.g01-provider-readiness/v1", model,
    tokenizer_endpoint: tokenizerUrl.href, generation_endpoint: generationUrl.href,
    tokenizer_request_sha256: sha(tokenizerBody), generation_request_sha256: sha(generationBody),
    helper_sha256: helperSha256, probe_script_sha256: scriptSha256,
    provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
    gateway_container_image: topology.container_image, automatic_retries: 0,
    claim_ceiling: "Current same-account transport and tiny-generation readiness only; not campaign reliability, model quality, or benchmark superiority"};
  const tokenizer = await call(post, tokenizerUrl, tokenizerBody);
  const promptTokens = tokenizer.payload?.usage?.prompt_tokens;
  const tokenizerOk = tokenizer.status === 200 && Number.isSafeInteger(promptTokens) && promptTokens > 0;
  const tokenizerRow = {status: tokenizer.status, prompt_tokens: tokenizerOk ? promptTokens : null,
    response_bytes: tokenizer.bytes ?? null, elapsed_ms: tokenizer.elapsed_ms,
    ...(tokenizerOk ? {} : {api_error_code: safeCode(tokenizer.payload?.error?.code ?? tokenizer.payload?.code),
      transport_error_code: tokenizer.error_code ?? null})};
  if (!tokenizerOk) return {...base, status: "not-ready", checked_at: now(),
    tokenizer: tokenizerRow, tiny_generation: {status: "not-attempted"}, provider_requests: 1, generation_calls: 0};
  const generation = await call(post, generationUrl, generationBody);
  const outputTokens = generation.payload?.usage?.completion_tokens;
  const answer = generation.payload?.choices?.[0]?.message?.content;
  const generationOk = generation.status === 200 && Number.isSafeInteger(outputTokens) && outputTokens > 0 &&
    typeof answer === "string" && answer.trim().length > 0;
  const generationRow = {status: generation.status, output_tokens: generationOk ? outputTokens : null,
    response_bytes: generation.bytes ?? null, elapsed_ms: generation.elapsed_ms,
    ...(generationOk ? {} : {api_error_code: safeCode(generation.payload?.error?.code ?? generation.payload?.code),
      transport_error_code: generation.error_code ?? null})};
  return {...base, status: generationOk ? "ready" : "not-ready", checked_at: now(),
    tokenizer: tokenizerRow, tiny_generation: generationRow, provider_requests: 2, generation_calls: 1};
}

async function main() {
  const [attemptId, helperPath, helperSha256] = process.argv.slice(2);
  need(process.argv.length === 5 && /^[A-Za-z0-9_-]{1,80}$/.test(attemptId ?? ""), "arguments");
  need(/^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+\.mjs$/.test(helperPath ?? "") &&
    !helperPath.includes("/../") && /^[a-f0-9]{64}$/.test(helperSha256 ?? ""), "helper-binding");
  need(sha(await readFile(helperPath)) === helperSha256, "helper-drift");
  const parent = "/opt/are/evolution-runtime/g01-r10-provider-readiness";
  await mkdir(parent, {recursive: true});
  const root = `${parent}/${attemptId}`;
  await mkdir(root); // Refuse reused IDs before any provider request.
  const {createVpsLocalPost, verifyHen11VpsTopology} = await import(pathToFileURL(helperPath).href);
  const topology = verifyHen11VpsTopology();
  const scriptSha256 = sha(await readFile(fileURLToPath(import.meta.url)));
  const post = createVpsLocalPost();
  const receipt = await probeProviderReadiness({post, topology, helperSha256, scriptSha256});
  const path = `${root}/${receipt.status === "ready" ? "READY.json" : "RESULT.json"}`;
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  await writeFile(path, bytes, {flag: "wx", mode: 0o600});
  process.stdout.write(`${JSON.stringify({status: receipt.status, path, sha256: sha(bytes),
    tokenizer_status: receipt.tokenizer.status, generation_status: receipt.tiny_generation.status})}\n`);
  if (receipt.status !== "ready") process.exitCode = 2;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
