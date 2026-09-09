import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {runIterativeCodingAgent} from "../iterative-agent.mjs";
import {createReadOnlyToolRuntime} from "../read-only-tools.mjs";
import {snapshotTree} from "../verifier.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function scripted(responses) {
  let index = 0;
  return {async generate() { const final_bytes = JSON.stringify(responses[index++]); return {final_bytes, receipt: {schema_version: "are.model-turn-transport-receipt/v1", transport_kind: "test", authority_effect: "none"}}; }};
}
function event(event_id, kind, body) { return {schema_version: "are.coding-agent-event/v1", event_id, kind, ...body, authority_effect: "none"}; }

test("the loop observes through policy then stops at exact patch approval", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-iterative-agent-"));
  try {
    writeFileSync(resolve(root, "a.txt"), "old\n");
    const base = snapshotTree(root);
    const model = scripted([
      event("event:1", "tool-request", {tool: {name: "read-file", arguments: {path: "a.txt"}}}),
      event("event:2", "final-candidate", {candidate: {schema_version: "are.next-action-candidate/v1", operation: "replace-file", path: "a.txt", expected_base_tree_sha256: base.tree_sha256, expected_file_sha256: sha256(readFileSync(resolve(root, "a.txt"))), utf8: "new\n", rationale: "fixture", authority_effect: "none"}}),
    ]);
    const result = await runIterativeCodingAgent({run_id: "iterative:test", request: "Change old to new", fixture_root: root, model_transport: model, tool_runtime: createReadOnlyToolRuntime({repository_root: root, observation_allowlist: ["a.txt"]}), tool_policy: {allow: ["read-file"]}, mutation_allowlist: ["a.txt"], verification_command: [process.execPath, "-e", "process.exit(0)"], approve: false});
    assert.equal(result.status, "AWAITING_APPROVAL");
    assert.equal(result.steps, 2);
    assert.equal(result.history[0].observation.ok, true);
    assert.equal(result.candidate_result.schema_version, "are.patch-set-runtime-result/v1");
    assert.equal(readFileSync(resolve(root, "a.txt"), "utf8"), "old\n");
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("unattended ask, duplicate events, and step exhaustion terminate without effects", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-iterative-block-"));
  try {
    writeFileSync(resolve(root, "a.txt"), "old\n");
    const tool = createReadOnlyToolRuntime({repository_root: root, observation_allowlist: ["a.txt"]});
    const requestEvent = event("same", "tool-request", {tool: {name: "read-file", arguments: {path: "a.txt"}}});
    const asked = await runIterativeCodingAgent({request: "read", fixture_root: root, model_transport: scripted([requestEvent]), tool_runtime: tool, tool_policy: {ask: ["read-file"]}, maximum_steps: 1});
    assert.equal(asked.status, "BLOCK");
    assert.equal(asked.reason_codes.includes("tool.ask-denied-unattended"), true);
    const exhausted = await runIterativeCodingAgent({request: "read", fixture_root: root, model_transport: scripted([requestEvent]), tool_runtime: tool, tool_policy: {allow: ["read-file"]}, maximum_steps: 1});
    assert.equal(exhausted.reason_codes.includes("agent.step-limit-exceeded"), true);
    assert.equal(readFileSync(resolve(root, "a.txt"), "utf8"), "old\n");
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("the model sees only tools allowed by the effective unattended policy", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-iterative-policy-"));
  try {
    writeFileSync(resolve(root, "a.txt"), "old\n");
    const base = snapshotTree(root);
    let observedPrompt = null;
    const model = {async generate({prompt}) {
      observedPrompt = prompt;
      return {final_bytes: JSON.stringify(event("final", "final-candidate", {candidate: {schema_version: "are.next-action-candidate/v1", operation: "replace-file", path: "a.txt", expected_base_tree_sha256: base.tree_sha256, expected_file_sha256: sha256(readFileSync(resolve(root, "a.txt"))), utf8: "new\n", rationale: "policy fixture", authority_effect: "none"}}))};
    }};
    const tool = {tool_names: ["read-file", "run-command"], invoke() { throw new Error("not invoked"); }};
    const result = await runIterativeCodingAgent({request: "change", fixture_root: root, model_transport: model, tool_runtime: tool, tool_policy: {allow: ["read-file"], deny: ["run-command"]}, mutation_allowlist: ["a.txt"], verification_command: [process.execPath, "--test"], approve: false});
    assert.equal(result.status, "AWAITING_APPROVAL");
    assert.match(observedPrompt, /Available read-only tools: \["read-file"\]/u);
    assert.doesNotMatch(observedPrompt, /Available read-only tools:.*run-command/u);
    assert.match(observedPrompt, /Exact tool contracts:/u);
    assert.match(observedPrompt, /Verification command: \[.*--test"\]/u);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("tool contracts give exact arguments and nonzero diagnostics remain observations", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-iterative-tool-contract-"));
  try {
    writeFileSync(resolve(root, "a.txt"), "old\n");
    const sandbox = {run(command) { return {ok: false, schema_version: "are.coding-agent-sandbox-result/v1", reason_codes: ["sandbox.command-failed"], command, observed_exit: 1, stdout: "", stderr: "failed", authority_effect: "none"}; }};
    const tool = createReadOnlyToolRuntime({repository_root: root, observation_allowlist: ["a.txt"], sandbox});
    assert.equal(tool.tool_contracts["read-file"].arguments.path.startsWith("required"), true);
    assert.deepEqual(tool.tool_contracts["run-command"].example, {command: ["node", "--test"]});
    assert.deepEqual(tool.invoke("run-command", {}).reason_codes, ["tool.arguments-invalid"]);
    assert.equal(tool.invoke("run-command", {command: []}).ok, false);
    const observed = tool.invoke("run-command", {command: ["node", "--test"]});
    assert.equal(observed.ok, true);
    assert.equal(observed.output.ok, false);
    assert.equal(observed.output.observed_exit, 1);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
