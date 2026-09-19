> **Historical, non-executable after 2026-07-22.** See `../HISTORICAL-MAP.md` for W7–W9 replacements.

# W4 — Integrate and independently verify

## Question

Do the required checks fail closed and produce independently replayable evidence for the bounded backend claim and its two read-only consumer proofs?

## Sequence

1. SWU-BTE-008 — integrate the core required-check manifest and emit the green `verify:bte:core` receipt.
2. IOLM owner — run the independently governed consumer gate and return a fresh receipt handle.
3. Body War owner — run the independently governed consumer gate and return a fresh receipt handle.
4. SWU-BTE-010 — validate both external receipts through `verify:bte:consumers` and expose terminal `verify:bte = verify:bte:core + verify:bte:consumers`.
5. TASK-BTE-VERIFY — independently replay the complete core-to-consumer-to-terminal evidence chain under its execution-unit exemption.

## Entry gate

- W3 exact-set, execution, and mutation receipts pass, and the W2 SWU-BTE-009 edge/16-signature receipt is complete.

## Stop conditions

- Either consumer receipt is absent, stale, fixture-only, schema-only, or authored by the BTE task.
- SWU-BTE-010 is selected before the green core receipt and both fresh external consumer handles exist.

## Exit gate

- The canonical command rejects missing, empty, stale, skipped, undiscovered, and mutation-surviving evidence.
- Independent replay reconciles all exact sets and digests.
- The receipt states only the conservative backend profile plus integrated consumer-proof contract for the approved candidate profile/version.
- Release and admission decisions remain with their owning gates.

## Promotion

Return the independent verdict to FPR-02B/FPR-04 ownership and run Invoke Refresh. Do not auto-promote a passing technical receipt into release authorization.
