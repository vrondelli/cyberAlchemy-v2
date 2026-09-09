import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import test from "node:test";
import {selectTestFixture} from "../runtime/test-fixture.mjs";
const fixture = fileURLToPath(new URL("./fixtures/mock-app-server.mjs", import.meta.url));
const sha = createHash("sha256").update(readFileSync(fixture)).digest("hex");
test("fixture mode is explicit and bound to actual checked-in bytes", () => {
  assert.equal(selectTestFixture(undefined, fixture, sha), null);
  assert.equal(selectTestFixture("workspace-mock-v1", fixture, sha).observation_id, "workspace-mock-v1");
  assert.throws(() => selectTestFixture("unknown", fixture, sha), /UNKNOWN/);
  assert.throws(() => selectTestFixture("workspace-mock-v1", fixture, "0".repeat(64)), /IDENTITY_MISMATCH/);
  assert.throws(() => selectTestFixture("workspace-mock-v1", fileURLToPath(import.meta.url), sha), /IDENTITY_MISMATCH/);
});
test("strict production mode still rejects the mock", () => {
  const env = {...process.env};
  delete env.ARE_CODEX_TEST_FIXTURE;
  const run = spawnSync(process.execPath, [fileURLToPath(new URL("../runtime/proxy.mjs", import.meta.url)), "--upstream", fixture], {env, encoding: "utf8", timeout: 5000});
  assert.equal(run.status, 1);
  assert.match(run.stderr, /ARE_CODEX_PROTOCOL_DRIFT/);
});
