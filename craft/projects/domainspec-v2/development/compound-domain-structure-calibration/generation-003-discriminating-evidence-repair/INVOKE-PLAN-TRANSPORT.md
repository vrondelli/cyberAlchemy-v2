---
invoke_mode: plan
phase_status: flag
target: generation-003-discriminating-evidence-repair
next_route: task-session SWU-CDSC3-001
---

# Invoke Plan Transport

## Outputs

- `IMPLEMENTATION-LAYERING.md`: L0-L3 decision boundaries.
- `IMPLEMENTATION-PLAN.md`: complete ordered implementation and validation plan.
- `WORK-PACK.md`: canonical split execution manifest with nine SWUs.
- `EXECUTION-PACK.md`: wave choreography and runtime gate.
- `work-pack/tasks/`: six implementation-detail task contracts.
- `work-pack/waves/`: five layer-mapped wave files.
- `generation-003-discriminating-evidence-repair.dispatch.json`: full route.
- `DISTILL-VALIDATION.md`: pass with one named execution gap.

## Complexity And Detail

High complexity, split output. All six tasks have implementation details; all
nine SWUs have one parent, dependencies, source anchors, write scope, done
criteria, acceptance evidence, validation, owner, and handoff.

## Plan Gate

FLAG. Plan structure, dispatch, Distill, navigation, and first-SWU readiness
pass. `B-CDSC3-PLAYWRIGHT` remains a downstream human/runtime gate because no
Playwright runtime is installed. The flag does not block SWU001 and does block
SWU002 completion/browser evidence until resolved.

## Handoff

Task Session may execute only `SWU-CDSC3-001`. Do not install browser
dependencies or begin browser evidence during the first SWU.
