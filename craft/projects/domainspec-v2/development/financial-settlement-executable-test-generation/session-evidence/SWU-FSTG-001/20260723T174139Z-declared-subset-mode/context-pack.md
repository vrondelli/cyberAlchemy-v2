# Context Pack: SWU-FSTG-001

Status: session evidence, not canonical planning authority.

## Identity

- Task: `TASK-FSTG-SUBSET`
- SWU: `SWU-FSTG-001`
- Mode: lean
- Runtime: local
- Work pack:
  `projects/domainspec-v2/development/financial-settlement-executable-test-generation/WORK-PACK.md`

## Obligations

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Add explicit `complete-profile` and `declared-subset` coverage modes. | WORK-PACK SWU-FSTG-001; PLAN Task 1 | covered |
| O2 | Preserve complete-profile as the compatibility default. | IMPLEMENTATION-LAYERING L0 guardrail; current engine exact-set checks | covered |
| O3 | Require a non-empty declared subset using only canonical allowed kinds/families. | PLAN Task 1 algorithm steps 3-4 | covered |
| O4 | Bind mode and exact declared sets into receipt/replay identity. | PLAN Task 1 steps 4-5; current receipt/replay symbols | covered |
| O5 | Add valid subset and empty/unknown/mutation negative tests. | PLAN Task 1 step 6; existing focused test style | covered |
| O6 | Keep writes inside the development engine, focused tests, and package scripts. | WORK-PACK write scope | covered |
| O7 | Validate focused behavior and the complete BTE regression. | WORK-PACK verification command | covered |
| O8 | Do not touch Financial Settlement source or release/public surfaces. | WORK-PACK handoff and package non-goals | covered |

## Selected Evidence

1. `WORK-PACK.md` — Control Fields and SWU-FSTG-001: selection,
   dependencies, write scope, done criteria, and validation.
2. `PLAN.md` — Task 1: ordered algorithm and failure modes.
3. `IMPLEMENTATION-LAYERING.md` — L0 boundary and complete-profile
   non-regression.
4. `DESIGN.md` — High-Level Structure and low-level development-engine
   responsibility.
5. `INVOKE-EVIDENCE.json` — plan result and explicit
   `mutation_runtime_ready: false` capability ceiling.
6. `development-engine.ts` — `DevelopmentProject`, exact-set checks,
   `profileDigest`, `compileDevelopmentProject`, and
   `replayDevelopmentBuild`.
7. `development-engine.test.ts` — deterministic compile, incomplete-profile,
   relationship, and replay mutation patterns.

## Hard Constraints

- Default behavior remains exact 13 kinds and exact 16 relationship families.
- Declared-subset mode is non-empty and cannot introduce unknown set members.
- Build receipt and replay must detect coverage-mode or declared-set drift.
- No opportunistic refactor and no Financial Settlement source mutation.
- All done criteria and validation commands are acceptance-critical.
- Implementation mutation requires a passing Task Session mutation-admission
  receipt immediately before the first code write.

## Decisions And Assumptions

- Decision: use an explicit project envelope discriminator rather than infer
  subset mode from missing members.
- Classification: nonconsequential and reversible within the development-only
  API.
- Assumption: omitted `coverage_mode` remains the compatibility form of
  `complete-profile`.
- No unresolved implementation choice blocks the SWU itself.

## Validation

```text
npx vitest run projects/domainspec-v2/impl/test-derivation-engine/src/bte/development-engine.test.ts
npm --prefix projects/domainspec-v2/impl run verify:bte
```

## Context Builder Result

- Files selected: 7
- Obligation coverage: 8/8, 100%
- Strict coverage: pass
- Noise: low; only SWU selectors and touched symbols were retained
- Blockers: mutation admission must still pass
