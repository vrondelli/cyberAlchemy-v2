import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const script = fileURLToPath(new URL("./reclaim-pair-source-wsl-r1.mjs", import.meta.url));
const digest = "a".repeat(64);
const run = args => spawnSync(process.execPath, [script, ...args], {encoding: "utf8"});

test("apply refuses every prior G01 campaign before touching files or SSH", () => {
  for (const campaign of ["g01-product-replication-r6", "g01-product-replication-r7"]) {
    const result = run(["--apply", "root@187.77.163.194", campaign, "sample-pair", digest]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /apply-only-fresh-r8/);
  }
});

test("apply rejects path and host injection before touching files or SSH", () => {
  for (const args of [
    ["--apply", "root@187.77.163.194", "g01-product-replication-r8", "../r6", digest],
    ["--apply", "root@187.77.163.194;whoami", "g01-product-replication-r8", "sample-pair", digest],
    ["--apply", "root@187.77.163.194", "g01-product-replication-r8", "sample-pair", "not-a-digest"],
  ]) {
    const result = run(args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /g01-source-reclaim\.(slug|host|archive-sha)/);
  }
});
