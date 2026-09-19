---
artifact_kind: plan-gap-ledger
status: no-current-blocker
authority_effect: none
---

# Gap Ledger

| Gap | Acceptance impact now | Owner | Repair/next route |
|---|---|---|---|
| historical v1 catalogue was not exact-bound to the later Enum snapshot | resolved in planning by `SWU-ARE-015`; implementation remains pending | independent catalogue owner | publish and validate the snapshot-bound v2 catalogue after ARE-004 closes; keep v1 as immutable regression lineage |
| concrete `OrderStatus` is a candidate fixture, not canonical domain authority | bounded by claim ceiling; not a blocker for prototype proof | future canonical-definition owner | replace snapshot authority reference in a later owner-issued run |
| legacy adapter accepts caller-supplied `expectedValues` | blocks reuse as the new expectation path; owned by SWU-ARE-009 | TypeScript adapter owner | add no-expectations entry point without breaking legacy tests |
| composition requires relation and alias evidence | outside direct first unit | ontology/profile plus adapter owners | follow-up design after SWU-ARE-014 |
| Python/Rust realization not planned here | outside selected TypeScript unit | language owners | new Work Packs reusing validated portable contracts |
| checked-in generated-source policy is undecided | no effect on isolated proof | product/source owner | decision gate after first proof |
| prior ARE-004 readiness evidence predates refreshed planning bytes | blocks reuse of that audit, not the refreshed Plan | implementation-readiness | run a fresh audit before any selection; then admit only the current frontier if it passes |

There is no open acceptance-critical planning blocker. A failed live validation,
ontology insufficiency, or required scope expansion becomes a terminal blocker at
execution time.
