---
node_type: task-session-context-pack
is_session: true
status: complete
boundary: INTERNAL - session evidence only
created: 2026-06-30
task: TASK-OCON-002
swu: SWU-OCON-002
mode: lean
---

# Context Pack: SWU-OCON-002

## Task

Create the CAV2 source-surface crosswalk for `projects/ontology` and add a
compact package-model pointer. The crosswalk must harvest useful witness
material without treating the project folder as current ontology authority.

## Obligation Matrix

| Obligation | Required Evidence | Coverage |
| --- | --- | --- |
| O1: Create crosswalk. | `cyberAlchemy-v2/ontology/SOURCE-SURFACE-CROSSWALK.md` must exist. | covered |
| O2: Include required columns. | Crosswalk rows include source path, source role, allowed reading, forbidden reading, owner route, harvest action, and validation evidence. | covered |
| O3: Distinguish artifact roles. | Rows distinguish source, evidence, candidate, projection, promotion, and decision roles from the project architecture. | covered |
| O4: Keep `projects/ontology` non-authority. | Rows and package pointer state witness/source-context status only. | covered |
| O5: Update package model. | `PACKAGE-MODEL.md` cites the crosswalk as source context only. | covered |
| O6: Stay inside write scope. | Source edits only touch `SOURCE-SURFACE-CROSSWALK.md` and `PACKAGE-MODEL.md`. | covered |
| O7: Validate. | Run the path-scoped diff check from the task. | covered |

## Selected Sources

| Source | Selectors | Why Included |
| --- | --- | --- |
| `WORK-PACK.md` | TASK-OCON-002 row, SWU-OCON-002 row, gate checks. | Controls selected task, write scope, done criteria, and validation. |
| `work-pack/tasks/TASK-OCON-002.md` | Implementation detail and SWU-OCON-002. | Defines required crosswalk columns and package-model pointer. |
| `work-pack/waves/W1.md` | Layer question and promotion evidence. | Confirms W1 is ready and explains the harvest boundary. |
| `TASK-SESSION-SWU-OCON-001.md` | W0 pass receipt. | Confirms dependency is satisfied. |
| `projects/ontology/README.md` | Allowed and forbidden readings. | Carries the visible status bridge from W0. |
| `projects/ontology/ARCHITECTURE.md` | Architecture intent, artifact classes, node eligibility, decision flow, dependency rules, risks. | Provides the harvestable materialization model and non-authority constraints. |
| `projects/ontology/GLOSSARY-CONSISTENCY.md` | Checked terms and conflicts. | Provides naming collision status and branch/view warnings. |
| `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md` | Purpose, source contracts, authority law, core package model. | Target file and authority boundary for the CAV2 package. |
| `cyberAlchemy-v2/ontology/README.md` | Candidate authority-model boundary. | Confirms the package role and non-owner authority rule. |

## Controlling Constraints

- Preserve `projects/ontology` as private witness/incubator evidence.
- Do not copy old architecture as current CAV2 authority.
- Do not create live schema, node type, movement edge, spec, or promotion
  verdict.
- Do not write private parent evidence into public `arcanum/`.
- Keep every harvest row tied to a source path and forbidden reading.

## Decisions

| Decision | Type | Selected Option | Rationale |
| --- | --- | --- | --- |
| Crosswalk granularity. | non-blocking | Use source-surface rows plus a compact harvestable-pattern section. | It covers required distinctions without migrating project artifacts. |
| Package model update size. | non-blocking | Add one source-contract row and a short boundary note. | Enough to make the crosswalk discoverable without re-authoring the package model. |
| Inventory refresh. | deferrable | Do not refresh inventory for this SWU. | The task creates package-local source orientation, not a new reusable evidence synthesis. |

## Strict Coverage

Strict coverage: pass. Every SWU obligation has source evidence, a write scope,
and a validation surface. Runtime handoff is not used.
