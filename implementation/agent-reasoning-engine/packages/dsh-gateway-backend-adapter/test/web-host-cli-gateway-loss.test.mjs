import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {existsSync, mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {inspectFileGatewaySessionStoreWriterLock}
  from "../../codex-app-server-wrapper/src/gateway-session-store.mjs";

const cli = fileURLToPath(new URL("../bin/are-dsh-web-host.mjs", import.meta.url));

test("opt-in DSH Host fails closed when its ARE gateway process exits",
  {skip: process.platform !== "linux" ? "Pinned Host profile is Linux-only" : false,
    timeout: 240_000}, async () => {
    const home = mkdtempSync(join(tmpdir(), "are-dsh-web-gateway-loss-"));
    const gatewayPath = join(home, "are-web-gateway.jsonl");
    const child = spawn(process.execPath, [cli, "--home", home, "--workspace", home], {
      env: {...process.env, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1"},
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let lines = "";
    let ready;
    let stopped;
    let replacement;
    child.stdout.on("data", (chunk) => {
      stdout = (stdout + chunk).slice(-8192);
      lines += chunk.toString("utf8");
      let newline;
      while ((newline = lines.indexOf("\n")) >= 0) {
        const line = lines.slice(0, newline);
        lines = lines.slice(newline + 1);
        try {
          const record = JSON.parse(line);
          if (record.schema_version === "are.dsh-web-host-ready/v1") ready = record;
          if (record.schema_version === "are.dsh-web-host-stopped/v1") stopped = record;
        } catch { /* DSH also writes a human-readable local URL. */ }
      }
    });
    child.stderr.on("data", (chunk) => {stderr = (stderr + chunk).slice(-8192);});
    try {
      const deadline = Date.now() + 180_000;
      let launched;
      while (Date.now() < deadline && child.exitCode === null) {
        launched = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
        if (launched && ready) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(ready?.ok, true, stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]"));
      assert.ok(launched, "DSH Web did not publish its local URL");
      const url = new URL(launched);
      const login = await fetch(url, {redirect: "manual"});
      const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
      assert.ok(cookie, `Web token exchange failed: ${login.status}`);
      const create = await fetch(new URL("/api/session/create", url), {
        method: "POST", headers: {"content-type": "application/json", cookie,
          origin: url.origin},
        body: JSON.stringify({type: "client-request", rpcId: "gateway-loss-create",
          method: "session/create", payload: {args: {request: {
            workspaceId: ready.workspace_id}}}}),
      });
      assert.equal(create.status, 200);
      const created = await create.json();
      assert.equal(created.result?.ok, true, JSON.stringify(created.result));
      const lock = inspectFileGatewaySessionStoreWriterLock({path: gatewayPath});
      assert.equal(lock.disposition, "active");
      assert.notEqual(lock.process_id, child.pid);
      assert.notEqual(lock.process_id, process.pid);
      const closed = once(child, "close");
      process.kill(lock.process_id, "SIGTERM");
      await Promise.race([closed, new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Host did not stop after gateway-process loss")),
          30_000).unref?.();
      })]);
      assert.notEqual(child.exitCode, 0, "Host must not report a clean release");
      assert.equal(stopped?.ok, false, stdout);
      assert.equal(stopped?.release_index_checkpointed, false);
      assert.equal(existsSync(join(home, "are-web-released-sessions.json")), false);
      replacement = spawn(process.execPath, [cli, "--home", home, "--workspace", home], {
        env: {...process.env, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1"},
        stdio: ["ignore", "pipe", "pipe"],
      });
      let replacementOutput = "";
      let replacementError = "";
      replacement.stdout.on("data", (chunk) => {
        replacementOutput = (replacementOutput + chunk).slice(-8192);
      });
      replacement.stderr.on("data", (chunk) => {
        replacementError = (replacementError + chunk).slice(-8192);
      });
      await Promise.race([once(replacement, "close"), new Promise((_, reject) => {
        setTimeout(() => reject(new Error("replacement Host did not settle")),
          120_000).unref?.();
      })]);
      assert.notEqual(replacement.exitCode, 0,
        "replacement Host must not adopt an unreleased native Session");
      assert.equal(replacementOutput.includes('"schema_version":"are.dsh-web-host-ready/v1"'),
        false, replacementOutput);
      assert.match(replacementError, /dsh-web-host-start-failure/u);
    } finally {
      if (replacement && replacement.exitCode === null && replacement.signalCode === null) {
        const closed = once(replacement, "close");
        replacement.kill("SIGTERM");
        await closed;
      }
      if (child.exitCode === null && child.signalCode === null) {
        const closed = once(child, "close");
        child.kill("SIGTERM");
        await closed;
      }
      rmSync(home, {recursive: true, force: true});
    }
  });
