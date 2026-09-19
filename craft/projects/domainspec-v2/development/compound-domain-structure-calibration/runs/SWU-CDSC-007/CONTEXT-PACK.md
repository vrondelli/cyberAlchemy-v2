---
context_pack: SWU-CDSC-007
coverage: strict-local
source_count: 8
gate: PASS
---

# Context Pack: SWU-CDSC-007

## Objective

Replay frozen generation 1 in a fresh process, audit claims and boundaries, and
close the work-pack without revising evidence or authority.

## Selected Inputs

- `work-pack/tasks/TASK-CDSC-VERIFY.md`
- `work-pack/waves/W3.md`
- `SPEC.md` and `ARCHITECTURE.md` replay/audit rules
- generation manifest and three frozen receipts
- four stored result envelopes and run receipt
- `generations/index.json`
- prior Task Session receipts

## Boundaries

- Write only this run subtree and status-only work-pack synchronization.
- Treat replay as deterministic-treatment evidence, not semantic truth.
- Preserve F3 uncertainty and route repair to a future bounded generation.
- Do not mutate fixture sources or any DS-D1, DS-D8, pattern, candidate,
  validator, activation, or promotion surface.

## Gate

Generation 1 is accepted, indexed, and has no predecessor conflict. No alternate
evidence is admitted to the replay.
