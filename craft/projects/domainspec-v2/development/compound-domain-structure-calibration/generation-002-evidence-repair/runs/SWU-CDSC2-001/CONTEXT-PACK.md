---
context_pack: SWU-CDSC2-001
coverage: strict-local
source_count: 12
gate: PASS
---

# Context Pack: SWU-CDSC2-001

## Objective

Add a versioned generation-2 parity preflight, successor-suite wrapper, two
future evidence schemas, and an immutable generation-1 protection manifest.

## Controlling Sources

1. `WORK-PACK.md`
2. `work-pack/tasks/TASK-CDSC2-CONTRACTS.md`
3. `work-pack/waves/W0.md`
4. `work-pack/shared/context.md`
5. `../contracts/evidence-receipt.schema.yml`
6. `../evaluation/validate-input.mjs`
7. `../evaluation/evaluate-suite.mjs`
8. `../evaluation/canonical-json.mjs`
9. `../evaluation/generation-index.mjs`
10. `../generations/index.json`
11. generation-1 evidence and result artifacts named by the task
12. `../runs/SWU-CDSC-007/AUDIT.md`

## Boundaries

- Parent contracts, evaluator modules, receipts, results, index entry, replay,
  and audit are read-only.
- No Savvy or GoldenQuill source is selected.
- Write only this SWU's declared package paths, run evidence, and status sync.
- Successor validation must add strictness without changing parent v1 behavior.

## Decisions

No blocker decision exists. Use wrappers in this package rather than modifying
the accepted parent evaluator.

## Gate

Generation 1 has exactly one accepted index entry and all required source
artifacts exist. Strict context coverage passes.
