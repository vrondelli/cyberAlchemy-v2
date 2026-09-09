---
task_id: TASK-OCON-VERIFY
status: completed
layer: L3
wave: W4
owner: task-session
---

# TASK-OCON-VERIFY: Verification And Synchronization

## Objective

Verify the selected execution scope and synchronize receipts without claiming
promotion readiness.

## Dependencies

- At least SWU-OCON-001.
- Any later SWUs selected by the operator.

## Smallest Working Unit Exemption

- Reason: closure-only verification task.
- Allowed because task ID contains: VERIFY.

## Verification Checklist

- Dispatch JSON validates.
- New/changed Markdown passes `git diff --check`.
- CAV2 ontology docs do not claim definition/spec/schema promotion authority.
- `projects/ontology` is preserved unless a later owner decision says
  otherwise.
- Challenge-contract mutation has an owner receipt if any such mutation occurred.
- Inventory is refreshed only if new evidence entries were intentionally added.

## Validation Commands

```bash
python arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py cyberAlchemy-v2/ontology/development/2026-06-30-ontology-folder-consolidation/PLAN-DISPATCH.json
git diff --check -- cyberAlchemy-v2/ontology/development/2026-06-30-ontology-folder-consolidation
```

## Completion Result

- Status: completed by SWU-OCON-006.
- Receipt: `TASK-SESSION-SWU-OCON-006.md`.
- Inventory refresh: deferred because new evidence remains candidate/local or
  session evidence; refresh after stabilization, promotion, or explicit
  request.
