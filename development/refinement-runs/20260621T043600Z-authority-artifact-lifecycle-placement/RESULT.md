# Refine Result - Authority Artifact Lifecycle Placement

Status: pass
Target: `cyberAlchemy-v2`
Preset: standard
Research: research-if-gap-appears, local-only
Run ID: 20260621T043600Z-authority-artifact-lifecycle-placement

## Result

Definitions, constitutions, and disciplines lifecycle should not be inside
ontology as authority.

Ontology should be allowed to represent and query lifecycle state, provenance,
meaning, confidence, source links, owner-route pointers, and promotion requests.
But lifecycle transitions belong to the artifact's owner route:

- definitions-governance for definitions,
- constitution-governance for constitutions,
- discipline-governance for disciplines,
- decision-gate for contested ownership, public/private posture, source
  conflict, naming scope, and reuse scope,
- `PromotionRecord` or owner decision for promotion verdicts,
- task-session only after owner gates pass.

## Core Model

```text
SourceArtifact(s)
  -> import/evidence staging
  -> authority_artifact_lifecycle_envelope
  -> owning governance route
  -> owner decision / PromotionRecord
  -> authority artifact
  -> optional ontology projection/read model
```

Ontology appears as a candidate/projection layer. It does not become the
lifecycle owner.

## Why Not Put Lifecycle Inside Ontology?

Putting lifecycle inside ontology would create these failure modes:

- authority-by-proximity returns,
- ontology edges become fake promotion gates,
- generated maps/read models start to look canonical,
- multi-source artifacts collapse into a single origin,
- definitions, constitutions, and disciplines lose their different owner routes,
- public/private review can be bypassed by graph projection,
- deprecation and supersession become query facts instead of governed
  decisions.

## Authority Artifact Lifecycle Envelope

Use this as the design unit for later governance work:

```yaml
artifact_id:
artifact_kind: definition | constitution | discipline | spec | decision | other
authority_owner: definitions-governance | constitution-governance | discipline-governance | decision-gate | other
current_status: source-evidence | import-candidate | review-candidate | blocked | active | drift-flagged | superseded | deprecated
sources:
  - source_id:
    source_path:
    source_family:
    source_authority_posture: original-authority | evidence | template | research | generated | unknown
    origin_role: authoring-source | precedent | derivative-source | conflict-source | validation-source
    extraction_scope:
    semantic_delta:
    public_private_posture:
    confidence:
promotion:
  gate_route:
  promotion_record:
  verdict:
  decided_by:
  decided_at:
conflicts:
  - source_id:
    conflict_kind:
    resolution_status:
drift_owner:
ontology_refs:
  candidates:
  projections:
```

This envelope should live beside the authority artifact or in the owning
governance route's evidence package. Ontology can reference it through
`ontology_refs`, candidate maps, and generated projections.

## Artifact-Kind Lifecycle Matrix

| Artifact kind | Owner route | Lifecycle states | Ontology role |
| --- | --- | --- | --- |
| definition | definitions-governance | source evidence -> import candidate -> review candidate -> authority promotion queue -> active local definition -> drift-flagged -> superseded/deprecated/promoted beyond local scope | represent term meaning, source support, semantic delta, drift status, and promotion request |
| constitution | constitution-governance | source evidence -> import candidate -> rule/pack candidate -> candidate local constitution -> active local constitution -> split/derived/promoted -> superseded/deprecated | represent rule family, source support, conflict posture, and promotion request |
| discipline | discipline-governance | observed recurring practice -> candidate -> active-pattern -> implemented -> canonical -> deprecated | represent practice meaning, recurrence evidence, validation posture, and hardening route |

## Multi-Provenance Rule

Definitions and constitutions can have more than one provenance, origin, or
source. That is expected.

The rule is:

```text
many sources support one authority artifact;
the owner route decides the canonical synthesis;
ontology may show the support graph;
ontology does not decide the synthesis.
```

## Stage Evidence

| Stage | Verdict | Artifact |
| --- | --- | --- |
| Context Builder evidence baseline | pass | `context-builder/context-pack.md` |
| Invoke Define | pass | `stages/02-invoke-define.md` |
| Interrogation refine-review | pass | `stages/03-interrogation-refine-review.md` |
| Research decision | pass | `stages/04-research-decision.md` |
| Distill | pass | `stages/05-distill.md` |
| Invoke Redefine / Design | pass | `stages/06-invoke-design.md` |
| Interrogation refine-design-review | flag, repaired | `stages/07-interrogation-design-review.md` |
| Distill Repair | pass | `stages/08-distill-repair.md` |
| Invoke Plan | pass | `stages/09-invoke-plan.md` |
| Final Interrogation and Synthesis | pass | `stages/10-final-interrogation-and-synthesis.md` |

## Subagent Evidence

| Role | Verdict | Receipt |
| --- | --- | --- |
| ontology-boundary-critic | KEEP | `subagents/ontology-boundary-critic.md` |
| lifecycle-governance-designer | KEEP | `subagents/lifecycle-governance-designer.md` |
| provenance-model-skeptic | FIX | `subagents/provenance-model-skeptic.md` |

## Recommended Next Routes

1. Run constitution-governance to define the artifact-kind lifecycle matrix and
   gate rules.
2. Run definitions-governance for provenance vocabulary only.
3. Run discipline-governance for discipline-specific provenance and lifecycle
   fields.
4. Run decision-gate for contested source ownership, public/private posture,
   source conflicts, naming scope, or reuse scope.
5. Run task-session only after those owner routes pass, to materialize schemas,
   fixtures, relation rows, or generated projections.

## Blocked Work

- Do not mutate ontology first.
- Do not promote ARR as a relation family.
- Do not implement a lifecycle schema before governance routes pass.
- Do not let ontology projection replace owner decisions or `PromotionRecord`.
