# ARE overview

The Agent Reasoning Engine preserves and governs the reasoning context around
an agent. It routes requests, assembles relevant context, records durable
reasoning state, keeps continuity across reconnects, and separates proposals
from authorized effects.

ARE does not replace the model. It gives the model and its host a stable,
inspectable substrate for facts that should not depend on conversational recall.
These facts include request identity, selected route, context evidence, tool
outcomes, checkpoints, counterevidence, continuation state, and effect boundaries.

## What problem it solves

Long-running agent work commonly loses information through context pressure,
process restarts, ambiguous intent, and repeated tool use. Simply placing more
text in a prompt does not establish provenance, freshness, identity, or
authority. ARE represents those concerns explicitly and supplies bounded views
to the agent.

The project lighthouse states the enduring objective: improve useful reasoning
quality per token across tasks and models, while keeping evidence and authority
truthful. See the [lighthouse](../../../agent-reasoning-engine/LIGHTHOUSE.md).

## Supported product surface

Candidate 018 declares 17 components and two integrations. The visible product
surfaces are:

- `decide`: route, context, effect, and continuation decisions.
- `hook`: advisory host-event adapters and native canaries.
- `gateway`: authenticated, restartable JSON-lines continuity.
- `conversation-runtime`: ordered turns and pending-decision handling.
- `coding-agent`: controlled fixture and live gateway demonstrations.
- `benchmark` and `improve`: product evaluation and failure-learning flows.
- `define`: the Define CLI integration.
- `doctor`, `closure`, `test`, and `candidate`: product health and release
  evidence.

## What ARE does not claim

The candidate is a private repository product. It is not a hosted service, an
npm publication, a general production sandbox, or proof of live-model
reliability. A route or receipt does not grant permission. Provider support
does not mean credentials are installed or endpoints are available.

ContextBench research evaluates selected model and context conditions. Its
results do not automatically qualify the product or another model/window.

## Open Questions

- Which first external host should adopt the model-neutral gateway contract?
- Which product outcome should be measured after the private candidate is used
  in sustained real work?
