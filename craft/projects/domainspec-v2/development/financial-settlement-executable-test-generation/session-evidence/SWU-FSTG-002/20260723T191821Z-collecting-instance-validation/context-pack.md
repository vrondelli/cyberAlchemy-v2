# Context Pack: SWU-FSTG-002

Status: strict Task Session evidence, not canonical planning authority.

## Identity

- Work pack: `financial-settlement-executable-test-generation/WORK-PACK.md`
- SWU: `SWU-FSTG-002`
- Mode: standard, strict
- Files selected: 7
- Obligation coverage: 8/8
- Runtime handoff: none; local fallback

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Expose pure node and edge validators. | PLAN Task 2 steps 1-2; DESIGN low-level components; current compiler checks | covered |
| O2 | Diagnostics carry stable code, subject, criterion, and source anchor. | PLAN Task 2 step 2; current error-code registry | covered |
| O3 | Throwing compiler uses the first ordered collected diagnostic. | PLAN Task 2 step 3; `compileDevelopmentProject` | covered |
| O4 | One invalid row does not prevent sibling instance materialization. | DESIGN workflow/risk guard; PLAN failure modes | covered |
| O5 | Node instance evaluation validates complete body formation. | PLAN Task 2 step 5; current kind-only proof evaluator | covered |
| O6 | Edge instance evaluation validates endpoints, kinds, scope, direction/family, and order. | PLAN Task 2 step 6; relationship contracts and current family-only evaluator | covered |
| O7 | Body and edge mutants make only their own cases red while valid siblings remain. | PLAN Task 2 step 7; focused engine/proof tests | covered |
| O8 | Full BTE regression and compiler/collector parity pass. | WORK-PACK verification; package `verify:bte` script | covered |

## Selected Evidence

- `WORK-PACK.md` — SWU-FSTG-002 contract, dependency, write scope,
  acceptance, validation, and closeout contract.
- `PLAN.md` — `Task 2 — Collecting Instance Validation`.
- `DESIGN.md` — low-level components, workflow process, decision flow,
  development-engine/proof-engine interface, and fail-fast risk guard.
- `development-engine.ts` — formation rules, relationship contracts, current
  fail-fast compiler, and replay identity.
- `development-engine.test.ts` — current formation/edge mutants and complete
  profile/subset regression.
- `proof-engine.ts` — node/edge instance catalogue generation and current
  kind/family-only evaluation.
- `proof-engine.test.ts` — exact six-catalogue, 89-obligation, replay, and
  mutation baselines.

## Constraints

- Preserve complete-profile 13-kind/16-family and 89-obligation behavior.
- Do not touch Financial Settlement source or public Arcanum.
- Collection does not weaken the throwing compiler.
- Stable diagnostics must be deterministic and instance-bound.
- Closeout may touch only the declared work-pack/evidence targets through
  `invoke:refresh:apply-approved`.

## Write Scope

- `projects/domainspec-v2/impl/test-derivation-engine/src/bte/development-engine.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/bte/development-engine.test.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/bte/proof-engine.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/bte/proof-engine.test.ts`

## Validation

- focused development/proof Vitest files
- `npm --prefix projects/domainspec-v2/impl run verify:bte`

## Excluded Candidates

- Financial Settlement feature source — prohibited and not needed for this
  engine-level SWU.
- projector/emitter modules — belong to SWU-FSTG-003/004.
- semantic-validation internals — stable BTE diagnostic precedent only; the
  current SWU owns development-engine diagnostics.

## Result

Strict coverage passes. The selected local implementation path is bounded, but
reusable mutation admission must still bind an Invoke-owned exact material
package before the first implementation write.
