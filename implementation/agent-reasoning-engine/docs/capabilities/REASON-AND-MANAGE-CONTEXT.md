# Reason and manage context

**Capability ID:** CA2-CAP-REASON-AND-MANAGE-CONTEXT

**Lifecycle:** Candidate, active local owner-directed.

**Source contract:** [Product Capability record](../../../../agent-reasoning-engine/product-capability.json).

## Outcome

This capability lets ARE process one bounded request and select its nearest
supported route. ARE then constructs the necessary evidence context, preserves
explicit reusable reasoning state, and derives a typed semantic judgment. It
decides whether work may continue or must stop at a gate. It also connects
measured failures to controlled research and recommend-only improvement decisions.

The capability serves the intent owner and reasoning consumer. The product owner
owns its meaning. Runtime and implementation owners own its realization. The
owner of the bounded objective decides whether a result is suitable for the next
use.

## Inputs

| Input | Purpose |
| --- | --- |
| Reasoning Request | Identifies the bounded problem and requested outcome |
| Request Context | Preserves raw text, inferred fields, constraints, effects, and evidence references |
| Context Inputs | Names definitions, ontology selectors, source evidence, profiles, and prior receipts |
| Decision Profile | Defines routes, exclusions, priorities, consequentiality, and owner gates |
| Reasoning State | Supplies verified prior events, epochs, frontiers, corrections, and reusable evidence |

Missing, ambiguous, stale, or unverifiable mandatory inputs fail closed. The
engine records the gap instead of inventing context or authority.

## Outputs

| Output | Meaning |
| --- | --- |
| Capability or route selection | Nearest uniquely supported route, ambiguity, or block |
| Context Basis | Exact request-relative source and dependency basis |
| Context Envelope and Window View | Bounded projection for the current reasoning operation |
| Reasoning State Epoch | Content-addressed reusable state over explicit system records |
| Reasoning Dispatch | Reconstructable outbound model request |
| Checkpoint and recovery assessment | Durability and safe-recovery evidence |
| Reasoning State Frontier | Completed-turn semantic and continuation boundary |
| Reasoning Result and Receipt | Typed judgment with derivation and provenance |
| Continuation Decision | Complete, direct continuation, owner gate, or block |
| Improvement evidence | Hypothesis, experiment, observation, comparison, and recommend-only decision |

Every output is non-authorizing. A direct route or positive judgment does not
execute a tool, approve a patch, publish, deploy, or satisfy an owner gate.

## Lifecycle

~~~mermaid
flowchart TD
    A[Preserve request and intent] --> B[Select one route]
    B --> C[Resolve definitions and selectors]
    C --> D[Construct Context Basis]
    D --> E[Project Context Window View]
    E --> F[Form or recover Reasoning State]
    F --> G[Prepare model or semantic dispatch]
    G --> H[Record observations and result]
    H --> I[Seal completed-turn frontier]
    I --> J[Evaluate consequence and continuation]
    J -->|complete| K[Terminal receipt]
    J -->|one safe continuation| C
    J -->|choice or consequence| L[Owner decision gate]
    J -->|no admissible path| M[Block with reasons]
~~~

### Request and route

[Request intent runtime](../../packages/request-intent-runtime/README.md)
preserves the user request, compiles an immutable intent contract, detects
corrections, and tracks objective and requirement changes. The
[request decision router](../../packages/request-decision-router/README.md)
selects exactly one route or returns a visible gate or block.

### Context construction

The context runtime resolves definition closure, selected ontology dependencies,
provenance, contradictions, exclusions, freshness, and claim limits into a
Context Basis. It projects plan-bound or interaction-bound views without treating
compression as permission to remove material constraints.

### State and recovery

[Reasoning state runtime](../../packages/reasoning-state-runtime/README.md)
stores explicit system records in an append-only ledger. It creates immutable
epochs, checkpoints, branches, reductions, portable bundles, cache-affinity
projections, and completed-turn frontiers. Recovery verifies the log and final
checkpoint before rebuilding disposable indexes.

[Reasoning policy runtime](../../packages/reasoning-policy-runtime/README.md)
selects reuse, successor creation, branching, or non-destructive reduction. It
does not summarize with a model or rewrite existing state.

### Judgment and continuation

[Semantic input runtime](../../packages/semantic-input-runtime/README.md) binds
the verified Context Envelope to an exact semantic-domain request. The
[semantic judgment evaluator](../../packages/semantic-judgment-evaluator/README.md)
produces a typed outcome and persists a Reasoning Receipt before consequence
assessment. Continuation is complete, one safe direct option, an owner gate, or
a block.

### Improvement

[Evolution runtime](../../packages/evolution-runtime/README.md) converts measured
failures into immutable hypotheses and experiments, compares exact variants, and
emits recommend-only decisions. Research success does not activate an engine
version.

## Host and model integration

The [Codex wrapper](../../packages/codex-app-server-wrapper/README.md) adapts
host messages, gateway continuity, context preflight, reasoning state, semantic
completion, and effect boundaries. The
[coding agent runtime](../../packages/coding-agent-runtime/README.md) binds
provider transports, secret references, tools, budgets, workspaces, patches,
and verification.

Provider choice does not change tool authority. Session affinity may improve
reuse, but correctness depends on durable state and exact bindings rather than
one provider process.

## Failure and recovery behavior

| Condition | Required behavior |
| --- | --- |
| No unique route | Return a decision gate with the smallest missing decision |
| Mandatory context missing or stale | Block context construction and name the dependency |
| Selected dependency changed | Invalidate exact reuse and create or require a successor |
| Malformed or torn reasoning log | Block recovery without repairing or truncating source bytes |
| Missing final checkpoint | Treat non-empty state as unrecoverable |
| Ambiguous consequence or multiple choices | Stop at an owner gate |
| Unknown effect or protected hazard | Gate or block according to the decision profile |
| Benchmark failure | Preserve the result and create bounded improvement evidence |
| Provider cache telemetry absent | Report cache posture as unobserved |

Historical replay reproduces a recorded decision from exact bytes. Refreshed
evaluation checks current sources and may produce a different result. The engine
keeps those operations distinct.

## Authority and privacy boundaries

The capability stores inspectable system state, not hidden model chain-of-thought.
Credentials and provider reasoning content remain outside Context Envelopes,
reasoning ledgers, receipts, and research artifacts.

Model confidence, agreement, token use, schema validity, route selection, or a
receipt cannot grant authority. The host remains responsible for authorized
effects, and repository governance remains responsible for admission.

## Verification

Candidate 018 binds the realization across the declared components and integration
suites. Useful verification entry points are:

~~~sh
node bin/are.mjs doctor --json
node bin/are.mjs decide route < request.json
node bin/are.mjs benchmark --mode core
node bin/are.mjs improve run-canary --output /tmp/are-improvement.json
~~~

Run these commands from implementation/agent-reasoning-engine. A passing local
test establishes only its declared contract and evidence boundary.

## Current limitations

- The capability is a candidate and has no product approval or canonical adoption.
- Product verification does not establish every model, domain, or context size.
- Provider-internal context transformations are generally unobservable.
- A verified Context Basis does not prove semantic sufficiency.
- Runtime journals are process-local. Durable recovery belongs to reasoning state.
- Publication, deployment, and real effects remain separate owner-controlled work.

## Open Questions

- Which context-selection mechanisms transfer beyond GLM and coding tasks?
- Which state should remain common-engine behavior versus model-specific policy?
- What product evidence is sufficient for implementation conformance and approval?
- How should externally attested task outcomes join the semantic receipt without
  widening effect authority?
