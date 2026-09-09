import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalJson,
  resolveJson,
  sealCapabilityCatalog,
  sha256HexText,
} from "../index.mjs";

function field(posture, value, evidenceRefs = []) {
  return {
    posture,
    value,
    evidence_refs: evidenceRefs,
    inference_note: posture === "inferred" ? "derived for test" : null,
  };
}

function request(overrides = {}) {
  const catalog = sealCapabilityCatalog({
    schema_version: "intent-route.catalog@1",
    catalog_id: "test-catalog",
    catalog_version: "1.0.0",
    owner_ref: "owner:test",
    effective_state: {status: "effective", revision: "fixture-1"},
    routes: [{
      route_id: "design",
      label: "Design",
      capability_ref: "capability:design",
      mode: "advisory",
      owner_ref: "owner:planner",
      contract_refs: ["contract:design"],
      required_inputs: ["intent"],
      forbidden_effects: ["execute"],
      required: [{key: "phase", operator: "equals", value: "design"}],
      exclusions: [],
      dominates: [],
    }],
    clarification_prompts: {phase: "Which phase applies?"},
  });
  const intent = {
    schema_version: "routable-intent@1",
    source_schema: "fixture@1",
    source_digest: sha256HexText("source"),
    raw_intent: "Design the adapter",
    discriminators: {phase: field("declared", "design", ["user:1"])},
    constraints: [],
  };
  return {
    schema_version: "intent-route.request@1",
    request_id: "request-1",
    intent,
    catalog_snapshot: catalog,
    ...overrides,
  };
}

test("valid requests return canonical candidate responses", () => {
  const responseText = resolveJson(JSON.stringify(request()));
  const response = JSON.parse(responseText);

  assert.equal(responseText, canonicalJson(response));
  assert.equal(response.protocol_version, "intent-route.runtime-port@1");
  assert.equal(response.request_id, "request-1");
  assert.equal(response.disposition.kind, "candidate");
  assert.equal(response.transport_diagnostic, null);
});

test("malformed JSON returns a stable typed diagnostic", () => {
  const response = JSON.parse(resolveJson("{"));

  assert.equal(response.protocol_version, "intent-route.runtime-port@1");
  assert.equal(response.disposition, null);
  assert.deepEqual(response.transport_diagnostic, {
    details: [],
    reason_codes: ["port.invalid-json"],
    subject: "transport",
  });
});

test("unknown request versions have one exact reason code", () => {
  const response = JSON.parse(resolveJson(JSON.stringify(request({
    schema_version: "intent-route.request@99",
  }))));

  assert.deepEqual(
    response.transport_diagnostic.reason_codes,
    ["port.unsupported-request-version"],
  );
});

test("shape failures preserve stable validator codes and omit stack details", () => {
  const input = request();
  delete input.intent.raw_intent;
  const response = JSON.parse(resolveJson(JSON.stringify(input)));

  assert.deepEqual(
    response.transport_diagnostic.reason_codes,
    ["port.invalid-request"],
  );
  assert(response.transport_diagnostic.details.includes("intent.raw_intent.invalid"));
  assert.equal(JSON.stringify(response).includes("stack"), false);
});

test("non-string transport input fails closed", () => {
  const response = JSON.parse(resolveJson(request()));

  assert.deepEqual(response.transport_diagnostic, {
    details: ["transport.expected-string"],
    reason_codes: ["port.invalid-json"],
    subject: "transport",
  });
});
