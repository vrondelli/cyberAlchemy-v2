import assert from "node:assert/strict";
import {fork} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, rm} from "node:fs/promises";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {assertOwnedModelContexts} from "./fixtures/owned-model-context.mjs";

const schema = "are.dsh-host-owned-graph-probe/v1";
const fixture = fileURLToPath(new URL("./fixtures/web-host-owned-graph-probe.mjs", import.meta.url));
const manifest = fileURLToPath(new URL("../config/dsh-web-are-host-owned-canary-graph-manifest.v1.json", import.meta.url));

test("authenticated Web edits, removes, dispatches an edited prompt, then resumes",
  {timeout: 420_000}, async () => {
    const home = await mkdtemp(join(tmpdir(), "are-dsh-web-queue-remove-"));
    let providerRequests = 0;
    const providerBodies = [];
    let heldResponse;
    const mock = createServer(async (request, response) => {
      try {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        assert.deepEqual(body.tools ?? [], []);
        providerRequests += 1;
        providerBodies.push(body);
        response.writeHead(200, {"content-type": "text/event-stream"});
        if (providerRequests === 1) {
          heldResponse = response;
          response.write(": waiting for queued mutation\n\n");
        } else {
          const chunk = {id: "are-local-edited", object: "chat.completion.chunk",
            model: body.model, choices: [{index: 0,
              delta: {role: "assistant", content: "edited prompt done"},
              finish_reason: "stop"}]};
          response.end(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`);
        }
      } catch {
        response.writeHead(500).end();
      }
    });
    let child;
    let restarted;
    try {
      await new Promise((resolve, reject) => {
        mock.once("error", reject);
        mock.listen(0, "127.0.0.1", resolve);
      });
      child = fork(fixture, [], {execArgv: [], stdio: ["ignore", "pipe", "pipe", "ipc"],
        env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
          ARE_DSH_HOST_MANIFEST: manifest,
          ARE_DSH_USE_JOURNAL_WORKER: "1",
          ARE_DSH_MOCK_BASE_URL: `http://127.0.0.1:${mock.address().port}/v1`,
          ARE_DSH_MOCK_API_KEY: "local-test-only-not-a-secret"}});
      let stdout = "";
      let stderr = "";
      const pending = new Map();
      let ready;
      child.stdout.on("data", (chunk) => {stdout = (stdout + chunk).slice(-4096);});
      child.stderr.on("data", (chunk) => {stderr = (stderr + chunk).slice(-4096);});
      child.on("message", (message) => {
        if (message?.schema_version !== schema) return;
        if (["ready", "fatal"].includes(message.kind)) ready = message;
        if (message.kind === "response") {
          pending.get(message.request_key)?.(message.result);
          pending.delete(message.request_key);
        }
      });
      const command = (key, kind, extra = {}) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => {pending.delete(key); reject(new Error(`${kind} timed out: ${stderr}`));}, 30_000);
        pending.set(key, (result) => {clearTimeout(timer); resolve(result);});
        child.send({schema_version: schema, request_key: key, command: kind, ...extra});
      });
      const deadline = Date.now() + 240_000;
      while (!ready && child.exitCode === null && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(ready?.kind, "ready", ready?.reason_code ?? stderr);
      const webUrl = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
      assert.ok(webUrl, "qualified Host did not publish a loopback Web URL");
      const url = new URL(webUrl);
      const login = await fetch(url, {redirect: "manual"});
      const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
      assert.ok(cookie, `Web token exchange failed: ${login.status}`);
      const rpc = async (method, request, rpcId) => {
        const response = await fetch(new URL(`/api/session/${method}`, url), {
          method: "POST", headers: {"content-type": "application/json", cookie, origin: url.origin},
          body: JSON.stringify({type: "client-request", rpcId, method: `session/${method}`,
            payload: {args: {request}}}),
        });
        assert.equal(response.status, 200);
        return response.json();
      };
      const created = await rpc("create", {workspaceId: ready.workspace_id}, "remove-create");
      assert.equal(created.result?.ok, true, JSON.stringify(created.result));
      const sessionId = created.result.value.sessionId;
      const first = await rpc("prompt", {sessionId, requestId: "first-turn", mode: "queue",
        content: [{type: "text", text: "explain ARE routing architecture"}]}, "first-turn-rpc");
      assert.equal(first.result?.ok, true, JSON.stringify(first.result));
      const requestDeadline = Date.now() + 30_000;
      while (providerRequests === 0 && Date.now() < requestDeadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(providerRequests, 1);
      const second = await rpc("prompt", {sessionId, requestId: "queued-second", mode: "queue",
        content: [{type: "text", text: "New task: explain the queue"}]}, "queued-second-rpc");
      assert.equal(second.result?.ok, true, JSON.stringify(second.result));
      const before = await command("remove-before", "session-state", {session_id: sessionId});
      assert.equal(before.pending_queue_item_ids.length, 1);
      const itemId = before.pending_queue_item_ids[0];
      const denied = await rpc("updateQueue", {sessionId, itemId,
        action: {kind: "edit", content: []}}, "queue-edit-empty-denied");
      assert.equal(denied.result?.ok, false);
      const edited = await rpc("updateQueue", {sessionId, itemId,
        action: {kind: "edit", content: [{type: "text", text: "New task: explain the revised queue"}]}},
      "queue-edit-rpc");
      assert.equal(edited.result?.ok, true, JSON.stringify(edited.result));
      const afterEdit = await command("edit-after", "session-state", {session_id: sessionId});
      assert.deepEqual(afterEdit.pending_queue_item_ids, [itemId]);
      assert.equal(afterEdit.queue_edit_requests.length, 1);
      assert.equal(afterEdit.queue_edit_requests[0].status, "complete");
      assert.equal(afterEdit.queue_edit_observations.length, 1);
      assert.equal(afterEdit.queue_edit_observations[0].content_digest,
        afterEdit.queue_edit_requests[0].content_digest);
      const removed = await rpc("updateQueue", {sessionId, itemId,
        action: {kind: "remove"}}, "queue-remove-rpc");
      assert.equal(removed.result?.ok, true, JSON.stringify(removed.result));
      assert.equal(removed.result.value?.accepted, true);
      const after = await command("remove-after", "session-state", {session_id: sessionId});
      assert.deepEqual(after.pending_queue_item_ids, []);
      assert.equal(after.queue_remove_requests.length, 1);
      assert.equal(after.queue_remove_requests[0].status, "complete");
      assert.equal(after.queue_remove_observations.length, 1);
      assert.equal(after.queue_remove_observations[0].target_request_digest,
        after.prompt_requests[1].binding_digest);
      const replay = await rpc("updateQueue", {sessionId, itemId,
        action: {kind: "remove"}}, "queue-remove-replay");
      assert.equal(replay.result?.ok, false);
      const third = await rpc("prompt", {sessionId, requestId: "queued-third", mode: "queue",
        content: [{type: "text", text: "New task: explain the original third prompt"}]}, "queued-third-rpc");
      assert.equal(third.result?.ok, true, JSON.stringify(third.result));
      const thirdPending = await command("third-pending", "session-state", {session_id: sessionId});
      assert.equal(thirdPending.pending_queue_item_ids.length, 1);
      const thirdItemId = thirdPending.pending_queue_item_ids[0];
      const thirdEdit = await rpc("updateQueue", {sessionId, itemId: thirdItemId,
        action: {kind: "edit", content: [{type: "text", text: "New task: explain the revised third prompt"}]}},
      "third-edit-rpc");
      assert.equal(thirdEdit.result?.ok, true, JSON.stringify(thirdEdit.result));
      const chunk = {id: "are-local-queue", object: "chat.completion.chunk", model: "local",
        choices: [{index: 0, delta: {role: "assistant", content: "first done"},
          finish_reason: "stop"}]};
      heldResponse.end(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`);
      let settled;
      const turnDeadline = Date.now() + 30_000;
      while (Date.now() < turnDeadline) {
        settled = await command(`remove-settled-${Date.now()}`, "session-state", {session_id: sessionId});
        if (settled.turn_end_count === 2 && settled.terminal_observations.length === 2) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(settled?.turn_end_count, 2);
      assert.equal(settled.user_message_count, 2);
      assert.equal(providerRequests, 2);
      assert.equal(settled.queue_edit_requests.length, 2);
      assert.equal(settled.queue_edit_observations.length, 2);
      assert.match(JSON.stringify(providerBodies[1]), /explain the revised third prompt/u);
      assert.doesNotMatch(JSON.stringify(providerBodies[1]), /explain the original third prompt/u);
      const joined = assertOwnedModelContexts(settled, providerBodies);
      assert.equal(joined[1].preparation.request_digest,
        settled.queue_edit_requests[1].binding_digest);
      assert.notEqual(joined[1].preparation.request_digest,
        settled.prompt_requests[2].binding_digest);
      assert.ok(joined.every(item => item.context.objective.requirement_snapshot === null));
      const removedBindings = [settled.prompt_requests[1].binding_digest,
        settled.queue_edit_requests[0].binding_digest];
      assert.ok(joined.every(item => item.entry.preparation_bindings
        .every(binding => !removedBindings.includes(binding.request_digest))),
      "removed prompt and edit must not enter a later model request");
      assert.equal((await command("remove-drain", "dispose-agent", {session_id: sessionId})).binding_status,
        "draining");
      assert.equal((await command("remove-release", "release-agent", {session_id: sessionId})).binding_status,
        "released");
      assert.equal((await command("remove-compact", "compact-gateway")).ok, true);
      const exited = once(child, "exit");
      assert.deepEqual(await command("remove-stop", "dispose"), {disposed: true});
      await exited;
      restarted = fork(fixture, [], {execArgv: [], stdio: ["ignore", "pipe", "pipe", "ipc"],
        env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
          ARE_DSH_HOST_MANIFEST: manifest,
          ARE_DSH_USE_JOURNAL_WORKER: "1",
          ARE_DSH_MOCK_BASE_URL: `http://127.0.0.1:${mock.address().port}/v1`,
          ARE_DSH_MOCK_API_KEY: "local-test-only-not-a-secret"}});
      let restartError = "";
      restarted.stderr.on("data", (chunk) => {
        restartError = (restartError + chunk).slice(-4096);
      });
      const restartedReady = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`restart timed out: ${restartError}`)), 240_000);
        restarted.on("message", (message) => {
          if (message?.schema_version !== schema
            || !["ready", "fatal"].includes(message.kind)) return;
          clearTimeout(timer);
          resolve(message);
        });
        restarted.on("exit", (code, signal) => {
          clearTimeout(timer);
          reject(new Error(`restart exited ${code ?? signal}: ${restartError}`));
        });
      });
      assert.equal(restartedReady.kind, "ready", restartedReady.reason_code ?? restartError);
      const resumed = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`resume timed out: ${restartError}`)), 120_000);
        restarted.on("message", (message) => {
          if (message?.schema_version !== schema || message.kind !== "response"
            || message.request_key !== "remove-resume") return;
          clearTimeout(timer);
          resolve(message.result);
        });
        restarted.send({schema_version: schema, request_key: "remove-resume",
          command: "resume-agent", session_id: sessionId});
      });
      assert.equal(resumed.resumed?.sessionId, sessionId, resumed.reason_code);
      assert.equal(resumed.resumed?.generation, 2);
    } finally {
      if (child?.exitCode === null) child.kill("SIGTERM");
      if (restarted?.exitCode === null) restarted.kill("SIGTERM");
      heldResponse?.destroy();
      mock.closeAllConnections();
      await new Promise((resolve) => mock.close(resolve));
      await rm(home, {recursive: true, force: true});
    }
  });
