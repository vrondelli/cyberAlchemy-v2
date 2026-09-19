# Implementation Layering Seed

This seed is architectural decomposition, not implementation authorization.

| Layer | Concept unit | Owns | Must not own |
| --- | --- | --- | --- |
| L0 Semantic kernel | failure meanings, state vocabulary, claim taxonomy | DomainSpec owners | tool commands or deployment authority |
| L1 Evidence contracts | observations, freshness, privacy, receipts, typed verdicts | evidence/evaluator owners | protected effects |
| L2 Profile bindings | monitoring, load, infrastructure, canary, deployment, rollback mechanics | profile lifecycle owners | canonical domain meaning |
| L3 Evaluation graph | C01-C20 control dependencies and M01-M17 discriminators | validation owners | owner acceptance |
| L4 Protected effects | infrastructure apply, deployment, rollback | environment/deployment owners | semantic or profile admission |
| L5 Acceptance and promotion | exact-byte acceptance, profile/ontology admission, release | separate protected owners | retrospective evidence fabrication |

The smallest next coherent unit is an immutable owner-and-profile binding packet for `W-ORODI-001-R2`. It recomposes into the full architecture by supplying identities and exact digests without changing C01-C16 semantics.
