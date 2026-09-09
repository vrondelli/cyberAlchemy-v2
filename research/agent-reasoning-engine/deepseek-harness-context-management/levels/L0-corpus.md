# L0 — source corpus

All upstream observations below refer to the pinned commit in the source
register. Links use its immutable Git tree.

## Observed mechanisms

1. **The session is the canonical append-only event log.** Model messages,
   transcripts, telemetry, titles, and persistence derive from the event
   stream. Model-visible content must be reconstructable from it. The payload
   is snapshotted, lossless-JSON validated, and frozen at append.
   [Session package](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/core/session/README.md)

2. **Model history is a deterministic projection, not a second record.**
   `deriveMessages()` incrementally caches per-surface-node projections. A
   surface replacement rebuilds the projection while leaving raw events in
   history.
   [Session package](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/core/session/README.md)

3. **Persistence and semantics are separated.** The JSONL backend stores the
   same logical event stream in an append-only per-session file. It supports
   durable flush, contiguous sequence validation, checksummed Zstandard frames
   or raw lines, and torn-tail recovery. Committed events are not rewritten.
   [JSONL persistence](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/session/session-persistence-jsonl/README.md)

4. **A derived cache is fail-soft and subordinate.** The projection cache may
   lag the canonical log; a failed cache write increases replay cost rather
   than inventing state. Its safe ordering is “behind, never ahead.”
   [Projection cache](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/session/session-projection-cache/README.md)

5. **Append-only growth preserves an already reusable request prefix.** The
   project explicitly distinguishes append-only growth, stable repeated prefix,
   replacement of earlier request tokens, and independent requests. Provider
   availability and eviction remain outside a package contract.
   [Package documentation contract](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/docs/cookbook/adding-a-package.md)

6. **Request reconstruction covers non-history bytes.** Request headers log a
   canonical snapshot of system prompt, tool schemas, and call configuration.
   That data is not duplicated in message history, but it is necessary to
   reconstruct the byte-stable model request.
   [Session package](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/core/session/README.md)

7. **Compaction shadows; it does not erase.** The raw events remain. The
   derived surface replaces a selected range with a summary event. The
   auxiliary summarization request replays the prior system prompt, tools, and
   selected messages byte-for-byte, then appends its instruction.
   [Basic compaction](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/compaction/compaction-basic/README.md)

8. **Cache use is empirically observed.** A key-gated end-to-end test checks
   that every request after the first reports `cacheReadTokens > 0`; the adapter
   maps the DeepSeek provider's `prompt_cache_hit_tokens` value.
   [Cache E2E test](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/core/agent-loop/tests/request-cache.e2e.ts)

9. **Durability is scheduled by semantic risk, not an arbitrary timer.** The
   checkpoint policy flushes before a model request, before a top-level tool
   may create an external effect, and at each step boundary. Failure blocks the
   request or tool body. A durable unmatched tool call recovers as outcome
   unknown instead of being retried blindly.
   [Checkpoint policy](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/session/session-checkpoint-policy/README.md)

10. **Dynamic context is a complete current snapshot appended only on change.**
    DSH joins named dynamic-context contributions into one sourced user message
    that explicitly supersedes earlier runtime-context snapshots. If the
    rendered text is unchanged, it emits nothing; clearing context appends a
    clearing marker rather than mutating history.
    [Runtime context](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/core/agent-loop/src/runtime-context.ts)

11. **Request-envelope identity is first class.** The canonical request header
    includes provider/model call configuration, system prompt, ordered tool
    schemas, and adapter-default provenance. Full snapshots are logged on
    initial use, change, resume, or a new request series; unchanged calls
    inherit the prior header.
    [Request-header fold](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/core/session/src/request-header.ts)

12. **The sent request is checked against its logged reconstruction.** An
    invariant compares frozen dispatch messages with `deriveMessages()` and
    provider/model/system/tools/call fields with the folded request header.
    [Request reconstruction invariant](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/core/agent-loop/src/invariant.ts)

13. **Projection units are small synchronous folds with explicit versions.**
    Unrelated events return the same state reference, avoiding view work and
    notifications. State-carrying events contain complete post-change values,
    and snapshots carry one `asOfSeq` cut across every served projection.
    [Projection registry](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/session/session-projection/README.md)

14. **Exact history and retrieval remain independent of model compaction.** The
    session-query service can read, search, and trace current, shadowed, and
    log-only events. Its derived SQLite index is disposable, reconciles from
    source revisions, and invalidates generation-bound cursors instead of
    returning shifted pages.
    [Query service](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/session-query/session-query/README.md),
    [SQLite index](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/session-query/session-query-sqlite/README.md)

15. **Model-facing retrieval derives authority from the caller.** DSH hides
    backend cursors and model-controlled limits, authorizes targets from the
    calling session's workspace, sanitizes errors, and delegates oversized
    output to one generic spill policy.
    [Session-query tools](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/session-query/tool-session-query/README.md)

16. **Cross-session context is captured as bounded, immutable, untrusted data.**
    A snapshot is read once at model-step entry, excludes recursively referenced
    snapshots, escapes framing tokens, and warns the model not to inherit
    instructions, permissions, or tool requests from it.
    [Session references](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/context/session-reference/README.md)

17. **Context pressure has a deterministic reduction ladder.** Oversized tool
    text can first be pruned head/marker/tail without a model call while the
    exact original stays in the log; oversized results can instead spill to a
    retrievable artifact. Generative compaction runs only if pressure remains.
    [Tool-result pruner](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/compaction/compaction-tool-result-pruner/README.md),
    [Spill policy](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/spill/spill-policy/README.md)

18. **Measurements reuse provider usage only under an identical canonical
    envelope.** The token meter otherwise falls back to deterministic estimates
    and preserves both route-priced and route-independent values.
    [Token meter](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/llm/token-meter/README.md)

19. **Completed-prefix forks preserve context without inheriting authority.** A
    child receives the parent's balanced completed-turn prefix, a fresh tool
    scope, and no in-flight turn. Provider/model inheritance preserves cache
    affinity; tool, persona, or route changes explicitly break it.
    [Forked subagents](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/subagent/subagent-fork-in-process/README.md)

20. **The event log doubles as the model replay fixture.** A keyless test
    adapter derives model-call streams from persisted assistant chunks, while a
    small sidecar represents failures that leave no reconstructable chunks.
    [LLM replay](https://github.com/deepseek-ai/deepseek-harness/blob/49a606bc5b5934603f22a26957a07dc799ab0291/packages/test-support/llm-replay/README.md)

## What the source does not prove for ARE

- It does not prove that Codex app-server serializes `additionalContext` into a
  provider-cache-compatible location.
- It does not prove the same provider, model, block size, retention, or cache
  reporting behavior in Codex.
- It does not carry ARE's selected-definition, ontology-lock, provenance,
  temporal, semantic, or authority-posture requirements.
- It does not show that an unbounded event stream should be sent to the model.
