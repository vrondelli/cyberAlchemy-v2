---
title: CRABS Ordered-Set Convergence Repair Implementation Layers
status: construction-candidate
updatedAt: 2026-09-04
authority_effect: none
---

# CRABS ordered-set convergence repair layers

## Current frontier

The R2 C prototype is implemented. R3 evidence is partial: the original bounded
failure is closed, five native regression groups pass, and the selected CBMC
property has no counterexample at its bound. The candidate has not crossed
product review or approval.

| Layer | After this layer, we know whether... | Minimum working unit | Current state | Exit evidence |
| --- | --- | --- | --- | --- |
| R0 — meaning | ...one ordering, move-conflict, payload-conflict, and compatibility rule is concrete enough to implement. | Anchored placement plus whole-order LWW move prototype and v8 read/write posture. | Complete as a prototype decision; not owner-approved product meaning. | Decision request, admissibility receipt, and repair decision. |
| R1 — executable model | ...the chosen rules remove the known defect before broad integration. | Standalone actual-C harness for the old two-singleton case. | Complete for the example. | Native `[B,A]` in both directions. |
| R2 — C candidate | ...CRABS can carry and merge placement state without direction-dependent append behavior. | Ordered-set, serialization, compaction, and unit-test patch. | Implemented and digest-frozen locally. | Warning-clean compilation, patch applicability, source hashes. |
| R3 — implementation evidence | ...the candidate survives representative executable states and bounded formal checks. | Merge-law corpus, sanitizer runs, migration tests, position maps, failure paths, CBMC matrix. | Partial. | Current receipt plus the remaining matrix. |
| R4 — abstract/temporal assurance | ...the stable algorithm satisfies general abstract laws and delivery schedules, and the C observations correspond to it. | Lean algebra, TLA+/TLC model, and explicit C correspondence. | Deferred. | Separate theorem, temporal, and refinement receipts. |

## Runnable product construction now

- Generate bounded two- and three-replica state pairs/triples.
- Add same-anchor, different-anchor, overlapping-ID, and tombstone cases.
- Stress partial-knowledge and concurrent-move schedules.
- Execute v7-to-v8 and v8 round-trip serialization fixtures.
- Add allocation-failure injection and position-map cases.
- Run AddressSanitizer and UndefinedBehaviorSanitizer on the bounded surface.
- Decide whether the whole-order LWW move rule remains the product candidate.

The next promotion question is: after this evidence, do we know whether the
candidate is stable enough to freeze for independent product review?

## Non-regression requirements

- The original two-singleton obligation must remain green on unchanged bounds.
- Deletion remains monotonic.
- Payload or equal-version placement conflict rejects before destination mutation.
- Materialized `prev`, `next`, `head`, `tail`, `count`, and `visible_count`
  remain internally consistent.
- Old evidence is never relabeled after source or harness bytes change.
- Abstract-model success never becomes an implementation-conformance claim.

## Operational support and residue

These tasks do not currently block R3 construction:

- commit, push, upstream issue, or pull request — owner: user/CRABS maintainer;
- full OpenABE/dependency build setup — owner: build environment maintainer;
- CI wiring — owner: CRABS repository maintainer;
- release, migration rollout, or publication — owner: product/release authority.

They affect review or later operational stages, not the current prototype
evidence stage. No such action is authorized by this package.

## Major deferred scope

Production compatibility and multi-replica move semantics are the largest
unclosed product risks. Formal R4 work should wait until R3 determines whether
the algorithm itself is stable; otherwise Lean or TLA+ would formalize a moving
target.
