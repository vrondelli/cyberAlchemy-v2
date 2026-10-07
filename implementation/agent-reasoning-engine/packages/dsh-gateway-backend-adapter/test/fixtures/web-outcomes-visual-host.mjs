#!/usr/bin/env node
// Disposable local mock-provider Host for a manual browser rendering check.
import {spawn} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, rm} from "node:fs/promises";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const schema = "are.dsh-host-owned-graph-probe/v1";
const fixture = fileURLToPath(new URL("./web-host-owned-graph-probe.mjs", import.meta.url));
const manifest = fileURLToPath(new URL("../../config/dsh-web-are-host-owned-canary-graph-manifest.v1.json", import.meta.url));
const home = await mkdtemp(join(tmpdir(), "are-dsh-web-visual-canary-"));
const mock = createServer(async (request, response) => {
  for await (const _ of request) { /* Drain the local request. */ }
  const event = {id: "are-visual-canary", object: "chat.completion.chunk",
    model: "local-visual-canary", choices: [{index: 0,
      delta: {role: "assistant", content: "Local visual check completed."},
      finish_reason: "stop"}],
    usage: {prompt_tokens: 8, completion_tokens: 5, total_tokens: 13}};
  response.writeHead(200, {"content-type": "text/event-stream"});
  response.end(`data: ${JSON.stringify(event)}\n\ndata: [DONE]\n\n`);
});
await new Promise((resolve, reject) => {
  mock.once("error", reject);
  mock.listen(0, "127.0.0.1", resolve);
});
const providerUrl = `http://127.0.0.1:${mock.address().port}/v1`;
const child = spawn(process.execPath, [fixture], {stdio: ["ignore", "pipe", "pipe", "ipc"],
  env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
    ARE_DSH_HOST_MANIFEST: manifest, ARE_DSH_MOCK_BASE_URL: providerUrl,
    ARE_DSH_MOCK_API_KEY: "local-test-only-not-a-secret"}});
let stdout = "";
let stderr = "";
let ready;
let sequence = 0;
const pending = new Map();
child.stdout.on("data", chunk => { stdout = (stdout + chunk).slice(-8192); });
child.stderr.on("data", chunk => { stderr = (stderr + chunk).slice(-4096); });
child.on("message", message => {
  if (message?.schema_version !== schema) return;
  if (message.kind === "ready" || message.kind === "fatal") ready = message;
  if (message.kind === "response") {
    pending.get(message.request_key)?.(message.result);
    pending.delete(message.request_key);
  }
});
const command = (kind, extra = {}) => new Promise((resolve, reject) => {
  const key = `visual-${++sequence}`;
  const timer = setTimeout(() => { pending.delete(key); reject(new Error(`${kind}-timeout`)); }, 15_000);
  pending.set(key, result => { clearTimeout(timer); resolve(result); });
  child.send({schema_version: schema, request_key: key, command: kind, ...extra});
});
let sessionId;
try {
  const deadline = Date.now() + 180_000;
  let launched;
  while (Date.now() < deadline && child.exitCode === null) {
    launched = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
    if (launched && ready) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  if (ready?.kind !== "ready" || !launched) {
    throw new Error(`visual-canary.host-start-failed:${ready?.reason_code ?? stderr}`);
  }
  const url = new URL(launched);
  const login = await fetch(url, {redirect: "manual"});
  const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
  if (!cookie) throw new Error(`visual-canary.auth-failed:${login.status}`);
  const rpc = async (method, request) => {
    const response = await fetch(new URL(`/api/session/${method}`, url), {
      method: "POST", headers: {"content-type": "application/json", cookie, origin: url.origin},
      body: JSON.stringify({type: "client-request", rpcId: `visual-${++sequence}`,
        method: `session/${method}`,
        payload: {args: method === "list" ? {_request: request} : {request}}})});
    if (response.status !== 200) throw new Error(`visual-canary.${method}-http-${response.status}`);
    const body = await response.json();
    if (body.result?.ok !== true) throw new Error(`visual-canary.${method}-rejected:${JSON.stringify(body.result)}`);
    return body.result.value;
  };
  sessionId = (await rpc("create", {workspaceId: ready.workspace_id})).sessionId;
  await rpc("prompt", {sessionId, requestId: "visual-canary-prompt", mode: "queue",
    content: [{type: "text", text: "explain this architecture"}]});
  const terminalDeadline = Date.now() + 30_000;
  let outcome;
  while (Date.now() < terminalDeadline) {
    const listed = await rpc("list", {});
    outcome = listed.items.find(item => item.sessionId === sessionId)
      ?.projections?.values?.arePromptOutcomes?.at(-1);
    if (outcome?.terminal === "completed") break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (outcome?.terminal !== "completed") throw new Error("visual-canary.terminal-not-observed");
  process.stdout.write(`${JSON.stringify({schema_version: "are.dsh-web-visual-canary-ready/v1",
    url: launched, session_id: sessionId, disposition: outcome.disposition,
    terminal: outcome.terminal})}\n`);
  await new Promise(resolve => {
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });
} finally {
  if (sessionId && child.connected) {
    await command("dispose-agent", {session_id: sessionId}).catch(() => {});
    await command("release-agent", {session_id: sessionId}).catch(() => {});
  }
  if (child.connected) await command("dispose").catch(() => {});
  if (child.exitCode === null) {
    child.kill("SIGTERM");
    await Promise.race([once(child, "exit"),
      new Promise(resolve => setTimeout(resolve, 2_000))]);
  }
  await new Promise(resolve => mock.close(resolve));
  await rm(home, {recursive: true, force: true});
}
