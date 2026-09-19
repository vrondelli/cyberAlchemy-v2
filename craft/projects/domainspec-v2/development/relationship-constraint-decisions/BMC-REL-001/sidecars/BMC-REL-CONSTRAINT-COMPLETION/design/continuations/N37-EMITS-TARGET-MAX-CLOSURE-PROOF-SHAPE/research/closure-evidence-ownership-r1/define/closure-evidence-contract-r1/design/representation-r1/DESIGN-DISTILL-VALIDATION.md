# Distill validation

Mode: Standard, two roles, two rounds.

## Round 1

Proposer compared a dedicated sidecar, embedding in `project.json`, and a per-evaluation request. Balancer rejected embedding because the closed `minted-project/v1` schema would need a new version and because output digests embedded in an input manifest create a source-set/output digest cycle. The request form collapsed into the sidecar when persisted and digest-bound.

## Round 2

Proposer narrowed the design to one immutable consumer-authored envelope per exact snapshot, outside `generated_root`, authored after generated graph/source-manifest production and before evaluation. Balancer accepted when the evaluator binds envelope path/digest plus graph and source-manifest digests, and when requests reference rather than copy the envelope.

## Smallest coherent unit

Dedicated envelope placement plus two interfaces: generated projection evidence into a consumer attestation, then envelope path/digest into an evaluator receipt.

Verdict: `pass-one-admissible-route-owner-pending`.
