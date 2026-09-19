# TASK-MTC-001 — Freeze the All-13 Baseline

## SWU-MTC-001

- Primary behavior: produce one exact all-13 preservation baseline before repair.
- Dependencies: none.
- Sources: Define `SOURCE-INVENTORY.json`, WP-RMT-001 terminal/Enum evidence, WP-RMT-002 372-byte inventory, WP-RMT-002R terminal receipt.
- Write scope: exactly the paths in `SWU-CONTRACTS.json#/contracts/0/write_scope`; this includes baseline artifacts and the unit's precloseout, Task Session, and Invoke Refresh receipts.
- Done: 13 unique types, six-plus-seven pack split, Enum included, predecessor routes classified, all source hashes current, zero implementation mutations.
- Acceptance: exact baseline inventory plus Task Session and owner closeout receipts.
- Split analysis: per-type snapshots are data rows, not independently meaningful closure units; one closed denominator is the smallest useful proof.
- Execution owner: Task Session after exact Plan acceptance and readiness.
