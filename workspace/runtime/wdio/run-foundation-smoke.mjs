import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const testDirectory = mkdtempSync(join(tmpdir(), "cav2-foundation-wdio-"));
const artifactDirectory = process.env.WORKSPACE_WDIO_OUTPUT ?? join(testDirectory, "artifacts");
const wdio = resolve("node_modules/@wdio/cli/bin/wdio.js");
const spec = resolve("wdio/specs/foundation-preflight.e2e.mjs");
mkdirSync(artifactDirectory, { recursive: true });

try {
  const result = spawnSync(process.execPath, [wdio, "run", "./wdio/wdio.conf.mjs", "--spec", spec], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ESSAYS_DATABASE: join(testDirectory, "essays.sqlite"),
      WORKSPACE_WDIO_OUTPUT: artifactDirectory,
      WDIO_USE_NATIVE_FETCH: "1",
    },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.stderr.write(`${JSON.stringify({ status: "FAIL", check: "foundation-live-tauri-preflight", code: "WDIO_FOUNDATION_SMOKE_FAILED", exitCode: result.status, authorityEffect: "none" })}\n`);
    process.exitCode = result.status ?? 1;
  } else {
    process.stdout.write(`${JSON.stringify({ status: "PASS", check: "foundation-live-tauri-preflight", databasePosture: "temporary-and-removed", executionAttempted: false, authorityEffect: "none", claimCeiling: "Local effect-free candidate desktop evidence only." })}\n`);
  }
} finally {
  rmSync(testDirectory, { recursive: true, force: true });
}
