# TASK-FMP2-001 — TLA Semantic Kernel and Total Classifier

## Smallest Working Unit

- SWU: `SWU-FMP2-001`
- Layer: L0
- Dependencies: none
- Successor: `SWU-FMP2-002`
- Expected execution owner: local Task Session; a bounded subagent may own the exact SWU later
- Primary behavior: every admitted TLA case/bundle and every bounded TLC terminal observation maps deterministically to one closed provider-local result or one stable failure

## Inputs and outputs

Inputs are canonical JSON for `TlaCaseManifest/v1` and `TlaModelBundle/v1`, plus bounded stdout/stderr/process observations. Outputs are deep-frozen decoded contracts and one `TlcOutcomeClassification/v1` containing no runtime path, PID, or clock.

## Exact write scope

Create only the eight `SWU-FMP2-001` targets in `SWU-CONTRACTS.json`: three contracts, two decoders, one classifier, and two focused tests under the existing factory TLA/test surfaces. All are absent in the live baseline.

## Algorithm

1. Decode closed canonical JSON and reject unknown keys, noncanonical order/shape, duplicates, invalid identifiers, or invalid virtual paths.
2. Cross-check case IDs, virtual module/config references, expected result kind, property/finding code, trace marker, per-case timeout, and output limit.
3. Inspect process outcome with precedence: timeout/output limit/signal/spawn; fatal/SANY/parse/incomplete terminal; wrong or multiple property; missing behavior trace/marker; exact expected counterexample; exact bounded no-counterexample.
4. Emit exactly one class. Apparent success text followed by a higher-precedence failure must remain failure.
5. Normalize only semantic observations and hashes; discard host-local paths and process volatility.

## Edge cases and hostile evidence

Own `HC-FMP-001..008`, including CRLF, escaping/absolute/backslash paths, duplicates, truncated completion, fatal-after-success, wrong/multiple properties, missing trace/marker, timeout, signal, and output limit. Every vector asserts its stable diagnostic and proves it cannot contribute passing evidence.

## Done and validation

Run all three commands for 001 in `SWU-CONTRACTS.json`. Require focused tests, typecheck, and whitespace status zero. Record exact eight-file postimage and no foreign target. Emit the receipt in `CLOSEOUT-CONTRACTS.json`; owner closeout binds successor 002.

## Split analysis

Candidate children are contract decoding and output classification. They are retained together because the accepted primary behavior is a closed case-to-terminal-result semantic mapping; either half alone cannot validate an expected outcome. Process execution, shared factory contracts, and corpora are independently acceptable and therefore excluded.

## Runtime context anchors and result shape

Use `VALIDATED-DESIGN.md`, `HOSTILE-CATALOGUE.json`, `WRITE-SCOPE-BASELINE.json`, and this task. Return the standard SWU result with files touched, each validation status, blocker/residue, exact receipt artifact, and successor. No Java, TLC, model, replay, or proof execution claim.

Rollback before acceptance removes only the eight newly created files.
