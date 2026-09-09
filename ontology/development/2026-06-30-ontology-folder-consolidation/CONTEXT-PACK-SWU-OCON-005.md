---
node_type: task-session-context-pack
is_session: true
status: complete
boundary: INTERNAL - session evidence only
created: 2026-06-30
task: TASK-OCON-004
swu: SWU-OCON-005
mode: lean
---

# Context Pack: SWU-OCON-005

## Task

Add DomainSpec v2 candidate ontology-instantiation guidance without making
DomainSpec v2 a second base ontology package, without promoting ontology
entries, and without writing specs directly from candidate material.

## Obligation Matrix

| Obligation | Required Evidence | Coverage |
| --- | --- | --- |
| O1: Dependency satisfied. | SWU-OCON-002 harvested project ontology boundaries; W2 synced challenge-contract fields. | covered |
| O2: Choose the project-local path if accepted. | `projects/domainspec-v2/` already has local authority and spec surfaces but no ontology folder. | covered |
| O3: Keep guidance candidate/local. | New artifact must state no CAV2 base authority, no promotion, and local owner routing. | covered |
| O4: Include one candidate example shape. | New artifact must include a concrete candidate entry or pointer. | covered |
| O5: Preserve specs boundary. | Specs are promoted contract targets after gates, not raw ontology sources. | covered |
| O6: Preserve source-spine boundary. | CAV2 and v1 are harvested precedent only, never DomainSpec v2 resolution paths. | covered |
| O7: Avoid active base mutations. | No `cyberAlchemy-v2/specs/` or base ontology mutation in this SWU. | covered |
| O8: Validate. | Run path-scoped diff check and text scans for forbidden claims. | covered |

## Selected Sources

| Source | Selectors | Why Included |
| --- | --- | --- |
| `WORK-PACK.md` | SWU-OCON-005 row and BLK-OCON-002. | Controls task selection, write scope, done criteria, and validation. |
| `work-pack/tasks/TASK-OCON-004.md` | Implementation detail and SWU-OCON-005 contract. | Defines required guidance content and project-local preference. |
| `work-pack/waves/W3.md` | Promotion evidence and gate. | Confirms W3 is ready after W2 completion. |
| `TASK-SESSION-SWU-OCON-004.md` | W2 receipt. | Confirms challenge-contract field details can be used. |
| `projects/domainspec-v2/README.md` | Implementation home, research towers, boundaries. | Establishes local project status and v1 freeze boundary. |
| `projects/domainspec-v2/authority/AUTHORITY-MODEL.md` | Authority kinds and non-collapse rules. | Provides local owner routes and a candidate example target. |
| `projects/domainspec-v2/authority/source-spine.md` | Source families and harvested precedent boundary. | Ensures CAV2/v1 are supporting sources only. |
| `projects/domainspec-v2/impl/spec/TAXONOMY.md` | Meta-concept taxonomy. | Provides local primary source for domain concept typing. |
| `projects/domainspec-v2/impl/spec/RELATIONSHIPS.md` | Typed relationship edges. | Provides local primary source for ontology edges. |
| `cyberAlchemy-v2/specs/README.md` | Specs boundary. | Confirms specs are gated targets only. |
| `cyberAlchemy-v2/ontology/NODE-MODEL.md` | Current candidate node/challenge contract shape. | Provides the base-model shape to instantiate locally. |
| `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md` | Ontology models; owner routes decide. | Confirms ontology package boundary and non-owner rule. |
| prior memory boundary notes | Distinct control surfaces and owner-promotion boundary. | Keeps local guidance non-promotional and non-collapsing while live `README.md` supplies the current implementation-home status. |

## Controlling Constraints

- Write to `projects/domainspec-v2/ontology/README.md`.
- Do not write `cyberAlchemy-v2/specs/`.
- Do not mutate CAV2 base ontology or definitions in this SWU.
- Do not treat CAV2 or v1 as DomainSpec v2 authority or resolution paths.
- Keep example entries candidate/local until DomainSpec v2 owner routes promote
  them.

## Decisions

| Decision | Type | Selected Option | Rationale |
| --- | --- | --- | --- |
| Guidance location. | non-blocking | Use `projects/domainspec-v2/ontology/README.md`. | The project has local authority/spec surfaces and the task prefers a project-local folder when accepted. |
| Example target. | non-blocking | Use a `validation-governance` candidate entry. | It is grounded in the local authority model and demonstrates local owner routing without changing CAV2. |
| Inventory refresh. | deferrable | Do not refresh inventory in this SWU. | The artifact is candidate guidance; inventory can refresh after the example stabilizes. |

## Strict Coverage

Strict coverage: pass. Every SWU obligation has source evidence, a bounded
write scope, and validation surface. Runtime handoff is not used.
