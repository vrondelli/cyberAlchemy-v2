# Queries

| Query | Result | Notes |
|---|---|---|
| `GET /v1/snapshots/{id}` | snapshot envelope and view references | immutable; canonical metadata excludes `generatedAt` |
| `GET /v1/entities/{id}` | record with source, claim, authority, challenge details | stable identity |
| `GET /v1/entities/{id}/neighborhood` | bounded typed neighborhood | depth/facets validated and capped |
| `GET /v1/claims/{id}` | claim posture, evidence, proof scope, assumptions | proof nullable |
| `GET /v1/search` | stable ranked IDs and matched fields | deterministic index |
| `GET /v1/journeys/{id}` | focus question, steps, propositions, completion checks | learner-only edges explicit |
| `GET /v1/sources/{id}/anchors/{anchor}` | allowed exact source locator and excerpt policy | no unrestricted filesystem read |

No POST, PUT, PATCH, DELETE, mutation subscription, owner decision, or publication endpoint is in scope.
