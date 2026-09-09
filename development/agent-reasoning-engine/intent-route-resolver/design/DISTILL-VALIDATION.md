# Design Distill validation

- Intent: design the smallest meaningful intent-to-route runtime inside the
  Agent Reasoning Engine.
- Target context: private child capability that later composes with Augmentor
  and a ResonantOS host.
- Output: six-view architecture plus selected extensions.
- Budget: Standard, assumed because the user did not request another budget.

## Role trace

| Role | Position | Objection | Reconciliation |
|---|---|---|---|
| Proposer | one runtime could capture, decide, and invoke | none | rejected as too broad |
| Balancer | that would duplicate host route authority and Orchestrate | authority/ownership | reduce to advisory disposition |
| Proposer | raw text could be routed by a model score | none | rejected for L0 |
| Balancer | score-only selection hides ambiguity and is not replayable | evidence/determinism | typed projection plus explicit predicates |
| Proposer | reuse `RuleCatalogManifest` | none | revised |
| Balancer | semantic rules and capability routes have different owners and claims | non-collapse | distinct route catalog snapshot |

## Smallest coherent unit

The optimization point is a pure relation from typed intent plus a frozen
capability-route catalog to a canonical advisory disposition. Splitting below
this point loses the end-to-end ambiguity/candidate meaning; expanding it to
host decisions or execution duplicates retained owners.

Recomposition:

```text
Intent Projector
  -> Intent Route Resolver
  -> Augmentor projection / host RouteDecision
  -> Dispatch Spec or retained capability gate
  -> Orchestrate or capability execution
```

Deferred: natural-language quality, live catalog compilation, persistence,
host adapter, browser UI, execution, and promotion.

Frame expiry: rerun Design if an accepted owner changes the `IntentRecord`,
catalog ownership, or host `RouteDecision` contract.

Verdict: **pass for machine selection validation**; no implementation evidence
is claimed.

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
