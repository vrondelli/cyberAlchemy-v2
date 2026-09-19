# TASK-MTC-001 — Freeze the All-13 Baseline

## SWU-MTC-000

- Primary behavior: reconstruct and independently validate the exact 23-file Rule newline-only predecessor overlay.
- Dependencies: none.
- Write scope: exactly `SWU-CONTRACTS.json#/contracts/0/write_scope`; 30 paths cover two tools, one manifest, one result, 23 staged postimages, and three lifecycle receipts.
- Done: 17 append-one-LF and six internal-plus-final-LF transforms reproduce the frozen WP-RMT-002R hashes without changing live bytes.
- Execution owner: Task Session after exact Plan acceptance, or the already-authorized bounded candidate-local prototype lane.

## SWU-MTC-001

- Primary behavior: produce one exact all-13 preservation baseline against the validated Rule overlay before semantic repair.
- Dependencies: SWU-MTC-000.
- Sources: Define `SOURCE-INVENTORY.json`, WP-RMT-001 terminal/Enum evidence, WP-RMT-002 372-byte inventory, WP-RMT-002R terminal receipt.
- Write scope: exactly the paths in `SWU-CONTRACTS.json#/contracts/1/write_scope`; this includes baseline artifacts and the unit's precloseout, Task Session, and Invoke Refresh receipts.
- Done: 13 unique types, six-plus-seven pack split, Enum included, the WP-RMT-002R identity regression passes, predecessor routes are classified, all source hashes are current through the validated overlay, and live implementation mutations remain zero.
- Acceptance: exact baseline inventory plus Task Session and owner closeout receipts.
- Split analysis: overlay construction is independently reversible and is owned by SWU-MTC-000; the all-13 denominator remains the smallest useful baseline proof.
- Execution owner: Task Session after exact Plan acceptance and readiness.
