# Components and integrations

`product.json` declares 17 required components. Each has directly owned test
coverage in Candidate 018.

| Component | Responsibility |
| --- | --- |
| `module-port` | Optional synchronous semantic capability boundary. |
| `intent-route-resolver` | Resolves compiled intent toward a route or safe deferral. |
| `request-decision-router` | Evaluates the route registry and produces route decisions. |
| `request-intent-runtime` | Preserves raw requests, intent contracts, controls, and corrections. |
| `context-basis-runtime` | Selects sources and constructs Context Envelopes and window views. |
| `reasoning-state-runtime` | Maintains append-only events, epochs, checkpoints, branches, and transitions. |
| `reasoning-policy-runtime` | Selects bounded automatic state-evolution policies. |
| `evolution-runtime` | Turns failures into hypotheses, variants, comparisons, and learning decisions. |
| `runtime-journal` | Records ordered runtime events for bounded replay and eviction. |
| `semantic-input-runtime` | Builds exact-bound semantic inputs for enabled domains. |
| `semantic-judgment-evaluator` | Evaluates semantic input without granting authority. |
| `module-port-distribution-envelope` | Verifies packaged module-port distribution identity. |
| `aci-binding-contract` | Binds agent/computer interaction records to intent and route lineage. |
| `codex-app-server-wrapper` | Adapts host protocol, context, continuity, state, and effect boundaries. |
| `coding-agent-runtime` | Runs provider, tool, budget, patch, and verification workflows. |
| `conversation-runtime` | Maintains ordered conversations and pending decisions. |
| `real-reasoning-benchmark` | Exercises product reasoning and improvement behavior. |

## Required integrations

| Integration | Boundary |
| --- | --- |
| `codex-desktop-bridge` | Client, proxy, callback, and continuous-construction adapters. |
| `are-product-package` | Product ontology/package validation and negative mutations. |

The Define workflow is outside the ARE product, customer package, and supported
integration surface. Candidate 018 uses the ARE-native semantic adapter and
carries no Alch or DomainSpec compiler build/runtime dependency.

## Coverage rule

Required components and integrations must appear in the generated product test
plan. Release verification blocks an uncovered declaration. Adding a directory
to the repository does not make it part of the product. `product.json` owns the
declared boundary.

## Open Questions

- Should component packages expose a uniform generated API index after their
  public exports stabilize?
