import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canonicalSfolJson } from "../../../../craft/projects/domainspec-v2/impl/test-derivation-engine/src/sfol/cases/index.js";
import { AUTH_SFOL_V4_SOURCE_PATHS } from "./domainspec-v4-correspondence.js";
import { boundedProcess, parseNativeWitnessLine, replayAuthNativeWitness, runAuthNativeWitness } from "./native-witness.js";

const authRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sources = (): Map<string, Buffer> => new Map(Object.values(AUTH_SFOL_V4_SOURCE_PATHS)
  .map(path => [path, readFileSync(resolve(authRoot, path))]));
const sha = (value: string) => createHash("sha256").update(value).digest("hex");

test("eight actual generated-Rust witnesses independently realize every Boolean valuation", () => {
  const report = runAuthNativeWitness(sources());
  assert.equal(report.observations.length, 8);
  assert.deepEqual(report.observations.map(row => row.valuation).sort(),
    ["000", "001", "010", "011", "100", "101", "110", "111"]);
  for (const row of report.observations) {
    assert.equal(row.observed_flags, row.valuation);
    assert.equal(row.observed_decision, row.valuation === "111" ? "Ready" : "Deny");
    assert.equal(row.process_exit_code, 0);
  }
  assert.equal(report.current_successor_receipt.full_current_cli_receipt_validation, "match");
  assert.equal(report.historical_build_currentness, "drift-or-missing");
  assert.equal(report.neutral_set_eligible, false);
  assert.equal(report.can_satisfy_obligation, false);
  assert.equal(report.evf_pass_emitted, false);
  assert.equal(report.authority_effect, "none");
  assert.match(report.claim_ceiling, /no all-context preservation/);
  assert.deepEqual(replayAuthNativeWitness(report, sources()), report);
});

test("changed selected TDE case or source is rejected before native execution", () => {
  const changedCase = sources();
  const path = AUTH_SFOL_V4_SOURCE_PATHS.tde_cases;
  const caseSet = JSON.parse(changedCase.get(path)!.toString("utf8"));
  caseSet.cases[0].expected_digest = "0".repeat(64);
  changedCase.set(path, Buffer.from(JSON.stringify(caseSet)));
  assert.throws(() => runAuthNativeWitness(changedCase), /AUTH_V4_SOURCE_DRIFT|AUTH_V4_PIN_DRIFT/);
  const changedSource = sources();
  changedSource.get(AUTH_SFOL_V4_SOURCE_PATHS.ontology)![0] ^= 1;
  assert.throws(() => runAuthNativeWitness(changedSource), /AUTH_V4_SOURCE_DRIFT|AUTH_V4_PIN_DRIFT/);
});

test("strict native protocol rejects wrong and extra output", () => {
  assert.deepEqual(parseNativeWitnessLine("111\t111\tReady\n", "111"),
    { valuation: "111", observed_flags: "111", decision: "Ready" });
  for (const value of ["111\t111\tReady\nextra\n", "000\t000\tDeny\n", "111\t111\tPass\n", "111\t111\tReady"])
    assert.throws(() => parseNativeWitnessLine(value, "111"), /AUTH_NATIVE_OUTPUT/);
});

test("bounded process reports timeout, nonzero and excessive output", () => {
  const cwd = "/var/tmp";
  assert.throws(() => boundedProcess(process.execPath, ["-e", "process.exit(3)"], cwd, 1000, 4096), /AUTH_NATIVE_PROCESS.*status=3/);
  assert.throws(() => boundedProcess(process.execPath, ["-e", "setTimeout(()=>{}, 5000)"], cwd, 50, 4096), /AUTH_NATIVE_PROCESS/);
  assert.throws(() => boundedProcess(process.execPath, ["-e", "process.stdout.write('x'.repeat(10000))"], cwd, 1000, 128), /AUTH_NATIVE_PROCESS/);
});

test("replay re-executes and rejects a forged, rehashed report", () => {
  const selected = sources();
  const held = runAuthNativeWitness(selected);
  const forged = structuredClone(held) as typeof held;
  (forged.observations[0] as { observed_decision: string }).observed_decision =
    held.observations[0]!.observed_decision === "Ready" ? "Deny" : "Ready";
  const { report_sha256: _old, ...body } = forged;
  forged.report_sha256 = sha(canonicalSfolJson(body));
  assert.throws(() => replayAuthNativeWitness(forged, selected), /AUTH_NATIVE_REPLAY/);
});
