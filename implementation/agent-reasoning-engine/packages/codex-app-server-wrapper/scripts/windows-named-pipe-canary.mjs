#!/usr/bin/env node
import {execFile, spawn} from "node:child_process";
import {randomBytes, randomUUID} from "node:crypto";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {createInterface} from "node:readline";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

import {connectGatewayRpcTransport} from "../src/gateway-client.mjs";
import {createAppServerRpcClient} from "../src/rpc-client.mjs";
import {readAdapterObservation} from "../src/adapter-observation-client.mjs";
import {readGatewayThreadObservation} from "../src/thread-observation-client.mjs";
import {readGatewayDecisionObservation} from "../src/decision-observation-client.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1];
}

if (process.platform !== "win32") throw new Error("Run this canary with native Windows Node.js.");
const distribution = argument("--wsl-distribution");
const linuxCodex = argument("--wsl-codex");
const linuxCodexHome = argument("--wsl-codex-home");
const companionExe = argument("--companion-exe");
const adapterScreenshot = argument("--adapter-screenshot");
const threadScreenshot = argument("--thread-screenshot");
const decisionScreenshot = argument("--decision-screenshot");
const evidenceScreenshot = argument("--evidence-screenshot");
const overviewScreenshot = argument("--overview-screenshot");
const gatewayEntry = argument("--gateway-entry") ?? fileURLToPath(new URL("../bin/are-codex-gateway.mjs", import.meta.url));
if (!distribution || !linuxCodex || !linuxCodexHome || distribution.startsWith("--") || !linuxCodex.startsWith("/") || !linuxCodexHome.startsWith("/")) {
  throw new Error("Usage: windows-named-pipe-canary --wsl-distribution <name> --wsl-codex <absolute-linux-path> --wsl-codex-home <absolute-linux-path>");
}

const temporaryRoot = mkdtempSync(join(tmpdir(), "are-windows-pipe-canary-"));
const pipePath = `\\\\.\\pipe\\are-codex-canary-${randomUUID()}`;
const observationPath = `\\\\.\\pipe\\are-observation-canary-${randomUUID()}`;
const connectionToken = randomBytes(32).toString("hex");
const observationToken = randomBytes(32).toString("hex");
const packageRoot = resolve(dirname(gatewayEntry), "..");
const repositoryRoot = resolve(packageRoot, "../../../../../");
const execFileAsync = promisify(execFile);
const gateway = spawn(process.execPath, [
  gatewayEntry,
  "--development-live",
  "--config", resolve(packageRoot, "profiles/repository-v1.json"),
  "--repository-root", repositoryRoot,
  "--listen", pipePath,
  "--development-observation-socket", observationPath,
  "--backend", "direct-stdio",
  "--codex-command", "C:\\Windows\\System32\\wsl.exe",
  "--codex-prefix-arg", "--distribution",
  "--codex-prefix-arg", distribution,
  "--codex-prefix-arg", "--exec",
  "--codex-prefix-arg", "/usr/bin/env",
  "--codex-prefix-arg", `CODEX_HOME=${linuxCodexHome}`,
  "--codex-prefix-arg", linuxCodex,
  "--session-store", join(temporaryRoot, "gateway-sessions.jsonl"),
  "--reasoning-state-dir", join(temporaryRoot, "reasoning-state"),
], {
  cwd: packageRoot,
  env: {...process.env, ARE_GATEWAY_CONNECTION_TOKEN: connectionToken, ARE_ADAPTER_OBSERVATION_TOKEN: observationToken},
  stdio: ["ignore", "ignore", "pipe"],
});
let gatewayDiagnostic = "";
gateway.stderr.on("data", (chunk) => { gatewayDiagnostic = `${gatewayDiagnostic}${chunk}`.slice(-4000); });

function waitForReady() {
  return new Promise((resolveReady, reject) => {
    const lines = createInterface({input: gateway.stderr, crlfDelay: Infinity});
    const timer = setTimeout(() => reject(new Error("Windows gateway readiness timed out.")), 30000);
    let diagnostic = "";
    lines.on("line", (line) => {
      diagnostic = line.slice(0, 2000);
      let value;
      try { value = JSON.parse(line); } catch { return; }
      if (value.schema_version !== "are.gateway-ready/v1") return;
      clearTimeout(timer);
      lines.close();
      resolveReady(value);
    });
    gateway.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Windows gateway exited before readiness (${code}): ${diagnostic}`));
    });
  });
}

let transport;
let rpc;
const responseDiagnostics = [];
try {
  const ready = await waitForReady();
  transport = connectGatewayRpcTransport({
    socket_path: pipePath,
    consumer_id: "codex:human-chat",
    lane: "interaction-bound",
    connection_token: connectionToken,
  });
  transport.output.on("data", (chunk) => {
    for (const line of chunk.toString("utf8").split("\n").filter(Boolean)) {
      try {
        const message = JSON.parse(line);
        responseDiagnostics.push({method: message.method ?? null, error_code: message.error?.code ?? null, error_message: message.error?.message ?? null, error_reason_codes: message.error?.data?.reason_codes ?? null});
      } catch { responseDiagnostics.push({invalid_json: true}); }
    }
  });
  rpc = createAppServerRpcClient({transport, request_timeout_ms: 20000});
  const initialization = await rpc.initialize({
    clientInfo: {name: "are_windows_pipe_canary", version: "0.1.0"},
    capabilities: {experimentalApi: true},
  });
  await rpc.notify("initialized", {});
  const observation = await readAdapterObservation({socket_path: observationPath, token: observationToken});
  const threadObservation = await readGatewayThreadObservation({socket_path: observationPath, token: observationToken});
  const decisionObservation = await readGatewayDecisionObservation({socket_path: observationPath, token: observationToken});
  let companionUi = null;
  if (companionExe) {
    const testScript = fileURLToPath(new URL("../../../apps/desktop-companion/scripts/test-windows-ui.mjs", import.meta.url));
    const args = [testScript, companionExe, "--adapter-external-socket", observationPath];
    if (overviewScreenshot) args.push("--screenshot", overviewScreenshot);
    if (adapterScreenshot) args.push("--adapter-screenshot", adapterScreenshot);
    if (threadScreenshot) args.push("--thread-screenshot", threadScreenshot);
    if (decisionScreenshot) args.push("--decision-screenshot", decisionScreenshot);
    if (evidenceScreenshot) args.push("--evidence-screenshot", evidenceScreenshot);
    const test = await execFileAsync(process.execPath, args, {env: {...process.env, ARE_ADAPTER_OBSERVATION_TOKEN: observationToken}, timeout: 120000, maxBuffer: 1024 * 1024});
    const result = JSON.parse(test.stdout);
    companionUi = {ok: result.ok, checks: result.checks, overview_screenshot: result.screenshot, adapter_screenshot: result.adapter_screenshot, thread_screenshot: result.thread_screenshot, decision_screenshot: result.decision_screenshot, evidence_screenshot: result.evidence_screenshot};
  }
  process.stdout.write(`${JSON.stringify({
    schema_version: "are.windows-named-pipe-canary/v1",
    ok: true,
    backend_mode: ready.backend_mode,
    gateway_source: argument("--gateway-entry") ? "explicit-packaged-entry" : "workspace-source",
    observed_backend_version: ready.observed_backend_version,
    initialization: typeof initialization === "object" && initialization !== null ? "accepted" : "invalid",
    adapter_observation: {selected_adapter_id: observation.selected_backend_adapter_id, client_link: observation.client_link.status, gateway: observation.gateway.status, backend: observation.backend.status},
    thread_observation: {scope: threadObservation.scope, thread_count: threadObservation.thread_count},
    decision_observation: {scope: decisionObservation.scope, decision_count: decisionObservation.decision_count},
    companion_ui: companionUi,
    model_turns_started: 0,
    authority_effect: "none",
  })}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({schema_version: "are.windows-named-pipe-canary-failure/v1", reason: error.code ?? error.name, detail: error.message, connected: transport?.inspect().connected ?? false, response_diagnostics: responseDiagnostics, gateway_exit_code: gateway.exitCode, gateway_diagnostic: gatewayDiagnostic, authority_effect: "none"})}\n`);
  process.exitCode = 1;
} finally {
  await rpc?.close();
  await transport?.close();
  if (gateway.exitCode === null && gateway.signalCode === null) gateway.kill("SIGTERM");
  await new Promise((resolveExit) => {
    if (gateway.exitCode !== null || gateway.signalCode !== null) return resolveExit();
    const timer = setTimeout(() => { gateway.kill(); resolveExit(); }, 3000);
    gateway.once("exit", () => { clearTimeout(timer); resolveExit(); });
  });
  rmSync(temporaryRoot, {recursive: true, force: true});
}
