# ContextBench development adapter

This candidate runs four native ContextBench repository tasks at exactly 8,000
tokens per request and 96,000 cumulative model input plus output tokens per arm.
Each matched pair executes independent full control and treatment trajectories.
All model attempts count. There is no shared-prefix or terminal-only denominator.
Root scheduling owns the combined reservation and two/four workers per benchmark.

The fixed development cohort is the first four identities in the existing Round
52 development order. Selection uses no gold or quality scores. These identities
are reused development evidence, not untouched confirmation. Baseline uses the
existing native source-selection episode, without H72 terminal continuation.
Treatment compacts repeated instructions and tool descriptions and omits only
derivable observation metadata: byte_count, repeated base_commit, and
retrieval_handle (reconstructed as `observed-read:<read_id>`). Source bytes,
paths, line ranges, revision labels, IDs, hashes, tool schema constraints,
tool pairing, reasoning and output caps remain intact.

`build-runtime.mjs` creates versioned copies of the native episode and
orchestrator, with ancestry hashes and one presentation hook before exact prompt
capture and tokenizer admission. Imports otherwise use canonical native code.
`prepare.mjs` checks cached repository commits, native dependencies, and task
hashes without any provider calls. Its archived byte projection is only a
feasibility estimate, not measured token reduction.

`run.mjs` exports `runPair({config, task_id, directory, repetition, signal})`.
The default configuration is `config.json`. Pair output includes known and
conservative cumulative usage. Unknown dispatched calls debit the complete
8,000-token reservation and cannot support a passing efficiency claim. A rate
limit or unknown model result prevents the pair's remaining arm from starting.
No automatic model retries or replay of existing output directories occur.

The evaluator separately calls `scorePair({config, directory})` after predictions
are sealed. It reconstructs the exact source selection from captured model
receipts and snapshots, then invokes the pinned native ContextBench evaluator.
Gold only enters that evaluator. Incomplete selections are fixed zeros. Native
Span-F1, span/file coverage and precision measure source selection; they do not
establish verified code repair. The root report owns denominator-wide gates.

Run outputs must use disk-backed storage with at least 5 GB available; `/tmp`
is rejected. Existing repository and native scoring caches are reused. The
adapter creates at most two native clones per active arm and never fetches an
entire new upstream dataset or runs repository tests.

Each arm's `model-timing.jsonl` records absolute local request intervals, observed
when the native client appends a dispatched model receipt. End time is the local
observer clock; start time subtracts the native receipt's latency. The observer
preserves receipt objects and request bytes. These intervals cover credential
callbacks and transport, and provide evidence of overlapping local model requests;
they do not establish simultaneous execution inside the provider backend.

## Open Questions

- Can compact repeated representation reduce complete trajectory tokens by at
  least 15% while preserving every frozen native quality/completion gate?
- Do fewer input tokens change exploration length enough to offset savings?
- Does a same-cohort second repetition under four workers preserve stability?
- Verified repair correctness and untouched confirmation remain separate work.
