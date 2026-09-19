---
task_session: SWU-CDSC-003
mode: local-fallback
coverage: strict-local
status: ready
source_count: 7
---

# Context Pack: SWU-CDSC-003

## Selected Unit

Build and validate exactly one immutable F1 evidence receipt. Do not evaluate
the receipt, change shared contracts, or mutate GoldenQuill.

## Controlling Sources

1. `../../work-pack/tasks/TASK-CDSC-FIXTURES.md` - F1 contract and done criteria.
2. `../../SPEC.md` and `../../ARCHITECTURE.md` - evidence and authority rules.
3. `../../fixtures/generation-001/fixture-manifest.yml` - frozen F1 selectors and digests.
4. `../../contracts/evidence-receipt.schema.yml` - receipt shape.
5. `../../evaluation/validate-input.mjs` - accepted structural validator.
6. `../SWU-CDSC-001/receipt.json` and `../SWU-CDSC-002/receipt.json` - accepted dependencies.
7. The three F1 source selectors pinned by the manifest, read-only.

## Hard Constraints

- Write only the F1 receipt subtree, focused F1 test, Task Session evidence,
  and evidence-backed status projections.
- Distinguish Rule/Operation/Workflow, contextual role, architecture pattern,
  sequencing, aggregation, and named-instance explanations.
- Record every finite `A x Q` predicate cell with a source-backed rationale.
- Preserve non-portability uncertainty.
- Do not call the fixture or suite evaluator in this SWU.
- GoldenQuill remains read-only.

## Gate Result

`PASS`: both L0 dependencies are accepted; source pins still match; a complete
reviewed receipt can be produced without a blocker decision.
