export const POLICY_DIGEST =
  "16f9b212721e888b4caefb84c71e4a1d441a707d798ac19eb86418a1f61aeb97";

const EXPECTED = Object.freeze({
  schema_version: "candidate-policy-v1",
  policy_id: "candidate-policy-v1",
  policy_version: "1.0.0",
  owner: "ontology-edge-law-owner",
  authority_effect: "none",
  bindings: {
    candidate_carrier_sha256: "3cc40d3fdd62aded29982b24486924b5bdd5efa4ce566e98bc1329c072e13fa0",
    edge_grammar_sha256: "49127c855f56334cc72050a3256d8848ba915a65e9067fd1a877987356005760",
    grounding_sha256: "bd3c690cf06dbd40df868d8b35a483cf1de3f52a92d0c2c9ef795e2b5976d333",
    governed_edges_sha256: "f3ed1ed8a6452b5b8c200eadf184b2bf937b919440c26dcfa726fa334752e0d1",
    governed_allowed_edges_sha256:
      "500851b158e5c286a45ce50a99a7010e58ede6d7702cbf148c0f9db24a0224b8",
  },
});

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function result(disposition, codes) {
  return {
    policy_id: "candidate-policy-v1",
    disposition,
    codes: [...new Set(codes)].sort(),
    authority_effect: "none",
  };
}

export function evaluatePolicy({
  policy,
  policyDigest,
  carrierResult = { issues: [] },
  edgeResult = { issues: [] },
  groundingResult = { issues: [] },
  relationCandidate = null,
}) {
  if (policyDigest !== POLICY_DIGEST || canonical(policy) !== canonical(EXPECTED)) {
    return result("policy-fail", ["POLICY_BINDING_MISMATCH"]);
  }

  const upstreamCodes = [carrierResult, edgeResult, groundingResult].flatMap((upstream) =>
    (upstream.issues ?? []).map(({ code }) => code),
  );
  if (upstreamCodes.length > 0) return result("policy-fail", upstreamCodes);

  if (relationCandidate?.predicate === "specializes") {
    return result("policy-indeterminate", ["POLICY_OWNER_UNBOUND"]);
  }
  return result("policy-pass", ["POLICY_RULES_SATISFIED"]);
}
