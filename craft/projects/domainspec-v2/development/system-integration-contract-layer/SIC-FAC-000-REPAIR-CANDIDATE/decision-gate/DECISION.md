# SIC-FAC-000-R1 Claim Alignment Decision

## Decision question

How should the factory establish an exact mechanically enforceable relation between locked node claim ceilings and provider-result claim ceilings for the 31 current mismatches?

## Why this blocks mutation

The staged equality check is correct for the hostile overclaim, but it also rejects 31 current suite results. Aligning either side changes semantic claim authority; the generic factory owner cannot infer that choice from an execution repair authorization.

## Options

### A — Align locks to current evidence (recommended)

Have the family claim owners approve the 31 exact provider-result claim strings, then update the 9 fixture request files to those exact values and extend the material package. This is the smallest implementation change and keeps providers intact, but it turns current provider evidence prose into pre-authorized locked claims and therefore needs explicit claim-owner acceptance.

### B — Normalize conservative common ceilings

Choose new conservative claims and update both providers and fixtures to the same exact strings. This can reduce claim breadth, but touches more implementation and evidence owners and requires regenerated family evidence.

### C — Design another exact relation

Use the SIC contract's alternative-relation clause to define a new exact mechanism, such as typed claim identities plus separately locked prose. This avoids immediate prose synchronization but is an architecture change with a larger contract, codec, lock, provider, and migration surface.

### D — Defer

Keep the separately staged five-file proposal and diagnostic evidence. Product bytes remain unchanged and downstream integration work remains blocked.

### E — Stop

Close this candidate without repair. Both original SIC blockers remain unresolved.

## Standing context option

`Explain / more context` does not select an option. It requests a deeper comparison and the same decision will be presented again.

## Current gate state

- Result: `BLOCK`
- Selected option: none
- Remaining blocker: semantic claim alignment owner decision
- Product bytes changed: 0
- Source: pre-admission fixture audit on 2026-08-13
