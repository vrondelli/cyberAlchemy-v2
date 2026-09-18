import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {validateReadinessLedger} from "./verify-release-readiness.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const ledger = JSON.parse(readFileSync(resolve(root, "implementation/agent-reasoning-engine/docs/release-readiness.json"), "utf8"));
const planSource = readFileSync(resolve(root, "development/agent-reasoning-engine/planning/documentation-readiness/PLAN.md"), "utf8");
const candidate = JSON.parse(readFileSync(resolve(root, "implementation/agent-reasoning-engine/evidence/product-candidate.018.json"), "utf8"));
const pathExists = ref => readFileSync(resolve(root, ref)) !== undefined;
const validate = value => validateReadinessLedger(value, {planSource, candidate, pathExists});

test("readiness ledger accounts for every plan task and evidence gate", () => {
  const result = validate(ledger);
  assert.equal(result.task_count, 38);
  assert.equal(result.status_counts.COMPLETE, 23);
  assert.equal(result.status_counts.AWAITING_OWNER, 0);
});

test("readiness ledger rejects missing tasks and unsupported completion", () => {
  const missing = structuredClone(ledger);
  missing.tasks.pop();
  assert.throws(() => validate(missing), /readiness\.task-coverage-mismatch/u);

  const unsupported = structuredClone(ledger);
  const task = unsupported.tasks.find(item => item.task_id === "DR-50");
  task.status = "COMPLETE";
  assert.throws(() => validate(unsupported), /readiness\.complete-has-blocker:DR-50/u);
});

test("readiness ledger rejects incomplete tasks without owned next gates", () => {
  const noBlocker = structuredClone(ledger);
  noBlocker.tasks.find(item => item.task_id === "DR-51").blockers = [];
  assert.throws(() => validate(noBlocker), /readiness\.incomplete-without-blocker:DR-51/u);

  const noOwner = structuredClone(ledger);
  noOwner.tasks.find(item => item.task_id === "DR-51").blockers[0].owner_role = "";
  assert.throws(() => validate(noOwner), /readiness\.blocker-field-missing:DR-51:owner_role/u);
});
