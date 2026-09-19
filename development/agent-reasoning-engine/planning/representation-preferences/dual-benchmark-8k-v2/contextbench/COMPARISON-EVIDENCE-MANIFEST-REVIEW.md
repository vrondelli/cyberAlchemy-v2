# Comparison evidence manifest review — R1

Not approved yet. Four tests passed independently. An additional coherent-fixture counterexample reports all_run_evidence_reconciled=true while a sealed row has raw_accounting_complete=false: its usage summary retains 230 known tokens against 120 in the ledger.

Successful file/ledger/window checks do not resolve contradictory summaries or pending/unknown raw state. Require complete raw accounting and agreement with ledger totals before marking a row reconciled. Preserve every assigned row and its original cost/uncertainty witnesses when this check fails.

Exact source bindings are in the companion JSON. Production persistence, configured identity authority, process settlement and scoring remain declared later work. No provider calls or implementation edits occurred.

## Open Questions

Owned by [COMPARISON-EVIDENCE-MANIFEST.md](COMPARISON-EVIDENCE-MANIFEST.md).
