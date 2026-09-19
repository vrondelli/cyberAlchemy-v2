---
task_id: TASK-UIF-VERIFY
feature_code: UIF
layer: L3
status: not-started
gate_status: ready-after-packet
updatedAt: 2026-07-11
---

# TASK-UIF-VERIFY: Completion And Recomposition Audit

## Smallest Working Unit Exemption

Closure-only VERIFY task. It does not mutate candidate or canonical artifacts.

## Checks

- All 11 labels appear exactly once in final adjudication and owner packet.
- Every schema-ready label has complete artifacts and replication evidence.
- Every other label has correction route, residue, and owner.
- E0 and lane results use compatible protocol versions.
- Experiment claims do not exceed registered fixtures and corpora.
- No canonical DS-D1/DS-D8 or private derivation artifact changed.
- Dispatch, Markdown links, YAML/JSON, and scoped diffs validate.

## Completion Evidence

Emit a result artifact with pass/flag/block, command receipts, unresolved
residue, and next owner route. A flag is acceptable only for explicitly deferred
promotion; missing label coverage or authority leakage blocks closeout.
