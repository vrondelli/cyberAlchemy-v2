---
module: r3-l2-relationship-hardening
status: draft
updatedAt: 2026-07-02
docType: glossary-consistency-report
---

# Glossary Consistency Report

> **2026-07-11 supersession:** The accepted Saga collapse cancels every Saga-law
> hardening route in this document. Saga-specific design text below is retained
> as historical planning evidence only; `WORK-PACK.md` owns the active route.


This report checks the design vocabulary against current R3 relationship authority and the two research
finding packets. It records candidate wording only; it does not promote definitions.

| Term | Current Meaning In This Package | Consistency Status | Action |
| --- | --- | --- | --- |
| first-class authority | A root-owned distinction that changes validation, derivation, composition, projection, owner route, or generated artifact. | pass | Reuse research wording. |
| root relationship authority | `definitions/relationships/relationships.yml` plus human companion. | pass | Keep placement settled. |
| relationship signature | A finite machine relation with id, endpoints, direction, multiplicity, scope, inverse policy, status, semantics, examples, obligations, composition, and projection. | pass | Harden with `signature_key`. |
| `id` | Author-facing edge verb used in spec graph rows. | pass with clarification | Do not treat as unique machine row identity. |
| `signature_key` | Proposed unique machine identity for one active signature row. | new candidate | Add in implementation pass; no glossary promotion yet. |
| typed composable graph fragment | Current R3 wording for finite typed relation law without full category axioms. | pass | Keep this wording. |
| category law | Future formal law with identities, legal composition, closure, associativity, path equations, and preservation. | deferred | Do not promote in R3H. |
| generated view | Reverse/navigation view that is not an authored canonical edge, for example `owned-by`. | pass | Preserve existing policy. |
| `owns` | Entity-to-Entity authority/custody/write-responsibility relation. | pass with hardening | Add observable `authority_effects`. |
| `belongs-to` | Entity-to-Entity membership, classification, or home-assignment relation distinct from `owns^-1`. | flag -> plan repair | Add `semantic_kinds` and examples/non-examples. |
| Saga orchestration | Cross-feature ordered operation coordination with participants and compensation obligations. | flag -> plan repair | Add structural `saga_obligations`. |
| deferred residue | Named relation candidate that lacks a current finite witness or validation consequence. | pass | Keep deferred candidates visible. |

## Consistency Decisions

- `Operation --[enforces]--> Value Object` remains invalid; no R3H task promotes operation return values as edges.
- `owned-by` remains a generated view for `owns`; it is not an authored graph edge.
- `belongs-to` remains distinct from `owned-by`.
- `depends-on` remains deferred until a dependency kind, cycle/order law, and reject/allow witness exist.

## Open Glossary Notes

- `signature_key` may later deserve a canonical definition if implementation proves the identity field is stable across validators and projections.
- `semantic_kinds` may later become a general pattern for polysemy-governed relations, but this pass applies it only to `belongs-to`.
