# DomainSpec Claims

This file defines claim-level research contracts for DomainSpec.

## Claim Catalog

| Claim ID | Detailed Claim | Falsifiable Hypothesis | Primary Metrics | Minimum Evidence Package | Current Status |
|---|---|---|---|---|---|
| C1 | A dual-track L0-L7 architecture improves traceability from domain semantics to governance and implementation outcomes. | If dual-track layering is removed or collapsed, trace links from claim -> experiment -> artifact become incomplete or ambiguous under identical execution conditions. | traceability completeness ratio, unresolved dependency count, gate transition latency | E4 + E5 + E7 + E8 (E11 secondary) | insufficient evidence |
| C2 | Deterministic derivation from typed ontology yields reproducible obligations with bounded variance across runs. | Given a fixed concept graph and rule set, repeated derivations should converge to identical or near-identical obligation sets; divergence above threshold rejects the claim. | run-to-run agreement (Jaccard), obligation coverage ratio, derivation drift rate | E1 + E2 + E3 + E6 + E9 + E11 | partially supported |
| C3 | Governance attenuation grows with governance density and can be reduced by structural interventions without reducing semantic coverage. | Increasing governance instruction density produces lower per-rule compliance unless observer-executor separation and structural controls are applied. | per-rule compliance slope, signal emission rate, remediation closure rate | E4 + E5 + E7 | insufficient evidence |
| C4 | Meta-circular governance converges through repeated signal -> reflection -> update loops and reduces governance drift over time. | Across repeated runs, drift and orphan indicators should trend downward while evidence completeness trends upward under fixed gates. | orphan rate trend, evidence freshness lag, cumulative unresolved governance gaps | E7 + E8 | insufficient evidence |

## Claim Acceptance Rules

| Claim ID | Quantitative Acceptance Rule | Disconfirming Outcome |
|---|---|---|
| C1 | >= 0.95 claim-to-artifact traceability completeness across scheduled experiments and no unresolved critical dependencies at S11. | Any completed run with unresolved claim-to-artifact path or repeated gate-routing ambiguity at S11/S12. |
| C2 | >= 0.95 run agreement on deterministic outputs for fixed inputs and no unresolved high-severity drift in adjudicated runs. | Repeated runs under fixed inputs produce agreement < 0.90 or unresolved drift root causes remain. |
| C3 | Governance-density increase shows attenuation in baseline, and structural intervention recovers >= 20% relative compliance without dropping gate coverage. | No measurable attenuation curve or interventions improve compliance only by reducing governance obligations. |
| C4 | Longitudinal runs show non-random positive trend on convergence metrics with bounded threat profile. | Metrics oscillate without convergence or improvements depend on untracked manual intervention. |

## Claim Status Snapshot

- C2: partially supported (E6 and E9 completed; E11 in progress with adjudication pending).
- C1: insufficient evidence pending E4, E5, E7, and E8 execution/analysis closure.
- C3: insufficient evidence pending attenuation/intervention experiments.
- C4: insufficient evidence pending longitudinal convergence evidence.

Evidence source of truth:
- `results/DOMAINSPEC-EVIDENCE-STATUS.md`
