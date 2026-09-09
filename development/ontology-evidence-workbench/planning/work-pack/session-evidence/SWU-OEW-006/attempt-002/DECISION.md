# Decision Gate — SWU-OEW-006 Protected Baseline

Status: **PASS — option A selected**  
Decision: `DG-OEW-006-PROTECTED-BASELINE`

## Question

How should the work pack recover from the stale, overly broad protected-set
baseline while preserving the already passing native-viewer implementation?

## Options

### A — Repair the protected-set contract and run attempt 003 (recommended)

Amend the Plan to snapshot governed source/evidence bytes only, explicitly
excluding volatile VCS metadata, dependency trees, caches, and other runtime
residue. Take a fresh attempt-start baseline, make no implementation changes,
rerun the 7/7 and 41/41 validations, and close G-OEW-L0 only if the fresh
before/after set is equal.

This preserves the actual isolation claim and removes volatility that is not
source authority.

### B — Reconcile the repository to the inherited baseline

Investigate every changed protected byte and restore or admit it through its
own owner before rerunning SWU-OEW-006. This is the strongest historical
reconciliation, but it is broad, potentially destructive, and outside the
five-target viewer scope.

### C — Waive equality using disjoint-write evidence

Accept the empty intersection between the five admitted writes and protected
scopes as sufficient. This is the smallest step, but it weakens the explicit
G-OEW-PREFLIGHT and G-OEW-L0 contract and cannot honestly be called exact
protected-set equality.

### D — Stop at the implemented-but-unclosed prototype

Retain the working viewer and all receipts, leave G-OEW-L0 open, and do not
select L1.

## Recommendation

Choose **A**. It fixes the faulty proof surface rather than weakening the gate
or disturbing unrelated shared work. The amendment grants no authority,
publication, release, deployment, production, or L1 status.

## Selected Option

`A — Repair the protected-set contract and run attempt 003`.

The user selected option `A` on 2026-07-27. This authorizes an
`invoke:refresh:apply-approved` amendment limited to the source-only protected
set contract/compiler, the SWU-OEW-006 attempt-003 receipt route, and chain
resumption. It authorizes no viewer implementation change, protected-source
change, L1 selection, authority effect, promotion, publication, deployment,
release, or production claim.

## Remaining Blockers

None at the Decision Gate boundary. Attempt 003 remains gated on a passing
Invoke Refresh material handoff and a fresh source-only before snapshot.

## Current Evidence

- native viewer validation: 7/7 pass;
- full OEW regression: 41/41 pass;
- staged/live target parity: 5/5 pass;
- admitted/protected path intersection: empty;
- inherited/current protected aggregate equality: block;
- L1 selected: false.
