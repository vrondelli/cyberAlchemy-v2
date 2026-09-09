import assert from "node:assert/strict";
import test from "node:test";

import {assessPatchSemantics, evaluateAgentEffect} from "../semantic-control.mjs";

test("semantic assessment requires an exact candidate digest and exact semantic inputs", () => {
  assert.deepEqual(assessPatchSemantics({candidate_digest: "bad", semantic_input: {}}).reason_codes, ["semantic.candidate-digest-required"]);
  const blocked = assessPatchSemantics({candidate_digest: "0".repeat(64), semantic_input: {}});
  assert.equal(blocked.ok, false);
  assert.equal(blocked.authority_effect, "none");
});

test("effect policy rejects unsupported requests without granting authority", () => {
  const result = evaluateAgentEffect({message: {method: "turn/start"}});
  assert.equal(result.ok, false);
  assert.equal(result.authority_effect, "none");
});
