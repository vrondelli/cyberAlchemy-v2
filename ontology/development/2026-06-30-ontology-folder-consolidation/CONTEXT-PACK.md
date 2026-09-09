---
node_type: invoke-context-pack
is_session: false
status: candidate
boundary: INTERNAL - planning evidence only
created: 2026-06-30
authored_by: invoke (mode=plan)
target_artifact: cyberAlchemy-v2 ontology folder consolidation plan
---

# Context Pack: Ontology Folder Consolidation

## Intent

Plan the recommendation that CyberAlchemy v2 should not collapse all ontology
folders into one authority surface. Instead, keep each folder's role explicit:
definitions own meanings, the CAV2 ontology package owns candidate authority
modeling, `projects/ontology` remains a private witness/incubator surface, and
project-local folders instantiate the model only after owner gates.

Invoke authored this packet for later execution. It does not promote ontology
entries, amend definitions, or delete project evidence.

## Source Anchors

| Ref | Path | Role In This Plan |
| --- | --- | --- |
| SC-001 | `cyberAlchemy-v2/ontology/README.md` | Declares the CAV2 ontology folder as a candidate authority-model boundary. |
| SC-002 | `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md` | Defines the source -> evidence -> candidate -> owner decision -> optional projection ladder. |
| SC-003 | `cyberAlchemy-v2/ontology/NODE-MODEL.md` | Requires `challenge_contract` on candidate node concepts. |
| SC-004 | `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#cav2-d40-challenge-contract` | Owns the meaning of challenge contract. |
| SC-005 | `cyberAlchemy-v2/ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md` | Later schema proposal that raises the confidence-field placement and naming tension. |
| SC-006 | `cyberAlchemy-v2/specs/README.md` | Says specs hold promoted contracts after research and architecture gates. |
| SC-007 | `projects/ontology/ARCHITECTURE.md` | Existing project-local materialization design and witness/incubator model. |
| SC-008 | `projects/ontology/GLOSSARY-CONSISTENCY.md` | Existing glossary collision report for project ontology terms. |
| SC-009 | `projects/domainspec-v2/README.md` | DomainSpec v2 working home; candidate material, not authority. |
| SC-010 | `.arcanum/inventory/entries/ontology-population-from-inventory-synthesis.md` | Recent inventory synthesis for ontology population ladder. |

## Settled Planning Frame

Do not collapse the folders wholesale. Collapse duplicated meaning into one
owner route, and keep folders separate by function:

| Surface | Planned Role | Must Not Do |
| --- | --- | --- |
| `cyberAlchemy-v2/authority/definitions/` | Own local term meanings such as `CAV2-D40`. | Let ontology redefine active terms by field usage. |
| `cyberAlchemy-v2/ontology/` | Own candidate authority modeling, crosswalks, package views, projections, and promotion requests. | Promote definitions, specs, schemas, or runtime contracts by proximity. |
| `cyberAlchemy-v2/specs/` | Hold promoted or candidate spec contracts after owner gates. | Receive raw inventory or ontology candidates without a promotion gate. |
| `projects/ontology/` | Remain private historical/incubator witness material for materialization patterns. | Compete with the CAV2 ontology package as current authority. |
| `projects/domainspec-v2/` | Instantiate the base model as a domain-local project after its own owner route. | Become a second base ontology package. |

## Active Tensions

| Tension | Status | Planned Handling |
| --- | --- | --- |
| `projects/ontology` has useful architecture but an ambiguous visible folder name. | non-blocking | Add an explicit README/status bridge and cross-reference it from the CAV2 ontology package. |
| Challenge contract lives in both definitions and ontology models. | non-blocking with owner gate | Keep `CAV2-D40` as meaning owner; ontology instantiates the field. Reconcile confidence axis naming through decision-gate/definitions-governance before schema mutation. |
| `specs/` should update some targets. | non-blocking | Treat specs as downstream promoted contract targets, not raw ontology sources. |
| DomainSpec v2 needs examples. | non-blocking | Add domain-local instantiation guidance after the base CAV2 role bridge is stable. |
| Public/private boundary. | active guardrail | Do not patch public `arcanum/` with private project evidence during this plan. |

## Approved Delivery Boundary

Included:

- planning artifacts for the consolidation recommendation;
- concrete execution SWUs for later `task-session`;
- dispatch route and validation expectations;
- owner-gated challenge-contract reconciliation plan;
- first executable SWU that adds status clarity without deleting evidence.

Excluded:

- deleting or moving `projects/ontology`;
- promoting challenge-contract schema changes;
- editing public `arcanum/`;
- making DomainSpec v2 ontology entries authoritative;
- writing specs directly from ontology candidates.

## Recommended First Executable Unit

Start with `SWU-OCON-001`: add a `projects/ontology/README.md` status bridge
and patch `cyberAlchemy-v2/ontology/ARTIFACT-TREE.md` so the historical project
surface is visible as witness/incubator evidence, not a competing authority
folder.
