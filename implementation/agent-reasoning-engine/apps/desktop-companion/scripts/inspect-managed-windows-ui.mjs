#!/usr/bin/env node
// Test-only CDP read of the Companion already launched by an isolated managed session.
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {existsSync} from "node:fs";

assert.equal(process.platform, "win32", "native Windows WebView2 is required");
assert.ok(process.argv.length === 4 || (process.argv.length === 6 && process.argv[4] === "--native-orb-pid"),
  "usage: inspect-managed-windows-ui.mjs <port> --verify-managed-turn [--native-orb-pid <pid>]");
const port = Number(process.argv[2]);
assert.ok(Number.isSafeInteger(port) && port > 0 && port < 65536);
assert.equal(process.argv[3], "--verify-managed-turn");
const nativeOrbPid = process.argv.length === 6 ? Number(process.argv[5]) : null;
if (nativeOrbPid !== null) {
  assert.ok(Number.isSafeInteger(nativeOrbPid) && nativeOrbPid > 0, "Native orb PID is invalid");
  assert.doesNotThrow(() => process.kill(nativeOrbPid, 0), "Managed native orb is not running");
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

async function page(filename) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, {signal: AbortSignal.timeout(1500)});
  if (!response.ok) throw new Error(`webview-debugger-http:${response.status}`);
  const matches = (await response.json()).filter(item => {
    try { return item.type === "page" && new URL(item.url).pathname.endsWith(`/${filename}`); }
    catch { return false; }
  });
  assert.ok(matches.length <= 1, `ambiguous ${filename} in isolated WebView2 profile`);
  return matches[0] ?? null;
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

  async evaluate(expression) {
    const id = this.nextId++;
    const result = await new Promise((done, fail) => {
      const timer = setTimeout(() => { this.pending.delete(id); fail(new Error("cdp-evaluate-timeout")); }, 10000);
      this.pending.set(id, {done, fail, timer});
      this.socket.send(JSON.stringify({id, method: "Runtime.evaluate",
        params: {expression, returnByValue: true, awaitPromise: true}}));
    });
    if (result.exceptionDetails) throw new Error(`webview-evaluate:${result.exceptionDetails.text}`);
    return result.result?.value;
  }

  close() { this.socket.close(); }
}

let orb;
let dashboard;
try {
  if (nativeOrbPid !== null) {
    const companion = process.env.ARE_MANAGED_CANARY_COMPANION;
    assert.ok(companion && existsSync(companion), "Managed dashboard launcher is unavailable");
    const activation = spawnSync(companion, [], {encoding: "utf8", timeout: 15000,
      maxBuffer: 4096, windowsHide: true});
    assert.equal(activation.status, 0,
      `Managed native orb activation failed: ${(activation.stderr ?? "").slice(-300)}`);
  } else {
    const orbPage = await poll(() => page("orb.html"), "managed-orb-page");
    orb = await Cdp.connect(orbPage.webSocketDebuggerUrl);
    await poll(async () => {
      const value = await orb.evaluate(`({ready:document.readyState,
        orb:Boolean(document.querySelector("#orb")), bridge:Boolean(globalThis.__TAURI__?.core?.invoke)})`);
      return value.ready === "complete" && value.orb && value.bridge ? value : null;
    }, "managed-orb-render");
    await orb.evaluate(`document.querySelector("#orb").click()`);
  }
  const dashboardPage = await poll(() => page("dashboard.html"), "managed-dashboard-page");
  if (nativeOrbPid !== null) assert.equal(await page("orb.html"), null,
    "Native mode must not create an orb WebView");
  dashboard = await Cdp.connect(dashboardPage.webSocketDebuggerUrl);
  await poll(async () => {
    const value = await dashboard.evaluate(`({ready:document.readyState,
      panelCount:document.querySelectorAll(".nav-item[data-panel]").length,
      bodyLength:document.body?.innerText.length ?? 0})`);
    return value.ready === "complete" && value.panelCount === 7 && value.bodyLength > 100 ? value : null;
  }, "managed-dashboard-render");
  await dashboard.evaluate(`document.querySelector('[data-panel="adapters"]').click()`);
  const adapter = await poll(async () => {
    const value = await dashboard.evaluate(`(() => ({
      posture:document.querySelector("#adapter-observation-status")?.textContent?.trim(),
      gateway:document.querySelector("#adapter-gateway-state")?.textContent?.trim(),
      backend:document.querySelector("#adapter-backend-state")?.textContent?.trim(),
      client:document.querySelector("#adapter-client-state")?.textContent?.trim(),
      host:document.querySelector("#adapter-host-control-state")?.textContent?.trim()
    }))()`);
    return value.posture === "Observed" && value.gateway === "running"
      && value.backend === "ready" && value.client === "connected" ? value : null;
  }, "managed-adapter-same-gateway");
  assert.equal(adapter.host, "unverified");
  await dashboard.evaluate(`document.querySelector('[data-panel="threads"]').click()`);
  const thread = await poll(async () => {
    const value = await dashboard.evaluate(`(() => ({
      posture:document.querySelector("#thread-observation-status")?.textContent?.trim(),
      count:document.querySelector("#thread-count")?.textContent?.trim(),
      source:document.querySelector("#thread-observation-source")?.textContent?.trim(),
      row:document.querySelector("#thread-list .thread-card")?.innerText
    }))()`);
    return value.posture === "Observed" && value.count === "1"
      && value.source?.includes("same gateway epoch as Adapters")
      && value.row?.includes("Verified completion frontier") ? value : null;
  }, "managed-thread-completion-frontier");
  await dashboard.evaluate(`document.querySelector('#thread-list .thread-card button').click()`);
  const decision = await poll(async () => {
    const value = await dashboard.evaluate(`(() => ({
      visible:!document.querySelector("#panel-decisions")?.hidden,
      posture:document.querySelector("#decision-observation-status")?.textContent?.trim(),
      count:document.querySelector("#decision-count")?.textContent?.trim(),
      row:document.querySelector("#decision-list .thread-card")?.innerText
    }))()`);
    return value.visible && value.posture === "Observed" && value.row ? value : null;
  }, "managed-linked-decision");
  process.stdout.write(`${JSON.stringify({schema_version:"are.managed-windows-ui-inspection/v1",ok:true,
    renderer:"WebView2",orb_document:nativeOrbPid === null,
    native_orb_process:nativeOrbPid !== null, dashboard_document:true,panel_count:7,
    managed_path:{gateway:adapter.gateway,backend:adapter.backend,client:adapter.client,host:adapter.host},
    managed_turn:{posture:thread.posture,count:thread.count,same_gateway_epoch:true,
      completion_frontier:true,linked_decision:Boolean(decision.row)},authority_effect:"none"})}\n`);
} finally { dashboard?.close(); orb?.close(); }
