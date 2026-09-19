---
artifact_id: UIR-DISTILL-VALIDATION-v0.2
mode: validate
verdict: pass
validated_at: 2026-07-12
target: successor implementation plan
---

# Distill Validation

## Objective And Inputs

Validate whether the successor implementation plan, layering, work-pack,
task/SWU contracts, waves, and dispatch are small enough to execute, complete
enough to preserve meaning, and able to recompose into SWU-UIR-010.

Inputs inspected:

- approved refresh report and final decision gate;
- `IMPLEMENTATION-PLAN.md` and `IMPLEMENTATION-LAYERING.md`;
- `WORK-PACK.md`, `EXECUTION-PACK.md`, tasks, waves, and shared ledgers;
- successor dispatch and active gaps.

## Verdict

`pass`: the plan has a single navigable start, complete task-local execution
contracts, one parent per SWU, explicit validation, and a closed recomposition
path. Target-owned evidence gaps remain visible but do not block SWU-UIR-011.

## Role Conversation Trace

### Round 1

- Proposer claim: use four vertical successor slices for absence, policy,
  relationships, and composition.
- Evidence: decisions map naturally to independent record families.
- Balancer objection, responsibility overlap: contract construction and
  source-dependent corpus generation have different failure and replay
  boundaries.
- Reconciliation: split bounded-search contract proof into SWU-011 and corpus
  publication into SWU-012.

### Round 2

- Proposer claim: use five successor SWUs, then existing SWU-010.
- Evidence: write scopes and predecessor handles are disjoint through L1S and
  join once at L2S.
- Balancer objection, authority leakage: relationship closure could be embedded
  into the transport packet or misread as DS-D8 mutation.
- Reconciliation: SWU-014 owns a separate digest-bound owner-decision record;
  packet generation 001 and authority remain read-only.

No stable disagreement remains at the planning level.

## Smallest Coherent Unit

SWU-UIR-011 is the smallest executable unit. It owns one responsibility:
constructing finite-search evidence and proving every failure branch before the
observation vocabulary widens. Splitting schema/evaluator/negative fixtures
would permit an unsafe partial contract; combining generation 002 would mix
contract proof with real-source publication.

## SWU Closure Checks

| SWU | Responsibility closes | Write scope | Verification | Parent |
| --- | --- | --- | --- | --- |
| 011 | bounded-search construction | contract/evaluator/fixtures/tests | focused Node tests | TASK-UIR-ABSENCE |
| 012 | corpus generation 002 | corpus-v2 builder/results/tests | replay + digest audit | TASK-UIR-ABSENCE |
| 013 | dossier policy evaluation | policy schema/builder/results/tests | threshold/independence tests | TASK-UIR-DOSSIER-POLICY |
| 014 | relationship owner decisions | decision schema/builder/results/tests | digest/options/relations tests | TASK-UIR-RELATIONSHIP-DECISION |
| 015 | successor dossier/index | v2 composition/results/tests | full package replay | TASK-UIR-SUCCESSOR-COMPOSITION |
| 010 | integrated closure audit | audit result/handoff only | package + DomainSpec validation | TASK-UIR-VERIFY exemption |

Every non-exempt SWU includes dependencies, algorithm, edge cases, write scope,
done criteria, acceptance evidence, verification commands, execution owner,
Context Builder anchors, and expected result shape.

## Recomposition Proof

| Obligation | Producing SWU | Composed by | Audited by |
| --- | --- | --- | --- |
| finite absence construction | 011 | 012, 015 | 010 |
| successor corpus and lineage | 012 | 015 | 010 |
| portability and independent-positive states | 013 | 015 | 010 |
| relationship owner decisions | 014 | 015 | 010 |
| successor dossier/index | 015 | 010 | 010 |

The join has no hidden glue: SWU-015 explicitly owns handle validation,
conjunct state mapping, predecessor lineage, and replay.

## Hidden Gap Check

- Portability evidence remains below threshold: preserved as a typed output,
  not a blocked implementation run.
- Form/Action positives remain missing: preserved without fail/kill inference.
- Action-source lacks an exact signature witness: route-open only.
- Upstream design prose predates decisions: non-blocking patch request exists;
  the approved refresh report is the execution design reference.
- Runtime parallelism needs user confirmation: local sequential Task Sessions
  remain available, so no execution blocker exists.

## Overbuild And Deferred Complexity

Five SWUs are justified by distinct contract/publication/owner/composition
boundaries. No per-candidate SWUs, generic decision framework, migration engine,
or authority workflow was added. New corpus collection, candidate repair, and
signature design remain deferred to their owners.

## Premortem

Likely failure: an implementation rewrites v1 artifacts or treats an owner
decision record as authority mutation. Guardrails: new contract families,
predecessor handles, overwrite refusal, digest checks, packet/decision
separation, read-only state namespace, and prohibited-inference tests.

## Frame Expiry

This validation expires if DEC-UIR-007 through 010 change, generation-001
handles change, the DS-D8 authority digest changes, or Task Session discovers a
contract contradiction that affects acceptance.

## Navigation

Start with `WORK-PACK.md`, select SWU-UIR-011, then build runtime context from
`work-pack/tasks/TASK-UIR-ABSENCE.md`. Do not select another SWU until the
manifest dependency is accepted and synchronized.
