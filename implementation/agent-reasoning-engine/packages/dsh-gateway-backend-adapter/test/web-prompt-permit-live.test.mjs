import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const DSH_ENTRY = fileURLToPath(new URL("../node_modules/@deepseek-ai/dsh/lib/bin.js", import.meta.url));
const PROBE_PLUGIN = fileURLToPath(new URL("./fixtures/web-prompt-permit-probe.mjs", import.meta.url));
const PROVIDER_PATCH = fileURLToPath(new URL("./canary-provider.patch.yml", import.meta.url));
const READ_ONLY_PATCH = fileURLToPath(new URL("../config/read-only.patch.yml", import.meta.url));
const PRESET_ROOT = fileURLToPath(new URL("../config/presets", import.meta.url));

test("disposable Web prompt crosses ARE decision, scoped permit, native ACK, and local model", {timeout: 90_000}, async () => {
  const home = await mkdtemp(join(tmpdir(), "are-dsh-web-permit-"));
  const marker = join(home, "permit.marker");
  const patch = join(home, "permit.patch.yml");
  await writeFile(patch, `- id: session-controller\n  disabled: true\n- id: agent-presets\n  config:\n    default: are-read-only\n    roots:\n      - path: ${JSON.stringify(PRESET_ROOT)}\n        trust: system\n    includeShippedRoot: false\n    includeUserRoot: false\n- insert:\n    - id: are-web-prompt-permit-probe\n      name: ${JSON.stringify(PROBE_PLUGIN)}\n`, {mode: 0o600});
  let requests = 0;
  let providerError = null;
  const mock = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      requests += 1;
      assert.deepEqual((body.tools ?? []).map((tool) => tool.function?.name ?? tool.name), [],
        "the qualified read-only Web profile must advertise no tools");
      const event = {id: "are-dsh-web-permit-local", object: "chat.completion.chunk", model: body.model,
        choices: [{index: 0, delta: {role: "assistant", content: "local permitted reply"}, finish_reason: "stop"}],
        usage: {prompt_tokens: 8, completion_tokens: 5, total_tokens: 13}};
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.end(`data: ${JSON.stringify(event)}\n\ndata: [DONE]\n\n`);
    } catch (error) {
      providerError = error;
      response.writeHead(500).end();
    }
  });
  await new Promise((resolve, reject) => {
    mock.once("error", reject);
    mock.listen(0, "127.0.0.1", resolve);
  });
  const mockAddress = mock.address();
  const env = {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
    ARE_DSH_WEB_PERMIT_PROBE_MARKER: marker,
    ARE_DSH_MOCK_BASE_URL: `http://127.0.0.1:${mockAddress.port}/v1`,
    ARE_DSH_MOCK_API_KEY: "local-test-only-not-a-secret"};
  let child;
  try {
    const dump = spawnSync(process.execPath, [DSH_ENTRY, "--profile", "web", "--patch", patch,
      "--patch", PROVIDER_PATCH, "--patch", READ_ONLY_PATCH, "--dump-config"],
    {encoding: "utf8", env});
    assert.equal(dump.status, 0, dump.stderr.slice(-1000));
    assert.ok(dump.stdout.includes(PROBE_PLUGIN), "permit controller must be mounted");
    child = spawn(process.execPath, [DSH_ENTRY, "--profile", "web", "--patch", patch,
      "--patch", PROVIDER_PATCH, "--patch", READ_ONLY_PATCH, "--no-open", "--port", "0"], {
      stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32", env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout = (stdout + chunk).slice(-8192); });
    child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-8192); });
    const deadline = Date.now() + 45_000;
    let launched;
    while (Date.now() < deadline && child.exitCode === null) {
      launched = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
      if (launched) break;
      await new Promise((done) => setTimeout(done, 50));
    }
    assert.ok(launched, `Web not ready (exit=${child.exitCode}; stderr=${stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]").slice(-1000)})`);
    const url = new URL(launched);
    assert.equal(url.hostname, "127.0.0.1");
    const login = await fetch(url, {redirect: "manual"});
    const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie, `token exchange failed: ${login.status}`);
    const rpc = async (method, request, rpcId) => {
      const response = await fetch(new URL(`/api/session/${method}`, url), {
        method: "POST", headers: {"content-type": "application/json", cookie, origin: url.origin},
        body: JSON.stringify({type: "client-request", rpcId, method: `session/${method}`,
          payload: {args: {request}}}),
      });
      assert.equal(response.status, 200, `${method}: HTTP response`);
      return response.json();
    };
    const created = await rpc("create", {}, "are-web-permit-create");
    assert.equal(created.result?.ok, true, `create: ${JSON.stringify(created.result)}`);
    const sessionId = created.result.value?.sessionId;
    assert.equal(typeof sessionId, "string");
    const before = await readFile(marker, "utf8");
    assert.match(before, /controller-mounted\nsession-guard-installed-at-prepare\ndenied:user\/message:surface-unbound-message\nsetup-window-write-denied\nsession-guard-installed-at-prepare\ndenied:user\/message:surface-unbound-message\nearly-listener-write-denied\nagent-generation-bound\n/u);
    const prompt = {sessionId, requestId: "are-web-permit-request", mode: "queue",
      content: [{type: "text", text: "explain this architecture"}]};
    const rawBody = JSON.stringify({type: "client-request", rpcId: "are-web-permit-unauthenticated",
      method: "session/prompt", payload: {args: {request: prompt}}});
    const unauthenticated = await fetch(new URL("/api/session/prompt", url), {method: "POST",
      headers: {"content-type": "application/json", origin: url.origin}, body: rawBody});
    assert.notEqual(unauthenticated.status, 200, "unauthenticated Web prompt must not reach ARE");
    const wrongOrigin = await fetch(new URL("/api/session/prompt", url), {method: "POST",
      headers: {"content-type": "application/json", cookie, origin: "http://untrusted.example"}, body: rawBody});
    assert.notEqual(wrongOrigin.status, 200, "foreign Origin must not reach ARE");
    const unknown = await rpc("prompt", {...prompt, requestId: "are-web-permit-no-route",
      content: [{type: "text", text: "zzzxqv"}]}, "are-web-permit-rpc-no-route");
    assert.equal(unknown.result?.ok, false, "ARE route gate must precede native insertion");
    assert.match(JSON.stringify(unknown.result), /dsh-web\.are-route-not-direct/u);
    assert.equal(await readFile(marker, "utf8"), before);
    assert.equal(requests, 0);
    const accepted = await rpc("prompt", prompt, "are-web-permit-rpc");
    assert.equal(accepted.result?.ok, true, `prompt: ${JSON.stringify(accepted.result)}`);
    assert.equal(accepted.result.value?.accepted, true);
    const replay = await rpc("prompt", prompt, "are-web-permit-rpc-replay");
    assert.equal(replay.result?.ok, false, "request key replay must fail closed");
    assert.match(JSON.stringify(replay.result), /dsh-web\.prompt-request-replayed/u);
    const modelDeadline = Date.now() + 15_000;
    while (requests < 1 && Date.now() < modelDeadline) await new Promise((done) => setTimeout(done, 50));
    assert.equal(requests, 1, `expected one local model request; marker=${await readFile(marker, "utf8")}; stderr=${stderr.slice(-1000)}`);
    assert.equal(providerError, null, String(providerError));
    let after = await readFile(marker, "utf8");
    const turnDeadline = Date.now() + 10_000;
    while (!after.includes("native-turn/end\n") && Date.now() < turnDeadline) {
      await new Promise((done) => setTimeout(done, 50));
      after = await readFile(marker, "utf8");
    }
    assert.ok(after.indexOf("native-inbox-inserted\n") >= 0
      && after.indexOf("native-inbox-inserted\n") < after.indexOf("are-prepared-native-ack\n"),
    `native insertion must precede ACK; marker=${after}`);
    assert.match(after, /native-turn\/start\n/u);
    assert.match(after, /native-turn\/end\n/u, `native turn did not finish; marker=${after}`);
  } finally {
    if (child && child.exitCode === null) {
      const signalChild = (signal) => {
        try {
          if (process.platform !== "win32" && Number.isSafeInteger(child.pid)) process.kill(-child.pid, signal);
          else child.kill(signal);
        } catch (error) { if (error?.code !== "ESRCH") throw error; }
      };
      signalChild("SIGTERM");
      await Promise.race([once(child, "exit"), new Promise((done) => setTimeout(done, 2000))]);
      if (child.exitCode === null) signalChild("SIGKILL");
    }
    await new Promise((done) => mock.close(done));
    await rm(home, {recursive: true, force: true});
  }
});
