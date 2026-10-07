import assert from "node:assert/strict";
import {fork} from "node:child_process";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import test from "node:test";

const schema = "are.dsh-host-owned-graph-probe/v1";

test("qualified disposable Web Host binds two fresh native Agents and rejects caller identity", async () => {
  const home = mkdtempSync(join(tmpdir(), "are-dsh-host-owned-test-"));
  const child = fork(resolve("test/fixtures/web-host-owned-graph-probe.mjs"), [], {
    execArgv: [], stdio: ["ignore", "pipe", "pipe", "ipc"],
    env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
      ARE_DSH_HOST_MANIFEST: resolve("config/dsh-web-are-host-owned-graph-manifest.v1.json")},
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-2048); });
  const messages = [];
  let pending;
  let childFailure;
  const rejectPending = error => {
    childFailure = error;
    if (pending) { pending.reject(error); pending = undefined; }
  };
  child.on("error", error => rejectPending(error));
  child.on("exit", (code, signal) => rejectPending(new Error(
    `DSH Host probe exited (${code ?? signal}): ${stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]")}`)));
  child.on("message", (message) => {
    if (message?.schema_version !== schema) return;
    if (pending) { const resolvePending = pending.resolve; pending = undefined; resolvePending(message); }
    else messages.push(message);
  });
  const next = () => new Promise((resolveMessage, rejectMessage) => {
    if (messages.length) resolveMessage(messages.shift());
    else if (childFailure) rejectMessage(childFailure);
    else pending = {resolve: resolveMessage, reject: rejectMessage};
  });
  const send = async (request_key, command, request) => {
    child.send({schema_version: schema, request_key, command, request});
    const message = await next();
    assert.equal(message.kind, "response", stderr);
    assert.equal(message.request_key, request_key);
    return message.result;
  };
  const timeout = setTimeout(() => {
    rejectPending(new Error("DSH Host probe timed out before responding"));
    child.kill("SIGTERM");
  }, 180_000);
  try {
    const ready = await next();
    assert.equal(ready.kind, "ready", stderr);
    assert.equal(ready.receipt.state, "qualified");
    assert.equal(ready.receipt.epoch, 1);
    assert.equal(ready.host_observation.structure.counts.unknown, 0);
    const alternateWriters = await send("alternate-writers", "alternate-writer-services");
    assert.equal(alternateWriters.subagents, false);
    assert.equal(alternateWriters.dynamic_cordis_runner, false);
    assert.equal(alternateWriters.graph.state, "qualified");
    const rejected = await send("reject-identity", "create", {sessionId: "caller-chosen"});
    assert.equal(rejected.reason_code, "dsh-web.create-request-not-fresh");
    const first = await send("first", "create", {});
    assert.equal(first.binding.status, "active");
    assert.equal(first.graph.state, "qualified");
    assert.equal(first.graph.epoch, 2);
    assert.equal(first.observation.structure.counts.unknown, 0);
    const second = await send("second", "create", {});
    assert.ok(second.created, second.reason_code);
    assert.notEqual(second.created.sessionId, first.created.sessionId);
    assert.equal(second.binding.status, "active");
    assert.equal(second.graph.epoch, 3);
    assert.equal(second.observation.structure.counts.unknown, 0);
    assert.deepEqual(await send("stop", "dispose"), {disposed: true});
  } finally {
    clearTimeout(timeout);
    if (child.connected) child.disconnect();
    if (child.exitCode === null) child.kill("SIGTERM");
    rmSync(home, {recursive: true, force: true});
  }
});
