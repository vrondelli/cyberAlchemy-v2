#!/usr/bin/env node
// Sequential tokenizer-only planning. No generation, judging, or evaluator access.
import {createHash} from "node:crypto";
import {chmodSync, closeSync, constants, existsSync, fsyncSync, linkSync, mkdirSync, openSync, readFileSync, readdirSync, unlinkSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {execFileSync} from "node:child_process";
import {loadSourceManifest, planConfirmation, sha as protocolSha, IDS, SELECTION_SHA256, SOURCE_MANIFEST_SHA256} from "./adapter-unexposed-v1.mjs";

const MAX_CALLS = 256, TIMEOUT_MS = 900000, GATEWAY = "are-keld-presentation-provider-gateway-1";
const ENDPOINT = "https://api.z.ai/api/paas/v4/tokenizer";
const ADAPTER_SHA256 = "b3ee2756f4c8d02fb2e8f2f6c442019c75a46157509bfed122954cf885f8970f";
const PROTOCOL_SHA256 = "ea7172b5f6b67b819c69dfd96f551d6fb6e2275074f80e25ad27ab47e9f7a382";
const ENDPOINT_PROFILE = Object.freeze({endpoint: ENDPOINT, model: "glm-5.3-flash", timeout_seconds: 45, maximum_response_bytes: 65536, automatic_retries: 0, tokenizer_identity: "z-ai-api-tokenizer", tokenizer_version_claim: "paas-v4-live-2026-09-25"});
const REMOTE = `const {readFile}=await import('node:fs/promises');let raw='';for await(const c of process.stdin){raw+=c;if(Buffer.byteLength(raw)>8000000)process.exit(41)}const key=(await readFile('/run/secrets/model_api_key','utf8')).trim();const c=new AbortController(),t=setTimeout(()=>c.abort(),45000);try{const r=await fetch('${ENDPOINT}',{method:'POST',headers:{'content-type':'application/json',accept:'application/json',authorization:'Bearer '+key},body:raw,signal:c.signal,redirect:'error'});const b=Buffer.from(await r.arrayBuffer());if(b.length>65536)process.exit(42);const p=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));process.stdout.write(JSON.stringify({status:r.status,prompt_tokens:p?.usage?.prompt_tokens,response_sha256:(await import('node:crypto')).createHash('sha256').update(b).digest('hex'),response_bytes:b.length}))}catch(e){process.stderr.write(e?.name==='AbortError'?'deadline-exceeded':'request-failed');process.exit(43)}finally{clearTimeout(t)}`;
const sha = (value) => createHash("sha256").update(Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest("hex");
const stable = (value) => JSON.stringify(value, (_, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item);
const fail = (code) => { throw new Error(code); };
function durable(path, value) {
  const temporary = join(dirname(path), `.${path.split("/").at(-1)}.${process.pid}.tmp`), fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
  try { writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`); chmodSync(temporary, 0o444); fsyncSync(fd); } finally { closeSync(fd); }
  try { linkSync(temporary, path); syncDir(dirname(path)); } finally { try { unlinkSync(temporary); syncDir(dirname(path)); } catch {} }
}
function syncDir(path) { const fd = openSync(path, constants.O_RDONLY | constants.O_DIRECTORY); try { fsyncSync(fd); } finally { closeSync(fd); } }

function codeBindings(protocolPath, expectedRunnerSha256) {
  const runner = sha(readFileSync(new URL(import.meta.url))), adapter = sha(readFileSync(new URL("./adapter-unexposed-v1.mjs", import.meta.url))), protocol = sha(readFileSync(protocolPath));
  if (runner !== expectedRunnerSha256) fail("unexposed-planning.runner-drift");
  if (adapter !== ADAPTER_SHA256) fail("unexposed-planning.adapter-drift");
  if (protocol !== PROTOCOL_SHA256) fail("unexposed-planning.protocol-drift");
  const parsed = JSON.parse(readFileSync(protocolPath));
  if (parsed.schema_version !== "are.longmemeval-unexposed-paired-protocol/v1" || parsed.cohort?.selection_sha256 !== SELECTION_SHA256 || parsed.live_dispatch_admitted !== false || parsed.wire?.automatic_retries !== 0) fail("unexposed-planning.protocol-invalid");
  return {runner_sha256: runner, adapter_sha256: adapter, paired_protocol_file_sha256: protocol, endpoint_profile_sha256: sha(Buffer.from(stable(ENDPOINT_PROFILE)))};
}

export function preflight(packageDirectory, protocolPath, expectedRunnerSha256, inspect = execFileSync) {
  const bindings = codeBindings(protocolPath, expectedRunnerSha256), manifest = JSON.parse(readFileSync(join(packageDirectory, "manifest.json"))), loaded = loadSourceManifest(manifest, packageDirectory);
  let running; try { running = inspect("docker", ["inspect", "-f", "{{.State.Running}}", GATEWAY], {encoding: "utf8", timeout: 10000}).trim(); } catch { fail("unexposed-planning.gateway-unavailable"); }
  if (running !== "true") fail("unexposed-planning.gateway-not-running");
  return {schema_version: "are.longmemeval-unexposed-planning-preflight/v1", status: "validated", ordered_question_ids: loaded.rows.map((row) => row.question_id), source_bindings: loaded.bindings, code_bindings: bindings, endpoint_profile: ENDPOINT_PROFILE, maximum_tokenizer_calls: MAX_CALLS, timeout_ms: TIMEOUT_MS, provider_calls: 0, model_generation_calls: 0, judge_calls: 0, credentials_accessed: false, evaluator_fields_accessed: false, authority_effect: "none"};
}

function expectedPrepared(sequence, request, code) {
  const wire_sha256 = protocolSha(request), payload = {model: request.model, messages: request.messages}, raw = Buffer.from(stable(payload));
  return {raw, value: {sequence, wire_sha256, tokenizer_request_sha256: sha(raw), request_bytes: raw.length, endpoint_profile_sha256: code.endpoint_profile_sha256, status: "prepared", model_calls: 0, authority_effect: "none"}};
}
function validateMeasured(value, prepared) {
  const keys = [...Object.keys(prepared).filter((key) => key !== "status"), "status", "input_tokens", "http_status", "response_sha256", "response_bytes"].sort();
  if (!value || Object.keys(value).sort().join("|") !== keys.join("|") || Object.entries(prepared).some(([key, expected]) => key !== "status" && value[key] !== expected) || value.status !== "measured" || value.http_status !== 200 || !Number.isSafeInteger(value.input_tokens) || value.input_tokens < 0 || !/^[a-f0-9]{64}$/.test(value.response_sha256 ?? "") || !Number.isSafeInteger(value.response_bytes) || value.response_bytes < 0 || value.response_bytes > 65536) fail("unexposed-planning.measured-receipt-invalid");
}
function validatePlan(plan, receipts) {
  if (!plan?.admitted || plan.status !== "tokenizer-planned-not-frozen" || plan.tasks?.length !== 4 || plan.tasks.some((task, index) => task.question_id !== IDS[index] || JSON.stringify(task.order) !== JSON.stringify(index % 2 ? ["treatment", "control"] : ["control", "treatment"]) || task.original_history?.long !== true || task.ingestion?.admitted !== true || task.treatment?.admission?.admitted !== true || task.control_answer_planning_admitted !== true)) fail("unexposed-planning.plan-not-admitted");
  if (plan.tokenizer_measurements !== receipts.length || plan.planned_pairs !== 4 || plan.planned_answer_slots !== 8 || plan.maximum_pair_concurrency !== 2 || plan.judge_reservation !== 64000 || plan.model_generation_calls !== 0) fail("unexposed-planning.plan-invariant-invalid");
  const generation_calls = plan.tasks.reduce((total, task) => total + task.ingestion.chunk_count, 0) + 8;
  if (generation_calls > 248 || plan.generation_reservation !== generation_calls * 8000 || plan.total_reservation !== plan.generation_reservation + plan.judge_reservation) fail("unexposed-planning.generation-budget-invalid");
  return generation_calls;
}

function evidenceBindings(loaded, code) {
  return {
    selection_sha256: loaded.bindings.selection_sha256,
    cohort_sha256: loaded.bindings.cohort_sha256,
    source_manifest_sha256: loaded.bindings.manifest_sha256,
    acquisition_sha256: loaded.bindings.acquisition_sha256,
    source_revision: loaded.bindings.source_revision,
    source_sha256: loaded.bindings.source_sha256,
    extractor_sha256: loaded.bindings.extractor_sha256,
    source_bindings: loaded.bindings,
    code_bindings: code,
    endpoint_profile: ENDPOINT_PROFILE
  };
}
function canonicalPlanValue(value) {
  if (Array.isArray(value)) return value.map(canonicalPlanValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === "elapsed_ms" ? null : canonicalPlanValue(item)]));
  return value;
}

function freezePlan(plan, loaded, code, receipts) {
  const generation_calls = validatePlan(plan, receipts);
  const material = {...canonicalPlanValue(plan), generation_calls, maximum_generation_calls: 248, automatic_retries: 0, ...evidenceBindings(loaded, code), comparison_protocol: {schema_version: "are.longmemeval-unexposed-paired-protocol/v1", file_sha256: PROTOCOL_SHA256}, live_dispatch_admitted: false, authority_effect: "none"};
  return {generation_calls, frozen: {...material, plan_sha256: protocolSha(material)}};
}

export async function recover(packageDirectory, protocolPath, outputDirectory, expectedRunnerSha256, inspect = execFileSync) {
  if (!existsSync(outputDirectory) || existsSync(join(outputDirectory, "RESULTS.json"))) fail("unexposed-planning.recovery-state-invalid");
  const pre = preflight(packageDirectory, protocolPath, expectedRunnerSha256, inspect), code = pre.code_bindings, names = readdirSync(outputDirectory);
  const allowed = /^(?:call-\d{3}-(?:prepared|measured)\.json|PLAN\.json|\..+\.tmp)$/;
  if (names.some((name) => !allowed.test(name))) fail("unexposed-planning.recovery-unexpected-artifact");
  const prepared = new Map(), measured = new Map();
  for (const name of names) { const match = /^call-(\d{3})-(prepared|measured)\.json$/.exec(name); if (!match) continue; const sequence = Number(match[1]), map = match[2] === "prepared" ? prepared : measured; if (map.has(sequence)) fail("unexposed-planning.recovery-conflict"); map.set(sequence, JSON.parse(readFileSync(join(outputDirectory, name)))); }
  if (measured.size > prepared.size || [...measured.keys()].some((key) => !prepared.has(key)) || [...prepared.keys()].sort((a,b)=>a-b).some((value,index)=>value!==index+1)) fail("unexposed-planning.recovery-sequence-invalid");
  const manifest = JSON.parse(readFileSync(join(packageDirectory, "manifest.json"))), loaded = loadSourceManifest(manifest, packageDirectory), replayed = []; let boundary = null;
  const meter = async (request) => { const sequence = replayed.length + 1, expected = expectedPrepared(sequence, request, code).value, observed = prepared.get(sequence); if (!observed) { boundary = "unexecuted"; throw new Error("recovery-boundary"); } if (stable(observed) !== stable(expected)) fail("unexposed-planning.prepared-receipt-drift"); const settled = measured.get(sequence); if (!settled) { boundary = "indeterminate"; throw new Error("recovery-boundary"); } validateMeasured(settled, expected); replayed.push(settled); return {input_tokens: settled.input_tokens, wire_sha256: expected.wire_sha256}; };
  let plan = null; try { plan = await planConfirmation(loaded.rows, meter, {tokenizer_limits: {max_calls: MAX_CALLS, timeout_ms: TIMEOUT_MS}}); } catch (error) { if (error.message !== "recovery-boundary") throw error; }
  if (replayed.length !== measured.size || prepared.size > measured.size + (boundary === "indeterminate" ? 1 : 0)) fail("unexposed-planning.recovery-orphan-receipt");
  if (plan) {
    const expected = freezePlan(plan, loaded, code, replayed).frozen, frozenPath = join(outputDirectory, "PLAN.json");
    if (existsSync(frozenPath)) {
      const observed = JSON.parse(readFileSync(frozenPath));
      if (stable(observed) !== stable(expected)) fail("unexposed-planning.recovery-plan-drift");
    }
  }
  else if (existsSync(join(outputDirectory, "PLAN.json"))) fail("unexposed-planning.recovery-premature-plan");
  const result = {schema_version: "are.longmemeval-unexposed-planning-result/v1", status: "inconclusive", failure_code: "abrupt-termination-recovered", ...evidenceBindings(loaded, code), calls: null, calls_lower_bound: measured.size, calls_upper_bound: prepared.size, calls_exact: measured.size === prepared.size, model_generation_calls: 0, judge_calls: 0, automatic_retries: 0, recovery_provider_calls: 0, partial_artifacts: names.filter((name) => name.startsWith(".")), credentials_crossed_gateway_boundary: false, evaluator_fields_accessed: false, authority_effect: "none"};
  durable(join(outputDirectory, "RESULTS.json"), result); return result;
}

export async function run(packageDirectory, protocolPath, outputDirectory, expectedRunnerSha256, invoke = execFileSync) {
  if (existsSync(outputDirectory)) fail("unexposed-planning.output-exists");
  const pre = preflight(packageDirectory, protocolPath, expectedRunnerSha256, invoke), code = pre.code_bindings;
  const manifest = JSON.parse(readFileSync(join(packageDirectory, "manifest.json"))), loaded = loadSourceManifest(manifest, packageDirectory);
  mkdirSync(outputDirectory, {mode: 0o700});
  const started = Date.now(), receipts = [];
  const meter = async (request) => {
    if (receipts.length >= MAX_CALLS || Date.now() - started >= TIMEOUT_MS) fail("unexposed-planning.tokenizer-budget-exhausted");
    const sequence = receipts.length + 1, {raw, value: prepared} = expectedPrepared(sequence, request, code), wire_sha256 = prepared.wire_sha256;
    durable(join(outputDirectory, `call-${String(sequence).padStart(3, "0")}-prepared.json`), prepared);
    let process;
    try { process = invoke("docker", ["exec", "--user", "65532:65532", "-i", GATEWAY, "/nodejs/bin/node", "--input-type=module", "-e", REMOTE], {input: raw, encoding: "utf8", timeout: 60000, maxBuffer: 131072}); }
    catch (error) { fail(`unexposed-planning.tokenizer-call-failed:${error.status ?? "unknown"}`); }
    let response; try { response = JSON.parse(process); } catch { fail("unexposed-planning.tokenizer-response-invalid"); }
    if (response?.status !== 200 || !Number.isSafeInteger(response.prompt_tokens) || response.prompt_tokens < 0 || !/^[a-f0-9]{64}$/.test(response.response_sha256 ?? "") || !Number.isSafeInteger(response.response_bytes) || response.response_bytes < 0 || response.response_bytes > 65536) fail("unexposed-planning.tokenizer-response-invalid");
    const settled = {...prepared, status: "measured", input_tokens: response.prompt_tokens, http_status: 200, response_sha256: response.response_sha256, response_bytes: response.response_bytes};
    durable(join(outputDirectory, `call-${String(sequence).padStart(3, "0")}-measured.json`), settled); receipts.push(settled);
    return {input_tokens: response.prompt_tokens, wire_sha256};
  };
  try {
    const plan = await planConfirmation(loaded.rows, meter, {tokenizer_limits: {max_calls: MAX_CALLS, timeout_ms: TIMEOUT_MS}});
    const {generation_calls, frozen} = freezePlan(plan, loaded, code, receipts);
    durable(join(outputDirectory, "PLAN.json"), frozen);
    const expectedNames = [...Array(receipts.length)].flatMap((_, index) => [`call-${String(index + 1).padStart(3, "0")}-prepared.json`, `call-${String(index + 1).padStart(3, "0")}-measured.json`]).concat("PLAN.json").sort();
    if (JSON.stringify(readdirSync(outputDirectory).sort()) !== JSON.stringify(expectedNames)) fail("unexposed-planning.artifact-set-invalid");
    const result = {schema_version: "are.longmemeval-unexposed-planning-result/v1", status: "planned", ...evidenceBindings(loaded, code), ordered_question_ids: IDS, tokenizer_calls: receipts.length, calls: receipts.length, calls_lower_bound: receipts.length, calls_upper_bound: receipts.length, calls_exact: true, generation_calls, generation_token_reservation: frozen.generation_reservation, judge_calls: 0, judge_token_reservation: frozen.judge_reservation, model_generation_calls: 0, automatic_retries: 0, all_usage_known: true, plan_sha256: frozen.plan_sha256, credentials_crossed_gateway_boundary: false, evaluator_fields_accessed: false, elapsed_ms: Date.now() - started, authority_effect: "none"};
    durable(join(outputDirectory, "RESULTS.json"), result); syncDir(outputDirectory); return result;
  } catch (error) {
    const names = readdirSync(outputDirectory), prepared = names.filter((name) => /-prepared\.json$/.test(name)).length, measured = names.filter((name) => /-measured\.json$/.test(name)).length;
    const result = {schema_version: "are.longmemeval-unexposed-planning-result/v1", status: "failed", failure_code: String(error.message), ...evidenceBindings(loaded, code), calls: null, calls_lower_bound: measured, calls_upper_bound: prepared, calls_exact: measured === prepared, model_generation_calls: 0, judge_calls: 0, automatic_retries: 0, all_usage_known: measured === prepared, credentials_crossed_gateway_boundary: false, evaluator_fields_accessed: false, elapsed_ms: Date.now() - started, authority_effect: "none"};
    try { durable(join(outputDirectory, "RESULTS.json"), result); syncDir(outputDirectory); } catch {}
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  if (process.argv[2] === "--preflight" && process.argv.length === 6) process.stdout.write(`${JSON.stringify(preflight(process.argv[3], process.argv[4], process.argv[5]))}\n`);
  else if (process.argv[2] === "--recover" && process.argv.length === 7) process.stdout.write(`${JSON.stringify(await recover(process.argv[3], process.argv[4], process.argv[5], process.argv[6]))}\n`);
  else if (process.argv.length === 6) process.stdout.write(`${JSON.stringify(await run(process.argv[2], process.argv[3], process.argv[4], process.argv[5]))}\n`);
  else fail("usage: qualify-plan-unexposed-v1.mjs [--preflight|--recover] PACKAGE PROTOCOL [OUTPUT] EXPECTED_RUNNER_SHA256");
}
