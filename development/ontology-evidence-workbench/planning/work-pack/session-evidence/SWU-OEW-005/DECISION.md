# Decision Gate — SWU-OEW-005 Upstream Output Scope

Status: **PASS — option A selected**
Decision: `DG-OEW-005-UPSTREAM-OUTPUT-SCOPE`

## Question

How should SWU-OEW-005 make its mandatory npm validation runnable and retain
the immutable upstream source/viewer handoff without writing outside its exact
target inventory?

## Options

### OEW005-A — Add package and two deterministic archives (recommended)

Add `package.json`, `source.tar.gz`, and `viewer-dist.tar.gz` as three governed
targets. The preparation script fetches/builds in a temporary directory, emits
normalized deterministic archives, writes the build receipt last, and removes
temporary residue. This preserves the approved npm interface and gives
SWU-OEW-006 an exact digest-bound viewer artifact. Cost: explicit Plan scope
amendment from six to nine targets.

### OEW005-B — Direct command plus two deterministic archives

Add only the source and viewer archives, and change validation to the exact
direct command `node scripts/prepare-upstream.mjs verify ...`. This minimizes
the amendment to eight targets but removes the discoverable package contract.

### OEW005-C — Defer upstream integration

Keep the verified Poker adapter prototype at SWU-OEW-004 and leave SWU-OEW-005
through SWU-OEW-020 pending.

### OEW005-D — Stop the work-pack

Terminate the serial chain at the four completed SWUs.

## Selected Option

`OEW005-A — Add package and two deterministic archives`.

The user selected option `A` on 2026-07-27. This authorizes an
`invoke:refresh:apply-approved` amendment limited to the SWU-OEW-005 planning
inventory and chain-resumption evidence. It does not itself fetch upstream or
write implementation bytes. Those operations remain inside a fresh
SWU-OEW-005 attempt-002 Task Session.

## Decision Rationale

Option A preserves the approved npm validation interface, retains an exact
source snapshot for audit, and gives SWU-OEW-006 a digest-bound viewer artifact
instead of an untracked cache. Temporary clone/install/build residue must be
removed after the two deterministic archives and receipt are materialized.

## Current Result

The owner choice is resolved. The original SWU-OEW-005 preflight `BLOCK`
remains terminal historical evidence; attempt 002 may proceed only after the
Invoke Refresh amendment passes.

## Remaining Blockers

None at the Decision Gate boundary.
