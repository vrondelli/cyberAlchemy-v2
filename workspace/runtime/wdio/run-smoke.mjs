import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {nativePreflight} from "./preflight.mjs";

const preflight=nativePreflight();
if(preflight.status!=="PASS"){
  process.stderr.write(JSON.stringify(preflight)+"\n");
  process.exit(2);
}

const testDirectory = mkdtempSync(join(tmpdir(), "cav2-essays-wdio-"));
const database = join(testDirectory, "essays.sqlite");
const artifactDirectory = process.env.WORKSPACE_WDIO_OUTPUT ?? join(testDirectory, "artifacts");
const wdio = resolve("node_modules/@wdio/cli/bin/wdio.js");
const areBridge = resolve("../../development/agent-reasoning-engine/codex-integration/client/desktop-bridge.mjs");
const mockCodex = resolve("../../development/agent-reasoning-engine/codex-integration/test/fixtures/mock-app-server.mjs");
const areCwd = resolve("../..");
mkdirSync(artifactDirectory, { recursive: true });

try {
  const result = spawnSync(process.execPath, [wdio, "run", "./wdio/wdio.conf.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ESSAYS_DATABASE: database,
      XDG_DATA_HOME: join(testDirectory, "data"),
      XDG_CONFIG_HOME: join(testDirectory, "config"),
      XDG_CACHE_HOME: join(testDirectory, "cache"),
      WORKSPACE_WDIO_OUTPUT: artifactDirectory,
      WDIO_USE_NATIVE_FETCH: "1",
      ARE_CODEX_NODE: process.execPath,
      ARE_CODEX_BRIDGE: areBridge,
      ARE_CODEX_CWD: areCwd,
      ARE_CODEX_RECEIPT_PATH: join(testDirectory, "are-codex-events.jsonl"),
      ARE_CODEX_ALLOW_PROTOCOL_DRIFT: "1",
      CODEX_BINARY: mockCodex,
    },
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.stderr.write(
      `${JSON.stringify({
        status: "FAIL",
        check: "unified-workspace-tauri-wdio-smoke",
        code: "WDIO_SMOKE_FAILED",
        exitCode: result.status,
        authorityEffect: "none",
      })}\n`,
    );
    process.exitCode = result.status ?? 1;
  } else {
    process.stdout.write(
      `${JSON.stringify({
        status: "PASS",
        check: "unified-workspace-tauri-wdio-smoke",
        databasePosture: "temporary-and-removed",
        authorityEffect: "none",
        claimCeiling: "Local candidate desktop smoke evidence only.",
      })}\n`,
    );
  }
} finally {
  rmSync(testDirectory, { recursive: true, force: true });
}
