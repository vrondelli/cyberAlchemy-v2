---
module: graph-composability-evidence-spine
version: post-l0-l1-proposal
status: handoff-blocked
updatedAt: 2026-08-20
docType: execution-pack
workPackRef: WORK-PACK.md
activeLayerWindow: L1
authorityEffect: none
---

# Execution Pack: EVF L1 Repeatability

This file schedules the Work Pack. It does not redefine either SWU and does not
authorize execution from Invoke.

## Wave Choreography

| Wave | Entry gate | Action | Exit receipt | Next |
| --- | --- | --- | --- | --- |
| W2 review | exact postimages pass independent review and owner acceptance, then canonical apply and readiness checks pass | select P4 only | mutation-admission receipt | P4 |
| W2/P4 | exact L0 input and baselines are fresh | reconcile both source-owned Rules/edges, freeze graph/source digest, prove strict P4 | P4 terminal receipt | P4 closeout |
| P4 closeout | P4 terminal validation PASS | synchronize only declared planning/evidence status; expose R4 as unique successor | Invoke owner receipt and Task Session terminal receipt | return cursor; do not execute R4 |
| W2/R4 | fresh Task Session selects R4 and exact P4 receipt/graph handle remain current | prove isolated option A R4 decision without graph/source writes | R4 terminal receipt | R4 closeout |
| R4 closeout | R4 terminal validation PASS | synchronize only declared targets | Invoke owner receipt and Task Session terminal receipt | independent composite verify |
| Verify | both receipts and graph/source handle are exact | closure-exempt independent verifier code/test, then join identities, digests, ceilings, and residue | composite L1 validation receipt | owner decision on later L2 admission |

## Serialization And Failure Rules

- P4 and R4 must not run in parallel.
- No R4 selection exists before P4 terminal closeout.
- A graph-only pass cannot exit P4.
- P4 remains valid if R4 later fails; composite L1 does not close.
- Any graph/source mutation after P4 makes the R4 route stale and blocks.
- A failed acceptance-critical command remains the terminal failure even if a
  later cleanup or diagnostic command succeeds.

## Stop Conditions

- postimage, baseline, route, or receipt digest drift;
- missing source-owned Rule/edge identity or duplicate edge ID;
- generated graph edited directly;
- `O_spec` derived from `O_gen` or an expected value manufactured from runtime;
- P4 effect observation lacks exact write-before-event order or cardinality;
- R4 imports write/event claims or non-duplicate preconditions;
- hidden skip/todo/`needs_formal`/orphan/unrunnable result;
- undeclared write, authority change, public/private boundary crossing,
  provider install/network access, release, publication, or deployment;
- any failed acceptance-critical validation.

## Handoff

After canonical activation, Implementation Readiness consumes
`work-pack/EXECUTION-ENTRY.json`. Task Session receives
`work-pack/tasks/TASK-GCP-L1-REPEATABILITY.md`, the selected SWU row,
`work-pack/shared/CONTEXT.md`, and exact inventories. Invoke does not execute
either proof.
