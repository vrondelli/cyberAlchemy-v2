# Historical P4/R4 backend replay closure candidate

## Purpose and claim ceiling

Load the five historical TDE P4/R4 suite files in this standalone checkout
and preserve their predecessor/current-evidence boundary.
The source is `https://github.com/vrondelli/poker-team.git` at commit
`6c990537662dca7abe3f77f3aff35ae897db2bf6`. Imported code is an
immutable historical test fixture, not current CyberAlchemy application
source, a deployed service, or proof of `runtime_guarantees_observed`.

## Exact implementation frontier

1. Pin the transitive import closure of the P4 adapter and R4 settlement
   service. It is exactly the following 18 backend `src` files, with no
   missing relative import: `domain/__derived__/financial-settlement.sfol.adapter.ts`,
   `domain/deal/deal.service.ts`, `domain/limit/limit.service.ts`,
   `domain/makeup/makeup-policy.service.ts`,
   `domain/player-stats/player-stats-window.vo.ts`,
   `domain/player-stats/player-stats.entity.ts`,
   `domain/player-stats/player-stats.repository.ts`,
   `domain/player/player.entity.ts`, `domain/player/player.repository.ts`,
   `domain/settlement/settlement.events.ts`,
   `domain/settlement/settlement.service.ts`,
   `domain/shared/financial-write-unit-of-work.ts`,
   `domain/transaction/transaction.entity.ts`,
   `domain/transaction/transaction.repository.ts`,
   `infrastructure/telemetry/instruments.ts`,
   `use-cases/financial-settlement/generate-settlement.ts`,
   `use-cases/financial-settlement/settlement-kpi-runtime.ts`, and
   `use-cases/financial-settlement/settlement.dto.ts`. Source bytes, paths,
   SHA-256, size and Git blob IDs must match the pinned commit.
2. Keep it under a TDE-only `__fixtures__/poker-team-backend` root, with a
   sorted file/hash manifest and an independently pinned manifest digest.
   Reject changed, absent, extra and symlinked files before either P4/R4
   top-level dynamic import, including an explicit import-failure control.
3. Change only P4/R4 historical module resolution to the verified fixture.
   Do not populate `craft/validation/poker-team` as active source. Keep existing
   receipt, obligation and binding assertions intact for the first execution;
   do not assume they pass merely because the application modules load.
4. Add the one external runtime dependency, `@opentelemetry/api` at the
   source-lock version `1.9.1`, as a TDE runtime dependency because non-test
   terminal verifiers load the fixture at module import. Inspect the
   exact package/lock diff and reject unrelated resolution changes.
5. Run verifier mutation tests, five P4/R4 suites, TDE typecheck, a dedicated
   fixture typecheck, then the broad suite. The existing TDE typecheck covers
   only `src/**/*.ts`, so it alone does not check the fixture import closure.
   The maximum claim is verified historical source import and bounded P4/R4
   contract behavior, not complete predecessor graph/binding/receipt replay.

## Separate residue

The current standalone application path requires its own bounded source,
dependency and behavior validation. Historical P4/R4 replay does not promote
staged provenance to current runtime or renew stale predecessor receipts.

## Open Questions

- Does the exact closure import cleanly in the TDE package without further
  runtime dependencies or module-resolution changes?
- After a green historical suite, what current application verification
  surface should replace this predecessor source for product testing?

## First execution result and required plan revision

The pinned fixture verifier passed all six focused controls; the P4 effect
suite passed 8/8, and both TDE and dedicated fixture typechecks passed. The
five formerly unloadable suites now expose seven failed tests plus one
`r4-predicate` suite-load failure: old derivation expects a stale `project.json`
manifest entry, and old binding refs still name absent
`validation/poker-team/backend` paths. The P4 use-case execution itself passed.
This is not the anticipated green historical replay.

The independent plan review selected a split of historical and current
evidence. The implemented tests retain fail-closed checks for the stale
manifest/binding/receipt, execute the P4 use case and exact-hash R4 v1
contract/mutations without a graph-currentness claim, and require the existing
separately versioned current P4/R4 verifiers for positive current claims.
Only if an exact original source snapshot and binding mapping can be
reconstructed should a positive predecessor replay be attempted. The old
manifest and receipt hashes remain unchanged.
