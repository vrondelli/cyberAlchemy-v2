# GLM fitting benchmark prototype

Status: owner-directed construction candidate, authority effect **none**. This
implements the first offline dataset and evaluation boundary from the
[research plan](../../../../research/agent-reasoning-engine/glm-context-memory-reuse-2026-09-07/README.md).
The [construction record](CONSTRUCTION.json) extends the existing GLM D65 chain;
it does not admit a runtime, capability, or deployment.

## Runnable product frontier

`dataset.json` contains **48 authored tasks**, six per pinned package profile:
lookup, declared architecture references, conflicting evidence, continuation,
small JSON repair, and abstention. Four source groups are training (24 tasks),
two development (12), and two held-out (12). Each source/group and all its
question variants stay in one split. SHA-256 pins bind exact source bytes;
validation refuses drift rather than silently regenerating labels. Source paths
are repository-relative and cannot escape the declared root through symlinks.

This is a **starter profile corpus**, not the complete diverse coding benchmark.
The conflicting note is deliberately synthetic, not a recovered historical
revision. Continuation uses a synthetic checkpoint, not an ARE resume event.
Repairs restore a field in a disposable JSON object and preserve its other
fields; exact-JSON checks execute locally, without applying patches or executing
model code. Architecture questions ask declared references; they do not establish
that referenced implementations are admitted or working. Abstention is scoped
to a missing production latency SLA in the supplied profile only.

No shared source file or identical source digest crosses the splits. This does
not establish semantic independence: these packages share governance vocabulary,
and the question templates overlap intentionally. Real code repairs, multi-file
architecture reasoning, historical revision conflicts, and actual post-recycle
continuation must be added in a later version before broad performance claims.

From the repository root:

```sh
node implementation/agent-reasoning-engine/benchmarks/glm-fitting-v1/cli.mjs validate
node --test implementation/agent-reasoning-engine/benchmarks/glm-fitting-v1/test.mjs
node implementation/agent-reasoning-engine/benchmarks/glm-fitting-v1/cli.mjs smoke /tmp/glm-fitting-smoke-new.jsonl train
```

Smoke uses a constant scripted abstainer: the expected training result is four
correct answers out of 24, zero model calls, and unknown (`null`) token usage.
That deliberately unhelpful baseline verifies scoring and accounting; it is not
a GLM measurement. The output path must not already exist. Each attempt receives
a flushed `started` event and a final event. An interrupted adapter therefore
leaves an observable incomplete attempt. A failed recorder stops the run.

## Adapter and evaluator boundary

`runDataset({root, dataset, config, adapter, onAttempt})` validates the entire
corpus, selects one explicit split, checks the attempt cap before dispatch, and
records every attempt without retry. The callback contract is:

```js
async function adapter(input) {
  // input: {schema_version, invocation_id, question, fixture,
  //         sources:[{source_id,path,sha256,text}], context}
  return {
    text: '{"value":"an answer"}',
    tool_events: [], // exposed, redacted protocol events; no private reasoning
    usage: {model_calls:1, tokenizer_calls:1, input_tokens:123,
      output_tokens:20, cache_tokens:null, recycles:0},
    finish_reason: 'stop'
  };
}
```

The callback receives an opaque invocation ID, never task ID, family, split,
gold answer, or evaluator evidence selectors. `publicInput` constructs an
allowlist projection instead of spreading the task. The source text naturally
contains the facts needed to answer; that is allowed evidence. Each task currently
names its source explicitly, so this measures answering with supplied evidence,
not open-corpus retrieval quality. Do not claim Kite retrieval gains on it alone.
The new [Kite contract adapter](../../packages/coding-agent-runtime/kite-retrieval-v1/README.md)
can be evaluated separately using `{query, invocation_id}` and pinned source byte
spans; its scripted backend is not genuine Kite execution.

This is an API data boundary, **not a sandbox**: a trusted adapter running in the
same Node process could read local gold files or access the network. A live
integration must isolate evaluator assets from the model's tool allowlist and
retrieval corpus. Do not index this directory as task evidence. Keep held-out
answers out of optimizer/reflection inputs; freeze candidate prompts before the
final held-out run. The helper does not enforce an optimizer lifecycle.

Config has closed fields: `split`, `repeats` (1–10), `max_attempts` (1–480),
`max_input_bytes` (up to 1 MiB), `context_limit_tokens`, `recycle_at_tokens`,
`output_reserve_tokens`, `token_margin`, `policy`, `model`, and `adapter_kind`
(`offline-scripted` or `bounded-runtime`). Policy labels can match the runtime's
`clear-v1` or `recent-observations-v1`. The explicit live adapter below is bundled; it is not invoked by validation or smoke.

The harness's byte guard is only an input serialization limit. Recorded token
settings do not enforce GLM tokens. A bounded-runtime adapter must use ARE's
actual complete-request tokenizer and admission checks, enforce call/time/spend
caps, and include all tools and instructions. The adapter must return redacted
exposed output/events and aggregate usage for all work, including failed calls;
unknown metrics must remain null. Arbitrary exception text is suppressed because
it may contain credentials. Sources are rechecked before each attempt; a trusted
adapter is responsible for guarding any source reads performed during its call.

Each record includes dataset/config/input digests, invocation/task identity,
serialized input bytes, response text, tool events, usage, finish reason,
wall-clock duration, score, and explicit failure state. The exact-JSON verifier
checks content and required output format together. It is strict, not a semantic
prose judge. More nuanced source correctness, abstention, and formatting scores
remain work for a broader corpus. Unknown usage and failed attempts must remain
in the denominator when reporting cost/performance.

## Product and operational lanes

Current product evidence: corpus validation, 13 harness tests, eight injected
live-adapter tests, and offline training smoke. Next runnable work: a bounded
training QA pilot, broader source episodes, and paired retention/context sweeps
through the actual multi-turn coding runtime using frozen task/prompt inputs.
No paid calls are required for this frontier.

The run operator owns later provider availability and complete spend ceilings.
The evaluator owner owns the held-out freeze and manually audited gold. The
runtime owner owns full-request token enforcement and real recycling telemetry.
Product approval, activation, publication, and deployment are separate deferred
operations; none is granted by passing these tests.

## Explicit live single-turn QA

`live-adapter.mjs` uses the existing GLM transport, SOPS reference parser and
secret registry. It sends one tool-free question per task. The complete system
and user messages plus empty tools schema go through the provider tokenizer and
ARE's reservation-bound dispatch; output tokens and tokenizer margin are included.
The strict soft-threshold condition is `input_upper_bound + output_reserve <
recycle_at`. A fresh oversized prompt blocks; this adapter never recycles.

Prepare a private copy of [live-manifest.example.json](live-manifest.example.json),
using the existing credential reference configuration (including its optional
Python/project/key/vault paths if required) and an external private state
location. Never put an API key into the manifest. It selects six training tasks,
one per family from the routing profile. `dataset_sha256` pins the exact
JSON-serialized dataset (including its source hashes); the CLI verifies it
before credential dispatch. It is evaluator metadata and never enters the prompt. Then an explicitly authorized operator
can run:

```sh
node implementation/agent-reasoning-engine/benchmarks/glm-fitting-v1/cli.mjs live /private/path/manifest.json /private/path/new-attempts.jsonl
node --test implementation/agent-reasoning-engine/benchmarks/glm-fitting-v1/live-test.mjs
```

Live mode makes external tokenizer/model calls. It is **single-turn QA**, not a
retention comparison or proof about provider compaction. Held-out and development
splits are rejected in live mode. An explicit training subset is supported via
`task_ids`; omitted selection in the generic runner still evaluates a full split.
All answers use the existing gold-blind projection, with no model tools available.
The in-process injected client remains a trusted test seam, never a JSON field.

Limits cap each attempt at one actual model call, a run at at most 12 attempts,
each HTTP call at 30 seconds, each attempt at 60 seconds, the run at 10 minutes,
and generated output at 2,048 tokens per call. The example requests six model
calls, six minutes, and 60 seconds per attempt. Each single-turn request needs
one tokenizer measurement; there are no extraction/reflection calls or retries.
`max_total_ms` stops future dispatch and aborts active transport at the deadline.
The credential subprocess retains its existing separate provider timeout.
This is a finite token/call envelope, not a currency-denominated billing quote.

Transport receipts record request hashes, dispatch status, timing and known
usage. Failed calls retain partial usage; unknown tokens remain null. Unknown
transport outcomes and auth/billing failures halt further calls. Incomplete
output is recorded as a failed attempt, never parsed as a successful answer.
Later halted attempts remain in the artifact. Only final visible content is
recorded, never the provider's `reasoning_content`; arbitrary exception text is
suppressed. The existing transport's request/response byte caps and endpoint
allowlist apply unchanged.

The durable reservation/checkpoint directory is separate from the repository
fixture. Interrupted or terminal checkpoints are not resumed by this adapter;
each attempt has a new identity, and no uncertain request is replayed. A restart
is a new user-directed run, not automatic retry. No live calls were made while
implementing or testing this adapter.

## Parent-operated live pilot, 2026-09-07

The first real GLM run passed all six selected `routing` training tasks with
six model calls and six tokenizer calls: 3,386 input tokens, 91 output tokens,
and 15.8 seconds aggregate attempt time. Every outgoing request passed the
complete-request admission check. No held-out task was used.

This is single-turn answering from supplied evidence. The continuation and
repair cases are synthetic profile tasks; the result is not evidence of active
coding recovery, open-corpus retrieval, or a retention improvement. Billing
cost remains unknown. See the [source-pinned receipt](evidence/live-training-pilot-2026-09-07.json)
and [attempt records](evidence/live-training-pilot-2026-09-07.jsonl).

## Open Questions

- Which code and historical episodes should replace the synthetic starter cases?
- Which source groups give semantic independence beyond disjoint file bytes?
- How should the existing coding runtime support factual answers as well as patch
  proposals without weakening its effect boundary?
- Which provider metadata distinguishes truncation, finish reasons, and internal
  compaction? This offline harness cannot prove its absence.
- How should a future isolated live worker preserve failure usage and cancellation
  evidence when the process dies mid-call?
