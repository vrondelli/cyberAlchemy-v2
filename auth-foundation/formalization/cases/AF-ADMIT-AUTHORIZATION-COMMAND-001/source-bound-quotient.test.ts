import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canonicalSfolJson } from "../../../../craft/projects/domainspec-v2/impl/test-derivation-engine/src/sfol/cases/index.js";
import { AUTH_SFOL_V4_SOURCE_PATHS } from "./domainspec-v4-correspondence.js";
import { checkReviewedAuthRust, recognizeReviewedAuthRust, replayAuthSourceBoundQuotient,
  runAuthSourceBoundQuotient } from "./source-bound-quotient.js";

const auth = fileURLToPath(new URL("../../../", import.meta.url));
const rust = readFileSync(resolve(auth,
  "implementation/current-runtime-successor-v1/command-boundary/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs"));
const source = rust.toString("utf8");
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const sources = (): Map<string, Buffer> => new Map(Object.values(AUTH_SFOL_V4_SOURCE_PATHS)
  .map(path => [path, readFileSync(resolve(auth, path))]));
function change(before: string, after: string) {
  assert.equal(source.split(before).length, 2, `mutation anchor must be unique: ${before}`);
  return source.replace(before, after);
}

test("reviewed source has fixed independent byte and declaration identities", () => {
  assert.equal(rust.length, 12987);
  assert.equal(sha(source), "6501579fd22c0ba60d876331ab2208406996dd46bbf73913dc64778194e08d1a");
  assert.equal(Object.keys(checkReviewedAuthRust(rust)).length, 12);
  assert.throws(() => checkReviewedAuthRust(Buffer.from(`${source}\n// drift`)), /AUTH_QUOTIENT_SOURCE/);
  const extraCode = `${source}\npub fn unrelated_side_effect() { panic!("extra"); }\n`;
  assert.equal(Object.keys(recognizeReviewedAuthRust(extraCode)).length, 12);
  assert.throws(() => checkReviewedAuthRust(Buffer.from(extraCode)), /AUTH_QUOTIENT_SOURCE/);
});

test("test-only semantic recognizer rejects composition, branch and call mutants independent of whole-file gate", () => {
  const guard = source.slice(source.indexOf("pub fn command_boundary_admissible"),
    source.indexOf("pub fn admit_authorization_command"));
  const mutations = [
    source.replace(guard, guard.replace("__domainspec_rule_000 &&", "__domainspec_rule_000 ||")),
    source.replace(guard, guard.replace("unique_complete_route_binding(context)", "true")),
    source.replace(guard, guard.replace("candidate_command_provenance(context)", "unique_complete_route_binding(context)")),
    source.replace(guard, guard.replace("unique_trusted_authentication_evidence(context)", "candidate_command_provenance(context)")),
    change("CommandBoundaryDecision::Ready\n    } else {\n        CommandBoundaryDecision::Deny",
      "CommandBoundaryDecision::Deny\n    } else {\n        CommandBoundaryDecision::Ready"),
    change("if command_boundary_admissible(context) {",
      "if false { CommandBoundaryDecision::Deny } else if command_boundary_admissible(context) {"),
    source.replace(guard, guard.replace("candidate_command_provenance(context)", "unknown_side_effect(context)")),
    `${source}\n${guard}`,
    source.replace(guard, "// pub fn command_boundary_admissible(context: &CommandBoundaryContext) -> bool { true }\n"),
    source.replace(guard, 'const DECOY: &str = "pub fn command_boundary_admissible(context: &CommandBoundaryContext) -> bool { true }";\n'),
  ];
  for (const [index, mutant] of mutations.entries()) {
    assert.notEqual(mutant, source, `mutation ${index} must actually change source`);
    assert.throws(() => recognizeReviewedAuthRust(mutant),
      /AUTH_QUOTIENT_(DECLARATION|SYMBOL|LEX|SYNTAX)/, `mutation ${index}`);
  }
});

test("leaf, context and enum changes are rejected directly by declaration recognition", () => {
  for (const mutant of [
    source.replace("evidence.trusted == true", "evidence.trusted == false"),
    change("pub candidate_command: AuthorizationCommand,", "pub candidate_command: BoundaryRequest,"),
    change("    Ready,\n    Deny,", "    Deny,\n    Ready,"),
  ]) assert.throws(() => recognizeReviewedAuthRust(mutant), /AUTH_QUOTIENT_DECLARATION/);
});

test("current conditional certificate re-executes eight native witnesses without a v4/F5 claim", () => {
  const report = runAuthSourceBoundQuotient(sources());
  assert.equal(report.native_witness_observations.length, 8);
  assert.deepEqual(report.native_witness_observations.map(row => row.valuation).sort(),
    ["000", "001", "010", "011", "100", "101", "110", "111"]);
  assert.equal(report.current_successor_receipt.full_current_cli_receipt_validation, "match");
  assert.equal(report.historical_build_currentness, "drift-or-missing");
  assert.equal(report.neutral_set_eligible, false);
  assert.equal(report.can_satisfy_obligation, false);
  assert.equal(report.evf_pass_emitted, false);
  assert.equal(report.authority_effect, "none");
  assert.match(report.claim_ceiling, /no leaf-to-business-meaning preservation/);
});

test("selected correspondence changes and forged rehashed certificate fail closed on replay", () => {
  const selected = sources();
  const held = runAuthSourceBoundQuotient(selected);
  const forged = structuredClone(held) as typeof held;
  (forged.native_witness_observations[0] as { observed_decision: string }).observed_decision =
    held.native_witness_observations[0]!.observed_decision === "Ready" ? "Deny" : "Ready";
  const { report_sha256: _old, ...body } = forged;
  forged.report_sha256 = sha(canonicalSfolJson(body));
  assert.throws(() => replayAuthSourceBoundQuotient(forged, selected), /AUTH_QUOTIENT_REPLAY/);
  const changed = sources();
  changed.get(AUTH_SFOL_V4_SOURCE_PATHS.ontology)![0] ^= 1;
  assert.throws(() => runAuthSourceBoundQuotient(changed), /AUTH_V4_SOURCE_DRIFT|AUTH_V4_PIN_DRIFT/);
});
