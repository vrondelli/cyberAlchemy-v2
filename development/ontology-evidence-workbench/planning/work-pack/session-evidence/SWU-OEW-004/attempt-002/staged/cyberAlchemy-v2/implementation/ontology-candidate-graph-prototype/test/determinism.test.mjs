import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { evaluatePokerTeamO13 } from "../src/cli.mjs";
import { writeRunBundle } from "../src/evidence/run-writer.mjs";
import { verifyTerminalReceipt } from "../scripts/verify-terminal-receipt.mjs";

const COMPARED_PATHS = ["digest-map.v1.json", "projection.v1.json", "result.v1.json"];
const ISOLATION = Object.freeze({
  schema_version: "candidate-isolation-attestation-v1",
  protected_set_digest_before: "5".repeat(64),
  protected_set_digest_after: "5".repeat(64),
  protected_file_count: 74978,
  write_probe: "denied",
  claim: "input-isolation-only",
  host_security_claim: "none",
  authority_effect: "none",
});

async function readBodies(run) {
  return Object.fromEntries(
    await Promise.all(
      COMPARED_PATHS.map(async (path) => [path, await readFile(join(run, path), "utf8")]),
    ),
  );
}

test("two fresh public-entrypoint runs have byte-identical canonical bodies", async (t) => {
  const parent = await mkdtemp(join(tmpdir(), "ocgp-determinism-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const first = join(parent, "first");
  const second = join(parent, "second");
  await evaluatePokerTeamO13({
    outDir: first,
    isolationAttestation: ISOLATION,
    runMetadata: { run_id: "first", wall_clock: "one" },
    receiptContext: { task_id: "T", swu_id: "S-1" },
  });
  await evaluatePokerTeamO13({
    outDir: second,
    isolationAttestation: ISOLATION,
    runMetadata: { run_id: "second", wall_clock: "two" },
    receiptContext: { task_id: "T", swu_id: "S-2" },
  });
  assert.equal((await verifyTerminalReceipt(join(first, "terminal-receipt.json"))).verified, true);
  assert.equal((await verifyTerminalReceipt(join(second, "terminal-receipt.json"))).verified, true);
  const firstBodies = await readBodies(first);
  const secondBodies = await readBodies(second);
  const differingPaths = COMPARED_PATHS.filter((path) => firstBodies[path] !== secondBodies[path]);
  assert.deepEqual({
    equal: differingPaths.length === 0,
    compared_paths: COMPARED_PATHS,
    differing_paths: differingPaths,
  }, {
    equal: true,
    compared_paths: COMPARED_PATHS,
    differing_paths: [],
  });
});

test("one controlled input digest change alters the bound digest-map body", async (t) => {
  const parent = await mkdtemp(join(tmpdir(), "ocgp-input-change-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const baseline = join(parent, "baseline");
  const changed = join(parent, "changed");
  await evaluatePokerTeamO13({
    outDir: baseline,
    isolationAttestation: ISOLATION,
    receiptContext: { task_id: "T", swu_id: "BASE" },
  });
  const result = JSON.parse(await readFile(join(baseline, "result.v1.json"), "utf8"));
  const projection = JSON.parse(await readFile(join(baseline, "projection.v1.json"), "utf8"));
  const digestMap = JSON.parse(await readFile(join(baseline, "digest-map.v1.json"), "utf8"));
  const changedInputs = {
    ...digestMap.input_digests,
    "fixtures/cases/poker-team-o13.v1.json": "b".repeat(64),
  };
  await writeRunBundle({
    outDir: changed,
    result: result.evaluation,
    projection: projection.projection,
    isolationAttestation: result.isolation_attestation,
    inputDigests: changedInputs,
    evaluatorDigests: digestMap.evaluator_digests,
    receiptContext: { task_id: "T", swu_id: "CHANGED" },
  });
  assert.equal((await verifyTerminalReceipt(join(changed, "terminal-receipt.json"))).verified, true);
  const baselineBodies = await readBodies(baseline);
  const changedBodies = await readBodies(changed);
  assert.equal(baselineBodies["result.v1.json"], changedBodies["result.v1.json"]);
  assert.equal(baselineBodies["projection.v1.json"], changedBodies["projection.v1.json"]);
  assert.notEqual(baselineBodies["digest-map.v1.json"], changedBodies["digest-map.v1.json"]);
});
