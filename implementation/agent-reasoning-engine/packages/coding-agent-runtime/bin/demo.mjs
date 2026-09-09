#!/usr/bin/env node
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";

import {runModelDrivenCodingTurn} from "../controller.mjs";
import {snapshotTree} from "../index.mjs";
import {createScriptedModelTransport} from "../model-transport.mjs";

const keep = process.argv.includes("--keep");
const approve = process.argv.includes("--approve");
const fault = process.argv.includes("--fault-after-effect") ? "after-effect-before-observation" : null;
const root = mkdtempSync(join(tmpdir(), "are-coding-agent-demo-"));
const files = {
  "package.json": "{\n  \"type\": \"module\",\n  \"scripts\": {\"test\": \"node --test\"}\n}\n",
  "src/range.mjs": "export function sumInclusive(start, end) {\n  let total = 0;\n  for (let value = start; value < end; value += 1) total += value;\n  return total;\n}\n",
  "test/range.test.mjs": "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport {sumInclusive} from '../src/range.mjs';\ntest('includes both endpoints', () => { assert.equal(sumInclusive(2, 4), 9); });\ntest('single value', () => { assert.equal(sumInclusive(3, 3), 3); });\n"
};
for (const [path, utf8] of Object.entries(files)) { const target = resolve(root, path); mkdirSync(dirname(target), {recursive: true}); writeFileSync(target, utf8, "utf8"); }
const before = snapshotTree(root);
const candidate = {
  schema_version: "are.next-action-candidate/v1", operation: "replace-file", path: "src/range.mjs",
  expected_base_tree_sha256: before.tree_sha256, expected_file_sha256: before.files["src/range.mjs"],
  utf8: "export function sumInclusive(start, end) {\n  let total = 0;\n  for (let value = start; value <= end; value += 1) total += value;\n  return total;\n}\n",
  rationale: "Include both integer endpoints.", authority_effect: "none"
};
const modelTransport = createScriptedModelTransport({final_bytes: `${JSON.stringify(candidate)}\n`, transport_id: "demo-scripted-model"});
const receipt = await runModelDrivenCodingTurn({run_id: "coding-agent-demo", request: "Repair sumInclusive so it includes both integer endpoints.", fixture_root: root, observation_allowlist: ["package.json", "src/range.mjs", "test/range.test.mjs"], mutation_allowlist: ["src/range.mjs"], verification_command: [process.execPath, "--test"], model_transport: modelTransport, approve, fault_injection: fault});
process.stdout.write(`${JSON.stringify({...receipt, fixture_root: root, fixture_retained: keep}, null, 2)}\n`);
if (!keep) rmSync(root, {recursive: true, force: true});
process.exitCode = receipt.status === "PATCH_CANDIDATE" ? 0 : receipt.status === "AWAITING_APPROVAL" ? 3 : 1;
