# Ontology View

Status: candidate
Owner: CyberAlchemy v2 ontology route

## View Role

This view represents candidate meaning: what authority objects are, how they
relate, what evidence supports them, which owner route governs them, and what
residue remains.

## Source Contracts

| Source | Use |
| --- | --- |
| [../../authority/definitions/DEFINITIONS.md](../../authority/definitions/DEFINITIONS.md) | Local vocabulary for ontology, typed coupling, residue, and CyberAlchemy v2. |
| [../NODE-MODEL.md](../NODE-MODEL.md) | Candidate authority object concepts. |
| [../RELATION-MODEL.md](../RELATION-MODEL.md) | Candidate authority relation predicates. |
| [../AUTHORITY-KINDS.md](../AUTHORITY-KINDS.md) | Authority classification model. |
| [../AUTHORITY-POSTURES.md](../AUTHORITY-POSTURES.md) | Reliance posture model. |

## Allowed Claims

- Candidate meaning for authority objects.
- Candidate relation semantics with endpoints and owner routes.
- Confidence and posture distinctions when source-backed.
- Promotion request preparation.
- Residue and drift routing.

## Forbidden Claims

- Canonical definition mutation.
- Constitution rule mutation.
- Runtime contract creation.
- Live vault `node_type` or edge creation.
- Promotion verdicts.
- Public/private release decisions.

## Minimal Entry Shape

```yaml
entry_id:
label:
concept_ref:
source_refs:
relations:
authority_kind:
authority_posture:
owner_route:
candidate_status:
promotion_request:
residue:
use_guidance:
```

## Use Guidance

Use this view when a downstream agent or human asks what an authority object
means, where it came from, what it can rely on, and which owner must decide its
promotion.
