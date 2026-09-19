# N38 comparative complexity examples

Decision effect: none. All scenarios are hypothetical. Invariant: schemas, consumer attestations, and evaluator receipts remain separate responsibilities.

## Low

One feature supplies a complete envelope and one evaluator receipt. Under A, the split owner chain is admitted for later Design; under B, the records remain proposal-only; under C, the route ends. This demonstrates the authority distinction, not implementation readiness.

## Medium

Two consumer projects use the same DomainSpec schemas but separately attest their own populations. Under A, each consumer remains responsible for its instances and one evaluator emits project-bound receipts; under B, neither project may claim trusted closure; under C, no further contract work occurs. This adds multiple consumers and reuse; it does not admit the minted profile.

## Complex

A consumer changes its source set after an earlier evaluation while the compiler version also changes. Under A, immutable old envelopes/receipts remain historical and a new digest-bound evaluation is required; under B, the proposed split still cannot produce admitted evidence; under C, the route stays terminated. This adds drift, currentness, and multiple producers; it does not choose a TTL, storage location, or deployment policy.

Coverage: 3/3 rungs; A/B/C covered evenly; unsupported claims: 0; decision effect: none.
