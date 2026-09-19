---
node_type: decision
is_session: false
status: pass
boundary: INTERNAL — approval evidence for a public-safe Arcanum maintenance handoff
created: 2026-07-14
timestamp: 2026-07-15T00:50:53Z
decision_id: DEC-ARC-DG-COVERAGE-GUARD-APPROVAL
target_scope: Decision Gate additive coverage reconciliation guard
source: operator choice in decision-gate, 2026-07-14
---

# Decision: Approve Bounded Decision Gate Maintenance

## Consequential work

The maintenance loop could not mutate the public canonical Decision Gate skill,
add public regression material, run the governed experiment, or regenerate the
installed runtime until the operator explicitly approved the change scope.

## Considered options

1. Approve the bounded, public-safe update.
2. Reject the update and retain the current contract.
3. Defer the update without mutation.

The standing Explain / more-context path was used before selection and did not
count as consent.

## Selected option

**Option 1 — approve the bounded, public-safe update.**

## Approved scope

- add a product-neutral reconciliation guard before the first Decision Gate
  question and before `PASS`;
- map explicit source obligations, named blocker groups, owner handoffs, and
  collection quantifiers to a resolved decision, open blocker, explicit
  deferral, or labeled assumption;
- add one generic collection-versus-exemplar regression under the Decision Gate
  development harness;
- validate through Experiment Harness;
- regenerate the installed Decision Gate runtime from canonical source.

## Exclusions

- no change to the objective, authority rule, one-question cadence, standing
  Explain option, decision record, or output contract;
- no private DomainSpec evidence or paths in public Arcanum;
- no observability-counter repair in this maintenance scope;
- no canonical or generated mutation by this decision record or Invoke Refresh.

## Rationale and consequence

The evidence supports targeted hardening, not a core redesign: one isolated
collection-versus-exemplar miss was corrected before `PASS`, while the observed
core remained stable. This approval removes the maintenance approval blocker and
hands the bounded update to `sigil-development --update`. It does not claim that
Sigil Development, Experiment Harness validation, regeneration, or promotion has
already occurred.

## Gate result

- Result: `PASS`
- Decisions resolved: 1
- Blockers remaining for handoff: 0
- Deferred: reflection-state counter normalization, owned by observability
- Next owner: `sigil-development`

