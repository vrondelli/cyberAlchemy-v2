import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {buildSourceRightsInventory, validateFrozenInventory} from "./generate-source-rights-inventory.mjs";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const root = resolve(docsRoot, "../../..");
const candidate = JSON.parse(readFileSync(resolve(docsRoot, "../evidence/product-candidate.018.json"), "utf8"));
const ownerDecisions = JSON.parse(readFileSync(resolve(docsRoot, "release-owner-decisions.json"), "utf8"));
const readBound = path => readFileSync(resolve(root, path.replace(/^cyberAlchemy-v2\//u, "")));
const inventoryBytes = readFileSync(resolve(docsRoot, "source-rights-inventory.json"), "utf8");
const inventory = JSON.parse(inventoryBytes);
const receipt = JSON.parse(readFileSync(resolve(docsRoot, "source-rights-inventory-receipt.json"), "utf8"));

test("source-rights inventory covers every exact Candidate 018 file", () => {
  const result = inventory;
  assert.equal(validateFrozenInventory(inventory, candidate, receipt, inventoryBytes).status, "PASS");
  assert.equal(result.summary.file_count, 907);
  assert.equal(result.summary.total_bytes, 7954528);
  assert.equal(result.summary.owner_assertion_file_count, 907);
  assert.equal(result.summary.provenance_review_required_file_count, 907);
  assert.equal(result.owner_assertion.copyright_owner, "Vladimir Rondelli");
  assert.equal(result.files.length, candidate.source_closure.files.length);
  assert.deepEqual(result.files.map(file => file.path), candidate.source_closure.files.map(file => file.path));
});

test("source-rights inventory is deterministic", () => {
  const bytes = Buffer.from("const fixture = true;\n");
  const fixtureCandidate = {
    candidate_id: "FIXTURE",
    candidate_digest: "f".repeat(64),
    source_closure: {closure_digest: "c".repeat(64), files: [{path: "cyberAlchemy-v2/fixture.mjs", bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), mode: 420}]},
  };
  const options = {readFile: () => bytes};
  assert.deepEqual(buildSourceRightsInventory(fixtureCandidate, ownerDecisions, options), buildSourceRightsInventory(fixtureCandidate, ownerDecisions, options));
});

test("source-rights inventory rejects bytes outside the frozen closure", () => {
  const first = candidate.source_closure.files[0].path;
  assert.throws(() => buildSourceRightsInventory(candidate, ownerDecisions, {readFile: path => path === first ? Buffer.from("changed") : readBound(path)}), /source-rights\.(?:byte|digest)-drift/u);
});
