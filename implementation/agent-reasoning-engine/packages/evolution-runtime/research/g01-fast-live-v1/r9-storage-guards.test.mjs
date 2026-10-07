import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {test} from "node:test";
import {join} from "node:path";

const here = import.meta.dirname;
const invoke = (script, ...args) => spawnSync(process.execPath, [join(here, script), ...args],
  {encoding: "utf8", timeout: 5000});

test("r9 coordinator rejects other campaigns before SSH or provider calls", () => {
  const result = invoke("run-g01-r9-serial-wsl-r1.mjs", "--run", "root@187.77.163.194",
    "g01-product-replication-r8", "a".repeat(64),
    "/opt/are/evolution-runtime/g01-post-r8-provider-readiness/fixture/READY.json", "b".repeat(64));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /g01-r9-serial\.scope/);
});

test("r9 archive/reclaim rejects other campaigns before SSH or deletion", () => {
  const result = invoke("archive-reclaim-r9-pair-wsl-r1.mjs", "--apply", "root@187.77.163.194",
    "g01-product-replication-r8", "task-a");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /g01-r9-source-archive\.scope/);
});
