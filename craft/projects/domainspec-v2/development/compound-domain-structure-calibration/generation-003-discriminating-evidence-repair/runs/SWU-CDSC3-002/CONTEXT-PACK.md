---
artifact_id: CDSC3-SWU002-CONTEXT-v1
artifact_role: session-evidence
task: SWU-CDSC3-002
mode: standard
strict_coverage: pass
created_at: 2026-07-12T18:27:00Z
---

# SWU-CDSC3-002 Context Pack

## Summary

- Files selected: 10.
- Obligation coverage: 100 percent.
- Handoff pack: none; execution is local.
- Decisions: one resolved blocker (`DEC-CDSC3-011`).
- Assumptions: one reversible dependency adapter choice.
- Blockers: zero before runtime preflight.

## Obligation Matrix

| ID | Obligation | Controlling Evidence | Status |
| --- | --- | --- | --- |
| O1 | Consume accepted SWU001 handles only. | SWU001 receipt, protected manifest, atomic target set | covered |
| O2 | Install a pinned isolated Playwright/Chromium runtime. | `DEC-CDSC3-011`; SWU002 algorithm 1-3 | covered |
| O3 | Keep every dependency write inside `browser-runtime/`. | SWU002 write scope; architecture state namespace | covered |
| O4 | Prove launch, local rendering, structured DOM, and screenshot support. | SWU002 done criteria; browser evidence contract | covered |
| O5 | Contract source manifest, baseline witness, observation, and edit diff. | SWU002 algorithm 4-6 | covered |
| O6 | Reject launch failure, missing browser, screenshot-only, unknown observable, partial vector, wrong runtime, and edit leak. | SWU002 negative list | covered |
| O7 | Preserve all predecessor, Savvy, and UI-repair bytes. | SWU001 protected manifest; SWU002 step 7 | covered |
| O8 | Stop before source-derived baseline or mutation evidence. | SWU002/SWU003 boundary; work-pack handoff | covered |

## Selected Sources

| Source | Selectors | Obligations |
| --- | --- | --- |
| `WORK-PACK.md` | frontier, SWU states, blocker row, handoff | O1-O3, O8 |
| `work-pack/tasks/TASK-CDSC3-CONTRACTS.md` | complete SWU002 contract | O1-O8 |
| `ARCHITECTURE.md` | Dependency Interface View, State Namespaces | O3, O7, O8 |
| `SPEC.md` | Browser Evidence Contract | O4-O6, O8 |
| `IMPLEMENTATION-PLAN.md` | Browser Runtime Gate and Runtime Gate | O2-O4 |
| `DECISION-LEDGER.md` | DEC-CDSC3-011 | O2 |
| SWU001 `receipt.json` | accepted handles and next route | O1, O7 |
| SWU001 protected manifest | exact fifteen protected files | O7 |
| SWU001 atomic target set | six target handles and required observables | O1, O5 |
| Savvy frontend package manifest/lock | React 19.2.7, ReactDOM 19.2.7 | O3-O5 |

## Constraints And Assumption

- Pin exact package versions; no caret or floating dependency ranges.
- Set `PLAYWRIGHT_BROWSERS_PATH=0` so Chromium is installed under the isolated
  package rather than bound to the shared user cache.
- Pin React and ReactDOM to Savvy's locked `19.2.7`.
- A package-local bundler is an adapter only; it contributes no domain behavior
  and is frozen in the runtime descriptor.
- Smoke output is runtime evidence, not source-derived baseline evidence.
- Screenshots support but never replace structured state.
- No Savvy source file, prior generation, UI-repair file, or Inventory record
  may change.

## Validation Surface

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-003-discriminating-evidence-repair/tests/browser-contract.test.mjs
```

Completion also requires two deterministic smoke launches, executable/package
digests, protected-input replay, JSON/schema parity, scoped diff checks, Task
Session receipt, and observability.

## Excluded Candidates

- Savvy source slices and generated route behavior: SWU003.
- Mutation adapters and observations: SWU004/005.
- Usefulness planner: SWU006.
- Adjudication, evaluator, and generation append: SWU007/008.
