# E01 completion — exact verification-profile authoring

Date: 2026-09-20. Status: scoped complete. Authority effect: none.

## Completion statement

E01 is complete for the declared L3 construction boundary. One
`application-v1` verification profile now selects an authored FormalClaim,
EvaluationContext identity, route, provider profile, runtime, explicit resource
bounds and ceiling, then lowers them into an exact context, evaluation-free
request and source trace.

## Done-criterion accounting

| Obligation | Evidence | Result |
| --- | --- | --- |
| Exact FormalClaim | The selected declaration is lowered through the existing v4 FormalClaim path and the request binds its emitted bytes by path, SHA-256, size and currentness. | pass |
| Exact EvaluationContext | The emitted context conforms to the existing closed DomainSpec schema and remains `draft`. | pass |
| Exact route/provider/runtime | Authored selectors must match exact current external references whose bytes are present and hash-valid. | pass |
| Explicit runtime bounds | Timeout, memory, output, network, directory and environment allowlist are mandatory and closed. | pass |
| Deterministic request and trace | Repeated lowering yields identical contexts, requests, files and traces. | pass |
| Provider/claim non-collapse | Two provider selections preserve one FormalClaim identity while changing context and request digests. | pass |
| Fail-closed currentness | Missing, stale, mismatched, over-covered and extra binding fields reject before a result. | pass |
| No inferred execution or authority | Request and trace report no execution/result, no release admission and no authority effect. | pass |

## Validation

- AlchLang strict typecheck: pass.
- Focused E01 plus FormalClaim identity suite: 13/13 pass, zero skips.
- Parser and adjacent profile regression: 30/30 pass, zero skips.
- Complete serial `application-*.test.ts` regression: 120/120 pass, zero
  skips; duration 185463.014156 ms.
- Qualification: `evidence/e01-verification-profile/qualification.json`,
  SHA-256
  `faa74672057cc4be1c235fd746794b504483f152ace82277549fcc23c6fed854`.

## Claim ceiling

This closes E01 only. It does not implement the v4-to-v2 FormalClaim
projection, admit or execute a provider, produce or join evidence, approve a
product, publish, release, deploy, establish production readiness or grant
authority.

Progress is 25 of 37 scoped nodes. E02 is next on the formal-evidence chain;
E04 remains dependency-ready on the parallel runtime-evidence branch.
Product-owner validation remains deferred until L4X.

## Open Questions

E02 owns exact meaning-preserving FormalClaim projection with explicit loss and
currentness. E03 owns typed provider outcomes and EVF evidence joining.
