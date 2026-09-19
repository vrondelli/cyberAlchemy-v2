---
artifact_id: CDSC3-SWU008-CONTEXT-v1
artifact_role: session-evidence
task: SWU-CDSC3-008
mode: lean
strict_coverage: pass
created_at: 2026-07-12T19:18:00Z
---

# SWU-CDSC3-008 Context Pack

## Summary

- Files selected: 13.
- Obligation coverage: 100 percent.
- Decisions/blockers: none.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Revalidate protected bytes, accepted projection, and exact generation-2 tail. | SWU007 receipt/projection; protected manifest; index | covered |
| O2 | Rebuild projection and require exact canonical equality. | SWU007 deterministic builder | covered |
| O3 | Evaluate F3 twice with unchanged v1 evaluator. | `evaluate-fixture.mjs` | covered |
| O4 | Validate exact stable F1/F2 handles and compose suite twice. | generation-1 F1/F2; `evaluate-suite.mjs` | covered |
| O5 | Bind suite successor to current generation-2 tail. | accepted successor adapter; generation index | covered |
| O6 | Accept every total fixture outcome and suite verdict unchanged. | specification; evaluator finite outcome sets | covered |
| O7 | Build provenance through target, observations, `D`, overlay, projection, results, and uncertainty. | SWU007 receipt; generation-2 provenance pattern | covered |
| O8 | Preflight append and write one exact successor atomically. | `generation-index.mjs`; generation-2 build pattern | covered |
| O9 | Prove rerun, duplicate ID, and wrong-tail rejection without index mutation. | append API; focused integration test | covered |
| O10 | Preserve generations 1/2 and all authority prohibitions. | protected validator; specification boundary | covered |

## Selected Sources

1. `work-pack/tasks/TASK-CDSC3-GENERATION.md`
2. `SPEC.md#Evaluation-And-Generation`
3. accepted generation-3 projection
4. SWU007 deterministic projection builder
5. parent `evaluation/evaluate-fixture.mjs`
6. parent `evaluation/evaluate-suite.mjs`
7. accepted successor-suite adapter
8. parent `evaluation/generation-index.mjs`
9. stable generation-1 F1 result
10. stable generation-1 F2 result
11. generation-2 suite result
12. generation index with exact generation-2 tail
13. accepted generation-2 build/append pattern

## Append Protocol

1. Build every generation-3 artifact in memory against the exact two-entry
   index prefix.
2. Validate replay equality and rejection cases against clones or temporary
   files before touching the canonical index.
3. Write immutable result files.
4. Invoke `appendGenerationFile` exactly once.
5. Compare canonical append output to the preflight index and reject any
   subsequent rerun as a duplicate successor.

## Exclusions

- Do not alter evaluator, suite classifier, successor adapter, or index API.
- Do not optimize for a preferred F3 outcome or suite verdict.
- Do not mutate generation-1/2 files or any authority artifact.
- Do not begin independent audit work owned by SWU009.

## Validation Surface

Run focused `generation-003-integration.test.mjs`, aggregate package tests,
exact result replay, append/rejection proofs, protected-byte checks, and one
canonical-index successor comparison.
