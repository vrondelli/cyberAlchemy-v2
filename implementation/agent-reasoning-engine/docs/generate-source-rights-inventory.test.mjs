import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {buildSourceRightsInventory} from "./generate-source-rights-inventory.mjs";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const root = resolve(docsRoot, "../../..");
const candidate = JSON.parse(readFileSync(resolve(docsRoot, "../evidence/product-candidate.018.json"), "utf8"));
const ownerDecisions = JSON.parse(readFileSync(resolve(docsRoot, "release-owner-decisions.json"), "utf8"));
const readBound = path => readFileSync(resolve(root, path.replace(/^cyberAlchemy-v2\//u, "")));

test("source-rights inventory covers every exact Candidate 018 file", () => {
  const result = buildSourceRightsInventory(candidate, ownerDecisions, {readFile: readBound});
  assert.equal(result.summary.file_count, 907);
  assert.equal(result.summary.total_bytes, 7954528);
  assert.equal(result.summary.owner_assertion_file_count, 907);
  assert.equal(result.summary.provenance_review_required_file_count, 907);
  assert.equal(result.owner_assertion.copyright_owner, "Vladimir Rondelli");
  assert.equal(result.files.length, candidate.source_closure.files.length);
  assert.deepEqual(result.files.map(file => file.path), candidate.source_closure.files.map(file => file.path));
});

test("source-rights inventory is deterministic", () => {
  assert.deepEqual(buildSourceRightsInventory(candidate, ownerDecisions, {readFile: readBound}), buildSourceRightsInventory(candidate, ownerDecisions, {readFile: readBound}));
});

test("source-rights inventory rejects bytes outside the frozen closure", () => {
  const first = candidate.source_closure.files[0].path;
  assert.throws(() => buildSourceRightsInventory(candidate, ownerDecisions, {readFile: path => path === first ? Buffer.from("changed") : readBound(path)}), /source-rights\.(?:byte|digest)-drift/u);
});
