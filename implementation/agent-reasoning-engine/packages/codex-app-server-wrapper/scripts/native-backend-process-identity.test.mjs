import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {inspectBackendProcess} from "./native-backend-process-identity.mjs";

test("exact backend process identity rejects a wrong executable and stale birth", async () => {
  const scratch = mkdtempSync(join(tmpdir(), "are-backend-identity-"));
  const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"],
    {cwd: scratch, stdio: "ignore"});
  try {
    let identity;
    for (let attempt = 0; attempt < 10; attempt++) {
      identity = inspectBackendProcess(child.pid, process.execPath, scratch);
      if (identity.exact) break;
      await new Promise((done) => setTimeout(done, 100));
    }
    assert.equal(identity.exact, true);
    assert.equal(inspectBackendProcess(child.pid, fileURLToPath(import.meta.url), scratch).exact, false);
    if (process.platform === "win32") {
      assert.ok(identity.birth);
      assert.equal(inspectBackendProcess(child.pid, process.execPath, scratch,
        `${identity.birth}-stale`).exact, false);
      assert.equal(inspectBackendProcess(child.pid, process.execPath, scratch, identity.birth).exact, true);
    }
  } finally {
    child.kill("SIGKILL");
    await new Promise((done) => child.once("close", done));
    assert.equal(inspectBackendProcess(child.pid, process.execPath, scratch).exact, false);
    rmSync(scratch, {recursive: true, force: true});
  }
});
