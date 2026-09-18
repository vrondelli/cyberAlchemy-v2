import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {resolve} from "node:path";
import test from "node:test";

test("the source-rights engineering review covers the exact Candidate 018 inventory", () => {
  const result = spawnSync(process.execPath, [resolve(import.meta.dirname, "verify-source-rights-review.mjs")], {encoding: "utf8"});
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.status, "PASS");
  assert.equal(receipt.source_family_count, 134);
  assert.equal(receipt.notice_disposition_count, 1);
});
