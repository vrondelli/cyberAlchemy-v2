#!/usr/bin/env node
// Disposable installed-Codex check of the managed hosted-input boundary.
// It creates no model turn and never contacts a model provider.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {randomUUID} from "node:crypto";
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {isAbsolute, join, resolve} from "node:path";
import {createInterface} from "node:readline";
import {fileURLToPath} from "node:url";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const productRoot = resolve(packageRoot, "../..");
const checkoutRoot = resolve(productRoot, "../..");
const repositoryRoot = resolve(checkoutRoot, "..");
const binary = resolve(process.argv[2] ?? "");
const scratch = mkdtempSync(join(tmpdir(), "are-managed-hosted-input-"));
const stateDir = join(scratch, "state");
const codexHome = join(scratch, "codex-home");
let managed;
let statusLines;
let stopComponent = null;
let successRecord = null;
let cleanupError = null;

function childrenOf(pid) {
  try {
    return readFileSync(`/proc/${pid}/task/${pid}/children`, "utf8")
      .trim().split(/\s+/).filter(Boolean).map(Number);
  } catch { return []; }
}

function commandOf(pid) {
  try { return readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\0"); }
  catch { return []; }
}

async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exit = new Promise((done) => child.once("exit", done));
  child.kill("SIGTERM");
  await Promise.race([exit, new Promise((done) => setTimeout(done, 5000))]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await exit;
  }
}

async function post(url, token, body) {
  const response = await fetch(url, {method: "POST", headers: {
    authorization: `Bearer ${token}`, "content-type": "application/json",
  }, body: JSON.stringify(body)});
  return {status: response.status, body: await response.json()};
}

try {
  assert.ok(["linux", "win32"].includes(process.platform), "This disposable canary requires Linux or Windows.");
  assert.equal(process.argv.length, 3, "usage: test-managed-hosted-input.mjs <absolute-path-to-codex>");
  assert.ok(isAbsolute(binary));
  mkdirSync(stateDir, {mode: 0o700});
  mkdirSync(codexHome, {mode: 0o700});
  writeFileSync(join(codexHome, "config.toml"), `model_provider = "are_fixture"\nmodel = "are-fixture"\n[model_providers.are_fixture]\nname = "ARE no-model hosted input fixture"\nbase_url = "http://127.0.0.1:1/v1"\nwire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n[projects.${JSON.stringify(checkoutRoot)}]\ntrust_level = "trusted"\n`, {mode: 0o600});
  managed = spawn(process.execPath, [join(productRoot, "bin/are.mjs"), "managed-session",
    "--config", join(packageRoot, "profiles/interaction-learning-canary-v1.json"),
    "--repository-root", repositoryRoot, "--codex-command", binary,
    "--state-dir", stateDir, "--cwd", checkoutRoot], {
    env: {...process.env, CODEX_HOME: codexHome}, stdio: ["ignore", "pipe", "pipe"],
  });
  let stderrReason = null;
  const stderrLines = createInterface({input: managed.stderr, crlfDelay: Infinity});
  stderrLines.on("line", line => {
    try { const value = JSON.parse(line); if (typeof value.reason === "string") stderrReason = value.reason; }
    catch { /* Never echo private stderr text. */ }
  });
  statusLines = createInterface({input: managed.stdout, crlfDelay: Infinity});
  const ready = await new Promise((done, fail) => {
    const timeout = setTimeout(() => fail(new Error("managed-session-ready-timeout")), 30000);
    statusLines.on("line", line => {
      let value;
      try { value = JSON.parse(line); } catch { return; }
      if (value.schema_version === "are.managed-session-stopped/v1") stopComponent = value.component;
      if (value.schema_version !== "are.managed-session-ready/v1") return;
      clearTimeout(timeout);
      done(value);
    });
    managed.once("exit", () => { clearTimeout(timeout); fail(new Error(stderrReason ?? "managed-session-exited-before-ready")); });
  });
  assert.equal(ready.ok, true);
  assert.equal(ready.current_desktop_task_control, false);
  const launchUrl = new URL(ready.launch_url);
  const token = new URLSearchParams(launchUrl.hash.slice(1)).get("token");
  assert.match(token ?? "", /^[A-Za-z0-9_-]{32,128}$/);
  launchUrl.hash = "";
  const stateResponse = await fetch(new URL("api/state", launchUrl),
    {headers: {authorization: `Bearer ${token}`}});
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  assert.equal(state.value.feedback_available, true);
  const started = await post(new URL("api/threads", launchUrl), token,
    {requestKey: `thread:${randomUUID()}`, cwd: checkoutRoot});
  assert.equal(started.status, 201, JSON.stringify(started.body));
  const threadId = started.body.value.thread.id;
  const text = "For this conversation, include examples.";
  const requestKey = `feedback:${randomUUID()}`;
  const feedback = await post(new URL("api/feedback", launchUrl), token,
    {threadId, requestKey, text});
  assert.equal(feedback.status, 202, JSON.stringify(feedback.body));
  assert.equal(feedback.body.value.disposition, "pending");
  const pendingResponse = await fetch(new URL(`api/feedback/pending?threadId=${encodeURIComponent(threadId)}`, launchUrl),
    {headers: {authorization: `Bearer ${token}`}});
  const pending = await pendingResponse.json();
  assert.equal(pendingResponse.status, 200);
  assert.equal(pending.value.items.some((item) => item.feedback_id === requestKey), true);
  const dismissed = await post(new URL("api/feedback/dismiss", launchUrl), token,
    {threadId, requestKey, text});
  assert.equal(dismissed.status, 200, JSON.stringify(dismissed.body));
  assert.equal(dismissed.body.value.disposition, "dismissed");

  let backendProcessCount = null;
  let gatewayCredentialsAbsentFromBackend = null;
  if (process.platform === "linux") {
    const managerPid = childrenOf(managed.pid).find(pid => commandOf(pid)
      .some(arg => arg.endsWith("/bin/are-managed-session.mjs")));
    assert.ok(managerPid, "managed session process was not found");
    const gatewayPid = childrenOf(managerPid).find(pid => commandOf(pid)
      .some(arg => arg.endsWith("/bin/are-codex-gateway.mjs")));
    assert.ok(gatewayPid, "gateway process was not found");
    const backendPids = childrenOf(gatewayPid);
    assert.ok(backendPids.length > 0, "gateway backend process was not found");
    for (const pid of backendPids) {
      const environment = readFileSync(`/proc/${pid}/environ`, "utf8");
      for (const key of ["ARE_GATEWAY_CONNECTION_TOKEN", "ARE_ADAPTER_OBSERVATION_TOKEN",
        "ARE_HOSTED_INPUT_ATTESTATION_KEY"]) assert.equal(environment.includes(`${key}=`), false,
        `private gateway credential reached backend process ${pid}`);
    }
    backendProcessCount = backendPids.length;
    gatewayCredentialsAbsentFromBackend = true;
  }
  assert.equal(stopComponent, null);
  successRecord = {schema_version: "are.managed-hosted-input-canary/v1", ok: true,
    feedback_pending_then_dismissed: true,
    gateway_credentials_absent_from_backend: gatewayCredentialsAbsentFromBackend,
    backend_process_count: backendProcessCount, model_turns_started: 0, external_model_calls: 0,
    current_desktop_task_touched: false, authority_effect: "none"};
} catch (error) {
  process.stderr.write(`${JSON.stringify({schema_version: "are.managed-hosted-input-canary/v1", ok: false,
    reason: error.message, reason_code: error.cause?.code ?? null, stopped_component: stopComponent,
    authority_effect: "none"})}\n`);
  process.exitCode = 1;
} finally {
  statusLines?.close();
  await stop(managed);
  try { rmSync(scratch, {recursive: true, force: true, maxRetries: 30, retryDelay: 200}); }
  catch (error) { cleanupError = error; process.exitCode = 1; }
}
if (cleanupError) process.stderr.write(`${JSON.stringify({schema_version: "are.managed-hosted-input-canary/v1",
  ok: false, reason: "disposable-state-cleanup-failed", reason_code: cleanupError.code ?? null,
  authority_effect: "none"})}\n`);
else if (successRecord) process.stdout.write(`${JSON.stringify(successRecord)}\n`);
