# SWU-VIS-004 — Craft synchronization

Owner: Craft / task-session

## Outcome

Create a child visibility context and index the plan, builder, JSON, and HTML so future
agents can discover and refresh the feature without reorientation.

## Write surface

`projects/domainspec-v2/.craft/ledger.yml` and this SWU receipt.

## Required invariants

- Parent FPR context stays at `stage: plan`, `gate: block`, and FPR-01 next move.
- Generated artifacts are described as read models, not authority.
- Every added id and artifact path is indexed exactly once.
- Child context points back to the parent FPR context and names the refresh/check command.

## Handoff

Produce `runs/SWU-VIS-004/RESULT.md` for SWU-VIS-005.
