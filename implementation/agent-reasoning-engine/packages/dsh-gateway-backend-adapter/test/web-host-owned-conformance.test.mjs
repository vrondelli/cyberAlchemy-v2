import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const schema = "are.dsh-host-owned-graph-probe/v1";
const fixture = fileURLToPath(new URL("./fixtures/web-host-owned-graph-probe.mjs", import.meta.url));
const manifest = fileURLToPath(new URL("../config/dsh-web-are-host-owned-graph-manifest.v1.json", import.meta.url));

test("qualified Host admits authenticated Web create and blocks unowned Web mutations",
  {timeout: 180_000}, async () => {
    const home = await mkdtemp(join(tmpdir(), "are-dsh-web-conformance-"));
    const child = spawn(process.execPath, [fixture], {
      stdio: ["ignore", "pipe", "pipe", "ipc"],
      detached: process.platform !== "win32",
      env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
        ARE_DSH_HOST_MANIFEST: manifest},
    });
    let stdout = "";
    let stderr = "";
    let ready;
    const pending = new Map();
    child.stdout.on("data", (chunk) => { stdout = (stdout + chunk).slice(-4096); });
    child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-4096); });
    child.on("message", (message) => {
      if (message?.schema_version !== schema) return;
      if (message.kind === "ready" || message.kind === "fatal") ready = message;
      if (message.kind === "response") {
        pending.get(message.request_key)?.(message.result);
        pending.delete(message.request_key);
      }
    });
    const command = (key, kind, extra = {}) => new Promise((resolveResult, reject) => {
      const timer = setTimeout(() => { pending.delete(key); reject(new Error(`${kind} timed out`)); }, 15_000);
      pending.set(key, (result) => { clearTimeout(timer); resolveResult(result); });
      child.send({schema_version: schema, request_key: key, command: kind, ...extra});
    });
    const signal = (name) => {
      try {
        if (process.platform !== "win32" && Number.isSafeInteger(child.pid)) process.kill(-child.pid, name);
        else child.kill(name);
      } catch (error) { if (error?.code !== "ESRCH") throw error; }
    };
    try {
      const deadline = Date.now() + 120_000;
      let launched;
      while (Date.now() < deadline && child.exitCode === null) {
        launched = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
        if (launched && ready) break;
        await new Promise((done) => setTimeout(done, 50));
      }
      assert.equal(ready?.kind, "ready", ready?.reason_code ?? stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]"));
      assert.ok(launched, "qualified Web Host did not publish a loopback URL");
      assert.equal(ready.receipt.state, "qualified");
      assert.match(ready.workspace_id, /^[0-9a-f-]+$/u);
      const url = new URL(launched);
      assert.equal(url.hostname, "127.0.0.1");
      const login = await fetch(url, {redirect: "manual"});
      const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
      assert.ok(cookie, `token exchange failed: ${login.status}`);
      const rpc = async (method, request, rpcId, headers = {}) => {
        const response = await fetch(new URL(`/api/session/${method}`, url), {
          method: "POST", headers: {"content-type": "application/json", cookie,
            origin: url.origin, ...headers},
          body: JSON.stringify({type: "client-request", rpcId, method: `session/${method}`,
            payload: {args: method === "modelCatalog" ? {}
              : method === "list" ? {_request: request} : {request}}}),
        });
        return {status: response.status, body: await response.json().catch(() => null)};
      };
      const workspaceRpc = async (method, request, rpcId) => {
        const response = await fetch(new URL(`/api/workspace/${method}`, url), {
          method: "POST", headers: {"content-type": "application/json", cookie,
            origin: url.origin},
          body: JSON.stringify({type: "client-request", rpcId,
            method: `workspace/${method}`, payload: {args: {request}}}),
        });
        return {status: response.status, body: await response.json().catch(() => null)};
      };
      const unauth = await rpc("create", {}, "unauth-create", {cookie: ""});
      assert.notEqual(unauth.status, 200);
      const wrongOrigin = await rpc("create", {}, "wrong-origin-create", {origin: "http://untrusted.example"});
      assert.notEqual(wrongOrigin.status, 200);
      const chosen = await rpc("create", {sessionId: "caller-chosen"}, "chosen-create");
      assert.equal(chosen.status, 200);
      assert.equal(chosen.body?.result?.ok, false);
      assert.match(JSON.stringify(chosen.body?.result), /dsh-web\.create-request-not-fresh/u);
      const foreignWorkspace = await rpc("create", {workspaceId: "foreign-workspace"},
        "foreign-workspace-create");
      assert.equal(foreignWorkspace.body?.result?.ok, false);
      const blankSelect = await rpc("selectModel", {sessionId: "", provider: "fake", model: "fake"}, "blank-select");
      assert.equal(blankSelect.status, 200);
      assert.equal(blankSelect.body?.result?.ok, false);
      const emptyList = await rpc("list", {}, "empty-list");
      assert.equal(emptyList.body?.result?.ok, true);
      assert.deepEqual(emptyList.body.result.value.items, []);
      const modelCatalog = await rpc("modelCatalog", {}, "host-model-catalog");
      assert.equal(modelCatalog.body?.result?.ok, true, JSON.stringify(modelCatalog.body?.result));
      assert.equal(modelCatalog.body.result.value.groups.length, 1);
      assert.deepEqual(modelCatalog.body.result.value.routableProviders,
        [modelCatalog.body.result.value.default.provider]);
      const created = await rpc("create", {workspaceId: ready.workspace_id}, "fresh-create");
      assert.equal(created.status, 200);
      assert.equal(created.body?.result?.ok, true, JSON.stringify(created.body?.result));
      const sessionId = created.body.result.value.sessionId;
      const workspaceBaseline = await command("owned-workspace-baseline", "workspace-baseline");
      assert.equal(workspaceBaseline.type, "baseline");
      assert.deepEqual(workspaceBaseline.value.items.map((item) => item.workspaceId),
        [ready.workspace_id]);
      assert.deepEqual(workspaceBaseline.value.items[0].sessionIds, [sessionId]);
      assert.deepEqual(workspaceBaseline.value.archivedSessionIds, []);
      for (const [method, request] of [
        ["create", {path: home}],
        ["rename", {workspaceId: ready.workspace_id, title: "Caller rename"}],
        ["delete", {workspaceId: ready.workspace_id}],
        ["insertBefore", {workspaceId: ready.workspace_id}],
        ["archiveSession", {sessionId}],
      ]) {
        const rejected = await workspaceRpc(method, request, `workspace-${method}-blocked`);
        assert.equal(rejected.status, 200, method);
        assert.equal(rejected.body?.result?.ok, false, method);
        assert.match(JSON.stringify(rejected.body?.result),
          /dsh-web\.workspace-mutation-not-qualified/u, method);
      }
      const listed = await rpc("list", {}, "owned-list");
      assert.equal(listed.body?.result?.ok, true);
      assert.deepEqual(listed.body.result.value.items.map((item) => item.sessionId), [sessionId]);
      assert.deepEqual(Object.keys(listed.body.result.value.items[0]).sort(),
        ["blank", "projections", "running", "sessionId", "updatedAt"]);
      assert.deepEqual(listed.body.result.value.items[0].projections.values,
        {modelSelection: {next: null}});
      const emptyPage = await rpc("page", {address: {kind: "session", sessionId},
        throughSeq: -1}, "empty-owned-page");
      assert.equal(emptyPage.body?.result?.ok, true, JSON.stringify(emptyPage.body?.result));
      assert.deepEqual(emptyPage.body.result.value.records, []);
      const foreignPage = await rpc("page", {address: {kind: "session",
        sessionId: "foreign-session"}, throughSeq: -1}, "foreign-page-denied");
      assert.equal(foreignPage.body?.result?.ok, false);
      const opening = await command("owned-follow", "follow-snapshot", {session_id: sessionId});
      assert.equal(opening.type, "snapshot");
      assert.equal(opening.header.id, sessionId);
      assert.deepEqual(opening.projections.values, {modelSelection: {next: null}});
      assert.deepEqual(opening.assistantStream, {revision: 0});
      assert.equal(opening.header.cwd, undefined);
      const control = await command("owned-control", "control-baseline");
      assert.equal(control.type, "baseline");
      assert.deepEqual(Object.keys(control.value.queues), [sessionId]);
      assert.deepEqual(control.value.queues[sessionId], []);
      assert.deepEqual(control.value.jobs[sessionId], []);
      assert.deepEqual(control.value.projections[sessionId].values,
        {modelSelection: {next: null}});
      assert.match(sessionId, /^session-[0-9a-f-]+$/u);
      const before = await command("state-before", "session-state", {session_id: sessionId});
      assert.equal(before.binding.status, "active");
      assert.equal(before.graph.epoch, 2);
      assert.deepEqual(before.model_tool_names, []);
      const alternateInbox = await command("alternate-inbox", "attempt-alternate-inbox",
        {session_id: sessionId});
      for (const [name, result] of Object.entries(alternateInbox.attempts)) {
        assert.equal(result.rejected, true, name);
        assert.equal(result.reason_code, "session append admission denied", name);
      }
      assert.equal(alternateInbox.event_count_after, alternateInbox.event_count_before);
      assert.equal(alternateInbox.inbox_count, 0);
      assert.equal(alternateInbox.graph.state, "qualified");
      const select = await rpc("selectModel", {sessionId, provider: "fake", model: "fake"}, "select-blocked");
      assert.equal(select.status, 200);
      assert.equal(select.body?.result?.ok, false);
      const prompt = await rpc("prompt", {sessionId, requestId: "unknown-route",
        mode: "queue", content: [{type: "text", text: "zzzxqv"}]}, "prompt-blocked");
      assert.equal(prompt.status, 200);
      assert.equal(prompt.body?.result?.ok, false);
      const after = await command("state-after", "session-state", {session_id: sessionId});
      assert.equal(after.event_count, before.event_count);
      assert.equal(after.user_message_count, 0);
      assert.equal(after.model_request_count, 0);
      assert.equal(after.graph.state, "qualified");
      const injected = await command("direct-plugin", "inject-direct-plugin");
      assert.equal(injected.rejected, true);
      assert.equal(injected.graph.state, "revoked");
    } finally {
      if (child.connected && child.exitCode === null) {
        await command("stop", "dispose").catch(() => {});
      }
      if (child.exitCode === null) {
        signal("SIGTERM");
        await Promise.race([once(child, "exit"), new Promise((done) => setTimeout(done, 2_000))]);
        if (child.exitCode === null) signal("SIGKILL");
      }
      await rm(home, {recursive: true, force: true});
    }
  });
