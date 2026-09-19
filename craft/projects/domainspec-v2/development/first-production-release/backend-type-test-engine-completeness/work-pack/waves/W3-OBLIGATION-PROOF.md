> **Historical, non-executable after 2026-07-22.** See `../HISTORICAL-MAP.md` for W5–W7 replacements.

# W3 — Independent obligation proof

## Question

Can an independent denominator be reconciled exactly with derived, executed, and mutation-tested obligations?

## Sequence

1. SWU-BTE-005 — freeze independent `O_spec`.
2. SWU-BTE-006 — derive `O_gen` from compiled graph and source-manifest evidence.
3. SWU-BTE-007 — execute every obligation and kill every targeted mutant.

## Parallelism

None across these SWUs. Ownership is intentionally split, but the evidence chain is ordered so the engine cannot define its own expected set.

## Exit gate

- `O_spec = O_gen = T_gen = E_run = 16` by exact IDs and all 16 backend signatures are represented by causal obligations.
- All 13 backend kinds occur in the reconciled sets.
- Zero skipped, todo, orphaned, duplicate, undiscovered, or unrunnable obligations.
- All 16 targeted mutants are killed for their intended criterion.

## Promotion

Hand immutable receipts and replay commands to W4. Any mismatch creates a repair SWU; it is not waived in verification.
