import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { canonicalSfolJson } from "../../../../craft/projects/domainspec-v2/impl/test-derivation-engine/src/sfol/cases/index.js";
import { AUTH_SFOL_V4_SOURCE_PATHS, assertAuthSfolV4CorrespondenceCurrent,
  buildAuthSfolV4Correspondence } from "./domainspec-v4-correspondence.js";

const authRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sources = (): Map<string, Buffer> => new Map(Object.values(AUTH_SFOL_V4_SOURCE_PATHS)
  .map(path => [path, readFileSync(resolve(authRoot, path))]));
const mutate = (selected: Map<string, Buffer>, path: string, change: (value: any) => void) => {
  const value = JSON.parse(selected.get(path)!.toString("utf8"));
  change(value);
  selected.set(path, Buffer.from(`${JSON.stringify(value)}\n`));
};

test("current non-synthetic Auth SFOL and eight TDE cases yield only a blocked v4 correspondence", () => {
  const actual = sources();
  const report = buildAuthSfolV4Correspondence(actual);
  assert.equal(report.auth_product_meaning_status, "admitted-exact-by-owner-decision");
  assert.equal(report.auth_sfol_status, "admitted-exact-by-separate-owner-decision");
  assert.equal(report.status, "blocked-for-v4-admission");
  assert.equal(report.neutral_set_eligible, false);
  assert.equal(report.v4_formal_claim_emitted, false);
  assert.equal(report.tde_payload_emitted, false);
  assert.equal(report.evf_pass_emitted, false);
  assert.equal(report.authority_effect, "none");
  assert.equal(report.tde_case_count, 8);
  assert.deepEqual(report.predicate.inputs, ["unique_trusted_authentication_evidence", "unique_complete_route_binding", "candidate_command_provenance"]);
  assert.deepEqual(report.valuations.map(row => row.valuation).sort(), ["000", "001", "010", "011", "100", "101", "110", "111"]);
  assert.equal(report.valuations.filter(row => row.expected_boolean).length, 1);
  assert.equal(report.candidate_correspondences.length, 3);
  assert.ok(report.candidate_correspondences.every(row => row.semantic_equivalence === "unverified"));
  assert.ok(report.losses.length >= 5);
  assert.equal(report.proof_context.source_manifest_selection, "missing");
  assert.equal(report.proof_context.build_currentness, "drift-or-missing");
  assert.notEqual(report.proof_context.current_build_sha256, report.proof_context.historical_build_sha256);
  assertAuthSfolV4CorrespondenceCurrent(actual, report);
  assert.deepEqual(buildAuthSfolV4Correspondence(actual), report);
});

test("changed product or SFOL admission pins and selected Auth sources fail closed", () => {
  for (const path of [AUTH_SFOL_V4_SOURCE_PATHS.product_decision, AUTH_SFOL_V4_SOURCE_PATHS.sfol_decision,
    AUTH_SFOL_V4_SOURCE_PATHS.definitions, AUTH_SFOL_V4_SOURCE_PATHS.capability,
    AUTH_SFOL_V4_SOURCE_PATHS.ontology, AUTH_SFOL_V4_SOURCE_PATHS.claim]) {
    const changed = sources();
    mutate(changed, path, value => { value.correspondence_mutation = true; });
    assert.throws(() => buildAuthSfolV4Correspondence(changed), /AUTH_V4_PIN_DRIFT|AUTH_V4_SOURCE_DRIFT/, path);
  }
});

test("altered AND AST, input sort and smt-sfol profile substitution fail closed", () => {
  for (const mutation of [
    (value: any) => { value.clauses[0].expression.operator = "or"; },
    (value: any) => { value.clauses[0].inputs[0].sort.name = "string"; },
    (value: any) => { value.language_version = "smt-sfol"; },
  ]) {
    const changed = sources();
    mutate(changed, AUTH_SFOL_V4_SOURCE_PATHS.module, mutation);
    assert.throws(() => buildAuthSfolV4Correspondence(changed), /AUTH_V4_PIN_DRIFT|AUTH_V4_SOURCE_DRIFT|AUTH_V4_CLAUSE|AUTH_V4_PROFILE/);
  }
  const claimProfile = sources();
  mutate(claimProfile, AUTH_SFOL_V4_SOURCE_PATHS.claim, value => { value.formalism.language_version = "smt-sfol"; });
  assert.throws(() => buildAuthSfolV4Correspondence(claimProfile), /AUTH_V4_PIN_DRIFT|AUTH_V4_SOURCE_DRIFT|AUTH_V4_PROFILE/);
  const manifestProfile = sources();
  mutate(manifestProfile, AUTH_SFOL_V4_SOURCE_PATHS.clause_manifest,
    value => { value.proof_context.profile_id = "smt-sfol"; value.proof_context.profile_version = "smt-sfol/v1"; });
  assert.throws(() => buildAuthSfolV4Correspondence(manifestProfile), /AUTH_V4_PIN_DRIFT|AUTH_V4_SOURCE_DRIFT|AUTH_V4_PROFILE/);
});

test("missing, duplicate and oracle-mutated TDE cases fail closed", () => {
  for (const mutation of [
    (value: any) => { value.cases.pop(); },
    (value: any) => { value.cases[1] = value.cases[0]; },
    (value: any) => { value.cases[0].expected_digest = "0".repeat(64); },
    (value: any) => { value.cases[0].case_digest = "0".repeat(64); },
  ]) {
    const changed = sources();
    mutate(changed, AUTH_SFOL_V4_SOURCE_PATHS.tde_cases, mutation);
    assert.throws(() => buildAuthSfolV4Correspondence(changed), /AUTH_V4_PIN_DRIFT|AUTH_V4_SOURCE_DRIFT|AUTH_V4_TDE_/);
  }
});

test("replay rejects a forged or stale report even when its digest is rewritten", () => {
  const actual = sources();
  const report: any = structuredClone(buildAuthSfolV4Correspondence(actual));
  report.neutral_set_eligible = true;
  const { report_sha256: _oldDigest, ...body } = report;
  report.report_sha256 = createHash("sha256").update(canonicalSfolJson(body)).digest("hex");
  assert.throws(() => assertAuthSfolV4CorrespondenceCurrent(actual, report), /AUTH_V4_REPORT_STALE/);
  const changed = sources();
  changed.get(AUTH_SFOL_V4_SOURCE_PATHS.ontology)![30] ^= 1;
  assert.throws(() => assertAuthSfolV4CorrespondenceCurrent(changed,
    buildAuthSfolV4Correspondence(actual)), /AUTH_V4_PIN_DRIFT|AUTH_V4_SOURCE_DRIFT/);
});
