# Distill Validation: WP4 Evidence Eligibility

Mode: Standard. One proposal track, locally simulated Proposer/Balancer roles, two rounds, one reconciliation. True subagents were not used because a second helper would require a separately confirmed governed multi-agent dispatch; the Candidate-Local Prototype Fast Lane permits only the mandatory deferred-governance helper in this route.

## Round 1

- Proposer claim: assemble normalized observations into the generic evaluation bundle and run the existing validator.
- Evidence: WP3 emits structurally valid generic observations.
- Balancer objection — semantic inflation: C05, C11, and C15 currently treat those observations as sufficient despite their declaration-only provenance.
- Reconciliation: reject direct assembly. Add an eligibility boundary and evaluate only the runtime-admitted subset.

## Round 2

- Proposer claim: classify legacy observations as replay-only and keep a reserved runtime-eligible state for future profiles.
- Evidence: WP3 provenance, simulation mode, zero telemetry, no deployment effect, and no independent observation are exact.
- Balancer objection — hidden glue: an eligibility result without evaluator integration would not prove that replay evidence cannot satisfy controls.
- Reconciliation: retain one coherent unit containing classification, empty admitted-set assembly, existing derived-evaluator invocation, and claim comparison.

## Technique trace

| Technique | Trigger | Result |
| --- | --- | --- |
| abstraction-level guard | Avoid changing generic observation meaning. | Pass: eligibility is a separate integration boundary. |
| recomposition proof | Gate must fit WP1-WP3. | Pass: normalization → eligibility → admitted facts → derived controls. |
| evolution profile | Future live profiles are expected. | Pass: reserve vocabulary without implementing admission. |
| boundary-object check | Normalization results cross adapter/evaluator ownership. | Pass: typed eligibility receipt is the boundary object. |
| requisite-variety check | Three states were proposed. | Pass: replay-only, runtime-eligible, and rejected remain distinct; runtime-eligible is unreachable here. |
| premortem | Medium-risk evidence laundering. | Guardrail: hostile claims for live/effect/telemetry/provenance and exact derived states. |
| frame-expiry note | A live profile could change the optimization point. | WP4 expires as the complete admission model when an exact admitted profile exists. |
| navigable-result check | Implementation must start narrowly. | Start with the closed contract, then gate, then replay proof. |

Verdict: **pass**. The smallest coherent unit is the eligibility gate plus its evaluator-facing replay assembly; splitting those would leave either unintegrated policy or unproven containment.
