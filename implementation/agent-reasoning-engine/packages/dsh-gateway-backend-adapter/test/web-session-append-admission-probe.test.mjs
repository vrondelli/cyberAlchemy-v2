import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const DSH_ENTRY = fileURLToPath(new URL("../node_modules/@deepseek-ai/dsh/lib/bin.js", import.meta.url));
const PROBE_PLUGIN = fileURLToPath(new URL("./fixtures/web-session-append-admission-probe.mjs", import.meta.url));

test("disposable DSH Web denies native and direct Session writes before admission", {timeout: 65_000}, async () => {
  const home = await mkdtemp(join(tmpdir(), "are-dsh-session-admission-"));
  const marker = join(home, "probe.marker");
  const patch = join(home, "probe.patch.yml");
  await writeFile(patch, `- insert:\n    - id: are-web-session-append-admission-probe\n      name: ${JSON.stringify(PROBE_PLUGIN)}\n`, {mode: 0o600});
  const env = {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
    ARE_DSH_SESSION_APPEND_PROBE_MARKER: marker};
  const dump = spawnSync(process.execPath, [DSH_ENTRY, "--profile", "web", "--patch", patch,
    "--dump-config"], {encoding: "utf8", env});
  assert.equal(dump.status, 0, dump.stderr.slice(-1000));
  assert.ok(dump.stdout.includes(PROBE_PLUGIN), "probe must be in the composed Web profile");
  const child = spawn(process.execPath, [DSH_ENTRY, "--profile", "web", "--patch", patch,
    "--no-open", "--port", "0"], {
    stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32", env,
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout = (stdout + chunk).slice(-8192); });
  child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-8192); });
  try {
    const deadline = Date.now() + 45_000;
    let launched;
    while (Date.now() < deadline && child.exitCode === null) {
      launched = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
      if (launched) break;
      await new Promise((done) => setTimeout(done, 50));
    }
    assert.ok(launched, `DSH Web did not become ready (exit=${child.exitCode}; stdout=${stdout.replaceAll(/token=[^\s]+/gu, "token=[redacted]").slice(-1200)}; stderr=${stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]").slice(-1200)})`);
    const url = new URL(launched);
    assert.equal(url.hostname, "127.0.0.1");
    const login = await fetch(url, {redirect: "manual"});
    const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie, `DSH Web token exchange failed with status ${login.status}`);
    const rpc = async (method, request) => {
      const response = await fetch(new URL(`/api/session/${method}`, url), {
        method: "POST", headers: {"content-type": "application/json", cookie, origin: url.origin},
        body: JSON.stringify({type: "client-request", rpcId: `are-session-admission-${method}`,
          method: `session/${method}`, payload: {args: {request}}}),
      });
      assert.equal(response.status, 200, `${method}: HTTP response`);
      return response.json();
    };
    const created = await rpc("create", {});
    assert.equal(created.result?.ok, true, `session/create failed: ${JSON.stringify(created.result)}`);
    const sessionId = created.result.value?.sessionId;
    assert.equal(typeof sessionId, "string", `missing created session ID: ${JSON.stringify(created.result)}`);
    const before = await readFile(marker, "utf8");
    assert.equal(before, "probe-mounted\nsession-guard-installed\ninbox-insert-denied\n" +
      "direct-inbox-rejected\nuser-surface-denied\ndirect-user-surface-rejected\ndenied-writes-absent\n");
    const prompted = await rpc("prompt", {sessionId, requestId: "are-session-admission-request",
      mode: "queue", content: [{type: "text", text: "local ingress probe; never send to model"}]});
    assert.equal(prompted.result?.ok, false, `prompt unexpectedly accepted: ${JSON.stringify(prompted.result)}`);
    assert.match(JSON.stringify(prompted.result), /session append admission denied/u);
    assert.equal(await readFile(marker, "utf8"), `${before}inbox-insert-denied\n`);
  } finally {
    if (child.exitCode === null) {
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
    await rm(home, {recursive: true, force: true});
  }
});
