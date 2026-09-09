# TASK-IOLM-005 — Equivalent Learning Interface

## Objective and mapping

- Slice/layer/wave: S-005 / L2 / W3.
- Objective: implement both learning journeys across graph, hierarchy, table, source, detail, and challenge surfaces with one stable typed read model.
- Dependencies: TASK-IOLM-003 and TASK-IOLM-004.

## Source contracts

- [UX plan](../../UX-PLAN.md)
- [Architecture — UI](../../ARCHITECTURE-BUNDLE.md#ui-architecture)
- [Interfaces — Learning and accessibility](../../interfaces.md#learning-interface)
- [SPEC AC-07/08](../../SPEC.md#acceptance-criteria)

## SWU-IOLM-005-A — Typed UI read model and parity oracle

| Field | Contract |
|---|---|
| Dependencies | SWU-IOLM-003-B and 004-A pass |
| Source anchors | UX information architecture/interaction grammar; three-view schema |
| Related context | API and witness receipts |
| Write scope | `prototype/src/ui/read-model/` and `prototype/tests/parity/` |
| Done criteria | shared selection/lens state, typed adapters for four surfaces, stable-ID focus behavior, automated addressable record/relation parity oracle |
| Acceptance evidence | parity positive fixture and deliberate omission negative fixture; semantic-only toggle preserves semantic state |
| Validation surface | type checks and parity suite |
| Execution owner | Task Session; frontend read-model implementer |
| Handoff | return surface contract, selection rules, parity coverage |

## SWU-IOLM-005-B — Journey, graph, hierarchy, table, and detail UI

| Field | Contract |
|---|---|
| Dependencies | SWU-IOLM-005-A pass |
| Source anchors | UX J-01/J-02, accessibility contract, visual/language grammar |
| Related context | version-pinned layout/read model; glossary consistency |
| Write scope | `prototype/src/ui/` and `prototype/tests/ui/` |
| Done criteria | React Flow bounded graph, authored hierarchy, relation table, overview/journeys, detail/source/challenge views; non-drag controls; reduced motion; text labels |
| Acceptance evidence | both journeys complete in graph and non-spatial surfaces; stable selection across lenses; no color-only or unlabeled relation state |
| Validation surface | component tests plus browser journey suite; exact browser/AT evidence deferred to 006-A |
| Execution owner | Task Session; accessible frontend implementer |
| Handoff | return screenshots/DOM snapshots only as supporting evidence; browser results and known gaps |

## Synchronization and completion

Execute A then B. The task completes when the UI can lose all graph geometry and still expose the same learning information and actions.
