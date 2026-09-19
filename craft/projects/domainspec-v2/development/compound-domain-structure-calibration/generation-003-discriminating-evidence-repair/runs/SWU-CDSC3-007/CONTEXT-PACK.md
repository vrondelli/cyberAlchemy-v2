---
artifact_id: CDSC3-SWU007-CONTEXT-v1
artifact_role: session-evidence
task: SWU-CDSC3-007
mode: lean
strict_coverage: pass
created_at: 2026-07-12T19:08:00Z
---

# SWU-CDSC3-007 Context Pack

## Summary

- Files selected: 11.
- Obligation coverage: 100 percent.
- Decisions/blockers: none.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Revalidate protected imports and all three generation-3 evidence handles. | SWU001 manifest/targets; SWU004-006 receipts | covered |
| O2 | Freeze exactly 36 unique `A x T` coordinates. | parent `semantic.A`; atomic target set; specification rubric | covered |
| O3 | Bind every cell to unchanged explanation/target text and matching observation provenance. | parent F3; atomic targets; M3-P/M3-B receipts | covered |
| O4 | Preserve partial, conflict, missing, and disputed coverage as `indeterminate`. | `SPEC.md#Adjudication`; generation-2 overlay | covered |
| O5 | Bind empty `D` exactly without identity or usefulness inference. | usefulness result; task algorithm | covered |
| O6 | Resolve only observation gaps and carry browser, source, attestation, catalog, and portability limits. | generation-2 overlay/projection; generation-3 receipts | covered |
| O7 | Materialize a deterministic parent-valid v1 F3 projection without evaluation. | parent schema/validator; generation-2 projection/materializer pattern | covered |
| O8 | Reject 35/37 cells, duplicate/change/outcome-shaped coordinates, partial inflation, uncertainty loss, `D` inflation, unknown fields, and evaluator use. | task negative-vector contract | covered |
| O9 | Replay canonical bytes and handles exactly. | canonical envelope and parent logical projection rules | covered |
| O10 | Preserve all authority prohibitions and make no fixture or suite outcome claim. | specification boundary; parent prohibitions | covered |

## Selected Sources

1. `work-pack/tasks/TASK-CDSC3-ADJUDICATION.md`
2. `SPEC.md`
3. generation-1 parent F3 receipt
4. SWU001 atomic target set
5. M3-P observation receipt
6. M3-B observation receipt
7. SWU006 usefulness result
8. generation-2 adjudication overlay
9. generation-2 compatibility projection
10. parent `contracts/evidence-receipt.schema.yml`
11. parent `evaluation/validate-input.mjs`

## Adjudication Rules

- Observation support is necessary but does not assign explanatory ownership.
- `explained` requires the unchanged explanation to account for the whole atomic
  proposition; `not-explained` requires no such coverage; partial causal
  coverage is `indeterminate`.
- Atomic decomposition may resolve a generation-2 bundled `partial` coordinate,
  but no generation-2 state is silently copied across all child targets.
- Reviewer identity is `task-session-local-reviewer`; review state is approved
  unless a real dispute appears.
- Empty `D` remains deterministic false/nonzero false and cannot become an
  identity, usefulness, candidate, activation, or promotion claim.

## Exclusions

- Do not import or call `evaluate-fixture.mjs` or precompute F3/suite outcomes.
- Do not mutate generations 1/2, browser observations, atomic targets, or
  usefulness evidence.
- Do not change DS-D1, DS-D8, pattern, candidate, activation, or promotion state.

## Validation Surface

Run focused `atomic-adjudication.test.mjs`, then the package aggregate suite,
protected-handle validation, canonical replay, parent-validator compatibility,
and a scoped source scan proving evaluator non-use.
