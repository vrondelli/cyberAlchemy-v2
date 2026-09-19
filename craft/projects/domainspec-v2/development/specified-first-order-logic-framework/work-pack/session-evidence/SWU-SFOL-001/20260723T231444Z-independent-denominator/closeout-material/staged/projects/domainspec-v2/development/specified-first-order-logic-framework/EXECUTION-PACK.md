---
module: specified-first-order-logic-framework
version: 0.1.0
status: approved-for-execution
updatedAt: 2026-07-23
docType: execution-pack
---

# Execution Pack: DS-SFOL

## Planning Control

| Field | Value |
| --- | --- |
| planningGateStatus | pass |
| complexity | medium |
| baselineWave | W0 |
| activePlanRef | [work-pack/waves/W0.md](work-pack/waves/W0.md) |
| workPackManifest | [WORK-PACK.md](WORK-PACK.md) |
| layeringArtifact | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) |
| specRef | [SPEC.md](SPEC.md) |
| activeLayerWindow | L0 |
| lastPlannedAt | 2026-07-23 |
| readinessProfile | pilot |
| selectedSWU | SWU-SFOL-001 |

## Execution Sequence

```text
W0: 001 -> 002 -> 003 -> 004 -> 005
W1: 006 -> 007
W2: 008 -> 009 -> 010
W3: 011 -> 012 -> TASK-SFOL-VERIFY
```

The default sequence is serial because every unit establishes a contract used
by its successor. Parallel execution is not approved by this pack.

## Wave Board

| Wave | Decision | SWUs | Entry | Exit |
| --- | --- | --- | --- | --- |
| [W0](work-pack/waves/W0.md) | Can independent bounded semantic evaluation work at all? | 001-005 | work-pack gate pass | denominator and language corpus pass |
| [W1](work-pack/waves/W1.md) | Can pure clauses repeatedly test real symbols without adapter oracles? | 006-007 | W0 receipt closure | pure exact-set replay passes |
| [W2](work-pack/waves/W2.md) | Can owned source and effects be governed and contained? | 008-010 | W1 receipt closure | effect/source negative and replay checks pass |
| [W3](work-pack/waves/W3.md) | Is the unchanged framework portable across two features? | 011-012 + VERIFY | W2 closure and adopter approvals | final pilot verification receipt |

## First Task Session

- SWU: `SWU-SFOL-001`
- Contract:
  [TASK-SFOL-DENOMINATOR.md](work-pack/tasks/TASK-SFOL-DENOMINATOR.md#swu-sfol-001)
- Context selectors:
  [shared/context.md](work-pack/shared/context.md),
  [SPEC.md#required-invariants](SPEC.md#required-invariants), and
  [DESIGN.md#proof-boundary](DESIGN.md#proof-boundary)
- Mutation boundary:
  `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/denominator/`
  plus denominator-focused tests
- Terminal action: emit the Task Session receipt and hand it to
  `invoke:refresh:apply-approved`; do not start SWU-002 in the same Task
  Session.

## Closure Tasks

`TASK-SFOL-VERIFY` is closure-only and therefore exempt from carrying a
mutation SWU. It may read implementation and evidence and may write only its
declared verification report. It cannot repair failures.

## Execution Rules

1. Run one selected SWU per Task Session.
2. Capture live target digests at preflight; do not trust planning-time hashes.
3. Stop on contract, dependency, source-owner, exact-set, or containment
   failure.
4. Apply Invoke Refresh only to declared closeout targets and receipt path.
5. Refresh selects the unique successor but does not execute it.
6. Rebuild a strict Context Builder pack for each new Task Session.
7. Do not combine structural BTE and semantic DS-SFOL results into a broader
   readiness claim during this work pack.
