#!/usr/bin/env node
// Native Windows smoke for an ARE-owned gateway, hosted client, and Companion.
// --package-root selects exact resources adjacent to a staged or extracted executable.
// All state and processes are disposable. The opt-in fixture turn contacts only
// a loopback provider; no external model request or installation is made.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {existsSync, mkdtempSync, mkdirSync, realpathSync, rmSync, statSync, writeFileSync} from "node:fs";
import {createServer as createHttpServer} from "node:http";
import {tmpdir} from "node:os";
import {createServer} from "node:net";
import {dirname, isAbsolute, join, resolve} from "node:path";
import {createInterface} from "node:readline";
import {fileURLToPath} from "node:url";

assert.equal(process.platform, "win32", "native Windows is required");
const providedArgs = process.argv.slice(2);
const guardedTextOnly = providedArgs.includes("--guarded-text-only");
const guardedPlanInput = providedArgs.includes("--guarded-plan-input");
const guardedMode = guardedTextOnly || guardedPlanInput;
const verifyWindowsSandbox = providedArgs.includes("--verify-windows-sandbox");
const probeWindowsHostedEffects = providedArgs.includes("--probe-windows-hosted-effects");
const sourceManager = providedArgs.includes("--source-manager");
const browserFixtureTurn = providedArgs.includes("--browser-fixture-turn");
const browserReloadDuringPlan = providedArgs.includes("--browser-reload-during-plan");
const browserRestartDuringPlan = providedArgs.includes("--browser-restart-during-plan");
const crashGateway = providedArgs.includes("--crash-gateway");
const relaunchAfterCrash = providedArgs.includes("--relaunch-after-crash");
const crashDuringPlanInput = providedArgs.includes("--crash-during-plan-input");
const fixtureTurn = providedArgs.includes("--fixture-turn") || browserFixtureTurn;
const evolutionRootOption = providedArgs.indexOf("--evolution-root");
const evolutionRootArgument = evolutionRootOption >= 0 ? providedArgs[evolutionRootOption + 1] : null;
const args = providedArgs.filter((value, index) => value !== "--guarded-text-only" && value !== "--guarded-plan-input"
  && value !== "--verify-windows-sandbox" && value !== "--probe-windows-hosted-effects"
  && value !== "--source-manager" && value !== "--fixture-turn"
  && value !== "--browser-fixture-turn" && value !== "--browser-reload-during-plan"
  && value !== "--browser-restart-during-plan" && value !== "--crash-gateway"
  && value !== "--relaunch-after-crash" && value !== "--crash-during-plan-input"
  && (evolutionRootOption < 0 || (index !== evolutionRootOption && index !== evolutionRootOption + 1)));
assert.ok(providedArgs.filter(value => value === "--guarded-text-only").length <= 1
  && providedArgs.filter(value => value === "--guarded-plan-input").length <= 1
  && providedArgs.filter(value => value === "--verify-windows-sandbox").length <= 1
  && providedArgs.filter(value => value === "--probe-windows-hosted-effects").length <= 1
  && providedArgs.filter(value => value === "--source-manager").length <= 1
  && providedArgs.filter(value => value === "--fixture-turn").length <= 1
  && providedArgs.filter(value => value === "--browser-fixture-turn").length <= 1
  && providedArgs.filter(value => value === "--browser-reload-during-plan").length <= 1
  && providedArgs.filter(value => value === "--browser-restart-during-plan").length <= 1
  && providedArgs.filter(value => value === "--crash-gateway").length <= 1
  && providedArgs.filter(value => value === "--relaunch-after-crash").length <= 1
  && providedArgs.filter(value => value === "--crash-during-plan-input").length <= 1
  && providedArgs.filter(value => value === "--evolution-root").length <= 1
  && (evolutionRootOption < 0 || (typeof evolutionRootArgument === "string"
    && isAbsolute(evolutionRootArgument)))
  && !(guardedTextOnly && guardedPlanInput)
  && !(browserFixtureTurn && providedArgs.includes("--fixture-turn"))
  && (!fixtureTurn || guardedMode)
  && (!browserFixtureTurn || guardedPlanInput)
  && (!browserReloadDuringPlan || browserFixtureTurn)
  && (!browserRestartDuringPlan || browserFixtureTurn)
  && !(browserReloadDuringPlan && browserRestartDuringPlan)
  && (!(crashGateway && fixtureTurn) || relaunchAfterCrash)
  && (!relaunchAfterCrash || (crashGateway && fixtureTurn && guardedMode && !browserFixtureTurn))
  && (!crashDuringPlanInput || (guardedPlanInput && relaunchAfterCrash && !browserFixtureTurn))
  && (!verifyWindowsSandbox || guardedMode)
  && (!probeWindowsHostedEffects || verifyWindowsSandbox)
  && (!sourceManager || (args.length === 5 && args[3] === "--package-root"))
  && (args.length === 3 || (args.length === 5 && args[3] === "--package-root")),
"usage: test-managed-session-windows.mjs <companion.exe> <node.exe> <codex.exe> [--package-root <adjacent-are-root> --source-manager] [--evolution-root <existing-absolute-root>] [--guarded-text-only|--guarded-plan-input] [--verify-windows-sandbox] [--probe-windows-hosted-effects] [--fixture-turn with a guarded mode|--browser-fixture-turn with guarded Plan [--browser-reload-during-plan|--browser-restart-during-plan]|--crash-gateway [--relaunch-after-crash with a fixture turn [--crash-during-plan-input]]]]");
const [companion, node, codex] = args.slice(0, 3).map(value => resolve(value));
for (const path of [companion, node, codex]) assert.ok(existsSync(path), `Missing test input: ${path}`);
const nativeOrb = resolve(dirname(companion), "native-orb/are-native-orb.exe");
const nativeOrbBundled = existsSync(nativeOrb);
const appRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packageRoot = args.length === 5 ? resolve(args[4]) : null;
assert.ok(!fixtureTurn || packageRoot, "The fixture turn must exercise package-adjacent ARE resources.");
if (packageRoot) {
  assert.equal(packageRoot, resolve(dirname(companion), "are/cyberAlchemy-v2"),
    "Package root must be the exact resource tree adjacent to the extracted Companion executable");
  assert.equal(node.toLowerCase(), resolve(dirname(companion), "node/node.exe").toLowerCase(),
    "Package mode must run the Node executable adjacent to the extracted Companion");
}
const productRoot = packageRoot
  ? resolve(packageRoot, "implementation/agent-reasoning-engine")
  : resolve(appRoot, "../..");
// Profile source paths are anchored at the parent projects directory.
const repositoryRoot = resolve(productRoot, "../../..");
const scratch = mkdtempSync(join(tmpdir(), "are-managed-win-ui-"));
const state = join(scratch, "state");
const codexHome = join(state, "codex-home");
const managerEntry = join(sourceManager ? resolve(appRoot, "../..") : productRoot,
  "packages/codex-app-server-wrapper/bin/are-managed-session.mjs");
assert.ok(existsSync(managerEntry), `Missing managed-session launcher: ${managerEntry}`);
let manager;
let hostedBrowser;
let fixtureProvider;
let fixtureProviderRequests = 0;
let fixtureProviderError = null;
let fixturePlanAnswerObserved = false;
let diagnostics = "";
let ownedChildren = [];
let evolutionRoot = null;
let expectedEvolutionCounts = null;

function fixedResponseEvents(id) {
  const item = {id: `msg_${id}`, type: "message", role: "assistant", status: "completed",
    content: [{type: "output_text", text: "ARE_COMPANION_MANAGED_JOIN_OK", annotations: []}]};
  const events = [
    {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress"}},
    {type: "response.content_part.added", item_id: item.id, output_index: 0, content_index: 0,
      part: {type: "output_text", text: "", annotations: []}},
    {type: "response.output_text.delta", item_id: item.id, output_index: 0, content_index: 0,
      delta: item.content[0].text},
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed",
      output: [item], usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28,
        input_tokens_details: {cached_tokens: 0}}}},
  ];
  return events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

function fixedUserInputEvents(id) {
  const item = {id: `fc_${id}`, type: "function_call", call_id: "companion_guarded_input_call_1",
    name: "request_user_input", arguments: JSON.stringify({questions: [{id: "choice",
      header: "Fixture choice", question: "Continue the isolated ARE Companion check?",
      options: [{label: "Continue", description: "Complete the fixed local test."}]}]}),
    status: "completed"};
  const events = [
    {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress"}},
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed",
      output: [item], usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28,
        input_tokens_details: {cached_tokens: 0}}}},
  ];
  return events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

async function freePort() {
  const server = createServer();
  await new Promise((done, fail) => server.once("error", fail).listen(0, "127.0.0.1", done));
  const port = server.address().port;
  await new Promise(done => server.close(done));
  return port;
}

async function poll(work, label, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try { const value = await work(); if (value) return value; }
    catch (error) { lastError = error; }
    await new Promise(done => setTimeout(done, 150));
  }
  throw new Error(`${label}:timeout${lastError ? `:${lastError.message}` : ""}`);
}

async function page(port, filename) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, {signal: AbortSignal.timeout(1500)});
  if (!response.ok) throw new Error(`webview-debugger-http:${response.status}`);
  const pages = (await response.json()).filter(item => item.type === "page"
    && new URL(item.url).pathname.endsWith(`/${filename}`));
  assert.ok(pages.length <= 1, `ambiguous ${filename} page in isolated WebView2 profile`);
  return pages[0] ?? null;
}

async function hostedBrowserPage(port, hostedOrigin) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, {signal: AbortSignal.timeout(1500)});
  if (!response.ok) throw new Error(`hosted-browser-debugger-http:${response.status}`);
  const pages = (await response.json()).filter(item => item.type === "page"
    && (() => { try { return new URL(item.url).origin === hostedOrigin; } catch { return false; } })());
  assert.ok(pages.length <= 1, "ambiguous hosted browser page in isolated Edge profile");
  return pages[0] ?? null;
}

function edgeExecutable() {
  const candidates = [
    join(process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)",
      "Microsoft/Edge/Application/msedge.exe"),
    join(process.env.ProgramFiles ?? "C:\\Program Files",
      "Microsoft/Edge/Application/msedge.exe"),
  ];
  const selected = candidates.find(candidate => existsSync(candidate));
  assert.ok(selected, "Native Microsoft Edge is required for --browser-fixture-turn");
  return selected;
}

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener("message", event => {
      let value;
      try { value = JSON.parse(String(event.data)); } catch { return; }
      const waiting = this.pending.get(value.id);
      if (!waiting) return;
      this.pending.delete(value.id);
      clearTimeout(waiting.timer);
      if (value.error) waiting.fail(new Error(`cdp:${value.error.message}`));
      else waiting.done(value.result);
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((done, fail) => {
      const timer = setTimeout(() => fail(new Error("cdp-connect-timeout")), 10000);
      socket.addEventListener("open", () => { clearTimeout(timer); done(); }, {once: true});
      socket.addEventListener("error", () => { clearTimeout(timer); fail(new Error("cdp-connect-failed")); }, {once: true});
    });
    return new Cdp(socket);
  }

  async command(method, params = {}) {
    const id = this.nextId++;
    return await new Promise((done, fail) => {
      const timer = setTimeout(() => { this.pending.delete(id); fail(new Error("cdp-evaluate-timeout")); }, 10000);
      this.pending.set(id, {done, fail, timer});
      this.socket.send(JSON.stringify({id, method, params}));
    });
  }

  async evaluate(expression) {
    const result = await this.command("Runtime.evaluate",
      {expression, returnByValue: true, awaitPromise: true});
    if (result.exceptionDetails) throw new Error(`webview-evaluate:${result.exceptionDetails.text}`);
    return result.result?.value;
  }

  close() { this.socket.close(); }
}

async function startHostedBrowser(debuggerPort) {
  hostedBrowser = spawn(edgeExecutable(), ["--headless=new", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", `--user-data-dir=${join(scratch, "edge-hosted")}`,
    `--remote-debugging-port=${debuggerPort}`, "about:blank"], {
    stdio: "ignore", windowsHide: true,
  });
  await new Promise((done, fail) => {
    hostedBrowser.once("spawn", done);
    hostedBrowser.once("error", fail);
  });
  const opened = await poll(() => hostedBrowserPage(debuggerPort, "null"),
    "hosted-browser-blank-page", 30000);
  return await Cdp.connect(opened.webSocketDebuggerUrl);
}

async function runHostedBrowserFixture(launchUrl, workspace, reloadDuringPlan, restartDuringPlan) {
  const debuggerPort = await freePort();
  let browser = await startHostedBrowser(debuggerPort);
  try {
    await browser.command("Page.navigate", {url: launchUrl});
    await poll(async () => {
      const state = await browser.evaluate(`({ready: document.readyState,
        status: document.querySelector("#status")?.textContent?.trim(),
        recovery: document.querySelector("#recovery-mode")?.textContent?.trim()})`);
      return state.ready === "complete" && state.status !== "Connecting"
        && state.recovery !== "Recovery: checking…" ? state : null;
    }, "hosted-browser-client-ready", 30000);
    await browser.evaluate(`(() => {
      const field = document.querySelector("#cwd");
      field.value = ${JSON.stringify(workspace)};
      field.dispatchEvent(new Event("input", {bubbles: true}));
      document.querySelector("#start-thread").click();
    })()`);
    const threadLabel = await poll(async () => {
      const value = await browser.evaluate(`document.querySelector("#thread-label")?.textContent?.trim()`);
      return value && value !== "No thread loaded." && value.length > 12 ? value : null;
    }, "hosted-browser-thread-created", 30000);
    await poll(async () => await browser.evaluate(`document.querySelector("#send")?.disabled === false`),
      "hosted-browser-composer-ready", 30000);
    await browser.evaluate(`(() => {
      const field = document.querySelector("#prompt");
      field.value = "Explain the repository routing architecture briefly.";
      field.dispatchEvent(new Event("input", {bubbles: true}));
      document.querySelector("#send").click();
    })()`);
    const question = await poll(async () => {
      const value = await browser.evaluate(`(() => ({visible: Boolean(document.querySelector("#user-inputs form.user-input")),
        title: document.querySelector("#user-inputs form.user-input strong")?.textContent?.trim(),
        question: document.querySelector("#user-inputs form.user-input label")?.textContent?.trim(),
        options: [...(document.querySelector("#user-inputs form.user-input select")?.options ?? [])]
          .map(option => option.textContent?.trim())}))()`);
      return value.visible && value.title === "ARE needs your input"
        && value.options?.some(option => option?.startsWith("Continue")) ? value : null;
    }, "hosted-browser-plan-question-rendered", 30000);
    if (reloadDuringPlan) {
      await browser.command("Page.reload", {ignoreCache: true});
      await poll(async () => {
        const value = await browser.evaluate(`(() => ({navigation:
          performance.getEntriesByType("navigation")[0]?.type,
          thread: document.querySelector("#thread-label")?.textContent?.trim(),
          forms: document.querySelectorAll("#user-inputs form.user-input").length,
          question: document.querySelector("#user-inputs form.user-input label")?.textContent?.trim(),
          options: [...(document.querySelector("#user-inputs form.user-input select")?.options ?? [])]
            .map(option => option.textContent?.trim())}))()`);
        return value.navigation === "reload" && value.thread === threadLabel && value.forms === 1
          && value.question === question.question
          && value.options?.some(option => option?.startsWith("Continue")) ? value : null;
      }, "hosted-browser-plan-question-restored-after-reload", 30000);
    }
    if (restartDuringPlan) {
      browser.close();
      const priorBrowser = hostedBrowser;
      const killed = spawnSync("taskkill.exe", ["/PID", String(priorBrowser.pid), "/T", "/F"],
        {encoding: "utf8", timeout: 10000, windowsHide: true});
      assert.equal(killed.status, 0, `hosted-browser-restart-stop:${killed.stderr?.trim()}`);
      await stopped(priorBrowser, 10000);
      browser = await startHostedBrowser(debuggerPort);
      await browser.command("Page.navigate", {url: launchUrl});
      await poll(async () => {
        const value = await browser.evaluate(`(() => ({ready: document.readyState,
          thread: document.querySelector("#thread-label")?.textContent?.trim(),
          forms: document.querySelectorAll("#user-inputs form.user-input").length,
          question: document.querySelector("#user-inputs form.user-input label")?.textContent?.trim(),
          options: [...(document.querySelector("#user-inputs form.user-input select")?.options ?? [])]
            .map(option => option.textContent?.trim())}))()`);
        return value.ready === "complete" && value.thread === threadLabel && value.forms === 1
          && value.question === question.question
          && value.options?.some(option => option?.startsWith("Continue")) ? value : null;
      }, "hosted-browser-plan-question-restored-after-restart", 30000);
    }
    await browser.evaluate(`(() => {
      const form = document.querySelector("#user-inputs form.user-input");
      const choice = form.querySelector("select");
      choice.value = "0";
      choice.dispatchEvent(new Event("change", {bubbles: true}));
      form.querySelector('button[type="submit"]').click();
    })()`);
    await poll(async () => {
      const value = await browser.evaluate(`({answered: document.querySelectorAll("#user-inputs form.user-input").length === 0,
        response: document.querySelector("#messages")?.innerText?.includes("ARE_COMPANION_MANAGED_JOIN_OK")})`);
      return value.answered && value.response ? value : null;
    }, "hosted-browser-plan-answer-and-response", 45000);
    return {thread_label: threadLabel, question_rendered: Boolean(question.question),
      question_restored_after_reload: reloadDuringPlan ? true : null,
      question_restored_after_restart: restartDuringPlan ? true : null,
      answer_submitted_in_browser: true, response_rendered_in_browser: true};
  } finally { browser.close(); }
}

async function inspectManagedCompanion(port, nativeOrbActive, nativeOrbWindow, expectedEvolution) {
  let orb;
  let dashboard;
  try {
    if (!nativeOrbActive) {
      const orbPage = await poll(() => page(port, "orb.html"), "managed-orb-page");
      orb = await Cdp.connect(orbPage.webSocketDebuggerUrl);
      await poll(async () => await orb.evaluate(`(() => ({ready: document.readyState,
        orb: Boolean(document.querySelector("#orb")), bridge: Boolean(globalThis.__TAURI__?.core?.invoke)}))()`)
        .then(value => value.ready === "complete" && value.orb && value.bridge ? value : null), "managed-orb-render");
      await orb.evaluate(`document.querySelector("#orb").click()`);
    }
    const dashboardPage = await poll(() => page(port, "dashboard.html"), "managed-dashboard-page");
    dashboard = await Cdp.connect(dashboardPage.webSocketDebuggerUrl);
    const rendered = await poll(async () => {
      const value = await dashboard.evaluate(`({ready: document.readyState,
        panelCount: document.querySelectorAll(".nav-item[data-panel]").length,
        bodyLength: document.body?.innerText.length ?? 0})`);
      return value.ready === "complete" && value.panelCount === 7 && value.bodyLength > 100 ? value : null;
    }, "managed-dashboard-render");
    await dashboard.evaluate(`document.querySelector('[data-panel="adapters"]').click()`);
    const expectedOverview = guardedMode ? "Guarded text-only candidate" : "Backend connected; turns paused";
    const adapter = await poll(async () => {
      const value = await dashboard.evaluate(`(() => ({
        visible: !document.querySelector("#panel-adapters")?.hidden,
        gateway: document.querySelector("#adapter-gateway-state")?.textContent?.trim().toLowerCase(),
        backend: document.querySelector("#adapter-backend-state")?.textContent?.trim().toLowerCase(),
        client: document.querySelector("#adapter-client-state")?.textContent?.trim().toLowerCase(),
        host: document.querySelector("#adapter-host-control-state")?.textContent?.trim().toLowerCase(),
        ingress: document.querySelector("#adapter-managed-turn-ingress-state")?.textContent?.trim().toLowerCase(),
        modelWireGuard: document.querySelector("#adapter-model-wire-guard-state")?.textContent?.trim().toLowerCase(),
        guardedPlanInput: document.querySelector("#adapter-guarded-plan-input-state")?.textContent?.trim().toLowerCase(),
        hostedInputProof: document.querySelector("#adapter-hosted-input-attestation-state")?.textContent?.trim().toLowerCase(),
        windowsBackendSandbox: document.querySelector("#adapter-windows-backend-sandbox-state")?.textContent?.trim().toLowerCase(),
        ingressDetail: document.querySelector("#adapter-managed-turn-ingress-detail")?.textContent?.trim(),
        ingressSource: document.querySelector("#adapter-observation-source")?.textContent?.trim(),
        sidebarPosture: document.querySelector("#sidebar-adapter")?.dataset.adapterPosture,
        sidebarLabel: document.querySelector("#sidebar-adapter-label")?.textContent?.trim(),
        overview: document.querySelector("#overview-adapter-title")?.textContent?.trim(),
        overviewDetail: document.querySelector("#overview-adapter-detail")?.textContent?.trim()
      }))()`);
      return value.visible && value.gateway === "running" && value.backend === "ready"
        && value.client === "connected"
        && value.modelWireGuard === (guardedMode ? "parent-heartbeat-observed" : "not-declared")
        && value.overview === expectedOverview
        && value.overviewDetail.includes("This chat is not established as ARE-managed")
        ? value : null;
    }, "managed-adapter-same-gateway");
    assert.equal(adapter.host, "unverified");
    assert.equal(adapter.sidebarPosture, "ready", "A managed same-session path must update the source-bound sidebar cue.");
    assert.equal(adapter.sidebarLabel, "Adapter path ready");
    assert.equal(adapter.ingress, guardedMode ? "guarded text-only (candidate)" : "paused");
    assert.equal(adapter.modelWireGuard, guardedMode ? "parent-heartbeat-observed" : "not-declared");
    assert.equal(adapter.guardedPlanInput,
      guardedPlanInput ? "configured at launch (candidate)" : "not declared");
    assert.equal(adapter.hostedInputProof, "configured");
    assert.equal(adapter.windowsBackendSandbox, probeWindowsHostedEffects
      ? "passed-all-active-backends" : "not-configured");
    assert.match(adapter.ingressDetail, guardedMode
      ? /Managed launch declares a guarded text-only candidate/ : /Gateway blocks model-entry methods before backend dispatch/);
    assert.match(adapter.ingressSource, /model-entry ingress observed at gateway/);
    assert.equal(adapter.overview, expectedOverview);
    assert.match(adapter.overviewDetail, /This chat is not established as ARE-managed/);
    if (guardedMode) {
      assert.match(adapter.overviewDetail, /boundary guarded-text-only-candidate \(launch-declared\)/);
      assert.match(adapter.overviewDetail, /guard heartbeat parent-heartbeat-observed/);
    }
    await dashboard.evaluate(`document.querySelector('[data-panel="threads"]').click()`);
    const hostedRejoin = await poll(async () => {
      const status = await dashboard.evaluate(`document.querySelector("#thread-rejoin-status")?.textContent?.trim()`);
      return status?.startsWith("Hosted client · ") && status.includes("Rejoin preflight is read-only")
        ? status : null;
    }, "managed-hosted-rejoin-observation");
    assert.match(hostedRejoin, /^Hosted client · 0 of 0 backend threads on this page are owned here/);
    await dashboard.evaluate(`document.querySelector('[data-panel="evolution"]').click()`);
    const evolution = await poll(async () => {
      const value = await dashboard.evaluate(`({status: document.querySelector("#evolution-observation-status")?.textContent?.trim(),
        source: document.querySelector("#evolution-observation-source")?.textContent?.trim(),
        evidence: document.querySelector("#evolution-evidence-status")?.textContent?.trim(),
        cycles: document.querySelector("#evolution-cycle-count")?.textContent?.trim(),
        commits: document.querySelector("#evolution-commit-count")?.textContent?.trim()})`);
      return value.status === (expectedEvolution ? "Verified ledger" : "Registry only") ? value : null;
    }, "managed-evolution-source-observation");
    if (expectedEvolution) {
      assert.match(evolution.source, /Source: explicit Evolution root · durable ledger/);
      assert.equal(evolution.evidence, "verified");
      assert.equal(Number(evolution.cycles), expectedEvolution.cycles);
      assert.equal(Number(evolution.commits), expectedEvolution.commits);
    } else {
      assert.match(evolution.source, /Source: bundled candidate registry · runtime root not configured/);
      assert.equal(evolution.evidence, "runtime not configured");
      assert.equal(evolution.cycles, "—");
      assert.equal(evolution.commits, "—");
    }
    return {orb_rendered: nativeOrbActive ? nativeOrbWindow?.width === 84 && nativeOrbWindow?.height === 84 : true,
      orb_surface: nativeOrbActive ? "native-win32-window-84x84" : "webview-orb-page",
      dashboard_rendered: true, panel_count: rendered.panelCount,
      gateway: adapter.gateway, backend: adapter.backend, client: adapter.client, host: adapter.host,
      ingress: adapter.ingress, model_wire_guard: adapter.modelWireGuard,
      guarded_plan_input: adapter.guardedPlanInput,
      hosted_rejoin: hostedRejoin,
      evolution_source: expectedEvolution ? "durable-ledger-and-candidate-registry" : "candidate-registry-only",
      evolution_cycle_count: expectedEvolution ? Number(evolution.cycles) : null,
      evolution_commit_count: expectedEvolution ? Number(evolution.commits) : null,
      hosted_input_proof: adapter.hostedInputProof,
      windows_backend_sandbox: adapter.windowsBackendSandbox};
  } finally { dashboard?.close(); orb?.close(); }
}

function processRows(parentPid) {
  const script = `$ErrorActionPreference = 'Stop'
$rows = @(Get-CimInstance Win32_Process -Filter 'ParentProcessId = ${parentPid}' | Select-Object ProcessId,ExecutablePath,CommandLine)
ConvertTo-Json -InputObject @($rows) -Compress -Depth 3`;
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand",
    Buffer.from(script, "utf16le").toString("base64")], {encoding: "utf8", timeout: 15000});
  if (result.error || result.status !== 0) throw new Error(`process-inspection-failed:${result.error?.message ?? result.stderr.trim()}`);
  return JSON.parse(result.stdout.trim());
}

function nativeOrbWindow(pid) {
  const script = `$ErrorActionPreference = 'Stop'
Add-Type @'
using System;
using System.Runtime.InteropServices;
[StructLayout(LayoutKind.Sequential)]
public struct AreManagedOrbRect { public int Left, Top, Right, Bottom; }
public static class AreManagedOrbWindow {
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr window, out AreManagedOrbRect rect);
}
'@
$process = Get-Process -Id ${pid} -ErrorAction Stop
$process.Refresh()
$handle = $process.MainWindowHandle
if ($handle -eq [IntPtr]::Zero) { return }
$rect = New-Object AreManagedOrbRect
if (-not [AreManagedOrbWindow]::GetWindowRect($handle, [ref]$rect)) { throw 'native-orb-window-bounds-unavailable' }
@{ width = $rect.Right - $rect.Left; height = $rect.Bottom - $rect.Top } | ConvertTo-Json -Compress`;
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand",
    Buffer.from(script, "utf16le").toString("base64")], {encoding: "utf8", timeout: 15000});
  if (result.error || result.status !== 0) {
    throw new Error(`native-orb-window-inspection-failed:${result.error?.message ?? result.stderr.trim()}`);
  }
  return result.stdout.trim() ? JSON.parse(result.stdout.trim()) : null;
}

function pidExists(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

async function stopped(child, timeoutMs = 8000) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return child?.exitCode;
  return await Promise.race([new Promise(done => child.once("exit", done)),
    new Promise((_, fail) => setTimeout(() => fail(new Error("managed-stop-timeout")), timeoutMs))]);
}

try {
  if (evolutionRootArgument) {
    evolutionRoot = realpathSync(evolutionRootArgument);
    assert.ok(statSync(evolutionRoot).isDirectory(), "Evolution root must be an existing directory");
    const observed = spawnSync(node,
      [join(productRoot, "packages/evolution-runtime/bin/observe.mjs"), "--json", "--root", evolutionRoot],
      {encoding: "utf8", timeout: 10000, maxBuffer: 1024 * 1024, windowsHide: true});
    assert.equal(observed.status, 0, `Evolution preflight failed: ${(observed.stderr ?? "").slice(-300)}`);
    const value = JSON.parse(observed.stdout.trim());
    assert.equal(value.source, "durable-ledger-and-candidate-registry");
    assert.equal(value.evidence_status, "verified");
    assert.ok(Number.isSafeInteger(value.cycle_count) && value.cycle_count >= 0
      && Number.isSafeInteger(value.commit_count) && value.commit_count >= 0,
    "Evolution preflight must provide verified nonnegative ledger counts");
    expectedEvolutionCounts = {cycles: value.cycle_count, commits: value.commit_count};
  }
  mkdirSync(state);
  mkdirSync(codexHome);
  const inspectorPort = await freePort();
  if (fixtureTurn) {
    fixtureProvider = createHttpServer(async (request, response) => {
      try {
        assert.equal(request.method, "POST");
        assert.ok(request.url?.endsWith("/responses"));
        const chunks = [];
        let bytes = 0;
        for await (const chunk of request) {
          bytes += chunk.length;
          assert.ok(bytes <= 2 * 1024 * 1024, "fixture-provider-input-too-large");
          chunks.push(chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        assert.deepEqual((body.tools ?? []).map(tool => tool.name).filter(Boolean),
          guardedPlanInput ? ["request_user_input"] : [],
          "The guarded turn exposed an unexpected model-facing tool.");
        fixtureProviderRequests += 1;
        assert.ok(fixtureProviderRequests <= 4, "unexpected-fixture-provider-request");
        response.writeHead(200, {"content-type": "text/event-stream"});
        if (guardedPlanInput && fixtureProviderRequests === 1) {
          response.end(fixedUserInputEvents("resp_are_companion_input"));
        } else {
          if (guardedPlanInput) {
            fixturePlanAnswerObserved = (body.input ?? []).some(item =>
              item.type === "function_call_output"
              && item.call_id === "companion_guarded_input_call_1"
              && String(item.output).includes("Continue"));
            assert.equal(fixturePlanAnswerObserved, true,
              "The authenticated Plan answer did not reach the model.");
          }
          response.end(fixedResponseEvents(`resp_are_companion_${fixtureProviderRequests}`));
        }
      } catch (error) {
        fixtureProviderError = error.message;
        response.writeHead(500);
        response.end("fixture rejected request");
      }
    });
    await new Promise(done => fixtureProvider.listen(0, "127.0.0.1", done));
  }
  const modelBaseUrl = fixtureProvider ? `http://127.0.0.1:${fixtureProvider.address().port}/v1`
    : "http://127.0.0.1:1/v1";
  writeFileSync(join(codexHome, "config.toml"), `model_provider = "are_fixture"\nmodel = "are-fixture"\nweb_search = "disabled"\n[features]\nshell_tool = false\nunified_exec = false\napps = false\nmulti_agent = false\ngoals = false\nremote_plugin = false\nplugins = false\n[model_providers.are_fixture]\nname = "ARE local Windows UI fixture"\nbase_url = ${JSON.stringify(modelBaseUrl)}\nwire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n[projects.${JSON.stringify(productRoot)}]\ntrust_level = "trusted"\n${verifyWindowsSandbox ? '[windows]\nsandbox = "unelevated"\n' : ""}`);
  const records = [];
  const waiters = [];
  const companionEnvironment = {...process.env, CODEX_HOME: codexHome, ARE_COMPANION_NODE: node,
    ARE_COMPANION_EVOLUTION_ROOT: join(scratch, "ambient-wrong-root"),
    ARE_COMPANION_EVOLUTION_SIGNAL_LOG: join(scratch, "ambient-wrong-signal-log.jsonl"),
    ARE_COMPANION_ENTRY: join(productRoot, "bin/are.mjs"),
    ARE_COMPANION_PREFERENCES_PATH: join(scratch, "companion.json"),
    WEBVIEW2_USER_DATA_FOLDER: join(scratch, "webview2"),
    WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-address=127.0.0.1 --remote-debugging-port=${inspectorPort}`};
  const managerArgs = [managerEntry,
    "--config", join(productRoot, "packages/codex-app-server-wrapper/profiles/interaction-learning-canary-v1.json"),
    "--repository-root", repositoryRoot, "--codex-command", codex,
    "--state-dir", state, "--cwd", productRoot, "--companion-command", companion,
    ...(evolutionRoot ? ["--companion-evolution-root", evolutionRoot] : []),
    ...(guardedMode ? ["--require-restricted-host-profile", "--codex-home", codexHome,
      "--model-wire-upstream", `${modelBaseUrl}/responses`,
      "--model-wire-provider-id", "are_fixture", "--windows-guarded-text-turns"] : []),
    ...(verifyWindowsSandbox ? ["--windows-sandbox-mode", "unelevated"] : []),
    ...(probeWindowsHostedEffects ? ["--probe-windows-hosted-effects"] : []),
    ...(guardedPlanInput ? ["--windows-guarded-user-input", "--guarded-plan-model", "are-fixture"] : [])];
  const launchManager = () => {
    const child = spawn(node, managerArgs, {env: companionEnvironment,
      stdio: ["ignore", "pipe", "pipe"], windowsHide: true});
    child.stderr.on("data", chunk => { diagnostics = (diagnostics + chunk).slice(-2000); });
    child.once("exit", code => {
      for (const waiter of waiters.splice(0)) waiter.fail(new Error(`managed-session-exited:${code}`));
    });
    const lines = createInterface({input: child.stdout, crlfDelay: Infinity});
    lines.on("line", line => {
      let record;
      try { record = JSON.parse(line); } catch { return; }
      records.push(record);
      for (const waiter of [...waiters]) if (record.schema_version === waiter.schema) {
        waiters.splice(waiters.indexOf(waiter), 1); waiter.done(record);
      }
    });
    return child;
  };
  manager = launchManager();
  const record = (schema, timeoutMs) => {
    const existing = records.find(item => item.schema_version === schema);
    if (existing) return Promise.resolve(existing);
    return new Promise((done, fail) => {
      const waiter = {schema, done: value => { clearTimeout(timer); done(value); },
        fail: error => { clearTimeout(timer); fail(error); }};
      const timer = setTimeout(() => {
        waiters.splice(waiters.indexOf(waiter), 1);
        fail(new Error(`${schema}:timeout`));
      }, timeoutMs);
      waiters.push(waiter);
    });
  };
  const ready = await record("are.managed-session-ready/v1", 45000);
  assert.equal(ready.ok, true);
  assert.equal(ready.companion_process_started, true);
  assert.equal(ready.companion_mode, nativeOrbBundled ? "native-orb" : "direct");
  assert.equal(ready.companion_evolution_root_configured, Boolean(evolutionRoot));
  const nativeOrbActive = nativeOrbBundled && ready.companion_mode === "native-orb";
  assert.equal(ready.current_desktop_task_control, false);
  assert.equal(ready.windows_sandbox_mode, verifyWindowsSandbox ? "unelevated" : null);
  assert.equal(ready.windows_hosted_command_sandbox_status, probeWindowsHostedEffects
    ? "preflight-passed-not-backend-attested" : "not-probed");
  assert.equal(ready.windows_backend_sandbox_status, probeWindowsHostedEffects
    ? "passed-all-active-backends" : "not-requested");
  assert.equal(ready.managed_gateway_turn_ingress_blocked_reason,
    guardedMode ? null : "windows-client.hook-boundary-unverified");
  assert.equal(ready.model_entry_boundary,
    guardedMode ? "guarded-text-only-candidate" : "paused-windows-hooks");
  assert.equal(ready.guarded_user_input_status,
    guardedPlanInput ? "plan-mode-candidate-enabled" : "disabled");
  assert.match(ready.gateway_socket, /^\\\\\.\\pipe\\are-managed-/);
  const launchUrl = new URL(ready.launch_url);
  const token = launchUrl.hash.slice("#token=".length);
  assert.match(token, /^[A-Za-z0-9_-]{32,128}$/);
  launchUrl.hash = "";
  const response = await fetch(new URL("api/state", launchUrl), {headers: {authorization: `Bearer ${token}`}});
  assert.equal(response.status, 200);
  const hostedState = await response.json();
  assert.equal(hostedState.ok, true);
  assert.equal(hostedState.value.ready, true);
  assert.deepEqual(hostedState.value.turn_execution, {enabled: guardedMode,
    reason_code: guardedMode ? null : "windows-client.hook-boundary-unverified"});
  assert.equal(hostedState.value.collaboration_mode,
    guardedPlanInput ? "plan-with-guarded-user-input" : "default");
  if (nativeOrbActive) {
    const activation = spawnSync(companion, [], {env: companionEnvironment, encoding: "utf8",
      timeout: 15000, maxBuffer: 4096, windowsHide: true});
    assert.equal(activation.status, 0,
      `Native orb activation failed: ${(activation.stderr ?? "").slice(-300)}`);
  }
  ownedChildren = processRows(manager.pid);
  const supervisedExecutable = nativeOrbActive ? nativeOrb : companion;
  const companionChildren = ownedChildren.filter(row => row.ExecutablePath?.toLowerCase() === supervisedExecutable.toLowerCase());
  assert.equal(companionChildren.length, 1, "the managed session must own exactly one staged Companion");
  const companionPid = companionChildren[0].ProcessId;
  assert.ok(pidExists(companionPid));
  const gatewayChildren = ownedChildren.filter(row => row.CommandLine?.includes("are-codex-gateway.mjs"));
  assert.equal(gatewayChildren.length, 1, "the managed session must own exactly one gateway");
  const gatewayPid = gatewayChildren[0].ProcessId;
  assert.ok(pidExists(gatewayPid));
  const orbWindow = nativeOrbActive ? await poll(async () => {
    const bounds = nativeOrbWindow(companionPid);
    return bounds?.width === 84 && bounds?.height === 84 ? bounds : null;
  }, "managed-native-orb-window", 30_000) : null;
  const ui = await inspectManagedCompanion(inspectorPort, nativeOrbActive, orbWindow, expectedEvolutionCounts);
  assert.equal(ui.orb_rendered, true);
  let fixtureResult = null;
  let fixtureThreadId = null;
  let fixtureThreadRef = null;
  let fixtureFrontierDigest = null;
  if (fixtureTurn) {
    const hostedApi = async (path, options = {}) => {
      const response = await fetch(new URL(path, launchUrl), {
        ...options,
        headers: {authorization: `Bearer ${token}`, "content-type": "application/json"},
        signal: AbortSignal.timeout(15000),
      });
      const body = await response.json();
      assert.equal(body.ok, true, `${path} failed: ${body.reason ?? response.status}`
        + `${Array.isArray(body.value?.reason_codes) ? ` (${body.value.reason_codes.join(",")})` : ""}`);
      return body.value;
    };
    let browserResult = null;
    let threadId;
    if (browserFixtureTurn) {
      browserResult = await runHostedBrowserFixture(ready.launch_url, productRoot,
        browserReloadDuringPlan, browserRestartDuringPlan);
      threadId = browserResult.thread_label;
    } else {
      const started = await hostedApi("api/threads", {method: "POST",
        body: JSON.stringify({cwd: productRoot, requestKey: `companion-fixture-thread:${randomUUID()}`})});
      threadId = started.thread?.id;
      assert.ok(typeof threadId === "string" && threadId.length > 0);
      const accepted = await hostedApi("api/turns", {method: "POST",
        body: JSON.stringify({threadId, text: "Explain the repository routing architecture briefly.",
          requestKey: `companion-fixture-turn:${randomUUID()}`})});
      assert.ok(typeof accepted.turn?.id === "string" && accepted.turn.id.length > 0);
    }
    if (guardedPlanInput && !browserFixtureTurn) {
      const pending = await poll(async () => {
        const current = await hostedApi("api/state");
        return current.pending_user_inputs?.[0] ?? null;
      }, "hosted-fixture-plan-question", 30000);
      assert.equal(pending.thread_id, threadId);
      assert.deepEqual(pending.questions?.map(question => question.id), ["choice"]);
      if (!crashDuringPlanInput) {
        const answerResponse = await fetch(new URL(`api/user-input/${encodeURIComponent(pending.request_id)}`,
          launchUrl), {method: "POST", headers: {authorization: `Bearer ${token}`,
          "content-type": "application/json"},
          body: JSON.stringify({answers: {choice: {answers: ["Continue"]}}}),
          signal: AbortSignal.timeout(15000)});
        const answer = await answerResponse.json();
        assert.equal(answerResponse.status, 200);
        assert.equal(answer.ok, true);
        assert.equal(answer.request_id, pending.request_id);
      }
    }
    if (crashDuringPlanInput) {
      fixtureThreadId = threadId;
      assert.equal(fixtureProviderRequests, 1,
        "The pending Plan question must not dispatch its answer to the model before the crash.");
      const dashboardPage = await poll(() => page(inspectorPort, "dashboard.html"),
        "managed-pending-plan-dashboard-page");
      const dashboard = await Cdp.connect(dashboardPage.webSocketDebuggerUrl);
      try {
        const observed = await poll(async () => {
          const snapshot = await dashboard.evaluate(`globalThis.__TAURI__.core.invoke("get_thread_snapshot",
            {offset: 0, snapshotDigest: null})`);
          const thread = snapshot?.threads?.[0];
          return snapshot?.threadCount === 1 && thread?.acceptedTurnStartCount >= 1
            ? {snapshot, thread} : null;
        }, "companion-pending-plan-thread", 30000);
        assert.equal(observed.snapshot.scope, "gateway-backend-threads-not-host-activation");
        assert.notEqual(observed.thread.lastCompletionStatus, "completed",
          "A pending Plan question must not appear as a completed turn.");
        fixtureThreadRef = observed.thread.threadRef;
        fixtureFrontierDigest = observed.thread.latestFrontierDigest ?? null;
        fixtureResult = {hosted_turn_completed: false, plan_question_pending: true,
          local_provider_requests: fixtureProviderRequests, companion_thread_observed: true,
          companion_frontier_observed: false};
      } finally { dashboard.close(); }
    } else {
    const history = await poll(async () => {
      const current = await hostedApi(`api/threads/${encodeURIComponent(threadId)}/history`);
      return current.messages?.some(message => message.role === "agent"
        && message.text.includes("ARE_COMPANION_MANAGED_JOIN_OK")) ? current : null;
    }, "hosted-fixture-turn-completion", 45000);
    assert.equal(history.thread_id, threadId);
    fixtureThreadId = threadId;
    assert.equal(fixtureProviderRequests, guardedPlanInput ? 2 : 1);
    assert.equal(fixtureProviderError, null);
    if (guardedPlanInput) assert.equal(fixturePlanAnswerObserved, true);
    const dashboardPage = await poll(() => page(inspectorPort, "dashboard.html"),
      "managed-fixture-dashboard-page");
    const dashboard = await Cdp.connect(dashboardPage.webSocketDebuggerUrl);
    try {
      const observed = await poll(async () => {
        const snapshot = await dashboard.evaluate(`globalThis.__TAURI__.core.invoke("get_thread_snapshot",
          {offset: 0, snapshotDigest: null})`);
        const thread = snapshot?.threads?.[0];
        return snapshot?.threadCount === 1 && snapshot.threads.length === 1
          && thread.acceptedTurnStartCount >= 1
          && /^[0-9a-f]{64}$/.test(thread.latestFrontierDigest ?? "")
          ? {snapshot, thread} : null;
      }, "companion-fixture-reasoning-frontier", 30000);
      assert.equal(observed.snapshot.scope, "gateway-backend-threads-not-host-activation");
      fixtureThreadRef = observed.thread.threadRef;
      fixtureFrontierDigest = observed.thread.latestFrontierDigest;
      await dashboard.evaluate(`document.querySelector('[data-panel="threads"]').click()`);
      await poll(async () => {
        const rendered = await dashboard.evaluate(`({visible: !document.querySelector("#panel-threads")?.hidden,
          count: document.querySelector("#thread-count")?.textContent?.trim(),
          rejoin: document.querySelector("#thread-rejoin-status")?.textContent?.trim(),
          text: document.querySelector("#thread-list")?.innerText ?? ""})`);
        return rendered.visible && rendered.count === "1"
          && rendered.rejoin?.startsWith("Hosted client · 1 of 1 backend threads")
          && rendered.text.includes("Owned in this hosted client")
          && rendered.text.includes("Verified completion frontier") ? rendered : null;
      }, "companion-fixture-thread-render", 30000);
      fixtureResult = {hosted_turn_completed: true, local_provider_requests: fixtureProviderRequests,
        guarded_plan_answer_returned_to_model: guardedPlanInput ? fixturePlanAnswerObserved : null,
        ...(browserResult ? {hosted_browser_question_rendered: browserResult.question_rendered,
          hosted_browser_question_restored_after_reload: browserResult.question_restored_after_reload,
          hosted_browser_question_restored_after_restart: browserResult.question_restored_after_restart,
          hosted_browser_answer_submitted: browserResult.answer_submitted_in_browser,
          hosted_browser_response_rendered: browserResult.response_rendered_in_browser} : {}),
        companion_thread_observed: true, companion_frontier_observed: true};
    } finally { dashboard.close(); }
    }
  }
  const stopStartedAt = Date.now();
  const gatewayOwnedChildren = crashGateway ? processRows(gatewayPid) : [];
  process.kill(crashGateway ? gatewayPid : companionPid, crashGateway ? "SIGKILL" : "SIGTERM");
  const stopRecord = await record("are.managed-session-stopped/v1", 10000);
  assert.equal(stopRecord.component, crashGateway ? "gateway" : "companion");
  assert.equal(await stopped(manager, 35_000), 1,
    `unexpected ${crashGateway ? "gateway" : "Companion"} exit must stop the session`);
  const supervisedStopElapsedMs = Date.now() - stopStartedAt;
  await poll(() => [...ownedChildren, ...gatewayOwnedChildren].every(row => !pidExists(row.ProcessId)),
    "manager-left-an-owned-child-running", 5000);
  let relaunchRecovery = null;
  if (relaunchAfterCrash) {
    assert.ok(fixtureThreadId && fixtureThreadRef && (crashDuringPlanInput || fixtureFrontierDigest),
      "The first managed launch must retain an exact fixture thread.");
    records.length = 0;
    manager = launchManager();
    const resumed = await record("are.managed-session-ready/v1", 45000);
    assert.equal(resumed.ok, true);
    assert.equal(resumed.current_desktop_task_control, false);
    const resumedUrl = new URL(resumed.launch_url);
    const resumedToken = resumedUrl.hash.slice("#token=".length);
    assert.match(resumedToken, /^[A-Za-z0-9_-]{32,128}$/);
    resumedUrl.hash = "";
    const resumedStateResponse = await fetch(new URL("api/state", resumedUrl),
      {headers: {authorization: `Bearer ${resumedToken}`}, signal: AbortSignal.timeout(5000)});
    assert.equal(resumedStateResponse.status, 200);
    const resumedState = await resumedStateResponse.json();
    assert.equal(resumedState.ok, true);
    assert.equal(resumedState.value.recovery_mode, "private-file");
    assert.ok(resumedState.value.thread_ids.includes(fixtureThreadId),
      "The private hosted-client state must retain the original thread identity.");
    if (crashDuringPlanInput) {
      const runtimeResponse = await fetch(new URL(`api/threads/${encodeURIComponent(fixtureThreadId)}/runtime`, resumedUrl),
        {headers: {authorization: `Bearer ${resumedToken}`}, signal: AbortSignal.timeout(5000)});
      const runtimeBody = await runtimeResponse.json();
      const recoveryPosture = {pending_intent: resumedState.value.pending_turn !== null,
        confirmation_required: resumedState.value.recovery_confirmation_required === true,
        last_receipt: resumedState.value.last_turn_result?.schema_version ?? null,
        runtime_http_status: runtimeResponse.status,
        runtime_disposition: runtimeBody.value?.disposition ?? null,
        runtime_reason: runtimeBody.reason ?? null};
      const refusedResume = await fetch(new URL("api/threads/resume", resumedUrl), {method: "POST",
        headers: {authorization: `Bearer ${resumedToken}`, "content-type": "application/json"},
        body: JSON.stringify({threadId: fixtureThreadId, requestKey: `companion-pending-resume:${randomUUID()}`}),
        signal: AbortSignal.timeout(10000)});
      const refusal = await refusedResume.json();
      assert.equal(refusedResume.status, 409,
        `An unsettled Plan turn must not be silently rebound: ${JSON.stringify({...recoveryPosture,
          resume_status: refusedResume.status, resume_reason: refusal.reason ?? null})}`);
      assert.ok(["windows-client.pending-turn-recovery-required",
        "windows-client.reasoning-recovery-unverified",
        "windows-client.hosted-effect-resume-rebind-unverified"].includes(refusal.reason),
      "The in-flight resume refusal must identify its recovery boundary.");
    } else {
      assert.equal(resumedState.value.pending_turn, null,
        "A completed pre-crash turn must not become an unsettled pending turn.");
      const rejoinResponse = await fetch(new URL("api/threads/resume", resumedUrl), {method: "POST",
        headers: {authorization: `Bearer ${resumedToken}`, "content-type": "application/json"},
        body: JSON.stringify({threadId: fixtureThreadId, requestKey: `companion-relaunch-resume:${randomUUID()}`}),
        signal: AbortSignal.timeout(10000)});
      const rejoin = await rejoinResponse.json();
      assert.equal(rejoinResponse.status, 200,
        `The retained thread could not be explicitly rejoined: ${rejoin.reason ?? "unknown"}`);
      assert.equal(rejoin.value?.thread?.id, fixtureThreadId);
      const recoveredHistory = await poll(async () => {
        const response = await fetch(new URL(`api/threads/${encodeURIComponent(fixtureThreadId)}/history`, resumedUrl),
          {headers: {authorization: `Bearer ${resumedToken}`}, signal: AbortSignal.timeout(5000)});
        if (response.status !== 200) return null;
        const body = await response.json();
        const value = body.value ?? body;
        return body.ok && value.messages?.some(message => message.role === "agent"
          && message.text.includes("ARE_COMPANION_MANAGED_JOIN_OK")) ? value : null;
      }, "relaunch-retained-hosted-history", 30000);
      assert.equal(recoveredHistory.thread_id, fixtureThreadId);
      const recoveredAgentMessages = recoveredHistory.messages.filter(message => message.role === "agent"
        && message.text.includes("ARE_COMPANION_MANAGED_JOIN_OK"));
      assert.equal(recoveredAgentMessages.length, 1, "A relaunch must not replay the completed turn.");
    }
    if (nativeOrbActive) {
      const activation = spawnSync(companion, [], {env: companionEnvironment, encoding: "utf8",
        timeout: 15000, maxBuffer: 4096, windowsHide: true});
      assert.equal(activation.status, 0, "The relaunched native orb did not open its dashboard.");
    }
    const resumedOwnedChildren = processRows(manager.pid);
    const resumedCompanion = resumedOwnedChildren.find(row =>
      row.ExecutablePath?.toLowerCase() === supervisedExecutable.toLowerCase());
    assert.ok(resumedCompanion, "The relaunched manager must own one Companion.");
    const resumedUi = await inspectManagedCompanion(inspectorPort, nativeOrbActive,
      nativeOrbActive ? await poll(() => nativeOrbWindow(resumedCompanion.ProcessId),
        "relaunched-native-orb-window", 30000) : null, expectedEvolutionCounts);
    assert.equal(resumedUi.dashboard_rendered, true);
    const resumedDashboardPage = await poll(() => page(inspectorPort, "dashboard.html"),
      "relaunch-dashboard-page", 30000);
    const resumedDashboard = await Cdp.connect(resumedDashboardPage.webSocketDebuggerUrl);
    try {
      const recovered = await poll(async () => {
        const snapshot = await resumedDashboard.evaluate(`globalThis.__TAURI__.core.invoke("get_thread_snapshot",
          {offset: 0, snapshotDigest: null})`);
        const thread = snapshot?.threads?.find(item => item.threadRef === fixtureThreadRef);
        return snapshot?.threadCount === 1 && thread
          && (crashDuringPlanInput || thread.latestFrontierDigest === fixtureFrontierDigest)
          ? {snapshot, thread} : null;
      }, "relaunch-companion-exact-frontier", 30000);
      assert.equal(recovered.snapshot.scope, "gateway-backend-threads-not-host-activation");
      assert.equal(recovered.thread.threadRef, fixtureThreadRef);
      if (crashDuringPlanInput) {
        assert.notEqual(recovered.thread.lastCompletionStatus, "completed",
          "An unanswered Plan question must not become a completed frontier after relaunch.");
      } else assert.equal(recovered.thread.latestFrontierDigest, fixtureFrontierDigest);
    } finally { resumedDashboard.close(); }
    await new Promise(done => setTimeout(done, 1000));
    assert.equal(fixtureProviderRequests, crashDuringPlanInput ? 1 : guardedPlanInput ? 2 : 1,
      "The relaunch must not make another model request.");
    const resumedGateway = resumedOwnedChildren.find(row => row.CommandLine?.includes("are-codex-gateway.mjs"));
    assert.ok(resumedGateway, "The relaunched manager must own one gateway.");
    const resumedGatewayChildren = processRows(resumedGateway.ProcessId);
    records.length = 0;
    process.kill(resumedCompanion.ProcessId, "SIGTERM");
    const resumedStop = await record("are.managed-session-stopped/v1", 10000);
    assert.equal(resumedStop.component, "companion");
    assert.equal(await stopped(manager, 35000), 1);
    await poll(() => [...resumedOwnedChildren, ...resumedGatewayChildren]
      .every(row => !pidExists(row.ProcessId)), "relaunch-left-an-owned-child-running", 5000);
    relaunchRecovery = crashDuringPlanInput
      ? {same_hosted_thread: true, unsettled_turn_refused_resume: true,
        no_fabricated_completed_frontier: true, replay_model_requests: 0, supervised_stop: true}
      : {same_hosted_thread: true, single_completed_message: true,
        same_companion_frontier: true, replay_model_requests: 0, supervised_stop: true};
  }
  process.stdout.write(`${JSON.stringify({schema_version: "are.managed-session-windows-ui-smoke/v1", ok: true,
    gateway_ready: true, hosted_client_ready: true, companion_process_started: true,
    managed_orb_rendered: ui.orb_rendered, managed_orb_surface: ui.orb_surface,
    managed_dashboard_rendered: ui.dashboard_rendered,
    managed_panel_count: ui.panel_count, managed_gateway: ui.gateway,
    managed_backend: ui.backend, managed_client_link: ui.client,
    managed_host_control: ui.host,
    managed_hosted_rejoin: ui.hosted_rejoin,
    managed_evolution_source: ui.evolution_source,
    managed_evolution_cycle_count: ui.evolution_cycle_count,
    managed_evolution_commit_count: ui.evolution_commit_count,
    managed_turn_ingress: ui.ingress, managed_model_wire_guard: ui.model_wire_guard,
    managed_hosted_input_proof: ui.hosted_input_proof,
    guarded_text_only_candidate: guardedMode,
    guarded_plan_input_candidate: guardedPlanInput,
    verified_windows_sandbox_mode: ready.windows_sandbox_mode,
    windows_hosted_command_sandbox_status: ready.windows_hosted_command_sandbox_status,
    windows_backend_sandbox_status: ready.windows_backend_sandbox_status,
    hosted_collaboration_mode: hostedState.value.collaboration_mode,
    hosted_turn_execution_enabled: hostedState.value.turn_execution.enabled,
    gateway_turn_execution_blocked: ready.managed_gateway_turn_ingress_blocked_reason === "windows-client.hook-boundary-unverified",
    companion_exit_supervised: !crashGateway, gateway_crash_supervised: crashGateway,
    supervised_stop_elapsed_ms: supervisedStopElapsedMs,
    current_desktop_task_control: false,
    private_model_calls: fixtureProviderRequests, external_model_calls: 0,
    ...(fixtureResult ? {fixture_turn: fixtureResult} : {}), installed: false,
    ...(relaunchRecovery ? {relaunch_recovery: relaunchRecovery} : {}),
    resource_origin: sourceManager ? "source-manager-with-adjacent-package-resources"
      : packageRoot ? "adjacent-package-resources" : "repository-source",
    authority_effect: "none"})}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({schema_version: "are.managed-session-windows-ui-smoke-failure/v1",
    ok: false, reason: error.message, managed_diagnostics_present: diagnostics.length > 0,
    managed_reason: diagnostics.split("\n").flatMap(line => {
      try { const value = JSON.parse(line); return typeof value.reason === "string" ? [value.reason] : []; }
      catch { return []; }
    }).at(-1) ?? null, authority_effect: "none"})}\n`);
  process.exitCode = 1;
} finally {
  if (hostedBrowser?.pid && hostedBrowser.exitCode === null && hostedBrowser.signalCode === null) {
    spawnSync("taskkill.exe", ["/PID", String(hostedBrowser.pid), "/T", "/F"],
      {encoding: "utf8", timeout: 10000, windowsHide: true});
  }
  if (manager && manager.exitCode === null && manager.signalCode === null) {
    for (const row of processRows(manager.pid)) if (pidExists(row.ProcessId)) process.kill(row.ProcessId, "SIGTERM");
    try { await stopped(manager, 5000); } catch { manager.kill("SIGTERM"); }
  }
  if (fixtureProvider?.listening) {
    fixtureProvider.closeAllConnections();
    await new Promise(done => fixtureProvider.close(done));
  }
  rmSync(scratch, {recursive: true, force: true, maxRetries: 20, retryDelay: 200});
}
