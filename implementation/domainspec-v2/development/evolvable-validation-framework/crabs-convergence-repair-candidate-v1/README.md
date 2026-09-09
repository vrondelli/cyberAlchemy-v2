# CRABS ordered-set convergence repair candidate

Status: implemented prototype candidate; not approved
Base CRABS commit: `9e3a0a6fbaa3f163d0afc5afa94a65fbc5be1937`
Candidate commit: `477799721668652988bf98a4a9067d08f5bdaebf`
Branch: `codex/ordered-set-convergence-repair`
Repair digest: `23dd76e385a968f1116e2c5975609f9abf1674e6056d2828b0921bd898578a5b`
Authority effect: none

## Plain answer

The original CRABS ordered-set merge could leave two replicas with opposite
orders. This candidate changes order from an accident of linked-list arrival
into replicated data: every element carries a durable placement anchor and a
placement-version ID. Merge combines those records, resolves concurrent
placements deterministically, and rebuilds the linked list from the result.

The exact original two-element failure is repaired at the checked bound. Five
native regression groups pass, and CBMC 6.11.0 reports no counterexample for
the named two-singleton commutativity assertion. That is useful evidence for
this candidate, but it is not a whole-system proof or product approval.

Read [FINDINGS.md](FINDINGS.md) for the detailed explanation and
[implementation-layering.md](implementation-layering.md) for what remains.
Use [COMMIT-REVIEW.md](COMMIT-REVIEW.md) as the maintainer-facing review guide
or as the source for a future pull-request description.

## What changed

- `src/OT/ot_ordered_set.h` stores an anchor and placement version per element.
- `src/OT/ot_ordered_set.c` preflights merges, rejects conflicting immutable
  payloads and ambiguous equal-version placements, merges placement records,
  keeps deletion monotonic, and materializes one deterministic list.
- A move becomes a last-writer-wins update of the complete order known by that
  replica, identified by the move operation ID.
- Serialization format v8 carries placement metadata. Reading v1-v7 state
  reconstructs anchors from the old serialized order.
- Compaction rebuilds placement anchors for the compacted visible sequence.
- Unit-test candidates cover the original failure and payload conflict.
- Standalone native harnesses make the current evidence runnable without the
  unavailable full CRABS dependency build.

The durable patch is
[`patches/crabs-ordered-set-convergence.patch`](patches/crabs-ordered-set-convergence.patch).
The isolated repair worktree is committed and its topic branch has been pushed
to the CRABS origin. No pull request has been opened.

## How TDE and EVF connect here

```text
TDE obligation
  Two distinct singleton replicas must produce the same ID order
  in both merge directions.
        |
        v
EVF evidence binding
  exact repair bytes + exact harness + declared allocation/loop bounds
        |
        +--> GCC 13: compile and run concrete examples
        |
        +--> CBMC 6.11.0: check main.assertion.3 in actual C
        |
        +--> JSON Schema: reject malformed evidence receipts
        |
        +--> SHA-256 + Git: bind every result to exact bytes
        v
bounded result + explicit unproved residue
```

TDE owns the tool-neutral statement of what must be true. EVF chooses and
controls the tools that can answer it. CBMC is used now because the obligation
is about executable C at a small finite bound. Alloy, TLA+, and Lean are not
part of this receipt:

- TLA+/TLC is appropriate later for delivery orders and multi-replica event
  schedules.
- Lean is appropriate later for algebraic laws of a precise abstract merge
  definition.
- Alloy could explore a relational placement model, but it would overlap with
  the planned small-state model and would not prove the C implementation. It
  is therefore not required in this candidate.

None of those abstract tools would replace a separate correspondence argument
showing that CRABS C implements the abstract model.

## Reproduce

Validate exact byte and tool bindings:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 scripts/validate.py
```

Run native checks and the bounded CBMC obligation, then append a receipt:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 run.py
```

The runner uses the exact locally installed GCC 13 and CBMC 6.11.0 binaries
recorded in `source-manifest.json`. Provider execution does not use the network.

## Current evidence

- Validation: PASS.
- Current commit-bound receipt: `crabs-repair-cc62151b7c091109`.
- Native obligation: PASS.
- Native regression groups: 5 PASS.
- CBMC named property: SUCCESS.
- Normalized result: `NO_COUNTEREXAMPLE_AT_BOUND`.

The evidence does not authorize a commit, push, pull request, upstream report,
release, deployment, migration, or product approval.
