import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";
import {fileURLToPath} from "node:url";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const matrix = JSON.parse(readFileSync(resolve(packageRoot, "reconnect-chaos.matrix.json"), "utf8"));
const gatewayTests = [
  resolve(packageRoot, "../../packages/codex-app-server-wrapper/test/gateway.test.mjs"),
  resolve(packageRoot, "../../packages/codex-app-server-wrapper/test/gateway-session-store.test.mjs"),
];

test("reconnect chaos matrix executes every declared disconnect boundary", () => {
  assert.equal(matrix.schema_version, "are.reconnect-chaos-matrix/v1");
  assert.equal(matrix.scenarios.length, 10);
  assert.equal(new Set(matrix.scenarios.map((scenario) => scenario.scenario_id)).size, matrix.scenarios.length);
  const started = performance.now();
  const {NODE_TEST_CONTEXT: _testContext, ...childEnv} = process.env;
  const run = spawnSync(process.execPath, ["--test", ...gatewayTests], {encoding: "utf8", timeout: 30_000, env: childEnv});
  const elapsedMs = performance.now() - started;
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  for (const scenario of matrix.scenarios) {
    assert.match(run.stdout, new RegExp(`✔ ${scenario.test_name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), scenario.scenario_id);
  }
  assert.equal(elapsedMs < 30_000, true);
});
