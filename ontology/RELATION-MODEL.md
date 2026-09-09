# Relation Model

Status: candidate
Owner: CyberAlchemy v2 ontology route

## Purpose

This file defines candidate relation predicates for authority modeling. These
relations are package model predicates and projection-row predicates only. They
are not vault `## Connections`, executable edge-family additions, or movement
edges.

## Relation Contract

Every candidate relation must record:

| Field | Required | Meaning |
| --- | --- | --- |
| `relation_id` | yes | Local relation identifier. |
| `source_concept` | yes | Source endpoint concept or record. |
| `target_concept` | yes | Target endpoint concept or record. |
| `direction` | yes | Directed, symmetric, or view-only. |
| `owner_route` | yes | Owner route for promotion or schema effect. |
| `evidence_refs` | yes | Paths supporting the relation. |
| `authority_effect` | yes | none, staging, projection, owner-decision, or blocked. |
| `forbidden_collapse` | yes | What this relation must not become. |

## Value-Cycle Guard

Before any candidate relation is promoted into a schema, edge catalog,
movement-edge family, validator, or authority transition, review it against
[CAV2-D28 value-cycle edge guard](../authority/definitions/DEFINITIONS.md#cav2-d28-value-cycle-edge-guard)
and [CAV2-C13](../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md#cav2-c13-value-cycle-edge-guard).

The review must classify:

- `value_effect`: `value-free`, `value-constraining`, or `unknown`
- `cycle_policy`: `acyclic`, `cycle-permitted`, or `unknown`

If `value_effect` is `value-constraining` and `cycle_policy` is
`cycle-permitted`, the relation is blocked until schema governance records a
contextuality-obstruction review and an explicit exception. Unknown values are
typed residue, not permission.

## Allowed Candidate Relations

| Relation | Source -> Target | Effect | Forbidden collapse |
| --- | --- | --- | --- |
| `classifies_authority_kind` | authority envelope -> authority kind | staging/projection | Not a vault type assertion. |
| `declares_source_posture` | source ref -> authority posture | staging/projection | Not trust by tag. |
| `uses_owner_profile` | authority envelope -> owner route | staging | Not a shared promotion default. |
| `requests_promotion_gate` | ontology candidate -> owner route | staging | Not a verdict. |
| `uses_lifecycle_axis` | ontology candidate -> authority lifecycle axis | projection | Not a D23 alias, not an ontology verdict, not promotion by generated mirror. |
| `decides_transition` | owner decision -> PromotionRecord-compatible record | owner-decision | Not an ontology decision. |
| `emits_projection_when_allowed` | PromotionRecord-compatible record -> ontology projection | projection | Not promotion by generated mirror. |
| `supports_candidate` | evidence card -> ontology candidate | staging | Not source replacement. |
| `records_residue` | operation or candidate -> residue | staging | Not automatic reflection-tower climb. |
| `routes_drift_to` | artifact or projection -> drift owner | staging | Not drift resolution. |

## Schema-Evolution-Only Relations

The following are not allowed as live relations in this slice:

- `witnesses_authority_movement`
- `promotion_movement_edge`
- `ledger_row_as_subgraph`
- `promotion_event_as_node`
- `movement_as_node`

They require schema governance, edge law, and authority-ledger validation before
any executable or vault effect.

## Endpoint Rule

A relation that cannot name both endpoints, direction, owner, evidence, and
effect remains residue or an open question. It must not be used as an implicit
dependency.
