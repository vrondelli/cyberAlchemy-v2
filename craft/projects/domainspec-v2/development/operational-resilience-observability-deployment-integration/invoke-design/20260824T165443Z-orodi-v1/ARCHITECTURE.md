# Operational Evidence Architecture

Status: Invoke Design candidate. Design-validator evidence only; no Plan or execution evidence.

## Architectural center

The architecture is an **owner-separated operational evidence spine**. A domain claim is evaluated through exact bindings and append-only evidence, but no evaluator is allowed to actuate a protected change.

```text
Domain meaning
  -> integration outcome
    -> admitted profile/tool binding
      -> runtime observation
        -> SLI/workload/control evaluator
          -> immutable receipt
            -> claim-specific aggregate
              -> owner acceptance / profile admission / deployment authorization
```

The final arrows are gates, not automatic continuations.

## Components

### 1. Semantic kernel

Owns normalized failure meaning, integration outcome vocabulary, evaluation states, claim sets, and C01-C16/M01-M13. It exposes exact contracts but no tool commands.

### 2. Profile registry boundary

References admitted monitoring, load, infrastructure, canary, deployment, and rollback profiles. A profile declares exact tool/runtime/configuration mechanics and maps them to the semantic kernel. Proposed C17-C20/M14-M17 remain outside the admitted registry.

### 3. Observation plane

Accepts allowlisted traces, metrics, logs, health facts, workload facts, infrastructure plan facts, controller facts, and independent deployment/rollback observations. It preserves offered/queued/exported/rejected/dropped/pending accounting and never treats absent data as healthy.

### 4. Evaluation plane

Runs deterministic, versioned evaluators over immutable observations. Each evaluator emits exactly one typed child receipt with provenance, time, expiry, invalidation keys, and no actuation capability.

### 5. Receipt graph

Links child receipts into claim-specific aggregates. Aggregation is exact-set and fail-closed: a missing, invalid, inconclusive, stale, failed, or not-run required child prevents `passed`.

### 6. Protected effect plane

Infrastructure apply, traffic shift, deployment, and rollback are separately authorized effects. Their owners consume analysis receipts but do not inherit authority from them. Independent observers record actual outcomes.

### 7. Ontology and projection plane

Private DomainSpec branches own local semantic concepts. Generated projections retain source digest and generator identity. Directional CAV2 crosswalks are provenance-bound integration artifacts. Public Arcanum profiles own reusable mechanics only; private prose does not cross the boundary.

## Owner map

| Concern | Accountable owner class | Evidence contributor | Protected decision |
| --- | --- | --- | --- |
| semantic failures and claim sets | DomainSpec operational-contract owner | integration and evidence owners | canonical/domain admission |
| profiles and tools | profile lifecycle owner | tool/runtime maintainer | profile admission |
| privacy/cardinality | privacy/data owner | runtime telemetry owner | allowlist and retention acceptance |
| SLI/SLO/alert policy | service-objective owner | monitoring evaluator owner | policy acceptance |
| workload/safety | workload and environment-safety owners | load evaluator owner | live-run permission |
| infrastructure | infrastructure owner | plan-policy evaluator | apply authorization |
| canary/deployment | release/deployment owner | controller and evidence observers | traffic/deployment authorization |
| rollback | rollback owner | independent state observer | rollback actuation |
| ontology/crosswalk | ontology and integration owners | projection generator | admission/promotion |

No concrete person or live system is bound in this Design.

## State and failure behavior

All evaluation state transitions are monotonic within one receipt. A new binding or invalidation key creates a new evaluation identity. Missing data is `missing`; malformed/disabled controls are `invalid`; incomplete observation is `inconclusive`; changed keys are `stale`; absent execution is `not-run`; predicate violation is `failed`.

Observer failure cannot trigger actuation. A protected-effect owner may decide using declared policy, but must record its own authorization and effect receipts.

## Integration and compatibility

- Legacy v1 elements cross through explicit reuse/adapt/supersede/historical dispositions.
- Profile contracts are versioned and digest-bound; ambient latest is invalid.
- Stable/candidate compatibility is evaluated before protected effects.
- Stored receipt schema migrations require old/new readers, rollback compatibility, and expiry handling.
- Simulation and live deployment use distinct receipt types and namespaces.

## Performance, load, and observability

C06 and C07 require active thresholds, adequate samples, complete windows, safe target behavior, and non-saturated generators. C15 requires end-to-end telemetry accounting. C17-C20 add alert replay, stress, soak, and capacity semantics only after separate admission. Tool names remain candidate examples until profile owners bind them.

## Security and privacy

Telemetry uses allowlisted attributes, declared cardinality budgets, redaction and rejection behavior, retention hints, and no secret-bearing evidence. Authentication/authorization of protected effects belongs to environment policy, not to evaluation receipts.

## Validation architecture

Design uses a closed digest-bound manifest, an independent denominator extractor, and an identical two-pass selection result. Runtime validation is represented only by planned positive and hostile witnesses. None is executed here.

## Claim ceiling

This architecture establishes design completeness for the source-bound model. It does not bind owners or environments, admit profiles or ontology concepts, select tools, implement components, execute tests, apply infrastructure, run canaries, deploy, roll back, promote, release, or establish production readiness.
