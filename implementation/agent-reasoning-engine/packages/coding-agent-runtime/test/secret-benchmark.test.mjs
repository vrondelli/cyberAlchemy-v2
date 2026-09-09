import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";

test("secret benchmark emits redacted machine-readable adapter evidence", () => {
  const completed = spawnSync(process.execPath, [
    fileURLToPath(new URL("../scripts/benchmark-secrets.mjs", import.meta.url)),
    "--iterations", "500",
    "--warmup", "50",
    "--skip-local"
  ], {encoding: "utf8"});
  assert.equal(completed.status, 0, completed.stderr);
  assert.equal(completed.stdout.includes("synthetic-benchmark-material-never-log"), false);
  assert.equal(completed.stdout.includes("ARE_SYNTHETIC_BENCHMARK_SECRET"), false);
  const result = JSON.parse(completed.stdout);
  assert.equal(result.schema_version, "are.secret-retrieval-benchmark/v1");
  assert.equal(result.status, "PASS");
  assert.equal(result.live_vault_accessed, false);
  assert.equal(result.authority_effect, "none");
  assert.equal(result.adapters.length, 2);
  for (const adapter of result.adapters) {
    assert.equal(adapter.iterations, 500);
    assert.equal(typeof adapter.p50_us, "number");
    assert.equal(typeof adapter.p95_us, "number");
    assert.equal(typeof adapter.p99_us, "number");
    assert.equal(adapter.budget.enforced, false);
  }
  assert.equal(result.local_store.status, "SKIPPED");
  assert.equal(result.cloud_network.status, "NOT_EVALUATED");
});

test("secret benchmark blocks when an enforced latency budget is exceeded", () => {
  const completed = spawnSync(process.execPath, [
    fileURLToPath(new URL("../scripts/benchmark-secrets.mjs", import.meta.url)),
    "--iterations", "100",
    "--warmup", "10",
    "--adapter-budget-p95-us", "0.000001",
    "--enforce",
    "--skip-local"
  ], {encoding: "utf8"});
  assert.equal(completed.status, 1, completed.stderr);
  const result = JSON.parse(completed.stdout);
  assert.equal(result.status, "BLOCK");
  assert.equal(result.adapters.every((adapter) => adapter.budget.status === "FAIL"), true);
  assert.equal(result.authority_effect, "none");
});
