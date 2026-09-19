# Glossary

| Term | Meaning in this package |
| --- | --- |
| Domain failure | Domain-owned semantic fact that an intended outcome was not achieved. |
| Integration outcome | Boundary-local result such as timeout, unavailable, rejected, or partial success. |
| Exception mapping | Profile-local conversion between runtime/library failure and an integration outcome. |
| Operational evidence | Digest-bound observations plus evaluator and freshness bindings; never an authority grant. |
| Product observability | Runtime traces, metrics, logs, exemplars, and health facts about the subject. |
| Workflow telemetry | Arcanum invocation events used to observe the authoring workflow, not the product. |
| SLI | Bound query or calculation over declared observations. |
| SLO | Owner-approved objective over one or more SLIs and a window. |
| Workload profile | Owner-bound load, stress, soak, or capacity input contract. |
| Evaluator | Admitted deterministic decision function that emits a typed verdict receipt. |
| Profile | Tool-local realization that binds mechanics without redefining domain meaning. |
| Receipt | Immutable, digest-bound record of inputs, evaluator, outcome, time, expiry, and invalidation keys. |
| Canary analysis | Threshold-bound comparison of stable and candidate observations; it is not deployment authority. |
| Deployment evidence | Independent observation of an authorized environment effect and resulting state. |
| Rollback evidence | Proof that rollback triggers and removes all candidate references within the bound deadline. |
| `specified-not-bound-not-run` | A complete schema exists, but exact live bindings and execution evidence do not. |
| Proposed control | A separately owned extension outside the admitted C01-C16 denominator. |
