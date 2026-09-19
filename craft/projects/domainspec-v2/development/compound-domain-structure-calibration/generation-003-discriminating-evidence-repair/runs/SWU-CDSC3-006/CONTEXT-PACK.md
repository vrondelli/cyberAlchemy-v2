---
artifact_id: CDSC3-SWU006-CONTEXT-v1
artifact_role: session-evidence
task: SWU-CDSC3-006
mode: lean
strict_coverage: pass
created_at: 2026-07-12T18:58:00Z
---

# SWU-CDSC3-006 Context Pack

## Summary

- Files selected: 7.
- Obligation coverage: 100 percent.
- Decisions/blockers: none.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Freeze exactly five test IDs. | specification catalog | covered |
| O2 | Bind six explanations, six targets, and both observation handles. | parent F3, SWU001, SWU004/005 | covered |
| O3 | Freeze all coverage and hypothetical claim inputs before evaluation. | task algorithm; preregistered fixture | covered |
| O4 | Keep planners pure, sorted, unique, and deterministic. | task done criteria | covered |
| O5 | Accept empty or nonempty symmetric difference. | specification and negative/positive fixtures | covered |
| O6 | Reject missing coverage, circular output input, and unknown fields. | task negative vectors | covered |
| O7 | Make no identity, usefulness, candidate, or promotion inference. | authority boundary | covered |

## Preregistered Interpretation

- Baseline planner returns the union of test categories already demanded by
  unchanged explanation coverage.
- Residual planner returns baseline tests plus the explicit hypothetical
  compound-boundary claim's test categories.
- The accepted explanation map already spans the finite catalog, so the
  accepted `D` may be empty.
- Empty `D` means the hypothetical claim changes no test-selection decision
  under this catalog. It does not refute or prove semantic identity.

## Validation Surface

`node --test .../tests/usefulness-differential.test.mjs`, including empty,
nonempty, ordering, missing-coverage, circular-input, and replay vectors, then
aggregate tests, protected-handle checks, and scoped diff checks.
