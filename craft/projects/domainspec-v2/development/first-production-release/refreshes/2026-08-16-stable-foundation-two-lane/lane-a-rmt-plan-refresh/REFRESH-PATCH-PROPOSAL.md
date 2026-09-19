# Refresh Patch Proposal — WP-RMT-002 S1 plan epoch

Status: proposal-only authoring complete<br>
Phase status: pass<br>
Handoff status: gated<br>
Mutation ready: false<br>
Live target changes: none<br>
Selected or executed SWU: none<br>

## Purpose

Stage the exact planning bytes required to bind accepted S1 semantics across
Operation, Event, State Machine, Workflow, their shared contracts and waves,
and the execution-entry projection. This package is not an apply package and
does not authorize editing the live plan.

## Binding

- Work Pack: `WP-RMT-002`.
- Semantic epoch: `WP-RMT-002/S1/2026-08-16`.
- Owner decision:
  `projects/domainspec-v2/development/first-production-release/decisions/2026-08-16-first-stable-foundation-candidate.md`.
- Decision SHA-256:
  `2168de08e9e0ea72a29ce74fb9a3285094aebaa05d72df34d9749e5cbdac20c9`.
- Closed S1 contract digest:
  `75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7`.

Any decision or contract change invalidates this candidate and requires a new
proposal, target inventory, validation, review, and owner decision.

## Exact target inventory

All live paths are under
`projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan/`.
The staged mirror is under `staged/` in this package.

1. `WORK-PACK.md`
2. `IMPLEMENTATION-LAYERING.md`
3. `EXECUTION-PACK.md`
4. `DISTILL-PLAN-VALIDATION.md`
5. `PLAN-TRANSPORT.md`
6. `GAP-LEDGER.md`
7. `SWU-MANIFEST.json`
8. `SWU-CONTRACTS.json`
9. `HOSTILE-CATALOGUE.json`
10. `RELATION-CONTRACTS.json`
11. `WRITE-SCOPE-BASELINE.json`
12. `VALIDATION-RESULT.json`
13. `EXECUTION-ENTRY.json`
14. `EXECUTION-ENTRY-VALIDATION.json`
15. `validate-work-pack.mjs`
16. `tasks/TASK-RMT-OP.md`
17. `tasks/TASK-RMT-EVENT.md`
18. `tasks/TASK-RMT-SM.md`
19. `tasks/TASK-RMT-WF.md`
20. `waves/W0-OPERATION.md`
21. `waves/W2-MAPPING-EVENT.md`
22. `waves/W3-STATE-MACHINE-WORKFLOW.md`

`STAGED-TARGET-MANIFEST.json` binds every baseline and staged SHA-256, byte
size, classification, source signal, diff count, and proposed validation. A
missing or extra target is a different proposal and must fail closed.

## Proposed semantic delta

1. Operation observes the versioned transaction/effect group, state-write
   attempt/outcome, durable-outbox checkpoint, stable occurrence identity, and
   commit outcome. State and occurrence commit atomically.
2. Event separates persistence, publication attempt, acknowledgement,
   delivery, and consumption. Publication is later, at-least-once, and
   idempotent with the same occurrence identity.
3. State Machine returns deterministic next-state and effect intents and
   executes neither publication nor compensation.
4. Workflow binds exact Operation and State Machine handles, preserves durable
   facts after commit, and permits only forward compensation.
5. Fixture/evaluator representability remains separate from independent
   provider, database, restart, recovery, delivery, and consumer evidence.
6. Eight ordered fault boundaries cover before state write, between state and
   outbox, after outbox/before publish, send failure, success/ack timeout,
   duplicate or reordered delivery, poison occurrence, and recovery/replay.
7. Eight further exact controls cover closed decode, future version, missing
   member, mixed commit, stale binding, occurrence reuse, rollback after
   commit, and non-idempotent retry.
8. All 40 affected SWU contracts repeat the epoch, contract digest, semantic
   inputs/outputs, acceptance tokens, and terminal closeout binding.

## Deliberately unchanged

- Seven meta types, 70 SWUs, ten stages per type, dependency graph, and sole
  frontier `RMT-OP-001`.
- All 189 planned write scopes and their single owners.
- Rule, Interface, and Mapping task/wave documents.
- Historical `PLAN-RECEIPT.json` and every prior receipt.
- REL-A's 18 relation translations and candidate-only fallback.
- Canonical registry, ontology, profile, definitions, schemas, product code,
  Craft, Inventory, telemetry, Git, release, and public surfaces.
- `selected_unit=null`, `route_id=null`, and authority effect `none`.

## Validation evidence

Run:

```bash
python3 projects/domainspec-v2/development/first-production-release/refreshes/2026-08-16-stable-foundation-two-lane/lane-a-rmt-plan-refresh/validate-staged-package.py "$PWD"
```

The current receipt is `STAGED-VALIDATION-RECEIPT.json`. It proves the exact
22-path set and hashes, live baseline preservation, JSON parsing, Node syntax,
text hygiene, staged-overlay Work Pack validation, 7/70/189 topology, 40/40
affected contracts, 8/8 fault boundaries, 16/16 S1 controls, 29/29 source
bindings, 43/43 route inputs, the new route digest, null selection, and
authority `none`.

It does not prove independent review, live apply, post-apply validity,
implementation, provider/database/restart behavior, production stability, or
release.

## Later apply gate

A future apply is a separate action and remains unauthorized. Before it can be
proposed as mutation-ready, the next owner must:

1. independently review all exact staged bytes and falsify the S1 contract and
   hostile matrix;
2. confirm the live baselines still equal this manifest;
3. obtain owner acceptance of the exact 22 staged hashes and no other paths;
4. build and validate an apply material package whose normalized target set
   equals this inventory;
5. apply only through a separately authorized Invoke Refresh
   `apply-approved` edge; and
6. rerun every validator on the actual applied bytes before any
   Implementation Readiness selection.

Changed staged bytes, baseline drift, a missing/extra path, failed validation,
or changed decision evidence requires a new candidate and renewed acceptance.

## Stop conditions

- Any live target edit during this proposal phase.
- Any target outside the exact 22 paths.
- Any selection or execution of `RMT-OP-001`.
- Any canonical/profile/schema/authority/product/ledger/Inventory/Git/release
  mutation.
- Any attempt to rewrite historical receipts, claim distributed exactly-once,
  collapse representability into provider proof, or treat validation as
  production/release evidence.
