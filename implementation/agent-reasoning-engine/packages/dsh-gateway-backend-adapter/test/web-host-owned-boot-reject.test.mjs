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

for (const [name, flag] of [["unknown Host row", "ARE_DSH_UNKNOWN_HOST"],
  ["wrong preset root", "ARE_DSH_WRONG_ROOT"]]) {
  test(`qualified Web Host refuses ${name} before readiness`, {timeout: 240_000}, async () => {
    const home = await mkdtemp(join(tmpdir(), "are-dsh-boot-reject-"));
    const child = spawn(process.execPath, [fixture], {
      stdio: ["ignore", "pipe", "pipe", "ipc"], detached: process.platform !== "win32",
      env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
        ARE_DSH_HOST_MANIFEST: manifest, [flag]: "1"},
    });
    let stderr = "";
    let observed;
    child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-2048); });
    child.on("message", (message) => {
      if (message?.schema_version === schema
        && (message.kind === "ready" || message.kind === "fatal")) observed = message;
    });
    const signal = (value) => {
      try {
        if (process.platform !== "win32" && Number.isSafeInteger(child.pid)) process.kill(-child.pid, value);
        else child.kill(value);
      } catch (error) { if (error?.code !== "ESRCH") throw error; }
    };
    try {
      const deadline = Date.now() + 210_000;
      while (Date.now() < deadline && !observed && child.exitCode === null) {
        await new Promise((done) => setTimeout(done, 50));
      }
      assert.equal(observed?.kind, "fatal",
        `Host did not fail closed: ${stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]").slice(-1000)}`);
      assert.match(observed.reason_code, /epoch|graph|source|qualification/u);
    } finally {
      if (child.exitCode === null) {
        signal("SIGTERM");
        await Promise.race([once(child, "exit"), new Promise((done) => setTimeout(done, 2_000))]);
        if (child.exitCode === null) signal("SIGKILL");
      }
      await rm(home, {recursive: true, force: true});
    }
  });
}
