import test from "node:test";
import assert from "node:assert/strict";
import {compileRequestIntent} from "../index.mjs";

test("rhetorical sequencing remains an invisible construction instruction", async () => {
  const result = await compileRequestIntent({request_ref: "kep:implicit", request: "For the homepage copywriting, start with a definition, then an example, then a deeper look."});
  assert.equal(result.ok, true);
  assert.equal(result.value.path, "deterministic-fast-path");
  assert.equal(result.value.provider_calls, 0);
  assert.equal(result.value.contract.construction_directives[0].posture, "structural");
  assert.equal(result.value.contract.construction_directives[0].render_verbatim, false);
  assert.deepEqual(result.value.contract.surface_prohibitions, ["Deeper look", "Definition", "Example"]);
});

test("explicit visible-label request remains literal", async () => {
  const result = await compileRequestIntent({request_ref: "kep:explicit", request: "Create visible sections labelled Definition, Example, and Deeper Look."});
  assert.equal(result.ok, true);
  assert.equal(result.value.contract.construction_directives[0].posture, "surface");
  assert.equal(result.value.contract.construction_directives[0].render_verbatim, true);
  assert.deepEqual(result.value.contract.surface_prohibitions, []);
});

test("placement correction binds narrative and button separately", async () => {
  const result = await compileRequestIntent({request_ref: "kep:placement", request: "Not in the button, in the text; make Knowledge Expansion Protocol clickable and part of the narrative."});
  assert.equal(result.ok, true);
  assert.equal(result.value.contract.referent_bindings["the button"], "primary exchange action");
  assert.equal(result.value.contract.referent_bindings["the text"], "homepage narrative");
  assert.match(result.value.contract.surface_requirements[0], /inline narrative link/);
});

test("structured providers remain bounded by contract verification", async () => {
  let calls = 0;
  const provider = async () => {
    calls += 1;
    return {objective: "Resolve a consequential target", target: "repository change", construction_directives: [], surface_requirements: [], surface_prohibitions: [], referent_bindings: {}, assumptions: [], unresolved_questions: ["Which repository?"], risk_projections: ["wrong-target"], disposition: "ask", route_candidate: "implement", confidence: 0.91, source_refs: []};
  };
  const result = await compileRequestIntent({request_ref: "provider:1", request: "Change it."}, provider);
  assert.equal(result.ok, true);
  assert.equal(calls, 1);
  assert.equal(result.value.contract.disposition, "ask");
  const invalid = await compileRequestIntent({request_ref: "provider:2", request: "Change it."}, async () => ({objective: "missing fields"}));
  assert.equal(invalid.ok, false);
});

test("source permutation does not change contract identity", async () => {
  const input = {request_ref: "permutation", request: "Explain the architecture", source_refs: ["source:b", "source:a"]};
  const left = await compileRequestIntent(input);
  const right = await compileRequestIntent({...input, source_refs: ["source:a", "source:b"]});
  assert.equal(left.value.contract.intent_contract_digest, right.value.contract.intent_contract_digest);
});
