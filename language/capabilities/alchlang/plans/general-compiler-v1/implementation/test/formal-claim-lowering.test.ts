import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { lowerApplicationFormalClaims } from "../src/formal-claim-lowering.js";

const sha = (text: string | Buffer) => createHash("sha256").update(text).digest("hex");
const canonical = (value: any): string => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}` : JSON.stringify(value);
import { source, formalLoweringFixture } from "./fixtures/formal-lowering-fixture.js";

test("emits deterministic v4 sources with exact representation, semantic identity and source trace", () => {
  const f = formalLoweringFixture(); const result = lowerApplicationFormalClaims(source, f.input, f.sources);
  assert.deepEqual(result, lowerApplicationFormalClaims(source, structuredClone(f.input), f.sources));
  const claim = result.claims[0]!;
  assert.equal(claim.schema_version, "domainspec-v2.formal-claim-source/v4-candidate");
  assert.equal(claim.claim.claim_id, "FormalClaim:fixture");
  assert.equal(claim.canonical_proposition.representation_digest, sha(claim.canonical_proposition.representation));
  assert.equal(claim.canonical_proposition.semantic_identity_digest, sha(claim.canonical_proposition.semantic_identity));
  assert.equal(claim.tde_compatibility.status, "adapter-required");
  assert.equal(claim.interpretation_boundary.interpretation_model_is_part_of_claim, false);
  assert.equal(result.trace.declarations[0]!.target_sha256, sha(result.files["formalization/claims/EligibleClaim.json"]!));
});

test("whitespace and unrelated providers do not change claim identity; proposition and ceiling do", () => {
  const f = formalLoweringFixture();
  const identity = (text: string) => lowerApplicationFormalClaims(text, { ...f.input, source_sha256: sha(text) }, f.sources).claims[0]!.claim.identity_inputs_digest;
  const initial = identity(source);
  assert.equal(identity(source.replace("Eligible(o)", "Eligible( o )")), initial);
  f.put("unselected/runtime.json", { provider: "different-provider", bound: 100 });
  assert.equal(identity(source), initial);
  assert.notEqual(identity(source.replace("forall o", "exists o")), initial);
  assert.notEqual(identity(source.replace("Synthetic eligibility only.", "Another ceiling.")), initial);
});

test("missing stale and wrong-owner bindings reject before producing a result", () => {
  for (const mode of ["missing", "stale", "owner", "acceptance", "algorithm", "coverage"]) {
    const f = formalLoweringFixture(); const b = f.input.formal_claims.EligibleClaim;
    if (mode === "missing") f.sources.delete(b.business_meaning_ref.path);
    if (mode === "stale") f.sources.set(b.business_meaning_ref.path, Buffer.from("{}"));
    if (mode === "owner") f.input.owner = "different";
    if (mode === "acceptance") b.business_acceptance_ref = f.put("fixture/other-decision.json", {});
    if (mode === "algorithm") b.identity_algorithm_ref = f.put("fixture/identity.json", "invented");
    if (mode === "coverage") Object.assign(f.input.formal_claims, { Unknown: structuredClone(b) });
    assert.throws(() => lowerApplicationFormalClaims(source, f.input, f.sources), /FORMAL_/);
  }
});

test("definition pointer, edge, closure and transitive dependency mutations reject", () => {
  for (const mode of ["pointer", "edge", "closure", "transitive", "accepted"]) {
    const f = formalLoweringFixture();
    if (mode === "pointer") f.graph.definition_nodes[0]!.definition_pointer = "#/definitions/1";
    if (mode === "edge") f.graph.relations[0]!.inference = "inferred";
    if (mode === "closure") f.graph.definition_closure.digest = "b".repeat(64);
    if (mode === "transitive" || mode === "accepted") {
      const definition = { ...f.definition, depends_on: mode === "transitive" ? ["MISSING-DEFINITION"] : [], status: mode === "accepted" ? "candidate" : "accepted" };
      f.graph.definition_authority_ref = f.put("fixture/definitions.json", { definitions: [definition] });
      f.graph.definition_nodes[0]!.definition_digest = sha(canonical(definition));
      f.graph.definition_closure.digest = sha(canonical([definition]));
    }
    f.input.formal_claims.EligibleClaim.definition_binding_ref = f.put("fixture/definition-binding.json", f.graph);
    assert.throws(() => lowerApplicationFormalClaims(source, f.input, f.sources), /FORMAL_DEFINITION_/);
  }
});

test("source digest, exact reference shape and paths cannot be bypassed", () => {
  const f = formalLoweringFixture();
  assert.throws(() => lowerApplicationFormalClaims(source + "\n", f.input, f.sources), /FORMAL_SOURCE_BINDING/);
  const changed = structuredClone(f.input); changed.formal_claims.EligibleClaim.business_meaning_ref.path = "../meaning.json";
  assert.throws(() => lowerApplicationFormalClaims(source, changed, f.sources), /FORMAL_BINDING_PATH/);
  Object.assign(f.input.formal_claims.EligibleClaim, { provider: "smt" });
  assert.throws(() => lowerApplicationFormalClaims(source, f.input, f.sources), /FORMAL_BINDING_SCHEMA/);
});

test("emitted claims and synthetic inputs conform to DomainSpec's authoritative JSON schemas", () => {
  const f = formalLoweringFixture(); const claims = lowerApplicationFormalClaims(source, f.input, f.sources).claims;
  const schemaRoot = fileURLToPath(new URL("../../../../../../../../domainspec-core/projects/domainspec-v2/formalization/schemas/", import.meta.url));
  const payload = { claims, business: JSON.parse(f.sources.get("fixture/meaning.json")!.toString()), definitions: f.graph };
  const result = spawnSync("python3", ["-c", "import json,sys,pathlib,jsonschema; p=json.load(sys.stdin); root=pathlib.Path(sys.argv[1]); pairs=[(c,'formal-claim-source-v4-candidate.schema.json') for c in p['claims']]+[(p['business'],'business-meaning.schema.json'),(p['definitions'],'formal-claim-definition-binding.schema.json')]; [(jsonschema.Draft202012Validator(json.loads((root/s).read_text())).validate(v)) for v,s in pairs]", schemaRoot], { input: JSON.stringify(payload), encoding: "utf8", timeout: 10000 });
  assert.equal(result.status, 0, result.stderr || String(result.error));
});

test("a familiar profile identifier cannot conceal changed profile semantics", () => {
  const f = formalLoweringFixture();
  const registry = JSON.parse(f.sources.get("fixture/profile.json")!.toString());
  registry.profiles.find((p: any) => p.profile_id === "fol-core").supported_constructs = ["arbitrary code"];
  f.input.formal_claims.EligibleClaim.formal_language_profile_ref = f.put("fixture/profile.json", registry);
  assert.throws(() => lowerApplicationFormalClaims(source, f.input, f.sources), /FORMAL_LANGUAGE_PROFILE/);
});
