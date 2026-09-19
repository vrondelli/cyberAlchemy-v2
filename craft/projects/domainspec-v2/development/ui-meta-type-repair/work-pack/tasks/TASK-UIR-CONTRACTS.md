# TASK-UIR-CONTRACTS

## SWU-UIR-001 - Contract Kernel

Inputs: `EVIDENCE-CONTRACTS.md`, DEC-UIR-001, existing repository schema style.
Outputs: development schemas for record headers, canonical semantic fields,
digests, lineage, outcomes, codes, and golden canonicalization vectors.

Ordered rules:

1. Enumerate semantic versus volatile fields for each record kind.
2. Define canonicalization and digest algorithm identifiers.
3. Define deterministic record/generation ID derivation and no-op behavior.
4. Validate positive, malformed, field-order, timestamp, and predecessor vectors.
5. Record ratification as pending or owner-approved; never infer approval.

Write scope: this package's future `contracts/`, `fixtures/contracts/`, and tests.
Done: schema validation passes; volatile changes preserve content digest; semantic
changes alter it; lineage remains separate. Failure: ambiguous semantic field or
collision blocks downstream publication. Owner: Task Session locally.

## SWU-UIR-002 - Rule And Parity

Inputs: 001 and current validator/generator rule paths. Outputs:
`attribute-nonempty/v1`, total registration, and parity fixtures.

Rules: preserve `attribute-present`; distinguish missing, empty, whitespace,
and nonempty; register generation and both validators atomically; compare
normalized outcome and code. Edge cases include tabs, line breaks, non-string
values, and unknown rule versions. Write scope is limited to declared validator,
generator, fixture, and test paths chosen by Task Session. Done: no unknown rule,
all edge cases classified, outcome/code parity passes. Failure: global drift or
partial registration rolls back the SWU. Owner: validator owner.

## SWU-UIR-003 - Contract Decisions

Inputs: 001 plus resolved DEC-UIR-003/004. Outputs: implemented
duplicate/conflict preflight, strict unknown-rule handling, the versioned
violation-code registry, and a finite extension manifest.

Inspect raw-input preservation, implement fail-closed duplicate and conflict
classification, register the selected code vocabulary, and enumerate finite
counterexamples. Validator mutation is limited to the paths declared by its
Task Session. Done: both paths reject unknown rules with stable codes, raw
duplicate order cannot change the result, and the extension manifest is finite.
Failure: partial registration or parser-dependent outcomes block extensions and
parity-ready claims.
