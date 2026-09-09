import {spawn} from "node:child_process";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createInterface} from "node:readline";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const proxyPath = resolve(packageRoot, "bin/are-codex-app-server.mjs");
const profilePath = resolve(packageRoot, "profiles/repository-v1.json");
const child = spawn(process.execPath, [proxyPath, "--config", profilePath, "--repository-root", repositoryRoot], {stdio: ["pipe", "pipe", "pipe"]});
const pending = new Map();
const notifications = [];
let stderr = "";
let sequence = 0;

child.stderr.on("data", (chunk) => { stderr += chunk; });

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

function request(method, params) {
  const id = ++sequence;
  send({jsonrpc: "2.0", id, method, params});
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
let completionDirectiveResolve;
const completionDirective = new Promise((resolvePromise) => { completionDirectiveResolve = resolvePromise; });

createInterface({input: child.stdout, crlfDelay: Infinity}).on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method) notifications.push(message);
  if (message.method === "turn/completed") completionResolve(message.params);
  if (message.method === "cyberalchemy/decision" && message.params?.directive_kind === "complete") completionDirectiveResolve(message.params);
  if (message.method?.endsWith("/requestApproval")) {
    const result = message.method === "item/permissions/requestApproval" ? {permissions: {}} : {decision: "decline"};
    send({jsonrpc: "2.0", id: message.id, result});
    return;
  }
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
  await bounded(request("initialize", {clientInfo: {name: "are-context-lifecycle-canary", version: "0.1.0"}, capabilities: {experimentalApi: true}}), "initialize", 180000);
  const started = await bounded(request("thread/start", {cwd: "/tmp", ephemeral: true, model: "gpt-5.6-sol", approvalPolicy: "never", sandbox: "read-only"}), "thread/start", 240000);
  const turn = await bounded(request("turn/start", {
    threadId: started.thread.id,
    input: [{type: "text", text: "Explain in one sentence what a Context Envelope preserves. Do not use tools."}],
    approvalPolicy: "never",
    sandboxPolicy: {type: "readOnly", networkAccess: false},
  }), "turn/start", 180000);
  const [completed, directive] = await bounded(Promise.all([completion, completionDirective]), "turn/completed and completion directive", 300000);
  const passed = completed?.turn?.status === "completed" && directive?.directive_kind === "complete";
  result = {
    schema_version: "are.codex-context-lifecycle-live-canary/v1",
    status: passed ? "PASS" : "FAIL",
    thread_id: started.thread.id,
    turn_id: turn.turn.id,
    completion_status: completed?.turn?.status ?? null,
    completion_directive_observed: Boolean(directive),
    effect_requests_observed: notifications.filter((message) => message.method?.endsWith("/requestApproval")).length,
    authority_effect: "none",
    claim_limit: "Controlled ephemeral local canary only; no acceptance, admission, conformance, publication, deployment, or external-effect authority.",
    stderr: stderr.split("\n").filter(Boolean).slice(-20),
  };
} catch (error) {
  result = {schema_version: "are.codex-context-lifecycle-live-canary/v1", status: "FAIL", error: error.message, authority_effect: "none", stderr: stderr.split("\n").filter(Boolean).slice(-20)};
}

child.kill("SIGKILL");
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = result.status === "PASS" ? 0 : 1;
