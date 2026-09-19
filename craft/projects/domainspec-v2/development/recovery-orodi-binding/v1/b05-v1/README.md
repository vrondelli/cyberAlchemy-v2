# B05 — Integrated recovery candidate test evidence

Candidate `DSV2-ORODI-RECOVERY-B05-001` completed the fresh integrated campaign: **30 scenarios × 2 repetitions passed**, and ORODI passed all 60 assertion slots. The original runtime and the B03/B04 components remain unchanged.

## Exact product tested

The frozen candidate composes the local durable recovery runtime, the source-bound authored tests, the separate read-only observer, the evidence adapter and the ORODI evaluator. `CANDIDATE.json` binds 135 selected source files and the named runtime bytes through its manifests. The final `PRODUCT-TEST-MANIFEST.json` binds this candidate to the actual test outputs for review. Neither artifact is an approval.

The first repetition runs forward and the second runs in reverse order. Every case uses a fresh Python process and temporary fixtures. The campaign ran 106 authored tests, produced 224 separate observer captures and read 360 store snapshots. All 60 case process identities were distinct. All named source/runtime hashes matched before, throughout and after execution.

`RESULTS.json` holds the raw records. `execution-log.jsonl` records case timing. `normalization.json`, `bundle.json` and `evaluation.json` connect those records to ORODI's exact binding and assertion receipts. The assembler evaluated the same bundle twice at the fixed campaign timestamp and obtained identical receipts.

## Regression result and limits

Type-check passed. All 34 recovery TypeScript component tests and all 11 Python observer/driver tests passed. The broader TypeScript run had 162 passes and two failures across 164 tests. Both failures reproduce the existing hostile-directory format collision: `operational-evidence.test.ts:98` assumes every JSON file is a hostile-case/v1 descriptor, while the two Body War files have other formats. They fail before evaluator invocation. Full raw output and unchanged-input hashes are preserved in `regressions.json`; the full regression suite is **not** reported as passing.

Those harness failures remain operational-support residue with the ORODI test-corpus owner. They do not hide the completed product campaign. Independent review must assess the exact candidate and the recorded regression limits before any product decision.

The observer captures before/after test boundaries. Authored tests own the intra-test semantic assertions and fault checks; the snapshots are not an independent proof of every invariant or every possible interleaving. The lease guarantee remains an immediate pre-COMMIT authorization check, not a physical COMMIT-completion deadline. No deployment, runtime admission or production claim follows from these tests.

## Next construction step

B06 independent review is ready. B07's exact product decision remains pending. The program is not complete and no product approval, publication, activation or deployment occurred.

The campaign refuses to overwrite existing raw results. Any source change requires a successor candidate and fresh evidence. Re-evaluation at a different time may expire the evidence; replaying the recorded fixed instant reproduces the recorded receipt without making it newly observed.
