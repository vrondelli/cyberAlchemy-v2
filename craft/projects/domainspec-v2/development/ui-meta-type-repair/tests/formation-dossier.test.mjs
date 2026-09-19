import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { CONJUNCT_ORDER, createFormationDossier } from "../evidence/formation-dossier.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = JSON.parse(readFileSync(resolve(root, "fixtures/contracts/formation-dossier.json"), "utf8"));

function clone(value) {
  return structuredClone(value);
}

test("current eight-conjunct dossier deterministically defers without a score", () => {
  const dossier = createFormationDossier(fixture);
  assert.equal(dossier.semantic.outcome, "DEFER");
  assert.equal(dossier.status, "defer");
  assert.deepEqual(dossier.semantic.conjuncts.map((entry) => entry.id), CONJUNCT_ORDER);
  assert.equal(Object.hasOwn(dossier.semantic, "score"), false);
  assert.equal(dossier.semantic.conjuncts.find((entry) => entry.id === "owner-firewall").state, "pending-owner");
});

test("removing any single hard conjunct fails closed", () => {
  for (let index = 0; index < CONJUNCT_ORDER.length; index += 1) {
    const missing = clone(fixture);
    missing.conjuncts.splice(index, 1);
    assert.throws(() => createFormationDossier(missing), /requires exactly eight conjuncts/, CONJUNCT_ORDER[index]);
  }
});

test("label and criterion erasure require explicit erasure-test evidence", () => {
  for (const id of ["label-erasure", "criterion-erasure"]) {
    const invalid = clone(fixture);
    const conjunct = invalid.conjuncts.find((entry) => entry.id === id);
    conjunct.state = "pass";
    conjunct.evidence_class = "shared-hygiene";
    conjunct.evidence_handles = [invalid.producer_handles.mutation];
    assert.throws(() => createFormationDossier(invalid), /shared hygiene cannot satisfy|requires erasure-test evidence/);
  }
});

test("shared hygiene cannot become independent-positive evidence", () => {
  const invalid = clone(fixture);
  invalid.conjuncts[0].state = "pass";
  invalid.conjuncts[0].evidence_class = "shared-hygiene";
  invalid.conjuncts[0].evidence_handles = [invalid.producer_handles.mutation];
  assert.throws(() => createFormationDossier(invalid), /requires independent-witness evidence|shared hygiene cannot satisfy/);
});

test("weights and partial scores are prohibited", () => {
  assert.throws(() => createFormationDossier({ ...fixture, score: 0 }), /score is prohibited/);
  const weighted = clone(fixture);
  weighted.conjuncts[0].weight = 2;
  assert.throws(() => createFormationDossier(weighted), /weight is prohibited/);
});

test("all passes open evidence route while finite all-fail closure yields zeroed", () => {
  const complete = clone(fixture);
  for (const conjunct of complete.conjuncts) {
    conjunct.state = "pass";
    if (conjunct.evidence_handles.length === 0) conjunct.evidence_handles = [`evidence:${conjunct.id}`];
  }
  complete.conjuncts[0].evidence_class = "independent-witness";
  complete.conjuncts[1].evidence_class = "independent-witness";
  complete.conjuncts[2].evidence_class = "erasure-test";
  complete.conjuncts[3].evidence_class = "erasure-test";
  assert.equal(createFormationDossier(complete).semantic.outcome, "EVIDENCE-COMPLETE");

  const zeroed = clone(fixture);
  for (const conjunct of zeroed.conjuncts) conjunct.state = "fail";
  zeroed.finite_zeroing = { closed: true, all_zero: true, witness_handles: ["evidence:finite-all-zero"] };
  assert.equal(createFormationDossier(zeroed).semantic.outcome, "DOSSIER-ZEROED");
});

test("dossier generation verifies producers and replays as an immutable no-op", () => {
  const outDir = mkdtempSync(resolve(tmpdir(), "uir-dossier-"));
  try {
    const command = [resolve(root, "evidence/build-dossier-generation.mjs"), "--out-dir", outDir];
    const first = spawnSync(process.execPath, command, { encoding: "utf8" });
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /PASS: published DEFER dossier with 8 hard conjuncts/);
    const target = resolve(outDir, "dossier.json");
    const before = readFileSync(target, "utf8");
    const second = spawnSync(process.execPath, command, { encoding: "utf8" });
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /NO-OP: immutable dossier generation/);
    assert.equal(readFileSync(target, "utf8"), before);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
