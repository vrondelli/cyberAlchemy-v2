import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  ALLOWED_IMPORT_SEMANTICS,
  EXPECTED_IMPORTS,
  PROHIBITED_INFERENCES,
  validateProtectedImports,
} from "../runtime/validate-imports.mjs";
import {
  PARENT_FIELD_SELECTORS,
  TARGET_IDS,
  TARGET_KINDS,
  deriveAtomicTargetSet,
  digestText,
  validateAtomicTargetSet,
} from "../runtime/validate-atomic-targets.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const calibrationRoot = resolve(packageRoot, "..");
const readPackageJson = (path) => JSON.parse(readFileSync(resolve(packageRoot, path), "utf8"));
const readCalibrationJson = (path) => JSON.parse(readFileSync(resolve(calibrationRoot, path), "utf8"));

const importSchema = readPackageJson("contracts/protected-import.schema.yml");
const targetSchema = readPackageJson("contracts/atomic-target-set.schema.yml");
const vectors = readPackageJson("fixtures/contracts/import-target-vectors.json");
const protectedManifest = readPackageJson(vectors.valid.protected_import_manifest);
const targetSet = readPackageJson(vectors.valid.atomic_target_set);
const parentReceipt = readCalibrationJson("evidence/generation-001/f3-savvy-page/receipt.json");

test("schema vocabulary matches direct validators", () => {
  assert.deepEqual(importSchema.$defs.import.properties.allowed_semantics.enum, ALLOWED_IMPORT_SEMANTICS);
  assert.deepEqual(importSchema.properties.prohibited_inferences.items.enum, PROHIBITED_INFERENCES);
  assert.deepEqual(importSchema.$defs.import.properties.import_id.enum, EXPECTED_IMPORTS.map((item) => item.import_id));
  assert.deepEqual(targetSchema.$defs.target.properties.target_id.enum, TARGET_IDS);
  assert.deepEqual(targetSchema.$defs.target.properties.kind.enum, TARGET_KINDS);
  assert.deepEqual(targetSchema.$defs.target.properties.parent_field_selector.enum, PARENT_FIELD_SELECTORS);
  for (const schema of [importSchema, targetSchema]) {
    const semantic = new Set(schema["x-cdsc-semantic-fields"]);
    const volatile = new Set(schema["x-cdsc-volatile-fields"]);
    assert.equal([...semantic].some((field) => volatile.has(field)), false);
  }
});

test("exact protected imports and UI limits validate", () => {
  assert.equal(validateProtectedImports(protectedManifest, { root: repositoryRoot, allowSuccessors: true }), true);
  assert.equal(protectedManifest.imports.length, 14);
  assert.equal(protectedManifest.imports.find((item) => item.import_id === "ui-dossier-policy").expected_assertions[0].equals, "defer");
  assert.equal(protectedManifest.imports.find((item) => item.import_id === "ui-dossier").expected_assertions[0].equals, "DEFER");
});

test("six atomic targets derive deterministically from parent text only", () => {
  const first = deriveAtomicTargetSet(parentReceipt);
  const second = deriveAtomicTargetSet(parentReceipt);
  assert.deepEqual(first, second);
  assert.deepEqual(first, targetSet);
  assert.equal(validateAtomicTargetSet(targetSet, parentReceipt), true);
  assert.equal(new Set(targetSet.targets.map((item) => item.target_digest)).size, 6);
  for (const target of targetSet.targets) assert.equal(target.target_digest, digestText(target.canonical_proposition));
});

test("declared invalid vectors reject before browser work", async (t) => {
  const mutations = {
    "wrong-predecessor": () => {
      const candidate = structuredClone(protectedManifest);
      candidate.generation_tail.generation_id = `generation:sha256:${"0".repeat(64)}`;
      return () => validateProtectedImports(candidate, { root: repositoryRoot, allowSuccessors: true });
    },
    "changed-parent-text": () => {
      const changedParent = structuredClone(parentReceipt);
      changedParent.semantic.S.permitted.description += " Changed.";
      return () => validateAtomicTargetSet(targetSet, changedParent);
    },
    "outcome-derived-target": () => mutateTarget(0, (target) => { target.observed_consequence = "match"; }),
    "combined-target": () => mutateTarget(1, (target) => { target.canonical_proposition = `${target.canonical_proposition} Route coordination remains stable.`; }),
    "missing-target": () => {
      const candidate = structuredClone(targetSet);
      candidate.targets.pop();
      return () => validateAtomicTargetSet(candidate, parentReceipt);
    },
    "duplicate-target": () => {
      const candidate = structuredClone(targetSet);
      candidate.targets[1] = structuredClone(candidate.targets[0]);
      return () => validateAtomicTargetSet(candidate, parentReceipt);
    },
    "overlapping-target": () => mutateTarget(2, (target, candidate) => {
      target.canonical_proposition = candidate.targets[1].canonical_proposition;
      target.target_digest = candidate.targets[1].target_digest;
    }),
    "semantic-reordering": () => {
      const candidate = structuredClone(targetSet);
      candidate.targets.reverse();
      return () => validateAtomicTargetSet(candidate, parentReceipt);
    },
    "unknown-target-field": () => mutateTarget(0, (target) => { target.outcome = "supported"; }),
    "ui-status-inflation": () => mutateImport("ui-dossier-policy", (item) => { item.expected_assertions[0].equals = "pass"; }),
    "protected-byte-drift": () => mutateImport("m1-observation", (item) => { item.raw_sha256 = `sha256:${"0".repeat(64)}`; }),
    "unknown-import-field": () => mutateImport("parent-f3", (item) => { item.interpretation = "identity"; }),
  };

  for (const vector of vectors.negative_vectors) {
    await t.test(vector.id, () => {
      assert.throws(mutations[vector.id](), new RegExp(vector.expected_error));
    });
  }
});

test("SWU001 receipt contains only contract outputs and no later evidence authority", () => {
  const receipt = readPackageJson("runs/SWU-CDSC3-001/receipt.json");
  assert.equal(receipt.status, "pass");
  assert.equal(receipt.authority_effect, "none");
  assert.equal(receipt.next_swu, "SWU-CDSC3-002");
  assert.deepEqual(Object.keys(receipt.outputs).sort(), [
    "atomic_target_schema",
    "atomic_target_set",
    "protected_import_manifest",
    "protected_import_schema",
  ]);
});

function mutateTarget(index, mutate) {
  const candidate = structuredClone(targetSet);
  mutate(candidate.targets[index], candidate);
  return () => validateAtomicTargetSet(candidate, parentReceipt);
}

function mutateImport(importId, mutate) {
  const candidate = structuredClone(protectedManifest);
  mutate(candidate.imports.find((item) => item.import_id === importId));
  return () => validateProtectedImports(candidate, { root: repositoryRoot, allowSuccessors: true });
}
