# Capability guide

ARE declares two Product Capabilities. This guide documents each capability from
its source-owned contract and maps it to the components that currently realize
it. A package, command, integration, passing test, or provider feature is not
automatically a Product Capability.

## Declared capabilities

| Capability | Outcome | Lifecycle posture | Documentation |
| --- | --- | --- | --- |
| CA2-CAP-REASON-AND-MANAGE-CONTEXT | Route bounded requests, construct necessary context, preserve reusable reasoning state, derive semantic judgments, and improve through measured evidence | Candidate. Active local owner-directed | [Reason and manage context](REASON-AND-MANAGE-CONTEXT.md) |
| CA2-CAP-MANAGE-INTERACTION-CONTEXT | Learn scoped lessons from attributable corrections and measure their later application | Candidate. Prototype only and default off | [Manage interaction context](MANAGE-INTERACTION-CONTEXT.md) |

The product identity owns this exact two-item list in
[product.json](../../../../agent-reasoning-engine/product.json). The detailed
contracts remain in their source-owned Product Capability records.

## Capability versus realization

A Product Capability describes a useful product outcome. A component realizes
part of that outcome. Realization evidence shows that a mechanism exists and
that tests covered it within a stated boundary. It does not prove product value, adoption,
conformance, or authority.

~~~text
Product Capability
  -> one or more realization bindings
  -> implementation components
  -> tests and benchmark evidence
~~~

## Component realization map

| Component | Primary capability | Realization responsibility |
| --- | --- | --- |
| module-port | Reason and manage context | Validate optional synchronous semantic capability calls |
| intent-route-resolver | Reason and manage context | Resolve compiled intent toward a bounded route |
| request-decision-router | Reason and manage context | Select routes and evaluate continuation gates |
| request-intent-runtime | Both | Compile intent, corrections, objective state, requirements, and interaction lessons |
| context-basis-runtime | Reason and manage context | Construct Context Basis and Context Window Views |
| reasoning-state-runtime | Reason and manage context | Preserve append-only epochs, checkpoints, frontiers, recovery, and reuse |
| reasoning-policy-runtime | Reason and manage context | Select deterministic state transitions |
| evolution-runtime | Both | Turn measured failures and interaction outcomes into recommend-only research decisions |
| runtime-journal | Reason and manage context | Record ordered process-local lifecycle evidence |
| semantic-input-runtime | Reason and manage context | Bind context and semantic-domain inputs before judgment |
| semantic-judgment-evaluator | Reason and manage context | Produce deterministic typed semantic outcomes and receipts |
| module-port-distribution-envelope | Reason and manage context | Verify packaged module identity and distribution evidence |
| aci-binding-contract | Reason and manage context | Bind agent/computer interaction records to intent and route lineage |
| codex-app-server-wrapper | Both | Adapt host protocol, context, continuity, learning lifecycle, and effects |
| coding-agent-runtime | Reason and manage context | Bind providers, tools, budgets, patches, and verification |
| conversation-runtime | Both | Maintain ordered interaction and pending human decisions |
| real-reasoning-benchmark | Both | Verify deterministic behavior and evaluate bounded learning candidates |

Detailed package responsibilities are listed in
[Components and integrations](../COMPONENTS-AND-INTEGRATIONS.md). Some components
support both capabilities while retaining one source owner and one implementation
contract.

## Common documentation contract

Each capability page records:

- product outcome and consumers.
- lifecycle and activation posture.
- input and output contracts.
- normal lifecycle.
- implementation realizations.
- failure and recovery behavior.
- authority and privacy boundaries.
- verification evidence.
- limitations and open questions.

## Reading order

Start with [Reason and manage context](REASON-AND-MANAGE-CONTEXT.md) for the
parent product lifecycle. Read
[Manage interaction context](MANAGE-INTERACTION-CONTEXT.md) for the child
capability that turns attributable corrections into scoped, testable lessons.
Use [Architecture](../ARCHITECTURE.md) for system topology and the
[Research program](../RESEARCH-PROGRAM.md) for hypothesis and benchmark work.

## Open Questions

- Should future product outcomes extend one of the two existing capabilities or
  require a separately defined Product Capability?
- Should the realization map become generated from source-owned binding records
  after those records expose a stable machine-readable component relation?
