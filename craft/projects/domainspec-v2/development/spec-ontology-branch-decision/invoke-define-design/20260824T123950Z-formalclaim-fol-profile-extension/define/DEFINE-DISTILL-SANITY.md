# Define Distill Sanity Check

- Mode: compact role simulation
- Round budget: 1
- Verdict: pass
- Evidence emission: not configured
- Telemetry: not emitted because the dispatch forbids telemetry mutation

## Proposer

Define one source-FOL addition containing the owner-authored meaning contract and
the validation-owned assessment contract.

## Balancer objection — ownership collapse

One document could falsely make assessment fields such as decidability or
solver results part of authored meaning.

## Reconciliation

Keep two separately owned contracts inside one coherent definition unit. They
join only by exact claim reference and digest. Source changes and assessment
changes have independent version/supersession paths.

## Smallest coherent definition unit

The smallest unit is the pair
`FormalClaimSourcePayload/v1 + FormalClaimCapabilityAssessment/v1`. Splitting
either away would lose the explicit safety boundary the addition exists to
create; merging them would collapse ownership.

## Recomposition

The source payload remains a `FormalClaim` in the existing
`formal-claims-specification` branch. The assessment feeds TDE, EVF, SMT, and
proof routes without creating a new ontology branch or changing existing
`formalizes` and `derived_from` semantics.
