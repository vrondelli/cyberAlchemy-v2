---
node_type: reference
is_session: false
status: candidate
created: 2026-07-02
authored_by: "task-session (SWU-B0 — L0 data intake)"
source: ../comprehension-novice-test/stall-dataset.md (BASELINE arm)
consumes: "the ranked stalls → fixes the M1–M4 execution order (DEF-B3: order = data, not preference)"
---

# Package B — data-driven move order (SWU-B0)

> **Current authority update (2026-07-11):** The Saga orphan observation below
> is retained as baseline evidence from the old surface. Its former R3 hardening
> route is closed; the accepted response was collapse into scoped Workflow.

The [novice-test baseline dataset](../comprehension-novice-test/stall-dataset.md) reorders the plan. This
file is the L0 intake that every downstream SWU reads.

## What the data changed
- The two **blockers** were the **edge model** (S3 no Entity→Entity edge, S5 Saga orphaned) — **rerouted
  to R3** ([HANDOFF](../reformulate-batch1/HANDOFF-novice-test-edge-findings.md)), outside this package.
- The model's own predicted target (type discrimination via M2/M3) was **not** where the novice stalled.
- The one clean in-scope stall was **S8 (target-state) → M4**, which is therefore **first**.

## Execution order (this supersedes the WORK-PACK's written order)
| # | Move | Why this rank | Depends on R3? | Stalls addressed |
| --- | --- | --- | --- | --- |
| 1 | **M4 — target-state doc + oracle** | top in-scope stall (S8: no target-state type/template exists) | ❌ no | S8 |
| 2 | **M1 — tiering + define "feature/bounded-context" + individuation cue** | vocabulary/individuation friction cluster | ❌ no | S6, S1, S9 |
| 3 | **M2 — reconcile card↔RELATIONSHIPS (S4), then surface crossed pairs** | **blocked**: prerequisite S4 is in R3's hands; payoff capped by S10 | ✅ yes (S4 fix) | S2, S4(shared) |
| 4 | **M3 — upgrade 5 weak fixtures** | de-prioritized — novice did not stall on these types | ❌ no | (none observed) |

## Standing note for downstream SWUs
- **M2 parks** until R3 lands the S4 edge_participation fix (tracked in the R3 handoff).
- **M3** should only proceed if a later re-run (or the human arm) surfaces a discrimination stall on the 5
  weak types; absent that signal, it stays deferred (do not build fixtures no one stalled on).
- **M1/M4** are R3-independent and run now.
