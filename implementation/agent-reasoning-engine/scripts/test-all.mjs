import {resolve} from "node:path";
import {spawnSync} from "node:child_process";

import {inspectProduct, projectRoot} from "../src/product.mjs";
import {materializeProductTestPlan} from "../src/product-test-plan.mjs";

const health = inspectProduct({require_exact_runtime: true});
if (health.status !== "PASS") {
  process.stderr.write(`${JSON.stringify(health, null, 2)}\n`);
  process.exit(1);
}

const plan = materializeProductTestPlan();
if (plan.unowned_test_files.length > 0) {
  process.stdout.write(`${JSON.stringify({schema_version: "are.product-test-result/v1", status: "FAIL", reason_codes: ["product-tests.unowned-files"], unowned_test_files: plan.unowned_test_files, authority_effect: "none"}, null, 2)}\n`);
  process.exit(1);
}

function cargoTestCount(output) {
  return [...output.matchAll(/running (\d+) tests?/gu)].reduce((sum, match) => sum + Number(match[1]), 0);
}

function pythonTestCount(output) {
  return Number(output.match(/Ran (\d+) tests?/u)?.[1] ?? 0);
}

const results = [];
for (const suite of plan.runtime_suites) {
  const started = performance.now();
  const command = suite.runner === "cargo-test"
    ? resolve(projectRoot, "tools/toolchain/run")
    : suite.runner === "python-unittest" ? (process.env.PYTHON ?? "python3") : process.execPath;
  const args = suite.runner === "cargo-test"
    ? ["cargo", "test", "--offline", "--locked", "--manifest-path", suite.manifest]
    : suite.runner === "python-unittest" ? ["-m", "unittest", "discover", "-s", resolve(suite.path, "tests"), "-p", "test_*.py"]
    : ["--test", "--test-reporter=tap", ...suite.test_files];
  const run = spawnSync(command, args, {cwd: suite.path, encoding: "utf8", timeout: 600_000, maxBuffer: 64 * 1024 * 1024});
  const combined = `${run.stdout ?? ""}\n${run.stderr ?? ""}`;
  const testCases = suite.runner === "cargo-test" ? cargoTestCount(combined) : suite.runner === "python-unittest" ? pythonTestCount(combined) : Number(run.stdout?.match(/^# tests (\d+)$/m)?.[1] ?? 0);
  const status = run.status === 0 && !run.error && !run.signal ? "PASS" : "FAIL";
  results.push({target: suite.path, target_ref: suite.target_ref, target_id: suite.target_id, runner: suite.runner, test_files: suite.test_files.length, test_paths: suite.test_refs, test_cases: testCases, status, elapsed_ms: performance.now() - started});
  if (status !== "PASS") {
    process.stderr.write(run.stdout ?? "");
    process.stderr.write(run.stderr ?? "");
    process.stdout.write(`${JSON.stringify({schema_version: "are.product-test-result/v1", status: "FAIL", source_closure_digest: plan.source_closure_digest, test_plan_digest: plan.plan_digest, execution_mode: process.env.ARE_PRODUCT_TEST_EXECUTION_MODE ?? "workspace", results, authority_effect: "none"}, null, 2)}\n`);
    process.exit(1);
  }
}
process.stdout.write(`${JSON.stringify({schema_version: "are.product-test-result/v1", status: "PASS", product_id: health.product_id, product_version: health.product_version, source_closure_digest: plan.source_closure_digest, test_plan_digest: plan.plan_digest, execution_mode: process.env.ARE_PRODUCT_TEST_EXECUTION_MODE ?? "workspace", total_test_files: results.reduce((sum, result) => sum + result.test_files, 0), total_test_cases: results.reduce((sum, result) => sum + result.test_cases, 0), results, authority_effect: "none"}, null, 2)}\n`);
