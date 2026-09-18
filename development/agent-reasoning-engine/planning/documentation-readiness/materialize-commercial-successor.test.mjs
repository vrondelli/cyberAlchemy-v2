import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {materializeCommercialSuccessor} from "./materialize-commercial-successor.mjs";

test("Candidate 018 deterministically materializes as a standalone ARE/Keld successor", () => {
  const outputRoot = mkdtempSync(resolve(tmpdir(), "are-keld-successor-test-"));
  try {
    const first = materializeCommercialSuccessor({outputRoot});
    assert.equal(first.receipt.status, "PASS");
    assert.equal(first.receipt.successor.product_id, "keld-agent-reasoning-engine");
    assert.equal(first.receipt.successor.product_version, "0.10.0-rc.1");
    assert.equal(first.receipt.successor.file_count, 907);
    assert.deepEqual(first.receipt.successor.legacy_identity_matches, []);
    assert.equal(first.receipt.verification.doctor_status, "PASS");
    assert.equal(first.receipt.verification.test_status, "NOT_RUN");
    const packageProfile = JSON.parse(readFileSync(resolve(outputRoot, "implementation/agent-reasoning-engine/package.json"), "utf8"));
    assert.equal(packageProfile.name, "@are/agent-reasoning-engine");
    assert.equal(packageProfile.version, "0.10.0-rc.1");
  } finally {
    rmSync(outputRoot, {recursive: true, force: true});
  }
});

test("materialization refuses a non-empty destination", () => {
  const outputRoot = mkdtempSync(resolve(tmpdir(), "are-keld-successor-nonempty-"));
  try {
    writeFileSync(resolve(outputRoot, "sentinel"), "occupied");
    assert.throws(() => materializeCommercialSuccessor({outputRoot}), /successor\.output-not-empty/);
  } finally {
    rmSync(outputRoot, {recursive: true, force: true});
  }
});
