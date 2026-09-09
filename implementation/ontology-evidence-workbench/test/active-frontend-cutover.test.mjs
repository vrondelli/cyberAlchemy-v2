import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const receipt = JSON.parse(await readFile(new URL("../generated/runs/WP-SOEW-001/active-frontend-cutover.json", import.meta.url), "utf8"));
test("standalone frontend is the only active web path", () => { assert.equal(receipt.schema_version, "oew.active-frontend-cutover.v1"); assert.equal(receipt.result, "pass"); assert.equal(receipt.active_scan.findings.length, 0); assert.equal(receipt.migration.reconciled, 51); assert.equal(receipt.migration.denominator, 51); assert.equal(receipt.historical_evidence.unchanged, true); assert.equal(receipt.normal_frontend_requires_upstream_workspace, false); assert.equal(receipt.authority_effect, "none"); });
