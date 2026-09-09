# Ontology Projections

Status: candidate
Owner: CyberAlchemy v2 ontology route

## Purpose

Projections are read models over source evidence, authority envelopes, owner
decisions, and ontology candidates. They help search, review, and downstream
construction. They do not create authority.

## Allowed Projection Inputs

- source refs and import candidates
- inventory evidence cards or sets
- ontology candidate entries
- authority artifact lifecycle envelopes
- owner decisions or PromotionRecord-compatible records
- validation or ledger evidence after its owner permits use

## Projection Record Shape

```yaml
projection_id:
source_refs:
candidate_refs:
authority_artifact_refs:
owner_decision_refs:
projection_kind:
allowed_use:
blocked_use:
drift_owner:
expiry_or_review_trigger:
residue:
```

## Projection Kinds

| Kind | Use | Blocked use |
| --- | --- | --- |
| `candidate-map` | Show candidate concepts and relations. | Authority verdict. |
| `review-index` | Help owners find candidates needing review. | Silent promotion queue mutation. |
| `authority-state-read-model` | Show owner-approved state. | Replace canonical authority files. |
| `drift-watch` | Surface drift or stale projections. | Resolve drift. |
| `downstream-guide` | Help consumers construct above the base. | Public release guarantee. |

## Emission Rule

A projection may emit owner-approved state only when the owner decision permits
the use scope. Blocked, deferred, or unknown candidates may appear only as such.

## Gate Result

Status: flag

Reason: projection shape is ready for manual read models, but generated
projection runtime remains gated by schema, validation, and task-session.
