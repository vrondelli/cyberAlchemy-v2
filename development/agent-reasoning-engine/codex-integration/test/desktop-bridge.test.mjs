import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {dirname, resolve} from "node:path";
import {createInterface} from "node:readline";
import {fileURLToPath} from "node:url";
import test from "node:test";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bridgePath = resolve(packageRoot, "client/desktop-bridge.mjs");
const mockPath = resolve(packageRoot, "test/fixtures/mock-app-server.mjs");

function harness() {
  const child = spawn(process.execPath, [bridgePath, "--upstream", mockPath, "--cwd", "/tmp"], {
    env: {...process.env, ARE_CODEX_TEST_FIXTURE: "workspace-mock-v1"},
    stdio: ["pipe", "pipe", "pipe"],
  });
  const events = [];
  const waiters = [];
  createInterface({input: child.stdout, crlfDelay: Infinity}).on("line", (line) => {
    const event = JSON.parse(line);
    events.push(event);
    for (const waiter of [...waiters]) {
      if (waiter.predicate(event)) {
        waiters.splice(waiters.indexOf(waiter), 1);
        waiter.resolve(event);
      }
    }
  });
  const next = (predicate, timeoutMs = 5_000) => new Promise((resolvePromise, reject) => {
    const existing = events.find(predicate);
    if (existing) return resolvePromise(existing);
    const waiter = {predicate, resolve: resolvePromise};
    waiters.push(waiter);
    setTimeout(() => {
      const index = waiters.indexOf(waiter);
      if (index >= 0) waiters.splice(index, 1);
      reject(new Error(`bridge event timeout; stderr=${String(child.stderr.read() ?? "")}`));
    }, timeoutMs).unref();
  });
  const send = (value) => child.stdin.write(`${JSON.stringify(value)}\n`);
  return {child, events, next, send};
}

test("desktop bridge streams a turn and binds approval through the ARE session", async (t) => {
  const run = harness();
  t.after(() => run.child.kill("SIGTERM"));
  const ready = await run.next((event) => event.type === "session.ready");
  assert.match(ready.threadId, /^[0-9a-f-]+$/);

  run.send({type: "turn.start", requestId: "turn-1", text: "Validate the desktop bridge canary."});
  await run.next((event) => event.type === "turn.dispatched" && event.requestId === "turn-1");
  const approval = await run.next((event) => event.type === "approval.requested");
  assert.match(approval.decision.effect_digest, /^[a-f0-9]{64}$/);
  run.send({type: "approval.resolve", requestId: "approval-1", promptId: approval.promptId, decision: "accept"});

  const delta = await run.next((event) => event.type === "assistant.delta");
  assert.match(delta.text, /Mock turn completed/);
  const completed = await run.next((event) => event.type === "turn.completed" && event.requestId === "turn-1");
  assert.equal(completed.result.outcome.kind, "complete");

  run.send({type: "session.close", requestId: "close-1"});
  await run.next((event) => event.type === "session.closed");
});

test("desktop bridge fails closed for an unknown approval prompt", async (t) => {
  const run = harness();
  t.after(() => run.child.kill("SIGTERM"));
  await run.next((event) => event.type === "session.ready");
  run.send({type: "approval.resolve", requestId: "approval-missing", promptId: "missing", decision: "accept"});
  const failed = await run.next((event) => event.type === "request.failed" && event.requestId === "approval-missing");
  assert.equal(failed.error.message, "CHAT_APPROVAL_NOT_PENDING");
});
