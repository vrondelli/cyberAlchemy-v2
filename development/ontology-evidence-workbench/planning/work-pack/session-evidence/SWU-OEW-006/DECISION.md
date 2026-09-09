# Decision Gate — SWU-OEW-006 Validation Entrypoint

Status: **PASS — option A selected**
Decision: `DG-OEW-006-VALIDATION-ENTRYPOINT`

## Question

How should SWU-OEW-006 make its mandatory native-viewer validation runnable
without writing outside its exact target inventory?

## Options

### OEW006-A — Add `package.json` to SWU-OEW-006 (recommended)

Amend the Plan from four to five targets and add the discoverable
`test:native-viewer` script. Keep the task, manifest, developer workflow, and
future L0 reruns aligned. Cost: one explicit Plan scope amendment.

### OEW006-B — Replace npm validation with an exact direct command

Keep four targets and change validation to:
`node --test test/native-viewer-boundary.test.mjs test/native-viewer-poker.test.mjs`.
This minimizes write scope but removes the package-level validation interface.

### OEW006-C — Defer native-viewer integration

Keep the immutable upstream build as the current prototype ceiling and leave
SWU-OEW-006 through SWU-OEW-020 pending.

### OEW006-D — Stop the work-pack

Terminate the serial chain after the five completed SWUs.

## Recommendation

Choose **A**. It preserves the planned npm validation surface and matches the
precedent already used for SWU-OEW-004 and SWU-OEW-005. The amendment grants no
serving, authority, publication, release, or production status; a fresh
attempt-002 Task Session must still prove all native-viewer boundaries.

## Selected Option

`OEW006-A — Add package.json to SWU-OEW-006`.

The user selected option `A` on 2026-07-27. This authorizes an
`invoke:refresh:apply-approved` amendment limited to the SWU-OEW-006 planning
inventory and chain-resumption evidence. It does not itself write
implementation bytes, launch a server, or grant authority, publication,
release, deployment, or production status.

## Current Result

The owner choice is resolved. The original SWU-OEW-006 preflight `BLOCK`
remains terminal historical evidence; attempt 002 may proceed only after the
Invoke Refresh amendment passes.

## Remaining Blockers

None at the Decision Gate boundary.
