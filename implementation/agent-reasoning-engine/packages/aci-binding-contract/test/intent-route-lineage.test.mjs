import assert from "node:assert/strict";
import test from "node:test";
import {
  BindingReferenceError,
  mapIntentRouteLineageReferences,
  verifyIntentRouteLineageDigest,
} from "../index.mjs";

const REQUEST_DIGEST = "1".repeat(64);
const DISPOSITION_DIGEST = "2".repeat(64);

function input() {
  return {
    schema_version: "intent-route.lineage-input@1",
    intent_route_request_ref: {
      artifact_ref: "artifact://intent-route/request/1",
      content_digest: REQUEST_DIGEST,
    },
    intent_route_disposition_ref: {
      artifact_ref: "artifact://intent-route/disposition/1",
      content_digest: DISPOSITION_DIGEST,
    },
  };
}

function rejects(candidate, reasonCode) {
  assert.throws(
    () => mapIntentRouteLineageReferences(candidate),
    (error) => error instanceof BindingReferenceError
      && error.reason_code === reasonCode,
  );
}

test("maps exact route artifact lineage with a zero-authority local posture", () => {
  const first = mapIntentRouteLineageReferences(input());
  const second = mapIntentRouteLineageReferences(structuredClone(input()));

  assert.deepEqual(first, second);
  assert.equal(first.schema_version, "reasoning-entry.lineage@1");
  assert.equal(first.binding_posture, "candidate_local_non_integrated");
  assert.equal(first.authority_effect, "none");
  assert.deepEqual(first.intent_route_request_ref, input().intent_route_request_ref);
  assert.deepEqual(
    first.intent_route_disposition_ref,
    input().intent_route_disposition_ref,
  );
  assert.match(first.lineage_digest, /^[0-9a-f]{64}$/);
  assert.equal(verifyIntentRouteLineageDigest(first), true);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.intent_route_request_ref), true);
});

test("rejects version drift, malformed digests, and nested shape expansion", () => {
  const version = input();
  version.schema_version = "intent-route.lineage-input@2";
  rejects(version, "BINDING_VERSION_UNSUPPORTED");

  const digest = input();
  digest.intent_route_disposition_ref.content_digest = "A".repeat(64);
  rejects(digest, "BINDING_CONTENT_DIGEST_INVALID");

  const nested = input();
  nested.intent_route_request_ref.command_id = "locally-invented-command";
  rejects(nested, "BINDING_REFERENCE_SHAPE_INVALID");
});

test("rejects ACI acceptance, journal, effect, and compatibility identity smuggling", () => {
  for (const field of [
    "aci_command_id",
    "aci_acceptance_receipt_id",
    "journal_span",
    "effect_intent_id",
    "authority_grant",
    "compatibility_claim",
  ]) {
    const candidate = input();
    candidate[field] = `forbidden-${field}`;
    rejects(candidate, "BINDING_INPUT_SHAPE_INVALID");
  }

  const nestedRequest = input();
  nestedRequest.intent_route_request_ref.artifact_ref =
    "aci://command/ACI-CMD-123";
  rejects(nestedRequest, "BINDING_ARTIFACT_REF_INVALID");

  const nestedDisposition = input();
  nestedDisposition.intent_route_disposition_ref.artifact_ref =
    "compatibility://claim/CONFORMANT";
  rejects(nestedDisposition, "BINDING_ARTIFACT_REF_INVALID");

  const namespaceSwap = input();
  namespaceSwap.intent_route_request_ref.artifact_ref =
    "artifact://intent-route/disposition/wrong-owner";
  rejects(namespaceSwap, "BINDING_ARTIFACT_REF_INVALID");

  const nestedScheme = input();
  nestedScheme.intent_route_request_ref.artifact_ref =
    "artifact://intent-route/request/aci://command/ACI-CMD-123";
  rejects(nestedScheme, "BINDING_ARTIFACT_REF_INVALID");

  const nestedClaim = input();
  nestedClaim.intent_route_disposition_ref.artifact_ref =
    "artifact://intent-route/disposition/compatibility://claim/CONFORMANT";
  rejects(nestedClaim, "BINDING_ARTIFACT_REF_INVALID");

  const pathNormalization = input();
  pathNormalization.intent_route_request_ref.artifact_ref =
    "artifact://intent-route/request/segment/../../disposition/wrong-owner";
  rejects(pathNormalization, "BINDING_ARTIFACT_REF_INVALID");
});

test("detects lineage mutation without resolving or reading either artifact", () => {
  const mapped = mapIntentRouteLineageReferences(input());
  const mutated = structuredClone(mapped);
  mutated.intent_route_disposition_ref.content_digest = "3".repeat(64);
  assert.equal(verifyIntentRouteLineageDigest(mutated), false);
});
