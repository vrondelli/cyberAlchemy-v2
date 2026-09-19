---
context_pack: SWU-CDSC2-002
coverage: strict-local
source_count: 8
gate: PASS
---

# Context Pack: SWU-CDSC2-002

## Objective

Freeze a pure source-derived harness and baseline-equivalence witness before
either mutation runs.

## Controlling Sources

1. `WORK-PACK.md`
2. `work-pack/tasks/TASK-CDSC2-HARNESS.md`
3. `work-pack/waves/W0.md`
4. accepted SWU-CDSC2-001 contracts and runtime
5. parent source-slice canonicalization
6. `app/page.tsx:417-515,518-520,571-710`
7. `lib/savvy-fsm.ts:3-17,111-174`
8. parent generic experiment-envelope contract

## Boundary Clarification

`SAVVY_FLOW` at lines 3-17 is a direct dependency of the declared guard and
next/previous functions, so it is added to the exact frozen selector rather
than discovered at mutation runtime. No other Savvy context is selected.

The harness takes `is_active` and `first_pending_step` as source-derived
predicate inputs. It does not claim to reproduce session authentication,
completion predicates, React rendering, or visual behavior.

## Gate

SWU-CDSC2-001 is accepted. Source selectors exist, generation-1 protected bytes
match, and Savvy is clean. No blocker decision remains.
