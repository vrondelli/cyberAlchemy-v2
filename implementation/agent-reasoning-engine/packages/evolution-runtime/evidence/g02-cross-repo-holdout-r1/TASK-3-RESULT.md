# Holdout task 3: NodeBB socket-to-Write-API migration

The third predeclared task, `SWE-Bench-Pro__javascript__maintenance__bugfix__e31ec45c`, completed as a valid sealed ARE/DSH pair. ARE scored **0.47355 Span-F1**, **0.70000 File-F1**, **104,105 known model tokens**, and **219.471 arm seconds**. DSH scored **0.50524 Span-F1**, **0.77778 File-F1**, **288,534 tokens**, and **261.999 seconds**. The strict per-task four-gate decision is **fail** because ARE trailed in both quality metrics, despite lower cost.

Complete receipts and pre-score seal remain at `/opt/are-benchmark-runs/g02-cross-layer-holdout-nodebb-writeapi-r1/`; pre-score seal SHA-256: `f964c64103a8067914fc581b2444fffcb9dbaa6d5d1bb79016bd34bdb54564bf`. This failure remains in the predeclared three-task cohort aggregate.

## Open Questions

- Does the three-task cohort's mean quality remain above DSH despite this task's quality loss?
- What source layer did ARE miss in the socket migration task?
