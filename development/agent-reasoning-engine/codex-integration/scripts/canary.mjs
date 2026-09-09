#!/usr/bin/env node
import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createInterface} from "node:readline";

import {evaluatePermissionPolicy} from "../client/permission-policy.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const proxyPath = resolve(packageRoot, "runtime/proxy.mjs");
const upstream = process.env.CODEX_BINARY ?? "/mnt/c/Users/vlad_/.codex/bin/wsl/bf0dd1e87d338bce/codex";
const outputPath = process.argv[2] ? resolve(process.argv[2]) : null;
const work = mkdtempSync(resolve(tmpdir(), "are-codex-live-canary-"));
const receiptPath = resolve(work, "events.jsonl");
const child = spawn(process.execPath, [proxyPath, "--upstream", upstream, "--receipt", receiptPath], {stdio: ["pipe", "pipe", "pipe"]});
const pending = new Map();
const notifications = [];
const approvals = [];
let stderr = "";
let sequence = 0;
let latestEffectDecision = null;

child.stderr.on("data", (chunk) => { stderr += chunk; });

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

function request(method, params) {
  const id = ++sequence;
  send({id, method, params});
  return new Promise((resolvePromise, reject) => pending.set(String(id), {resolve: resolvePromise, reject, method}));
}

function bounded(promise, label, milliseconds) {
  return new Promise((resolvePromise, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout`)), milliseconds);
    promise.then(
      (value) => { clearTimeout(timer); resolvePromise(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

let completionResolve;
const completion = new Promise((resolvePromise) => { completionResolve = resolvePromise; });

createInterface({input: child.stdout, crlfDelay: Infinity}).on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method) notifications.push(message);
  if (message.method === "are/effect/decision") {
    latestEffectDecision = message.params;
    return;
  }
  if (message.method === "item/commandExecution/requestApproval") {
    const command = message.params?.command ?? "";
    const exactEnvelope = command.includes("ARE_CODEX_PROXY_CANARY") && command.includes("printf") && !/[;&|>`<]/.test(command);
    const decision = exactEnvelope ? "accept" : "decline";
    approvals.push({method: message.method, command, decision, exact_envelope: exactEnvelope});
    const permissionDecision = evaluatePermissionPolicy(message, latestEffectDecision, {approvalPolicy: "untrusted", sandboxPolicy: {type: "readOnly", networkAccess: false}});
    send({id: message.id, result: {decision: permissionDecision.kind === "permit" ? decision : "decline"}, _are: {permissionDecision}});
    latestEffectDecision = null;
    return;
  }
  if (message.method?.endsWith("/requestApproval")) {
    approvals.push({method: message.method, decision: "unsupported-deny", exact_envelope: false});
    if (message.method === "item/fileChange/requestApproval") send({id: message.id, result: {decision: "decline"}});
    return;
  }
  if (message.method === "are/continuation/completed") completionResolve(message.params);
  if (Object.hasOwn(message, "id")) {
    const waiter = pending.get(String(message.id));
    if (!waiter) return;
    pending.delete(String(message.id));
    if (message.error) waiter.reject(new Error(`${waiter.method}:${JSON.stringify(message.error)}`));
    else waiter.resolve(message.result);
  }
});

let result;
try {
  const initialized = await bounded(request("initialize", {clientInfo: {name: "are-codex-live-canary", version: "0.1.0"}}), "initialize", 180000);
  const started = await bounded(request("thread/start", {cwd: "/tmp", ephemeral: true, model: "gpt-5.6-sol", approvalPolicy: "untrusted", sandbox: "read-only"}), "thread/start", 240000);
  const threadId = started.thread.id;
  const turn = await bounded(request("turn/start", {
    threadId,
    input: [{type: "text", text: "Validate this harmless canary. Use the shell exactly once to run /usr/bin/printf ARE_CODEX_PROXY_CANARY, then report the observed output and stop."}],
    approvalPolicy: "untrusted",
    sandboxPolicy: {type: "readOnly", networkAccess: false},
    _are: {requestContext: {objective_kind: "validate", requested_effects: ["non-effectful-validate"], constraints: ["exact harmless command only"], target_refs: ["/tmp"], evidence_refs: ["controlled-live-canary"]}},
  }), "turn/start", 180000);
  const continuation = await bounded(completion, "turn/completed", 300000);
  const events = readFileSync(receiptPath, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
  const kinds = events.map((event) => event.kind);
  const ordering = {
    preflight_before_turn: kinds.indexOf("preflight.decision") >= 0 && kinds.indexOf("preflight.decision") < kinds.indexOf("turn.forwarded"),
    effect_before_approval: kinds.indexOf("effect.decision") >= 0 && kinds.indexOf("effect.decision") < kinds.indexOf("effect.approval-bound"),
    completion_before_continuation: kinds.indexOf("turn.completed") >= 0 && kinds.indexOf("turn.completed") < kinds.indexOf("continuation.decision"),
  };
  const approved = approvals.length === 1 && approvals[0].decision === "accept" && approvals[0].exact_envelope;
  const passed = Object.values(ordering).every(Boolean) && approved && continuation.kind === "complete";
  result = {schema_version: "are.codex-live-canary/v1", status: passed ? "PASS" : "FAIL", codex_home: initialized.codexHome, thread_id: threadId, turn_id: turn.turn.id, approvals, continuation, ordering, event_count: events.length, receipt_path: receiptPath, stderr: stderr.split("\n").filter(Boolean).slice(-30)};
} catch (error) {
  result = {schema_version: "are.codex-live-canary/v1", status: "FAIL", error: error.message, approvals, receipt_path: receiptPath, stderr: stderr.split("\n").filter(Boolean).slice(-30)};
}

child.kill("SIGKILL");
if (outputPath) {
  const eventOutputPath = outputPath.replace(/\.json$/, ".events.jsonl");
  if (existsSync(outputPath) || existsSync(eventOutputPath)) throw new Error("refusing to overwrite immutable canary evidence");
  copyFileSync(receiptPath, eventOutputPath);
  const eventBytes = readFileSync(eventOutputPath);
  result.event_receipt_ref = eventOutputPath;
  result.event_receipt_sha256 = createHash("sha256").update(eventBytes).digest("hex");
  result.authority_effect = "none";
  result.claim_limit = "Controlled local canary evidence only; no acceptance, admission, publication, deployment, default installation, or general effect authority.";
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
}
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = result.status === "PASS" ? 0 : 1;
