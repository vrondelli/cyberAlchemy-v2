# N03 Complexity Example Ladder

All scenarios are hypothetical and preserve one invariant: two authored records state
the exact same canonical `Workflow --[orchestrates]--> Operation` proposition, while
distinct declared step IDs and their N02 order remain separate. The examples explain
options and do not select one. `decision_effect: none`.

## Low Complexity — One Workflow, One Repeated Edge

`Checkout` declares step IDs `validate-primary` and `validate-final`, both binding
the `ValidateOrder` Operation. `ordered_step_ids` contains both IDs exactly once.
The canonical edge `Checkout --[orchestrates]--> ValidateOrder` is accidentally
authored twice.

- **A — reject:** emit an exact duplicate-edge diagnostic and require the second
  authored record to be removed; retain both valid step occurrences.
- **B — coalesce:** conditionally admit one canonical edge only after a separate
  deterministic merge-provenance contract preserves both source handles; retain both
  valid step occurrences.
- **C — defer:** keep duplicate resolution unresolved and Design blocked.
- **D — stop:** end this route without a duplicate policy.

Demonstrates: canonical-edge identity differs from declared-step identity. Limits:
does not prove storage, runtime calls, merge provenance, or implementation.

## Medium Complexity — Two Feature-Owned Fragments

One feature-owned fragment declares the `Checkout -> ValidateOrder` edge for an
early validation step; another declares the same edge for a later step. Their step
IDs and order entries are distinct, but their canonical edge proposition is exact.

- **A — reject:** surface both locations and require the fragments to converge on one
  authored edge before admission.
- **B — coalesce:** converge them into one admitted edge only after the conditional
  provenance contract defines deterministic source retention and diagnostics.
- **C — defer:** preserve both source records as unresolved evidence; no admission.
- **D — stop:** terminate the continuation without changing either fragment.

Added complexity: separate ownership boundaries and a downstream admission
consequence. Limits: does not choose merge ownership or authorize source edits.

## Complex — Concurrent Merge With Reused Operations

Three feature fragments concurrently edit a Workflow containing ten ordered step IDs.
Four step IDs reuse two Operation concepts. Two fragments independently author the
same canonical edge, while a third authors a distinct edge. One source handle is
temporarily unavailable during review.

- **A — reject:** report only the exact repeated proposition, preserve the distinct
  edge and every ordered step, and block until competing authorship is repaired.
- **B — coalesce:** preserve the same distinctions but block conditional admission
  until all exact source handles are present and deterministic merge provenance can
  be proven; no silent partial coalescence.
- **C — defer:** leave all competing records unresolved and block duplicate-sensitive
  continuation.
- **D — stop:** close the route without interpreting the missing source or selecting
  a policy.

Added complexity: concurrent owners, valid reuse, a distinct edge, and missing
evidence. Limits: does not prove distributed merge behavior, runtime scheduling,
partial-view policy, or product correctness.

## Coverage

- Rungs: `3/3`
- Options: A, B, C, and D exactly once per rung
- Shared invariant preserved: yes
- Unsupported claims: `0`; all invented scenario details are labelled hypothetical
- Decision effect: `none`
