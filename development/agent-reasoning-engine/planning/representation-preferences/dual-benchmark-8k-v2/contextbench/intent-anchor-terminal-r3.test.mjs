import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {bodyForReceipt, stable} from "../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs";
import {createIntentAnchorState, recordHintSupport, confirmBaseRead} from "./intent-anchor-convergence-r3.mjs";
import {admitMappedRankQuery, bindConfirmedBaseRead} from "./intent-anchor-integration-r3.mjs";
import {buildIntentAnchorTerminalEvidence, sourceCandidate} from "./intent-anchor-terminal-r3.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
test("delivered Go module manifests can enter the source shortlist without admitting unrelated files", () => {
  const read = {path: "go.mod", start_line: 1, end_line: 40};
  assert.equal(sourceCandidate(read), true);
  assert.equal(sourceCandidate({...read, path: "nested/go.mod"}), true);
  assert.equal(sourceCandidate({...read, path: "src/main/java/example/Foo.java"}), true);
  assert.equal(sourceCandidate({...read, path: "src/include/foo.hpp"}), true);
  for (const path of ["go.sum", "README.md", "module.mod", "tests/go.mod"])
    assert.equal(sourceCandidate({...read, path}), false);
  assert.equal(sourceCandidate({...read, end_line: 7}), false);
});
function captured(path, text, source_sha256, callId, start_line = 1) {
  const call = {id: callId, type: "function", function: {name: "read_file", arguments: stable({path, start_line, line_count: 1})}};
  const prompt = stable({messages: [{role: "assistant", content: "", tool_calls: [call]}, {role: "tool", tool_call_id: call.id, content: stable({ok: true, output: {path, start_line, end_line: start_line, utf8: text, source_sha256}})}], tools: []});
  const receipt = {kind: "model", dispatched: true, status: 200, input_tokens: 100, output_tokens: 20, model: "glm-5.3-flash", reasoning_effort: "low", output_cap: 128, finish_reason: "tool_calls"};
  receipt.request_sha256 = hash(stable(bodyForReceipt(prompt, receipt)));
  return {capture: {prompt, prompt_sha256: hash(prompt)}, receipt};
}
function readyState(native_read_id, source_sha256) {
  let state = createIntentAnchorState("Parser rejects trailing commas. Documentation describes valid configuration.");
  const first = admitMappedRankQuery(state, "parser trailing commas"); state = first.state;
  const second = admitMappedRankQuery(state, "documentation valid configuration"); state = second.state;
  state = recordHintSupport(state, {anchor_id: first.anchor_id, query_sha256: first.query_sha256, path: "alpha.js", start_line: 1, end_line: 1, content_sha256: source_sha256});
  state = confirmBaseRead(state, {path: "alpha.js", start_line: 1, end_line: 1, content_sha256: source_sha256, base_revision_confirmed: true});
  const confirmed = state.confirmed_base_reads[0];
  return {state, bindings: [bindConfirmedBaseRead(state, {convergence_read_id: confirmed.read_id, native_read_id, source_revision: "base", path: "alpha.js", start_line: 1, end_line: 1, source_sha256})]};
}
function fixture() {
  const repoRoot = mkdtempSync(join(tmpdir(), "intent-anchor-terminal-"));
  const alphaBody = "alpha\n", betaBody = "beta\n", alphaSha = hash(alphaBody), betaSha = hash(betaBody);
  writeFileSync(join(repoRoot, "alpha.js"), alphaBody); writeFileSync(join(repoRoot, "beta.js"), betaBody);
  const specifications = [["alpha.js", "alpha", alphaSha, "alpha-selected"], ["alpha.js", "alpha", alphaSha, "alpha-duplicate"], ["beta.js", "beta", betaSha, "beta-unrelated"]];
  const receipts = [], branches = [];
  specifications.forEach(([path, text, digest, callId], index) => { const item = captured(path, text, digest, callId); receipts.push(item.receipt); branches.push({branch_id: `q${index + 1}`, receipt_indices: [index], captures: [item.capture]}); });
  return {repoRoot, snapshots: [{path: "alpha.js", utf8: alphaBody, source_sha256: alphaSha}, {path: "beta.js", utf8: betaBody, source_sha256: betaSha}], branch_inputs: {branches, receipts}, alphaSha, clean: () => rmSync(repoRoot, {recursive: true, force: true})};
}

test("preserves the full archive while exposing exactly the convergence-selected read", async () => {
  const f = fixture();
  try {
    const preliminary = await import("./bounded-archive-frontier-evidence-join-r1.mjs").then(({bindInvestigationEvidence}) => bindInvestigationEvidence(f.branch_inputs));
    const selectedNative = preliminary.read_observations.find((read) => read.tool_call_id === "alpha-selected").id;
    const ready = readyState(selectedNative, f.alphaSha);
    const built = await buildIntentAnchorTerminalEvidence({state: ready.state, origin_bindings: ready.bindings, branch_inputs: f.branch_inputs, snapshots: f.snapshots, repoRoot: f.repoRoot, measure_tokens: async () => 20,
      version: "h72-handles-v1", reads: [], preferred_read_ids: ["forged"], max_handles: 32});
    assert.equal(built.joined.read_observations.length, 3);
    assert.equal(built.packet.private.delivered_read_ids.length, 3);
    assert.deepEqual(built.packet.private.bindings.map((binding) => binding.read_id), [selectedNative]);
    assert.ok(built.packet.private.excluded.some((item) => item.reason === "duplicate-delivered-range"));
    assert.equal(built.packet.version, "base-valid-handles-v2");
    assert.equal(built.packet.fit.maximum_handles, 1);
  } finally { f.clean(); }
});

test("opt-in late binding admits only a delivered read verified at the pinned base commit", async () => {
  const f = fixture();
  try {
    const git = (...args) => execFileSync("git", ["-C", f.repoRoot, ...args], {encoding: "utf8"}).trim();
    git("init", "-q"); git("add", "alpha.js", "beta.js");
    execFileSync("git", ["-C", f.repoRoot, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "base"]);
    const base_commit = git("rev-parse", "HEAD");
    const joined = await import("./bounded-archive-frontier-evidence-join-r1.mjs")
      .then(({bindInvestigationEvidence}) => bindInvestigationEvidence(f.branch_inputs));
    const alphaIds = joined.read_observations.filter(read => read.path === "alpha.js").map(read => read.id);
    const ready = readyState("a".repeat(64), f.alphaSha);
    const input = {state: ready.state, origin_bindings: ready.bindings,
      branch_inputs: f.branch_inputs, snapshots: f.snapshots, repoRoot: f.repoRoot,
      measure_tokens: async () => 20};
    await assert.rejects(() => buildIntentAnchorTerminalEvidence(input),
      /no-delivered-confirmed-read/);
    await assert.rejects(() => buildIntentAnchorTerminalEvidence({...input,
      late_bind_delivered_base: true, base_commit: "b".repeat(40)}),
      /no-delivered-confirmed-read/);
    const built = await buildIntentAnchorTerminalEvidence({...input,
      late_bind_delivered_base: true, base_commit});
    assert.equal(built.late_binding.replaced_undelivered_binding, 1);
    assert.equal(built.convergence.selected_native_read_ids.length, 1);
    assert.ok(alphaIds.includes(built.convergence.selected_native_read_ids[0]));
    assert.equal(built.effective_origin_bindings[0].native_read_id,
      built.convergence.selected_native_read_ids[0]);
  } finally { f.clean(); }
});

test("fails closed when the selected evidence is pruned by the state-token budget", async () => {
  const f = fixture();
  try {
    const joined = await import("./bounded-archive-frontier-evidence-join-r1.mjs").then(({bindInvestigationEvidence}) => bindInvestigationEvidence(f.branch_inputs));
    const selectedNative = joined.read_observations.find((read) => read.tool_call_id === "alpha-selected").id, ready = readyState(selectedNative, f.alphaSha);
    await assert.rejects(() => buildIntentAnchorTerminalEvidence({state: ready.state, origin_bindings: ready.bindings, branch_inputs: f.branch_inputs, snapshots: f.snapshots, repoRoot: f.repoRoot, max_state_tokens: 1, measure_tokens: async () => 2}), /selected-evidence-not-exact/);
  } finally { f.clean(); }
});

test("keeps all preferred ranges ahead of unrelated distinct paths", async () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "intent-anchor-terminal-tier-"));
  try {
    const sameBody = "alpha\nbeta\n", otherBody = "other\n", sameSha = hash(sameBody), otherSha = hash(otherBody);
    writeFileSync(join(repoRoot, "same.js"), sameBody); writeFileSync(join(repoRoot, "other.js"), otherBody);
    const specs = [["same.js", "alpha", sameSha, "preferred-one", 1], ["same.js", "beta", sameSha, "preferred-two", 2], ["other.js", "other", otherSha, "unrelated", 1]];
    const receipts = [], branches = [];
    specs.forEach(([path, text, digest, callId, line], index) => { const item = captured(path, text, digest, callId, line); receipts.push(item.receipt); branches.push({branch_id: `q${index + 1}`, receipt_indices: [index], captures: [item.capture]}); });
    const branch_inputs = {branches, receipts}, snapshots = [{path: "same.js", utf8: sameBody, source_sha256: sameSha}, {path: "other.js", utf8: otherBody, source_sha256: otherSha}];
    const {bindInvestigationEvidence} = await import("./bounded-archive-frontier-evidence-join-r1.mjs");
    const joined = bindInvestigationEvidence(branch_inputs);
    const preferredReads = joined.read_observations.filter(read => read.path === "same.js");
    let state = createIntentAnchorState("Parser rejects trailing commas. Documentation describes valid configuration.");
    const first = admitMappedRankQuery(state, "parser trailing commas"); state = first.state;
    const second = admitMappedRankQuery(state, "documentation valid configuration"); state = second.state;
    const bindings = [];
    for (const [index, native] of preferredReads.entries()) {
      state = recordHintSupport(state, {anchor_id: index ? second.anchor_id : first.anchor_id, query_sha256: index ? second.query_sha256 : first.query_sha256, path: native.path, start_line: native.start_line, end_line: native.end_line, content_sha256: native.source_sha256});
      state = confirmBaseRead(state, {path: native.path, start_line: native.start_line, end_line: native.end_line, content_sha256: native.source_sha256, base_revision_confirmed: true});
      const confirmed = state.confirmed_base_reads.at(-1);
      bindings.push(bindConfirmedBaseRead(state, {convergence_read_id: confirmed.read_id, native_read_id: native.id, source_revision: "base", path: native.path, start_line: native.start_line, end_line: native.end_line, source_sha256: native.source_sha256}));
    }
    const built = await buildIntentAnchorTerminalEvidence({state, origin_bindings: bindings, branch_inputs, snapshots, repoRoot, measure_tokens: async () => 20});
    assert.deepEqual(built.packet.private.bindings.map(binding => binding.read_id), preferredReads.map(read => read.id));
  } finally { rmSync(repoRoot, {recursive: true, force: true}); }
});
