import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { digest, evaluateFoundationInvocation, FOUNDATION_CODES } from "../runtime/foundation.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidate = JSON.parse(await readFile(resolve(root, "candidate.json"), "utf8"));
const currentSources = candidate.source_bindings.map((term) => ({ term, current: true }));

function validInvocation() {
  return {
    invocation_id: "invocation.test.1",
    instance_ref: candidate.instance_id,
    parent_capability_ref: candidate.parent_capability_ref,
    principal: { principal_id: "local-process:test", domain: "local-workspace", verified_human_identity: false },
    host_claim: { host: candidate.host, active: true },
    effect_envelope: { envelope_id: "foundation.effect-free/v1", effects: [] },
    grants: [],
  };
}

test("accepts one exact effect-free Capability Instance preflight", () => {
  const evidence = evaluateFoundationInvocation({ candidate, invocation: validInvocation(), currentSources });
  assert.equal(evidence.outcome, "PASS");
  assert.equal(evidence.effect_authorized, false);
  assert.equal(evidence.execution_attempted, false);
  assert.match(evidence.evidence_id, /^sha256:[a-f0-9]{64}$/);
});

test("produces deterministic identity-bound differential evidence", () => {
  const first = evaluateFoundationInvocation({ candidate, invocation: validInvocation(), currentSources });
  const second = evaluateFoundationInvocation({ candidate, invocation: validInvocation(), currentSources });
  assert.deepEqual(first, second);
  assert.equal(digest(first), digest(second));
  assert.deepEqual(first.differential.delta, { failed: 0 });
});

test("fails closed when an effect is requested", () => {
  const invocation = validInvocation();
  invocation.effect_envelope.effects.push("filesystem.write");
  const evidence = evaluateFoundationInvocation({ candidate, invocation, currentSources });
  assert.equal(evidence.outcome, "FAIL");
  assert.ok(evidence.failed_codes.includes(FOUNDATION_CODES.EFFECT_NOT_ALLOWED));
  assert.equal(evidence.effect_authorized, false);
});

test("fails closed on identity, host, lifecycle-domain, and source drift", () => {
  const invocation = validInvocation();
  invocation.instance_ref = "other.instance";
  invocation.principal.domain = "other-domain";
  invocation.host_claim.active = false;
  const evidence = evaluateFoundationInvocation({
    candidate,
    invocation,
    currentSources: currentSources.map((source, index) => ({ ...source, current: index !== 0 })),
  });
  assert.equal(evidence.outcome, "FAIL");
  assert.deepEqual(new Set(evidence.failed_codes), new Set([
    FOUNDATION_CODES.INSTANCE_MISMATCH,
    FOUNDATION_CODES.DOMAIN_MISMATCH,
    FOUNDATION_CODES.HOST_INACTIVE,
    FOUNDATION_CODES.SOURCE_DRIFT,
  ]));
});

test("does not silently treat UI add-on wording as the canonical subject", async () => {
  const profile = JSON.parse(await readFile(resolve(root, "profile.json"), "utf8"));
  assert.equal(profile.canonical_semantic_subject, "Capability Instance");
  assert.deepEqual(profile.ui_aliases, ["add-on"]);
  assert.equal(profile.ui_alias_policy, "noncanonical-label-only");
});
