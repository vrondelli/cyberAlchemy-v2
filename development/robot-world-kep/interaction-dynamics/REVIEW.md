# Interaction dynamics plan review

Status: reviewed planning candidate, 2026-09-11.
Target: [PLAN.md](PLAN.md). Authority effect: none.
Reviewer: one user-requested native subagent, `review_interaction_plan`.
Review scope: read-only comparison against the current simulation, tests, action
schema and parent development plan. No implementation or runtime tests performed.

## Findings and revisions

| Priority | Initial finding | Incorporated resolution |
|---|---|---|
| P1 | The existing reducer already commits memory additions; queued impulses could double count, and duplicate requests return an old accepted receipt. | One successor impulse owner; narrow behavior-preserving legacy memory hook; revision/event-hash advance identifies a new action; unique-event accounting and explicit partial-tick failure handling. Intermediate committed states remain honest. |
| P2 | Adding steering to normalized state can produce negative or oversized utility weights. | Explicit component-wise `w = clamp(s + converted_force, 0, 1)`; utility weights remain distinct from committed semantic state and velocity. |
| P2 | Every move costs one energy; shorter moves cannot demonstrate lower cost. Waiting and partial-load travel need concrete semantics. | Move-versus-wait oracle, reserve threshold, no invented recharge, observed-quiescence handling, and destination-progress features with hand-calculated fixtures. |
| P2 | Legacy tests can pass while the successor violates conservation or history. | Successor-specific per-commit resource, energy, cargo, identity, motion, history, replay and duplicate/rejection assertions; legacy golden event-hash regression. |

The primary agent also checked the current canonical D65 definition and added D1C:
authored DomainSpec prototype source, exact profile/compiler identity, deterministic
compiled graph and system-ontology scaffolds before implementation. A handwritten
mapping cannot substitute for these artifacts.

## Second pass

The same subagent re-read the revised plan and reported all four findings resolved
at plan level, D1C coherent, and no remaining blocking contradiction. It confirmed
that numerical algorithm/profile details belong to D1 and compiler selection to
D1C; neither is claimed complete.

Its final minor clarification was incorporated: observed waiting over a finite
window does not establish permanent quiescence because memory can decay. An
experiment stopped on that criterion must report window censoring. That wording
clarification was checked by the primary agent after the second pass.

## Verification and limits

- Primary agent checked source links, planning task IDs/dependencies, source SHA-256
  snapshots and whitespace. Only this file and the plan were created.
- Existing runtime, UI candidates, original epoch evidence, parent status files
  and unrelated working-tree changes were not modified.
- No product tests were run: this review establishes plan quality only.
- The plan is candidate evidence, not an admitted execution plan, implementation
  authorization, product approval or publication decision.

## Open Questions

The [plan's question register](PLAN.md#open-questions) owns normalization saturation,
energy-only caution, numerical profile choices, allocation fairness, scale targets,
future UI integration and DomainSpec compiler selection. No review finding is
left unresolved; those future construction decisions remain explicit.
