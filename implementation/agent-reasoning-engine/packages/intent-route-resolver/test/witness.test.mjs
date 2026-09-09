import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {canonicalJson} from "../index.mjs";
import {executeWitnessCases} from "./fixtures/witness/evaluate.mjs";

test("the fixed witness matrix passes with canonical outputs", async () => {
  const document = JSON.parse(await readFile(
    new URL("./fixtures/witness/cases.json", import.meta.url),
    "utf8",
  ));
  const result = executeWitnessCases(document);

  assert.equal(result.status, "PASS");
  assert.equal(result.case_count, 17);
  assert.equal(result.comparison_count, 2);
  assert.equal(result.cases.every((item) => item.output_bytes === canonicalJson(item.output)), true);
  assert.equal(result.comparisons.every((item) => item.pass), true);
});
