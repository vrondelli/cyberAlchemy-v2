# Distill validation

- Mode: Standard
- Proposal tracks: one
- Roles: parent Proposer plus true background Balancer
- Recursive rounds: 2/2
- Verdict: `flag-before-owner-admission`

## Round 1

Proposer: one closure-evidence contract can contain the consumer completeness input and evaluator result.

Balancer objection — owner-boundary collapse: that language risks turning the envelope and verdict into one authority surface. Generic closure terminology also exceeds the evidenced `emits` incoming-direction case.

Reconciliation: retain one Define package but split it into two independently governed records: `EmitsIncomingClosureEvidenceEnvelope` and `EmitsTargetMaxEvaluationReceipt`. Generated graph, source manifest, and build receipt remain external non-authoritative inputs.

## Round 2

Proposer: exact graph and source-manifest digests are enough to connect the two records.

Balancer objection — evidence completeness/currentness: digests bind bytes but do not prove that the eligible populations or incoming fact set are complete or current. Completeness needs exact membership/placement/fact-set bindings, a declaring owner, a producer identity, and fail-closed currentness.

Reconciliation: add exact membership and fact-set references/digests, declarer and producer identities, and an owner-currentness reference. Digest equality is the smallest candidate freshness predicate, but remains owner-unaccepted; no TTL is invented.

## Smallest coherent unit

The smallest useful package is two records plus their exact digest link:

1. the envelope proves what input is claimed complete for one snapshot;
2. the receipt proves what evaluator ran and what it concluded.

Splitting the package loses the evidence-to-verdict bridge; combining the records collapses independent responsibilities.

## Recomposition and premortem

The envelope recomposes with existing generated graph/source-manifest evidence; the receipt recomposes with later lifecycle or packet projection without granting it. The likely failure is treating a minted build-receipt `pass` as population closure, or treating `one_to_many` as numeric authority. The guardrail is explicit owner separation plus N37 and numeric-policy receipt bindings.

## Frame expiry and navigation

Re-run Distill if an admitted closure-envelope owner, evaluator schema, or emits-capable projection profile lands. Start with `SPEC.md`, then `DEFINE-GAPS.md`. Next route is owner admission through Decision Gate, not implementation.

- Evidence emission: not configured
- Telemetry: not configured
