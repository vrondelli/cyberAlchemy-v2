import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, readFile, readdir, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const DSH_ENTRY = fileURLToPath(new URL("../node_modules/@deepseek-ai/dsh/lib/bin.js", import.meta.url));
const PROBE_PLUGIN = fileURLToPath(new URL("./fixtures/web-session-created-veto-probe.mjs", import.meta.url));

test("disposable DSH Web creation hook only vetoes synchronously", {timeout: 65_000}, async () => {
  const home = await mkdtemp(join(tmpdir(), "are-dsh-web-creation-veto-"));
  const marker = join(home, "creation-veto.marker");
  const patch = join(home, "creation-veto.patch.yml");
  const sessionId = "session-are-creation-veto-probe";
  const asyncSessionId = "session-are-creation-async-probe";
  await writeFile(patch, `- insert:\n    - id: are-session-created-veto-probe\n      name: ${JSON.stringify(PROBE_PLUGIN)}\n`, {mode: 0o600});
  const dump = spawnSync(process.execPath, [DSH_ENTRY, "--profile", "web", "--patch", patch,
    "--dump-config"], {encoding: "utf8", env: {...process.env, DSH_HOME: home,
      DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1"}});
  assert.equal(dump.status, 0, dump.stderr.slice(-1000));
  assert.ok(dump.stdout.includes(PROBE_PLUGIN), "creation probe absent from composed Web Host");
  const child = spawn(process.execPath, [DSH_ENTRY, "--profile", "web", "--patch", patch,
    "--no-open", "--port", "0"], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
    env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
      ARE_DSH_CREATION_VETO_MARKER: marker, ARE_DSH_CREATION_VETO_SESSION_ID: sessionId,
      ARE_DSH_CREATION_ASYNC_SESSION_ID: asyncSessionId},
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout = (stdout + chunk.toString("utf8")).slice(-8192); });
  child.stderr.on("data", (chunk) => { stderr = (stderr + chunk.toString("utf8")).slice(-8192); });
  try {
    const deadline = Date.now() + 45_000;
    let launched;
    while (Date.now() < deadline && child.exitCode === null) {
      launched = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
      if (launched) break;
      await new Promise((done) => setTimeout(done, 50));
    }
    assert.ok(launched, `DSH Web did not become ready (exit=${child.exitCode}; stderr=${stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]").slice(-1000)})`);
    const url = new URL(launched);
    assert.equal(url.hostname, "127.0.0.1");
    const login = await fetch(url, {redirect: "manual"});
    const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie, `DSH Web token exchange failed with status ${login.status}`);
    const create = (id, rpcId) => fetch(new URL("/api/session/create", url), {
      method: "POST",
      headers: {"content-type": "application/json", cookie, origin: url.origin},
      body: JSON.stringify({type: "client-request", rpcId,
        method: "session/create", payload: {args: {request: {sessionId: id, cwd: home}}}}),
    });
    const result = await create(sessionId, "are-creation-veto-probe");
    const body = await result.json();
    assert.equal(result.status, 200);
    assert.equal(body.type, "server-response");
    assert.equal(body.result?.ok, false, "synchronous session/created veto must deny creation");
    assert.equal(await readFile(marker, "utf8"), "probe-mounted\nsession-created-veto\n",
      "Agent must not be announced after the session veto");
    const persistedNames = await readdir(home, {recursive: true});
    assert.equal(persistedNames.some((name) => name.split(/[\\/]/u).includes(sessionId)), false,
      "the fresh vetoed Web session must not leave a native session directory");
    const asyncResult = await create(asyncSessionId, "are-creation-async-probe");
    const asyncBody = await asyncResult.json();
    assert.equal(asyncResult.status, 200);
    assert.equal(asyncBody.result?.ok, true,
      "a rejected listener Promise must not be mistaken for synchronous admission");
    assert.equal(asyncBody.result.value?.sessionId, asyncSessionId);
    assert.equal(await readFile(marker, "utf8"), "probe-mounted\nsession-created-veto\n"
      + "session-created-async-reject\nagent-created-after-async-reject\n");
  } finally {
    if (child.exitCode === null) {
      const signalChild = (signal) => {
        try {
          if (process.platform !== "win32" && Number.isSafeInteger(child.pid)) process.kill(-child.pid, signal);
          else child.kill(signal);
        } catch (error) {
          if (error?.code !== "ESRCH") throw error;
        }
      };
      signalChild("SIGTERM");
      await Promise.race([once(child, "exit"), new Promise((done) => setTimeout(done, 2000))]);
      if (child.exitCode === null) signalChild("SIGKILL");
    }
    await rm(home, {recursive: true, force: true});
  }
});
