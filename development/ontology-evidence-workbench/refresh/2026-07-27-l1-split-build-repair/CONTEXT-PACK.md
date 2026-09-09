# Context Pack — OEW L1 Split-Build Repair

- Task: Invoke Refresh after `DG-OEW-006B-BUILD-ORDER` option A
- Mode: standard / strict
- Files selected: 14
- Obligation coverage: 7 of 7
- Strict coverage: pass
- Output index: `context-pack.json`

## Included Context

The pack binds the resolved choice and terminal 006B evidence to the current
Design, Plan, task, manifest, wave, and chain selectors. Every artifact closes
one of seven obligations: selected repair, historical preservation, temporal
ordering, target ownership, verifier separation, selection invalidation, or
authority ceiling.

## Excluded Candidates

- Implementation bytes: outside Invoke Refresh scope and unchanged.
- Poker/IOLM/Craft/authority/Arcanum: protected and read-only.
- Rejected audit prose: not needed because the current task receipt directly
  reproduces the blocker.

## Result

The context supports a planning-only refresh. Runtime handoff remains blocked
until the new exact-unit selection gate resolves.
