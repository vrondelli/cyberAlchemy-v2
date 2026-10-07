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

for (const attack of ["settings-default", "extra-tool", "preset-edit", "loader-reload", "preset-remount"]) {
test(`${attack} drift revokes qualified Host before Web prompt insertion`,
  {timeout: ["preset-edit", "loader-reload", "preset-remount"].includes(attack)
    ? 300_000 : 180_000}, async () => {
    const home = await mkdtemp(join(tmpdir(), "are-dsh-settings-race-"));
    const child = spawn(process.execPath, [fixture], {
      stdio: ["ignore", "pipe", "pipe", "ipc"],
      detached: process.platform !== "win32",
      env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
        ARE_DSH_USE_JOURNAL_WORKER: "1",
        ARE_DSH_HOST_MANIFEST: manifest,
        ...(attack === "preset-edit" ? {ARE_DSH_MUTABLE_PRESET: "1"} : {})},
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
      const deadline = Date.now() + (["preset-edit", "loader-reload", "preset-remount"].includes(attack)
        ? 240_000 : 120_000);
      let launched;
      while (Date.now() < deadline && child.exitCode === null) {
        launched = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
        if (launched && ready) break;
        await new Promise((done) => setTimeout(done, 50));
      }
      assert.ok(ready?.kind === "ready",
        `Host did not qualify: ${ready?.reason_code ?? stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]").slice(-1200)}`);
      assert.ok(launched);
      const url = new URL(launched);
      assert.equal(url.hostname, "127.0.0.1");
      const login = await fetch(url, {redirect: "manual"});
      const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
      assert.ok(cookie);
      const rpc = async (method, request, rpcId) => {
        const response = await fetch(new URL(`/api/session/${method}`, url), {
          method: "POST", headers: {"content-type": "application/json", cookie, origin: url.origin},
          body: JSON.stringify({type: "client-request", rpcId, method: `session/${method}`,
            payload: {args: {request}}}),
        });
        assert.equal(response.status, 200);
        return response.json();
      };
      const created = await rpc("create", {}, "settings-create");
      assert.equal(created.result?.ok, true, JSON.stringify(created.result));
      const sessionId = created.result.value.sessionId;
      const before = await command("before", "session-state", {session_id: sessionId});
      assert.equal(before.binding.status, "active");
      const changed = attack === "settings-default"
        ? await command("change", "change-default")
        : attack === "extra-tool"
          ? await command("change", "inject-extra-tool", {session_id: sessionId})
          : attack === "preset-edit"
            ? await command("change", "edit-preset")
            : attack === "loader-reload"
              ? await command("change", "reload-controller")
              : await command("change", "remount-preset", {session_id: sessionId});
      if (attack === "settings-default") {
        assert.equal(changed.default_id, "not-the-qualified-preset");
      } else if (attack === "extra-tool") {
        assert.deepEqual(changed.model_tool_names, ["are_fixture_extra"]);
      } else if (attack === "preset-edit") {
        assert.equal(changed.composition_changed, true);
      } else {
        assert.equal(changed.graph.state, "revoked");
      }
      const prompt = await rpc("prompt", {sessionId, requestId: "settings-race", mode: "queue",
        content: [{type: "text", text: "explain ARE routing architecture"}]}, "settings-race-rpc")
        .catch((error) => ({transport_error: String(error)}));
      if (["loader-reload", "preset-remount"].includes(attack)) {
        assert.notEqual(prompt.result?.ok, true);
      } else {
        assert.equal(prompt.result?.ok, false);
        assert.match(JSON.stringify(prompt.result), attack === "extra-tool"
          ? /agent-tool-catalog-drift/u : /fingerprint-drift|fingerprint\.drift/u);
      }
      const after = await command("after", "session-state", {session_id: sessionId});
      if (attack !== "preset-remount") assert.equal(after.event_count, before.event_count);
      assert.equal(after.user_message_count, 0);
      assert.equal(after.model_request_count, 0);
      assert.equal(after.graph.state, "revoked");
    } finally {
      if (child.connected && child.exitCode === null) await command("stop", "dispose").catch(() => {});
      if (child.exitCode === null) {
        signal("SIGTERM");
        await Promise.race([once(child, "exit"), new Promise((done) => setTimeout(done, 2_000))]);
        if (child.exitCode === null) signal("SIGKILL");
      }
      await rm(home, {recursive: true, force: true});
    }
  });
}
