# Shared Context

## Goal

Calibrate the residual-analysis method over three frozen fixtures without
assuming that any compound kind exists.

## Required Sources

- `../../SPEC.md`
- `../../ARCHITECTURE.md`
- `../../DECISION-LEDGER.md`
- `../../GAP-LEDGER.md`
- `../../../ui-meta-type-repair/research/2026-07-11-compound-domain-structures/findings.md`

## Authority Boundary

This package owns development schemas, receipts, results, replay, and audit.
GoldenQuill, Savvy, DS-D1, DS-D8, architecture-pattern governance, candidates,
and validators are read-only external owners.

## Shared Rules

- Freeze before evaluate.
- Record missing or disputed evidence explicitly.
- Compute residue from reviewed predicates; never infer predicates in code.
- Append generations; never overwrite.
- Separate fixture outcome, suite verdict, and any later owner decision.
