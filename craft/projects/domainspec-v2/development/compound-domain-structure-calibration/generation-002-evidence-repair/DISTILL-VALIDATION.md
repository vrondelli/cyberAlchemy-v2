---
artifact_id: CDSC2-DISTILL-v0.1
mode: validate
verdict: pass
role_execution: local-proposer-balancer
---

# Distill Validation

## Objective And Target

Validate that the generation-2 evidence-repair plan is the smallest coherent
execution package that can close the two missing F3 observations and append a
successor without changing generation 1 or Savvy.

## Budget

Validate mode, one proposal track, one Proposer pass, one Balancer pass, and one
reconciliation. The mode is mandated by Invoke Plan; no broader tournament is
needed because the parent audit fixes the repair route.

## Role Trace

| Role | Claim or objection | Category | Reconciliation |
| --- | --- | --- | --- |
| Proposer | Start by running the two mutations in an isolated harness. | candidate unit | revised |
| Balancer | Mutation evidence is inadmissible before schema parity, predecessor safety, source pins, and baseline equivalence pass. | hidden prerequisite | accepted; L0 split into SWU-001 and SWU-002 |
| Proposer | Combine F3 receipt repair and generation append. | task reduction | revised |
| Balancer | Evidence must freeze before evaluation, otherwise outcome knowledge can alter adjudication. | owner/order boundary | accepted; SWU-005 and SWU-006 remain separate |
| Balancer | Add browser rendering and more screen substitutions. | requisite variety | rejected; neither is needed to answer the two frozen F3 gaps |

## Smallest Coherent Unit

`SWU-CDSC2-001` is the first smallest coherent unit: it establishes strict
schema parity, protected generation-1 bytes, and successor-envelope semantics.
Splitting it further would leave either receipt validation or predecessor
construction without an executable acceptance gate.

The smallest coherent full repair remains seven SWUs:

```text
001 -> 002 -> (003 || 004) -> 005 -> 006 -> 007
```

## Technique Trace

| Technique | Inspected state | Result |
| --- | --- | --- |
| abstraction-level guard | evidence repair versus general UI formalization | kept scope at one F3 successor generation |
| recomposition proof | seven SWUs and L0-L3 layers | every unit contributes one required gate or artifact |
| evolution profile | possible later fixtures and browser evidence | deferred behind a non-deferred generation-2 verdict |
| frame-expiry note | source or parent contract changes | any drift invalidates this optimization point and requires repinning |
| navigable result check | work-pack start route | `SWU-CDSC2-001` is explicit and dependency-clear |
| premortem | likely false evidence from a drifting model harness | baseline-equivalence gate blocks both mutants |

## Closure And Recomposition

- Responsibility: one successor evidence-repair generation.
- Inputs: generation-1 handles, frozen schemas, bounded Savvy selectors.
- Outputs: parity/harness proof, two mutation receipts, F3 v2, generation 2,
  replay/audit.
- No hidden glue: every handoff is a stable artifact or receipt.
- No smuggled scale: visual testing, more screens, more fixtures, and
  cross-domain replication are deferred.

L0 makes evidence admissible, L1 observes it, L2 adjudicates and appends it,
and L3 independently verifies it. The units recompose exactly into the approved
architecture.

## Tension Ledger

Resolved: isolated harness versus source mutation; baseline fidelity versus
model convenience; evidence freeze versus evaluation; successor append versus
generation rewrite.

Unresolved non-blocker: direct browser behavior and portability are outside the
experiment and remain explicit residue.

## Verdict

`pass`. The plan is mutation-handoff ready with no acceptance-critical hidden
gap. Start with `task-session` on `SWU-CDSC2-001`.
