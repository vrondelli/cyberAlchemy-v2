---
artifact_id: UIF-REPAIR-INVENTORY-LOOKUP-v0.1
status: accepted-input
created: 2026-07-11
mode: inventory-lookup
authority_boundary: non-authority read model
---

# Inventory Lookup: UI Findings Repair Precedents

## Question

Which existing DomainSpec patterns can be reused to repair the accepted UIF-010
findings without turning candidate shape validation into semantic or promotion
authority?

## Selected Matches

| Precedent | Reusable contribution | Obligation fit |
| --- | --- | --- |
| [Meta-type validation formalism](../../../../meta-type-formalization/research/2026-07-02-formalism-and-primitives/findings.md) | Structural schema/table-walk validation is decidable and deliberately validates shape, not meaning. | Keep nonempty/value validation mechanical while semantic identity remains a separate witness obligation. |
| [R3 edge-law formalization review](../../../../../reformulate-batch1/reviews/2026-07-02-r3-edge-law-formalization/findings.md) | Root-owned finite signatures, forbidden endpoint fixtures, and counterexample-based negative validation. | Model neighbor rerouting as source rejection plus a finite destination contract, including explicit external destinations. |
| [First-class category boundary](../../../../../research/2026-07-02-first-class-category-boundary/findings.md) | Stable contrast, examples/non-examples, typed obligations, validation consequences, and owner decision pressure. | Define what a non-label-derived separating witness must prove before a UI candidate can survive. |
| [Saga existing-evidence adjudication](../../../../ds-d1-improvement-plan/research/2026-07-11-saga-existing-evidence-adjudication/findings.md) | Finite non-circular witness requirement, build-from-owned collapse default, and typed-negative preservation. | Prevent candidate labels or authored fields from serving as their own identity evidence. |
| [UI11 meta-type review](../../../../ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/findings.md) | DS-D8 endpoint use is pressure, not DS-D1 formation authority; complete card/schema/fixture/test twins remain mandatory. | Preserve the relationship-owner boundary for Action, Hook, Guard, and Binding. |
| [UIF-010 accepted findings](../../../../ui-meta-type-formalization/replication/findings.md) | Critical/major repair obligations and zero-survivor boundary. | Defines the exact repair acceptance surface and forbids premature UIF-011 routing. |

## Candidate Solution Families For Research

1. Versioned nonempty-value predicate semantics instead of silently changing
   global `attribute-present` behavior.
2. A deterministic criterion-by-mutation evidence ledger covering deletion,
   empty, whitespace, wrong fixed value, and applicable conflicts.
3. A bidirectional reroute receipt: source rejection, declared destination,
   destination acceptance when locally testable, or an explicit external-owner
   handle.
4. A finite separating-witness dossier whose evidence is independent of the
   candidate label and authored criterion names.
5. A corpus normalization receipt that preserves source excerpts, observed
   facts, omitted attributes, provenance, and prohibited inference.
6. A bounded DS-D8 owner packet for externally owned relationship questions.
7. A versioned rerun/invalidation envelope that preserves UIF-008 through
   UIF-010 history while producing new evidence.

## Excluded Matches

- Ontology-lifecycle and product-validation entries were excluded because they
  do not directly define DS-D1 candidate formation or replication mechanics.
- UI framework conventions were excluded as authority; they may supply corpus
  observations only.
- Existing positive fixture success was excluded as proof of type identity.

## Inventory Gaps

- No inventoried DomainSpec precedent currently supplies one complete UI
  candidate repair pipeline from nonempty rule through independent replication.
- No accepted artifact yet defines the normalized empirical receipt schema.
- No current candidate harness persists the full mutation and destination map.
- The correct boundary between a new candidate-local nonempty predicate and a
  global validator semantic change remains a research/design question.

## Downstream Lookup Output

Use the six selected precedent families and seven candidate solution families
as the bounded source set for the governed research dispatch. Accepted research
must feed Invoke define/design/plan; it must not directly mutate candidate or
authority surfaces.
