import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { evaluatePolicy, POLICY_DIGEST } from "../src/evaluator/policy-disposition.mjs";

const fixtureUrl = new URL("../fixtures/", import.meta.url);
const policy = JSON.parse(await readFile(new URL("policy.v1.json", fixtureUrl), "utf8"));
const empty = { issues: [] };

test("returns the finite positive policy pass", () => {
  assert.deepEqual(
    evaluatePolicy({ policy, policyDigest: POLICY_DIGEST }),
    {
      policy_id: "candidate-policy-v1",
      disposition: "policy-pass",
      codes: ["POLICY_RULES_SATISFIED"],
      authority_effect: "none",
    },
  );
});

for (const code of [
  "UNKNOWN_NODE_KIND",
  "AUTHORITY_EFFECT_FORBIDDEN",
  "EDGE_ENDPOINT_PAIR_FORBIDDEN",
  "SESSION_CLAIM_FORBIDDEN",
  "SESSION_EVIDENCE_FORBIDDEN",
  "INVERSE_EDGE_DECLARATION",
  "GROUNDING_CYCLE",
]) {
  test(`preserves upstream failure ${code}`, () => {
    const result = evaluatePolicy({
      policy,
      policyDigest: POLICY_DIGEST,
      carrierResult: { issues: [{ code }] },
      edgeResult: empty,
      groundingResult: empty,
    });
    assert.equal(result.disposition, "policy-fail");
    assert.deepEqual(result.codes, [code]);
  });
}

test("returns indeterminate for the unowned specializes candidate", async () => {
  const relationCandidate = JSON.parse(
    await readFile(new URL("cases/specializes-owner-unbound.v1.json", fixtureUrl), "utf8"),
  );
  assert.deepEqual(
    evaluatePolicy({ policy, policyDigest: POLICY_DIGEST, relationCandidate }),
    {
      policy_id: "candidate-policy-v1",
      disposition: relationCandidate.expected_disposition,
      codes: [relationCandidate.expected_reason],
      authority_effect: "none",
    },
  );
});

test("rejects stale policy digest or material", () => {
  assert.deepEqual(
    evaluatePolicy({ policy, policyDigest: "0".repeat(64) }).codes,
    ["POLICY_BINDING_MISMATCH"],
  );
  const changed = structuredClone(policy);
  changed.owner = "other-owner";
  assert.deepEqual(
    evaluatePolicy({ policy: changed, policyDigest: POLICY_DIGEST }).codes,
    ["POLICY_BINDING_MISMATCH"],
  );
});

test("sorts and deduplicates upstream codes", () => {
  const result = evaluatePolicy({
    policy,
    policyDigest: POLICY_DIGEST,
    carrierResult: { issues: [{ code: "Z" }, { code: "A" }, { code: "Z" }] },
  });
  assert.deepEqual(result.codes, ["A", "Z"]);
});

test("policy evaluator has no writer or authority transition", async () => {
  const source = await readFile(
    new URL("../src/evaluator/policy-disposition.mjs", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /node:fs|writeFile|mkdir|promot|admitMeaning|authority_effect:\s*"(?!none)/);
});
