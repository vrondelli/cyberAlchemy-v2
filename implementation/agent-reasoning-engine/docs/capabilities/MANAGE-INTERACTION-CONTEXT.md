# Manage interaction context

**Capability ID:** CA2-CAP-MANAGE-INTERACTION-CONTEXT

**Lifecycle:** Candidate prototype, default off.

**Source contract:** [Product Capability record](../../../../agent-reasoning-engine/capabilities/interaction-context/product-capability.json).

## Outcome

This child capability learns a scoped lesson from an attributable correction.
It measures whether that lesson helps in a later compatible interaction. It
preserves the correction source, prior episode, changed target, and permitted
scope. It also preserves revision, revocation, and later outcome information.

The capability does not treat arbitrary conversation text as durable truth. A
host must attest the feedback source, prior episode, target, retention scope,
correction class, and finite outcome checks.

## Inputs

| Input | Purpose |
| --- | --- |
| Interaction identity | Binds participant, product, conversation, and turn |
| Completed episode reference | Identifies the exact prior result being corrected |
| Attributable correction | Records who corrected what and the correction class |
| Grounding evidence | Connects the correction to source or literal outcome checks |
| Retention scope | Limits where the lesson may be projected |
| Revision or revocation | Changes applicability without deleting history |
| Later task and outcome | Tests whether a compatible lesson was applied usefully |

An unattested correction, missing prior episode, wrong product, incompatible
scope, or missing outcome evidence cannot create a usable lesson.

## Outputs

| Output | Meaning |
| --- | --- |
| Interaction learning result | Complete record of correction, scope, application, and measured outcome |
| Scoped lesson | Explicit or inferred candidate lesson with provenance and applicability |
| Projection decision | Whether a current interaction may receive the lesson |
| Application observation | Whether the lesson appeared in a compatible later interaction |
| Progress signal | Evidence that the correction target improved, repeated, or remained unknown |
| Research candidate | Recommend-only hypothesis or comparison when repeated evidence warrants study |

The output remains revisable and revocable. Repeated delivery is not repeated
learning, and a lesson that was projected is not necessarily correct or useful.

## Lifecycle

~~~mermaid
flowchart TD
    A[Completed interaction] --> B[Attributable correction]
    B --> C[Validate source target and scope]
    C --> D[Create scoped lesson]
    D --> E[Persist through existing state and ledger]
    E --> F[Match a later interaction]
    F -->|compatible| G[Project bounded lesson]
    F -->|incompatible| H[Do not project]
    G --> I[Observe literal outcome checks]
    I --> J[Measure progress]
    J -->|supported pattern| K[Recommend research candidate]
    J -->|no gain or regression| L[Retain counterevidence]
    J -->|revision or revocation| M[Close prior applicability]
~~~

## Scope and projection

The interaction scope includes one participant, one product, and explicitly
controlled retention. Projection requires a compatible target and scope. A
generic summary, explicit preference, and inferred scoped lesson remain distinct
variants because they carry different evidence and generalization risks.

[Request intent runtime](../../packages/request-intent-runtime/README.md) owns
interaction state, grounding, preferences, lesson application, and the joined
learning loop. [Conversation runtime](../../packages/conversation-runtime/README.md)
owns ordered interaction and pending human decisions. The
[Codex wrapper](../../packages/codex-app-server-wrapper/README.md) exposes
inspection, controls, and lifecycle integration without creating another
dispatch or continuation authority.

## Learning and research

[Evolution runtime](../../packages/evolution-runtime/README.md) receives measured
interaction signals through the existing research chain. It may create a
hypothesis, experiment, observation, and recommend-only decision. Missing
providers, no gain, or a negative comparison remain visible outcomes.

The capability reuses the parent reasoning-state ledger and gateway continuity.
It does not create a separate durable-session authority or overwrite prior
interaction records.

## Failure and recovery behavior

| Condition | Required behavior |
| --- | --- |
| Feedback source is missing | Reject lesson creation |
| Prior episode cannot be verified | Reject attribution |
| Scope does not match | Do not project the lesson |
| Lesson is revised | Append the revision and stop using the superseded version |
| Lesson is revoked | Preserve history and prevent future projection |
| Outcome evidence is missing | Record unknown. Do not claim improvement |
| Same lesson is delivered repeatedly | Keep one learning identity and record delivery separately |
| Provider or judge is unavailable | Return NOT_RUN or incomplete without invented measurements |
| Comparison shows no gain | Preserve counterevidence and avoid activation |
| Restart occurs | Recover from the existing durable state boundary and verify identity |

## Verification

The [interaction learning benchmark](../../benchmarks/real-reasoning-v1/interaction-learning/README.md)
contains 48 synthetic three-turn episodes in eight families, with development,
regression, and holdout partitions, four variants, and two replays:

- V0: no retained interaction lesson.
- V1: generic retained summary.
- V2: explicit preferences.
- V3: explicit and inferred scoped lessons.

The mock mode exercises correction, application, repeated failure, a research
cycle, negative comparison, restart, and revocation. The live canary is a bounded
compatibility and completion smoke test. Neither establishes generalized model
improvement.

~~~sh
cd benchmarks/real-reasoning-v1/interaction-learning
node runner.mjs --mode mock
node runner.mjs --mode local-benchmark
node runner.mjs --mode live-canary
~~~

Run these commands from implementation/agent-reasoning-engine. Live mode has a
24-turn ceiling, uses read-only ephemeral scratch threads, and makes no judge
calls.

## Authority and privacy boundaries

Interaction retention is explicit, participant-scoped, and default off. The
prototype does not authorize account-wide memory, infer consent, or establish a
physical erasure policy. It stores bounded system records rather than hidden
chain-of-thought.

Source attribution and literal checks do not establish general semantic truth.
A passing synthetic benchmark does not approve the capability, activate serving,
publish, deploy, or authorize an effect.

## Current limitations

- The capability is a local prototype and default off.
- The corpus is synthetic and its scenario families are correlated.
- Scripted outputs are not a baseline model-quality comparison.
- Production feedback and outcome attestation are unresolved.
- External generalization evidence does not yet exist.
- Long-term retention and physical erasure policy remain unresolved.

## Open Questions

- Which production host can attest feedback and outcome checks?
- Which external corpus can test lesson transfer without exposing private history?
- What retention, expiration, export, and physical erasure rules should apply?
- How should conflicting lessons from the same participant be ranked or gated?
- What evidence would justify enabling this capability outside a bounded canary?
