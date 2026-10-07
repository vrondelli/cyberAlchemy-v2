import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const SCHEMA = "are.dsh-effective-graph-observer/v1";
const OBSERVER = fileURLToPath(new URL("./fixtures/web-effective-graph-observer.mjs", import.meta.url));
const EXPECTED_BEFORE = {
  "host-primary": 128,
  "host-nested": 43,
  "preset-primary": 0,
  "preset-group-primary": 0,
  "preset-nested": 0,
  "bootstrap-loader": 1,
  "bootstrap-isolate": 1,
  unknown: 0,
};
const EXPECTED_AFTER = {
  "host-primary": 128,
  "host-nested": 48,
  "preset-primary": 14,
  "preset-group-primary": 3,
  "preset-nested": 13,
  "bootstrap-loader": 1,
  "bootstrap-isolate": 1,
  unknown: 0,
};
const EXPECTED_DELTA = {
  "host-primary": 0,
  "host-nested": 5,
  "preset-primary": 14,
  "preset-group-primary": 3,
  "preset-nested": 13,
  "bootstrap-loader": 0,
  "bootstrap-isolate": 0,
  unknown: 0,
};

function redacted(value) {
  return value.replaceAll(/token=[^\s]+/gu, "token=[redacted]").slice(-1600);
}

async function startObservedHost(prefix) {
  const home = await mkdtemp(join(tmpdir(), prefix));
  const child = spawn(process.execPath, [OBSERVER], {
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    detached: process.platform !== "win32",
    env: {
      ...process.env,
      DSH_HOME: home,
      DSH_TELEMETRY_DISABLED: "1",
      NO_COLOR: "1",
    },
  });
  let stdout = "";
  let stderr = "";
  let ready = false;
  let fatal;
  let requestCounter = 0;
  const pending = new Map();
  child.stdout.on("data", (chunk) => {
    stdout = (stdout + chunk.toString("utf8")).slice(-8192);
  });
  child.stderr.on("data", (chunk) => {
    stderr = (stderr + chunk.toString("utf8")).slice(-8192);
  });
  child.on("message", (message) => {
    if (!message || message.schema_version !== SCHEMA) return;
    if (message.kind === "ready") ready = true;
    if (message.kind === "fatal") fatal = message.reason_code;
    if (message.kind !== "response") return;
    const waiter = pending.get(message.request_key);
    if (waiter === undefined) return;
    pending.delete(message.request_key);
    clearTimeout(waiter.timer);
    waiter.resolve(message.result);
  });

  const signalChild = (signal) => {
    try {
      if (process.platform !== "win32" && Number.isSafeInteger(child.pid)) {
        process.kill(-child.pid, signal);
      } else {
        child.kill(signal);
      }
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
  };
  const stop = async () => {
    if (child.exitCode === null && child.connected) {
      await request("dispose", 5_000).catch(() => {});
    }
    if (child.exitCode === null) {
      signalChild("SIGTERM");
      await Promise.race([once(child, "exit"), new Promise((done) => setTimeout(done, 2_000))]);
      if (child.exitCode === null) signalChild("SIGKILL");
    }
    await rm(home, {recursive: true, force: true});
  };
  const request = (command, timeout = 15_000) => new Promise((resolve, reject) => {
    if (child.exitCode !== null || !child.connected) {
      reject(new Error(`observed DSH Host unavailable for ${command}`));
      return;
    }
    const requestKey = `d0b4a-${process.pid}-${++requestCounter}`;
    const timer = setTimeout(() => {
      pending.delete(requestKey);
      reject(new Error(`observed DSH Host timed out during ${command}`));
    }, timeout);
    pending.set(requestKey, {resolve, reject, timer});
    child.send({schema_version: SCHEMA, request_key: requestKey, command}, (error) => {
      if (error === null) return;
      clearTimeout(timer);
      pending.delete(requestKey);
      reject(error);
    });
  });

  try {
    const deadline = Date.now() + 45_000;
    let launched;
    while (Date.now() < deadline && child.exitCode === null && fatal === undefined) {
      launched = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
      if (launched && ready) break;
      await new Promise((done) => setTimeout(done, 50));
    }
    assert.equal(fatal, undefined, `observer failed to boot: ${fatal ?? "unknown"}`);
    assert.ok(launched && ready,
      `observed DSH Web did not become ready (exit=${child.exitCode}; stderr=${redacted(stderr)})`);
    const url = new URL(launched);
    assert.equal(url.hostname, "127.0.0.1");
    const login = await fetch(url, {redirect: "manual"});
    const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie, `DSH Web token exchange failed with status ${login.status}`);
    return {url, cookie, request, stop};
  } catch (error) {
    await stop();
    throw error;
  }
}

function assertBaseline(observation) {
  assert.equal(observation.ok, true);
  assert.deepEqual(observation.reason_codes, []);
  assert.equal(observation.active_fiber_count, 173);
  assert.deepEqual(observation.counts, EXPECTED_BEFORE);
  assert.equal(observation.new_fiber_count, null);
  assert.equal(observation.new_counts, null);
  assert.deepEqual(observation.unknown, []);
  assert.equal(observation.agent, null);
}

test("D0b.4a observes the complete pinned DSH Web effective graph fail-closed",
  {timeout: 150_000}, async (t) => {
    await t.test("classifies the exact baseline and one standard session delta", async () => {
      const observed = await startObservedHost("are-dsh-effective-graph-positive-");
      try {
        assertBaseline(await observed.request("snapshot-before"));
        const response = await fetch(new URL("/api/session/create", observed.url), {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: observed.cookie,
            origin: observed.url.origin,
          },
          body: JSON.stringify({
            type: "client-request",
            rpcId: "are-effective-graph-create",
            method: "session/create",
            payload: {args: {request: {}}},
          }),
        });
        const body = await response.json();
        assert.equal(response.status, 200);
        assert.equal(body.type, "server-response");
        assert.equal(body.result?.ok, true, "fresh standard session must be created");

        const after = await observed.request("snapshot-after");
        assert.equal(after.ok, true,
          `effective graph classifier refused the known session delta: ${JSON.stringify(after)}`);
        assert.deepEqual(after.reason_codes, []);
        assert.equal(after.active_fiber_count, 208);
        assert.deepEqual(after.counts, EXPECTED_AFTER);
        assert.equal(after.new_fiber_count, 35);
        assert.deepEqual(after.new_counts, EXPECTED_DELTA);
        assert.deepEqual(after.unknown, []);
        assert.deepEqual(after.agent, {
          count: 1,
          preset_id: "standard",
          mounted_entry_count: 31,
          non_group_count: 28,
          group_count: 3,
        });
      } finally {
        await observed.stop();
      }
    });

    await t.test("refuses one unexpected direct no-entry registration", async () => {
      const observed = await startObservedHost("are-dsh-effective-graph-negative-");
      try {
        assertBaseline(await observed.request("snapshot-before"));
        const denied = await observed.request("inject-unknown");
        assert.equal(denied.ok, false);
        assert.deepEqual(denied.reason_codes, ["unknown-no-entry-registration"]);
        assert.equal(denied.active_fiber_count, 174);
        assert.deepEqual(denied.counts, {...EXPECTED_BEFORE, unknown: 1});
        assert.equal(denied.new_fiber_count, 1);
        assert.deepEqual(denied.new_counts, {...EXPECTED_DELTA,
          "host-nested": 0,
          "preset-primary": 0,
          "preset-group-primary": 0,
          "preset-nested": 0,
          unknown: 1});
        assert.deepEqual(denied.unknown, [{
          runtime_name: "areUnexpectedDirectRegistration",
          has_entry: false,
        }]);
        assert.equal(denied.agent, null);
      } finally {
        await observed.stop();
      }
    });
  });
