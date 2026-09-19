# Implementation Layering Seed — FormalClaim Lean/EVF @3

Status: Design seed only; not an implementation plan or Work Pack

| Layer | Candidate responsibility | Required future evidence | Must not claim |
| --- | --- | --- | --- |
| L0 contracts | source/profile/binding/manifest/request/receipt schemas and static validators | positive/negative schema fixtures | provider admission or theorem |
| L1 deterministic identity | source/import/environment/type digest construction and currentness checks | replay, stale-input, path-only, mismatch fixtures | semantic equivalence from hashing |
| L2 provider integration | exact Lean build/inspection adapter and EVF normalized receipt | admitted runtime, `sorry`/axiom/unsafe audits, theorem fixtures | runtime conformance or discharge |
| L3 conformance and breadth | separate parser/runtime/model correspondence and multi-profile breadth | independent conformance receipts and owner joins | production/release from theorem evidence |

The narrowest reversible future start is L0 contract discrimination with one
native Lean positive, one translated FOL-to-Lean positive, and exact negative
fixtures. Distill and Plan owners must reassess this seed before execution.
