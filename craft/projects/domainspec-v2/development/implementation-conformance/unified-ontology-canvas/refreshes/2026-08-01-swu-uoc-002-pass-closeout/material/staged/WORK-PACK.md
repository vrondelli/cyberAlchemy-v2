---
module: unified-ontology-canvas
version: candidate-v0
status: draft
updatedAt: 2026-08-01
docType: work-pack
---

# Work Pack: Unified Ontology Canvas

## Control Fields

| Field | Value | Notes |
| --- | --- | --- |
| planningArtifactStatus | pass | Repaired after bounded review; exact tasks/commands/inventories present. |
| workPackGateStatus | block | 001-002 are closed; `selected_swu=none` until the outer chain binds eligible 003. |
| selected_swu | none | Refresh makes 003 eligible but does not select it. |
| mutationAuthorized | false | Plan authors contracts only. |
| complexity | medium | Fifteen independently accepted mutation units. |
| outputMode | split | One parent task per SWU plus closure task. |
| executionPackRef | [EXECUTION-PACK.md](EXECUTION-PACK.md) | Serial waves. |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) | L0-L3 decisions. |
| distillValidationStatus | pass | [PLAN-DISTILL-VALIDATION.md](PLAN-DISTILL-VALIDATION.md). |
| swuAtomicityStatus | pass | Review-driven splits closed. |
| firstUnitNarrownessStatus | pass | 001 is projection model/validator only. |
| closeoutSyncStatus | pass | Exact inventory per SWU and shared contract. |
| activeLayerWindow | L0 | Nothing executing. |
| readinessProfile | pilot | Local candidate only. |

## Objective

Implement one deterministic canvas containing Meaning, Realization, Expectation,
Observation, and Explanation while preserving exact provenance, profile context,
accessible operation, and candidate/non-authority boundaries.

## Delivery Slices

| Slice | Layer | SWUs | Exit |
| --- | --- | --- | --- |
| exact graph | L0 | 001-003 | model/layout/routing validators pass |
| core canvas | L1 | 004-008 | independent browser modes pass |
| equivalent/responsive operation | L2 | 009-014 | navigator/keyboard/popup/reflow/motion/non-color modes pass |
| recomposition | L2 | 015 + VERIFY | journey and full rerun pass |

## Task Board

| Task | SWU | Primary behavior | Layer | Status |
| --- | --- | --- | --- | --- |
| [TASK-UOC-001](work-pack/tasks/TASK-UOC-001-PROJECTION.md) | 001 | unified projection | L0 | pass |
| [TASK-UOC-002](work-pack/tasks/TASK-UOC-002-NODE-LAYOUT.md) | 002 | node layout | L0 | pass |
| [TASK-UOC-003](work-pack/tasks/TASK-UOC-003-EDGE-ROUTING.md) | 003 | edge routing | L0 | eligible-unselected |
| [TASK-UOC-004](work-pack/tasks/TASK-UOC-004-STATIC-RENDER.md) | 004 | static render + acceptance scaffold | L1 | blocked-dependency |
| [TASK-UOC-005](work-pack/tasks/TASK-UOC-005-VISIBILITY.md) | 005 | visibility projections | L1 | blocked-dependency |
| [TASK-UOC-006](work-pack/tasks/TASK-UOC-006-FOCUS-TRACE.md) | 006 | focus and trace | L1 | blocked-dependency |
| [TASK-UOC-007](work-pack/tasks/TASK-UOC-007-INSPECT.md) | 007 | exact inspection | L1 | blocked-dependency |
| [TASK-UOC-008](work-pack/tasks/TASK-UOC-008-VIEWPORT.md) | 008 | viewport transform | L1 | blocked-dependency |
| [TASK-UOC-009](work-pack/tasks/TASK-UOC-009-NAVIGATOR.md) | 009 | structured navigator equivalence | L2 | blocked-dependency |
| [TASK-UOC-010](work-pack/tasks/TASK-UOC-010-CANVAS-KEYBOARD.md) | 010 | roving canvas keyboard | L2 | blocked-dependency |
| [TASK-UOC-011](work-pack/tasks/TASK-UOC-011-POPOVER-FOCUS.md) | 011 | popup focus/inert composition | L2 | blocked-dependency |
| [TASK-UOC-012](work-pack/tasks/TASK-UOC-012-RESPONSIVE.md) | 012 | responsive/zoom reflow | L2 | blocked-dependency |
| [TASK-UOC-013](work-pack/tasks/TASK-UOC-013-REDUCED-MOTION.md) | 013 | reduced motion | L2 | blocked-dependency |
| [TASK-UOC-014](work-pack/tasks/TASK-UOC-014-NON-COLOR.md) | 014 | non-color semantics | L2 | blocked-dependency |
| [TASK-UOC-015](work-pack/tasks/TASK-UOC-015-RECOMPOSITION.md) | 015 | composed browser journey | L2 | blocked-dependency |
| [TASK-UOC-VERIFY](work-pack/tasks/TASK-UOC-VERIFY.md) | exempt | product-read-only rerun | L2 | blocked-until-015 |

## Dependency Chain

```text
001 -> 002 -> 003 -> 004 -> 005 -> 006 -> 007 -> 008
    -> 009 -> 010 -> 011 -> 012 -> 013 -> 014 -> 015 -> VERIFY
```

The sequence preserves one shared HTML/harness integration line. It does not
merge independently acceptable behaviors.

## Execution Handoff Summary

Every task file contains exact source anchors, product write scope, receipt write
scope, done criteria, failure posture, acceptance evidence, command, owner, and
handoff. Exact closeout targets are in
[closeout-inventory.md](work-pack/shared/closeout-inventory.md).

| SWU | Task | Product write scope summary | Exact validation mode | Closeout inventory |
| --- | --- | --- | --- | --- |
| 001 | TASK-UOC-001 | model + model validator | `projection` | [001](work-pack/shared/closeout-inventory.md#swu-uoc-001) |
| 002 | TASK-UOC-002 | layout + layout validator | `nodes` | [002](work-pack/shared/closeout-inventory.md#swu-uoc-002) |
| 003 | TASK-UOC-003 | layout + layout validator | `edges` | [003](work-pack/shared/closeout-inventory.md#swu-uoc-003) |
| 004 | TASK-UOC-004 | HTML + browser harness | `static` | [004](work-pack/shared/closeout-inventory.md#swu-uoc-004) |
| 005 | TASK-UOC-005 | HTML + browser harness | `visibility` | [005](work-pack/shared/closeout-inventory.md#swu-uoc-005) |
| 006 | TASK-UOC-006 | HTML + browser harness | `focus` | [006](work-pack/shared/closeout-inventory.md#swu-uoc-006) |
| 007 | TASK-UOC-007 | HTML + browser harness | `inspect` | [007](work-pack/shared/closeout-inventory.md#swu-uoc-007) |
| 008 | TASK-UOC-008 | HTML + browser harness | `viewport` | [008](work-pack/shared/closeout-inventory.md#swu-uoc-008) |
| 009 | TASK-UOC-009 | HTML + browser harness | `navigator` | [009](work-pack/shared/closeout-inventory.md#swu-uoc-009) |
| 010 | TASK-UOC-010 | HTML + browser harness | `canvas-keyboard` | [010](work-pack/shared/closeout-inventory.md#swu-uoc-010) |
| 011 | TASK-UOC-011 | HTML + browser harness | `popovers` | [011](work-pack/shared/closeout-inventory.md#swu-uoc-011) |
| 012 | TASK-UOC-012 | HTML + browser harness | `responsive` | [012](work-pack/shared/closeout-inventory.md#swu-uoc-012) |
| 013 | TASK-UOC-013 | HTML + browser harness | `reduced-motion` | [013](work-pack/shared/closeout-inventory.md#swu-uoc-013) |
| 014 | TASK-UOC-014 | HTML + browser harness | `non-color` | [014](work-pack/shared/closeout-inventory.md#swu-uoc-014) |
| 015 | TASK-UOC-015 | browser harness only | `journey` | [015](work-pack/shared/closeout-inventory.md#swu-uoc-015) |
| VERIFY | TASK-UOC-VERIFY | product read-only | full exact rerun | [VERIFY](work-pack/shared/closeout-inventory.md#task-uoc-verify) |

## SWU Atomicity Review

| SWU | Independent acceptance | Why not split/merge | Verdict |
| --- | --- | --- | --- |
| 001 | one exact normalized graph | per-family loaders cannot prove cross-family closure | pass |
| 002 | stable non-overlapping node coordinates | edge routes independently accepted in 003 | pass |
| 003 | deterministic ports and paths | path/port are one routed-edge result | pass |
| 004 | graph-to-DOM/SVG static binding | harness scaffold is acceptance code for this behavior | pass |
| 005 | visibility state over constant graph | focus/trace split to 006 | pass |
| 006 | selected-node trace emphasis | inspector split to 007 | pass |
| 007 | exact selected-object details/focus return | viewport split to 008 | pass |
| 008 | reversible viewport transform | navigator split to 009 | pass |
| 009 | canvas/navigator object equivalence | roving canvas keyboard split to 010 | pass |
| 010 | custom spatial/relation keyboard model | popup focus split to 011 | pass |
| 011 | focus/inert composition across popovers | reflow split to 012 | pass |
| 012 | responsive/200%/400% operability | motion/color split to 013/014 | pass |
| 013 | reduced-motion behavior | color semantics split to 014 | pass |
| 014 | non-color status/relation meaning | recomposition split to 015 | pass |
| 015 | complete accepted journey | assertion set is one validation artifact and no product behavior added | pass |

## Closeout Contract

- Shared rules: [closeout-contract.md](work-pack/shared/closeout-contract.md).
- Exact per-SWU product/planning/receipt inventory:
  [closeout-inventory.md](work-pack/shared/closeout-inventory.md).
- Lifecycle owner: `invoke:refresh:apply-approved`.
- Successor: exact numeric next unit becomes eligible only; never selected or
  run. VERIFY is terminal and has no successor, release, deployment, or promotion.

## Execution Progress

- `SWU-UOC-001`: Task Session `PASS`; result
  `work-pack/results/SWU-UOC-001-RESULT.md`; Invoke Refresh receipt
  `closeout/SWU-UOC-001-REFRESH-RECEIPT.json`.
- `SWU-UOC-002`: Task Session `PASS`; result
  `work-pack/results/SWU-UOC-002-RESULT.md`; Invoke Refresh receipt
  `closeout/SWU-UOC-002-REFRESH-RECEIPT.json`.
- `SWU-UOC-003`: dependency-ready and eligible only. The active outer chain may
  bind it after a fresh continuity cursor; Refresh did not select or execute it.

## Gates

| Blocker | State | Resolution |
| --- | --- | --- |
| `selected_swu=none` | active | active outer chain may bind sole eligible 003 from the joined 002 receipt and fresh cursor; standalone execution requires explicit selection |
| predecessor receipt missing | conditional | close selected predecessor through Task Session and Refresh |

Planning quality passes; mutation remains deliberately blocked.

## Next Human Action

For the currently authorized first-blocker chain, join the 002 closeout receipt,
write a fresh continuity cursor, and open a new Task Session for sole eligible
`SWU-UOC-003`. Outside that chain, explicitly select 003 before mutation.
