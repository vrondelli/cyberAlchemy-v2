import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {mkdtempSync, rmSync} from "node:fs";
import {createRequire} from "node:module";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {AppServerRpcError, createApprovalBroker, createElicitationBroker, createHostedEffectApprovalAdapter,
  createUserInputBroker, createWindowsClientHost} from "../index.mjs";
import {digestValue} from "../src/canonical.mjs";
import {GATEWAY_STEER_OUTCOME_GET} from "../src/gateway.mjs";
import {adoptPendingSteer, clearPendingSteer, preparePendingSteer, readPendingSteer} from "../client/pending-steer.js";

const require = createRequire(import.meta.url);
const playwrightRoot = process.env.ARE_PLAYWRIGHT_ROOT;
const browserPath = process.env.ARE_CHROMIUM;

test("pending steer checkpoint retains only an exact turn key and text digest", async () => {
  const entries = new Map();
  const storage = {getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key)};
  const pending = await preparePendingSteer(storage, "owned-thread", "active-turn", "Private steering guidance");
  assert.equal(pending.thread_id, "owned-thread");
  assert.equal(pending.turn_id, "active-turn");
  assert.match(pending.request_key, /^steer:[0-9a-f-]{36}$/u);
  assert.equal(JSON.stringify([...entries]).includes("Private steering guidance"), false);
  assert.deepEqual(readPendingSteer(storage), pending);
  await assert.rejects(preparePendingSteer(storage, "owned-thread", "active-turn", "Different guidance"),
    /earlier steer outcome is unresolved/);
  assert.throws(() => clearPendingSteer(storage, {...pending, turn_id: "other-turn"}), /changed/);
  clearPendingSteer(storage, pending);
  assert.equal(readPendingSteer(storage), null);
  const hostEntry = {...pending, created_at: "2026-10-01T00:00:00.000Z"};
  assert.deepEqual(adoptPendingSteer(storage, hostEntry), pending);
  assert.throws(() => adoptPendingSteer(storage, {...hostEntry, text_digest: "c".repeat(64)}), /disagree/);
  clearPendingSteer(storage, pending);
  assert.throws(() => adoptPendingSteer(storage, {...hostEntry, unexpected: true}), /invalid/);
  entries.set("are.pendingSteer.v1", "{bad-json");
  assert.throws(() => readPendingSteer(storage), /unreadable/);
});

test("hosted browser recovers a lost active-turn steer response by status only after reload", {
  skip: !playwrightRoot || !browserPath,
}, async context => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-steer-browser-"));
  const seenSteers = [];
  const seenStatusKeys = [];
  let active = false;
  let settlementVisible = false;
  const rpc = {
    events: new EventEmitter(),
    initialize: async () => ({platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}),
    notify: async () => {},
    startThread: async () => ({thread: {id: "fixture-thread"}, instructionSources: []}),
    request: async (method, params, options) => {
      if (method === "cyberalchemy/learning/status") return {available: false};
      if (method === "thread/read") return {thread: {id: params.threadId, status: {type: active ? "active" : "idle"}}};
      if (method === "thread/turns/list") return {data: active ? [{id: "fixture-turn", status: "inProgress"}] : [], nextCursor: null};
      if (method === "turn/start") { active = true; return {turn: {id: "fixture-turn"}}; }
      if (method === "turn/steer") {
        seenSteers.push({params, options});
        throw new Error("response lost after gateway dispatch");
      }
      if (method === GATEWAY_STEER_OUTCOME_GET) {
        seenStatusKeys.push(params.requestKey);
        return {schema_version: "are.gateway-steer-outcome/v1", authority_effect: "none",
          disposition: settlementVisible && seenSteers.some(item => item.options.idempotency_key === params.requestKey)
            ? "settled-accepted" : "unrecorded"};
      }
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0, token: "browser-steer-fixture-token"});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close();
    rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(`${ready.url}#token=${host.token}`);
  await page.locator("#start-thread").click();
  await page.locator("#status").getByText("Ready").waitFor({timeout: 5000}).catch(async error => {
    throw new Error(`${error.message}; current status: ${await page.locator("#status").textContent()}; page errors: ${pageErrors.join(" | ")}`);
  });
  await page.locator("#prompt").fill("Start the active task");
  await page.locator("#send").click();
  await page.locator("#steer").waitFor({state: "visible"});
  await page.waitForFunction(() => !document.getElementById("steer").disabled);
  let loseSteerResponse = true;
  let loseStatusResponse = true;
  await page.route("**/api/turns/steer", async route => {
    if (!loseSteerResponse) return route.continue();
    loseSteerResponse = false;
    await route.fetch();
    await route.abort("failed");
  });
  await page.route("**/api/turns/steer/status", async route => {
    if (!loseStatusResponse) return route.continue();
    loseStatusResponse = false;
    await route.abort("failed");
  });
  await page.locator("#prompt").fill("Correct the scope of the active task");
  await page.locator("#steer").click();
  await page.locator("#pending-steer-note").getByText("could not be verified").waitFor();
  const saved = await page.evaluate(() => sessionStorage.getItem("are.pendingSteer.v1"));
  assert.ok(saved);
  assert.equal(saved.includes("Correct the scope"), false);
  assert.equal(await page.locator("#steer").isDisabled(), true);
  assert.equal(await page.locator("#interrupt").isDisabled(), true);
  assert.equal(seenSteers.length, 1);
  assert.equal((await (await fetch(`${ready.url}api/state`, {headers: {authorization: `Bearer ${host.token}`}})).json()).value.pending_steer.request_key,
    JSON.parse(saved).request_key);
  await page.evaluate(() => sessionStorage.removeItem("are.pendingSteer.v1"));
  await page.reload();
  await page.locator("#pending-steer-note").getByText("No durable gateway receipt is visible yet").waitFor();
  assert.equal(await page.locator("#steer").isDisabled(), true);
  assert.equal(seenSteers.length, 1, "An unrecorded read must not retry the steer.");
  settlementVisible = true;
  await page.locator("#check-steer").click();
  await page.locator("#pending-steer-note").getByText("confirmed this guidance was accepted").waitFor();
  assert.equal(await page.evaluate(() => sessionStorage.getItem("are.pendingSteer.v1")), null);
  await page.waitForFunction(() => !document.getElementById("steer").disabled);
  assert.equal(seenSteers.length, 1, "Reload must never redispatch steering guidance.");
  assert.ok(seenStatusKeys.includes(JSON.parse(saved).request_key));
  assert.deepEqual(pageErrors, []);
});

test("hosted browser adopts a successful steer whose HTTP response was lost", {
  skip: !playwrightRoot || !browserPath,
}, async context => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-steer-success-loss-"));
  const seenSteers = [];
  let active = false;
  let settlementVisible = false;
  const rpc = {
    events: new EventEmitter(),
    initialize: async () => ({platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}),
    notify: async () => {},
    startThread: async () => ({thread: {id: "fixture-thread"}, instructionSources: []}),
    request: async (method, params, options) => {
      if (method === "cyberalchemy/learning/status") return {available: false};
      if (method === "thread/read") return {thread: {id: params.threadId, status: {type: active ? "active" : "idle"}}};
      if (method === "thread/turns/list") return {data: active ? [{id: "fixture-turn", status: "inProgress"}] : [], nextCursor: null};
      if (method === "turn/start") { active = true; return {turn: {id: "fixture-turn"}}; }
      if (method === "turn/steer") {
        seenSteers.push({params, options});
        return {turnId: params.expectedTurnId};
      }
      if (method === GATEWAY_STEER_OUTCOME_GET) return {schema_version: "are.gateway-steer-outcome/v1",
        authority_effect: "none", disposition: settlementVisible ? "settled-accepted" : "pending"};
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0,
    token: "browser-steer-success-loss-fixture-token"});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close();
    rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(`${ready.url}#token=${host.token}`);
  await page.locator("#start-thread").click();
  await page.locator("#status").getByText("Ready").waitFor();
  await page.locator("#prompt").fill("Start the active task");
  await page.locator("#send").click();
  await page.waitForFunction(() => !document.getElementById("steer").disabled);
  let loseResponse = true;
  await page.route("**/api/turns/steer", async route => {
    if (!loseResponse) return route.continue();
    loseResponse = false;
    const forwarded = await route.fetch();
    assert.equal(forwarded.status(), 202);
    await route.abort("failed");
  });
  await page.locator("#prompt").fill("Correct the active task");
  await page.locator("#steer").click();
  await page.locator("#pending-steer-note").getByText("Gateway receipt is pending").waitFor();
  const saved = await page.evaluate(() => sessionStorage.getItem("are.pendingSteer.v1"));
  assert.ok(saved);
  assert.equal(seenSteers.length, 1);
  const pending = (await (await fetch(`${ready.url}api/state`,
    {headers: {authorization: `Bearer ${host.token}`}})).json()).value.pending_steer;
  assert.equal(pending.request_key, JSON.parse(saved).request_key,
    "host must retain a successful steer after its HTTP response was lost");
  await page.evaluate(() => sessionStorage.removeItem("are.pendingSteer.v1"));
  await page.reload();
  await page.locator("#pending-steer-note").getByText("Gateway receipt is pending").waitFor();
  assert.equal(await page.locator("#steer").isDisabled(), true);
  settlementVisible = true;
  await page.locator("#check-steer").click();
  await page.locator("#pending-steer-note").getByText("confirmed this guidance was accepted").waitFor();
  assert.equal(await page.evaluate(() => sessionStorage.getItem("are.pendingSteer.v1")), null);
  assert.equal((await (await fetch(`${ready.url}api/state`,
    {headers: {authorization: `Bearer ${host.token}`}})).json()).value.pending_steer, null);
  assert.equal(seenSteers.length, 1, "browser recovery must not resend guidance");
  await page.waitForFunction(() => !document.getElementById("steer").disabled);
  await page.locator("#prompt").fill("Refine the active task once more");
  await page.locator("#steer").click();
  await page.locator("#status").getByText("Steer accepted for active turn").waitFor();
  assert.equal(await page.evaluate(() => sessionStorage.getItem("are.pendingSteer.v1")), null,
    "ordinary HTTP success must also complete exact status and acknowledgement");
  assert.equal((await (await fetch(`${ready.url}api/state`,
    {headers: {authorization: `Bearer ${host.token}`}})).json()).value.pending_steer, null);
  assert.equal(seenSteers.length, 2);
  assert.deepEqual(pageErrors, []);
});

test("hosted browser identifies guarded Plan input without claiming desktop-task control", {
  skip: !playwrightRoot || !browserPath,
}, async context => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-plan-mode-browser-"));
  const rpc = {
    events: new EventEmitter(),
    initialize: async () => ({platformFamily: "win32", platformOs: "windows", userAgent: "fixture"}),
    notify: async () => {},
    request: async method => {
      if (method === "cyberalchemy/learning/status") return {available: false};
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const userInputs = createUserInputBroker();
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
    user_input_broker: userInputs, repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0,
    token: "browser-plan-mode-fixture-token", require_restricted_mcp_catalog: true,
    guarded_user_input_plan: true, guarded_plan_model: "fixture-model"});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close();
    rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(`${ready.url}#token=${host.token}`);
  const note = page.locator("#mode-note");
  await note.waitFor({state: "visible"});
  assert.match(await note.textContent(), /Plan mode is active for this hosted session/);
  assert.match(await note.textContent(), /only request_user_input/);
  assert.match(await note.textContent(), /does not control your current desktop task/);
  const answer = userInputs.request({id: "fixture-plan-question", method: "item/tool/requestUserInput",
    params: {threadId: "fixture-thread", turnId: "fixture-turn", itemId: "fixture-item",
      questions: [{id: "scope", header: "Scope", question: "Which review scope?",
        isOther: true, isSecret: false, options: [
          {label: "Read-only", description: "Inspect without changes"},
          {label: "Stop", description: "Do not proceed"},
        ]}]}});
  await page.reload();
  const prompt = page.locator("#user-inputs form");
  await prompt.waitFor({state: "visible"});
  assert.match(await prompt.textContent(), /Which review scope\?/);
  await prompt.locator("select").selectOption("0");
  await prompt.getByRole("button", {name: "Send answers"}).click();
  assert.equal((await answer).answers.scope.answers[0], "Read-only");
  await prompt.waitFor({state: "detached"});
  assert.deepEqual(userInputs.snapshot(), []);
  const otherAnswer = userInputs.request({id: "fixture-plan-other", method: "item/tool/requestUserInput",
    params: {threadId: "fixture-thread", turnId: "fixture-turn", itemId: "fixture-other-item",
      questions: [{id: "approach", header: "Approach", question: "Which approach?",
        isOther: true, isSecret: false, options: [
          {label: "Default", description: "Use the standard approach"},
        ]}]}});
  await page.reload();
  const otherPrompt = page.locator("#user-inputs form");
  await otherPrompt.waitFor({state: "visible"});
  await otherPrompt.locator("select").selectOption("__are_other__");
  await otherPrompt.locator("input").fill("Inspect the adapter boundary first");
  await otherPrompt.getByRole("button", {name: "Send answers"}).click();
  assert.equal((await otherAnswer).answers.approach.answers[0], "Inspect the adapter boundary first");
  await otherPrompt.waitFor({state: "detached"});
  assert.deepEqual(userInputs.snapshot(), []);
  assert.deepEqual(pageErrors, []);
});

test("hosted browser retains the exact thread-creation key after a lost response and reload", {
  skip: !playwrightRoot || !browserPath,
}, async (context) => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-thread-retry-browser-"));
  const events = new EventEmitter();
  const seenKeys = [];
  const created = new Map();
  const rpc = {
    events,
    initialize: async () => ({platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}),
    notify: async () => {},
    startThread: async (_params, options) => {
      const key = options.idempotency_key;
      seenKeys.push(key);
      if (!created.has(key)) created.set(key, {thread: {id: "fixture-thread"}, instructionSources: []});
      return created.get(key);
    },
    request: async (method, params) => {
      if (method === "cyberalchemy/learning/status") return {available: false};
      if (method === "thread/read") return {thread: {id: params.threadId, status: {type: "idle"}}};
      if (method === "thread/turns/list") return {data: [], nextCursor: null};
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0, token: "browser-fixture-token"});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close(); rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  let firstPost = true;
  await page.route("**/api/threads", async (route) => {
    if (!firstPost) return route.continue();
    firstPost = false;
    await route.fetch();
    await route.abort("failed");
  });
  await page.goto(`${ready.url}#token=${host.token}`);
  await page.locator("#start-thread").click();
  await page.locator("#pending-thread-note").getByText("may have reached the host").waitFor();
  const saved = await page.evaluate(() => localStorage.getItem("are.pendingThread.v1"));
  assert.ok(saved);
  assert.equal(seenKeys.length, 1);
  await page.reload();
  await page.locator("#start-thread").getByText("Retry exact thread creation").waitFor();
  await page.locator("#start-thread").click();
  await page.locator("#thread-label").getByText("fixture-thread").waitFor();
  assert.deepEqual(seenKeys, [seenKeys[0], seenKeys[0]]);
  assert.equal(created.size, 1);
  assert.equal(await page.evaluate(() => localStorage.getItem("are.pendingThread.v1")), null);
  assert.deepEqual(pageErrors, []);
});

test("hosted browser keeps Send blocked after native completion until audited runtime is idle", {
  skip: !playwrightRoot || !browserPath,
}, async (context) => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-completion-browser-"));
  const events = new EventEmitter();
  let activeSnapshotRemaining = 0;
  let activeSnapshotObserved = false;
  const rpc = {
    events,
    initialize: async () => ({platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}),
    notify: async () => {},
    startThread: async () => ({thread: {id: "fixture-thread"}, instructionSources: []}),
    request: async (method, params) => {
      if (method === "cyberalchemy/learning/status") return {available: false};
      if (method === "thread/read") {
        if (activeSnapshotRemaining > 0) {
          activeSnapshotRemaining -= 1;
          activeSnapshotObserved = true;
          return {thread: {id: params.threadId, status: {type: "active"}}};
        }
        return {thread: {id: params.threadId, status: {type: "idle"}}};
      }
      if (method === "thread/turns/list") return {data: [{id: "fixture-turn", status: "completed"}], nextCursor: null};
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0, token: "browser-fixture-token"});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close(); rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${ready.url}#token=${host.token}`);
  await page.locator("#start-thread").click();
  await page.locator("#status").getByText("Ready").waitFor();
  let historyReady = false;
  let blockedRuntimeRequests = 0;
  await page.route("**/api/threads/*/runtime", async (route) => {
    if (historyReady) return route.continue();
    blockedRuntimeRequests += 1;
    return route.fulfill({status: 409, contentType: "application/json",
      body: JSON.stringify({ok: false, reason: "windows-client.history-unavailable"})});
  });
  events.emit("notification", {method: "turn/completed", params: {threadId: "fixture-thread",
    turn: {id: "fixture-turn", status: "completed", items: []}}});
  await page.locator("#status").getByText("Verifying turn history").waitFor();
  assert.equal(await page.locator("#send").isDisabled(), true);
  const blockedDeadline = Date.now() + 1000;
  while (blockedRuntimeRequests === 0 && Date.now() < blockedDeadline) await new Promise((resolveWait) => setTimeout(resolveWait, 10));
  assert.ok(blockedRuntimeRequests > 0, "Native completion must trigger an audited runtime read.");
  activeSnapshotRemaining = 1;
  historyReady = true;
  await page.locator("#status").getByText("Ready").waitFor();
  assert.equal(activeSnapshotObserved, true);
  assert.equal(await page.locator("#send").isDisabled(), false);
  assert.deepEqual(pageErrors, []);
});

test("hosted browser clears only a definite ARE preflight refusal and preserves its bounded diagnostic", {
  skip: !playwrightRoot || !browserPath,
}, async context => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-preflight-browser-"));
  const requestKeys = [];
  const rpc = {
    events: new EventEmitter(),
    initialize: async () => ({platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}),
    notify: async () => {},
    startThread: async () => ({thread: {id: "fixture-thread"}, instructionSources: []}),
    request: async (method, params, options) => {
      if (method === "cyberalchemy/learning/status") return {available: false};
      if (method === "thread/read") return {thread: {id: params.threadId, status: {type: "idle"}}};
      if (method === "thread/turns/list") return {data: [], nextCursor: null};
      if (method === "turn/start") {
        requestKeys.push(options?.idempotency_key);
        if (requestKeys.length === 1) throw new AppServerRpcError("rpc.response-error",
          "turn/start: ARE preflight failed: PRIVATE_SOURCE", {code: -32070,
            message: "ARE preflight failed", data: {ok: false, authority_effect: "none",
              reason_codes: ["learning.request-recorded-dispatch-not-retried"],
              residue: ["PRIVATE_SOURCE"]}});
        return {turn: {id: "fixture-turn"}};
      }
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0, token: "browser-fixture-token"});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close();
    rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(`${ready.url}#token=${host.token}`);
  await page.locator("#start-thread").click();
  await page.locator("#status").getByText("Ready").waitFor();
  await page.locator("#prompt").fill("Continue");
  await page.locator("#send").click();
  await page.locator("#status").getByText("ARE could not prepare this turn").waitFor();
  assert.equal(await page.evaluate(() => sessionStorage.getItem("are.pendingTurn.v2")), null);
  assert.match(await page.locator("#diagnostics").textContent(),
    /learning.request-recorded-dispatch-not-retried/);
  assert.doesNotMatch(await page.locator("body").textContent(), /PRIVATE_SOURCE/);
  assert.equal(await page.locator("#send").isDisabled(), false);
  await page.locator("#send").click();
  await page.locator("#status").getByText("Ready").waitFor();
  assert.equal(requestKeys.length, 2);
  assert.notEqual(requestKeys[0], requestKeys[1]);
  assert.deepEqual(pageErrors, []);
});

test("hosted browser retains a content-free pending review and explicitly dismisses it after reload", {
  skip: !playwrightRoot || !browserPath,
}, async (context) => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-feedback-review-browser-"));
  const calls = [];
  const text = "Your last answer was too technical. Just this once, use plain language.";
  let pendingItem = null;
  const rpc = {
    events: new EventEmitter(),
    initialize: async () => ({platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}),
    notify: async () => {},
    startThread: async () => ({thread: {id: "fixture-thread"}, instructionSources: []}),
    request: async (method, params) => {
      if (method === "cyberalchemy/learning/status") return {available: true};
      if (method === "thread/read") return {thread: {id: params.threadId, status: {type: "idle"}}};
      if (method === "thread/turns/list") return {data: [], nextCursor: null};
      if (method === "turn/start") { calls.push([method, params]); return {turn: {id: "fixture-ordinary-turn"}}; }
      if (method === "cyberalchemy/learning/submitFeedback") {
        calls.push([method, params]);
        return {ok: true, disposition: "pending", feedback_ref: "feedback:fixture-review",
          reason_codes: ["learning.feedback-scope-conflict"]};
      }
      if (method === "cyberalchemy/learning/pendingFeedback/list") {
        calls.push([method, params]);
        return {ok: true, schema_version: "are.pending-feedback-list/v1", thread_id: params.threadId,
          count: pendingItem ? 1 : 0, items: pendingItem ? [pendingItem] : [], authority_effect: "none"};
      }
      if (method === "cyberalchemy/learning/dismissPendingFeedback") {
        calls.push([method, params]);
        return {ok: true, disposition: "dismissed", feedback_ref: "feedback:fixture-review"};
      }
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0, token: "browser-fixture-token"});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close(); rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${ready.url}#token=${host.token}`);
  await page.locator("#start-thread").click();
  await page.locator("#status").getByText("Ready").waitFor();
  await page.locator("#prompt").fill(text);
  await page.locator("#save-feedback").click();
  await page.locator("#status").getByText("one answer or task").waitFor();
  await page.locator("#feedback-note").getByText("pending review in ARE").waitFor();
  assert.match(await page.locator("#feedback-note").textContent(), /One-time and task-only notes cannot be applied/);
  assert.match(await page.locator("#feedback-review-fields").textContent(), /Use Send for those requests/);
  const marker = await page.evaluate(() => localStorage.getItem("are.pendingFeedback.v1"));
  assert.ok(marker);
  assert.equal(JSON.parse(marker).schema_version, "are.codex-client-pending-feedback-review/v1");
  assert.equal(marker.includes(text), false);
  pendingItem = {feedback_id: JSON.parse(marker).request_key, text_digest: JSON.parse(marker).text_digest};
  assert.equal(await page.locator("#send").isDisabled(), false);
  await page.reload();
  await page.locator("#dismiss-feedback").waitFor({state: "visible"});
  await page.evaluate(() => localStorage.removeItem("are.pendingFeedback.v1"));
  await page.reload();
  await page.locator("#find-feedback").click();
  await page.locator("#pending-feedback-list button").click();
  await page.locator("#dismiss-feedback").waitFor({state: "visible"});
  assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem("are.pendingFeedback.v1"))).request_key,
    pendingItem.feedback_id);
  await page.locator("#prompt").fill("Continue ordinary work");
  await page.locator("#send").click();
  await page.locator("#accepted-turn-note").getByText("fixture-ordinary-turn").waitFor();
  assert.equal(calls.filter(([method]) => method === "turn/start").length, 1);
  assert.ok(await page.evaluate(() => localStorage.getItem("are.pendingFeedback.v1")));
  await page.locator("#prompt").fill("Changed text");
  await page.locator("#dismiss-feedback").click();
  await page.locator("#status").getByText("exact prior feedback").waitFor();
  assert.equal(calls.filter(([method]) => method === "cyberalchemy/learning/dismissPendingFeedback").length, 0);
  await page.locator("#prompt").fill(text);
  await page.locator("#dismiss-feedback").click();
  await page.locator("#feedback-note").getByText("Pending feedback dismissed").waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem("are.pendingFeedback.v1")), null);
  assert.equal(calls.filter(([method]) => method === "cyberalchemy/learning/submitFeedback").length, 1);
  assert.equal(calls.filter(([method]) => method === "cyberalchemy/learning/dismissPendingFeedback").length, 1);
  assert.deepEqual(pageErrors, []);
});

test("hosted browser explicitly applies a pending review after reload without another model turn", {
  skip: !playwrightRoot || !browserPath,
}, async (context) => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-feedback-apply-browser-"));
  const calls = [];
  const text = "Please make the answer clearer.";
  let pendingItem = null;
  const lessonId = `lesson:${"b".repeat(64)}`;
  let lessonDigest = "a".repeat(64);
  const rpc = {
    events: new EventEmitter(),
    initialize: async () => ({platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}),
    notify: async () => {},
    startThread: async () => ({thread: {id: "fixture-thread"}, instructionSources: []}),
    request: async (method, params) => {
      if (method === "cyberalchemy/learning/status") return {available: true};
      if (method === "thread/read") return {thread: {id: params.threadId, status: {type: "idle"}}};
      if (method === "thread/turns/list") return {data: [], nextCursor: null};
      if (method === "cyberalchemy/learning/submitFeedback") {
        calls.push([method, params]);
        return {ok: true, disposition: "pending", feedback_ref: "feedback:fixture-review",
          reason_codes: ["learning.feedback-unclassified"]};
      }
      if (method === "cyberalchemy/learning/pendingFeedback/list") {
        return {ok: true, schema_version: "are.pending-feedback-list/v1", thread_id: params.threadId,
          count: pendingItem ? 1 : 0, items: pendingItem ? [pendingItem] : [], authority_effect: "none"};
      }
      if (method === "cyberalchemy/learning/lessons/list") {
        return {ok: true, schema_version: "are.current-lessons-list/v1", thread_id: params.threadId,
          count: 1, items: [{lesson_id: lessonId, lesson_digest: lessonDigest,
            revision: 1, instruction: "Be concise."}], authority_effect: "none"};
      }
      if (method === "cyberalchemy/learning/applyPendingFeedback") {
        calls.push([method, params]);
        return {ok: true, disposition: "applied", retention_scope: "current-interaction",
          feedback_ref: "feedback:fixture-review", lesson_digest: "a".repeat(64)};
      }
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0, token: "browser-fixture-token"});
  let browser = null;
  context.after(async () => {await browser?.close(); await host.close(); rmSync(repositoryRoot, {recursive: true, force: true});});
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${ready.url}#token=${host.token}`);
  await page.locator("#start-thread").click();
  await page.locator("#status").getByText("Ready").waitFor();
  await page.locator("#prompt").fill(text);
  await page.locator("#save-feedback").click();
  await page.locator("#apply-feedback").waitFor({state: "visible"});
  const marker = JSON.parse(await page.evaluate(() => localStorage.getItem("are.pendingFeedback.v1")));
  pendingItem = {feedback_id: marker.request_key, text_digest: marker.text_digest,
    candidate_episode_ref: 'learning:["fixture-thread","first-answer"]'};
  await page.reload();
  await page.locator("#apply-feedback").waitFor({state: "visible"});
  await page.locator("#prompt").fill("Changed text");
  await page.locator("#review-quote").fill("Changed");
  await page.locator("#review-instruction").fill("Use plain language.");
  await page.locator("#apply-feedback").click();
  await page.locator("#status").getByText("exact prior feedback").waitFor();
  assert.equal(calls.filter(([method]) => method === "cyberalchemy/learning/applyPendingFeedback").length, 0);
  await page.locator("#prompt").fill(text);
  await page.locator("#review-quote").fill("make the answer clearer");
  await page.locator("#load-lessons").click();
  await page.locator("#review-lesson option").nth(1).waitFor({state: "attached"});
  await page.locator("#review-lesson").selectOption(lessonId);
  lessonDigest = "c".repeat(64);
  await page.locator("#apply-feedback").click();
  await page.locator("#status").getByText("Selected lesson changed").waitFor();
  assert.equal(calls.filter(([method]) => method === "cyberalchemy/learning/applyPendingFeedback").length, 0);
  lessonDigest = "a".repeat(64);
  await page.locator("#apply-feedback").click();
  await page.locator("#feedback-note").getByText("Pending feedback applied").waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem("are.pendingFeedback.v1")), null);
  assert.deepEqual(calls.find(([method]) => method === "cyberalchemy/learning/applyPendingFeedback")?.[1],
    {threadId: "fixture-thread", feedbackId: marker.request_key, text,
      episodeRef: pendingItem.candidate_episode_ref, quote: "make the answer clearer",
      instruction: "Use plain language.", revisesLessonId: lessonId, expectedLessonDigest: lessonDigest});
  assert.equal(calls.some(([method]) => method === "turn/start"), false);
  assert.deepEqual(pageErrors, []);
});

test("hosted browser shows gateway-unknown creation and preserves its retry marker", {
  skip: !playwrightRoot || !browserPath,
}, async (context) => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-unknown-thread-browser-"));
  const rpc = {
    events: new EventEmitter(),
    initialize: async () => ({platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}),
    notify: async () => {},
    startThread: async () => { throw new AppServerRpcError("rpc.response-error",
      "thread/start: Gateway stable request binding failed", {code: -32093,
        data: {reason_codes: ["gateway.dispatch-outcome-unknown"]}}); },
    request: async (method) => {
      if (method === "cyberalchemy/learning/status") return {available: false};
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0, token: "browser-fixture-token"});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close(); rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${ready.url}#token=${host.token}`);
  await page.locator("#start-thread").click();
  await page.locator("#status").getByText("Thread creation outcome unknown").waitFor();
  assert.ok(await page.evaluate(() => localStorage.getItem("are.pendingThread.v1")));
  assert.equal(await page.locator("#resume-thread").isDisabled(), true);
  await page.reload();
  await page.locator("#start-thread").getByText("Retry exact thread creation").waitFor();
  assert.ok(await page.evaluate(() => localStorage.getItem("are.pendingThread.v1")));
  assert.deepEqual(pageErrors, []);
});

test("hosted browser presents an owned MCP form and returns only the explicit typed answer", {
  skip: !playwrightRoot || !browserPath,
}, async (context) => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-elicitation-browser-"));
  const events = new EventEmitter();
  const broker = createElicitationBroker({timeout_ms: 10000});
  const rpc = {
    events,
    initialize: async () => ({platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}),
    notify: async () => {},
    startThread: async () => ({thread: {id: "fixture-thread"}, instructionSources: []}),
    request: async (method, params) => {
      if (method === "cyberalchemy/learning/status") return {available: false};
      if (method === "thread/read") return {thread: {id: params.threadId, status: {type: "idle"}}};
      if (method === "thread/turns/list") return {data: [], nextCursor: null};
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), elicitation_broker: broker, repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0, token: "browser-fixture-token"});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close(); rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${ready.url}#token=${host.token}`);
  await page.locator("#start-thread").click();
  await page.locator("#thread-label").getByText("fixture-thread").waitFor();
  const waiting = broker.request({id: "browser-form", method: "mcpServer/elicitation/request", params: {
    threadId: "fixture-thread", turnId: "fixture-turn", serverName: "Fixture MCP", mode: "form",
    message: "Choose a mode and explain why", requestedSchema: {type: "object", properties: {
      mode: {type: "string", title: "Mode", oneOf: [{const: "safe", title: "Safe"}, {const: "review", title: "Review"}]},
      note: {type: "string", title: "Note", minLength: 2, maxLength: 64},
      confirmed: {type: "boolean", title: "Confirmed"},
    }, required: ["mode", "note", "confirmed"]},
  }});
  const form = page.locator("#elicitations .elicitation");
  await form.getByText("Input requested by Fixture MCP").waitFor();
  assert.match(await form.textContent(), /fixture-thread.*fixture-turn/);
  await form.getByLabel("Mode").selectOption("0");
  await form.getByLabel("Note").fill("private browser answer");
  await form.getByLabel("Confirmed").selectOption("0");
  await form.getByRole("button", {name: "Send to server"}).click();
  assert.deepEqual(JSON.parse(JSON.stringify(await waiting)), {action: "accept",
    content: {mode: "safe", note: "private browser answer", confirmed: true}, _meta: null});
  await form.waitFor({state: "detached"});
  assert.doesNotMatch(await page.locator("#diagnostics").textContent(), /private browser answer/);
  assert.deepEqual(pageErrors, []);
});

test("hosted browser shows and retains a fail-closed gateway stop", {
  skip: !playwrightRoot || !browserPath,
}, async (context) => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-fault-browser-"));
  const events = new EventEmitter();
  const calls = [];
  const rpc = {
    events,
    initialize: async () => ({platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}),
    notify: async () => {},
    startThread: async () => { calls.push("thread/start"); return {thread: {id: "fixture-thread"}}; },
    request: async (method, params) => {
      calls.push(method);
      if (method === "cyberalchemy/learning/status") return {available: false};
      if (method === "thread/read") return {thread: {id: params.threadId, status: {type: "idle"}}};
      if (method === "thread/turns/list") return {data: [], nextCursor: null};
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0, token: "browser-fixture-token"});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close(); rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${ready.url}#token=${host.token}`);
  await page.locator("#start-thread").click();
  await page.locator("#thread-label").getByText("fixture-thread").waitFor();
  const failure = new Error("private prompt must not render");
  failure.code = "gateway.connection-closed";
  events.emit("failure", failure);
  await page.locator("#transport-note").getByText("ARE gateway connection stopped").waitFor();
  assert.equal(await page.locator("#start-thread").isDisabled(), true);
  assert.equal(await page.locator("#resume-thread").isDisabled(), true);
  assert.equal(await page.locator("#send").isDisabled(), true);
  assert.equal(await page.locator("#transport-note").textContent().then((text) => text.includes("private prompt")), false);
  await page.reload();
  await page.locator("#transport-note").getByText("ARE gateway connection stopped").waitFor();
  assert.equal(await page.locator("#start-thread").isDisabled(), true);
  assert.equal(await page.locator("#resume-thread").isDisabled(), true);
  assert.equal(calls.filter((method) => method === "thread/start").length, 1);
  assert.equal(calls.includes("turn/start"), false);
  assert.deepEqual(pageErrors, []);
});

test("hosted browser renders a valid startup fault without a backend", {
  skip: !playwrightRoot || !browserPath,
}, async (context) => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-startup-fault-browser-"));
  const faultDigest = "a".repeat(64);
  const host = createWindowsClientHost({approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0, token: "browser-fixture-token",
    recovery_state_retained: true,
    startup_failure: {code: "gateway.session-faulted", fault_digest: faultDigest,
      fault_reason_code: "gateway.compaction-item-history-conflict"}});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close(); rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const stopped = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${stopped.url}#token=${host.token}`);
  const alert = page.locator("#transport-note");
  await alert.getByText("host history contradicted its durable receipt").waitFor();
  assert.match(await page.locator("#recovery-mode").textContent(), /private client state retained/);
  assert.match(await alert.textContent(), /gateway\.compaction-item-history-conflict/);
  assert.match(await alert.textContent(), new RegExp(faultDigest));
  assert.equal(await page.locator("#start-thread").isDisabled(), true);
  assert.equal(await page.locator("#resume-thread").isDisabled(), true);
  assert.equal(await page.locator("#send").isDisabled(), true);
  assert.deepEqual(pageErrors, []);
});

test("hosted browser renders an incomplete history-audit quarantine", {
  skip: !playwrightRoot || !browserPath,
}, async (context) => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-audit-stop-browser-"));
  const host = createWindowsClientHost({approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0, token: "browser-fixture-token",
    recovery_state_retained: true,
    startup_failure: {code: "gateway.history-audit-incomplete"}});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close(); rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const stopped = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${stopped.url}#token=${host.token}`);
  const alert = page.locator("#transport-note");
  await alert.getByText("host-history check did not finish durably").waitFor();
  assert.match(await page.locator("#recovery-mode").textContent(), /private client state retained/);
  assert.doesNotMatch(await alert.textContent(), /Fault reference:/);
  assert.equal(await page.locator("#start-thread").isDisabled(), true);
  assert.equal(await page.locator("#resume-thread").isDisabled(), true);
  assert.equal(await page.locator("#send").isDisabled(), true);
  await page.reload();
  await alert.getByText("host-history check did not finish durably").waitFor();
  assert.deepEqual(pageErrors, []);
});

test("hosted browser exposes and resolves one ARE command approval without executing it", {
  skip: !playwrightRoot || !browserPath,
}, async (context) => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-effect-approval-browser-"));
  const approvals = createApprovalBroker();
  const rpc = {
    events: new EventEmitter(),
    initialize: async () => ({platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}),
    notify: async () => {},
    request: async (method) => {
      if (method === "cyberalchemy/learning/status") return {available: false};
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: approvals,
    repository_root: repositoryRoot, assets_directory: resolve(import.meta.dirname, "../client"),
    port: 0, token: "browser-fixture-token"});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close(); rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const request = {thread_id: "fixture-thread", turn_id: "fixture-turn", effect_id: "fixture-effect",
    kind: "command", proposal: {command: "printf fixture-only", cwd: repositoryRoot}};
  const approval = createHostedEffectApprovalAdapter({approval_broker: approvals})({
    request, proposal_digest: digestValue(request), directive: {
      rpc_id: request.effect_id, thread_id: request.thread_id, turn_id: request.turn_id,
      item_id: request.effect_id, method: "item/commandExecution/requestApproval",
      directive_kind: "gate", decision_digest: "fixture-decision", owner_gate_refs: [],
    },
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(`${ready.url}#token=${host.token}`);
  const card = page.locator("#approvals .approval");
  await card.waitFor();
  const detail = await card.textContent();
  assert.match(detail, /are-hosted-effect/);
  assert.match(detail, /printf fixture-only/);
  await card.getByRole("button", {name: "Accept once"}).click();
  assert.deepEqual(await approval, {decision: "accept", proposal_digest: digestValue(request)});
  await card.waitFor({state: "detached"});
  await page.reload();
  assert.equal(await card.count(), 0);
  assert.deepEqual(approvals.snapshot(), []);
  assert.deepEqual(pageErrors, []);
});

test("hosted browser explains a refused rejoin without implying replay or completion", {
  skip: !playwrightRoot || !browserPath,
}, async (context) => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-rejoin-refusal-browser-"));
  const rpc = {
    events: new EventEmitter(),
    initialize: async () => ({platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}),
    notify: async () => {},
    request: async (method) => {
      if (method === "cyberalchemy/learning/status") return {available: false};
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0,
    token: "browser-rejoin-refusal-fixture-token"});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close();
    rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  let reason = "windows-client.reasoning-recovery-unverified";
  let attempts = 0;
  await page.route("**/api/threads/resume", async route => {
    attempts += 1;
    await route.fulfill({status: 409, contentType: "application/json",
      body: JSON.stringify({ok: false, reason})});
  });
  await page.goto(`${ready.url}#token=${host.token}`);
  await page.locator("#recovery-mode").getByText("process-only").waitFor();
  const input = page.locator("#resume-id");
  const note = page.locator("#resume-recovery-note");
  await input.fill("fixture-owned-thread");
  await page.locator("#resume-thread").click();
  await note.waitFor({state: "visible"});
  assert.match(await note.textContent(), /matching terminal Reasoning State/);
  assert.match(await note.textContent(), /no turn was resent or marked complete/);
  assert.equal(await page.locator("#status").textContent(), "Rejoin paused — recovery verification required");
  assert.equal(await page.locator("#thread-label").textContent(), "No thread loaded.");
  assert.equal(await page.locator("#send").isDisabled(), true);

  reason = "windows-client.hosted-effect-resume-rebind-unverified";
  await input.fill("fixture-other-thread");
  await note.waitFor({state: "hidden"});
  await page.locator("#resume-thread").click();
  await note.getByText("original workspace and effect binding").waitFor();
  assert.match(await note.textContent(), /do not bypass this stop/);
  assert.equal(attempts, 2);
  assert.deepEqual(pageErrors, []);
});

test("hosted browser surfaces a recovered-thread rejoin refusal on load", {
  skip: !playwrightRoot || !browserPath,
}, async (context) => {
  const {chromium} = require(playwrightRoot);
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "are-hosted-rejoin-preflight-browser-"));
  const rpc = {
    events: new EventEmitter(),
    initialize: async () => ({platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}),
    notify: async () => {},
    request: async (method) => {
      if (method === "cyberalchemy/learning/status") return {available: false};
      throw new Error(`unexpected RPC: ${method}`);
    },
    close: async () => {},
  };
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
    user_input_broker: createUserInputBroker(), repository_root: repositoryRoot,
    assets_directory: resolve(import.meta.dirname, "../client"), port: 0,
    token: "browser-rejoin-preflight-fixture-token"});
  let browser = null;
  context.after(async () => { await browser?.close(); await host.close();
    rmSync(repositoryRoot, {recursive: true, force: true}); });
  browser = await chromium.launch({executablePath: browserPath, args: ["--no-sandbox"]});
  const ready = await host.start();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.route("**/api/state", async route => {
    const response = await route.fetch();
    const payload = await response.json();
    payload.value.thread_ids = ["fixture-recovered-thread"];
    await route.fulfill({response, json: payload});
  });
  let blocked = true;
  let refusalReason = "windows-client.reasoning-recovery-unverified";
  await page.route("**/api/threads/fixture-recovered-thread/rejoin-check", route => route.fulfill({
    status: blocked ? 409 : 200, contentType: "application/json",
    body: JSON.stringify(blocked
      ? {ok: false, reason: refusalReason}
      : {ok: true, value: {thread_id: "fixture-recovered-thread", check: "rejoin-preflight",
        requires_resume: true, authority_effect: "none"}}),
  }));
  await page.route("**/api/threads/fixture-recovered-thread/history", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ok: true, value: {messages: [], truncated: false}}),
  }));
  await page.route("**/api/threads/fixture-recovered-thread/runtime", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ok: true, value: {schema_version: "are.codex-windows-client-runtime/v1",
      thread_id: "fixture-recovered-thread", disposition: "idle", host_status: "idle",
      turn_id: null, turn_status: null, verification_source: "fixture", authority_effect: "none"}}),
  }));
  await page.goto(`${ready.url}#token=${host.token}`);
  const note = page.locator("#resume-recovery-note");
  await note.waitFor({state: "visible"});
  assert.match(await note.textContent(), /matching terminal Reasoning State/);
  assert.equal(await page.locator("#thread-label").textContent(), "fixture-recovered-thread");
  assert.equal(await page.locator("#resume-id").inputValue(), "fixture-recovered-thread");
  assert.equal(await page.locator("#send").isDisabled(), true);
  assert.equal(await page.locator("#status").textContent(), "Rejoin paused — recovery verification required");
  refusalReason = "windows-client.zero-turn-rejoin-unverified";
  await page.reload();
  await note.getByText("use New thread to continue in a separate ARE thread").waitFor();
  assert.equal(await page.locator("#send").isDisabled(), true);
  assert.equal(await page.locator("#start-thread").isEnabled(), true);
  blocked = false;
  await page.reload();
  await note.getByText("passed the read-only recovery check but has not been rejoined").waitFor();
  assert.equal(await page.locator("#send").isDisabled(), true);
  assert.equal(await page.locator("#status").textContent(), "Rejoin required before work");
  assert.deepEqual(pageErrors, []);
});
