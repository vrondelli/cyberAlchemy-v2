---
node_type: task-session-context-pack
is_session: true
status: complete
boundary: INTERNAL - session evidence only
created: 2026-06-30
task: TASK-OCON-001
swu: SWU-OCON-001
mode: lean
---

# Context Pack: SWU-OCON-001

## Task

Add a visible status bridge for `projects/ontology` and link it from the CAV2
ontology artifact tree as witness/incubator material.

## Obligation Matrix

| Obligation | Required Evidence | Coverage |
| --- | --- | --- |
| O1: Create status bridge. | `projects/ontology/README.md` must mark the folder as private witness/incubator evidence. | covered |
| O2: Link from CAV2 artifact tree. | `cyberAlchemy-v2/ontology/ARTIFACT-TREE.md` must point to the project surface as evidence, not authority. | covered |
| O3: Preserve source evidence. | No deletion or movement of `projects/ontology` files. | covered |
| O4: Preserve authority split. | README and artifact-tree row must say this is not current CAV2 ontology authority or a promotion owner. | covered |
| O5: Stay inside write scope. | Only `projects/ontology/README.md` and `cyberAlchemy-v2/ontology/ARTIFACT-TREE.md` receive source edits. | covered |
| O6: Validate. | Run `git diff --check` for touched source paths. | covered |

## Selected Sources

| Source | Selectors | Why Included |
| --- | --- | --- |
| `WORK-PACK.md` | Task board row, SWU-OCON-001 row, gate checks. | Controls selected task, write scope, done criteria, and validation. |
| `work-pack/tasks/TASK-OCON-001.md` | Objective, SWU-OCON-001, synchronization rules. | Controls exact executable unit. |
| `work-pack/waves/W0.md` | Layer question, promotion evidence, gate. | Confirms W0 is ready now and serial. |
| `CONTEXT-PACK.md` | Settled planning frame, approved delivery boundary, recommended first executable unit. | Confirms non-collapse recommendation and exclusions. |
| `projects/ontology/ARCHITECTURE.md` | Context view, artifact classes, constraints, risks. | Establishes project-local witness role and private/public boundary. |
| `projects/ontology/GLOSSARY-CONSISTENCY.md` | Checked terms, conflicts and resolutions. | Supplies forbidden readings around branch-as-view, PromotionRecord, and file-as-node. |
| `cyberAlchemy-v2/ontology/ARTIFACT-TREE.md` | Orientation map and tree-to-view rule. | Target file for CAV2 source-tree orientation. |
| `cyberAlchemy-v2/ontology/README.md` | Candidate authority-model boundary and owner route. | Confirms current base ontology package role. |

## Controlling Constraints

- Do not collapse folders wholesale.
- Do not delete or move `projects/ontology`.
- Do not claim `projects/ontology` is current CAV2 ontology authority.
- Do not change definitions, specs, schemas, or challenge-contract wording.
- Do not write private parent evidence into public `arcanum/`.

## Decisions

| Decision | Type | Selected Option | Rationale |
| --- | --- | --- | --- |
| How visible should the bridge be? | non-blocking | Add a README in `projects/ontology` and one artifact-tree row. | This is the smallest useful proof and matches SWU-OCON-001. |
| Should old project material be migrated now? | blocker if selected | Do not migrate. | Migration is out of scope and would risk authority drift. |

## Strict Coverage

Strict coverage: pass. Every SWU obligation has a source selector and validation
surface. Runtime handoff is not used.
