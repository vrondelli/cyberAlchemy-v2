# TASK-AAV-003: Governance Composition And Receipt Hardening

## Objective

Prove the evaluator composes C7 and C14 correctly, degrades honestly, and returns
receipts fit for owner review.

## Layer And Slice

- Layers: L1-L2
- Slice: S-AAV-2
- Wave: W2

## Dependencies

TASK-AAV-002 complete.

## Source Contracts

- [Shared context](../shared/context.md)
- [Traceability](../shared/traceability.md)
- [Cross-task gaps](../shared/cross-task-gaps.md)
- TASK-AAV-002 receipts

## Implementation Detail

### Fixture matrix

Add cases for:

- inherited working child pass;
- working record with durability, authority, new-area, or load-bearing claim block;
- governed non-canonical draft with named residue flag;
- canonical research default pass;
- unknown kind canonical claim block;
- process, rollup, or durability mismatch block;
- axiom unresolved rollup defer;
- durability override without owner note block and with note defer;
- promoted/demoted state without decision reference block;
- durable area missing C7 area contract or post-phase entrypoint flag/block as specified;
- load-bearing tree missing each D42/C14 field flag and inability to constrain/promote;
- top-level area or kind extension defer to owner gate;
- malformed registry/input tool errors;
- path traversal, symlink-parent escape, and inheritance cycle block.

### Receipt hardening

Receipts must be deterministic apart from explicit `run_id`/timestamp fields.
Stable output includes check ordering, rule references, source paths/digests,
target paths, verdict precedence, and actionable owner route. Text output is a
projection of JSON, not a separate decision engine.

Use a temporary copied fixture tree for post-phase checks. The live witness must
be non-mutating against the repository: create temporary targets outside the
checkout while using copied policy inputs, or validate an already-existing
read-only witness with no writes.

## Smallest Working Units

### SWU-AAV-005

- Goal: complete C7/C14, degraded-mode, path-security, and owner-gate fixtures.
- Source anchors: C7, C14, D42, C18, and [shared context](../shared/context.md).
- Related context: [traceability](../shared/traceability.md).
- Dependencies: SWU-AAV-004.
- Write scope: fixture corpus, harness, evaluator selector modules, and tests.
- Done criteria: every matrix row has expected verdict, exit code, check IDs, and owner route.
- Acceptance evidence: machine-readable fixture summary with zero unexpected results.
- Verification: fixture harness command documented by implementation.
- Execution owner: local-fallback.
- Handoff note: do not promote flag to pass merely because a draft may exist.

### SWU-AAV-006

- Goal: stabilize receipt output and run one non-mutating live witness.
- Source anchors: validation boundary, C18 verdicts, and [shared context](../shared/context.md).
- Related context: [G-AAV-001/G-AAV-004](../shared/cross-task-gaps.md).
- Dependencies: SWU-AAV-005.
- Write scope: reporter/CLI modules, receipt tests, and validation evidence directory.
- Done criteria: JSON receipt validates, text mirrors it, policy digests exist, repeat runs are stable, witness makes no repo writes.
- Acceptance evidence: receipt schema result, repeatability diff, and clean scoped git status.
- Verification: full suite, CLI witness, and `git diff --check`.
- Execution owner: local-fallback.
- Handoff note: capture evidence paths for constitution/discipline owners; do not edit their artifacts.

## Failure Modes

- False-positive rate is unknown until fixtures and local runs exist; CI remains deferred.
- A check broader than C18/C7/C14 is a scope defect.
- A receipt that omits source digest or owner route is not review-ready.
- Any repository mutation by validation is a block.

## Blocker And Gap State

No known blocker after TASK-AAV-002. G-AAV-003 remains an expected defer case;
G-AAV-004 keeps CI outside this task.

## Synchronization

Write fixture and live-witness receipts into the work-pack evidence before W3.
Do not update constitution or discipline status from this task.
