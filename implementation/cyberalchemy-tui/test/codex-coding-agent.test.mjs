import assert from "node:assert/strict";
import test from "node:test";

import {parseCodexScopeConfig} from "../src/codex-coding-agent.mjs";

test("Codex scope configuration carries no model credential and rejects unknown fields", () => {
  const parsed = parseCodexScopeConfig({
    schema_version: "are.codex-coding-agent-scope/v1",
    observation_allowlist: ["package.json", "src/a.mjs"],
    mutation_allowlist: ["src/a.mjs"],
    verification_command: [process.execPath, "--test"],
  });
  assert.deepEqual(parsed.mutation_allowlist, ["src/a.mjs"]);
  assert.equal(parsed.maximum_steps, 8);
  assert.deepEqual(parsed.tool_policy.allow, ["list-files", "read-file", "search-text", "repository-map"]);
  assert.equal(parsed.repository_map.maximum_files, 256);
  assert.deepEqual(parseCodexScopeConfig(parsed), parsed);
  assert.equal(Object.hasOwn(parsed, "credential"), false);
  assert.throws(() => parseCodexScopeConfig({...parsed, credential: "forbidden"}), /invalid/u);
});
