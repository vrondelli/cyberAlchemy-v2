---
decision_id: DEC-DSV2-FOUNDATION-ACTIVATION
target_scope: domainspec-v2-foundation-execution
status: accepted
decided_at: 2026-07-14T18:21:58.644Z
source: human-decision-gate
---

# Foundation Execution Activation Decision

## Decision Question

How far should the foundation-execution plan be authorized to proceed after Invoke planning?

This decision blocks two consequential actions: linking the new work-pack into Craft continuation state and beginning its first Task Session unit.

## Considered Options

| Option | Benefit | Cost or risk | Downstream impact |
|---|---|---|---|
| 1. Register plus review SWU | Makes the plan discoverable and immediately gathers the exact evidence needed to repair the guard. | Creates one Craft state change and one bounded evidence run. The review may find an active reference and return `BLOCK`. | Link the package without advancing FPR state, then run only `SWU-SGRM-006-R1`. |
| 2. Register only | Establishes durable continuation without execution risk. | Leaves the live guard red and requires another authorization step. | Link the package; keep every SWU not started. |
| 3. Keep as draft | Makes no continuation or execution mutation. | The plan remains outside Craft and the guard remains red. | Stop after the planning package. |

## Selected Option

**Option 1 — Register plus review SWU.**

Source of decision: the user replied `1` to the Decision Gate on 2026-07-14.

## Rationale

The selected SWU is evidence-only and reversible at the planning level: it enumerates and classifies current matches, emits a disposition packet, and cannot change the guard, allowlist, frozen manifest, authority, or implementation. Registering first preserves Craft as continuation authority while the parent FPR next move remains unchanged.

## Authorization Boundary

Authorized:

1. Link the foundation-execution package under `CTX-DSV2-FIRST-PRODUCTION-RELEASE`.
2. Preserve the parent context's current FPR-01 next move and production block.
3. Run Task Session for `SWU-SGRM-006-R1` using a strict execution-time context pack.
4. Write only the retry disposition packet and Task Session receipt declared by that SWU.

Not authorized by this decision:

- `SWU-SGRM-007-R1` or any allowlist/guard/test mutation;
- any FPR-01 through FPR-04 execution;
- changes to canonical definitions, authority registries, frozen manifests, prior receipts, or public Arcanum;
- subagent dispatch;
- release, readiness, conformance, or production claims.

## Remaining Blockers

None for Craft registration and `SWU-SGRM-006-R1` selection.

The review SWU remains fail-closed: if any match is active authority, implementation, or runnable-plan content, its result is `BLOCK` and work routes to the source owner. A clean disposition packet is only an input to a later, separately selected `SWU-SGRM-007-R1`; it is not authorization to repair the allowlist.

## Deferred Decisions

- Exact disposition of each current match remains evidence-driven inside `SWU-SGRM-006-R1` and subject to SGRM plan-owner review.
- Selection of `SWU-SGRM-007-R1` requires the accepted review receipt.
- Every FPR owner decision remains at its named future gate.

## Validation

- Selection matches presented option 1 exactly.
- Authorization is bounded to registration plus one review-only SWU.
- Craft parent state and production authorization are explicitly preserved.
- No downstream mutation is implied by Decision Gate `PASS`.

