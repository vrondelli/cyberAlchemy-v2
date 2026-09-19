# TASK-SFC-RESOURCES — Resource admission and measurement

Layer/slice/wave: L2 / SFC-S3 / W2.

## Objective

Enforce the selected hard input/output limits before expensive work and measure
boundary/over-bound wall-time and RSS behavior on the supported environment.

## SWU-SFC-013 — early resource preflight

- Primary behavior: deterministically census/admit or reject record count, total
  bytes, per-file bytes, and projected normalized output before full evaluation.
- Independent acceptance: exact boundaries admit; +1/overflow/size-race/symlink/
  changed-after-census/output-cap mutants exit 23 with pointer-only diagnostics.
- Split analysis: the four limits share one preflight decision and must be checked
  against one source snapshot; separating them permits time-of-check drift. Runtime
  performance measurement remains 014.
- Dependencies: SWU-SFC-010.
- Write scope:
  - `projects/domainspec-v2/impl/cli/src/input/resource-preflight.ts`
  - `projects/domainspec-v2/impl/cli/contracts/resource-profile.schema.json`
  - `projects/domainspec-v2/impl/cli/acceptance/resources/preflight`
  - `projects/domainspec-v2/impl/cli/test/resources/resource-preflight.test.ts`
- Done: exact selected constants, overflow-safe arithmetic, stable snapshot binding,
  early exit 23, no partial output.
- Validation: `VC-SFC-013`.
- Execution owner: Task Session.
- Expected receipt: `runs/SWU-SFC-013/TASK-SESSION-RESULT.json`.

## SWU-SFC-014 — boundary and over-bound campaign

- Primary behavior: measure wall time, peak RSS, result bytes, and early-failure
  behavior for declared corpus dimensions on Linux x64/Node 24.19.0.
- Independent acceptance: repeated boundary and over-bound runs produce schema-valid
  receipts; boundary target is ≤2 minutes/≤4 GiB; over-bound fails early and stably.
- Split analysis: corpus builder, runner, resource sampler, and receipt comparator
  jointly establish one envelope measurement; preflight enforcement passed in 013.
- Dependencies: SWU-SFC-013, SWU-SFC-012, and benchmark input SFC-PR-003.
- Write scope:
  - `projects/domainspec-v2/impl/cli/tools/run-resource-campaign.mjs`
  - `projects/domainspec-v2/impl/cli/contracts/resource-campaign-receipt.schema.json`
  - `projects/domainspec-v2/impl/cli/acceptance/resources/corpora`
  - `projects/domainspec-v2/development/first-production-release/stable-foundation-cli/evidence/resources`
- Done: environment/corpus/tool hashes, repeated measurements, limits and margins,
  stable over-bound diagnostics, no threshold adjustment to rescue a failure.
- Validation: `VC-SFC-014`.
- Execution owner: Task Session; cost/risk acceptance is not automatic.
- Expected receipt: `runs/SWU-SFC-014/TASK-SESSION-RESULT.json`.

## Parallel boundary

After SWU-010, 011→012 and 013→014 have disjoint product/evidence scopes and may
run in parallel only if the parent joins both receipts before W3.

