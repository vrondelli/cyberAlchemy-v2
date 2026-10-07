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

for (const ackLoss of [false, true]) {
test(`authenticated Web cancel ${ackLoss ? "recovers lost ACK from native terminal" : "reconciles native terminal"}`,
  {timeout: 420_000}, async () => {
    const home = await mkdtemp(join(tmpdir(), "are-dsh-web-cancel-"));
    let providerRequests = 0;
    const providerBodies = [];
    const openResponses = new Set();
    const mock = createServer(async (request, response) => {
      try {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        assert.deepEqual(body.tools ?? [], []);
        providerRequests += 1;
        providerBodies.push(body);
        openResponses.add(response);
        response.on("close", () => openResponses.delete(response));
        response.writeHead(200, {"content-type": "text/event-stream"});
        response.write(": waiting for ARE cancellation\n\n");
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
          ARE_DSH_MOCK_API_KEY: "local-test-only-not-a-secret",
          ...(ackLoss ? {ARE_DSH_DROP_CANCEL_ACK: "1"} : {})}});
      let stdout = "";
      let stderr = "";
      const queued = [];
      let waiter;
      child.stdout.on("data", (chunk) => {stdout = (stdout + chunk).slice(-4096);});
      child.stderr.on("data", (chunk) => {stderr = (stderr + chunk).slice(-4096);});
      child.on("message", (message) => {
        if (message?.schema_version !== schema) return;
        if (waiter) {const resolve = waiter; waiter = null; resolve(message);}
        else queued.push(message);
      });
      child.on("exit", (code, signal) => {
        if (waiter) {const resolve = waiter; waiter = null;
          resolve({kind: "fatal", reason_code: `fixture-exited:${code ?? signal}:${stderr}`});}
      });
      const next = (waitingFor) => new Promise((resolve, reject) => {
        if (!queued.length && (child.exitCode !== null || child.signalCode !== null)) {
          reject(new Error(`Host exited before ${waitingFor}: ${stderr}`));
          return;
        }
        const timer = setTimeout(() => reject(new Error(`Host timed out (${waitingFor}): ${stderr}`)),
          waitingFor === "ready" ? 240_000 : 120_000);
        const finish = (message) => {clearTimeout(timer); resolve(message);};
        if (queued.length) finish(queued.shift());
        else waiter = finish;
      });
      const command = async (key, kind, extra = {}) => {
        child.send({schema_version: schema, request_key: key, command: kind, ...extra});
        const response = await next(key);
        assert.equal(response.kind, "response", response.reason_code ?? stderr);
        assert.equal(response.request_key, key);
        return response.result;
      };
      const ready = await next("ready");
      assert.equal(ready.kind, "ready", ready.reason_code ?? stderr);
      const webUrl = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
      assert.ok(webUrl, "qualified Host did not publish a loopback Web URL");
      const url = new URL(webUrl);
      const login = await fetch(url, {redirect: "manual"});
      const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
      assert.ok(cookie, `Web token exchange failed: ${login.status}`);
      const rpc = async (method, request, rpcId) => {
        const response = await fetch(new URL(`/api/session/${method}`, url), {
          method: "POST", headers: {"content-type": "application/json", cookie,
            origin: url.origin},
          body: JSON.stringify({type: "client-request", rpcId, method: `session/${method}`,
            payload: {args: {request}}}),
        });
        assert.equal(response.status, 200);
        return response.json();
      };
      const created = await rpc("create", {workspaceId: ready.workspace_id}, "cancel-create");
      assert.equal(created.result?.ok, true, JSON.stringify(created.result));
      const sessionId = created.result.value.sessionId;
      const idleCancel = await rpc("cancel", {sessionId}, "idle-cancel");
      assert.equal(idleCancel.result?.ok, false);
      const prompt = await rpc("prompt", {sessionId, requestId: "cancel-target", mode: "queue",
        content: [{type: "text", text: "explain ARE routing architecture"}]}, "cancel-prompt");
      assert.equal(prompt.result?.ok, true, JSON.stringify(prompt.result));
      const deadline = Date.now() + 30_000;
      while (providerRequests === 0 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(providerRequests, 1);
      const cancelled = await rpc("cancel", {sessionId}, "cancel-active");
      assert.equal(cancelled.result?.ok, !ackLoss, JSON.stringify(cancelled.result));
      if (ackLoss) assert.match(JSON.stringify(cancelled.result), /fixture-cancel-ack-lost/u);
      else assert.equal(cancelled.result.value?.accepted, true);
      let state;
      while (Date.now() < deadline) {
        state = await command(`cancel-state-${Date.now()}`, "session-state",
          {session_id: sessionId});
        if (state.turn_end_count > 0 && state.terminal_observations.length > 0
          && (!ackLoss || state.cancel_requests[0]?.status === "complete")) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(state?.turn_end_count, 1);
      const joined = assertOwnedModelContexts(state, providerBodies);
      assert.equal(joined[0].preparation.request_digest, state.prompt_requests[0].binding_digest);
      assert.equal(state.terminal_observations[0].turn_status, "interrupted");
      assert.equal(state.prompt_requests[0].status, "complete");
      assert.equal(state.cancel_requests.length, 1);
      assert.equal(state.cancel_requests[0].status, "complete", JSON.stringify({
        cancel: state.cancel_requests[0], terminal_count: state.terminal_observations.length,
        revocation: state.graph.first_revocation}));
      if (ackLoss) {
        assert.equal(state.cancel_requests[0].response
          .recovered_from_terminal_observation_digest,
        state.terminal_observations[0].observation_digest);
      }
      assert.equal(state.cancel_requests[0].target_request_digest,
        state.prompt_requests[0].binding_digest);
      assert.equal(providerRequests, 1);
      const drained = await command("cancel-drain", "dispose-agent", {session_id: sessionId});
      assert.equal(drained.binding_status, "draining", drained.reason_code);
      const released = await command("cancel-release", "release-agent", {session_id: sessionId});
      assert.equal(released.binding_status, "released", released.reason_code);
      if (ackLoss) {
        const compacted = await command("cancel-compact", "compact-gateway");
        assert.equal(compacted.ok, true, JSON.stringify(compacted));
      }
      const exited = once(child, "exit");
      assert.deepEqual(await command("cancel-stop", "dispose"), {disposed: true});
      await exited;
      if (ackLoss) {
        restarted = fork(fixture, [], {execArgv: [], stdio: ["ignore", "pipe", "pipe", "ipc"],
          env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
            ARE_DSH_HOST_MANIFEST: manifest,
            ARE_DSH_USE_JOURNAL_WORKER: "1",
            ARE_DSH_MOCK_BASE_URL: `http://127.0.0.1:${mock.address().port}/v1`,
            ARE_DSH_MOCK_API_KEY: "local-test-only-not-a-secret"}});
        let restartOutput = "";
        restarted.stdout.on("data", (chunk) => {
          restartOutput = (restartOutput + chunk).slice(-4096);
        });
        let restartError = "";
        restarted.stderr.on("data", (chunk) => {
          restartError = (restartError + chunk).slice(-4096);
        });
        const restart = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error(`restart timed out (pid=${restarted.pid}, exit=${restarted.exitCode}, signal=${restarted.signalCode}): ${restartError} ${restartOutput}`)),
            240_000);
          restarted.on("message", (message) => {
            if (message?.schema_version !== schema
              || !["fatal", "ready"].includes(message.kind)) return;
            clearTimeout(timer);
            resolve(message);
          });
          restarted.on("exit", (code, signal) => {
            clearTimeout(timer);
            reject(new Error(`restart exited ${code ?? signal}: ${restartError}`));
          });
        });
        assert.equal(restart.kind, "ready", restart.reason_code ?? restartError);
        const resumed = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error(`resume timed out: ${restartError}`)),
            120_000);
          restarted.on("message", (message) => {
            if (message?.schema_version !== schema || message.kind !== "response"
              || message.request_key !== "cancel-recovery-resume") return;
            clearTimeout(timer);
            resolve(message.result);
          });
          restarted.send({schema_version: schema, request_key: "cancel-recovery-resume",
            command: "resume-agent", session_id: sessionId});
        });
        assert.equal(resumed.resumed?.sessionId, sessionId, resumed.reason_code);
        assert.equal(resumed.resumed?.generation, 2);
      }
    } finally {
      if (child?.exitCode === null) child.kill("SIGTERM");
      if (restarted?.exitCode === null) restarted.kill("SIGTERM");
      for (const response of openResponses) response.destroy();
      mock.closeAllConnections();
      await new Promise((resolve) => mock.close(resolve));
      await rm(home, {recursive: true, force: true});
    }
  });
}
