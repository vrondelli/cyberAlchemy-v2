import assert from "node:assert/strict";
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import test from "node:test";

import {snapshotTree} from "../index.mjs";
import {buildLiveTurnRequestContext, inspectLiveCodexBinding, runLiveCodingAgentSession} from "../live-session.mjs";

test("Codex binding preflight reports an exact executable match", () => {
  const receipt = inspectLiveCodexBinding({command: "/exact/codex", expected_version: "codex-cli 1.2.3", exec_file_sync: () => "codex-cli 1.2.3\n"});
  assert.equal(receipt.ok, true);
  assert.deepEqual(receipt.reason_codes, []);
  assert.equal(receipt.command, "/exact/codex");
});

test("Codex binding preflight exposes version drift before starting a session", () => {
  const receipt = inspectLiveCodexBinding({command: "codex", expected_version: "codex-cli expected", exec_file_sync: () => "codex-cli other\n"});
  assert.equal(receipt.ok, false);
  assert.equal(receipt.observed_version, "codex-cli other");
  assert.deepEqual(receipt.reason_codes, ["protocol.codex-version-drift"]);
});

test("live turn request context selects the no-effect research route deterministically", () => {
  const context = buildLiveTurnRequestContext({mutation_allowlist: ["src/z.mjs", "src/a.mjs", "src/z.mjs"]});
  assert.equal(context.schema_version, "are.request-context-hint/v1");
  assert.equal(context.objective_kind, "research");
  assert.deepEqual(context.requested_effects, []);
  assert.deepEqual(context.target_refs, ["ephemeral-fixture:src/a.mjs", "ephemeral-fixture:src/z.mjs"]);
  assert.deepEqual(context.constraints, ["proposal-only", "no-tool-execution", "no-mutation-during-model-turn"]);
});

test("iterative live context declares bounded outer-runtime tools without effect authority", () => {
  const context = buildLiveTurnRequestContext({mutation_allowlist: ["src/a.mjs"], iterative_options: {}});
  assert.deepEqual(context.constraints, ["proposal-only", "outer-runtime-read-only-tools", "no-mutation-during-model-turn"]);
  assert.deepEqual(context.requested_effects, []);
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "are-live-session-test-"));
  for (const [path, utf8] of Object.entries({"package.json": "{\"type\":\"module\"}\n", "src/range.mjs": "export const sum=(a,b)=>a+b-1;\n", "test/range.test.mjs": "import test from 'node:test';\n"})) {
    const target = resolve(root, path);
    mkdirSync(dirname(target), {recursive: true});
    writeFileSync(target, utf8);
  }
  return {root, cleanup: () => rmSync(root, {recursive: true, force: true})};
}

function fakeClient(item, {failInitialize = false, failClose = false} = {}) {
  const calls = [];
  let closed = false;
  const before = snapshotTree(item.root);
  const candidate = {schema_version: "are.next-action-candidate/v1", operation: "replace-file", path: "src/range.mjs", expected_base_tree_sha256: before.tree_sha256, expected_file_sha256: before.files["src/range.mjs"], utf8: "export const sum=(a,b)=>a+b;\n", rationale: "repair", authority_effect: "none"};
  return {
    calls,
    get closed() { return closed; },
    async initialize(params) { calls.push(["initialize", params]); if (failInitialize) throw new Error("offline"); return {}; },
    async notify(method, params) { calls.push(["notify", method, params]); },
    async startThread(params) { calls.push(["startThread", params]); return {thread: {id: "thread-live-1"}}; },
    async runTurn(params) { calls.push(["runTurn", params]); return {started: {turn: {id: "turn-live-1"}}, completed: {turn: {id: "turn-live-1", status: "completed"}}, text: JSON.stringify(candidate)}; },
    async close() { calls.push(["close"]); closed = true; if (failClose) throw new Error("close failed"); }
  };
}

function iterativeFakeClient(item) {
  const calls = [];
  let turn = 0;
  const before = snapshotTree(item.root);
  const candidate = {schema_version: "are.next-action-candidate/v1", operation: "replace-file", path: "src/range.mjs", expected_base_tree_sha256: before.tree_sha256, expected_file_sha256: before.files["src/range.mjs"], utf8: "export const sum=(a,b)=>a+b;\n", rationale: "repair after inspection", authority_effect: "none"};
  return {
    calls,
    async initialize(params) { calls.push(["initialize", params]); return {}; },
    async notify(method, params) { calls.push(["notify", method, params]); },
    async startThread(params) { calls.push(["startThread", params]); return {thread: {id: "thread-iterative-1"}}; },
    async runTurn(params) {
      calls.push(["runTurn", params]);
      turn += 1;
      const event = turn === 1
        ? {schema_version: "are.coding-agent-event/v1", event_id: "inspect-source", kind: "tool-request", tool: {name: "read-file", arguments: {path: "src/range.mjs"}}, authority_effect: "none"}
        : {schema_version: "are.coding-agent-event/v1", event_id: "final-repair", kind: "final-candidate", candidate, authority_effect: "none"};
      return {started: {turn: {id: `turn-${turn}`}}, completed: {turn: {id: `turn-${turn}`, status: "completed"}}, text: JSON.stringify(event)};
    },
    async close() { calls.push(["close"]); }
  };
}

function input(item, client, overrides = {}) {
  return {client, fixture_root: item.root, request: "repair sum", observation_allowlist: ["package.json", "src/range.mjs", "test/range.test.mjs"], mutation_allowlist: ["src/range.mjs"], verification_command: [process.execPath, "--test"], ...overrides};
}

test("live session performs the required lifecycle and remains non-effectful without approval", async () => {
  const item = fixture();
  try {
    const before = snapshotTree(item.root);
    const client = fakeClient(item);
    const receipt = await runLiveCodingAgentSession(input(item, client, {model: "test-model"}));
    assert.equal(receipt.status, "AWAITING_APPROVAL");
    assert.equal(snapshotTree(item.root).tree_sha256, before.tree_sha256);
    assert.deepEqual(client.calls.map((call) => call[0]), ["initialize", "notify", "startThread", "runTurn", "close"]);
    assert.equal(client.calls[1][1], "initialized");
    assert.equal(client.calls[2][1].ephemeral, true);
    assert.equal(client.calls[2][1].approvalPolicy, "never");
    assert.equal(client.calls[2][1].sandbox, "read-only");
    assert.equal(client.calls[2][1].model, "test-model");
    assert.equal(client.calls[3][1].approvalPolicy, "never");
    assert.deepEqual(client.calls[3][1].sandboxPolicy, {type: "readOnly", networkAccess: false});
    const requestContextEntry = client.calls[3][1].additionalContext["cyberalchemy.request-context"];
    assert.equal(requestContextEntry.kind, "application");
    assert.deepEqual(JSON.parse(requestContextEntry.value), buildLiveTurnRequestContext(input(item, client, {model: "test-model"})));
    assert.equal(client.closed, true);
  } finally { item.cleanup(); }
});

test("live session optionally captures an immutable proposal for a UI adapter", async () => {
  const item = fixture();
  try {
    const before = snapshotTree(item.root);
    const client = fakeClient(item);
    const receipt = await runLiveCodingAgentSession(input(item, client, {capture_proposal: true}));
    assert.equal(receipt.status, "AWAITING_APPROVAL");
    assert.equal(receipt.proposal.status, "AWAITING_APPROVAL");
    assert.equal(receipt.proposal.candidate_sha256, receipt.proposal.approval_digest);
    assert.match(receipt.proposal.candidate_utf8, /are.next-action-candidate\/v1/u);
    assert.deepEqual(receipt.proposal.mutation_allowlist, ["src/range.mjs"]);
    assert.equal(snapshotTree(item.root).tree_sha256, before.tree_sha256);
  } finally { item.cleanup(); }
});

test("iterative live session executes bounded read-only observations and captures only the final candidate", async () => {
  const item = fixture();
  try {
    const before = snapshotTree(item.root);
    const client = iterativeFakeClient(item);
    const observations = [];
    const toolRuntime = {
      tool_names: ["read-file"],
      invoke(name, arguments_) {
        observations.push({name, arguments_});
        return {ok: true, schema_version: "are.coding-agent-tool-result/v1", output: {utf8: "export const sum=(a,b)=>a+b-1;\n"}, authority_effect: "none"};
      }
    };
    const receipt = await runLiveCodingAgentSession(input(item, client, {capture_proposal: true, iterative_options: {tool_runtime: toolRuntime, tool_policy: {allow: ["read-file"], ask: [], deny: []}, maximum_steps: 3, repository_map: {schema_version: "are.coding-agent-repository-map/v1", files: []}}}));
    assert.equal(receipt.status, "AWAITING_APPROVAL");
    assert.equal(client.calls.filter((call) => call[0] === "runTurn").length, 2);
    assert.deepEqual(observations, [{name: "read-file", arguments_: {path: "src/range.mjs"}}]);
    const candidate = JSON.parse(receipt.proposal.candidate_utf8);
    assert.equal(candidate.schema_version, "are.next-action-candidate/v1");
    assert.equal(candidate.utf8, "export const sum=(a,b)=>a+b;\n");
    assert.equal(receipt.proposal.candidate_utf8.includes("final-candidate"), false);
    assert.equal(receipt.live_model_invoked, true);
    assert.equal(snapshotTree(item.root).tree_sha256, before.tree_sha256);
  } finally { item.cleanup(); }
});

test("iterative live session preserves nested causal block reasons at its boundary", async () => {
  const item = fixture();
  try {
    const client = {
      async initialize() {}, async notify() {},
      async startThread() { return {thread: {id: "thread-blocked"}}; },
      async runTurn() { return {completed: {turn: {status: "completed"}}, text: JSON.stringify({schema_version: "are.coding-agent-event/v1", event_id: "denied-command", kind: "tool-request", tool: {name: "run-command", arguments: {command: ["node", "--test"]}}, authority_effect: "none"})}; },
      async close() {}
    };
    const receipt = await runLiveCodingAgentSession(input(item, client, {iterative_options: {tool_runtime: {tool_names: ["run-command"], invoke() { throw new Error("must not invoke"); }}, tool_policy: {allow: [], ask: [], deny: ["run-command"]}, maximum_steps: 1, repository_map: {files: []}}}));
    assert.equal(receipt.status, "BLOCK");
    assert.deepEqual(receipt.reason_codes, ["tool.explicitly-denied"]);
    assert.deepEqual(receipt.coding_result.reason_codes, receipt.reason_codes);
  } finally { item.cleanup(); }
});

test("live session closes the transport when initialization fails", async () => {
  const item = fixture();
  try {
    const client = fakeClient(item, {failInitialize: true});
    const receipt = await runLiveCodingAgentSession(input(item, client));
    assert.equal(receipt.status, "BLOCK");
    assert.deepEqual(receipt.reason_codes, ["live.session-failed"]);
    assert.equal(client.closed, true);
  } finally { item.cleanup(); }
});

test("live session reports a failed transport close as a terminal block", async () => {
  const item = fixture();
  try {
    const client = fakeClient(item, {failClose: true});
    const receipt = await runLiveCodingAgentSession(input(item, client));
    assert.equal(receipt.status, "BLOCK");
    assert.deepEqual(receipt.reason_codes, ["live.client-close-failed"]);
    assert.equal(client.closed, true);
  } finally { item.cleanup(); }
});
