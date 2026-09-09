# Branch As View

Status: candidate
Owner: CyberAlchemy v2 ontology route

## Definition

In this package, a branch is an interpretive view over cited artifacts and
evidence. A branch is not a canonical ontology branch, vault node type,
lifecycle state, schema namespace, or promotion route by itself.

## Branch Contract

Every branch view must record:

| Field | Meaning |
| --- | --- |
| `branch_id` | Stable local identifier for the view. |
| `view_role` | Meaning, system, bridge, evidence, projection, or promotion-request staging. |
| `source_refs` | Concrete paths used by the branch. |
| `allowed_readings` | What the branch may claim. |
| `forbidden_authority_moves` | What the branch may not decide. |
| `owner_route` | Route that owns promotion if branch content becomes load-bearing. |
| `residue` | Known gaps, conflicts, or deferred decisions. |

## Initial Branches

| Branch | View role | Source refs | Owner route |
| --- | --- | --- | --- |
| `authority-model` | ontology | [PACKAGE-MODEL.md](PACKAGE-MODEL.md), [NODE-MODEL.md](NODE-MODEL.md), [RELATION-MODEL.md](RELATION-MODEL.md) | package review, then relevant owner route |
| `authority-lifecycle` | bridge | [LIFECYCLE-MODEL.md](LIFECYCLE-MODEL.md), [../authority/promotion-policy.md](../authority/promotion-policy.md) | constitution-governance / decision-gate |
| `authority-classification` | ontology | [AUTHORITY-KINDS.md](AUTHORITY-KINDS.md), [AUTHORITY-POSTURES.md](AUTHORITY-POSTURES.md) | definitions-governance before canon |
| `runtime-projection` | system | [projections/README.md](projections/README.md), [views/system-view.md](views/system-view.md) | task-session only after gates |
| `promotion-staging` | bridge | [promotion-requests/README.md](promotion-requests/README.md) | relevant owner route |

## Forbidden Collapses

- Branch name -> owner route.
- Branch view -> vault `node_type`.
- Branch membership -> promotion state.
- Branch map -> source authority.
- Bridge branch -> movement edge.

## Use Rule

Use branch views to ask better questions. Do not use them to answer authority
questions without an owner gate.
