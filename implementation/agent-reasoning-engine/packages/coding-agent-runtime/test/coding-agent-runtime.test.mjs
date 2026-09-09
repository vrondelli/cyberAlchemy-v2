import assert from "node:assert/strict";
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import test from "node:test";

import {runCodingAgentSlice, snapshotTree} from "../index.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "are-coding-agent-test-"));
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

function run(item, overrides = {}) { return runCodingAgentSlice({run_id: `test-${Math.random()}`, request: "repair", fixture_root: item.root, mutation_allowlist: ["src/range.mjs"], verification_command: [process.execPath, "--test"], raw_candidate: item.candidate, ...overrides}); }

test("stops before mutation when explicit approval is withheld", () => {
  const item = fixture();
  try { const receipt = run(item); assert.equal(receipt.status, "AWAITING_APPROVAL"); assert.equal(snapshotTree(item.root).tree_sha256, item.before.tree_sha256); assert.equal(receipt.effect_applied, false); } finally { item.cleanup(); }
});

test("applies one allowlisted patch and independently verifies the postimage", () => {
  const item = fixture();
  try { const receipt = run(item, {approve: true}); assert.equal(receipt.status, "PATCH_CANDIDATE", JSON.stringify(receipt)); assert.deepEqual(receipt.verification.changed_paths, ["src/range.mjs"]); assert.equal(receipt.verification.status, "PASS_BOUNDED"); assert.match(readFileSync(resolve(item.root, "src/range.mjs"), "utf8"), /x<=b/u); } finally { item.cleanup(); }
});

test("blocks a candidate outside the mutation allowlist", () => {
  const item = fixture();
  try { const candidate = {...item.candidate, path: "test/range.test.mjs", expected_file_sha256: item.before.files["test/range.test.mjs"]}; const receipt = run(item, {raw_candidate: candidate, approve: true}); assert.equal(receipt.status, "BLOCK"); assert.ok(receipt.reason_codes.includes("action.path-not-allowlisted")); assert.equal(snapshotTree(item.root).tree_sha256, item.before.tree_sha256); } finally { item.cleanup(); }
});

test("blocks stale base-tree bindings", () => {
  const item = fixture();
  try { writeFileSync(resolve(item.root, "src/range.mjs"), `${readFileSync(resolve(item.root, "src/range.mjs"), "utf8")}\n`); const receipt = run(item, {approve: true}); assert.equal(receipt.status, "BLOCK"); assert.ok(receipt.reason_codes.includes("action.base-tree-drift")); } finally { item.cleanup(); }
});

test("returns EFFECT_AMBIGUOUS and forbids retry after a post-effect fault", () => {
  const item = fixture();
  try { const receipt = run(item, {approve: true, fault_injection: "after-effect-before-observation"}); assert.equal(receipt.status, "EFFECT_AMBIGUOUS"); assert.equal(receipt.automatic_retry_permitted, false); } finally { item.cleanup(); }
});

test("rejects malformed candidate bytes with zero effect", () => {
  const item = fixture();
  try { const receipt = run(item, {raw_candidate: "{", approve: true}); assert.equal(receipt.status, "BLOCK"); assert.ok(receipt.reason_codes.includes("candidate.json-invalid")); assert.equal(snapshotTree(item.root).tree_sha256, item.before.tree_sha256); } finally { item.cleanup(); }
});
