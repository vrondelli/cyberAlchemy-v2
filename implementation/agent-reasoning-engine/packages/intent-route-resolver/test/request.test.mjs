import assert from "node:assert/strict";
import test from "node:test";

import {
  admitRouteRequest,
  canonicalJson,
  sha256HexText,
} from "../index.mjs";

function validRequest() {
  return {
    schema_version: "intent-route.request@1",
    request_id: "request-001",
    intent: {
      schema_version: "routable-intent@1",
      source_schema: "example.intent@1",
      source_digest: "a".repeat(64),
      raw_intent: "Define a bounded feature.",
      discriminators: {
        work_kind: {
          posture: "declared",
          value: "define",
          evidence_refs: ["conversation:1"],
          inference_note: null,
        },
        scope_known: {
          posture: "unresolved",
          value: null,
          evidence_refs: [],
          inference_note: null,
        },
      },
      constraints: ["no effects", "no effects"],
    },
    catalog_snapshot: {
      schema_version: "intent-route.catalog@1",
    },
  };
}

test("canonical JSON and environment-free SHA-256 match fixed vectors", () => {
  assert.equal(
    canonicalJson({z: [3, 2, 1], a: "é", n: -0}),
    '{"a":"é","n":0,"z":[3,2,1]}',
  );
  assert.equal(
    sha256HexText("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("an exact JSON-only request canonicalizes and freezes", () => {
  const result = admitRouteRequest(validRequest());
  assert.equal(result.ok, true);
  assert.equal(result.value.intent.discriminators.work_kind.value, "define");
  assert.deepEqual(result.value.intent.constraints, ["no effects"]);
  assert.equal(Object.isFrozen(result.value), true);
  assert.equal(result.bytes, canonicalJson(result.value));
  assert.equal(admitRouteRequest(validRequest()).bytes, result.bytes);
});

test("unresolved posture never accepts a guessed value", () => {
  const request = validRequest();
  request.intent.discriminators.scope_known.value = true;
  const result = admitRouteRequest(request);
  assert.equal(result.ok, false);
  assert.deepEqual(
    result.diagnostic.reason_codes,
    ["intent.discriminators.scope_known.unresolved-value-must-be-null"],
  );
});

test("inferred posture requires evidence and a note", () => {
  const request = validRequest();
  request.intent.discriminators.work_kind = {
    posture: "inferred",
    value: "define",
    evidence_refs: [],
    inference_note: null,
  };
  const result = admitRouteRequest(request);
  assert.equal(result.ok, false);
  assert.deepEqual(result.diagnostic.reason_codes, [
    "intent.discriminators.work_kind.inference-note-required",
    "intent.discriminators.work_kind.inferred-evidence-required",
  ]);
});

test("runtime-native and cyclic values fail closed", () => {
  const withDate = validRequest();
  withDate.intent.discriminators.work_kind.value = new Date(0);
  assert.match(
    admitRouteRequest(withDate).diagnostic.reason_codes[0],
    /Date is not a plain JSON object/,
  );

  const cyclic = validRequest();
  cyclic.loop = cyclic;
  assert.match(
    admitRouteRequest(cyclic).diagnostic.reason_codes[0],
    /cyclic values are not JSON/,
  );
});

test("unknown versions and malformed raw intent return typed diagnostics", () => {
  const request = validRequest();
  request.schema_version = "intent-route.request@2";
  request.intent.raw_intent = {path: "/tmp/not-a-contract"};
  const result = admitRouteRequest(request);
  assert.equal(result.ok, false);
  assert.deepEqual(result.diagnostic.reason_codes, [
    "intent.raw_intent.invalid",
    "intent.raw_intent.unknown-field:path",
    "request.unsupported-version",
  ]);
});

test("duplicate discriminator keys after normalization fail closed", () => {
  const request = validRequest();
  request.intent.discriminators[" work_kind "] = request.intent.discriminators.work_kind;
  const result = admitRouteRequest(request);
  assert.equal(result.ok, false);
  assert.deepEqual(result.diagnostic.reason_codes, [
    "intent.discriminators.duplicate-normalized-key:work_kind",
  ]);
});
