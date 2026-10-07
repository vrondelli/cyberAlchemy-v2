import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const script = fileURLToPath(new URL("./run-g01-r8-serial-wsl-r1.mjs", import.meta.url));
const digest = "a".repeat(64);
const readyPath = "/opt/are/evolution-runtime/g01-r8-provider-readiness/probe_001/READY.json";
const run = args => spawnSync(process.execPath, [script, ...args], {encoding: "utf8"});

test("live dispatch refuses older campaigns before network access", () => {
  for (const campaign of ["g01-product-replication-r6", "g01-product-replication-r7"]) {
    const result = run(["--run", "root@187.77.163.194", campaign, digest, readyPath, digest]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /run-readiness-arguments/);
  }
});

test("live dispatch requires a readiness digest and rejects path injection", () => {
  const noReady = run(["--run", "root@187.77.163.194", "g01-product-replication-r8", digest]);
  assert.equal(noReady.status, 1);
  assert.match(noReady.stderr, /run-readiness-arguments/);
  const badHost = run(["--run", "root@187.77.163.194;whoami", "g01-product-replication-r8", digest, readyPath, digest]);
  assert.equal(badHost.status, 1);
  assert.match(badHost.stderr, /g01-serial.host/);
  const badPath = run(["--run", "root@187.77.163.194", "g01-product-replication-r8", digest,
    "/opt/are/evolution-runtime/g01-r8-provider-readiness/../READY.json", digest]);
  assert.equal(badPath.status, 1);
  assert.match(badPath.stderr, /run-readiness-arguments/);
});
