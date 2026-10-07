#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

import {projectProductTestResult} from "../src/product-candidate.mjs";
import {runIsolatedProductTests} from "../src/product-isolation.mjs";
import {inspectProduct, materializeProductClosure, productRoot} from "../src/product.mjs";

const TARGET_VERSION = "0.10.0-rc.1";
const BASELINE_PATH = resolve(productRoot, "evidence/product-candidate.018.json");
const OUTPUT_PATH = resolve(productRoot, "evidence/release-preparation.rc1.json");

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function digest(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

const health = inspectProduct({require_exact_runtime: true});
if (health.status !== "PASS") throw new Error(`RELEASE_PREPARATION_HEALTH_BLOCKED:${health.reason_codes.join(",")}`);
if (health.product_version !== TARGET_VERSION) throw new Error(`RELEASE_PREPARATION_VERSION_INVALID:${health.product_version}`);

const closure = materializeProductClosure();
const testResult = runIsolatedProductTests({closure});
const testEvidence = projectProductTestResult(testResult);
if (testEvidence.status !== "PASS") throw new Error("RELEASE_PREPARATION_TESTS_BLOCKED");

const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
const material = {
  schema_version: "are.release-candidate-preparation/v1",
  preparation_id: "ARE-0.10.0-RC1-PREPARATION-001",
  verification_status: "PASS",
  release_status: "BLOCK",
  target_version: TARGET_VERSION,
  preparation_posture: "prepared-not-frozen",
  baseline: {
    candidate_id: baseline.candidate_id,
    candidate_digest: baseline.candidate_digest,
    source_closure_digest: baseline.source_closure.closure_digest,
    preservation: "immutable-historical-evidence",
  },
  current_source_closure: {
    closure_digest: closure.closure_digest,
    file_count: closure.files.length,
    total_bytes: closure.files.reduce((sum, file) => sum + file.bytes, 0),
  },
  product_health: {
    status: health.status,
    node: health.node,
    component_count: health.components.length,
    integration_count: health.integrations.length,
  },
  isolated_product_tests: testEvidence,
  candidate_freeze: {status: "NOT_RUN", candidate_id: null, candidate_digest: null},
  remaining_gates: [
    "select a new immutable successor candidate identity",
    "complete qualified source-rights and exact-license review",
    "verify the security contact workflow and tabletop",
    "materialize and retain the reproducible archive and lifecycle receipt",
    "select a trusted signing identity and authenticated delivery path",
    "perform separate freeze, approval, signing, tagging, publication, delivery, deployment, and support-activation effects",
  ],
  claim_limit: "PASS verifies the exact working RC1 preparation closure and isolated product suite. It does not freeze or approve a candidate, clear rights, sign, tag, publish, deliver, deploy, or activate support.",
  authority_effect: "none",
};
const receipt = stable({...material, preparation_digest: digest(material)});
writeFileSync(OUTPUT_PATH, stableJson(receipt));
process.stdout.write(stableJson({...receipt, receipt_path: OUTPUT_PATH}));
