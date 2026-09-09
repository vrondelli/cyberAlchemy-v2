# Open residue

## Owner decisions

- Accept or reject BD-01 through BD-08.
- Choose whether Carrier v3 replaces v2 or is introduced beside it with an
  explicit migration window.
- Choose initial construction profiles: Markdown, static arrows, or both.
- Define the owner of pattern stability separately from generator conformance.

## Semantic work

- Exact canonical relationship-profile ID/digest for AlchLang projections.
- Body schemas for each of the 13 source factories.
- Whether all admitted meta-types should be exposed in the first arrow profile
  or introduced by bounded waves.
- Formal status of AlchLang `effect` and `performs` edges.

## Implementation work

- Carrier v3 schema and validators.
- Construction-profile schema, resolver, compatibility matrix, and receipt.
- Static TypeScript AST decoder and hostile corpus.
- Factory projection schema/compiler and join-proof strategy.
- Generalized pattern catalog compiler and migration from Operation registry.
- Provider-runtime observation contract for SQLite Outbox.

## Evidence work

- Byte-identical Markdown/arrow semantic fixtures.
- Toolchain-pinned reproducibility.
- Stale baseline/profile/provider and partial-closure mutants.
- Clean-package, no-ambient-import, no-source-execution, symlink, overwrite, and
  atomic-publication tests.
- Owner acceptance/admission decisions, none of which this research supplies.

