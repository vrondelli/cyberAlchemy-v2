---
decision_id: DEC-GCP-001
status: pending
created: 2026-07-20
target: SWU-GCP-001
owner: user
decision_gate: block
---

# Decision: Where Does The Key-And-Door Formal Predicate Live?

## Blocker Question

What source may author the formal predicate and fixture inputs required to turn
`HasKeyRule --enforces--> UnlockDoor` into a real generated assertion?

The current Rule source declares only `formal_return_type: boolean`. The emitter
correctly refuses to derive an expected value without an authored formal
expression. Proceeding without this decision would invent semantics.

## Options

### 1. Evidence-local v1 operations aspect — recommended

Author an L0 `operations.md` under the SWU evidence source with a formal rule such
as `has_key == true`, plus fixture inputs. Treat it as an explicit Task Session
source composed with the existing minted graph.

- Benefit: smallest reversible path; stays inside the current write scope;
  directly tests the v1 aspect-adapter decision.
- Cost/risk: proves graph-plus-aspect composition, not that minted Rule nodes can
  yet carry executable predicates by themselves.
- Downstream impact: SWU can proceed; L1 still decides whether the predicate
  belongs in a generalized node/profile schema.

### 2. Extend the minted Rule contract and compiler adapter

Add an authored predicate field to the Rule formation/source contract and map it
through the minted compiler into the derivation engine.

- Benefit: formal semantics travel with the node and generalize beyond this SWU.
- Cost/risk: changes shared schemas, compiler behavior, fixtures, and authority
  surfaces; exceeds the L0 evidence-only write scope.
- Downstream impact: requires a refreshed plan or separate bounded SWU before the
  current proof can execute.

### 3. Preserve the current source and emit an honest blocked receipt

Run only structural admission and record `needs_formal` without a real assertion.

- Benefit: zero semantic assumption and immediate evidence of honest failure.
- Cost/risk: does not meet `SWU-GCP-001` done criteria and cannot close L0.
- Downstream impact: task remains blocked until option 1 or 2 is later selected.

### Explain / more context

This is non-committal. Expand the evidence and downstream implications, then ask
the same decision again.

## Recommendation

Choose option 1. It is the narrowest reversible trust-building step, exercises
the already-approved v1 aspect adaptation, and does not force a premature shared
schema change. The receipt must explicitly limit its claim to
`minted graph + authored operations aspect -> executable local proof`.

## Decision Record

- Selected option: pending user choice
- Source of decision: pending
- Remaining blockers: 1
- Assumptions: none
