import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {resolve} from "node:path";
import test from "node:test";

import {previewCandidateModulePort} from "./index.mjs";

const root = resolve(import.meta.dirname, "../../../..");
const rustPackage = resolve(import.meta.dirname, "../module-port-governance-binding-rust");
const toolchain = resolve(root, "tools/toolchain/run");

function verifierReceipt() {
  const run = spawnSync(toolchain, ["cargo", "run", "--offline", "--quiet", "--bin", "are-module-port-v2-candidate", "--", "--repository-root", root],
    {cwd: rustPackage, encoding: "utf8", timeout: 120_000});
  assert.equal(run.status, 0, run.stderr || run.stdout);
  return JSON.parse(run.stdout);
}

test("exact Rust candidate receipt composes the Alch adapter without activating it", async () => {
  const preview = await previewCandidateModulePort({repository_root: root, verifier_receipt: verifierReceipt()});
  assert.equal(preview.ok, true, JSON.stringify(preview.reason_codes));
  assert.equal(preview.disposition, "available-candidate");
  assert.equal(preview.runtime_admitted, false);
  assert.equal(preview.activation_selected, false);
  assert.equal(preview.cutover_completed, false);
  const result = preview.port.invoke({schema_version: "are.module-invocation/v1", invocation_id: "preview.semantic-key",
    consumer_id: "request-intent-runtime", capability_id: "text.semantic-key/v1", input: {text: "Build—a—new system"},
    dependency_posture: "required-for-judgment", authority_effect: "none"});
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {key: "build a new system"});
});

test("unverified or admission-smuggling receipts cannot reach preview composition", async () => {
  const verified = verifierReceipt();
  for (const receipt of [undefined, {...verified, disposition: "BLOCK"}, {...verified, runtime_admission_verified: true}, {...verified, effect_authorized: true}]) {
    const preview = await previewCandidateModulePort({repository_root: root, verifier_receipt: receipt});
    assert.equal(preview.ok, false);
    assert.deepEqual(preview.reason_codes, ["preview.verifier-receipt-invalid"]);
  }
});
