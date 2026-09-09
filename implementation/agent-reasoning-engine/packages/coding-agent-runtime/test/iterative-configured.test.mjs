import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {applyConfiguredCodingAgentProposal, proposeConfiguredIterativeCodingAgent} from "../configured-runner.mjs";
import {snapshotTree} from "../verifier.mjs";

function config() { return {schema_version: "are.coding-agent-run-config/v1", model: {transport: "openai-compatible", base_url: "http://127.0.0.1:11434/v1", model: "fixture"}, observation_allowlist: ["a.mjs"], mutation_allowlist: ["a.mjs"], verification_command: ["node", "--test"], iterative: {maximum_steps: 3, tool_policy: {allow: ["read-file", "repository-map"], ask: [], deny: []}}, sandbox: {type: "container", engine: "/usr/bin/docker", image: `example.invalid/agent@sha256:${"a".repeat(64)}`, allowed_commands: ["node"]}, repository_map: {maximum_files: 10, maximum_bytes: 4096}, advanced_reasoning: {maximum_event_count: 16}}; }

test("configured iterative runner creates a resumable patch-set proposal", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-configured-iterative-"));
  const stateRoot = mkdtempSync(resolve(tmpdir(), "are-configured-iterative-state-"));
  try {
    writeFileSync(resolve(root, "a.mjs"), "export const a = 1;\n");
    const before = snapshotTree(root);
    const event = {schema_version: "are.coding-agent-event/v1", event_id: "final:1", kind: "final-candidate", candidate: {schema_version: "are.next-action-candidate/v1", operation: "replace-file", path: "a.mjs", expected_base_tree_sha256: before.tree_sha256, expected_file_sha256: before.files["a.mjs"], utf8: "export const a = 2;\n", rationale: "fixture", authority_effect: "none"}, authority_effect: "none"};
    let prompt;
    const session = resolve(stateRoot, "session.jsonl");
    const proposal = await proposeConfiguredIterativeCodingAgent({config: config(), repository_root: root, request: "change a", session_path: session, fetch_impl: async (_url, options) => { prompt = JSON.parse(options.body).messages[0].content; return {ok: true, status: 200, async json() { return {choices: [{message: {content: JSON.stringify(event)}}]}; }}; }});
    assert.equal(proposal.status, "AWAITING_APPROVAL", JSON.stringify(proposal));
    assert.equal(proposal.proposal_mode, "iterative");
    assert.equal(JSON.parse(proposal.candidate_utf8).schema_version, "are.patch-set-candidate/v1");
    assert.equal(prompt.includes("repository_map"), true);
    assert.equal(prompt.includes("run-command"), false);
    assert.equal(readFileSync(session, "utf8").length > 0, true);
    assert.equal(proposal.reasoning_replay_fixture.schema_version, "are.reasoning-replay-fixture/v1");
    assert.equal(proposal.portable_reasoning_epoch.schema_version, "are.portable-reasoning-epoch/v1");
    const applied = applyConfiguredCodingAgentProposal({config: config(), repository_root: root, proposal, approval_digest: proposal.approval_digest, sandbox_runner: () => ({status: 0, stdout: "pass", stderr: ""})});
    assert.equal(applied.status, "PATCH_CANDIDATE", JSON.stringify(applied));
    assert.equal(readFileSync(resolve(root, "a.mjs"), "utf8"), "export const a = 2;\n");

    const cancelled = resolve(stateRoot, "cancel");
    writeFileSync(cancelled, "cancel\n");
    const resumed = await proposeConfiguredIterativeCodingAgent({config: config(), repository_root: root, request: "change a", session_path: session, resume: true, cancel_file: cancelled, fetch_impl: async () => { throw new Error("must not call model"); }});
    assert.equal(resumed.status, "CANCELLED");
  } finally { rmSync(root, {recursive: true, force: true}); rmSync(stateRoot, {recursive: true, force: true}); }
});
