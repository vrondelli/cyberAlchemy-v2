# TASK-SFC-SCHEMAS — Closed result contracts

Layer/slice/wave: L0 / SFC-S1 / W0.

## Objective

Implement two separate closed contracts and decoders: one compact structural
receipt, one diagnostic report used for lint findings and operational faults.

## Source contracts

- `SPEC.md#result-and-fault-contract`.
- `REQUIREMENTS.md#interface-requirements`.
- `DESIGN.md#view-6--dependency-and-interface`, `#integration-and-versioning-extension`.

## SWU-SFC-005 — StructuralReceipt v1 schema/decoder

- Primary behavior: closed-decode and canonicalize structural receipt v1 with
  exact producer/runtime/profile/source/evidence bindings and authority none.
- Independent acceptance: valid receipt round-trips byte-stably; unknown, missing,
  malformed, future-major, stale binding, forbidden authority, and excerpt mutants fail.
- Split analysis: schema, decoder/encoder, canonicalizer, fixtures, and tests form
  one round-trip contract; diagnostics do not depend on it and remain 006.
- Dependencies: SWU-SFC-004.
- Write scope:
  - `projects/domainspec-v2/impl/cli/contracts/structural-receipt.schema.json`
  - `projects/domainspec-v2/impl/cli/src/contracts/structural-receipt.ts`
  - `projects/domainspec-v2/impl/cli/fixtures/receipts`
  - `projects/domainspec-v2/impl/cli/test/schemas/structural-receipt.test.ts`
- Done: schema ID/version, closed members, stable normalization, v1 decoder,
  `authority_effect: none`, exact negatives.
- Validation: `VC-SFC-005`.
- Execution owner: Task Session.
- Expected receipt: `runs/SWU-SFC-005/TASK-SESSION-RESULT.json`.

## SWU-SFC-006 — DiagnosticReport v1 and pagination

- Primary behavior: closed-decode and deterministically paginate one diagnostic
  report/fault family with stable codes and pointer-only fields.
- Independent acceptance: sort, page digest, whole-report digest, token, page-size,
  replay, schema, channel class, and redaction mutants discriminate.
- Split analysis: diagnostic schema and page token were considered separately;
  a token has no valid semantics without the exact normalized report contract, so
  they remain one output behavior. Command execution remains 007.
- Dependencies: SWU-SFC-005.
- Write scope:
  - `projects/domainspec-v2/impl/cli/contracts/diagnostic-report.schema.json`
  - `projects/domainspec-v2/impl/cli/src/contracts/diagnostic-report.ts`
  - `projects/domainspec-v2/impl/cli/src/output/pagination.ts`
  - `projects/domainspec-v2/impl/cli/fixtures/diagnostics`
  - `projects/domainspec-v2/impl/cli/test/schemas/diagnostic-report.test.ts`
- Done: one versioned schema for lint/fault variants, stable ordering/tokens,
  pointer-only output, strict future/unknown behavior, no receipt extension bag.
- Validation: `VC-SFC-006`.
- Execution owner: Task Session.
- Expected receipt: `runs/SWU-SFC-006/TASK-SESSION-RESULT.json`.

## Compatibility rule

Only the owning compatibility SWU may add N-1 decoder support. Current-mode
encoders always emit the current schema and never silently coerce unknown input.

