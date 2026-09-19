---
artifact_id: CDSC3-SWU003-CONTEXT-v1
artifact_role: session-evidence
task: SWU-CDSC3-003
mode: standard
strict_coverage: pass
created_at: 2026-07-12T18:38:00Z
---

# SWU-CDSC3-003 Context Pack

## Summary

- Files selected: 11.
- Obligation coverage: 100 percent.
- Handoff pack: none; execution is local.
- Decisions: none.
- Assumptions: generation-2 next/previous functions remain a declared
  predecessor adapter where the frozen Savvy selectors expose ports but not the
  helper definitions.
- Blockers: zero before baseline execution.

## Obligation Matrix

| ID | Obligation | Controlling Evidence | Status |
| --- | --- | --- | --- |
| O1 | Consume the exact accepted runtime, contracts, imports, and targets. | SWU001/002 receipts and descriptors | covered |
| O2 | Freeze exact Savvy page/FSM/package bytes and selectors. | page 417-515, 571-710; FSM 126-162; package lock | covered |
| O3 | Generate React route state, guard, registry, child components, and test page locally. | page render/coordination slices; browser evidence contract | covered |
| O4 | Trace every generated behavior to a source selector or declared adapter. | source-manifest contract; generation-2 baseline harness | covered |
| O5 | Run mount, active child, next/back, allowed, inactive, and premature vectors. | task algorithm step 5; generation-2 vectors/model | covered |
| O6 | Capture complete structured state and supporting screenshots. | baseline-witness contract | covered |
| O7 | Replay in a fresh process with identical semantic output and handles. | task steps 6-7 | covered |
| O8 | Preserve Savvy, UI repair, generations 1/2, and runtime descriptors. | SWU001 protected manifest; SWU002 descriptor | covered |
| O9 | Stop before either mutation. | task done/handoff boundary | covered |

## Selected Sources

| Source | Selectors | Obligations |
| --- | --- | --- |
| `TASK-CDSC3-BASELINE.md` | complete SWU003 contract | O1-O9 |
| `WORK-PACK.md` | selected frontier and global done contract | O1, O8, O9 |
| `SPEC.md` | Browser Evidence Contract, Baseline | O3, O5, O6 |
| `ARCHITECTURE.md` | Savvy-to-harness interface and state namespaces | O2-O4, O8 |
| Savvy `app/page.tsx` | 417-515, 571-710 | O2-O6 |
| Savvy `lib/savvy-fsm.ts` | 126-162 | O2-O5 |
| Savvy frontend package manifest/lock | React/ReactDOM/Next versions | O2, O3 |
| generation-2 `navigation-model.mjs` | finite guard/next/back adapter | O4, O5 |
| generation-2 `screen-registry.mjs` | step-to-port registry | O3-O5 |
| generation-2 `session-fixtures.mjs` and harness manifest | accepted fixtures/predecessor | O4, O5 |
| SWU001/002 receipts plus runtime descriptor | stable handles and protection | O1, O6-O9 |

## Constraints And Bridge

- Savvy remains read-only; generated files live under `harness/browser-baseline`.
- Guard branching and committed-step behavior derive from FSM 126-162 and page
  489-500.
- Rendered child and interaction ports derive from page 619-707.
- Initial mounted/login state derives from page 417-431 and 571-580.
- Next/back finite flow movement uses the closed generation-2 harness as a
  declared `runtime-adapter`; it is not represented as newly extracted Savvy
  source and cannot support claims beyond the fixed vectors.
- Structured state is authoritative; screenshots are supporting only.
- Baseline replay excludes volatile server ports, process IDs, timestamps, and
  absolute screenshot paths from semantic handles.

## Validation Surface

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-003-discriminating-evidence-repair/tests/browser-baseline.test.mjs
```

Completion additionally requires two fresh browser processes, exact source and
runtime hashes, total vector equality, screenshot support, protected-input
replay, aggregate calibration tests, scoped diff checks, receipt, and
observability.

## Excluded Candidates

- Alternate child implementation: SWU004.
- Guard-result bypass: SWU005.
- Test-impact planner: SWU006.
- Adjudication/evaluation: SWU007/008.
