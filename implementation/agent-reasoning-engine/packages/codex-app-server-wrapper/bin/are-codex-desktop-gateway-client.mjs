#!/usr/bin/env node
import {createDesktopGatewayJsonlClient} from "../src/desktop-gateway-client.mjs";
import {createDesktopMethodTrace} from "../src/desktop-method-trace.mjs";
import {validateDesktopShimEnvironment} from "../src/desktop-cli-shim.mjs";

async function main() {
  const settings = validateDesktopShimEnvironment(process.env);
  if (!settings.ok || settings.mode !== "managed-gateway") {
    throw new Error(settings.ok ? "desktop-gateway.managed-mode-required" : settings.reason);
  }
  const client = createDesktopGatewayJsonlClient({socket_path: settings.gateway.socket,
    state_dir: settings.gateway.state_dir, consumer_id: "codex:desktop-wsl",
    connection_token: process.env.ARE_DESKTOP_GATEWAY_CONNECTION_TOKEN,
    allow_desktop_consumption_receipts: process.env.ARE_DESKTOP_CONSUMPTION_RECEIPTS === "1",
    trace_method: createDesktopMethodTrace(process.env.ARE_DESKTOP_SHIM_TRACE_PATH),
    desktop_backend_binding: {binary_sha256: settings.backend_sha256,
      host_profile: process.env.ARE_DESKTOP_HOST_PROFILE}});
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => client.close());
  await client.done;
}

main().catch(error => {
  const reason = typeof error?.code === "string" ? error.code
    : /^(?:desktop-gateway|desktop-shim|gateway)\.[a-z0-9-]+$/.test(error?.message ?? "")
      ? error.message : "desktop-gateway.failed";
  process.stderr.write(`${reason}\n`);
  process.exitCode = 4;
});
