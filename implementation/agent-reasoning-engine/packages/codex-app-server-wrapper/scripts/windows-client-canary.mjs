import {execFile, spawn} from "node:child_process";
import {mkdtempSync, rmSync} from "node:fs";
import {resolve} from "node:path";
import {createInterface} from "node:readline";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repositoryRoot = resolve(packageRoot, "../../../../../");
const checkoutRoot = resolve(repositoryRoot, "cyberAlchemy-v2");
const temporaryRoot = mkdtempSync("/tmp/are-windows-client-canary-");
const socketPath = resolve(temporaryRoot, "gateway.sock");
const gateway = spawn(process.execPath, [
  resolve(packageRoot, "bin/are-codex-gateway.mjs"),
  "--config", resolve(packageRoot, "profiles/repository-v1.json"),
  "--repository-root", repositoryRoot,
  "--listen", socketPath,
  "--backend", "direct-stdio",
  "--reasoning-state-dir", resolve(temporaryRoot, "reasoning-state"),
  "--session-store", resolve(temporaryRoot, "gateway-sessions.jsonl"),
  "--continuity-activation", resolve(checkoutRoot, "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ilh04-headless-operational-v1/activation-manifest.json"),
], {stdio: ["ignore", "pipe", "pipe"]});

const execFileAsync = promisify(execFile);

function waitForSchema(child, stream, schemaVersion, timeoutMs = 30000) {
  return new Promise((resolveReady, reject) => {
    const lines = createInterface({input: stream, crlfDelay: Infinity});
    const timer = setTimeout(() => reject(new Error(`${schemaVersion} timed out.`)), timeoutMs);
    lines.on("line", (line) => {
      let value;
      try { value = JSON.parse(line); } catch { return; }
      if (value.schema_version !== schemaVersion) return;
      clearTimeout(timer);
      lines.close();
      resolveReady(value);
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      reject(new Error(`${schemaVersion} process exited before readiness: ${signal ?? code}`));
    });
  });
}

async function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolveExit) => child.once("exit", resolveExit));
  child.kill("SIGTERM");
  await exited;
}

let result;
let client = null;
try {
  const ready = await waitForSchema(gateway, gateway.stderr, "are.gateway-ready/v1");
  client = spawn(process.execPath, [
    resolve(packageRoot, "bin/are-codex-windows-client.mjs"),
    "--socket", socketPath,
    "--repository-root", repositoryRoot,
    "--cwd", checkoutRoot,
    "--port", "0",
    "--token", "are-windows-canary-token",
  ], {stdio: ["ignore", "pipe", "pipe"]});
  const clientReady = await waitForSchema(client, client.stderr, "are.codex-windows-client-ready/v1");
  const health = await fetch(new URL("healthz", clientReady.url));
  const ui = await fetch(clientReady.url);
  const windowsProbe = await execFileAsync("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    `$response = Invoke-WebRequest -UseBasicParsing -Uri '${clientReady.url}'; [int]$response.StatusCode`,
  ], {encoding: "utf8", timeout: 15000});
  const windowsStatus = Number(windowsProbe.stdout.replace(/\0/g, "").trim());
  result = {
    schema_version: "are.codex-windows-client-operational-canary/v1",
    ok: ready.continuity_disposition === "activated" && health.status === 200 && ui.status === 200 && windowsStatus === 200,
    gateway: {
      backend_mode: ready.backend_mode,
      observed_codex_version: ready.observed_backend_version,
      continuity_disposition: ready.continuity_disposition,
      continuity_activation_receipt_digest: ready.continuity_activation_receipt_digest,
    },
    client: {
      initialization: clientReady.initialization,
      loopback_host: clientReady.host,
      node_health_status: health.status,
      node_ui_status: ui.status,
      windows_ui_status: windowsStatus,
    },
    model_turns_started: 0,
    authority_effect: "none",
  };
} finally {
  await stopChild(client);
  await stopChild(gateway);
  rmSync(temporaryRoot, {recursive: true, force: true});
}

process.stdout.write(`${JSON.stringify(result)}\n`);
if (!result?.ok) process.exitCode = 1;
