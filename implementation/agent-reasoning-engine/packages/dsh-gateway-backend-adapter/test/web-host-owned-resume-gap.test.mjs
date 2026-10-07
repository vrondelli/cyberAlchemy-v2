import assert from "node:assert/strict";
import {fork} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const schema = "are.dsh-host-owned-graph-probe/v1";
const fixture = fileURLToPath(new URL("./fixtures/web-host-owned-graph-probe.mjs", import.meta.url));
const manifest = fileURLToPath(new URL("../config/dsh-web-are-host-owned-graph-manifest.v1.json", import.meta.url));

function launch(home) {
  const child = fork(fixture, [], {execArgv: [], stdio: ["ignore", "pipe", "pipe", "ipc"],
    env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
      ARE_DSH_HOST_MANIFEST: manifest}});
  const queued = [];
  let waiter;
  let stderr = "";
  child.stderr.on("data", (chunk) => {stderr = (stderr + chunk).slice(-4096);});
  child.stdout.resume();
  child.on("message", (message) => {
    if (message?.schema_version !== schema) return;
    if (waiter) {const resolve = waiter; waiter = null; resolve(message);}
    else queued.push(message);
  });
  child.on("exit", (code, signal) => {
    if (waiter) {const resolve = waiter; waiter = null;
      resolve({kind: "fatal", reason_code: `fixture-exited:${code ?? signal}:${stderr}`});}
  });
  const next = (waitingFor = "ready") => new Promise((resolve, reject) => {
    if (!queued.length && (child.exitCode !== null || child.signalCode !== null)) {
      reject(new Error(`Host exited before response: ${stderr}`));
      return;
    }
    const timer = setTimeout(() => reject(new Error(`Host response timed out (${waitingFor}): ${stderr}`)), 120_000);
    const finish = (message) => {clearTimeout(timer); resolve(message);};
    if (queued.length) finish(queued.shift());
    else waiter = finish;
  });
  return {child, next, command: async (request_key, command, extra = {}) => {
    child.send({schema_version: schema, request_key, command, ...extra});
    const response = await next(request_key);
    assert.equal(response.kind, "response", stderr);
    assert.equal(response.request_key, request_key);
    return response.result;
  }, stderr: () => stderr};
}

test("a valid unowned native append after release prevents Host resume and handover",
  {timeout: 300_000}, async () => {
    const home = await mkdtemp(join(tmpdir(), "are-dsh-resume-gap-"));
    let first;
    let second;
    try {
      first = launch(home);
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
      assert.equal(cursor.matched, true);
      const appended = await first.command("unowned-native-append", "append-unowned-marker",
        {session_id: sessionId});
      assert.equal(appended.appended, true, appended.reason_code);
      assert.equal(appended.event_count, cursor.native_event_count + 1);
      const firstExit = once(first.child, "exit");
      assert.deepEqual(await first.command("first-stop", "dispose"), {disposed: true});
      await firstExit;

      second = launch(home);
      const nextReady = await second.next();
      assert.equal(nextReady.kind, "ready", nextReady.reason_code ?? second.stderr());
      assert.equal(nextReady.receipt.state, "qualified");
      const rejected = await second.command("second-resume", "resume-agent",
        {session_id: sessionId});
      assert.equal(rejected.ok, false);
      assert.match(rejected.reason_code, /native-resume-cursor-mismatch/u);
      const summary = await second.command("second-summary", "binding-summary",
        {session_id: sessionId});
      assert.equal(summary.agent_live, false);
      assert.equal(summary.binding_event_kinds.filter((kind) => kind === "handed-over").length, 0);
      const secondExit = once(second.child, "exit");
      assert.deepEqual(await second.command("second-stop", "dispose"), {disposed: true});
      await secondExit;
    } finally {
      for (const item of [first, second]) {
        if (item?.child.exitCode === null) item.child.kill("SIGTERM");
      }
      await rm(home, {recursive: true, force: true});
    }
  });

test("a durable release survives abrupt exit and permits a second exact handover",
  {timeout: 420_000}, async () => {
    const home = await mkdtemp(join(tmpdir(), "are-dsh-released-crash-"));
    let first;
    let second;
    let third;
    try {
      first = launch(home);
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
      assert.equal(cursor.matched, true);
      const firstExit = once(first.child, "exit");
      first.child.kill("SIGKILL");
      const [code, signal] = await firstExit;
      assert.equal(code, null);
      assert.equal(signal, "SIGKILL");

      second = launch(home);
      const nextReady = await second.next();
      assert.equal(nextReady.kind, "ready", nextReady.reason_code ?? second.stderr());
      assert.equal(nextReady.receipt.state, "qualified");
      const resumed = await second.command("second-resume", "resume-agent",
        {session_id: sessionId});
      assert.equal(resumed.resumed?.sessionId, sessionId, resumed.reason_code);
      assert.equal(resumed.resumed?.generation, 2);
      assert.equal(resumed.binding?.status, "active");
      const summary = await second.command("second-summary", "binding-summary",
        {session_id: sessionId});
      assert.equal(summary.agent_live, true);
      assert.equal(summary.binding_event_kinds.filter((kind) => kind === "handed-over").length, 1);
      const secondDrained = await second.command("second-drain", "dispose-agent",
        {session_id: sessionId});
      assert.equal(secondDrained.binding_status, "draining", secondDrained.reason_code);
      const secondReleased = await second.command("second-release", "release-agent",
        {session_id: sessionId});
      assert.equal(secondReleased.binding_status, "released", secondReleased.reason_code);
      const secondCursor = await second.command("second-cursor", "inspect-release-cursor",
        {session_id: sessionId});
      assert.equal(secondCursor.matched, true);
      const secondExit = once(second.child, "exit");
      assert.deepEqual(await second.command("second-stop", "dispose"), {disposed: true});
      await secondExit;

      third = launch(home);
      const thirdReady = await third.next();
      assert.equal(thirdReady.kind, "ready", thirdReady.reason_code ?? third.stderr());
      const resumedAgain = await third.command("third-resume", "resume-agent",
        {session_id: sessionId});
      assert.equal(resumedAgain.resumed?.sessionId, sessionId, resumedAgain.reason_code);
      assert.equal(resumedAgain.resumed?.generation, 3);
      assert.equal(resumedAgain.binding?.status, "active");
      const thirdSummary = await third.command("third-summary", "binding-summary",
        {session_id: sessionId});
      assert.equal(thirdSummary.agent_live, true);
      assert.equal(thirdSummary.binding_event_kinds.filter((kind) => kind === "handed-over").length, 2);
      const thirdExit = once(third.child, "exit");
      assert.deepEqual(await third.command("third-stop", "dispose"), {disposed: true});
      await thirdExit;
    } finally {
      for (const item of [first, second, third]) {
        if (item?.child.exitCode === null) item.child.kill("SIGTERM");
      }
      await rm(home, {recursive: true, force: true});
    }
  });
