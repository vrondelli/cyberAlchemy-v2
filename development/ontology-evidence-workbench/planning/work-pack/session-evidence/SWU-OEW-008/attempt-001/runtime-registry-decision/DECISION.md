# Decision Gate — DG-OEW-008-RUNTIME-REGISTRY

Status: **PENDING OWNER CHOICE**

## Question

How should the selected L1 graph repair the mismatch between the central test
script registry and the exact target inventories of `SWU-OEW-008`–`014`?

## Why This Blocks

`npm run test:trust-rail` resolves to absent
`test/trust-rail.test.mjs`, but `SWU-OEW-008` may create only its three
declared overlay targets. Its co-located `.test.tsx` cannot run directly under
the pinned Node `v22.12.0`. The same mismatch exists for the focused commands
of 009–013, and `test:browser` points to an undeclared 014 runner.

No `SWU-OEW-008` implementation target was mutated.

## Options

### A — Add one owned runner target to each affected SWU

Keep the single existing OEW `package.json` and its already-registered command
names. Add the seven exact `test/*.mjs` paths already named by those commands
to the target inventories of 008–013 and 014. Archive this blocked cursor,
refresh the remaining nine-unit frontier, and retry 008 in a fresh Task
Session.

### B — Insert a central runtime-repair SWU

Add a new pre-008 unit that changes the existing `package.json` command
registry and introduces one generic source-test runner. This adds a selector,
changes the budget, and requires revalidation of the completed registry owner.

### D — Stop after the verified exact-source store

Retain the completed 006P/007 L1 work and perform no rendered-interface
mutation.

## Recommendation

Option A. It preserves the one-package runtime, makes every focused runner
explicitly owned, avoids reopening completed 006P bytes, and repairs the
browser runner at the same boundary.

## Decision

Selected: **pending**

## Boundaries

A or B changes exact target ownership and therefore requires Invoke Refresh,
a fresh remaining-frontier selection, and a new chain identifier. L2,
authority, publication, deployment, release, and production remain
unauthorized.
