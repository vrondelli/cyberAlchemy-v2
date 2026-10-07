import "../research/hen-09-tokenizer-qualification-v1/qualification.test.mjs";

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";

test("HEN-09 cumulative provider accounting includes rejected and accepted attempts", () => {
  const root = join(import.meta.dirname, "..");
  const evidence = JSON.parse(readFileSync(join(root, "evidence/HEN-09-TOKENIZER-QUALIFICATION.v1.json")));
  const rejected = JSON.parse(readFileSync(join(root,
    "evidence/hen-09-tokenizer-qualification-v1/attempts/vps-187-77-163-194-r1/RESULTS.json")));
  const accepted = JSON.parse(readFileSync(join(root,
    "evidence/hen-09-tokenizer-qualification-v2/attempts/vps-187-77-163-194-r2/RESULTS.json")));
  assert.equal(evidence.qualification.rejected_predecessor_provider_calls, rejected.provider_calls);
  assert.equal(evidence.qualification.accepted_revision_provider_calls, accepted.provider_calls);
  assert.equal(evidence.qualification.total_provider_calls, rejected.provider_calls + accepted.provider_calls);
  assert.equal(evidence.qualification.model_calls, rejected.model_calls + accepted.model_calls);
});
