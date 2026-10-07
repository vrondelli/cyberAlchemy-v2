// Exact-wire, single-attempt GLM transport through the existing gateway container.
// The API secret is read only inside the container and never crosses this boundary.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {execFileSync, spawn as nodeSpawn} from "node:child_process";
import {readFileSync} from "node:fs";
import {sha, wire} from "./adapter-unexposed-v1.mjs";
import {stable} from "../../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs";

export const GATEWAY_CONTAINER = "are-keld-presentation-provider-gateway-1";
export const GATEWAY_USER = "65532:65532";
const MAX_REQUEST_BYTES = 8_000_000, MAX_WRAPPER_BYTES = 1_048_576;
const SECRET_PROBE = "const{statSync,accessSync,constants}=await import('node:fs');const p='/run/secrets/model_api_key';accessSync(p,constants.R_OK);const s=statSync(p);if(!s.isFile()||s.size<1)process.exit(9)";
const validUsage = (usage) => Number.isSafeInteger(usage?.prompt_tokens) && usage.prompt_tokens >= 0 && Number.isSafeInteger(usage?.completion_tokens) && usage.completion_tokens >= 0 && usage.total_tokens === usage.prompt_tokens + usage.completion_tokens;
const providerErrorCode = (payload) => {
  const code = payload?.error?.code ?? payload?.code;
  return /^[0-9]{3,6}$/.test(String(code)) ? String(code) : null;
};
const validResponse = (kind, value) => Number.isInteger(value?.status) && value.status >= 100 && value.status <= 599 && value.payload && typeof value.payload === "object" && /^[a-f0-9]{64}$/.test(value.response_sha256 ?? "") && Number.isSafeInteger(value.bytes) && value.bytes >= 0 && value.bytes <= (kind === "model" ? 262144 : 65536);
const REMOTE = `const {readFile}=await import('node:fs/promises');const {createHash}=await import('node:crypto');const kind=process.argv[1];if(!['model','tokenizer'].includes(kind))process.exit(40);const chunks=[];let size=0;for await(const c of process.stdin){size+=c.length;if(size>8000000)process.exit(41);chunks.push(c)}const raw=Buffer.concat(chunks),key=(await readFile('/run/secrets/model_api_key','utf8')).trim();if(!key)process.exit(42);const endpoint='https://api.z.ai/api/paas/v4/'+(kind==='model'?'chat/completions':'tokenizer'),limit=kind==='model'?262144:65536,c=new AbortController(),t=setTimeout(()=>c.abort(),kind==='model'?60000:45000);try{const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',accept:'application/json','accept-encoding':'identity',authorization:'Bearer '+key},body:raw,signal:c.signal,redirect:'error'});const type=r.headers.get('content-type')??'',encoding=r.headers.get('content-encoding');if(!/^application\\/json(?:;|$)/i.test(type)||(encoding&&encoding!=='identity'))process.exit(43);const b=Buffer.from(await r.arrayBuffer());if(b.length>limit)process.exit(44);const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));process.stdout.write(JSON.stringify({status:r.status,payload,response_sha256:createHash('sha256').update(b).digest('hex'),response_bytes:b.length}))}catch(e){process.stderr.write(e?.name==='AbortError'?'deadline-exceeded':'request-failed');process.exit(45)}finally{clearTimeout(t)}`;

export function inspectGateway(inspect = execFileSync, read = (path) => readFileSync(path, "utf8")) {
  let descriptor, secretPresent;
  try {
    descriptor = JSON.parse(inspect("docker", ["inspect", "-f", "{{json .}}", GATEWAY_CONTAINER], {encoding: "utf8", timeout: 10000}));
    secretPresent = inspect("docker", ["exec", "--user", GATEWAY_USER, GATEWAY_CONTAINER, "/nodejs/bin/node", "--input-type=module", "-e", SECRET_PROBE], {encoding: "utf8", timeout: 10000});
  } catch { throw new Error("gateway-provider.gateway-unavailable"); }
  assert.equal(descriptor?.State?.Running, true, "gateway-provider.gateway-not-running");
  assert.match(descriptor?.Id ?? "", /^[a-f0-9]{64}$/, "gateway-provider.container-id");
  assert.match(descriptor?.Image ?? "", /^sha256:[a-f0-9]{64}$/, "gateway-provider.image-digest");
  const mounts = (descriptor?.Mounts ?? []).filter((mount) => mount.Destination === "/run/secrets/model_api_key");
  assert.equal(mounts.length, 1, "gateway-provider.secret-mount");
  const mount = mounts[0]; assert.ok(["bind", "volume", "tmpfs"].includes(mount.Type) && mount.RW === false, "gateway-provider.secret-mount-identity");
  const machine = String(read("/etc/machine-id")).trim(); assert.ok(machine, "gateway-provider.host-identity");
  assert.equal(secretPresent, "", "gateway-provider.secret-probe-output");
  return {
    schema_version: "are.longmemeval-vps-gateway-binding/v1", host_fingerprint_sha256: createHash("sha256").update(machine).digest("hex"), container: GATEWAY_CONTAINER,
    container_id: descriptor.Id, image_digest: descriptor.Image, configured_image: descriptor?.Config?.Image ?? null, user: GATEWAY_USER,
    secret_mount: {type: mount.Type, name: mount.Name || null, source_path_sha256: createHash("sha256").update(mount.Source ?? "").digest("hex"), destination: mount.Destination, mode: mount.Mode ?? "", propagation: mount.Propagation ?? "", read_only: mount.RW === false}, secret_presence: "regular-readable-nonempty", credentials_crossed_gateway_boundary: false,
    network_policy: {endpoint_origin: "https://api.z.ai", allowed_paths: ["/api/paas/v4/chat/completions", "/api/paas/v4/tokenizer"], method: "POST", redirects: "error", accept_encoding: "identity", attached_networks: Object.keys(descriptor?.NetworkSettings?.Networks ?? {}).sort()}
  };
}

function launchDocker(kind, raw, {signal, spawn = nodeSpawn}) {
  assert.ok(Buffer.byteLength(raw) <= MAX_REQUEST_BYTES, "gateway-provider.request-too-large");
  return new Promise((resolve, reject) => {
    let child; try { child = spawn("docker", ["exec", "--user", GATEWAY_USER, "-i", GATEWAY_CONTAINER, "/nodejs/bin/node", "--input-type=module", "-e", REMOTE, kind], {stdio: ["pipe", "pipe", "pipe"]}); } catch { reject(new Error("gateway-provider.spawn-failed")); return; }
    const stdout = [], stderr = []; let outBytes = 0, errBytes = 0, settled = false;
    const finish = (error, value) => { if (settled) return; settled = true; clearTimeout(timer); signal?.removeEventListener("abort", abort); if (error) { try { child.kill("SIGKILL"); } catch {} reject(error); } else resolve(value); };
    const abort = () => finish(new Error("gateway-provider.cancelled"));
    const timer = setTimeout(() => finish(new Error("gateway-provider.host-deadline")), kind === "model" ? 70000 : 55000);
    signal?.addEventListener("abort", abort, {once: true}); if (signal?.aborted) { abort(); return; }
    child.stdout.on("data", (chunk) => { outBytes += chunk.length; if (outBytes > MAX_WRAPPER_BYTES) finish(new Error("gateway-provider.wrapper-too-large")); else stdout.push(chunk); });
    child.stderr.on("data", (chunk) => { errBytes += chunk.length; if (errBytes <= 4096) stderr.push(chunk); });
    child.on("error", () => finish(new Error("gateway-provider.spawn-failed")));
    child.on("close", (code) => { if (code !== 0) return finish(new Error(`gateway-provider.remote-failed:${code ?? "unknown"}`)); let value; try { value = JSON.parse(Buffer.concat(stdout).toString("utf8")); } catch { return finish(new Error("gateway-provider.wrapper-invalid")); } const limit = kind === "model" ? 262144 : 65536; if (!Number.isInteger(value?.status) || value.status < 100 || value.status > 599 || !value.payload || typeof value.payload !== "object" || !/^[a-f0-9]{64}$/.test(value.response_sha256 ?? "") || !Number.isSafeInteger(value.response_bytes) || value.response_bytes < 0 || value.response_bytes > limit) return finish(new Error("gateway-provider.wrapper-invalid")); finish(null, {status: value.status, payload: value.payload, bytes: value.response_bytes, response_sha256: value.response_sha256}); });
    child.stdin.on("error", () => {}); child.stdin.end(raw);
  });
}

export function createGatewayExchange({spawn = nodeSpawn} = {}) {
  return async (kind, raw, digest, {signal, onDispatch = async () => {}} = {}) => {
    assert.ok(["model", "tokenizer"].includes(kind)); assert.equal(sha(raw), digest, "gateway-provider.request-digest"); assert.ok(!signal?.aborted, "gateway-provider.cancelled-before-dispatch");
    await onDispatch(); assert.ok(!signal?.aborted, "gateway-provider.cancelled-at-dispatch"); return launchDocker(kind, raw, {signal, spawn});
  };
}

function createMeter({exchange, record, before = () => {}}) {
  let calls = 0, failed = false, active = false, pending = null;
  const execute = async (request, {signal} = {}) => {
    assert.ok(!failed && !active && calls < 256, "gateway-provider.meter-stopped"); assert.equal(stable(request), stable(wire(request.messages, request.max_tokens)), "gateway-provider.unsupported-wire"); before(); active = true;
    const payload = {model: request.model, messages: request.messages}, raw = stable(payload), receipt = {kind: "tokenizer", id: ++calls, wire_sha256: sha(request), tokenizer_request_sha256: sha(raw), started_at: new Date().toISOString(), model_calls: 0, dispatched: false};
    try { await record({...receipt, status: "started"}); const response = await exchange("tokenizer", raw, receipt.tokenizer_request_sha256, {signal, onDispatch: async () => { await record({...receipt, status: "dispatch-intent", dispatched: true}); receipt.dispatched = true; }}); assert.ok(validResponse("tokenizer", response), "gateway-provider.tokenizer-response-invalid"); receipt.http_status = response.status; receipt.response_sha256 = response.response_sha256; receipt.response_bytes = response.bytes; if (response.status !== 200) { receipt.provider_error_code = providerErrorCode(response.payload); throw new Error("provider-http-error"); } assert.ok(Number.isSafeInteger(response.payload?.usage?.prompt_tokens) && response.payload.usage.prompt_tokens >= 0); receipt.input_tokens = response.payload.usage.prompt_tokens; receipt.status = "measured"; receipt.finished_at = new Date().toISOString(); await record(receipt); return {input_tokens: receipt.input_tokens, wire_sha256: receipt.wire_sha256}; }
    catch (error) { failed = true; receipt.status = "failed"; receipt.failure_code = error.code ?? error.message; receipt.finished_at = new Date().toISOString(); try { await record(receipt); } catch { receipt.persistence_failure = true; } throw Object.assign(new Error(receipt.failure_code), {receipt}); }
    finally { active = false; }
  };
  const meter = (...args) => { pending = execute(...args); return pending; }; meter.settle = async ({timeout_ms = 5000} = {}) => { let timer; try { return await Promise.race([Promise.resolve(pending).then(() => ({settled: true}), () => ({settled: true})), new Promise((resolve) => { timer = setTimeout(() => resolve({settled: false, reason: "audit-drain-deadline"}), timeout_ms); })]); } finally { clearTimeout(timer); } }; return meter;
}

function createGenerator({exchange, record, before = () => {}, maximum_calls = 152}) {
  const consumed = new Set(), active = new Set(); let calls = 0, reserved = 0;
  const execute = async ({id, request, signal}) => {
    assert.match(id, /^[a-zA-Z0-9_-]+$/); assert.ok(!consumed.has(id), "no retries"); assert.ok(calls < maximum_calls, "model-call ceiling"); assert.equal(stable(request), stable(wire(request.messages, request.max_tokens)), "unsupported exact wire"); consumed.add(id);
    const raw = stable(request), receipt = {kind: "model", id, request_sha256: sha(raw), model: request.model, started_at: new Date().toISOString(), dispatched: false, transport_attempts: 0}; let failure;
    try { before(); assert.ok(!signal?.aborted, "cancelled-before-exchange"); await record({...receipt, phase: "prepared"}); const response = await exchange("model", raw, receipt.request_sha256, {signal, onDispatch: async () => { before(); assert.ok(reserved < maximum_calls); reserved++; await record({...receipt, phase: "dispatch-intent", dispatched: true, transport_attempts: 1}); receipt.dispatched = true; receipt.transport_attempts = 1; calls++; }}); assert.ok(validResponse("model", response), "gateway-provider.model-response-invalid"); receipt.status = response.status; receipt.response_sha256 = response.response_sha256; receipt.response_bytes = response.bytes; receipt.usage = response.payload?.usage ?? null; if (response.status !== 200) { receipt.provider_error_code = providerErrorCode(response.payload); throw new Error("provider-http-error"); } const choice = response.payload?.choices?.[0]; receipt.response_model = response.payload?.model ?? null; receipt.finish_reason = choice?.finish_reason ?? null; receipt.output = choice?.message?.content ?? null; assert.equal(receipt.response_model, request.model); assert.equal(response.payload?.choices?.length, 1); assert.ok(validUsage(receipt.usage), "unknown-usage"); receipt.ok = true; }
    catch (error) { receipt.ok = false; receipt.failure_code = error.code ?? error.message; failure = error; }
    receipt.finished_at = new Date().toISOString(); try { await record({...receipt, phase: receipt.ok ? "completed" : "failed"}); } catch (error) { receipt.ok = false; receipt.persistence_failure = true; failure = error; }
    if (failure) { const error = Object.assign(new Error(receipt.failure_code), {receipt, model_started: receipt.dispatched}); if (!receipt.dispatched) error.dispatch_proof = "not-dispatched"; if (validUsage(receipt.usage)) error.usage = receipt.usage; throw error; } return receipt;
  };
  const generate = (options) => { const pending = execute(options); active.add(pending); pending.then(() => active.delete(pending), () => active.delete(pending)); return pending; }; generate.settle = async ({timeout_ms = 35000} = {}) => { let timer; try { return await Promise.race([Promise.allSettled([...active]).then(() => ({settled: true, pending: 0})), new Promise((resolve) => { timer = setTimeout(() => resolve({settled: false, pending: active.size}), timeout_ms); })]); } finally { clearTimeout(timer); } }; return generate;
}

export function createGatewayProviders({record, before, maximum_calls = 152, exchange, inspect = execFileSync, spawn = nodeSpawn}) {
  inspectGateway(inspect); const send = exchange ?? createGatewayExchange({spawn});
  return {meter: createMeter({exchange: send, record: (value) => record({channel: "tokenizer", ...value}), before}), generate: createGenerator({exchange: send, record: (value) => record({channel: "model", ...value}), before, maximum_calls})};
}
