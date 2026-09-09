# Relationship Crosswalk

Status: candidate
Owner: CyberAlchemy v2 ontology route

## Purpose

This crosswalk explains candidate authority-model relations using the typed
relationship precedent from DS-D2, DS-D7, and DS-D8. It does not create vault
edges or executable movement relations.

Normative sources:

- [../../arcanum/definitions/DEFINITIONS.md](../../arcanum/definitions/DEFINITIONS.md)
- [../../arcanum/definitions/RELATIONSHIPS.md](../../arcanum/definitions/RELATIONSHIPS.md)

## Crosswalk Rules

1. Candidate relations must name endpoints, direction, owner route, evidence,
   and authority effect.
2. Candidate relations may explain package semantics or projection rows.
3. Candidate relations must not become vault `## Connections` edges.
4. Movement relations remain blocked until schema governance admits them.
5. If the relation affects authority, an owner route must decide before use.

## Candidate Relation Crosswalk

| Candidate relation | Package endpoints | Closest DS-D2 family | Effect | Owner/gate | Blocked collapse |
| --- | --- | --- | --- | --- | --- |
| `supports_candidate` | Evidence -> OntologyCandidate | `validates` / evidence analogue | staging | inventory / ontology route | Evidence replacing source authority. |
| `requests_promotion_gate` | OntologyCandidate -> OwnerRoute | `triggers-cross` analogue | staging | relevant owner route | Request becoming verdict. |
| `classifies_authority_kind` | Envelope -> AuthorityKind | `maps` / classification analogue | projection | definitions-governance before canon | Kind becoming vault `node_type`. |
| `declares_source_posture` | SourceRef -> AuthorityPosture | `maps` / metadata analogue | staging | source/import owner | Posture becoming confidence or trust tag. |
| `uses_owner_profile` | Envelope -> OwnerProfile | `applies` analogue | routing | owner route | Shared promotion default. |
| `decides_transition` | OwnerDecision -> PromotionRecord-compatible record | `transitions` analogue | owner decision | owner route | Ontology deciding transition. |
| `emits_projection_when_allowed` | PromotionRecord-compatible record -> Projection | `produces` analogue | projection | owner route plus ontology route | Generated mirror authority. |
| `records_residue` | Operation/Candidate -> Residue | `produces` analogue | staging | route named by residue | Automatic promotion or climb. |
| `routes_drift_to` | Artifact/Projection -> DriftOwner | `applies` analogue | routing | drift owner | Drift resolution by pointer. |

## Blocked Movement Family

These relationship ideas are intentionally not active:

| Blocked relation | Reason | Required route |
| --- | --- | --- |
| `witnesses_authority_movement` | Current edge law does not admit promotion movement. | schema governance |
| `promotion_movement_edge` | No lawful live endpoint/inverse pair today. | schema governance |
| `ledger_row_as_subgraph` | Ledger rows are evidence/witnesses until validator exists. | authority-ledger owner |

## Endpoint Validation

Before a candidate relation influences authority, check:

- source endpoint exists and is cited;
- target endpoint exists and is cited;
- direction is declared;
- owner route is declared;
- evidence path is concrete;
- authority effect is one of `none`, `staging`, `projection`, `owner-decision`,
  or `blocked`;
- forbidden collapse is named;
- value effect and cycle policy have been classified under
  [CAV2-D28](../authority/definitions/DEFINITIONS.md#cav2-d28-value-cycle-edge-guard).
