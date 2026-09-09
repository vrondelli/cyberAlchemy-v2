# Ontology Candidate Graph Prototype — Implementation Layering

Status: planned; no layer authorized for mutation

## Layer Boundary Heuristic

Each layer must add a separately observable behavior, preserve every earlier
contract, and remain reversible inside the private candidate namespace. Cost
includes authority risk and evidence burden, not only code size.

| Layer | Value question | Included SWUs | Completion witness | Explicit exclusion |
| --- | --- | --- | --- | --- |
| L0A carrier | Can one finite candidate document be rejected or admitted structurally? | `SWU-OCGP-001` | closed node/edge schema tests | relation meaning |
| L0B graph laws | Can the admitted carrier enforce the finite edge grammar and grounding laws? | `SWU-OCGP-002`, `003` | endpoint, inverse, cycle, and non-composition tests | policy ownership |
| L0C disposition and view | Can one named policy return pass/fail/indeterminate and project only an admitted lineage? | `SWU-OCGP-004`, `005` | finite disposition suite plus Poker Team O13 projection | semantic admission |
| L1 evidence bundle | Can the same input produce create-only, digest-bound, independently verifiable evidence? | `SWU-OCGP-006`, `008`, `009` | verifier rejects tampering; two fresh runs compare byte-for-byte | authority receipt |
| L2 isolation fence | Can the prototype prove it left governed selectors unchanged? | `SWU-OCGP-007` | protected digest set unchanged plus denied-write probe | host/sandbox security |
| L3 inspection surface | Can a human inspect the completed JSON without changing its meaning? | deferred; no SWU | future automated parity plus named human review | active Plan |
| L4 product adapter | Can repaired IOLM consume the candidate contract? | deferred; no SWU | separate adapter parity and product-owner receipt | current prototype |

## Layer Gates

| Gate | Required evidence | Failure behavior |
| --- | --- | --- |
| `G-OCGP-L0A` | `SWU-OCGP-001` terminal receipt and passing carrier tests | no graph-law work |
| `G-OCGP-L0B` | `002` and `003` receipts; negative fixtures fail closed | no policy work |
| `G-OCGP-L0C` | `004` and `005` receipts; O13 expected projection matches | no evidence writer |
| `G-OCGP-L1` | `006`, `008`, and `009`; receipt verifies and canonical bodies are byte-identical across fresh roots | no L1 claim |
| `G-OCGP-L2` | `007`; every protected digest unchanged and write denied | minimum prototype incomplete |
| `G-OCGP-L3` | separate approved Plan and human acceptance | no report claim |

## Minimum Workable Unit

L0A through L2 recompose into the minimum candidate prototype:

```text
carrier
  → graph grammar and grounding
  → finite policy disposition
  → research-lineage projection
  → canonical create-only evidence
  → protected-input isolation
  → independent verification
```

None of the parts alone is a working ontology. Completion of all active layers
would establish only a private, finite, reproducible ontology-oriented
candidate-graph prototype.

## Value/Cost Decisions

- Schema and graph law are split because a carrier parser can be accepted
  independently from relation semantics.
- Edge grammar and grounding are split because endpoint tables do not require
  transitive closure or cycle detection.
- Policy and projection are split because disposition is normative while the
  projection is a read model.
- Writer and independent verifier are split so the producer cannot certify its
  own evidence.
- Isolation is its own layer because digest preservation and denied-write
  capability are not implied by deterministic serialization.
- Static HTML is deferred: it adds inspection value but is unnecessary to
  establish L0–L2 runtime trust.
