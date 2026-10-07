import assert from "node:assert/strict";
import {fork} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, rm} from "node:fs/promises";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const schema = "are.dsh-host-owned-graph-probe/v1";
const fixture = fileURLToPath(new URL("./fixtures/web-host-owned-graph-probe.mjs", import.meta.url));
const manifest = fileURLToPath(new URL("../config/dsh-web-are-host-owned-canary-graph-manifest.v1.json", import.meta.url));

function launch(home, mockBaseUrl) {
  const child = fork(fixture, [], {execArgv: [], stdio: ["ignore", "pipe", "pipe", "ipc"],
    env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
      ARE_DSH_USE_JOURNAL_WORKER: "1",
      ARE_DSH_HOST_MANIFEST: manifest,
      ARE_DSH_MOCK_BASE_URL: mockBaseUrl,
      ARE_DSH_MOCK_API_KEY: "local-test-only-not-a-secret"}});
  const queued = [];
  let waiter;
  let stderr = "";
  let stdout = "";
  child.stderr.on("data", (chunk) => {stderr = (stderr + chunk).slice(-4096);});
  child.stdout.on("data", (chunk) => {stdout = (stdout + chunk).slice(-4096);});
  child.on("message", (message) => {
    if (message?.schema_version !== schema) return;
    if (waiter) {const resolve = waiter; waiter = null; resolve(message);}
    else queued.push(message);
  });
  child.on("exit", (code, signal) => {
    if (waiter) {const resolve = waiter; waiter = null;
      resolve({kind: "fatal", reason_code: `fixture-exited:${code ?? signal}:${stderr}`});}
  });
  const next = () => new Promise((resolve, reject) => {
    if (!queued.length && (child.exitCode !== null || child.signalCode !== null)) {
      reject(new Error(`Host exited before response: ${stderr}`));
      return;
    }
    const timer = setTimeout(() => reject(new Error(`Host response timed out: ${stderr}`)), 120_000);
    const finish = (message) => {clearTimeout(timer); resolve(message);};
    if (queued.length) finish(queued.shift());
    else waiter = finish;
  });
  return {child, next, command: async (request_key, command, extra = {}) => {
    child.send({schema_version: schema, request_key, command, ...extra});
    const response = await next();
    assert.equal(response.kind, "response", stderr);
    assert.equal(response.request_key, request_key);
    return response.result;
  }, stderr: () => stderr,
  webUrl: () => stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1]};
}

test("a cleanly released DSH writer resumes its old Session through a fresh Host",
  {timeout: 300_000}, async () => {
    const home = await mkdtemp(join(tmpdir(), "are-dsh-clean-handover-"));
    let providerRequests = 0;
    const mock = createServer(async (request, response) => {
      try {
        assert.equal(request.method, "POST");
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        assert.deepEqual((body.tools ?? []).map((tool) => tool.function?.name ?? tool.name), []);
        providerRequests += 1;
        const event = {id: "are-resumed-turn", object: "chat.completion.chunk", model: body.model,
          choices: [{index: 0, delta: {role: "assistant", content: "resumed qualified reply"},
            finish_reason: "stop"}],
          usage: {prompt_tokens: 8, completion_tokens: 5, total_tokens: 13}};
        response.writeHead(200, {"content-type": "text/event-stream"});
        response.end(`data: ${JSON.stringify(event)}\n\ndata: [DONE]\n\n`);
      } catch {
        response.writeHead(500).end();
      }
    });
    let first;
    let second;
    try {
      await new Promise((resolve, reject) => {
        mock.once("error", reject);
        mock.listen(0, "127.0.0.1", resolve);
      });
      const mockBaseUrl = `http://127.0.0.1:${mock.address().port}/v1`;
      first = launch(home, mockBaseUrl);
      const ready = await first.next();
      assert.equal(ready.kind, "ready", ready.reason_code ?? first.stderr());
      const created = await first.command("first-create", "create", {request: {}});
      assert.equal(created.binding.status, "active");
      const sessionId = created.created.sessionId;
      const drained = await first.command("first-drain", "dispose-agent", {session_id: sessionId});
      assert.equal(drained.binding_status, "draining", drained.reason_code);
      const released = await first.command("first-release", "release-agent", {session_id: sessionId});
      assert.equal(released.binding_status, "released", released.reason_code);
      const cursor = await first.command("first-cursor", "inspect-release-cursor",
        {session_id: sessionId});
      assert.equal(cursor.matched, true, `the release record must match persisted native history: ${JSON.stringify(cursor)}`);
      const firstExit = once(first.child, "exit");
      assert.deepEqual(await first.command("first-stop", "dispose"), {disposed: true});
      await firstExit;

      second = launch(home, mockBaseUrl);
      const nextReady = await second.next();
      assert.equal(nextReady.kind, "ready", nextReady.reason_code ?? second.stderr());
      assert.equal(nextReady.receipt.state, "qualified");
      const resumed = await second.command("second-resume", "resume-agent", {session_id: sessionId});
      assert.equal(resumed.binding?.status, "active", resumed.reason_code);
      assert.equal(resumed.resumed?.generation, 2);
      assert.equal(resumed.resumed?.sessionId, sessionId);
      const webUrl = second.webUrl();
      assert.ok(webUrl, "resumed Host did not publish a loopback Web URL");
      const url = new URL(webUrl);
      assert.equal(url.hostname, "127.0.0.1");
      const login = await fetch(url, {redirect: "manual"});
      const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
      assert.ok(cookie, `Web token exchange failed: ${login.status}`);
      const rpc = async (method, request, rpcId) => {
        const response = await fetch(new URL(`/api/session/${method}`, url), {
          method: "POST", headers: {"content-type": "application/json", cookie, origin: url.origin},
          body: JSON.stringify({type: "client-request", rpcId, method: `session/${method}`,
            payload: {args: method === "list" ? {_request: request} : {request}}}),
        });
        assert.equal(response.status, 200);
        return response.json();
      };
      const listed = await rpc("list", {}, "after-resume-list");
      assert.equal(listed.result?.ok, true, JSON.stringify(listed.result));
      assert.ok(listed.result.value.items.some((item) => item.sessionId === sessionId));
      const prompt = await rpc("prompt", {sessionId, requestId: "after-resume", mode: "queue",
        content: [{type: "text", text: "explain ARE routing architecture"}]}, "after-resume-prompt");
      assert.equal(prompt.result?.ok, true, JSON.stringify(prompt.result));
      assert.equal(prompt.result.value?.accepted, true);
      const turnDeadline = Date.now() + 30_000;
      let state;
      while (Date.now() < turnDeadline) {
        state = await second.command(`resumed-state-${Date.now()}`, "session-state",
          {session_id: sessionId});
        if (state.turn_end_count > 0 && providerRequests > 0) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(providerRequests, 1);
      assert.equal(state.turn_end_count, 1);
      assert.equal(state.user_message_count, 1);
      assert.equal(state.prompt_requests.at(-1).status, "complete");
      assert.equal(state.terminal_observations.at(-1).turn_status, "completed");
      assert.equal(state.graph.state, "qualified");
      const page = await rpc("page", {address: {kind: "session", sessionId},
        throughSeq: state.event_count - 1, maxMessages: 50}, "after-resume-page");
      assert.equal(page.result?.ok, true, JSON.stringify(page.result));
      const visible = page.result.value.records
        .filter((record) => ["user/message", "assistant/message"].includes(record.event.type));
      assert.equal(visible.filter((record) => record.event.type === "user/message").length, 1);
      assert.equal(visible.filter((record) => record.event.type === "assistant/message").length, 1);
      assert.match(JSON.stringify(visible), /resumed qualified reply/u);
      assert.doesNotMatch(JSON.stringify(page.result.value), /reasoning|replayState|request\/context/u);
      const nextCreated = await second.command("next-create", "create", {request: {}});
      assert.equal(nextCreated.binding.status, "active", nextCreated.reason_code);
      assert.notEqual(nextCreated.created.sessionId, sessionId);
      const secondExit = once(second.child, "exit");
      assert.deepEqual(await second.command("second-stop", "dispose"), {disposed: true});
      await secondExit;
    } finally {
      for (const item of [first, second]) {
        if (item?.child.exitCode === null) item.child.kill("SIGTERM");
      }
      await rm(home, {recursive: true, force: true});
      await new Promise((resolve) => mock.close(resolve));
    }
  });
