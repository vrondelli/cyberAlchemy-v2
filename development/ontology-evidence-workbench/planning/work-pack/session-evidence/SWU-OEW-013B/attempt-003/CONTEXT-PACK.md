# Strict Context Pack — SWU-OEW-013B Attempt 003

Status: **PASS**

This is persisted Task Session evidence for one fresh execution of
`SWU-OEW-013B`. It is not planning authority and it does not reuse attempt-002
runtime evidence.

## Resolution

- Mode: explicit SWU selection.
- Selected SWU: `SWU-OEW-013B`.
- Parent task / wave / layer: `TASK-OEW-VALIDATION-001` / `W1` / `L1`.
- Current selector: `SWU-OEW-013B`.
- Re-entry status: allowed because the controlling lock changed from
  `d997e40d…` to `41025fea…`, resolving blocker fingerprint
  `a02de413…`.
- Series budget: 6; consumed before this attempt: 3.

## Obligations

| ID | Obligation | Selected evidence | Status |
| --- | --- | --- | --- |
| O13B-01 | execute exactly 013B and never 014 | work pack, manifest, chain, continuity | covered |
| O13B-02 | preserve the immutable repaired target-8 lock | live lock, repair receipt | covered |
| O13B-03 | verify all 70 lock bindings before installation | lock validator, repaired lock | covered |
| O13B-04 | use one package root without registry mutation | manifest, lock, work pack | covered |
| O13B-05 | bind verified 006P, 007, and 008F inputs | repaired lock and manifest | covered |
| O13B-06 | run install → core build → dashboard Vitest → dashboard build | repaired lock and task contract | covered |
| O13B-07 | record exact core command, exit, tree digest, and 12 outputs | repaired lock and validation contracts | covered |
| O13B-08 | build in a fresh digest-named workroot and clean in `finally` | architecture, upstream baseline, repaired lock | covered |
| O13B-09 | retain one deterministic read-only content-addressed archive | task contract, architecture, repaired lock | covered |
| O13B-10 | independently verify inputs, output, archive, cleanup, and negatives | architecture and validation contracts | covered |
| O13B-11 | admit seven implementation writes only after material readiness | Task Session and closeout contracts | covered |
| O13B-12 | preserve protected bytes and authority/release ceilings | protected contract, work pack, task contract | covered |

## Selected Context

1. `planning/WORK-PACK.md` — selected state, global gates, ceiling.
2. `planning/work-pack/swu-manifest.json` — exact eight-target inventory,
   acceptance, validation, and successor policy.
3. `planning/work-pack/chain-state.json` — selector, budget, dependencies, and
   repaired blocker state.
4. `planning/work-pack/tasks/TASK-OEW-VALIDATION-001.md` — implementation and
   negative-witness contract.
5. `planning/work-pack/waves/W1-L1.md` — L1 order and no-014 ceiling.
6. `.arcanum/task-session/continuity/oew-work-pack-20260727.json` — exact
   resumed selector.
7. `design/ARCHITECTURE.md` — ADR-OEW-006 and producer/verifier boundary.
8. `design/UPSTREAM-BASELINE.md` — fresh-workroot and final-overlay contract.
9. `design/VALIDATION-CONTRACTS.md` — OEW-V-13 and receipt ceiling.
10. `planning/work-pack/shared/CLOSEOUT-CONTRACT.md` — preflight/admission and
    eight-projection synchronization.
11. `planning/work-pack/shared/PROTECTED-SET-CONTRACT.json` — immutable
    source-only isolation scope.
12. `implementation/ontology-evidence-workbench/upstream/L1-BUILD.lock.json`
    — immutable ordered execution contract.
13. `refresh/2026-07-29-l1-effective-build-order/refresh-receipt.json` —
    applied repair and exact new lock identity.
14. `planning/work-pack/session-evidence/SWU-OEW-013B/attempt-002/receipt.json`
    — diagnostic-only prior blocker; no runtime evidence reused.

## Constraints and Non-Goals

Only the seven absent implementation targets plus attempt-003 evidence and the
expected content-addressed archive may be written before closeout. The lock,
`package.json`, pnpm/workspace locks, upstream source/overlay, 014/014V
implementation, L2, public Arcanum, authority, promotion, publication,
deployment, release, production, and unrelated dirty files are excluded.

## Validation Surface

- repaired lock validator: 70/70;
- preselection frontier validator plus explicit live-selection checks;
- staged syntax, unit/negative tests, producer, and distinct verifier;
- canonical material-package validator and Task Session mutation admission;
- live `npm run build:l1 && npm run verify:l1-build`;
- live `node --test test/l1-final-build.test.mjs`;
- JSON/schema and all named negative witnesses;
- package hash and protected-set exact before/after equality;
- scoped diff and target-baseline checks;
- separate joined Invoke Refresh closeout owner.

Strict coverage: **12/12 obligations covered; no gap or contradiction.**
