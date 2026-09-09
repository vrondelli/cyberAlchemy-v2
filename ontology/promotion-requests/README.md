# Promotion Requests

Status: candidate
Owner: CyberAlchemy v2 ontology route

## Purpose

Promotion requests stage candidate meaning for owner review. A request is not a
verdict, not a PromotionRecord-compatible decision, and not an authority
artifact.

## Request Shape

```yaml
request_id:
candidate_id:
requested_transition:
target_authority_kind:
owner_route:
source_refs:
evidence_summary:
semantic_delta:
conflicts:
public_private_posture:
projection_requested:
blocking_questions:
residue:
```

## Request Types

| Request type | Target owner | Example |
| --- | --- | --- |
| `definition-request` | definitions-governance | Promote a load-bearing term. |
| `constitution-request` | constitution-governance | Promote a structural rule. |
| `discipline-request` | discipline-governance | Promote a recurring practice. |
| `decision-request` | decision-gate | Resolve owner, naming, scope, or public/private dispute. |
| `schema-request` | schema governance / decision-gate | Change live node, relation, lifecycle, or edge schema. |
| `implementation-request` | task-session after gates | Implement a ready bounded work unit. |

## Request Lifecycle

```text
draft-request
  -> owner-review
  -> accepted-for-review | deferred | blocked | rejected
  -> owner decision / PromotionRecord-compatible record
```

The request lifecycle is local workflow state. It does not replace the owner
route's lifecycle.

## Ledger As Primitive Witness

`Ledger as Primitive` may be staged as a `definition-request` only if the
request states that the witness is non-authoritative, cites the owner gate, and
keeps ledger graph or movement-edge work deferred until the required validators
and schema routes exist.

## Gate Result

Status: pass

Reason: staging requests is within ontology package scope as long as every
request names an owner route and avoids verdict language.
