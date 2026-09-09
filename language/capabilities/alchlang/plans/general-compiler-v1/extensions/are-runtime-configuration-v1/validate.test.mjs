import assert from "node:assert/strict";
import test from "node:test";

import {validateRuntimeConfiguration} from "./validate.mjs";

test("compiled configuration composes and every declared entry conforms", () => {
  const result = validateRuntimeConfiguration();
  assert.equal(result.status, "PASS");
  assert.equal(result.runtime_admitted, false);
  assert.equal(result.enforcement_active, false);
  assert.match(result.module_set_digest, /^[a-f0-9]{64}$/u);
  assert.equal(result.checks.filter((row) => row.outcome === "BLOCK").length, 0);
});

test("semantic, router, and intent entry meanings remain explicit", () => {
  const result = validateRuntimeConfiguration();
  for (const id of ["RequestIntentContainsPhrase", "RequestIntentSemanticKey", "RouterContainsPhrase"]) {
    assert.equal(result.checks.find((row) => row.check_id === `entry-invocation:${id}`)?.outcome, "PASS");
  }
  assert.equal(result.checks.find((row) => row.check_id === "entry-semantic-orthogonality")?.outcome, "PASS");
});
