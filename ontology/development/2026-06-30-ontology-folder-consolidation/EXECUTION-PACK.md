---
node_type: execution-pack
is_session: false
status: completed
boundary: INTERNAL - planning evidence only
created: 2026-06-30
authored_by: invoke (mode=plan)
---

# Execution Pack: Ontology Folder Consolidation

This execution pack schedules the work-pack by wave. It does not redefine SWUs;
the SWU source of truth is `WORK-PACK.md` and the task files under
`work-pack/tasks/`.

## Wave Summary

| Wave | Layer | Goal | Tasks | Gate |
| --- | --- | --- | --- | --- |
| W0 | L0 | Establish visible folder-role bridge. | TASK-OCON-001 | Completed. |
| W1 | L1 | Harvest project ontology material into CAV2 package context. | TASK-OCON-002 | Completed. |
| W2 | L2 | Reconcile challenge-contract semantics/schema tension. | TASK-OCON-003 | Completed. |
| W3 | L3 | Add domain-local instantiation guidance. | TASK-OCON-004 | Completed. |
| W4 | L3 | Verify and synchronize. | TASK-OCON-VERIFY | Completed. |

## Parallelization

- W0 is serial and should run first.
- After W0, W1 can run independently from the challenge-contract gate.
- W2 is manual-gated. Do not combine SWU-OCON-003 and SWU-OCON-004 in one
  mutation-capable task-session.
- W3 can use the W2 challenge-contract source-sync result when it needs
  challenge-contract field details.
- W4 runs after the selected execution scope completes.

## Expected Receipts

| Receipt | Producer | Required Fields |
| --- | --- | --- |
| R-OCON-001 | task-session for SWU-OCON-001 | files touched, diff check result, role-boundary summary, residue. |
| R-OCON-002 | task-session for SWU-OCON-002 | crosswalk rows added, package refs changed, diff check result. |
| R-OCON-003 | decision-gate/definitions-governance | selected confidence wording, affected files, allowed mutation scope. |
| R-OCON-004 | task-session for SWU-OCON-004 | owner receipt consumed, files touched, no-third-confidence-axis check. |
| R-OCON-005 | task-session for SWU-OCON-005 | candidate/local status, specs boundary check. |
| R-OCON-006 | verification closeout | dispatch validation, diff check, optional inventory validation. |

## Completed Receipts

| Receipt | Path | Result |
| --- | --- | --- |
| R-OCON-001 | [TASK-SESSION-SWU-OCON-001.md](TASK-SESSION-SWU-OCON-001.md) | pass |
| R-OCON-002 | [TASK-SESSION-SWU-OCON-002.md](TASK-SESSION-SWU-OCON-002.md) | pass |
| R-OCON-003 | [2026-06-30 challenge-contract confidence-axis review](../../../authority/definitions/reviews/2026-06-30-challenge-contract-confidence-axis-review.md) | pass |
| R-OCON-004 | [TASK-SESSION-SWU-OCON-004.md](TASK-SESSION-SWU-OCON-004.md) | pass |
| R-OCON-005 | [TASK-SESSION-SWU-OCON-005.md](TASK-SESSION-SWU-OCON-005.md) | pass |
| R-OCON-006 | [TASK-SESSION-SWU-OCON-006.md](TASK-SESSION-SWU-OCON-006.md) | pass |

## Validation Commands

Run from the repository root unless a task receipt names a narrower scope.

```bash
python arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py cyberAlchemy-v2/ontology/development/2026-06-30-ontology-folder-consolidation/PLAN-DISPATCH.json
git diff --check -- cyberAlchemy-v2/ontology/development/2026-06-30-ontology-folder-consolidation
```

Task-session receipts should add path-specific `git diff --check` commands for
the files they mutate.
