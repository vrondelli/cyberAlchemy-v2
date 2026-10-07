import assert from "node:assert/strict";
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import test from "node:test";

import {runModelDrivenCodingTurn} from "../controller.mjs";
import {snapshotTree} from "../index.mjs";
import {createCodexAppServerModelTransport, createScriptedModelTransport} from "../model-transport.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "are-coding-agent-model-test-"));
  const files = {
    "package.json": "{\"type\":\"module\"}\n",
    "src/range.mjs": "export function sumInclusive(a,b){let n=0;for(let x=a;x<b;x++)n+=x;return n}\n",
    "test/range.test.mjs": "import test from 'node:test';import assert from 'node:assert/strict';import {sumInclusive} from '../src/range.mjs';test('inclusive',()=>assert.equal(sumInclusive(2,4),9));\n"
  };
  for (const [path, utf8] of Object.entries(files)) { const target = resolve(root, path); mkdirSync(dirname(target), {recursive: true}); writeFileSync(target, utf8); }
  const before = snapshotTree(root);
  const candidate = {schema_version: "are.next-action-candidate/v1", operation: "replace-file", path: "src/range.mjs", expected_base_tree_sha256: before.tree_sha256, expected_file_sha256: before.files["src/range.mjs"], utf8: "export function sumInclusive(a,b){let n=0;for(let x=a;x<=b;x++)n+=x;return n}\n", rationale: "inclusive", authority_effect: "none"};
  return {root, before, candidate, cleanup: () => rmSync(root, {recursive: true, force: true})};
}

function input(item, transport, overrides = {}) {
  return {run_id: `model-test-${Math.random()}`, request: "repair the inclusive range", fixture_root: item.root, observation_allowlist: ["package.json", "src/range.mjs", "test/range.test.mjs"], mutation_allowlist: ["src/range.mjs"], verification_command: [process.execPath, "--test"], model_transport: transport, ...overrides};
}

test("scripted model output remains non-effectful until exact approval", async () => {
  const item = fixture();
  try {
    const receipt = await runModelDrivenCodingTurn(input(item, createScriptedModelTransport({final_bytes: JSON.stringify(item.candidate)})));
    assert.equal(receipt.status, "AWAITING_APPROVAL");
    assert.equal(snapshotTree(item.root).tree_sha256, item.before.tree_sha256);
    assert.equal(receipt.reasoning_events[0].event_kind, "ModelOutputBound");
  } finally { item.cleanup(); }
});

test("model-driven turn produces an independently verified patch candidate", async () => {
  const item = fixture();
  try {
    const receipt = await runModelDrivenCodingTurn(input(item, createScriptedModelTransport({final_bytes: JSON.stringify(item.candidate)}), {approve: true}));
    assert.equal(receipt.status, "PATCH_CANDIDATE", JSON.stringify(receipt));
    assert.equal(receipt.verification.status, "PASS_BOUNDED");
    assert.deepEqual(receipt.verification.changed_paths, ["src/range.mjs"]);
  } finally { item.cleanup(); }
});

test("model transport failure has zero effect", async () => {
  const item = fixture();
  try {
    const receipt = await runModelDrivenCodingTurn(input(item, {kind: "broken", async generate() { throw new Error("offline"); }}));
    assert.equal(receipt.status, "BLOCK");
    assert.deepEqual(receipt.reason_codes, ["model.transport-failed"]);
    assert.equal(snapshotTree(item.root).tree_sha256, item.before.tree_sha256);
  } finally { item.cleanup(); }
});

test("malformed model final bytes fail closed before mutation", async () => {
  const item = fixture();
  try {
    const receipt = await runModelDrivenCodingTurn(input(item, createScriptedModelTransport({final_bytes: "not-json"}), {approve: true}));
    assert.equal(receipt.status, "BLOCK");
    assert.ok(receipt.reason_codes.includes("candidate.json-invalid"));
    assert.equal(snapshotTree(item.root).tree_sha256, item.before.tree_sha256);
  } finally { item.cleanup(); }
});

test("Codex App Server adapter forces a read-only on-request turn", async () => {
  const calls = [];
  const client = {async runTurn(params) { calls.push(params); return {started: {turn: {id: "turn-1"}}, completed: {turn: {id: "turn-1", status: "completed"}}, text: "{\"ok\":true}"}; }};
  const additionalContext = {"cyberalchemy.request-context": {kind: "application", value: "{\"schema_version\":\"are.request-context-hint/v1\",\"raw_request\":\"propose only\"}"}};
  const transport = createCodexAppServerModelTransport({client, thread_id: "thread-1", turn_options: {approvalPolicy: "full-access", sandboxPolicy: {type: "dangerFullAccess"}, additionalContext}});
  const generated = await transport.generate({prompt: "prompt", run_id: "run-1"});
  assert.equal(generated.final_bytes, "{\"ok\":true}");
  assert.equal(generated.receipt.live_model_invoked, true);
  assert.equal(calls[0].approvalPolicy, "on-request");
  assert.deepEqual(calls[0].sandboxPolicy, {type: "readOnly", networkAccess: false});
  assert.deepEqual(calls[0].additionalContext, additionalContext);
});

test("Codex App Server transport gives iterative turns distinct stable request keys", async () => {
  const keys = [];
  const client = {async runTurn(_params, options) {
    keys.push(options.idempotency_key);
    return {started: {turn: {id: `turn-${keys.length}`}}, completed: {turn: {id: `turn-${keys.length}`, status: "completed"}}, text: "{\"ok\":true}"};
  }};
  const transport = createCodexAppServerModelTransport({client, thread_id: "thread-1", request_key_prefix: "coding:turn:run-1"});
  await transport.generate({prompt: "first", run_id: "run-1"});
  await transport.generate({prompt: "second", run_id: "run-1"});
  assert.deepEqual(keys, ["coding:turn:run-1:1", "coding:turn:run-1:2"]);
});

test("Codex App Server transport checkpoints a turn before dispatch and settles only after completion", async () => {
  const events = [];
  const client = {async runTurn(_params, options) {
    events.push(["dispatch", options.idempotency_key]);
    return {started: {turn: {id: "turn-1"}}, completed: {turn: {id: "turn-1", status: "completed"}}, text: "ok"};
  }};
  const transport = createCodexAppServerModelTransport({client, thread_id: "thread-1",
    request_key_prefix: "coding:turn:recovery",
    on_before_turn: (intent) => { events.push(["checkpoint", intent]); },
    on_turn_completed: (completion) => { events.push(["settle", completion]); }});
  await transport.generate({prompt: "private prompt", run_id: "run-1"});
  assert.deepEqual(events.map((entry) => entry[0]), ["checkpoint", "dispatch", "settle"]);
  assert.equal(events[0][1].request_key, "coding:turn:recovery:1");
  assert.equal(events[2][1].turn_id, "turn-1");
  assert.equal(events[0][1].prompt_sha256.length, 64);
  assert.equal(JSON.stringify(events[0]).includes("private prompt"), false);

  const failed = createCodexAppServerModelTransport({client: {async runTurn() { throw new Error("unknown outcome"); }},
    thread_id: "thread-1", request_key_prefix: "coding:turn:failed",
    on_before_turn: () => { events.push(["failed-checkpoint"]); },
    on_turn_completed: () => { events.push(["incorrect-settle"]); }});
  await assert.rejects(failed.generate({prompt: "another prompt"}), /unknown outcome/u);
  assert.equal(events.some((entry) => entry[0] === "incorrect-settle"), false);

  const missingStatus = createCodexAppServerModelTransport({client: {async runTurn() {
    return {started: {turn: {id: "turn-2"}}, completed: {turn: {id: "turn-2"}}, text: "ok"};
  }}, thread_id: "thread-1", on_before_turn: () => {},
  on_turn_completed: () => { events.push(["incorrect-settle"]); }});
  await assert.rejects(missingStatus.generate({prompt: "status missing"}), /MODEL_TURN_COMPLETION_UNVERIFIED/u);
  assert.equal(events.some((entry) => entry[0] === "incorrect-settle"), false);
});

test("base drift during model generation blocks the proposed effect", async () => {
  const item = fixture();
  try {
    const transport = {kind: "drifting", async generate() { writeFileSync(resolve(item.root, "src/range.mjs"), "// human edit\n"); return {final_bytes: JSON.stringify(item.candidate)}; }};
    const receipt = await runModelDrivenCodingTurn(input(item, transport, {approve: true}));
    assert.equal(receipt.status, "BLOCK");
    assert.ok(receipt.reason_codes.includes("action.base-tree-drift"));
    assert.equal(readFileSync(resolve(item.root, "src/range.mjs"), "utf8"), "// human edit\n");
  } finally { item.cleanup(); }
});
