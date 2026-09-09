# Task Session Context — SWU-OCGP-003

Status: strict coverage pass

Objective: compute deterministic `derives-from` grounding closure for an
edge-grammar-valid graph and reject instance cycles. Traverse no other
predicate; choose no policy disposition and produce no projection.

Dependencies `SWU-OCGP-001` and `SWU-OCGP-002` have passing terminal and owner
receipts. Exact writes are `grounding.mjs`, `grounding.test.mjs`,
`grounding-cycle.v1.json`, and the manifest-declared receipts. Governed
ontology and Poker Team selectors are read-only.

Acceptance-critical command:

```bash
node --test cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/grounding.test.mjs
```
