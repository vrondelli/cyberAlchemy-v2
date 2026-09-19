# Context Pack: SWU-SFOL-001

- Mode: standard
- Resolution: visible-session-context
- Work pack: `projects/domainspec-v2/development/specified-first-order-logic-framework/WORK-PACK.md`
- Task: `TASK-SFOL-DENOMINATOR`
- SWU: `SWU-SFOL-001`
- Runtime: local
- Strict obligation coverage: pass, 9/9 obligations mapped
- Execution readiness: blocked pending mutation-admission evidence

## Objective

Build the independent exact clause denominator that validates source/manifest
owned clause identities, anchors, content digests, kinds, and profile versions
without consuming parser, generator, binding, runner, evaluator, or receipt
outputs.

## Obligation Matrix

| ID | Obligation | Evidence | Coverage |
| --- | --- | --- | --- |
| O1 | Typed documented denominator API and data contract | task SWU Done criteria; SPEC invariants 2 and 7; BTE exact-set schema as brownfield precedent | covered |
| O2 | Deterministic ordering and serialization | task SWU Done criteria; SPEC exact-set identity/digest rule | covered |
| O3 | Reject malformed, missing, extra, duplicate, stale, and conflicting identities/digests | task acceptance boundary; BTE diagnostic precedents | covered |
| O4 | Prove forbidden dependency isolation | SPEC invariant 2; shared context invariant 2 | covered |
| O5 | Adopter-neutral positive and negative fixtures | task acceptance boundary; SPEC invariant 10 | covered |
| O6 | Stay inside denominator implementation and focused-test scope | task Write scope; work-pack SWU row | covered |
| O7 | Run focused Node tests, engine typecheck, dependency scan, and plan validator | task Validation surface; package scripts | covered |
| O8 | Preserve exact Task Session closeout contract | work-pack Closeout Sync Contract | covered |
| O9 | Obtain digest-bound Invoke material package, receipt, and producer schema before mutation | Task Session mutation-admission contract; INVOKE-EVIDENCE reports `mutation_runtime_ready=false` | covered, gate unresolved |

## Selected Evidence

1. `WORK-PACK.md`
   - Selectors: Control Fields; SWU Manifest row 001; Task Session Closeout
     Sync Contract; Blockers.
   - Covers: O6-O9.
2. `work-pack/tasks/TASK-SFOL-DENOMINATOR.md`
   - Selectors: Objective; Dependencies; SWU-SFOL-001; Synchronization.
   - Covers: O1-O8.
3. `SPEC.md`
   - Selectors: Required Invariants 2, 7, 8, and 10.
   - Covers: O1-O5.
4. `DESIGN.md`
   - Selectors: High-Level Structure/Independent denominator; Proof Boundary;
     forbidden dependencies.
   - Covers: O1, O2, O4.
5. `work-pack/shared/context.md`
   - Selectors: Global Invariants; Validation Baseline; Handoff Rule.
   - Covers: O2, O4, O5, O7.
6. `work-pack/shared/cross-task-gaps.md`
   - Selector: gap table and “No gap blocks SWU-SFOL-001.”
   - Covers: dependency/blocker classification.
7. `INVOKE-EVIDENCE.json`
   - Selectors: plan selected SWU; capability ceiling; closeout contract.
   - Covers: O8 and O9.
8. `projects/domainspec-v2/impl/package.json`
   - Selectors: `engine:test` and `typecheck` scripts.
   - Covers: O7.
9. `src/bte/contracts/exact-set.v1.schema.json`
   - Selectors: nonempty members, logical identity, content digest, unique
     members.
   - Covers: O1-O3 as non-authoritative brownfield precedent.
10. `src/bte/validation/diagnostics.ts`
    - Selectors: identity, digest, stale, exact-set, and recomposition
      diagnostics.
    - Covers: O3 as non-authoritative naming precedent.

## Constraints

- Core code may not contain Financial Settlement, AEO, or other adopter
  terminology.
- The denominator may consume only owner-manifest entries and source handles.
- It may validate identity and digest shape, but it may not parse DS-SFOL
  expressions or consume downstream output records.
- Existing BTE contracts are implementation precedents, not DS-SFOL semantic
  authority.
- This Task Session may execute only SWU-SFOL-001 and must stop after its
  terminal receipt.

## Write Scope

Planned implementation scope:

- `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/denominator/`
- denominator-focused tests and fixtures under the engine test roots

Task Session cannot expand those directories into an exact mutation inventory
until the Invoke-owned material package declares and binds the concrete files.

## Validation Surface

- targeted denominator Node/Vitest tests;
- engine TypeScript validation accepted by the package;
- forbidden-dependency scan;
- `python3 projects/domainspec-v2/development/specified-first-order-logic-framework/scripts/validate-plan-package.py`.

All are acceptance-critical.

## Excluded Candidates

- `src/formal/ast.ts` and `src/formal/eval.ts`: language/evaluator work belongs
  to later SWUs and cannot close a denominator obligation.
- feature bindings and generated tests: forbidden downstream/adopter inputs.
- structural BTE task plans: separate authority lane and unnecessary for this
  bounded implementation decision.

## Context Result

Context is complete and non-contradictory. No implementation choice needs a
human decision. Mutation remains fail-closed until the canonical admission
verifier sees the exact Invoke material package, its receipt, and the
producer-owned receipt schema.
