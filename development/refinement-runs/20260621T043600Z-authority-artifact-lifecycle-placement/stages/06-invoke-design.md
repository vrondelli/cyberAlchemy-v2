# Stage 06 - Invoke Design

Status: pass
Capability: invoke
Mode: design
Run ID: 20260621T043600Z-authority-artifact-lifecycle-placement

## Design Decision

Do not place definitions, constitutions, or disciplines lifecycle inside
ontology.

Place lifecycle in an authority artifact lifecycle envelope owned by the
artifact's governance route. Let ontology represent the envelope as a queryable
candidate/read-model projection.

## Two-Plane Model

```text
Governance Plane
  authority_artifact_lifecycle_envelope
    -> artifact owner route
    -> source/provenance set
    -> conflict/drift status
    -> promotion gate
    -> owner decision / PromotionRecord

Ontology Plane
  ontology candidate / branch map / projection
    -> represents meaning
    -> mirrors provenance refs
    -> mirrors lifecycle state
    -> requests promotion
    -> never decides promotion
```

## Lifecycle Matrix

| Artifact kind | Owner route | Candidate source | Lifecycle states | Ontology role |
| --- | --- | --- | --- | --- |
| definition | definitions-governance | definition imports, glossaries, source clusters, reviewed terms | source evidence -> import candidate -> review candidate -> authority promotion queue -> active local definition -> drift-flagged -> superseded/deprecated/promoted beyond local scope | represent term meaning, source support, semantic delta, drift status, and promotion request |
| constitution | constitution-governance | constitution imports, axiom sources, rule families, import packs | source evidence -> import candidate -> rule/pack candidate -> candidate local constitution -> active local constitution -> split/derived/promoted -> superseded/deprecated | represent rule family, source support, conflict posture, and promotion request |
| discipline | discipline-governance | observed practice, discipline catalog/card, recurring-use evidence | observed recurring practice -> candidate -> active-pattern -> implemented -> canonical -> deprecated | represent practice meaning, recurrence evidence, validation posture, and hardening route |

## Authority Artifact Lifecycle Envelope

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

## Placement Rules

1. The lifecycle envelope belongs beside the owning authority artifact, not
   inside ontology as the source of authority.
2. Ontology may reference or project lifecycle envelope fields for search,
   navigation, confidence review, and promotion requests.
3. Multiple provenance entries are normal. A canonical artifact should not be
   forced into a single-origin field when it is synthesized from multiple
   sources.
4. Conflicting provenance blocks promotion until a decision-gate or owner route
   resolves it.
5. Unknown source authority can support search or flagged candidate staging, but
   cannot support promotion.
6. Generated maps and ontology projections must link back to the lifecycle
   envelope and owner decision; they do not replace them.

## Design Verdict

Pass. The model answers the user question and keeps the work non-executed.
