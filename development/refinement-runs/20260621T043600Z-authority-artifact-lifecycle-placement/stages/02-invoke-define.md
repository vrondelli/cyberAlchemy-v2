# Stage 02 - Invoke Define

Status: pass
Capability: invoke
Mode: define
Run ID: 20260621T043600Z-authority-artifact-lifecycle-placement

## Defined Concern

Determine whether the lifecycle of definitions, constitutions, and disciplines
belongs inside ontology, or whether ontology should only represent lifecycle
state and provenance while artifact-specific governance routes own lifecycle
transitions.

## Working Terms

| Term | Working meaning | Owner posture |
| --- | --- | --- |
| authority artifact | A definition, constitution, discipline, decision, spec, or other artifact that can constrain future work. | Artifact-specific governance route. |
| lifecycle | State movement from source/candidate through review, promotion, active use, drift, replacement, deprecation, or retirement. | Owning governance route plus decision/promotion records. |
| ontology representation | Queryable meaning map, provenance links, branch placement, candidate status, and relation witnesses. | Ontology route, non-authority until promoted. |
| provenance set | One or more source artifacts, origins, import candidates, evidence cards, or source digests that support an authority artifact. | Evidence owner and target governance owner. |
| promotion event | Owner-gated transition from candidate/evidence into local authority or governed projection. | `PromotionRecord` or decision route. |

## Boundary Definition

Ontology is allowed to describe an authority artifact and its lifecycle state.
Ontology is not allowed to own the lifecycle transition that makes the artifact
canonical, active, deprecated, or retired.

## Input Evidence

- `cyberAlchemy-v2/authority/README.md`: authority lives in the narrowest
  responsible surface.
- `cyberAlchemy-v2/ontology/README.md`: ontology prepares promotion requests
  but cannot promote itself.
- `cyberAlchemy-v2/authority/imports/README.md`: scattered sources are staged as
  candidates before owner-route promotion.
- `cyberAlchemy-v2/authority/promotion-policy.md`: definitions-governance,
  discipline-governance, constitution-governance, decision-gate, and
  task-session are distinct gates.

## Definition Verdict

Pass. The refinement target is defined enough to proceed locally. No external
research is needed before design because the repository already states the
authority separation and non-promotion rules.

## Residue

The final model must still decide the exact fields that carry multiple
provenance/origin/source references without creating a new schema mutation.
