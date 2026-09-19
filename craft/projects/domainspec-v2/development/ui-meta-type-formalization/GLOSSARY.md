---
module: ui-meta-type-formalization
status: candidate
updatedAt: 2026-07-11
docType: glossary
authority_boundary: local package vocabulary; no canonical promotion
---

# Glossary: UI Meta-Type Formalization

| Term | Local meaning | Status / source |
| --- | --- | --- |
| UI label | One of the 11 names currently used as deferred DS-D1 candidates and DS-D8 endpoints. | linked to `CANDIDATES.md`; non-authoritative |
| Formation criterion | A bounded predicate that decides whether a specimen is structurally a well-formed candidate type. | linked to existing meta-type formalization method |
| Candidate schema | A `.schema.yml` drafted under development after experiments survive; it is not canonical DS-D1 authority. | package-local |
| Separating witness | One specimen pair for which the same validator accepts the candidate and rejects or reroutes its nearest neighbor. | linked to node non-collapse findings |
| Collapse fixture | A nearest-neighbor specimen designed to reveal that two labels share the same constructible structure. | package-local experimental term |
| Correction contract | The smallest change that makes an invalid specimen valid or routes it to the correct type. | linked to DS-D1 registry challenge/confirm convention |
| Constructibility | Whether the criterion can be expressed with bounded public structural predicates without running the application or private engine. | linked to formalism findings |
| Portability | Whether the formation law survives at least two framework styles or is explicitly framework-neutral. | package-local experiment dimension |
| Graph coherence | Whether candidate instances can exercise active DS-D8 signatures without using those signatures as formation authority. | linked to UI11 review boundary |
| Candidate-schema-ready | Provisional evidence result allowing candidate card/schema drafting and owner review. | package-local; non-promoting |
| Merge-candidate | Result that an existing DS-D1 type covers the label without a defensible separating witness. | package-local; owner decides any merge |
| Relation-not-node | Result that the useful distinction is better represented as an edge or data-flow relation than as node formation. | package-local; DS-D8 owner route required |
| Framework vocabulary | Useful implementation terminology whose formation law does not generalize beyond a framework idiom. | package-local |
| Split-candidate | Result that one label conflates multiple candidate formation laws. | package-local; design follow-up required |
| Promotion packet | Evidence-only handoff containing criteria, fixtures, test results, portability, risks, and residue for definitions-governance. | package-local; does not promote |

## Consistency Notes

- `Page`, `Layout`, `Component`, `View Model`, `Hook`, `Form`, `Action`,
  `Guard`, `Binding`, `Adapter`, and `State Indicator` retain their spelling from
  the current candidate list. This glossary does not redefine them.
- `Mapping`, `Rule`, `Operation`, `Query`, `Interface`, `Entity`, `Value Object`,
  and `State Machine` refer to current DS-D1 candidates and are used only as
  comparison targets.
- `renders`, `wraps`, `composes`, `consumes`, `submits`, `shapes`, `protects`,
  `displays`, `fetches`, `mutates`, `reflects`, `derives`, `contracts`, and
  `mirrors` refer to active DS-D8 relationship records. Their endpoint use does
  not promote UI labels.

## Glossary Consistency

Status: `linked` for existing formalization and relationship terms; `candidate`
for package-specific experiment outcomes. No upstream glossary mutation is
requested by this package.
