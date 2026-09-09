#!/usr/bin/env node
import {createHash} from "node:crypto";
import {readFileSync, readdirSync} from "node:fs";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

import {runProductCanary} from "./product-canary.mjs";
import {runProviderAgentMatrix} from "./provider-agent-matrix.mjs";

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function stable(value) { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function testFiles(directory) { return readdirSync(directory).filter((name) => name.endsWith(".test.mjs")).sort().map((name) => resolve(directory, name)); }
function runTests(directory) {
  const run = spawnSync(process.execPath, ["--test", ...testFiles(directory)], {encoding: "utf8", timeout: 120_000, env: {LANG: "C", LC_ALL: "C"}});
  const match = /ℹ pass (\d+)/u.exec(run.stdout ?? "");
  return {status: run.status === 0 ? "PASS" : "BLOCK", observed_exit: run.status, passed: match ? Number(match[1]) : null, stdout_sha256: sha256(run.stdout ?? ""), stderr_sha256: sha256(run.stderr ?? "")};
}

export async function runProductTestSuite() {
  const runtimeRoot = resolve(import.meta.dirname, "..");
  const tuiRoot = resolve(runtimeRoot, "../../../cyberalchemy-tui");
  const candidatePath = resolve(tuiRoot, "PRODUCT-CANDIDATE.json");
  const candidateBytes = readFileSync(candidatePath);
  const runtime = runTests(resolve(runtimeRoot, "test"));
  const tui = runTests(resolve(tuiRoot, "test"));
  const productCanary = await runProductCanary();
  const providers = await runProviderAgentMatrix();
  const status = runtime.status === "PASS" && tui.status === "PASS" && productCanary.status === "PASS_BOUNDED" && providers.status === "PASS_BOUNDED" ? "PASS_BOUNDED" : "BLOCK";
  const material = {schema_version: "cav2.coding-agent-product-test-receipt/v1", status, reason_codes: status === "PASS_BOUNDED" ? [] : ["product-test-suite.failed"], candidate_manifest_sha256: sha256(candidateBytes), candidate_source_set_digest: JSON.parse(candidateBytes).source_set_digest, checks: {runtime_tests: runtime, tui_tests: tui, product_canary: {status: productCanary.status, candidate_digest: productCanary.candidate_digest, external_repository_effects: productCanary.external_repository_effects}, provider_matrix: {status: providers.status, checks: providers.checks.map(({transport_id, status: providerStatus, repository_unchanged}) => ({transport_id, status: providerStatus, repository_unchanged}))}}, product_approval: "not-requested", authority_effect: "none", claim_limit: "Current tests for one exact candidate only; no product approval or operational authority."};
  return Object.freeze({...material, result_digest: sha256(stable(material))});
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runProductTestSuite();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.status === "PASS_BOUNDED" ? 0 : 1;
}
