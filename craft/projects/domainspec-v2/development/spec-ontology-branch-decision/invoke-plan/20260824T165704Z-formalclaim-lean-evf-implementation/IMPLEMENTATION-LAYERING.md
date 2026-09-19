# Implementation Layering — FormalClaim Lean/EVF

Status: execution-candidate, pending exact Rondelli acceptance
Authority effect: none

## Smallest coherent system

The coherent system is not “add Lean.” It is the full typed path from one
canonical FormalClaim proposition to one bounded theorem receipt and, only when
independently present, a separate runtime-conformance binding. The path remains
split into independently closable behaviors.

| Layer | Units | Responsibility | Evidence | Forbidden inference |
| --- | --- | --- | --- | --- |
| L0 contracts | 001-006 | source/profile/binding/category/provider/request/receipt schemas and static validation | schema fixtures and exact negative discrimination | provider admission or theorem |
| L1 deterministic identity | 007-008 | complete adversarial matrix and environment-bound source/import/type identities | fixture coverage, replay, path-only and stale rejection | semantic equivalence from hashing |
| L2 provider integration | 009-010 | exact Lean build/inspection runtime and distinct EVF adapter/evidence handle | build/type/axiom/sorry/unsafe/currentness receipts and EVF join fixtures | runtime conformance, discharge, or GraphLaw reuse |
| L3 conformance and breadth | 011-014 | independent runtime binding, candidate migration, integrated replay, and exact pre-merge preparation | conformance fixtures, migration report, integration report, C12 freeze pack | canonical admission, merge, release, deployment, production behavior |

## Layer rules

1. A higher layer consumes only accepted outputs from lower layers.
2. A schema unit may include its own validator and fixtures because those are
   the acceptance mechanism for that one contract behavior.
3. The theorem provider and runtime-conformance validator never share a success
   flag or receipt type.
4. The category profile validates a local declared model; it cannot classify
   the complete DomainSpec graph as a category.
5. Migration produces candidate ontology/contract entries with authority none.
6. Pre-merge preparation freezes and checks; it cannot fabricate Victor's
   receipt, authenticate him, or merge.

## First reversible trust step

`SWU-FCL-001` is intentionally narrow: implement only the logic-neutral source
envelope and reject proof/provider/discharge fields. It can be reviewed and
reverted without a Lean runtime, EVF adapter, or migration. Its acceptance
proves that meaning remains independent of proof before later layers are built.

## Recomposition proof

001-004 establish what a claim and mappings mean. 005-006 establish what a
provider may receive and report. 007 proves the Design witness surface is not
lost. 008 gives exact identities to 009. 009 reports theorem evidence to 010.
011 remains a separate optional join. 012 migrates only after all contract
families exist. 013 replays the complete cross-surface invariants. 014 freezes
the exact merge candidate and applies C12. Removing any unit leaves an explicit
typed gap rather than a silently widened claim.
