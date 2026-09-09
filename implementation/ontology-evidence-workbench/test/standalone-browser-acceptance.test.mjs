import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = process.env.OEW_ACCEPTANCE_OUTPUT_ROOT
  ? resolve(root, process.env.OEW_ACCEPTANCE_OUTPUT_ROOT)
  : join(root, "generated/runs/WP-SOEW-001");
const receipt = JSON.parse(await readFile(join(outputRoot, "full-body-war-browser-acceptance.json"), "utf8"));
test("standalone Body War browser receipt is terminal and bounded", () => {
  assert.equal(receipt.schema_version, "oew.standalone-browser-acceptance.v1");
  assert.equal(receipt.work_pack_id, "WP-SOEW-001");
  assert.equal(receipt.result, "pass");
  assert.equal(receipt.authority_effect, "none");
  assert.equal(receipt.dataset.nodes, 237);
  assert.equal(receipt.dataset.relations, 231);
  assert.equal(receipt.errors.length, 0);
  assert.ok(receipt.journeys.length >= 8);
  assert.ok(receipt.journeys.every((journey) => journey.result === "pass"));
  assert.ok(receipt.artifacts.length >= 2);
});
