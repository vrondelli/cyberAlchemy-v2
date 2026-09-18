import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";

import {materializeStandaloneDistribution} from "../src/distribution.mjs";

test("standalone distribution runs without Alch or DomainSpec trees", () => {
  const temporary = mkdtempSync(resolve(tmpdir(), "are-standalone-"));
  const output = resolve(temporary, "distribution");
  try {
    const receipt = materializeStandaloneDistribution(output);
    assert.equal(receipt.forbidden_dependencies.length, 0);
    assert.equal(receipt.file_count > 100, true);
    const productRoot = resolve(output, "cyberAlchemy-v2/implementation/agent-reasoning-engine");
    const doctor = spawnSync(process.execPath, [resolve(productRoot, "bin/are.mjs"), "doctor", "--json"], {
      cwd: productRoot,
      encoding: "utf8",
      timeout: 30_000,
    });
    assert.equal(doctor.status, 0, `${doctor.stdout}\n${doctor.stderr}`);
    assert.equal(JSON.parse(doctor.stdout).status, "PASS");
    assert.throws(() => readFileSync(resolve(output, "domainspec-core/README.md")), /ENOENT/u);
    assert.throws(() => readFileSync(resolve(output, "cyberAlchemy-v2/language/capabilities/alchlang/README.md")), /ENOENT/u);
  } finally {
    rmSync(temporary, {recursive: true, force: true});
  }
});
