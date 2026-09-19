# Implementation Layering: ORODI Offline Replay Campaign

## Context

- Target: deterministic multi-item composition over WP6 replay results.
- Current state: WP6 can replay and gate one exact profile fixture at a time.
- Primary operator outcome: audit several independent offline replays through one deterministic receipt without converting them into shared runtime evidence.
- Primary constraint: preserve binding and invalidation isolation while maintaining the candidate-local authority ceiling.
- Source references: WP6 Work Pack, replay/result contracts, eligibility contracts, seven golden cases, and seven evaluation contexts pinned in the WP7 Work Pack.

## Layer boundary rule

Each layer answers: “After this layer, we know whether …”

| Layer | Decision question | Minimum working unit | Included scope | Explicitly deferred | Exit evidence | Promotion decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether a campaign can represent multiple independent replay results without implying one shared evaluation binding. | Closed campaign types plus fixture/result schemas. | Item identities, per-binding partitions, atomic rejection, denied authority. | Composition behavior and corpus. | TypeScript compile and positive/negative schema checks. | Continue only if no merged-derived or runtime-eligible state is representable. |
| L1 | After this layer, we know whether two-through-seven exact WP6 items compose deterministically and fail closed. | Pure campaign composer over unchanged WP6. | Recompute, exact-result parity, uniqueness, sorting, campaign digest, empty aggregate admission. | CLI, live adapters, repeated same-family items. | Deterministic in-memory composition, permutation equality, hostile rejection. | Continue only if no partial item escapes rejection. |
| L2 | After this layer, we know whether the campaign boundary survives finite hostile replay and full regression. | Three golden and 25 hostile cases plus documentation. | Schema replay, immutability, source pins, forbidden-surface scan, WP1-WP6 regression. | Scale, packaging, infrastructure/compatibility families. | Full declared validation and exact-manifest report. | Accept as candidate-local evidence or remediate; do not promote. |
| L3 | After this layer, we know whether admitted live evidence can be coordinated across operational systems. | Separately owned runtime campaign design. | Nothing in WP7. | Live tools, infrastructure, canary/deployment/rollback effects, runtime admission, lifecycle promotion. | Separate owner bindings, profile admission, policy/evaluator receipts, and live validation. | Deferred. |

## Capability progression

| Capability | L0 | L1 | L2 | L3 |
| --- | --- | --- | --- | --- |
| Contract closure | Campaign and partition vocabulary | Enforced by composer | Enforced by schema/hostile corpus | Separate live contract family |
| Composition | Not implemented | Two-through-seven pure items | Finite golden/hostile proof | Live coordination deferred |
| Eligibility | Referenced per item | Recomputed through WP6 | Replay-only regression proof | Runtime admission deferred |
| Derived controls | Per-binding partition shape | Per-binding results preserved | No aggregate result assertion | Cross-system semantics deferred |
| Effects | Denied by contract | Denied by code | Denied by tests/docs | Protected owner route only |

## Non-regression guardrails

- WP5 and WP6 files remain byte-identical.
- Existing WP1-WP6 tests remain green.
- A replay observation never enters `runtime_admitted_observations`.
- An eligibility receipt never gains an eligible control.
- Distinct evaluation bindings and invalidation keys are never merged.
- Deployment and rollback replay remain simulation with no effect and no independent observation.
- Input order and input object identity do not affect semantic output.
- Later layers cannot reinterpret a WP7 campaign receipt as runtime, deployment, release, or production evidence.

## Recommended layer window

Implement L0-L2 only, in W0 -> W1 -> W2 order. L3 and the infrastructure-plan/compatibility families remain deferred.
