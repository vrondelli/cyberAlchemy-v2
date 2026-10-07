import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const DSH_ENTRY = fileURLToPath(new URL("../node_modules/@deepseek-ai/dsh/lib/bin.js", import.meta.url));
const PROBE_PLUGIN = fileURLToPath(new URL("./fixtures/web-session-controller-deny-probe.mjs", import.meta.url));
const READ_ONLY_PATCH = fileURLToPath(new URL("../config/read-only.patch.yml", import.meta.url));

test("disposable DSH Web session requests reach a replaceable native controller", {timeout: 65_000}, async () => {
  const home = await mkdtemp(join(tmpdir(), "are-dsh-web-seam-"));
  const marker = join(home, "mutations-denied.marker");
  const patch = join(home, "controller.patch.yml");
  await writeFile(patch, `- id: session-controller\n  disabled: true\n- insert:\n    - id: are-session-controller-probe\n      name: ${JSON.stringify(PROBE_PLUGIN)}\n`, {mode: 0o600});
  const dump = spawnSync(process.execPath, [DSH_ENTRY, "--profile", "web", "--patch", patch,
    "--dump-config"], {encoding: "utf8", env: {...process.env, DSH_HOME: home,
      DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1"}});
  assert.equal(dump.status, 0, dump.stderr.slice(-1000));
  assert.ok(dump.stdout.includes(PROBE_PLUGIN),
    `probe row absent from composed DSH config: ${dump.stdout.slice(-1200)}`);
  const child = spawn(process.execPath, [DSH_ENTRY, "--profile", "web", "--patch", patch,
    "--patch", READ_ONLY_PATCH, "--no-open", "--port", "0"], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
    env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1",
      ARE_DSH_WEB_PROBE_MARKER: marker, NO_COLOR: "1"},
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
    // Never include a launch token in test failure output.
    assert.ok(launched, `DSH Web did not become ready (exit=${child.exitCode}; stderr=${stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]").slice(-1000)})`);
    const url = new URL(launched);
    assert.equal(url.hostname, "127.0.0.1");
    const apiUrl = new URL("/api/session/create", url);
    const probeCreate = JSON.stringify({type: "client-request", rpcId: "are-web-seam-probe-unauthenticated",
      method: "session/create", payload: {args: {request: {}}}});
    const unauthenticated = await fetch(apiUrl, {method: "POST",
      headers: {"content-type": "application/json", origin: url.origin}, body: probeCreate});
    assert.notEqual(unauthenticated.status, 200, "unauthenticated RPC must not reach the replacement");
    assert.equal(await readFile(marker, "utf8"), "session-controller replacement constructed\n");
    const login = await fetch(url, {redirect: "manual"});
    const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie, `DSH Web token exchange failed with status ${login.status}`);
    const wrongOrigin = await fetch(apiUrl, {method: "POST",
      headers: {"content-type": "application/json", cookie, origin: "http://untrusted.example"}, body: probeCreate});
    assert.notEqual(wrongOrigin.status, 200, "foreign Origin must not reach the replacement");
    assert.equal(await readFile(marker, "utf8"), "session-controller replacement constructed\n");
    const mutations = [
      ["create", {}],
      ["selectModel", {sessionId: "probe-session", provider: "probe", model: "probe"}],
      ["rename", {sessionId: "probe-session", title: "probe"}],
      ["fork", {sessionId: "probe-session"}],
      ["prompt", {sessionId: "probe-session", requestId: "probe-request", mode: "queue",
        content: [{type: "text", text: "probe"}]}],
      ["updateQueue", {sessionId: "probe-session", itemId: "probe-item", action: {kind: "remove"}}],
      ["cancel", {sessionId: "probe-session"}],
      ["openWorkspacePath", {path: "/tmp/are-dsh-web-probe"}],
    ];
    for (const [method, request] of mutations) {
      const result = await fetch(new URL(`/api/session/${method}`, url), {
        method: "POST",
        headers: {"content-type": "application/json", cookie, origin: url.origin},
        body: JSON.stringify({type: "client-request", rpcId: `are-web-seam-probe-${method}`,
          method: `session/${method}`, payload: {args: {request}}}),
      });
      const body = await result.json();
      assert.equal(result.status, 200, method);
      assert.equal(body.type, "server-response", method);
      assert.equal(body.result?.ok, false, method);
      assert.match(JSON.stringify(body.result), new RegExp(`ARE Web seam probe denied ${method}`),
        `${method}: ${JSON.stringify(body.result)}`);
    }
    const markerText = await readFile(marker, "utf8").catch(() => "missing");
    assert.equal(markerText, "session-controller replacement constructed\n"
      + mutations.map(([method]) => `session/${method} denied before native dispatch\n`).join(""),
    `replacement marker=${markerText}; stderr=${stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]").slice(-1500)}`);
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
