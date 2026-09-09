import assert from "node:assert/strict";
import {mkdtempSync, readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {CodexProxySession, CodexRpcError} from "../client/session.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mockPath = resolve(packageRoot, "test/fixtures/mock-app-server.mjs");

function fixture(handlers = {}) {
  const receiptPath = resolve(mkdtempSync(resolve(tmpdir(), "are-interactive-test-")), "events.jsonl");
  const session = new CodexProxySession({upstream: mockPath, receiptPath, allowProtocolDrift: true, handlers});
  return {session, receiptPath};
}

test("interactive session streams text and binds an exact approval", async (t) => {
  const observed = {text: "", approvals: []};
  const run = fixture({
    onTextDelta(delta) { observed.text += delta; },
    onApproval(value) { observed.approvals.push(value); return "accept"; },
  });
  t.after(() => run.session.close());
  await run.session.start({cwd: "/tmp"});
  const result = await run.session.turn({text: "Validate this harmless canary."});
  assert.equal(result.outcome.kind, "complete");
  assert.match(observed.text, /Mock turn completed/);
  assert.equal(observed.approvals.length, 1);
  assert.match(observed.approvals[0].decision.effect_digest, /^[a-f0-9]{64}$/);
  const events = readFileSync(run.receiptPath, "utf8").trim().split("\n").map(JSON.parse);
  assert.equal(events.find((event) => event.kind === "effect.approval-bound").binding_kind, "human-bound");
});

test("interactive session returns a preflight gate without forwarding", async (t) => {
  const run = fixture();
  t.after(() => run.session.close());
  await run.session.start({cwd: "/tmp"});
  const result = await run.session.turn({text: "Research and validate this."});
  assert.equal(result.outcome.kind, "gate");
  assert.equal(result.turn, null);
});

test("interactive session answers requestUserInput", async (t) => {
  let questions = 0;
  let text = "";
  const run = fixture({
    onUserInput(params) {
      questions += params.questions.length;
      return {answers: {choice: {answers: ["Validate"]}}};
    },
    onApproval() { return "decline"; },
    onTextDelta(delta) { text += delta; },
  });
  t.after(() => run.session.close());
  await run.session.start({cwd: "/tmp"});
  const result = await run.session.turn({text: "Validate ASK_HUMAN then stop."});
  assert.equal(result.outcome.kind, "complete");
  assert.equal(questions, 1);
  assert.match(text, /Human answered: Validate/);
});

test("interactive session declines approval without a matching effect decision", async (t) => {
  let prompted = 0;
  let blocked = 0;
  const run = fixture({
    onApproval() { prompted += 1; return "accept"; },
    onUnboundApproval() { blocked += 1; },
  });
  t.after(() => run.session.close());
  await run.session.start({cwd: "/tmp"});
  const result = await run.session.turn({text: "Validate UNBOUND_APPROVAL and stop."});
  assert.equal(result.outcome.kind, "complete");
  assert.equal(prompted, 0);
  assert.equal(blocked, 1);
});

test("interactive session binds file-change and permission approval classes", async (t) => {
  for (const marker of ["FILE_APPROVAL", "PERMISSION_APPROVAL"]) {
    const decisions = [];
    const run = fixture({onApproval({decision}) { decisions.push(decision); return "accept"; }});
    await run.session.start({cwd: "/tmp"});
    const result = await run.session.turn({text: `Validate ${marker} and stop.`});
    await run.session.close();
    assert.equal(result.outcome.kind, "complete");
    assert.equal(decisions.length, 1);
    const events = readFileSync(run.receiptPath, "utf8").trim().split("\n").map(JSON.parse);
    assert.equal(events.find((event) => event.kind === "effect.approval-bound").binding_kind, "human-bound");
  }
});

test("interaction proposal requires exact digest binding before its next turn", async (t) => {
  const run = fixture({onApproval() { return "decline"; }});
  t.after(() => run.session.close());
  await run.session.start({cwd: "/tmp"});
  const first = await run.session.turn({
    text: "Validate the first bounded step.",
    continuation: {interaction_bound: [{
      option_id: "CHAT-1",
      route_id: "CA2-ROUTE-VALIDATE",
      effect_classes: ["local-read"],
      reversible: true,
      next_turn: {input: [{type: "text", text: "Validate the human-selected successor."}]},
    }]},
  });
  assert.equal(first.outcome.kind, "gate");
  const binding = first.outcome.proposal_bindings[0];
  await assert.rejects(
    run.session.resolveContinuation({decisionDigest: first.outcome.decision_digest, optionId: binding.option_id, proposalDigest: "0".repeat(64), decision: "accept"}),
    (error) => error instanceof CodexRpcError && error.code === -32074,
  );
  const resolved = await run.session.resolveContinuation({
    decisionDigest: first.outcome.decision_digest,
    optionId: binding.option_id,
    proposalDigest: binding.proposal_digest,
    decision: "accept",
  });
  assert.equal(resolved.binding.status, "accepted");
  assert.match(resolved.binding.bindingDigest, /^[a-f0-9]{64}$/);
  assert.equal(resolved.outcome.kind, "complete");
  const events = readFileSync(run.receiptPath, "utf8").trim().split("\n").map(JSON.parse);
  assert.equal(events.filter((event) => event.kind === "continuation.binding-rejected").length, 1);
  assert.equal(events.filter((event) => event.kind === "continuation.human-bound").length, 1);
});
