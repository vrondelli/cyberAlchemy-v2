import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import test from "node:test";

import {computeDecisionProfileDigest, evaluateContinuation, loadVerifiedDecisionProfile, routeRequest as routeRequestWithoutDefaults} from "../index.mjs";
import {routingSignalJudgment} from "../src/router.mjs";
import {semanticModulePort} from "./semantic-module-fixture.mjs";
import {createModulePort, sealModuleManifest} from "../../module-port/index.mjs";
import {createNativeSemanticAdapter} from "../../module-port/native-semantic-adapter.mjs";
import {createRouteAvailabilityAdapter, routeAvailabilityOutputValidators} from "../../module-port/route-availability.mjs";
import {
  CONTAINS_PHRASE_CAPABILITY,
  CONTAINS_PHRASE_INPUT_PROTOCOL,
  CONTAINS_PHRASE_OUTPUT_PROTOCOL,
  SEMANTIC_KEY_CAPABILITY,
  SEMANTIC_KEY_INPUT_PROTOCOL,
  SEMANTIC_KEY_OUTPUT_PROTOCOL,
  semanticTextOutputValidators,
} from "../../module-port/semantic-text.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const loaded = loadVerifiedDecisionProfile(resolve(packageRoot, "profiles/cyberalchemy-v1.json"), repositoryRoot);
assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
const profile = loaded.value;
const modulePort = semanticModulePort();
const routeRequest = (input, decisionProfile, port = modulePort) => routeRequestWithoutDefaults(input, decisionProfile, port);
const routingSignalMatches = (text, signal) => routingSignalJudgment(text, signal, modulePort).matched;

function context(raw_request, objective_kind = null) {
  return {schema_version: "are.request-context/v1", request_id: "R-1", raw_request, objective_kind, requested_effects: [], target_refs: [], constraints: [], evidence_refs: ["user"]};
}

function boundProfile(routeId = "CA2-ROUTE-DEFINE", capabilityId = "route.available/define/v1") {
  const candidate = JSON.parse(readFileSync(resolve(packageRoot, "profiles/cyberalchemy-v1.json"), "utf8"));
  candidate.route_policies.find((policy) => policy.route_id === routeId).availability_capability_id = capabilityId;
  candidate.profile_digest = computeDecisionProfileDigest(candidate);
  const directory = mkdtempSync(resolve(tmpdir(), "are-route-profile-"));
  const path = resolve(directory, "profile.json");
  writeFileSync(path, `${JSON.stringify(candidate, null, 2)}\n`);
  const result = loadVerifiedDecisionProfile(path, repositoryRoot);
  rmSync(directory, {recursive: true});
  assert.equal(result.ok, true, result.reason_codes?.join(","));
  return result.value;
}

function portWithAvailability({available = true, reason_codes = [], adapter = null} = {}) {
  const availabilityAdapter = adapter ?? createRouteAvailabilityAdapter({
    module_id: "define-route-availability",
    version: "1-candidate",
    routes: [{route_id: "CA2-ROUTE-DEFINE", capability_id: "route.available/define/v1", available, reason_codes}],
  });
  return createModulePort({
    adapters: [createNativeSemanticAdapter(), availabilityAdapter],
    output_validators: {...semanticTextOutputValidators, ...routeAvailabilityOutputValidators},
  });
}

test("Define routes directly without Goal", () => {
  const result = routeRequest(context("Please clarify intent and define this concept."), profile);
  assert.equal(result.kind, "direct");
  assert.equal(result.selected.route_id, "CA2-ROUTE-DEFINE");
  assert.equal(result.candidates.includes("CA2-ROUTE-PLAN"), false);
});

test("compiled semantic contract normalizes routing separators without substring collapse", () => {
  assert.equal(routingSignalMatches("Please clarify—intent before planning.", "clarify intent"), true);
  assert.equal(routingSignalMatches("Use the predefined runtime.", "define"), false);
  const result = routeRequest(context("Please clarify—intent before planning."), profile);
  assert.equal(result.kind, "direct");
  assert.equal(result.selected.route_id, "CA2-ROUTE-DEFINE");
});

test("greenfield intent routes through Define language intake", () => {
  for (const request of [
    "I want to start something new for clinical research teams.",
    "Help me build a new knowledge product.",
    "We are shaping a new idea for incident response.",
  ]) {
    const result = routeRequest(context(request, "define-intake"), profile);
    assert.equal(result.kind, "direct");
    assert.equal(result.selected.route_id, "CA2-ROUTE-DEFINE");
    assert.equal(result.selected.owner_gate_ref, "CyberAlchemy v2 product owner");
  }
});

test("bounded implementation retains priority over incidental creation language", () => {
  const result = routeRequest(context("Create a new parser module in the existing bounded package.", "implement"), profile);
  assert.equal(result.kind, "direct");
  assert.equal(result.selected.route_id, "CA2-ROUTE-IMPLEMENT");
  assert.deepEqual(result.suppressed_lexical_candidates, ["CA2-ROUTE-DEFINE"]);
});

test("Goal participates only on goal-specific evidence and retains Goal profile provenance", () => {
  const result = routeRequest(context("Decompose goal into a work graph."), profile);
  assert.equal(result.kind, "direct");
  assert.equal(result.selected.route_id, "CA2-ROUTE-PLAN");
  assert.ok(result.selected.provenance_ids.includes("goal-profile"));
  assert.ok(result.provenance.some((item) => item.id === "goal-profile"));
});

test("implementation does not route through Goal", () => {
  const result = routeRequest(context("Implement the bounded repair."), profile);
  assert.equal(result.kind, "direct");
  assert.equal(result.selected.route_id, "CA2-ROUTE-IMPLEMENT");
});

test("overlap becomes a gate and no-match blocks", () => {
  const gate = routeRequest(context("Research and validate this evidence."), profile);
  assert.equal(gate.kind, "gate");
  assert.equal(gate.candidate_details.length, gate.candidates.length);
  assert.ok(gate.candidate_details.every((candidate) => Object.hasOwn(candidate, "owner_gate_ref")));
  assert.ok(gate.candidate_details.every((candidate) => candidate.provenance_ids.includes("route-registry")));
  assert.equal(routeRequest(context("Have a pleasant afternoon."), profile).kind, "block");
});

test("explicit objective kind is stronger than absent lexical signals", () => {
  const result = routeRequest(context("Handle this bounded request.", "validate"), profile);
  assert.equal(result.kind, "direct");
  assert.equal(result.selected.route_id, "CA2-ROUTE-VALIDATE");
});

test("explicit objective suppresses incidental lexical candidates", () => {
  const goalDefinition = routeRequest(context("What is a Goal?", "define"), profile);
  assert.equal(goalDefinition.kind, "direct");
  assert.equal(goalDefinition.selected.route_id, "CA2-ROUTE-DEFINE");
  assert.deepEqual(goalDefinition.suppressed_lexical_candidates, ["CA2-ROUTE-PLAN"]);
  assert.deepEqual(goalDefinition.reason_codes, ["selection.explicit-objective-priority"]);

  const researchDefinition = routeRequest(context("Define a research DAO rewards system.", "define"), profile);
  assert.equal(researchDefinition.kind, "direct");
  assert.equal(researchDefinition.selected.route_id, "CA2-ROUTE-DEFINE");
  assert.deepEqual(researchDefinition.suppressed_lexical_candidates, ["CA2-ROUTE-RESEARCH"]);
});

test("explicit objective does not suppress structured effect conflicts or exclusions", () => {
  const effectConflict = context("Explain this architecture.", "explain");
  effectConflict.requested_effects = ["publication"];
  const gated = routeRequest(effectConflict, profile);
  assert.equal(gated.kind, "gate");
  assert.deepEqual(gated.candidates, ["CA2-ROUTE-PUBLISH", "CA2-ROUTE-UNDERSTAND"]);

  const negatedAction = routeRequest(context("Explain only; do not implement.", "explain"), profile);
  assert.equal(negatedAction.kind, "direct");
  assert.equal(negatedAction.selected.route_id, "CA2-ROUTE-UNDERSTAND");
  assert.equal(negatedAction.evaluated_routes.find((route) => route.route_id === "CA2-ROUTE-IMPLEMENT").posture, "rejected");

  const explicitExclusion = routeRequest(context("Implement the repair read only.", "implement"), profile);
  assert.equal(explicitExclusion.kind, "block");
  assert.ok(explicitExclusion.evaluated_routes.find((route) => route.route_id === "CA2-ROUTE-IMPLEMENT").reason_codes.includes("route.explicit-exclusion"));
});

test("negated lexical actions never become positive route evidence", () => {
  const result = routeRequest(context("Do not implement this."), profile);
  assert.equal(result.kind, "block");
  assert.deepEqual(result.evaluated_routes.find((route) => route.route_id === "CA2-ROUTE-IMPLEMENT").matched_signals, []);
});

test("unverified profiles cannot route or classify continuation", () => {
  const unverified = JSON.parse(JSON.stringify(profile));
  assert.equal(routeRequest(context("Explain this."), unverified).kind, "block");
  assert.deepEqual(routeRequest(context("Explain this."), unverified).reason_codes, ["profile.unverified"]);
  const continuation = evaluateContinuation({completion: {completion_id: "C", status: "completed", continuation_required: true}, options: []}, unverified);
  assert.equal(continuation.kind, "block");
  assert.deepEqual(continuation.reason_codes, ["profile.unverified"]);
});

test("structured requested effects and constraints participate in routing", () => {
  const mixed = context("Explain architecture.");
  mixed.requested_effects = ["publication"];
  assert.equal(routeRequest(mixed, profile).kind, "gate");
  const constrained = context("Implement the repair.");
  constrained.constraints = ["read only"];
  assert.equal(routeRequest(constrained, profile).kind, "block");
});

test("canonical Definitions route is reachable and blocked Session remains visible", () => {
  assert.equal(routeRequest(context("Audit canonical term vocabulary."), profile).selected.route_id, "CA2-ROUTE-DEFINITIONS");
  assert.equal(routeRequest(context("Create a durable repository session."), profile).kind, "block");
});

test("semantic evidence identifies the injected module snapshot", () => {
  const result = routeRequest(context("Explain this architecture."), profile);
  assert.equal(result.semantic_evidence.disposition, "evaluated");
  assert.equal(result.semantic_evidence.module_set_digest, modulePort.module_set_digest);
  assert.deepEqual(result.semantic_evidence.capability_ids, [CONTAINS_PHRASE_CAPABILITY, SEMANTIC_KEY_CAPABILITY]);
  assert.ok(result.semantic_evidence.receipt_count > 0);
  assert.match(result.semantic_evidence.receipt_set_digest, /^[a-f0-9]{64}$/u);
  assert.ok(result.evaluated_routes.every((route) => route.lexical_evidence_disposition === "evaluated"));
});

test("missing semantic capability preserves exact structured routing but never supplies lexical evidence", () => {
  const structured = routeRequestWithoutDefaults(context("Handle this bounded request.", "validate"), profile);
  assert.equal(structured.kind, "direct");
  assert.equal(structured.selected.route_id, "CA2-ROUTE-VALIDATE");
  assert.equal(structured.semantic_evidence.disposition, "unavailable");
  assert.ok(structured.evaluated_routes.every((route) => route.matched_signals.length === 0));

  const lexicalOnly = routeRequestWithoutDefaults(context("Explain this architecture."), profile);
  assert.equal(lexicalOnly.kind, "gate");
  assert.equal(lexicalOnly.selected, null);
  assert.ok(lexicalOnly.reason_codes.includes("route.semantic-capability-unavailable"));
});

test("blocked semantic adapter blocks routing even when structured evidence exists", () => {
  const manifest = sealModuleManifest({
    schema_version: "are.module-manifest/v1",
    module_id: "blocked-semantic-fixture",
    version: "1-test",
    adapter_protocol: "are.module-adapter/v1",
    capabilities: [
      {capability_id: SEMANTIC_KEY_CAPABILITY, input_protocol: SEMANTIC_KEY_INPUT_PROTOCOL, output_protocol: SEMANTIC_KEY_OUTPUT_PROTOCOL},
      {capability_id: CONTAINS_PHRASE_CAPABILITY, input_protocol: CONTAINS_PHRASE_INPUT_PROTOCOL, output_protocol: CONTAINS_PHRASE_OUTPUT_PROTOCOL},
    ],
    required_permissions: [],
    side_effects: false,
    authority_effect: "none",
  });
  const blockedPort = createModulePort({
    adapters: [{manifest, invoke() { throw new Error("fixture failure"); }}],
    output_validators: semanticTextOutputValidators,
  });
  const result = routeRequestWithoutDefaults(context("Handle this bounded request.", "validate"), profile, blockedPort);
  assert.equal(result.kind, "block");
  assert.equal(result.selected, null);
  assert.equal(result.semantic_evidence.disposition, "blocked");
  assert.ok(result.reason_codes.includes("route.semantic-capability-blocked"));
});

test("a module-bound registered route is eligible only with its exact capability receipt", () => {
  const result = routeRequest(context("Start a new system.", "define-intake"), boundProfile(), portWithAvailability());
  assert.equal(result.kind, "direct");
  assert.equal(result.selected.route_id, "CA2-ROUTE-DEFINE");
  const evidence = result.evaluated_routes.find((route) => route.route_id === "CA2-ROUTE-DEFINE").availability;
  assert.equal(evidence.status, "available");
  assert.equal(evidence.source, "module-capability");
  assert.equal(evidence.module_id, "define-route-availability");
  assert.match(evidence.receipt_digest, /^[a-f0-9]{64}$/u);
});

test("an unavailable explicit route gates without lexical fallback", () => {
  const result = routeRequest(
    context("Start a new system and plan it.", "define-intake"),
    boundProfile(),
    portWithAvailability({available: false, reason_codes: ["define.module-not-configured"]}),
  );
  assert.equal(result.kind, "gate");
  assert.equal(result.selected, null);
  assert.deepEqual(result.candidates, ["CA2-ROUTE-PLAN"]);
  assert.ok(result.reason_codes.includes("route.explicit-capability-unavailable"));
  assert.ok(result.reason_codes.includes("define.module-not-configured"));
});

test("a missing availability capability gates only its bound route", () => {
  const decisionProfile = boundProfile();
  const unavailable = routeRequest(context("Start something new.", "define-intake"), decisionProfile, modulePort);
  assert.equal(unavailable.kind, "gate");
  assert.ok(unavailable.reason_codes.includes("module.capability-unavailable"));

  const ordinary = routeRequest(context("Handle this bounded request.", "validate"), decisionProfile, modulePort);
  assert.equal(ordinary.kind, "direct");
  assert.equal(ordinary.selected.route_id, "CA2-ROUTE-VALIDATE");
  assert.equal(ordinary.evaluated_routes.find((route) => route.route_id === "CA2-ROUTE-VALIDATE").availability.source, "route-registry");
});

test("a capability response for another route cannot satisfy the binding", () => {
  const capabilityId = "route.available/define/v1";
  const mismatchedAdapter = {
    manifest: sealModuleManifest({
      schema_version: "are.module-manifest/v1",
      module_id: "mismatched-route-provider",
      version: "1-candidate",
      adapter_protocol: "are.module-adapter/v1",
      capabilities: [{capability_id: capabilityId, input_protocol: "are.route-availability-query/v1", output_protocol: "are.route-availability-result/v1"}],
      required_permissions: [],
      side_effects: false,
      authority_effect: "none",
    }),
    invoke() {
      return {schema_version: "are.route-availability-result/v1", route_id: "CA2-ROUTE-PLAN", available: true, reason_codes: [], authority_effect: "none"};
    },
  };
  const result = routeRequest(context("Start something new.", "define-intake"), boundProfile(), portWithAvailability({adapter: mismatchedAdapter}));
  assert.equal(result.kind, "gate");
  const evidence = result.evaluated_routes.find((route) => route.route_id === "CA2-ROUTE-DEFINE").availability;
  assert.equal(evidence.repair_focus, "route-identity");
  assert.ok(result.reason_codes.includes("route.availability-route-identity"));
});
