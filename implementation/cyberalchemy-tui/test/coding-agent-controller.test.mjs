import assert from "node:assert/strict";
import {existsSync, lstatSync, mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {createCodingAgentController} from "../src/coding-agent-controller.mjs";
import {createTuiGatewayRecoveryPath} from "../src/gateway-recovery.mjs";
import {GATEWAY_CONNECTED_SCHEMA} from "../../agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs";
import {digestValue} from "../../agent-reasoning-engine/packages/codex-app-server-wrapper/src/canonical.mjs";

async function waitFor(controller, predicate) {
  if (predicate(controller.snapshot())) return controller.snapshot();
  return new Promise((resolveValue) => {
    const unsubscribe = controller.subscribe((snapshot) => {
      if (!predicate(snapshot)) return;
      unsubscribe();
      resolveValue(snapshot);
    });
  });
}

test("coding controller exposes an approval-bound proposal without applying it", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-tui-test-"));
  const proposalOutput = resolve(root, "proposal.json");
  const result = {
    schema_version: "are.configured-coding-agent-proposal/v1",
    status: "AWAITING_APPROVAL",
    approval_digest: "a".repeat(64),
    generation_result: {final_candidate: {changes: [{path: "src/a.mjs"}]}},
    authority_effect: "none",
  };
  try {
    const calls = [];
    const controller = createCodingAgentController({
      config: {schema_version: "test"}, repositoryRoot: root,
      sessionPath: resolve(tmpdir(), "cyberalchemy-tui-session.jsonl"), proposalOutput,
      runProposal: async (input) => { calls.push(input); return result; },
    });
    assert.equal(controller.submit("Change a"), true);
    const completed = await waitFor(controller, (state) => state.phase === "review");
    assert.equal(calls.length, 1);
    assert.match(completed.transcript.at(-1).text, /No files were changed/u);
    assert.match(completed.transcript.at(-1).text, new RegExp("a{64}", "u"));
    assert.deepEqual(JSON.parse(readFileSync(proposalOutput, "utf8")), result);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("coding controller fails closed when integration options are absent", async () => {
  const controller = createCodingAgentController({runProposal: async () => { throw new Error("must not run"); }});
  controller.submit("Change a");
  const failed = await waitFor(controller, (state) => state.phase === "error");
  assert.match(failed.error, /configuration/u);
  assert.equal(existsSync(resolve(tmpdir(), "not-created-by-test")), false);
});

test("coding controller displays a nested causal block instead of unknown", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-tui-causal-block-"));
  try {
    const controller = createCodingAgentController({
      provider: "codex-app-server", config: {schema_version: "scope"}, repositoryRoot: root,
      runCodexProposal: async () => ({status: "BLOCK", coding_result: {reason_codes: ["tool.not-allowed"]}, authority_effect: "none"}),
    });
    controller.submit("change a");
    const failed = await waitFor(controller, (state) => state.phase === "error");
    assert.equal(failed.error, "tool.not-allowed");
    assert.match(failed.transcript.at(-1).text, /BLOCK: tool\.not-allowed/u);
    assert.doesNotMatch(failed.transcript.at(-1).text, /unknown/u);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("coding controller selects Codex App Server without requiring a model credential or session path", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-tui-codex-test-"));
  try {
    const calls = [];
    const result = {status: "AWAITING_APPROVAL", candidate_utf8: JSON.stringify({path: "a.mjs"}), approval_digest: "b".repeat(64), authority_effect: "none"};
    const controller = createCodingAgentController({
      provider: "codex-app-server", config: {schema_version: "scope"}, repositoryRoot: root,
      codexCommand: "/codex", codexProfile: "/profile", wrapperPath: "/wrapper", authorityRepositoryRoot: "/authority",
      runCodexProposal: async (input) => { calls.push(input); return result; },
    });
    controller.submit("Change a");
    const completed = await waitFor(controller, (state) => state.phase === "review");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].codexCommand, "/codex");
    assert.match(completed.transcript.at(-1).text, /a\.mjs/u);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("coding controller carries gateway continuity privately across proposal turns", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-tui-gateway-continuity-"));
  try {
    const calls = [];
    const controller = createCodingAgentController({
      chatMode: true, provider: "codex-app-server", config: {schema_version: "scope"}, repositoryRoot: root,
      gatewaySocket: resolve(root, "gateway.sock"), transportMode: "gateway",
      runCodexProposal: async (input) => {
        calls.push(input);
        if (calls.length === 1) input.onGatewayContinuity("private-resume-token");
        return {status: "BLOCK", reason_codes: ["fixture-stop"], authority_effect: "none"};
      },
    });
    controller.submit("first proposal");
    await waitFor(controller, (state) => state.phase === "idle" && calls.length === 1);
    controller.submit("second proposal");
    await waitFor(controller, (state) => state.phase === "idle" && calls.length === 2);
    assert.equal(calls[0].gatewayResumeToken, null);
    assert.equal(calls[1].gatewayResumeToken, "private-resume-token");
    assert.equal(JSON.stringify(controller.snapshot()).includes("private-resume-token"), false);
    await controller.close();
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("coding controller recovers its private gateway token after restart and rejects a concurrent writer", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-tui-restart-"));
  const statePath = createTuiGatewayRecoveryPath({socket_path: resolve(root, "gateway.sock"), state_home: resolve(root, "state")});
  const token = "private-restart-token";
  const receipt = (resumed) => ({schema_version: GATEWAY_CONNECTED_SCHEMA, ok: true,
    consumer_id: "codex:coding-proposal", resumed,
    continuity: {resume_token: token, resume_token_digest: digestValue(token)}});
  const common = {chatMode: true, provider: "codex-app-server", config: {schema_version: "scope"},
    repositoryRoot: root, gatewayRecoveryPath: statePath};
  try {
    const first = createCodingAgentController({...common, runCodexProposal: async (input) => {
      assert.equal(input.gatewayResumeToken, null);
      input.onGatewayConnected(receipt(false));
      input.onGatewayThreadStarted("thread-owned-by-tui");
      return {status: "BLOCK", reason_codes: ["fixture-stop"]};
    }});
    first.submit("first proposal");
    await waitFor(first, (state) => state.phase === "idle" && state.lastTurnStatus === "error");
    assert.equal(lstatSync(statePath).mode & 0o777, 0o600);
    assert.equal(JSON.stringify(first.snapshot()).includes(token), false);

    const competing = createCodingAgentController({...common, runCodexProposal: async () => { throw new Error("must not dispatch"); }});
    competing.submit("competing proposal");
    const rejected = await waitFor(competing, (state) => state.phase === "idle" && state.lastTurnStatus === "error");
    assert.match(rejected.error, /recovery-lock-held/u);
    await competing.close();
    await first.close();

    const second = createCodingAgentController({...common, runCodexProposal: async (input) => {
      assert.equal(input.gatewayResumeToken, token);
      input.onGatewayConnected(receipt(true));
      return {status: "BLOCK", reason_codes: ["fixture-stop"]};
    }});
    second.submit("second proposal");
    await waitFor(second, (state) => state.phase === "idle" && state.lastTurnStatus === "error");
    assert.equal(JSON.stringify(second.snapshot()).includes(token), false);
    await second.close();
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("coding controller persists an interrupted model turn and blocks fresh work after restart", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-tui-pending-turn-"));
  const statePath = createTuiGatewayRecoveryPath({socket_path: resolve(root, "gateway.sock"), state_home: resolve(root, "state")});
  const token = "pending-turn-token";
  const receipt = {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: true, consumer_id: "codex:coding-proposal",
    resumed: false, continuity: {resume_token: token, resume_token_digest: digestValue(token)}};
  const common = {chatMode: true, provider: "codex-app-server", config: {schema_version: "scope"},
    repositoryRoot: root, gatewayRecoveryPath: statePath};
  try {
    const first = createCodingAgentController({...common, runCodexProposal: async (input) => {
      input.onGatewayConnected(receipt);
      input.onGatewayThreadStarted("pending-thread");
      input.onGatewayTurnStarting({thread_id: "pending-thread", request_key: "coding:turn:pending:1", prompt_sha256: "a".repeat(64)});
      return {status: "BLOCK", reason_codes: ["model.transport-failed"]};
    }});
    first.submit("first proposal");
    const uncertain = await waitFor(first, (state) => state.phase === "uncertain");
    assert.equal(uncertain.error, "coding-agent.gateway-turn-outcome-unresolved");
    assert.equal(first.submit("second proposal"), false);
    const saved = JSON.parse(readFileSync(statePath, "utf8"));
    assert.equal(saved.pending_turn.thread_id, "pending-thread");
    assert.equal(saved.pending_turn.text_digest, "a".repeat(64));
    assert.equal(JSON.stringify(saved).includes("first proposal"), false);
    await first.close();

    let dispatched = false;
    let observed = 0;
    const second = createCodingAgentController({...common, runCodexProposal: async () => { dispatched = true; },
      observePendingTurn: async () => {
        observed += 1;
        return {schema_version: "are.tui-pending-turn-observation/v1", disposition: "host-terminal",
          turn_status: "completed", reason_codes: [], turn_id_digest: "b".repeat(64), authority_effect: "none"};
      }});
    assert.equal(second.snapshot().phase, "uncertain");
    assert.equal(await second.reconcilePendingTurn(), true);
    assert.equal(observed, 1);
    assert.equal(second.snapshot().reconciliation.disposition, "host-terminal");
    assert.equal(second.snapshot().phase, "uncertain");
    assert.match(second.snapshot().prompt, /not yet recovered/u);
    assert.equal(second.submit("new proposal"), false);
    assert.equal(dispatched, false);
    assert.equal(JSON.stringify(second.snapshot()).includes(token), false);
    await second.close();
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("review state applies only the exact pending digest", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-tui-approval-test-"));
  try {
    const digest = "c".repeat(64);
    let applyCalls = 0;
    const controller = createCodingAgentController({
      provider: "codex-app-server", config: {schema_version: "scope"}, repositoryRoot: root, codexProfile: "/profile",
      runCodexProposal: async () => ({schema_version: "are.codex-app-server-coding-proposal/v1", status: "AWAITING_APPROVAL", candidate_utf8: JSON.stringify({path: "a.mjs"}), approval_digest: digest, authority_effect: "none"}),
      applyCodexProposal: () => { applyCalls += 1; return {status: "PATCH_CANDIDATE", result_digest: "result", application: {changed_paths: ["a.mjs"]}, reason_codes: [], authority_effect: "none"}; },
    });
    controller.submit("change a");
    await waitFor(controller, (state) => state.phase === "review");
    controller.submit(`/approve ${"0".repeat(64)}`);
    await new Promise((resolveValue) => setImmediate(resolveValue));
    assert.equal(controller.snapshot().phase, "review");
    assert.equal(applyCalls, 0);
    controller.submit(`/approve ${digest}`);
    const completed = await waitFor(controller, (state) => state.phase === "completed");
    assert.equal(applyCalls, 1);
    assert.match(completed.transcript.at(-1).text, /applied and verified/u);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("confirmation control applies the exact digest held by the pending proposal", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-tui-confirm-test-"));
  try {
    const digest = "d".repeat(64);
    let receivedDigest = null;
    const controller = createCodingAgentController({
      provider: "codex-app-server", config: {schema_version: "scope"}, repositoryRoot: root, codexProfile: "/profile",
      runCodexProposal: async () => ({schema_version: "are.codex-app-server-coding-proposal/v1", status: "AWAITING_APPROVAL", candidate_utf8: JSON.stringify({path: "a.mjs"}), approval_digest: digest, authority_effect: "none"}),
      applyCodexProposal: (input) => { receivedDigest = input.approval_digest; return {status: "PATCH_CANDIDATE", result_digest: "result", application: {changed_paths: ["a.mjs"]}, reason_codes: [], authority_effect: "none"}; },
    });
    assert.equal(controller.confirmPending(), false);
    controller.submit("change a");
    await waitFor(controller, (state) => state.phase === "review");
    assert.equal(controller.confirmPending(), true);
    assert.equal(controller.snapshot().phase, "applying");
    assert.equal(receivedDigest, null);
    await waitFor(controller, (state) => state.phase === "completed");
    assert.equal(receivedDigest, digest);
    assert.equal(controller.snapshot().transcript.some((entry) => entry.role === "human" && /Confirm & apply/u.test(entry.text)), true);
    assert.equal(controller.confirmPending(), false);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("closing an active Codex controller closes its registered client", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-tui-close-test-"));
  try {
    let closed = false;
    let release;
    const controller = createCodingAgentController({
      provider: "codex-app-server", config: {schema_version: "scope"}, repositoryRoot: root,
      runCodexProposal: ({onClient}) => new Promise((resolveValue) => {
        release = resolveValue;
        onClient({close: async () => { closed = true; resolveValue({status: "CANCELLED", reason_codes: ["agent.cancelled"]}); }});
      }),
    });
    controller.submit("change a");
    await waitFor(controller, (state) => state.phase === "working");
    await controller.close();
    assert.equal(closed, true);
    release?.({status: "CANCELLED", reason_codes: ["agent.cancelled"]});
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("controller runs a disposable product self-test and records diagnostic phases", async () => {
  const controller = createCodingAgentController({runSelfTest: async () => ({status: "PASS_BOUNDED", candidate_digest: "e".repeat(64), external_repository_effects: 0, authority_effect: "none"})});
  assert.equal(await controller.selfTest(), true);
  const completed = controller.snapshot();
  assert.equal(completed.phase, "completed");
  assert.equal(completed.timeline.some((entry) => entry.phase === "self-test" && entry.detail === "PASS_BOUNDED"), true);
  assert.match(completed.transcript.at(-1).text, /External repository effects: 0/u);
});

test("chat controller preserves the transcript and resumes across unique proposal turns", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-tui-chat-turns-"));
  try {
    const calls = [];
    const controller = createCodingAgentController({
      chatMode: true,
      config: {schema_version: "test"},
      repositoryRoot: root,
      sessionPath: resolve(root, "session.jsonl"),
      proposalDirectory: root,
      runProposal: async (input) => {
        calls.push(input);
        return {
          status: "AWAITING_APPROVAL",
          approval_digest: String(calls.length).repeat(64),
          generation_result: {final_candidate: {changes: [{path: `src/${calls.length}.mjs`}]}},
          authority_effect: "none",
        };
      },
    });
    controller.submit("first change");
    await waitFor(controller, (state) => state.phase === "review");
    assert.equal(existsSync(resolve(root, "proposal-0001.json")), true);
    controller.submit("/reject");
    assert.equal(controller.snapshot().phase, "idle");
    assert.equal(controller.snapshot().lastTurnStatus, "stopped");
    controller.submit("second change");
    await waitFor(controller, (state) => state.phase === "review" && calls.length === 2);
    assert.equal(existsSync(resolve(root, "proposal-0002.json")), true);
    assert.equal(calls[0].resume, false);
    assert.equal(calls[1].resume, true);
    assert.equal(controller.snapshot().transcript.some((entry) => entry.text === "first change"), true);
    assert.equal(controller.snapshot().transcript.some((entry) => entry.text === "second change"), true);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("chat controller returns to a ready composer after verified application", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-tui-chat-apply-"));
  try {
    const digest = "f".repeat(64);
    const controller = createCodingAgentController({
      chatMode: true,
      provider: "codex-app-server",
      config: {schema_version: "scope"},
      repositoryRoot: root,
      codexProfile: "/profile",
      runCodexProposal: async () => ({status: "AWAITING_APPROVAL", candidate_utf8: JSON.stringify({path: "a.mjs"}), approval_digest: digest}),
      applyCodexProposal: () => ({status: "PATCH_CANDIDATE", result_digest: "result", application: {changed_paths: ["a.mjs"]}}),
    });
    controller.submit("change a");
    await waitFor(controller, (state) => state.phase === "review");
    controller.submit(`/approve ${digest}`);
    await waitFor(controller, (state) => state.phase === "idle" && state.lastTurnStatus === "completed");
    assert.equal(controller.snapshot().prompt, "Type your next message.");
    assert.equal(controller.snapshot().transcript.at(-1).role, "agent");
    assert.equal(controller.snapshot().transcript.at(-1).text, "What would you like to do next?");
    assert.equal(controller.snapshot().transcript.some((entry) => /applied and verified/u.test(entry.text)), true);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
