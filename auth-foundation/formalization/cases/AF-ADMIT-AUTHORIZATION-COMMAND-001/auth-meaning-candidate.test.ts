import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { AUTH_MEANING_SOURCE_PATHS, buildAuthMeaningCandidate, currentAuthMeaningSources, validateAuthMeaningDraft, validateAuthMeaningTypedNodes } from "./auth-meaning-candidate.js";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const draftPath = AUTH_MEANING_SOURCE_PATHS.meaning;
const changed = (path: string, mutate: (value: any) => void) => {
  const sources = currentAuthMeaningSources();
  const value = JSON.parse(sources.get(path)!.toString("utf8"));
  mutate(value);
  sources.set(path, Buffer.from(`${JSON.stringify(value)}\n`));
  return sources;
};

test("draft conforms to DomainSpec v1 schema without acceptance", () => {
  const script = "import json,sys,jsonschema; schema=json.load(open(sys.argv[1])); draft=json.load(open(sys.argv[2])); jsonschema.Draft202012Validator.check_schema(schema); jsonschema.validate(draft,schema); print('valid')";
  const schema = fileURLToPath(new URL("../../../../craft/projects/domainspec-v2/formalization/schemas/business-meaning.schema.json", import.meta.url));
  const result = spawnSync("python3", ["-c", script, schema, `${root}/${draftPath}`], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /valid/);
  const draft = JSON.parse(readFileSync(`${root}/${draftPath}`, "utf8"));
  assert.equal(draft.status, "draft");
  assert.equal(draft.acceptance.status, "not-requested");
});

test("current Auth sources yield a non-admitted, non-satisfying exact-source trace", () => {
  const sources = currentAuthMeaningSources();
  const actual = buildAuthMeaningCandidate(sources);
  assert.equal(actual.domainspec_business_meaning_status, "draft-not-accepted");
  assert.equal(actual.semantic_equivalence, "contradicted-by-current-typed-source");
  assert.match(actual.known_counterexample, /nonqualifying/);
  assert.equal(actual.v2_meaning_emitted, false);
  assert.equal(actual.v4_formal_claim_emitted, false);
  assert.equal(actual.neutral_set_eligible, false);
  assert.equal(actual.can_satisfy_obligation, false);
  assert.equal(actual.authority_effect, "none");
  assert.equal(actual.selected_rule_ids.length, 3);
  assert.equal(actual.source_refs.context.sha256.length, 64);
  assert.deepEqual(buildAuthMeaningCandidate(sources), actual);
});

test("meaning subject, acceptance, downstream scope and examples cannot be silently changed", () => {
  const base = JSON.parse(currentAuthMeaningSources().get(draftPath)!.toString("utf8"));
  validateAuthMeaningDraft(base);
  for (const mutate of [
    (v: any) => { v.status = "accepted"; },
    (v: any) => { v.acceptance.status = "accepted"; },
    (v: any) => { v.rule = "The downstream authorization returns ALLOW."; },
    (v: any) => { v.examples.pop(); },
    (v: any) => { delete v.domain_context; },
    (v: any) => { delete v.examples[0].why; },
    (v: any) => { v.claim_ceiling = "F5 passed and runtime_guarantees_observed"; },
    (v: any) => { v.counterexamples[3].then = "READY is correct"; },
    (v: any) => { v.boundaries = []; },
    (v: any) => { v.meaning_id = "BusinessMeaning:auth-foundation.exact-session-role-permission"; },
  ]) {
    const candidate = structuredClone(base);
    mutate(candidate);
    assert.throws(() => validateAuthMeaningDraft(candidate), /AUTH_MEANING_CANDIDATE/);
    assert.throws(() => buildAuthMeaningCandidate(changed(draftPath, mutate)), /AUTH_MEANING_CANDIDATE/);
  }
});

test("typed structural checks reject mutants without relying on source-byte drift", () => {
  const sources = currentAuthMeaningSources();
  const keys = ["context", "decision", "auth", "route", "provenance", "aggregate", "operation"];
  const base: any = Object.fromEntries(keys.map(key => [key, JSON.parse(sources.get(AUTH_MEANING_SOURCE_PATHS[key]!)!.toString("utf8"))]));
  validateAuthMeaningTypedNodes(base);
  for (const mutate of [
    (v: any) => { v.aggregate.body.typed_contract.expression.terms.reverse(); },
    (v: any) => { v.operation.body.typed_contract.guard = "auth-command-boundary:other-rule"; },
    (v: any) => { v.operation.body.typed_contract.success_result.variant = "Deny"; },
    (v: any) => { v.context.body.typed_contract.properties[1].type.kind = "set"; },
    (v: any) => { v.decision.body.typed_contract.variants.reverse(); },
  ]) {
    const candidate = structuredClone(base);
    mutate(candidate);
    assert.throws(() => validateAuthMeaningTypedNodes(candidate), /AUTH_MEANING_CANDIDATE/);
  }
});

test("selected Auth source or typed rule and operation drift fails closed", () => {
  for (const [path, mutate] of [
    [AUTH_MEANING_SOURCE_PATHS.product_decision, (v: any) => { v.admitted_artifacts.definitions.sha256 = "0".repeat(64); }],
    [AUTH_MEANING_SOURCE_PATHS.aggregate, (v: any) => { v.body.typed_contract.expression.terms.reverse(); }],
    [AUTH_MEANING_SOURCE_PATHS.operation, (v: any) => { v.body.typed_contract.success_result.variant = "Deny"; }],
    [AUTH_MEANING_SOURCE_PATHS.context, (v: any) => { v.body.typed_contract.properties[1].type.kind = "set"; }],
  ] as const) assert.throws(() => buildAuthMeaningCandidate(changed(path, mutate)), /AUTH_MEANING_CANDIDATE|AUTH_V4_/);
  const sources = currentAuthMeaningSources();
  sources.delete(AUTH_MEANING_SOURCE_PATHS.operation);
  assert.throws(() => buildAuthMeaningCandidate(sources), /AUTH_MEANING_CANDIDATE/);
});
