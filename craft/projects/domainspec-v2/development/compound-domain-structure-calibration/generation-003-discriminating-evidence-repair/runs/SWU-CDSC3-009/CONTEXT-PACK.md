---
artifact_id: CDSC3-SWU009-CONTEXT-v1
artifact_role: session-evidence
task: SWU-CDSC3-009
mode: lean
strict_coverage: pass
created_at: 2026-07-12T19:26:00Z
---

# SWU-CDSC3-009 Context Pack

## Summary

- Selected source groups: 16.
- Obligation coverage: 100 percent.
- Decisions/blockers: none; `DEC-CDSC3-011` is resolved and must remain visible.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Fresh-process validate imports, targets, runtime, source, baseline, mutations, and `D`. | contracts, validators, immutable receipts | covered |
| O2 | Rebuild overlay/projection and compare exact bytes/handles. | SWU007 builder and evidence | covered |
| O3 | Re-evaluate F3/suite from generation-2 prefix and compare exact outputs. | SWU008 builder and stored results | covered |
| O4 | Validate three-entry predecessor chain and one successor. | generation index and generation entry | covered |
| O5 | Prove target derivation excludes browser outcomes. | parent `S`, target validator, target set | covered |
| O6 | Validate 36 coordinates and every uncertainty resolution/carry row. | atomic overlay/provenance | covered |
| O7 | Verify Savvy, UI-repair, and generation-1/2 protected hashes. | SWU001 manifest and append-aware prefix contract | covered |
| O8 | Audit Task Session receipts 001-008 and runtime decision history. | run receipts; decision ledger | covered |
| O9 | Scan machine and human surfaces for positive authority leakage. | package/result/status files | covered |
| O10 | Add one non-authority Inventory read model and synchronize both indexes. | Inventory schema/updater; generation-2 entry convention | covered |
| O11 | Close only after replay, Inventory, aggregate tests, and diff checks pass. | task done contract | covered |

## Selected Source Groups

1. `TASK-CDSC3-VERIFY.md` and `WORK-PACK.md`
2. package dispatch and decision ledger
3. protected import manifest and atomic target set
4. browser runtime descriptor and schemas
5. source manifest and baseline witness
6. M3-P evidence
7. M3-B evidence
8. usefulness differential evidence
9. atomic overlay, projection, provenance, and replays
10. generation-3 F3/suite/provenance/run results
11. three-entry generation index and append rejection proof
12. deterministic builders and unchanged evaluator/index validators
13. Task Session receipts SWU001-SWU008
14. package planning/status surfaces
15. Inventory README/schema/index/update tool
16. generation-2 closeout Inventory entry convention

## Audit Rules

- Rebuild from the exact generation-2 prefix; never invoke the generation writer.
- Treat `CALIBRATION-DEFER` and `evidence-repair` as bounded machine outputs,
  not authority or an automatic successor.
- Any byte drift, missing receipt, unresolved decision, index inconsistency, or
  positive authority claim fails closeout; W4 cannot repair it.
- Inventory is a compiled non-authority read model and must cite source paths.

## Validation Surface

Run the independent replay in two fresh processes, compare reports, run all
generation-3 tests, validate Inventory updater/index parity and idempotency,
run `git diff --check` on the calibration scope, and then close statuses.
