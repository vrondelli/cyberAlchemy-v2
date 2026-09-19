# Validation Strategy

## Proof obligations

- Contract closure: schemas and runtime decoder reject undeclared fields and malformed identities.
- State non-collapse: all seven evidence states remain individually accepted and reported.
- Exact denominator: C01-C16 occur exactly once; C17-C20 never enter the admitted aggregate.
- Observation safety: only product-plane evidence can support controls; allowlist, cardinality, and queue accounting fail closed.
- Freshness: expiry and invalidation digests are explicit inputs and stale data cannot pass.
- Effect separation: C11 is simulation-only with no effect; C12 is live-only and independently observed.
- Non-actuation: output always has `authority_effect: none` and no adapter can write outside stdout.
- Determinism: identical bytes plus evaluation time produce identical canonical result JSON.

## Evidence layers

1. TypeScript compile proof.
2. JSON Schema positive and mutation proof.
3. Direct function unit tests over every invariant.
4. CLI integration tests with positive and hostile persisted fixtures.
5. Scoped file hygiene and changed-byte inventory.

No runtime-system, browser, network, infrastructure, load, fault, canary, or deployment evidence is claimed.
