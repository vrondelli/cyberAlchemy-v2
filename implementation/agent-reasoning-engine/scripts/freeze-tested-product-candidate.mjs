import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, writeFileSync} from "node:fs";

import {runFailureLearningCanary} from "../benchmarks/real-reasoning-v1/src/evolution-canary.mjs";
import {
  FAILURE_LEARNING_CANARY_PATH,
  PRODUCT_CANDIDATE_PATH,
  PRODUCT_TEST_RECEIPT_PATH,
  inspectFrozenProductCandidate,
  materializeFailureLearningCanaryEvidence,
  materializeProductCandidate,
  materializeProductTestReceipt,
  projectProductTestResult,
} from "../src/product-candidate.mjs";
import {canonicalJson} from "../packages/intent-route-resolver/index.mjs";
import {productRoot} from "../src/product.mjs";

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeImmutable(path, bytes, identity) {
  if (existsSync(path)) {
    const current = readFileSync(path, "utf8");
    if (current !== bytes) throw new Error(`${identity}_ALREADY_BOUND:${path}`);
    return "reused-identical";
  }
  writeFileSync(path, bytes, {encoding: "utf8", flag: "wx"});
  return "created";
}

const candidate = materializeProductCandidate();
const testRun = spawnSync(process.execPath, [new URL("../bin/are.mjs", import.meta.url).pathname, "test"], {
  cwd: productRoot,
  encoding: "utf8",
  timeout: 600_000,
  maxBuffer: 64 * 1024 * 1024,
});
if (testRun.status !== 0) {
  process.stderr.write(testRun.stdout ?? "");
  process.stderr.write(testRun.stderr ?? "");
  throw new Error(`PRODUCT_TESTS_FAILED:${testRun.status ?? "signal"}`);
}
const testResult = JSON.parse(testRun.stdout);
const testEvidence = projectProductTestResult(testResult);

const canaryResult = await runFailureLearningCanary();
const canaryEvidence = materializeFailureLearningCanaryEvidence(canaryResult);
const candidateReplay = materializeProductCandidate();
if (canonicalJson(candidateReplay) !== canonicalJson(candidate)) throw new Error("PRODUCT_SOURCE_CHANGED_DURING_FREEZE");

const candidateBytes = pretty(candidate);
const canaryBytes = pretty(canaryEvidence);
const receipt = materializeProductTestReceipt({
  candidate,
  candidate_bytes: Buffer.from(candidateBytes),
  test_evidence: testEvidence,
  canary_evidence: canaryEvidence,
  canary_evidence_bytes: Buffer.from(canaryBytes),
});
if (receipt.status !== "PASS") throw new Error(`PRODUCT_TEST_RECEIPT_BLOCKED:${receipt.reason_codes.join(",")}`);
const receiptBytes = pretty(receipt);

const writes = {
  candidate: writeImmutable(PRODUCT_CANDIDATE_PATH, candidateBytes, "PRODUCT_CANDIDATE_005"),
  canary: writeImmutable(FAILURE_LEARNING_CANARY_PATH, canaryBytes, "FAILURE_LEARNING_CANARY_005"),
  receipt: writeImmutable(PRODUCT_TEST_RECEIPT_PATH, receiptBytes, "PRODUCT_TEST_RECEIPT_005"),
};
const inspection = inspectFrozenProductCandidate();
if (inspection.status !== "PASS") throw new Error(`PRODUCT_CANDIDATE_INSPECTION_BLOCKED:${inspection.reason_codes.join(",")}`);
process.stdout.write(`${JSON.stringify({...inspection, writes}, null, 2)}\n`);
