import { createHash } from "node:crypto";

export const FOUNDATION_CODES = Object.freeze({
  INSTANCE_MISMATCH: "FOUNDATION_INSTANCE_MISMATCH",
  PARENT_MISMATCH: "FOUNDATION_PARENT_MISMATCH",
  PRINCIPAL_MISSING: "FOUNDATION_PRINCIPAL_MISSING",
  DOMAIN_MISMATCH: "FOUNDATION_DOMAIN_MISMATCH",
  HOST_MISMATCH: "FOUNDATION_HOST_MISMATCH",
  HOST_INACTIVE: "FOUNDATION_HOST_INACTIVE",
  LIFECYCLE_INACTIVE: "FOUNDATION_LIFECYCLE_INACTIVE",
  EFFECT_NOT_ALLOWED: "FOUNDATION_EFFECT_NOT_ALLOWED",
  GRANT_MISSING: "FOUNDATION_GRANT_MISSING",
  SOURCE_DRIFT: "FOUNDATION_SOURCE_DRIFT",
});

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function digest(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function check(code, pass, detail) {
  return Object.freeze({ code, pass, detail });
}

export function evaluateFoundationInvocation({ candidate, invocation, currentSources }) {
  const checks = [
    check(FOUNDATION_CODES.INSTANCE_MISMATCH, invocation.instance_ref === candidate.instance_id, invocation.instance_ref),
    check(FOUNDATION_CODES.PARENT_MISMATCH, invocation.parent_capability_ref === candidate.parent_capability_ref, invocation.parent_capability_ref),
    check(FOUNDATION_CODES.PRINCIPAL_MISSING, Boolean(invocation.principal?.principal_id), invocation.principal?.principal_id ?? null),
    check(FOUNDATION_CODES.DOMAIN_MISMATCH, invocation.principal?.domain === "local-workspace", invocation.principal?.domain ?? null),
    check(FOUNDATION_CODES.HOST_MISMATCH, invocation.host_claim?.host === candidate.host, invocation.host_claim?.host ?? null),
    check(FOUNDATION_CODES.HOST_INACTIVE, invocation.host_claim?.active === true, invocation.host_claim?.active ?? null),
    check(FOUNDATION_CODES.LIFECYCLE_INACTIVE, candidate.lifecycle?.state === "candidate" && candidate.lifecycle?.activation === "not-authorized", candidate.lifecycle),
    check(FOUNDATION_CODES.EFFECT_NOT_ALLOWED, Array.isArray(invocation.effect_envelope?.effects) && invocation.effect_envelope.effects.length === 0, invocation.effect_envelope?.effects ?? null),
    check(FOUNDATION_CODES.GRANT_MISSING, candidate.required_grants.length === 0 || candidate.required_grants.every((grant) => invocation.grants?.includes(grant)), invocation.grants ?? []),
    check(FOUNDATION_CODES.SOURCE_DRIFT, currentSources.every((source) => source.current === true), currentSources.filter((source) => !source.current).map((source) => source.term ?? source.path)),
  ];

  const failed = checks.filter((entry) => !entry.pass).map((entry) => entry.code);
  const subject = {
    instance_ref: invocation.instance_ref,
    instance_version: candidate.version,
    parent_capability_ref: invocation.parent_capability_ref,
    principal_ref: invocation.principal?.principal_id ?? null,
    principal_domain: invocation.principal?.domain ?? null,
    host: invocation.host_claim?.host ?? null,
    lifecycle_epoch: candidate.lifecycle?.epoch,
    effect_envelope: invocation.effect_envelope,
  };
  const subjectDigest = digest(subject);
  const comparison = Object.freeze({
    baseline: Object.freeze({ checks: checks.length, failed: 0 }),
    observed: Object.freeze({ checks: checks.length, failed: failed.length }),
    delta: Object.freeze({ failed: failed.length }),
  });

  return Object.freeze({
    schema: "cav2.foundation-preflight-evidence/v1",
    evidence_id: `sha256:${digest({ subjectDigest, checks, comparison })}`,
    subject_digest: `sha256:${subjectDigest}`,
    outcome: failed.length === 0 ? "PASS" : "FAIL",
    failed_codes: Object.freeze(failed),
    checks: Object.freeze(checks),
    differential: comparison,
    effect_authorized: false,
    execution_attempted: false,
    claim_ceiling: "effect-free preflight candidate evidence; not validation receipt, conformance, approval, authority, or execution receipt",
  });
}
