---
task_session: SWU-CDSC2-005
status: blocked
strict_coverage: pass
runtime: local
adapter: none
---

# Context Pack: SWU-CDSC2-005

## Scope

Freeze one parity-valid F3 generation-2 receipt from the parent F3
interpretation and the accepted M1/M2 observation receipts. Evaluation,
generation append, source mutation, identity inference, and pattern promotion
remain outside this SWU.

## Controlling Evidence

- `work-pack/tasks/TASK-CDSC2-GENERATION.md`, SWU-CDSC2-005 contract.
- Parent generation-1 F3 receipt and approved matrix.
- Frozen generation-2 harness manifest and baseline witness.
- Accepted M1 permitted-screen observation receipt.
- Accepted M2 breaking-guard observation receipt.
- Frozen parent receipt schema and generation-2 parity preflight.

## Proven State

- M1 is supported: replacing only the step-9 implementation while preserving
  the screen key and interaction ports preserves all assigned baseline vectors.
- M2 is supported: committing `requestedStep` instead of `guardResult.step`
  changes both blocked destinations while the guard remains false.
- The parent F3 substitution observable says screen replacement and
  guard/orchestration mutation consequences are not observed.
- All six parent matrix cells for that observable are `not-explained` because
  the mutation observations were absent.

## Contradiction

The task simultaneously requires the parent `Q` and matrix to be copied as the
unchanged interpretive baseline and requires substitution observations to be
replaced with cited generation-2 evidence. Literal preservation would leave a
false absence statement inside a receipt that cites the observations. Replacing
the statement and its matrix cells changes part of the declared interpretive
baseline after outcomes are known.

## Gate

No F3 v2 receipt or evaluation was written. A human decision must select the
allowed adjudication model in `DECISION-GATE.md` before consequential mutation.
