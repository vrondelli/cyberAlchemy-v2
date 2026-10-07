import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtempSync, existsSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {resolveBackendCommand} from "../src/backend.mjs";
import {desktopHostProfile} from "../src/desktop-host-profile.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gatewayBin = join(packageRoot, "bin/are-codex-gateway.mjs");

test("desktop host profiles preserve both observed App Server launch forms", () => {
  for (const id of ["desktop-wsl-base/v1", "desktop-wsl-app-tools/v1"]) {
    const profile = desktopHostProfile(id);
    const launch = resolveBackendCommand({mode: "direct-stdio", command: "/pinned/codex",
      command_prefix_args: profile.prefix_args, command_app_server_args: profile.app_server_args});
    assert.deepEqual(launch.args, [...profile.prefix_args, "app-server", ...profile.app_server_args,
      "--listen", "stdio://"]);
  }
  assert.equal(desktopHostProfile("unknown"), null);
  assert.throws(() => resolveBackendCommand({mode: "daemon-proxy",
    command_app_server_args: ["--analytics-default-enabled"]}), /direct stdio/);
});

test("desktop gateway rejects a mismatched backend digest before opening its socket", () => {
  const directory = mkdtempSync(join(tmpdir(), "are-desktop-backend-drift-"));
  try {
    const socket = join(directory, "gateway.sock");
    const result = spawnSync(process.execPath, [gatewayBin, "--listen", socket,
      "--backend", "direct-stdio", "--codex-command", process.execPath,
      "--desktop-host-profile", "desktop-wsl-base/v1",
      "--desktop-backend-sha256", "0".repeat(64)], {encoding: "utf8", timeout: 10000});
    assert.equal(result.status, 13);
    assert.match(result.stderr, /gateway.desktop-backend-digest-drift/);
    assert.equal(existsSync(socket), false);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});
