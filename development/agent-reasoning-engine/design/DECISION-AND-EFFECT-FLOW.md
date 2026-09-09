# Decision and effect flow

Status: **candidate persisted ordering contract; unwitnessed**

## State machine

```text
CAPTURED
  -> FRAMED
  -> SNAPSHOTTED
  -> ENTRY_DECIDED
       block/defer -> CLOSED_NO_CALLS
       flag        -> OWNER_REVIEW_ZERO_CALLS
                       new explicit pass -> ROUTED
       pass        -> ROUTED
  -> ACTORS_CLOSED
  -> OBSERVATIONS_FROZEN
  -> SEMANTIC_DECIDED
  -> RECEIPT_PERSISTED
       non-positive -> CLOSED_NO_EFFECT
       positive     -> EFFECT_DECIDED
                         non-pass -> CLOSED_NO_EFFECT
                         pass     -> EFFECT_ATTEMPTED_ONCE (future/test double)
  -> CLOSED
```

No transition may be skipped or inferred from a later artifact. Entry `flag`
persists residue and routes to owner review with zero actor, evaluator, and
effect calls. Continuation requires a new explicit `pass` decision.

## Persisted ordering invariants

1. Intent, frame, authority, and catalog digests exist before entry decision.
2. The entry `GateDecision` is durably recorded before the first actor or
   evaluator event.
3. Entry `block` or `defer` closes with zero actor, evaluator, and effect calls;
   entry `flag` pauses for owner review with the same zero-call invariant.
4. Actor/tool messages are journaled before their outputs are admitted.
5. Observations and challenge closure freeze before evaluator reduction.
6. The evaluator emits one outcome and derivation without external calls.
7. The `ReasoningReceipt` is persisted before effect-gate evaluation.
8. The exact effect decision binds the identical fixed effect envelope and
   receipt digest.
9. Only `RecommendedUnderSnapshot` plus effect-gate `pass` may call the future
   effect adapter.
10. The same idempotency key yields one logical effect attempt.

## Reference control flow

```text
project intent -> frame
freeze authority + catalog
entry = decideEntry(frame, snapshot, manifest, runEnvelope)
persist(entry)

if entry.verdict in [block, defer]:
    close(no_actor_calls, no_evaluator_calls, no_effect_calls)
if entry.verdict == flag:
    pause_for_owner_review(no_actor_calls, no_evaluator_calls, no_effect_calls)
    require_new_explicit_pass()

effort = deriveEffort(ownedPolicyFacts)
techniques = selectTechniques(manifestRequiredCandidateObligations, effort)
journal = runBoundedActors(techniques, effort)
observations = admit(journal.proposals, snapshot, manifest)
semantic = evaluate(frame, snapshot, manifest, observations, journal.challenges)
receipt = assembleAndPersist(semantic, allFrozenDigests, journal)

if semantic.outcome != RecommendedUnderSnapshot:
    close(no_effect_calls)

effectDecision = decideExactEffect(receipt, fixedEffectEnvelope, currentAuthority)
persist(effectDecision)
if effectDecision.verdict != pass:
    close(no_effect_calls)

attemptOnce(fixedEffectEnvelope, effectDecision, idempotencyKey)  # test double first
close()
```

## Outcome routing

| Semantic outcome | Effect-gate call? | Required closure |
|---|---:|---|
| `InvalidInput` | no | input error plus residue |
| `UnauthorizedCatalog` | no | authority/catalog repair route |
| `OutOfDomain` | no | catalog owner or alternate capability route |
| `Ineligible.Defeated` | no | grounded defeater trace |
| `Deferred.Insufficient` | no | missing evidence/challenge route |
| `EscalateOwner` | no | explicit owner decision gate |
| `RecommendedUnderSnapshot` | yes | exact-effect decision; still may not pass |
| `Invalidated` | no | current-state drift and revalidation/incident route |

## Counterfactual witnesses

| Single change | Expected semantic result | Expected effect attempts |
|---|---|---:|
| all required support present | `RecommendedUnderSnapshot` | one only if exact gate passes |
| required fact removed | `Deferred.Insufficient` | 0 |
| grounded defeater added | `Ineligible.Defeated` | 0 |
| required challenge timeout | `Deferred.Insufficient` | 0 |
| irrelevant agent consensus added | unchanged | unchanged |
| rule removed | `OutOfDomain` | 0 |
| catalog expired/revoked/mutated | reject, escalate, or `Invalidated` per pinned policy | 0 |
| authority/self-judgment cycle | reject or `EscalateOwner` | 0 |
| entry changed to `block` | no semantic call | 0 |
| positive outcome but effect gate changed to `defer` | semantic result retained | 0 |
| valid positive delivery repeated | same logical result | 1 total |

A second independently authored rule family must pass through unchanged
evaluator code. Otherwise the witness may be a fixture-specific conditional.

## Partial failure and challenges

- Required actor failure or timeout becomes explicit missing-lane evidence.
- Optional actor failure may be residue only when the frozen plan says so.
- A synthesizer cannot convert disagreement into support; it may only structure
  returns for deterministic admission/evaluation.
- A challenge closes only under the pinned CAV2-D40-compatible policy.
- Loop ceilings close with typed residue; they do not manufacture convergence.

## Historical replay versus current revalidation

Historical replay verifies immutable bytes and reducer determinism. It never
calls models, tools, authority resolvers, or effect adapters. Current
revalidation is a new run against current authority, catalog, evidence, and time
state. It may invalidate the prior recommendation without rewriting history.

Post-effect invalidation routes to incident/compensation ownership. It is not a
retroactive permission rule and does not issue an automatic compensating effect.

## First-witness stop boundary

Planning may define fixtures, schemas, reducers, persisted-order tests, and an
exact-effect test double. It must not implement the full actor runtime,
generalized anti-bias machinery, real external effects, canonical promotion, or
public packaging in the first SWU.
