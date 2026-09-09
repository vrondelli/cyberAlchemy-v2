# Execution Pack: Artifact Admission Validator

## Planning Control Fields

| Field | Value |
| --- | --- |
| planningGateStatus | pass for `SWU-AAV-001` only |
| complexity | medium |
| baselineWave | W0 |
| activePlanRef | [WORK-PACK.md](WORK-PACK.md) |
| workPackManifest | [WORK-PACK.md](WORK-PACK.md) |
| layeringArtifact | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) |
| activeLayerWindow | L0 |
| readinessProfile | pilot |

## Wave Plan

| Wave | Layer | Task | SWUs | Entry Gate | Exit Evidence | Parallelism |
| --- | --- | --- | --- | --- | --- | --- |
| [W0](work-pack/waves/W0.md) | L0 | TASK-AAV-001 | 001, 002 | C18 sources stable enough for candidate implementation | schema and four-verdict fixture contract | sequential; 002 waits for 001 |
| [W1](work-pack/waves/W1.md) | L0-L1 | TASK-AAV-002 | 003, 004 | W0 pass | strict policy loader and two-phase evaluator | sequential; core consumes loader |
| [W2](work-pack/waves/W2.md) | L1-L2 | TASK-AAV-003 | 005, 006 | W1 pass | full fixture matrix and stable receipt | sequential; reporting consumes hardening |
| [W3](work-pack/waves/W3.md) | L2 | TASK-AAV-004, TASK-AAV-VERIFY | 007, VERIFY exemption | W2 pass | docs, owner proposals, completion audit | docs and audit may overlap only after receipt shape freezes |

## Execution Rule

Run one SWU per Task Session. Do not execute the next SWU until the parent
work-pack records the prior receipt and dependency gate. No wave may mutate
definitions, Canonical Kinds, the constitution, or the discipline catalog.

## Current Handoff

- Selected wave: W0
- Selected task: TASK-AAV-001
- Selected SWU: `SWU-AAV-001`
- Context anchors: C18, D42, D51, D52, Canonical Kinds, and the task contract
- Expected result: candidate JSON schema/template/receipt contract and validation evidence
