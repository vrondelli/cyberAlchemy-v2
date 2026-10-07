# G01 fresh r20 — candidate acquisition result

Status, 2026-10-04: **24/24 final source-only candidate lists sealed before evaluator access.** Under the [prospective r20 protocol](G01-BUGSWARM-FRESH-R20-ACQUISITION-PROTOCOL-2026-10-04.md), the unchanged development test-edge-r3 rule produced 24 full permutations of the r19 graph path sets. Private `fresh-r11/rankings-r20/test-edges/TEST-EDGE-RANKINGS.jsonl` SHA-256 is `f3951e2911b479ceb3f31d1c9edcbcad8543629be400bf3f2ae6c2de651b9243`, seal SHA-256 `851e9554c3c78cfc8f7e3060dc0c745184b581a0977a6eb95bd5fcb75d662ae6`.

The unchanged r7 stratified rule then preserved each graph/test-edge top-30 union and added bounded failure-line, test-alias and rare-stem paths. Private `fresh-r11/candidates-r20/stratified/CANDIDATES.jsonl` SHA-256 is `24df57a9913190a1567e92fd0b6b601605ce795ca1780dbe71161d1f1d2f7205`, seal SHA-256 `0a26416a05e70cea9703cddcd54a485b742add4598562a9142196dcb720ce588`; its largest list had 74 paths.

The unchanged failed-test-only BM25 channel completed 23 full-file rankings and one protocol-defined skip because that case had no failed-test field. The r9 selector retained each union, added at most 20 new non-test channel hits, then filled from the prior stratified additions to the 80-path cap. Final private `fresh-r11/candidates-r20/final/CANDIDATES.jsonl` SHA-256 is `051a87aceb886259964e8f8fbddb186b63b560f2cb33f6a72efe6e72c4a39aac`, seal SHA-256 `694f4139b079ad0fd74a35ecc96de3ff7d2bca1ae8dde4586777fd8caf5c0a48`. There are **1,381 candidate placements** across 24 unique cases; maximum list length is **80**. No labels, model calls, or VPS source transfer entered r20.

Next: apply the unchanged r10 excerpt and packet rule, fail-closed at 24,000 prompt bytes per case; then same-account VPS token admission. Candidate count is not candidate *reach* until evaluator-only gold is admitted, and no superiority claim follows from r20.

## Open Questions

- Will every r10 packet fit the 24,000-byte and 8,192-token-with-reserve limits?
- Will the 24 authenticated direct-Git-tree gold sets survive the source projection and produce at least 20/24 candidate reach?
