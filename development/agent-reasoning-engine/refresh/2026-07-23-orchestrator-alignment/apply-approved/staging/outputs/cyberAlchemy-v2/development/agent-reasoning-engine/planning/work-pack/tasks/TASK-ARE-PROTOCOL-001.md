# TASK-ARE-PROTOCOL-001 — bounded actor protocol

Layer: L1. Depends on G-ARE-L0. Status: planned.

Future write scope: `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/actor-protocol/**` and protocol fixtures only.

## Integration entry condition

The current journal package path, storage algorithm, and transport interfaces
are provisional. No implementation may create a second integrated runtime-
journal authority. `ACI-REASONING-BINDING` must first select exactly one:

1. an ACI-subordinate adapter and conformance path;
2. an explicitly local-only protocol witness with a later integration gate; or
3. an incompatible/rejected path with a reroute.

Work Bus and APT mappings remain optional candidate interfaces. SWU-ARE-003
must not import their draft schemas as authority or claim integration from
shape similarity. Neither SWU is ready or selected by this condition.

## SWU-ARE-002 — immutable journal transitions

- Execution owner recommendation: `subagent`.
- Inputs: passed entry run handle, frozen technique/effort plan, immutable actor
  commands, required/optional join policy, clock and attempt adapters.
- Outputs: ordered `RuntimeJournal`, attempt receipts, terminal join/close state.
- Dependencies: SWU-ARE-012/013/015 and terminal L0 receipt.
- Write scope: `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/actor-protocol/src/journal/**`, transition schemas,
  and `test/journal-*.test.mjs` only.

Algorithm: validate run/plan digests; assign idempotent command ID; persist
`dispatched` before delivery; record `started`; accept proposed/failed/timed-out
events; evaluate required/optional joins from frozen policy; cancel remaining
work at stop/ceiling; persist `closed`. Duplicate commands return the retained
attempt. Late events are retained as late and never reopen closure.

Failure modes: sequence gap, digest mismatch, duplicate event, lost delivery,
timeout, partial required lane, late event, crash before/after delivery.

Done when transition, retry, timeout, partial-failure, late-event, crash-cut,
and digest tests pass while the journal emits no semantic outcome.

Verification: `node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/actor-protocol/test/journal-*.test.mjs`.

Split rationale: observation transport can pass independently, so it is
SWU-ARE-003.

## SWU-ARE-003 — observation/challenge transport

- Execution owner recommendation: `subagent`.
- Inputs: closed journal proposals/challenges, issuer/source/transform/time
  metadata, frozen manifest and challenge policy.
- Outputs: versioned proposed observation/challenge bundle for the evaluator-
  owned admitter; no applicability or outcome.
- Dependencies: SWU-ARE-002 and SWU-ARE-011.
- Write scope: `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/actor-protocol/src/transport/**`, transport schemas,
  and `test/transport-*.test.mjs` only.

Algorithm: select journaled proposal events; preserve provenance and temporal
scope; group duplicates without voting; attach required-lane completion and
challenge-closure posture; reject malformed transport records; hand immutable
bundle to the evaluator boundary. Never merge consensus into confidence.

Failure modes: malformed provenance, missing validator, disagreement, duplicate
claim, required-lane timeout, schema-valid unsupported prose, late challenge.

Done when all failure/transport fixtures pass and evaluator-owned admission—not
transport—returns admitted/rejected/unresolved posture.

Verification: `node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/actor-protocol/test/transport-*.test.mjs`.

Handoff context: this task, L0 terminal receipt, architecture component/flow
contracts, and one selected SWU only. Return the result shape in
[`../../EXECUTION-PACK.md`](../../EXECUTION-PACK.md); the parent performs the join.
