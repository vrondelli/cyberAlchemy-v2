# Micro-Swarm Map-Reduce Harness

Status: experiment-local candidate  
Authority effect: none

This harness tests whether a research strategy can be decomposed into many
small, source-bounded exploration requests, reduced without losing any result,
merged into a claim graph, and judged independently within 300 seconds.

It is not an admitted CyberAlchemy-v2 capability, a replacement for the
DomainSpec research dispatch owner, a serving deployment, or evidence that
Luna/Qwen matches Sol. The accepted nine-agent findings in the parent folder
remain unchanged.

## Topology

```text
frozen manifest
      |
N stateless micro-exploration requests
      |
deterministic claim reduction
      |
Luna merge packet
      |
Sol judgment
      |
deterministic findings renderer
```

The runtime distinguishes model calls from governed DomainSpec subagents.
Micro-exploration requests are stateless calls to an OpenAI-compatible endpoint;
they do not mutate the dispatch ledger or acquire agent identities.

## Invariants

- One microtask asks one atomic question.
- Every task reaches exactly one terminal disposition.
- Every evidence item carries an exact source reference and selector.
- Reduction preserves conflicting variants; it never concatenates prose into
  apparent agreement.
- A judge can decide only claim IDs and task variants already present in the
  reduced packet.
- Missing tasks, invented claims, invalid provenance, or an exceeded global
  deadline fail closed.
- Sol judges; it does not perform new research or author the final narrative.

## Commands

All commands use Node.js built-ins and require no package installation.

```sh
node scripts/micro-swarm.mjs prepare \
  --manifest fixtures/example-manifest.json \
  --output outputs/prompts.jsonl

node scripts/micro-swarm.mjs validate-cards \
  --manifest fixtures/example-manifest.json \
  --cards fixtures/cards

node scripts/micro-swarm.mjs reduce \
  --manifest fixtures/example-manifest.json \
  --cards fixtures/cards \
  --output outputs/reduced.json

node scripts/micro-swarm.mjs judge-packet \
  --reduced outputs/reduced.json \
  --output outputs/judge-packet.json

node scripts/micro-swarm.mjs finalize \
  --reduced outputs/reduced.json \
  --decision fixtures/judge-decision.json \
  --output outputs/findings.md
```

Optional live exploration against vLLM or another OpenAI-compatible server:

```sh
node scripts/micro-swarm.mjs run \
  --manifest fixtures/example-manifest.json \
  --base-url http://127.0.0.1:8000 \
  --model Qwen/Qwen3.8-27B-FP8 \
  --cards outputs/live-cards \
  --concurrency 8
```

`run` calls `/v1/chat/completions`. It uses `OPENAI_API_KEY` when set, never
prints it, and enforces both task-local timeouts and the manifest deadline.

## Five-minute criterion

A run completes only if all mandatory tasks, reduction, judgment, and final
validation finish by the manifest's 300,000 ms deadline. Partial cards remain
evidence but never count as deadline completion. Quality parity remains a
separate blind comparison against the accepted parent findings.

