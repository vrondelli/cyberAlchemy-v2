import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const runtimeRoot = resolve(scriptDir, "..");
const regimePath = resolve(runtimeRoot, "benchmarks/foundation/browser-regime.js");
const budgetPath = resolve(runtimeRoot, "foundation-performance-budgets.candidate.json");
const evaluatorPath = resolve(scriptDir, "benchmark-foundation.mjs");
const vitePath = resolve(runtimeRoot, "node_modules/vite/bin/vite.js");
const playwrightCli = process.env.PWCLI || resolve(homedir(), ".codex/skills/playwright/scripts/playwright_cli.sh");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function findChromium() {
  if (process.env.CAV2_CHROMIUM_PATH) return resolve(process.env.CAV2_CHROMIUM_PATH);
  const root = resolve(homedir(), ".cache/ms-playwright");
  const candidates = readdirSync(root)
    .filter((name) => name.startsWith("chromium-"))
    .sort().reverse()
    .flatMap((name) => [
      resolve(root, name, "chrome-linux64/chrome"),
      resolve(root, name, "chrome-linux/chrome"),
    ]);
  const found = candidates.find(existsSync);
  if (!found) throw new Error("FOUNDATION_CHROMIUM_UNAVAILABLE");
  return found;
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("FOUNDATION_PORT_ALLOCATION_FAILED"));
      server.close(() => resolvePort(address.port));
    });
  });
}

async function waitFor(url, label, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error(`${response.status}`);
    } catch (error) { lastError = error; }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`${label}_UNAVAILABLE:${lastError?.message ?? "timeout"}`);
}

function runCli(session, args) {
  const result = spawnSync(playwrightCli, [`-s=${session}`, ...args], { cwd: runtimeRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`FOUNDATION_PLAYWRIGHT_CLI_FAILED:${args.join(" ")}:${result.stderr || result.stdout}`);
  return result.stdout;
}

const chromiumPath = findChromium();
if (!existsSync(playwrightCli)) throw new Error("FOUNDATION_PLAYWRIGHT_CLI_UNAVAILABLE");
if (!existsSync(vitePath)) throw new Error("FOUNDATION_VITE_UNAVAILABLE");
const [previewPort, cdpPort] = await Promise.all([freePort(), freePort()]);
const profilePath = mkdtempSync(join(tmpdir(), "cav2-foundation-browser-"));
const session = `foundation-benchmark-${process.pid}`;
const preview = spawn(process.execPath, [vitePath, "preview", "--host", "127.0.0.1", "--port", String(previewPort), "--strictPort"], {
  cwd: runtimeRoot,
  stdio: ["ignore", "pipe", "pipe"],
});
const browser = spawn(chromiumPath, [
  "--headless=new",
  "--disable-background-networking",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-gpu",
  "--disable-sync",
  "--no-default-browser-check",
  "--no-first-run",
  `--remote-debugging-address=127.0.0.1`,
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${profilePath}`,
  "about:blank",
], { cwd: runtimeRoot, stdio: ["ignore", "pipe", "pipe"] });

let samplePath = null;
try {
  await Promise.all([
    waitFor(`http://127.0.0.1:${previewPort}/`, "FOUNDATION_PREVIEW"),
    waitFor(`http://127.0.0.1:${cdpPort}/json/version`, "FOUNDATION_CDP"),
  ]);
  runCli(session, ["attach", "--cdp", `http://127.0.0.1:${cdpPort}`]);
  runCli(session, ["goto", `http://127.0.0.1:${previewPort}/#/foundation`]);
  const raw = runCli(session, ["--json", "run-code", "--filename", regimePath]);
  const cliResult = JSON.parse(raw);
  const observation = JSON.parse(cliResult.result);
  if (!Array.isArray(observation.samples)) throw new Error("FOUNDATION_BROWSER_SAMPLE_SHAPE_INVALID");
  if (observation.consoleErrors.length || observation.pageErrors.length) throw new Error(`FOUNDATION_BROWSER_RUNTIME_ERRORS:${JSON.stringify({ consoleErrors: observation.consoleErrors, pageErrors: observation.pageErrors })}`);
  const observedAt = new Date().toISOString();
  const versionMatch = observation.userAgent.match(/(?:HeadlessChrome|Chrome)\/([^ ]+)/);
  if (!versionMatch) throw new Error("FOUNDATION_BROWSER_VERSION_MISSING");
  const bundle = {
    schema_version: "cav2-workspace-foundation-browser-evidence/v1-candidate",
    observed_at: observedAt,
    authority_effect: "none",
    profile_id: `${process.platform}-${process.arch}-chromium`,
    identity: {
      platform: process.platform,
      architecture: process.arch,
      browser_engine: "chromium",
      browser_version: versionMatch[1],
      browser_executable: basename(chromiumPath),
      viewport: observation.viewport,
    },
    bindings: {
      budget_sha256: sha256(readFileSync(budgetPath)),
      regime_sha256: sha256(readFileSync(regimePath)),
    },
    regime_binding: { ref: "benchmarks/foundation/browser-regime.js", sha256: sha256(readFileSync(regimePath)) },
    budget_binding: { ref: "foundation-performance-budgets.candidate.json", sha256: sha256(readFileSync(budgetPath)) },
    browser: { executable: basename(chromiumPath), user_agent: observation.userAgent, viewport: observation.viewport },
    page: { url: observation.url.replace(String(previewPort), "<ephemeral-port>"), title: observation.title, visible_definition: observation.visibleDefinition },
    samples: observation.samples,
    console_errors: observation.consoleErrors,
    page_errors: observation.pageErrors,
    claim_ceiling: "Real local Chromium interaction samples for the exact regime and budget bindings only; no product approval, portability, conformance, release, or deployment claim.",
  };
  const timestamp = observedAt.replaceAll(":", "-").replace(".", "-");
  samplePath = resolve(runtimeRoot, "benchmarks/foundation/browser-samples", `${timestamp}.candidate.json`);
  mkdirSync(dirname(samplePath), { recursive: true });
  writeFileSync(samplePath, `${JSON.stringify(bundle, null, 2)}\n`);
  const relativeSamplePath = relative(runtimeRoot, samplePath);
  const evaluation = spawnSync(process.execPath, [evaluatorPath, "--browser-samples", relativeSamplePath, "--write"], {
    cwd: runtimeRoot,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  process.stdout.write(evaluation.stdout);
  if (evaluation.stderr) process.stderr.write(evaluation.stderr);
  if (evaluation.status !== 0) process.exitCode = evaluation.status ?? 1;
} finally {
  try { runCli(session, ["close"]); } catch {}
  preview.kill("SIGTERM");
  browser.kill("SIGTERM");
  rmSync(profilePath, { recursive: true, force: true });
}
if (samplePath) process.stdout.write(`${JSON.stringify({ status: process.exitCode ? "FAIL" : "PASS", sample_path: relative(runtimeRoot, samplePath), authority_effect: "none" })}\n`);
