import assert from "node:assert/strict";
import {chmodSync, mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {runCodingAgentPreflight} from "../preflight.mjs";

const image = `example.invalid/agent@sha256:${"a".repeat(64)}`;
function config(engine) { return {schema_version: "are.coding-agent-run-config/v1", model: {transport: "openai-compatible", base_url: "http://127.0.0.1:11434/v1", model: "fixture"}, observation_allowlist: ["a.mjs"], mutation_allowlist: ["a.mjs"], verification_command: ["node", "--test"], sandbox: {type: "container", engine, image, allowed_commands: ["node"]}}; }

test("preflight collects configuration, repository, session, output, engine, and image evidence without a model call", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-preflight-"));
  const state = mkdtempSync(resolve(tmpdir(), "are-preflight-state-"));
  try {
    writeFileSync(resolve(root, "a.mjs"), "export const a = 1;\n");
    const engine = resolve(state, "docker");
    writeFileSync(engine, "#!/bin/sh\nexit 0\n");
    chmodSync(engine, 0o700);
    const result = runCodingAgentPreflight({provider: "openai-compatible", config: config(engine), repository_root: root, session_path: resolve(state, "session.jsonl"), proposal_output: resolve(state, "proposal.json"), runner: () => ({status: 0})});
    assert.equal(result.status, "PASS", JSON.stringify(result));
    assert.equal(result.model_invoked, false);
    assert.equal(result.repository_effects, 0);
    assert.equal(result.checks.every((entry) => entry.status === "PASS"), true);
  } finally { rmSync(root, {recursive: true, force: true}); rmSync(state, {recursive: true, force: true}); }
});

test("preflight blocks invalid launch dependencies and retains causal not-evaluable checks", () => {
  const result = runCodingAgentPreflight({provider: "openai-compatible", config: {}, repository_root: "/not/a/repository", probe_container: false});
  assert.equal(result.status, "BLOCK");
  assert.equal(result.reason_codes.includes("preflight.configuration-invalid"), true);
  assert.equal(result.reason_codes.includes("preflight.repository-unavailable"), true);
  assert.equal(result.checks.find((entry) => entry.check_id === "sandbox-image").status, "not_evaluable");
});
