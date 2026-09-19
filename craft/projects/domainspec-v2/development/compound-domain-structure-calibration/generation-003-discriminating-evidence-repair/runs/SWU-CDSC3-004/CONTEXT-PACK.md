---
artifact_id: CDSC3-SWU004-CONTEXT-v1
artifact_role: session-evidence
task: SWU-CDSC3-004
mode: lean
strict_coverage: pass
created_at: 2026-07-12T18:49:00Z
---

# SWU-CDSC3-004 Context Pack

## Summary

- Files selected: 8.
- Obligation coverage: 100 percent.
- Handoff pack: none; execution is local.
- Decisions/blockers: none.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Bind exact runtime, source manifest, target set, and baseline witness. | SWU001-003 receipts | covered |
| O2 | Change only the cloned step-9 child adapter. | task write scope; edit-diff contract | covered |
| O3 | Preserve `onNext`/`onBack` while changing child identity. | T-P-01/02 and baseline registry | covered |
| O4 | Re-run all baseline vectors and observe route/guard stability. | T-P-03/04 and baseline witness | covered |
| O5 | Produce total four-target structured observations and screenshots. | observation receipt contract | covered |
| O6 | Replay identically and preserve every protected/baseline byte. | task done criteria | covered |
| O7 | Emit no explanation coverage or adjudication state. | observation owner boundary | covered |

## Selected Sources

| Source | Selectors | Obligations |
| --- | --- | --- |
| `TASK-CDSC3-OBSERVATIONS.md` | SWU004 contract | O1-O7 |
| `SPEC.md` | Permitted Mutation M3-P | O2-O5 |
| atomic target set | T-P-01 through T-P-04 | O3-O5 |
| baseline witness/build receipt | exact baseline and handle | O1, O4, O6 |
| baseline `model.mjs` | step-9 registry entry only | O2-O4 |
| baseline vectors/runner | seven fixed vectors | O4-O6 |
| browser observation validator | M3-P target/structured-state contract | O1, O5, O7 |
| SWU001 protected manifest | immutable inputs | O6 |

## Constraints

- The experiment clones baseline files; it never edits `harness/browser-baseline`.
- The only semantic change is `step-9-baseline` to `step-9-alternate`.
- Step-9 ports remain exactly `onBack`, `onNext`.
- Target states describe observed consequences only; they do not answer which
  explanation covers a target.
- All seven vectors rerun, even though only mounted step 9 changes child ID.

## Validation Surface

`node --test .../tests/m3-permitted-child.test.mjs`, plus two fresh browser
processes, aggregate tests, source/protected hashes, and scoped diff checks.
