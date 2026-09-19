# TASK-FMP2-005 — Exact Order Saga Expected-Red Corpus

## Smallest Working Unit

- SWU: `SWU-FMP2-005`
- Layer: L2
- Dependency: accepted `SWU-FMP2-004`
- Successor: `SWU-FMP2-006`
- Expected execution owner: Order Saga corpus evidence owner through one Task Session
- Primary behavior: one complete five-case corpus preserves the exact research model, two authored mutants, and `FreshnessSafety` as a named expected-red result

## Inputs and outputs

Inputs are the exact locked research TLA/config and historical result evidence. Outputs are a virtual bundle containing the source module unchanged plus the bounded evaluation module/configs, a five-case manifest, separate denominator, provenance record, and focused test.

## Exact write scope

Create the five absent Order Saga fixture/test targets in `SWU-CONTRACTS.json`. Research, Bolina, provider, and shared factory paths are read-only.

## Algorithm and case matrix

1. Revalidate the locked research module/config and provenance receipt bytes.
2. Embed the original module unchanged. Add only the accepted evaluation actions `M01AcceptBeforeTerminal` and `M02DeadLetterBeforeCompensation` with their accepted next/spec wrappers.
3. Create exactly five configs: success base, failure base, freshness known-red, M01 success mutant, M02 failure mutant.
4. Require exact properties, finding codes, and markers: `WaiverChangesAfterRead`, `OFS_SUCCESS_BEFORE_TERMINAL`/`M01AcceptBeforeTerminal`, and `OFS_FAILURE_BEFORE_COMPENSATION`/`M02DeadLetterBeforeCompensation`.
5. The denominator contains the first three obligations and last two mutants. Do not add fairness, liveness, another action/case, or semantic repair.

## Edge cases and hostile evidence

Own `HC-FMP-026..028`: original byte drift, missing historical marker, accidental green reclassification, source-model rewrite, extra/missing case, or mutant action/property/finding drift.

## Done and validation

All three commands for 005 pass; every JSON parses; the original virtual file hashes to the locked research digest; no research file changed; no TLC process starts. Receipt and owner closeout bind successor 006.

## Split analysis

Candidate children are source preservation, evaluation material, and denominator. They are one semantic fixture: separating them would permit acceptance without the known-red or exact mutant meaning. It remains separate from Bolina because its provenance and result semantics differ.

## Runtime context anchors and result shape

Use `SOURCE-LOCKS.json`, the exact research sources it binds, validated Design Order Saga table, accepted decoder contracts, hostile catalogue, and this task. Return standard SWU result and exact five-file inventory. This does not prove saga correctness or decide freshness policy.

Rollback removes only the five created targets before acceptance.
