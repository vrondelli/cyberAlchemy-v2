---
module: interactive-ontology-learning-map
status: candidate
updatedAt: 2026-07-14
docType: ux-plan
scope: private
---

# Interactive Ontology Learning Map — UX Plan

## Experience objective

Help a learner answer “what is this, why is it connected, what supports it, who can decide it, and what should I learn next?” without decoding the repository or mistaking an instructional edge for a semantic/authority relation.

## Primary audiences

| Audience | Need | Failure to avoid |
|---|---|---|
| New contributor | coherent entry from method to concrete feature | wall of undifferentiated nodes |
| Implementer | exact source, type, relation, acceptance, and residue | philosophy presented as implementation proof |
| Governance reviewer | owner, authority effect, decision/gate, challenge | adjacency presented as approval |
| Researcher | claim class, proof domain, evidence scope, counterevidence | analogy presented as theorem |

## Journey J-01: intention to residue

Focus question: **How does intention become an artifact, and what happens when translation leaves residue?**

1. Start at Craft intention with a plain definition and exact source.
2. Follow “represented through” to schema.
3. Inspect the situated translator and explicit no-isomorphism warning.
4. Open artifact/data and compare schema fidelity with instance fidelity.
5. Reveal validation and residue choices.
6. See repair, owner route, child context, or accepted named residue.
7. Recompose to the parent while preserving evidence and responsibility.
8. Open formal, analogy, philosophical, and speculative cards as separate lenses.
9. Complete by identifying source/concept, schema/runtime, analogy/formal-result, and projection/promotion distinctions.

## Journey J-02: typed DomainSpec relation

Focus question: **Why is one relation admitted and another rejected?**

1. Open `PipelineRouteTemplate` and `StageContract` from the registry.
2. Inspect `contains`, its source-local label, endpoints, and anchor.
3. Compare `AssemblePipelineRoute --enforces--> StageContract`.
4. See the attempted relation as patterned residue with the endpoint reason.
5. Toggle semantic-only: the rejected row stays out of semantic relations but remains in the challenge/residue lens.
6. Open Financial Settlement as a positive comparison while retaining the documentary/runtime distinction.

## Information architecture

| Surface | Primary question | Required content |
|---|---|---|
| Overview | What can I learn here? | focus questions, journeys, source scope, candidate warning |
| Spatial map | What is near this concept under this lens? | bounded neighborhood, labeled edges, legend, filters |
| Hierarchy | What is the authored sequence/containment? | semantic headings, disclosures, keyboard navigation |
| Relation table | Exactly what connects these records? | endpoints, label, plane, semantic flag, source, authority effect |
| Detail | What is this and why linked? | definition, kinds, statuses, claim/proof, owner, sources, challenge |
| Challenge view | What could change this claim/status? | evidence, assumptions, counterevidence, residue, owner route |

## Interaction grammar

- Select node/row: preserve stable ID across lenses.
- “Why linked?”: show relation label, endpoints, source, semantic flag, authority effect, and validation posture.
- Toggle planes: filter presentation only; never rewrite the snapshot.
- Semantic-only: hide learning/navigation edges and prove relation table/hash unchanged.
- Follow journey: advance authored sequence while keeping semantic neighborhood inspectable.
- Open source: use a manifest-resolved anchor; reject arbitrary paths.
- Compare: place two records/relations side by side with independent axes.
- Challenge: show evidence movement conditions; never emit an owner verdict.

## Visual and language grammar

Every object carries text: `SOURCE`, `CONCEPT`, `FORMAL MODEL`, `ANALOGY`, `PHILOSOPHICAL THESIS`, `SPECULATIVE HORIZON`, `GOVERNANCE`, `RESIDUE`, or `LEARN NEXT`. Edge labels are full linking phrases. Shape, pattern, and color reinforce labels but never replace them. Central placement means “current focus,” not importance or truth.

## Accessibility contract

- Spatial and non-spatial surfaces are co-primary.
- No general graph is mislabeled as an ARIA tree.
- Every pan, zoom, select, and inspect action has a non-drag alternative.
- Real hierarchy disclosures use buttons and expose expanded state.
- Focus follows authored reading order, not coordinate order.
- Selection changes are announced without flooding a live region.
- Reduced motion disables traversal animation without losing state.
- Touch journeys require no precision gesture.
- Screen-reader testing covers both journeys plus source/challenge inspection.
- Color is never the only carrier of plane, status, proof, or authority.

## Comprehension evidence

The pilot records whether users distinguish source artifact/concept, learner edge/semantic relation, source-local relation/CAV2 morphism, verification/proof/runtime evidence, owner route/decision, projection/promotion/publication, and operational/formal/analogical/philosophical/speculative claims.

## UX acceptance evidence

| Evidence | Minimum condition |
|---|---|
| Information parity diff | identical addressable record/relation set across graph, hierarchy, and table |
| Keyboard journey | both journeys complete without pointer/drag |
| Touch journey | both journeys complete without precision gesture |
| Reduced-motion run | no essential information depends on animation |
| Screen-reader run | both journeys complete with named browser/AT versions |
| Comprehension pilot | rubric and raw responses retained; no predetermined success claim |
| Visual semantics audit | labels and authority effect remain visible without color |

## Deferred UX

Accounts, progress sync, bookmarks, collaboration, adaptive sequencing, and analytics require separate privacy/product decisions. Public-facing language and information architecture are not derived by redacting this private plan.
