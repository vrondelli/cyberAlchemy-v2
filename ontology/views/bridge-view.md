# Bridge View

Status: candidate
Owner: CyberAlchemy v2 ontology route

## View Role

This view connects candidate meaning to evidence, owner routes, promotion
requests, and projections. Its job is to prevent two failures at once:

- meaning detached from evidence;
- evidence or proximity pretending to be authority.

## Bridge Chain

```text
source artifact
  -> selector/import/evidence card
  -> ontology candidate
  -> owner gate request
  -> PromotionRecord-compatible decision
  -> authority artifact or blocked/deferred record
  -> optional projection
```

## Bridge Records

| Record | Required fields | Owner |
| --- | --- | --- |
| Evidence bridge | `source_refs`, `evidence_role`, `posture`, `confidence`, `residue` | inventory / source owner |
| Candidate bridge | `candidate_id`, `concept_ref`, `relations`, `owner_route`, `promotion_request` | ontology route |
| Gate bridge | `request_id`, `owner_route`, `requested_transition`, `blocking_questions` | relevant owner route |
| Projection bridge | `projection_id`, `source_decision`, `allowed_use`, `expiry_or_drift_owner` | ontology route plus owner permission |

## Authority-By-Proximity Kill List

The following do not promote anything:

- moving a file into `ontology/`;
- citing a source in a view;
- adding a candidate relation;
- adding a projection row;
- making a branch map;
- creating a promotion request;
- adding a ledger witness before validator/schema approval.

## Residue Handling

| Residue kind | Route |
| --- | --- |
| Missing definition | definitions-governance |
| Missing structural rule | constitution-governance |
| Missing recurring practice | discipline-governance |
| Owner conflict | decision-gate |
| Schema or edge gap | schema governance |
| Implementation readiness gap | invoke plan / task-session after owner gates |

## Use Guidance

Use this view to decide what bridge evidence is still missing before a candidate
can ask an owner route to review it.
