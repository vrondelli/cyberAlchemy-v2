# Decision Gate — SWU-OEW-004 Validation Entrypoint

Status: **PASS — option A selected**
Decision: `DG-OEW-004-VALIDATION-ENTRYPOINT`

## Question

How should SWU-OEW-004 make its mandatory `verify:adapter` validation runnable
without silently exceeding its approved target inventory?

## Options

### OEW004-A — Add `package.json` to the SWU target inventory (recommended)

Add `package.json` as the tenth SWU-OEW-004 target and add the
`verify:adapter` script. This preserves the already approved npm validation
interface and keeps local/CI use simple. Cost: explicit Plan scope amendment.

### OEW004-B — Change the validation contract to a direct verifier command

Keep the nine implementation targets and replace `npm run verify:adapter` with
an exact `node scripts/verify-adapter-receipt.mjs ...` command. This minimizes
write scope but changes the approved validation interface and makes the
package-level contract less discoverable.

### OEW004-C — Defer

Leave SWU-OEW-004 and all successors pending. No implementation bytes change.

### OEW004-D — Stop

Terminate the work-pack chain at the three completed SWUs.

## Selected Option

`OEW004-A — Add package.json to the SWU target inventory`.

The user selected option `A` on 2026-07-27. This authorizes an
`invoke:refresh:apply-approved` amendment limited to the SWU-OEW-004 planning
inventory and chain-resumption evidence. It does not write implementation
bytes. The `verify:adapter` package script remains part of the fresh
SWU-OEW-004 Task Session target set.

## Decision Rationale

Option A preserves the approved package-level validation interface, keeps the
local and CI command discoverable, and makes the necessary scope increase
explicit instead of hiding it in execution.

## Current Result

The owner choice is resolved. The prior Task Session `BLOCK` remains terminal
historical evidence; a fresh resumed attempt may proceed only after the Invoke
Refresh amendment passes.

## Source

- `planning/work-pack/swu-manifest.json` — exact target inventory and validation;
- `implementation/ontology-evidence-workbench/package.json` — missing script;
- `closeout-preflight.json` — current failing probe.

## Remaining Blockers

None at the Decision Gate boundary.
