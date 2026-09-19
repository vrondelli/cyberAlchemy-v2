# MTCI-006 — Freeze Observation and Evaluation Contracts

Owner route: Task Session. Status: ineligible until MTCI-005 passes.

## Outcome

Implement the language-independent observation schema, provenance model, unsupported algebra, property/relation evaluator, deterministic receipt normalizer, and fixture harness. Select concrete package homes and pinned toolchains for all three languages.

## Candidate write scope

Exact L0/L3 project paths chosen by the MTCI-005 design plus `instances/<slug>/contracts/`. Language adapter source is forbidden.

## Required tests

Schema positives/negatives; total obligation accounting; missing-versus-unsupported distinction; observed/derived/owner-resolved provenance separation; deterministic replay; raw evidence reachability; property conflict; relation cardinality/direction; profile digest mismatch; no authority-changing operation.

## Acceptance

The same fixture contract can accept observations from all languages without language-specific fields in the semantic kernel. Tool versions, executable resolution, package homes, commands, unsupported cases, and privacy/redaction behavior are frozen. Python and Rust are still closed.

