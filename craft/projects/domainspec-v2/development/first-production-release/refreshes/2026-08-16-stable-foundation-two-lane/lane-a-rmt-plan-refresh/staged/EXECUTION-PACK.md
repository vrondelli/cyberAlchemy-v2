# Execution pack

## Admission model

Complexity is `high` and the plan is split. Admit exactly one frontier SWU at
a time through a fresh `task-session`. Do not prebuild context packs for later
waves; each selected unit must resolve current hashes, owners, semantic epoch,
and contract digest at admission time.

## Current execution state

The staged S1 projection is structurally `selection-ready`, with
`RMT-OP-001` as the sole frontier. No unit or route is selected:
`selected_unit` and `route_id` remain `null`. Staging does not make this
projection live. Implementation Readiness may evaluate it only after all 22
target bytes are independently reviewed, owner-accepted, applied exactly, and
freshly revalidated.

## Semantic admission binding

- Epoch: `WP-RMT-002/S1/2026-08-16`.
- Owner decision:
  `2168de08e9e0ea72a29ce74fb9a3285094aebaa05d72df34d9749e5cbdac20c9`.
- Contract:
  `75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7`.
- Allowed-route digest:
  `fbf715f4ce69802f1512d400e5bb3a600b96826131027e04a77cd9649c234e72`.
- Required-input denominator: 43 unique paths, including all 22 refreshed plan
  targets and the S1 decision.

`RMT-OP-001` must lock versioned transaction/effect-group observation,
state-write observation, durable-outbox checkpoint, stable occurrence
identity, commit outcome, and provider-proof separation. The route must reject
a stale epoch, decision digest, contract digest, target byte, or required
input before mutation.

## Satisfied historical prerequisite

Receipt
`846ddd35a91093e0d0e4292309783c31312f43b4b9ba863dec65f7ccba509e92`
still proves:

1. the five live ontology-v2 targets match their accepted postimages;
2. the ordinary live validator passes with no private environment override;
3. the post-apply hostile suite passes, including wrong-generation
   rollback-preimage rejection;
4. the ontology remains 6 implementations / 0 supporting / 0 relations / 4
   blueprints / 0 PromotionRecords, with authority `none`; and
5. the changed validator had exact owner authorization and a passing repair
   receipt.

The earlier blocked Plan receipt remains immutable historical evidence. The
new Distill artifact validates the staged S1 plan only; independent plan review
and apply acceptance remain separate gates.

## Standard per-SWU controls

- exact input hash, regular-file, semantic epoch, and contract-digest checks;
- scoped write inventory before and after;
- focused type tests before broader regressions;
- TypeScript typecheck, Python no-bytecode execution, Rust
  `--locked --offline` with a run-local target;
- fresh-process replay and deterministic semantic receipt;
- all eight S1 fault boundaries plus the eight closed-decode/identity/binding/
  rollback/retry hostiles with exact diagnostic codes;
- native fixture/evaluator representability kept separate from independent
  provider, database, restart, recovery, and acknowledgement evidence;
- hygiene, temporary cleanup, registry non-membership, candidate immutability,
  and authority `none`; and
- terminal receipt written last after independent review and repeating the S1
  epoch and contract digest.

The baseline remains fail-closed: any pre-execution creation or ownership drift
among the 189 planned paths routes back to Invoke Refresh before mutation.
Each Rust command's isolated Cargo target is an exact owned transient path with
no retention and mandatory cleanup before receipt.

## Claim ceiling

This pack plans candidate-local proof only. It selects and executes nothing,
does not authorize apply, and does not establish provider/database/restart
proof, distributed exactly-once delivery, ontology admission, promotion,
release, deployment, or production readiness.
