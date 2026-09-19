# Execution Pack — Stable Foundation CLI

## Control

| Field | Value |
| --- | --- |
| planningGateStatus | pass |
| complexity | high |
| baselineWave | W0 |
| workPackManifest | `WORK-PACK.md` |
| layeringArtifact | `IMPLEMENTATION-LAYERING.md` |
| readinessProfile | release-candidate |
| executionState | selection-ready; no selected unit |

## Choreography

```text
W0 contract denominator (001-006)
  -> W1 commands and compiled build (007-010)
  -> W2 security and resources (011-014; disjoint campaigns may run after W1)
  -> W3 compatibility and recovery (015-018)
  -> W4 independent candidate/pilot closure (019-020)
  -> separate release-owner decision
```

## Wave index

| Wave | Layer question | SWUs | Parallel rule | Gate |
| --- | --- | --- | --- | --- |
| [W0](work-pack/waves/W0-CONTRACT.md) | Is the contract representable and fail-closed? | 001–006 | sequential | all contract/root/profile/schema mutants killed |
| [W1](work-pack/waves/W1-COMPILED-CLI.md) | Do the commands and compiled artifact repeat deterministically? | 007–010 | sequential | command/no-write/build/two-root pass |
| [W2](work-pack/waves/W2-HARDENING.md) | Do security and limits fail closed? | 011–014 | 011→012 and 013→014 may run as disjoint lanes | both campaign receipts pass |
| [W3](work-pack/waves/W3-COMPATIBILITY-RECOVERY.md) | Are history and recovery versioned and immutable? | 015–018 | sequential after W2 joins | N-1 and archive/recovery drills pass |
| [W4](work-pack/waves/W4-PILOT-READINESS.md) | Can an independent operator/verifier hand off the exact candidate? | 019–020 | sequential | frozen binding and green/red pilot pass |

## Stop conditions

- unresolved semantic/product choice or scope expansion;
- profile/schema/authority/promotion/publication/release/deployment mutation;
- destructive cleanup, credentials, secret access, network/external message;
- acceptance-critical validation failure or changed bound input;
- task-shaped SWU, undeclared write, stale baseline, missing owner receipt;
- request to treat the candidate as the complete July product.

## Receipt joins

Every wave joins exact Task Session receipts and fixed closeout receipts. A wave
cannot infer success from file presence, an authored test, or a later successful
cleanup command. The first failed acceptance-critical command controls the result.

