# Plan Distill Validation

## Frame

- Mode: Standard, two rounds.
- Proposer: Invoke parent (`PLAN-PROPOSER-RESULT.md`).
- Balancer: bounded read-only helper (`BOUNDED-HELPER-RECEIPT.md`).

## Round 1 — Rejected Draft

The Balancer blocked the first draft: selected-profile wording contradicted the
all-profile graph; one concept edge was backwards; three SWUs were task-shaped;
multiple parent tasks held several SWUs; validation commands and write scopes
were incomplete; TypeScript pinning was prose-only; and the L1/L2 order crossed.

## Round 2 — Repaired Unit Set

Repairs:

- one graph per complete bundle; profile selection preserves `graph_id`;
- explicit fixture/evaluation/constraint-origin profile fields and edges;
- one parent task per SWU;
- visibility versus focus, navigator versus canvas keyboard, and popup focus
  versus reflow/motion/non-color split;
- browser harness scaffold in 004 with exact per-SWU mode;
- exact repository-relative product/receipt scopes and closeout inventories;
- serial L0 001-003, L1 004-008, L2 009-015.

The Round 2 convergence audit then found four residual documentation defects:
selected-profile assembly wording, a missing layout-result concept edge,
shorthand source anchors, and no terminal VERIFY Refresh inventory. Those exact
bytes were repaired before the checks below were replayed.

## Checks

| Check | Result | Evidence |
| --- | --- | --- |
| first-unit narrowness | pass | 001 model/validator only |
| atomicity | pass | fifteen one-behavior task files and table |
| independent acceptance | pass | exact model/layout/browser command per unit |
| recomposition | pass | traceability plus 015 and VERIFY |
| closeout completeness | pass | exact inventory and receipt scope per unit |
| profile provenance | pass | Design fields/edges plus 001/005 negative fixtures |
| layer ordering | pass | W1 001-003, W2 004-008, W3 009-015 |
| owner boundary | pass | `selected_swu=none`, mutation false |

## Premortem

Likely failure: a screenshot works while exact graph identity, provenance, and
keyboard equivalence silently drift. Guardrail: start at 001, run exact mode at
every HTML SWU, and refuse successor execution without Refresh closeout.

## Residue

Human comprehension and density thresholds remain unmeasured. Minimap,
shareable state, external layout, adapters, and explanatory-copy migration remain
outside this Work Pack.

## Verdict

Pass for Plan quality after repair. Mutation remains blocked because no SWU is
selected. Recommend 001 without selecting it.
