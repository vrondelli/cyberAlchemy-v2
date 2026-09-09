import assert from "node:assert/strict";
import {mkdtempSync, readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {spawn} from "node:child_process";
import {createInterface} from "node:readline";
import test from "node:test";

import {createDecisionEngine, digest} from "../runtime/engine.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const proxyPath = resolve(packageRoot, "runtime/proxy.mjs");
const mockPath = resolve(packageRoot, "test/fixtures/mock-app-server.mjs");

function runProxy(messages, onMessage) {
  const dir = mkdtempSync(resolve(tmpdir(), "are-codex-proxy-test-"));
  const receipt = resolve(dir, "receipt.jsonl");
  const child = spawn(process.execPath, [proxyPath, "--upstream", mockPath, "--allow-protocol-drift", "--receipt", receipt], {stdio: ["pipe", "pipe", "pipe"]});
  const output = [];
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  createInterface({input: child.stdout, crlfDelay: Infinity}).on("line", (line) => {
    const message = JSON.parse(line);
    output.push(message);
    onMessage?.(message, child);
  });
  for (const message of messages) child.stdin.write(`${JSON.stringify(message)}\n`);
  return {child, output, receipt, stderr: () => stderr};
}

function waitFor(predicate, timeout = 10000) {
  const started = Date.now();
  return new Promise((resolvePromise, reject) => {
    const tick = () => {
      const value = predicate();
      if (value) return resolvePromise(value);
      if (Date.now() - started > timeout) return reject(new Error("timeout"));
      setTimeout(tick, 10);
    };
    tick();
  });
}

test("direct preflight, policy-denied raw approval, and completion are ordered", async (t) => {
  const messages = [
    {id: 1, method: "initialize", params: {clientInfo: {name: "test", version: "1"}}},
    {id: 2, method: "thread/start", params: {ephemeral: true}},
    {id: 3, method: "turn/start", params: {threadId: "00000000-0000-7000-8000-000000000001", input: [{type: "text", text: "Validate this harmless canary."}]}},
  ];
  const run = runProxy(messages, (message, child) => {
    if (message.method === "item/commandExecution/requestApproval") {
      child.stdin.write(`${JSON.stringify({id: message.id, result: {decision: "accept"}})}\n`);
    }
  });
  t.after(() => run.child.kill("SIGKILL"));
  await waitFor(() => run.output.find((message) => message.method === "are/continuation/completed"))
    .catch((error) => { throw new Error(`${error.message}\noutput=${JSON.stringify(run.output)}\nstderr=${run.stderr()}`); });
  const events = readFileSync(run.receipt, "utf8").trim().split("\n").map(JSON.parse);
  const kinds = events.map((event) => event.kind);
  assert.ok(kinds.indexOf("preflight.decision") < kinds.indexOf("turn.forwarded"));
  assert.ok(kinds.indexOf("effect.decision") < kinds.indexOf("effect.approval-bound"));
  assert.ok(kinds.indexOf("turn.completed") < kinds.indexOf("continuation.decision"));
  assert.equal(events.find((event) => event.kind === "effect.approval-bound").binding_kind, "declined");
  assert.equal(events.find((event) => event.kind === "continuation.decision").directive_kind, "complete");
});

test("gate preflight is not forwarded", async (t) => {
  const run = runProxy([{id: 8, method: "turn/start", params: {threadId: "T", input: [{type: "text", text: "Research and validate this."}]}}]);
  t.after(() => run.child.kill("SIGKILL"));
  const response = await waitFor(() => run.output.find((message) => message.id === 8));
  assert.equal(response.error.code, -32071);
  assert.equal(response.error.data.kind, "gate");
  const events = readFileSync(run.receipt, "utf8").trim().split("\n").map(JSON.parse);
  assert.equal(events.some((event) => event.kind === "turn.forwarded"), false);
  assert.equal(events.some((event) => event.kind === "turn.not-forwarded"), true);
});

test("interaction-bound continuation always gates", async (t) => {
  const run = runProxy([{
    id: 9,
    method: "turn/start",
    params: {
      threadId: "00000000-0000-7000-8000-000000000001",
      input: [{type: "text", text: "Validate this harmless canary."}],
      _are: {continuation: {interaction_bound: [{option_id: "CHAT-1", route_id: "CA2-ROUTE-VALIDATE", effect_classes: ["local-read"], reversible: true}]}},
    },
  }], (message, child) => {
    if (message.method === "item/commandExecution/requestApproval") child.stdin.write(`${JSON.stringify({id: message.id, result: {decision: "decline"}})}\n`);
  });
  t.after(() => run.child.kill("SIGKILL"));
  const result = await waitFor(() => run.output.find((message) => message.method === "are/continuation/completed"))
    .catch((error) => { throw new Error(`${error.message}\noutput=${JSON.stringify(run.output)}\nstderr=${run.stderr()}`); });
  assert.equal(result.params.kind, "gate");
  assert.deepEqual(result.params.source_lanes, {plan_bound: 0, interaction_bound: 1});
});

test("malformed effect identity blocks before owner interaction", () => {
  const decision = createDecisionEngine().effect({
    id: "bad",
    method: "item/commandExecution/requestApproval",
    params: {threadId: "T", itemId: "I"},
  });
  assert.equal(decision.kind, "block");
  assert.ok(decision.reason_codes.includes("effect.turn-id-required"));
});

test("one safe plan-bound successor is preflighted and forwarded once", async (t) => {
  const plan = [{
    option_id: "PLAN-1",
    route_id: "CA2-ROUTE-VALIDATE",
    effect_classes: ["non-effectful-validate"],
    reversible: true,
    next_turn: {input: [{type: "text", text: "Validate the second bounded step."}]},
  }];
  const run = runProxy([{
    id: 10,
    method: "turn/start",
    params: {
      threadId: "00000000-0000-7000-8000-000000000001",
      input: [{type: "text", text: "Validate the first bounded step."}],
      _are: {continuation: {plan_bound: plan, plan_manifest: {schema_version: "are.codex-host-plan-manifest/v1", source_kind: "host-declared-plan", source_ref: "proxy-test:declared-before-turn", plan_digest: digest(plan)}}},
    },
  }], (message, child) => {
    if (message.method === "item/commandExecution/requestApproval") child.stdin.write(`${JSON.stringify({id: message.id, result: {decision: "decline"}})}\n`);
  });
  t.after(() => run.child.kill("SIGKILL"));
  await waitFor(() => run.output.filter((message) => message.method === "are/continuation/completed").length === 2);
  const continuations = run.output.filter((message) => message.method === "are/continuation/completed");
  assert.equal(continuations[0].params.kind, "direct");
  assert.equal(continuations[1].params.kind, "complete");
  const events = readFileSync(run.receipt, "utf8").trim().split("\n").map(JSON.parse);
  assert.equal(events.filter((event) => event.kind === "continuation.turn-forwarded").length, 1);
});
