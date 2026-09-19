---
module: graph-composability-evidence-spine
version: current
status: handoff-only
updatedAt: 2026-07-18
docType: execution-pack
workPackRef: WORK-PACK.md
---

# Execution Pack: Graph Composability Evidence Spine

This file choreographs the work-pack; it does not redefine task or SWU
contracts and it does not authorize execution from Invoke.

## Wave Choreography

| Wave | Entry gate | Action | Exit receipt | Next |
| --- | --- | --- | --- | --- |
| W0 | contract review passes | review S0 artifacts | contract decision note | W1 |
| W1 | exactly one SWU selected | run `SWU-GCP-001` in Task Session | positive/negative receipts | verify |
| Verify | W1 receipts complete | independent replay and residue check | verification receipt | W2 |
| W2 | L1 repeatability decision | define one graph-law SWU | graph-law receipt | W3 or stop |
| W3 | L2 graph-law proof | hand off breadth/consumer lane | handoff receipt | owner decision |

## Stop Conditions

- second SWU selected before the first receipt;
- source authority, release state, or Inventory authority edited;
- missing binding, invented expected predicate, stale digest, or hidden skip;
- a receipt claims semantic satisfiability from structural evidence alone.

## Handoff

Task Session receives [TASK-GCP-ENFORCES.md](work-pack/tasks/TASK-GCP-ENFORCES.md)
and [CONTEXT.md](work-pack/shared/CONTEXT.md). Its result returns to
[TASK-GCP-VERIFY.md](work-pack/tasks/TASK-GCP-VERIFY.md).
