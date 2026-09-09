import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalJson,
  resolveIntentRoute,
  sealCapabilityCatalog,
  sha256HexText,
  verifyDispositionDigest,
} from "../index.mjs";

function field(value, posture = "declared") {
  return {
    posture,
    value: posture === "unresolved" ? null : value,
    evidence_refs: posture === "unresolved" ? [] : ["fixture"],
    inference_note: null,
  };
}

function route(id, required, dominates = []) {
  return {
    route_id: id,
    label: id.toUpperCase(),
    capability_ref: `capability:${id}`,
    mode: "execute",
    required,
    exclusions: [],
    required_inputs: ["intent"],
    dominates,
    owner_ref: `owner:${id}`,
    contract_refs: [`contract:${id}`],
    forbidden_effects: ["approval", "dispatch"],
  };
}

function catalog(routes) {
  return sealCapabilityCatalog({
    schema_version: "intent-route.catalog@1",
    catalog_id: "catalog",
    catalog_version: "1.0.0",
    owner_ref: "owner:catalog",
    effective_state: {status: "effective", revision: "rev-1"},
    clarification_prompts: {
      scope_known: "Is the scope already known?",
      work_kind: "What kind of work is this?",
    },
    routes,
  });
}

function request(discriminators, routes) {
  return {
    schema_version: "intent-route.request@1",
    request_id: "request",
    intent: {
      schema_version: "routable-intent@1",
      source_schema: "fixture.intent@1",
      source_digest: sha256HexText("fixture"),
      raw_intent: "Route this intent.",
      discriminators,
      constraints: [],
    },
    catalog_snapshot: catalog(routes),
  };
}

test("all four disposition kinds are exhaustive and non-authorizing", () => {
  const routes = [
    route("define", [{key: "work_kind", operator: "equals", value: "define"}]),
    route("research", [{key: "work_kind", operator: "equals", value: "research"}]),
  ];

  const candidate = resolveIntentRoute(request({work_kind: field("define")}, routes));
  assert.equal(candidate.kind, "candidate");
  assert.equal(candidate.candidates.length, 1);

  const ambiguous = resolveIntentRoute(
    request({work_kind: field(null, "unresolved")}, routes),
  );
  assert.equal(ambiguous.kind, "ambiguous");
  assert.equal(typeof ambiguous.ambiguity.question, "string");

  const noMatch = resolveIntentRoute(request({work_kind: field("ship")}, routes));
  assert.equal(noMatch.kind, "no-match");

  const invalid = resolveIntentRoute({
    ...request({work_kind: field("define")}, routes),
    schema_version: "intent-route.request@2",
  });
  assert.equal(invalid.kind, "invalid");

  for (const disposition of [candidate, ambiguous, noMatch, invalid]) {
    assert.equal(disposition.authority_effect, "none");
    assert.equal(verifyDispositionDigest(disposition), true);
  }
});

test("conditional plus one eligible route stays ambiguous", () => {
  const routes = [
    route("define", [{key: "work_kind", operator: "equals", value: "define"}]),
    route("scope", [{key: "scope_known", operator: "equals", value: true}]),
  ];
  const disposition = resolveIntentRoute(
    request(
      {
        work_kind: field("define"),
        scope_known: field(null, "unresolved"),
      },
      routes,
    ),
  );
  assert.equal(disposition.kind, "ambiguous");
  assert.deepEqual(disposition.ambiguity.material_discriminators, ["scope_known"]);
  assert.equal(disposition.ambiguity.question, "Is the scope already known?");
});

test("overlap without a discriminator difference asks one set-valued question", () => {
  const disposition = resolveIntentRoute(
    request({}, [route("a", []), route("b", [])]),
  );
  assert.equal(disposition.kind, "ambiguous");
  assert.equal(disposition.ambiguity.reason_code, "ambiguity.route-choice-required");
  assert.match(disposition.ambiguity.question, /^Which route best fits:/);
  assert.equal(Array.isArray(disposition.ambiguity.question), false);
});

test("removing evidence cannot improve a candidate", () => {
  const routes = [
    route("define", [{key: "work_kind", operator: "equals", value: "define"}]),
  ];
  const known = resolveIntentRoute(request({work_kind: field("define")}, routes));
  const unknown = resolveIntentRoute(
    request({work_kind: field(null, "unresolved")}, routes),
  );
  assert.equal(known.kind, "candidate");
  assert.equal(unknown.kind, "ambiguous");
});

test("catalog order cannot change canonical disposition bytes", () => {
  const routes = [
    route("a", [{key: "work_kind", operator: "equals", value: "x"}], ["b"]),
    route("b", [{key: "work_kind", operator: "equals", value: "x"}]),
  ];
  const left = resolveIntentRoute(request({work_kind: field("x")}, routes));
  const right = resolveIntentRoute(request({work_kind: field("x")}, [...routes].reverse()));
  assert.equal(canonicalJson(left), canonicalJson(right));
});

test("request invalidity takes precedence over catalog invalidity", () => {
  const input = request({work_kind: field("x")}, [route("a", [])]);
  input.schema_version = "intent-route.request@2";
  input.catalog_snapshot.content_digest = "0".repeat(64);
  const disposition = resolveIntentRoute(input);
  assert.equal(disposition.invalid.subject, "request");
  assert.ok(disposition.invalid.reason_codes.includes("request.unsupported-version"));
});
