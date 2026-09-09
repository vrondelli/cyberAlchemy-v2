import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalJson,
  resolveJson,
  sealCapabilityCatalog,
  sha256HexText,
} from "../index.mjs";

function request() {
  const catalog = sealCapabilityCatalog({
    schema_version: "intent-route.catalog@1",
    catalog_id: "catalog",
    catalog_version: "1",
    owner_ref: "owner:catalog",
    effective_state: {status: "effective", revision: "rev-1"},
    clarification_prompts: {work_kind: "What kind of work is this?"},
    routes: [
      {
        route_id: "define",
        label: "Define",
        capability_ref: "invoke",
        mode: "define",
        required: [{key: "work_kind", operator: "equals", value: "define"}],
        exclusions: [],
        required_inputs: ["intent"],
        dominates: [],
        owner_ref: "owner:invoke",
        contract_refs: ["invoke:define"],
        forbidden_effects: ["approval", "dispatch"],
      },
    ],
  });
  return {
    schema_version: "intent-route.request@1",
    request_id: "request-port",
    intent: {
      schema_version: "routable-intent@1",
      source_schema: "fixture@1",
      source_digest: sha256HexText("fixture"),
      raw_intent: "Define this feature.",
      discriminators: {
        work_kind: {
          posture: "declared",
          value: "define",
          evidence_refs: ["fixture"],
          inference_note: null,
        },
      },
      constraints: [],
    },
    catalog_snapshot: catalog,
  };
}

test("generic JSON input returns a canonical candidate response", () => {
  const bytes = resolveJson(canonicalJson(request()));
  const response = JSON.parse(bytes);
  assert.equal(response.protocol_version, "intent-route.runtime-port@1");
  assert.equal(response.request_id, "request-port");
  assert.equal(response.disposition.kind, "candidate");
  assert.equal(response.transport_diagnostic, null);
  assert.equal(bytes, canonicalJson(response));
});

test("malformed JSON returns a typed diagnostic without an exception", () => {
  const first = resolveJson("{");
  const second = resolveJson("{");
  assert.equal(first, second);
  assert.deepEqual(JSON.parse(first), {
    disposition: null,
    protocol_version: "intent-route.runtime-port@1",
    request_id: null,
    transport_diagnostic: {
      details: [],
      reason_codes: ["port.invalid-json"],
      subject: "transport",
    },
  });
});

test("unknown request versions use the exact protocol reason code", () => {
  const value = request();
  value.schema_version = "intent-route.request@2";
  const response = JSON.parse(resolveJson(JSON.stringify(value)));
  assert.equal(response.disposition, null);
  assert.deepEqual(
    response.transport_diagnostic.reason_codes,
    ["port.unsupported-request-version"],
  );
});

test("shape failures expose stable validator codes and no stack", () => {
  const value = request();
  value.intent.raw_intent = null;
  const response = JSON.parse(resolveJson(JSON.stringify(value)));
  assert.deepEqual(response.transport_diagnostic.reason_codes, ["port.invalid-request"]);
  assert.ok(response.transport_diagnostic.details.includes("intent.raw_intent.invalid"));
  assert.equal("stack" in response.transport_diagnostic, false);
});

test("non-string caller input fails closed", () => {
  const response = JSON.parse(resolveJson(request()));
  assert.deepEqual(response.transport_diagnostic.reason_codes, ["port.invalid-json"]);
  assert.deepEqual(response.transport_diagnostic.details, ["transport.expected-string"]);
});
