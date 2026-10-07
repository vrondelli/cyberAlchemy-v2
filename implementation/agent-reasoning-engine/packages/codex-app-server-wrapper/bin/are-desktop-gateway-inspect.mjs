#!/usr/bin/env node
import {inspectDesktopGatewayState} from "../src/desktop-gateway-state.mjs";

if (process.argv.length !== 5) {
  process.stderr.write("Usage: are-desktop-gateway-inspect <absolute-private-state-dir> <backend-sha256> <desktop-wsl-base/v1|desktop-wsl-app-tools/v1>\n");
  process.exitCode = 2;
} else {
  try {
    const observation = inspectDesktopGatewayState({state_dir: process.argv[2],
      consumer_id: "codex:desktop-wsl", backend_adapter_id: "codex-app-server/v1",
      desktop_backend_binding: {binary_sha256: process.argv[3], host_profile: process.argv[4]}});
    process.stdout.write(`${JSON.stringify(observation)}\n`);
  } catch (error) {
    const reason = /^(?:desktop-gateway)\.[a-z0-9-]+$/.test(error?.message ?? "")
      ? error.message : "desktop-gateway.inspection-failed";
    process.stderr.write(`${reason}\n`);
    process.exitCode = 2;
  }
}
