import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {validateReleaseOwnerDecisions} from "./verify-release-owner-decisions.mjs";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const decisions = JSON.parse(readFileSync(resolve(docsRoot, "release-owner-decisions.json"), "utf8"));
const candidate = JSON.parse(readFileSync(resolve(docsRoot, "../evidence/product-candidate.018.json"), "utf8"));
const validate = value => validateReleaseOwnerDecisions(value, {candidate});

test("owner decisions bind identity, markets, contacts, roles, use, and license direction", () => {
  assert.deepEqual(validate(decisions), {market_count: 3, owner_count: 5, evidence_gate_count: 5});
});

test("owner decisions reject legacy commercial identity", () => {
  const legacy = structuredClone(decisions);
  legacy.commercial_identity.product_name = "CyberAlchemy ARE";
  assert.throws(() => validate(legacy), /owner-decisions\.product-name-invalid/u);
});

test("owner decisions reject a changed resale threshold", () => {
  const changed = structuredClone(decisions);
  changed.license_direction.resale_threshold.does_not_qualify.pop();
  assert.throws(() => validate(changed), /owner-decisions\.resale-non-qualifiers-invalid/u);
});

test("owner decisions preserve evidence and qualified-review gates", () => {
  const cleared = structuredClone(decisions);
  cleared.remaining_evidence_gates = [];
  assert.throws(() => validate(cleared), /owner-decisions\.evidence-gates-incomplete/u);
});
