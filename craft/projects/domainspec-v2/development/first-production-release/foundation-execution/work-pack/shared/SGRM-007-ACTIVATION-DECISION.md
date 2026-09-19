---
decision_id: DEC-DSV2-FPR-SGRM007-ACTIVATION
scope_id: CTX-DSV2-FIRST-PRODUCTION-RELEASE
status: closed
selected_option: refresh-and-execute-sgrm-007-r1
decided_at: 2026-07-14T18:54:00Z
---

# SGRM-007-R1 Activation Decision

## Decision question

How should foundation execution continue after the accepted `SWU-SGRM-006-R1` review exposed stale selection controls but produced four complete, non-active-reference dispositions?

## Considered options

| Option | Benefit | Cost or risk | Downstream impact |
|---|---|---|---|
| 1. Refresh and execute 007 | Restores agreement between Craft, the work-pack, and the accepted dependency before mutation. | Adds a narrow applied refresh before guard repair. | Select `SWU-SGRM-007-R1`, then execute its exact exception and validation contract. |
| 2. Execute 007 directly | Fastest route to implementation. | Explicitly bypasses the work-pack/Craft mismatch gate and leaves authority drift. | Guard work could pass while continuation authority remains stale. |
| 3. Stop | Preserves every current boundary. | Leaves the guard red and blocks FPR evidence. | No execution proceeds. |

## Selected option

**Option 1 — Refresh and execute 007.**

Source of decision: the user replied `1` to the Task Session Decision Gate on 2026-07-14.

## Rationale

The accepted 006 retry receipt closes the review dependency and supplies four exact exception candidates. The work-pack, W0 execution controls, and Craft continuation state had not yet consumed that receipt. Refreshing those live controls before execution preserves the declared authority order and avoids treating an implementation result as permission to rewrite planning state afterward.

## Authorization boundary

Authorized:

1. Apply the narrow Invoke refresh recorded under `refreshes/2026-07-14-sgrm-007-activation/`.
2. Select exactly `SWU-SGRM-007-R1` in the live foundation work-pack, W0 execution controls, and DomainSpec v2 Craft continuation state.
3. Execute the 007 write scope: exact allowlist entries, focused guard tests, and `runs/SWU-SGRM-007/RETRY-001/` evidence.
4. Modify the guard implementation only if the reviewed dispositions cannot be represented by its existing exact-exception contract.
5. Modify `impl/package.json` only if a missing focused validation command cannot be run directly.

Not authorized:

- frozen-manifest or historical-receipt mutation;
- source rewriting to avoid exact exceptions;
- FPR-01 or later FPR execution;
- canonical definition, authority registry, or public Arcanum mutation;
- subagent dispatch or production/readiness claims.

## Remaining blockers

None for selecting and executing `SWU-SGRM-007-R1`. W0 and FPR-01 remain blocked until the retry audit and all required positive and negative checks pass.

## Validation

- The selected option matches the presented Option 1.
- The accepted 006 receipt is a declared dependency and remains unchanged.
- The refresh and Task Session have separate output boundaries.
- FPR-01 remains outside this authorization.
