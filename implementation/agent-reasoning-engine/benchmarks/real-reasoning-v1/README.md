# ARE Real Reasoning Benchmark v1

This candidate harness measures observable reasoning-engine behavior across routing, request-aware context retrieval, context-view lifecycle, fail-closed boundaries, exact-prefix cache reuse, and optional real Codex conversations. Cache comparisons accept only provider-reported usage bound to the same projection and prefix; absent fields remain unobserved. It does not attempt to inspect hidden chain-of-thought and grants no authority.

## Run

Use the repository's Node 26.8.1 runtime:

```sh
cd /home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/agent-reasoning-engine/benchmarks/real-reasoning-v1
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node bin/benchmark.mjs --mode core
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node bin/benchmark.mjs --mode integration
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node bin/benchmark.mjs --mode compaction-simulated
```

`compaction-simulated` compares full history, a recent-only control, the ARE
pinned/masked projection, and that projection after replayed native Codex
compaction notifications. It measures critical-state survival, recoverability,
tool-pair integrity, byte reduction, deterministic replay, observer coverage,
and local projection latency. It does not simulate Codex summarizer quality or
make a model-quality claim. The append-only source epoch remains unchanged.

The opt-in real canary drives native compaction through the existing ARE Codex
app-server wrapper and compares paired baseline/treatment recall on one model:

```sh
PATH=/home/vrondelli/.nvm/versions/node/v26.8.1/bin:$PATH \
  /home/vrondelli/.nvm/versions/node/v26.8.1/bin/node bin/benchmark.mjs \
  --mode compaction-live --model gpt-5.6-luna
```

This is a controlled integration canary, not a market-quality estimate.

The harder automatic-compaction experiment never calls the manual compaction
method. It alternates paired arms, adds bounded deterministic conversation
turns to a direct Codex app-server until Codex emits `contextCompaction`, and
requires a registered recall gain. The v2 treatment renders the same pinned
projection as a typed, delimited reasoning-state text item immediately before
the recall request; its digest and byte count are recorded. This supersedes the
v1 application-metadata treatment, whose five-pair failure remains immutable
run evidence. Wrapper integration and its 32 KiB mandatory Context Envelope
remain covered by the separate canary and wrapper suites.

```sh
PATH=/home/vrondelli/.nvm/versions/node/v26.8.1/bin:$PATH \
  /home/vrondelli/.nvm/versions/node/v26.8.1/bin/node bin/benchmark.mjs \
  --mode compaction-auto-live --model gpt-5.6-luna --repetitions 1
```

If both threads do not compact within the byte/turn cap, the run is
`NOT_EVALUATED`. If compaction occurs but the treatment does not clear the
registered recall delta, the run is `FAIL`, preserving the no-gain result.

`all` runs all deterministic modes, including compaction. Real Codex comparison is deliberately opt-in:

```sh
PATH=/home/vrondelli/.nvm/versions/node/v26.8.1/bin:$PATH \
  /home/vrondelli/.nvm/versions/node/v26.8.1/bin/node bin/benchmark.mjs \
  --mode live --repetitions 3
```

The multi-turn extension keeps one ephemeral Codex thread alive for each
Define, Research, Ontology, or Plan conversation and scores all three turns:

```sh
PATH=/home/vrondelli/.nvm/versions/node/v26.8.1/bin:$PATH \
  /home/vrondelli/.nvm/versions/node/v26.8.1/bin/node bin/benchmark.mjs \
  --mode live-multiturn --model gpt-5.6-luna --repetitions 1
```

One repetition performs 24 real turns: 12 ARE and 12 paired controls. Increase
repetitions explicitly for stability evidence; model calls remain opt-in. The
model override is sent to both variants and recorded with its profile default
and selection source in `summary.model_binding`.

To reuse an already-running persistent gateway, add `--gateway-socket /path/to/are-gateway.sock`. The gateway must authorize `codex:benchmark` on the interaction-bound lane and must have been restarted after the profile change.

Results are written under `runs/` unless `--stdout-only` is supplied. Timing is local evidence, not a universal performance guarantee. A live `NOT_EVALUATED` result means the installed Codex version did not match the exact protocol binding; the gate is not relaxed.

The local impact profile measures cold turn start, stable plan reuse, and a
controlled interaction-bound A/B with content-projection reuse disabled and
enabled. It also counterbalances full-read source refresh using the portable
JavaScript and native Node SHA-256 implementations. Both hash arms read every
selected source and must produce the same source snapshot; metadata-only cache
checks are not benchmark treatments. Both interaction variants still create
successor view, context, and reasoning identities. A candidate must save at
least 1 ms and 1% of the cold turn boundary; a miss remains negative evidence
and does not activate another optimization.

Preflight phase observation is out-of-band: it measures request construction,
routing, selection, closure, ontology locking, basis construction, refresh,
envelope assembly, fragment projection, and message projection without adding
timing data to deterministic context bytes. Current improvement-retention
records remain visible in the report but cannot be selected again. If any bound
implementation or evidence file changes, the retention becomes diagnostic
stale state and the candidate is eligible for measurement again.
The portable/native source-hash A/B is not rerun while its exact retention is
current; the active native path is still sampled for drift visibility. This
keeps completed hypotheses from consuming the next experiment budget.
Envelope sealing has its own counterbalanced portable/native hash comparison.
Both arms receive one frozen composition and must emit byte-identical Context
Envelopes before their timings can become candidate evidence.

```sh
npm run impact:profile -- --output runs/impact-profile.json
```

The registered lexical treatment experiment is runnable with:

```sh
npm run scorer:experiment
```

It compares `scorer:exact-required-term/v1` with
`scorer:declared-concept-equivalence/candidate-v1` on the exact
`holdout:literal-versus-intent-counterbalanced-v1` dataset. A failing result
is useful evidence: the treatment must improve false negatives, preserve
safety and false-positive behavior, and stay within the registered p95 latency
limit.

An optimized implementation attempt is kept separate from the registered v1
identity and can be rerun with:

```sh
npm run scorer:experiment:v2 -- --output runs/2026-09-03-scorer-experiment-v2.json
```

The v2 report is evidence for `ARE-RH-LEXICAL-001`, not activation authority.
It preserves v1 predictions and safety while exposing the remaining latency
regression for the next reversible optimization.

The next fused-pass attempt is independently identified and runnable with:

```sh
npm run scorer:experiment:v3 -- --output runs/2026-09-03-scorer-experiment-v3.json
```

Its report is recorded alongside v2; it is not a replacement or activation of
either candidate.

To repeat v3 until the first PASS or a maximum of 15 attempts, run:

```sh
npm run scorer:experiment:v3:loop -- --output runs/2026-09-03-scorer-experiment-v3-loop.json
```

The loop stores every attempt with a distinct attempt identity and binds each
failed attempt to a sealed successor hypothesis. The completed run reached the
15-attempt bound with no PASS; this is recorded as evidence for the next
profiling step.

For strategy search, use `npm run scorer:strategy-loop`. It rotates through the
declared fused, compiled, and baseline-overlay implementations, creating a
hypothesis bound to each exact code pattern before measuring the next attempt.

To require measurable progress before continuing, use the gain-gated loop:

```sh
npm run scorer:strategy-loop:gain -- --output runs/2026-09-03-scorer-strategy-loop-gain.json
```

The gate establishes the first attempt as the baseline, then requires every
subsequent attempt to improve the registered p95 latency regression ratio while
preserving agreement, false-negative reduction, false-positive behavior, and
safety. The default policy stops after the first non-gain (`stop_reason:
no-gain`); `--max-no-gain-attempts N` permits a bounded tolerance. Missing
metrics and failed protected checks stop the loop fail-closed. A gain gate is a
search-control signal only: it does not activate a scorer or grant authority.

For parallel hypothesis exploration, run the portfolio mode:

```sh
npm run scorer:portfolio -- --output runs/2026-09-03-scorer-portfolio.json
```

Portfolio mode declares every strategy as its own hypothesis, screens all
branches, fully evaluates only the best `--max-survivors` (default `2`), and
records rejected or screened-out branches in the same immutable report. The
optimization catalog currently includes twelve concrete scorer strategies,
including indexed marker lookup, single-response scans, lazy lexical gating,
and precompiled boundary-aware regexes. A separate
`--confirmation-holdout FILE` can confirm the provisional winner;
without it, the result is explicitly `PROVISIONAL`. Full and confirmation
stages run independent replications (default `3`), recording median, minimum,
maximum, and every observed value. To derive a disjoint confirmation partition
from the registered fixture for a local canary, use:

```sh
npm run scorer:portfolio:confirm -- --output runs/2026-09-03-scorer-portfolio-confirmed.json
```

The `even` partition is confirmation data and the complementary `odd`
partition is screening data. A survivor must improve strictly over its own
screening aggregate before confirmation is attempted.

The next twelve-strategy cycle is reproducible with:

```sh
npm run scorer:portfolio:next
```

The scorer timing protocol uses paired measurements: baseline and treatment
alternate order after a configurable warmup, and every per-repetition timing
sample is retained. Reports include phase timings (compile, prediction, warmup,
and timed work) plus a deterministic bootstrap confidence interval over the
paired latency-regression samples. This keeps run-to-run variation visible
instead of treating one short timing as a fact. For a higher-variance evidence
run with ten replications per full and confirmation stage, use:

```sh
npm run scorer:portfolio:variance
```

The variance run is evidence only; it does not activate or authorize any
scorer. Use `--timing-order baseline-first` or `treatment-first` only for
diagnostics. The default `alternating` order is the registered measurement
protocol.

The protocol is grounded in published benchmark practice: MLPerf reports
run-to-run variation and uses repeated runs for stable measurements; MLPerf
Inference emphasizes reproducible, auditable latency scenarios; and tail-
latency research shows that harness ordering can distort percentile results.
The holdout itself follows the pragmatic-language finding that literal and
intended readings can diverge, so quality and latency remain separate gates.
References: [MLPerf Training](https://arxiv.org/abs/1910.01500),
[MLPerf Inference](https://arxiv.org/abs/1911.02549),
[Tell-Tale Tail Latencies](https://arxiv.org/abs/2107.11607), and
[pragmatic language understanding](https://arxiv.org/abs/2212.06801).

## Modes

- `core`: 20 route cases, 10 context-retrieval cases, deterministic replay, and warm latency.
- `adaptive-reuse`: eight deterministic scenarios comparing recent-window control, typed projection, intent reflection, and the fail-closed context-bound reuse gate.
- `adaptive-reuse-holdout`: eight disjoint, exact-SHA-bound adversarial scenarios loaded only through the dedicated evaluation flag.
- `integration`: five multi-turn lifecycle traces plus six fail-closed cases.
- `live`: paired ARE/control ephemeral app-server turns, alternating execution order.
- `live-multiturn`: four paired three-turn conversations with thread continuity, per-turn grounding, Context Item citation, question-policy, and authority-safety checks.
- `external-retrieval`: exact-bound Agent Retrieval Bench JSONL plus ARE prediction JSONL, scored for MRR, Recall/Precision/F0.5@20, BCY@8k, and selective abstention.
- `external-retrieval-run`: produce deterministic ARE hybrid-lexical predictions from exact corpus snapshots, then score them through the same adapter.
- `all`: core plus integration; `--include-live` adds the live comparison.

Run the adaptive reasoning-state reuse round with Linux Node v26.8.1:

```sh
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node bin/adaptive-reuse.mjs
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node bin/adaptive-reuse.mjs --holdout
```

This round exercises the real structural runtime functions. It measures exact
fact preservation, correction recognition, selected-dependency invalidation,
unrelated drift, reusable prefix bytes, and local lifecycle latency. Cache
posture remains `unobserved` unless separately bound provider telemetry exists.
Every result also contains `improvement_feedback`: PASS yields no candidate;
each failed check yields a deterministic, non-adopted Research Hypothesis tied
to the exact source result and failed scenario identities. This is applied by
the shared result constructor to every benchmark mode. Nested case groups are
flattened only for scenario identity extraction, while `NOT_EVALUATED` remains
visible with no invented failure hypothesis.

Run the complete deterministic failure-learning canary from the product root:

```sh
node bin/are.mjs improve run-canary --output /tmp/are-failure-learning.json
node bin/are.mjs improve inspect --report /tmp/are-failure-learning.json
```

The baseline uses the registered legacy ungated cache path and must fail with
stale selected-dependency reuse. The treatment uses the production
context-bound refresh gate, replays deterministically, and runs the disjoint
exact-SHA holdout. The report retains the projected hypothesis, implementation
pattern, immutable Engine Variant, comparison, experiment observation,
Learning Decision, and sealed evolution epoch. Provider cache posture remains
`unobserved` in this structural canary; only real configured provider usage can
produce an observed hit or miss.

## External retrieval lane

The first external adapter targets [Agent Retrieval Bench](https://github.com/eyuansu62/agent-retrieval-bench) without vendoring its corpus. Download and validate an upstream release separately, produce one prediction per sample, and run:

```sh
node bin/benchmark.mjs \
  --mode external-retrieval \
  --dataset /path/to/arb/samples.jsonl \
  --predictions /path/to/are-predictions.jsonl \
  --dataset-id v2-positive-or-selective-release \
  --dataset-revision <exact-upstream-revision> \
  --stdout-only
```

Prediction records conform to `schemas/external-retrieval-input.schema.json`. Each ranked file must carry observed `header_tokens` and `content_tokens`; the adapter never estimates missing token counts. Dataset and prediction bytes are SHA-256 bound in the result, repository/base-commit mismatches block, duplicate or unexpected predictions block, and missing predictions remain visible failures.

Run the included structural canary with:

```sh
npm run benchmark:external-retrieval:fixture
npm run benchmark:external-retrieval:produce-fixture
```

Run the producer against a downloaded release whose corpus directory contains
`corpus_manifest.jsonl`:

```sh
node bin/benchmark.mjs \
  --mode external-retrieval-run \
  --dataset /path/to/arb/samples.jsonl \
  --corpus-dir /path/to/arb/corpus-release \
  --dataset-id v2-selective-release \
  --dataset-revision <exact-upstream-revision> \
  --predictions-output /path/to/are-predictions.jsonl
```

The producer uses request fields and the exact base-commit corpus only; gold
labels are forbidden inputs to ranking and abstention. It combines BM25 content
matching, path/anchor proximity, task-aware source/test priors, deterministic
tie-breaking, and a configurable evidence threshold. Corpus paths may not
escape the supplied corpus directory. The production receipt binds the dataset,
manifest, selected snapshots, predictions, and ARB canonical
`regex_code_tokenizer_v1`.

The positive quality targets reproduce the best published upstream reference value for each ARB metric, even though those values come from different retrievers. The selective-success target is explicitly an ARE candidate target rather than an upstream leaderboard claim. A PASS is local benchmark evidence only and does not demonstrate end-to-end repair success or grant authority.

### Benchmark attack order

The external program advances in impact order:

1. **Agent Retrieval Bench:** file ranking, hard token-budget coverage, and the retrieve-versus-abstain decision. The scorer is implemented.
2. **ARE prediction producer:** connect request selection to exact repository snapshots and emit the prediction schema above. The deterministic hybrid-lexical baseline is implemented; its real quality is not known until the downloaded 427-row release is run.
3. **ContextBench:** test whether retrieved context improves downstream task completion, after retrieval quality is measurable.
4. **MemoryAgentBench:** test longer-lived state selection only after per-request retrieval and abstention are stable.

This order attacks the current precision failure directly. It avoids using an end-task score to hide whether the wrong context was retrieved, and avoids adding durable-memory complexity before selective retrieval is reliable.

## Improvement loop

Start with a fast diagnosis and create one bounded iteration:

```sh
node bin/improve.mjs --mode diagnose --fast
node bin/improve.mjs --mode iterate --baseline runs/improvements/<diagnose-report>.json
```

The iteration report selects one target, records the exact baseline, snapshots every allowlisted implementation file, and prints the verification command. It never edits or reverts source files. After making the bounded change, verify it against that report:

```sh
node bin/improve.mjs --mode verify-candidate \
  --target context-overflow \
  --baseline runs/improvements/<iterate-report>.json
```

Fast baselines compare correctness and safety while recording, but not enforcing, noisy short-sample latency. Use a full diagnosis before final candidate verification. After one candidate returns `KEEP`, require a reproducible streak:

```sh
node bin/improve.mjs --mode loop \
  --target context-overflow \
  --baseline runs/improvements/<iterate-report>.json \
  --max-attempts 5
```

The loop returns `STABLE` only after two consecutive `KEEP` assessments. Any safety, lifecycle, non-target quality, or full-run latency regression rejects the candidate. A stable deterministic candidate advances to the explicitly invoked live holdout; it does not invoke model turns automatically.

## Evolution cycle

The evolution runtime converts benchmark failures into immutable improvement
signals, selects one target, exact-binds research results, records reproduction,
builds a content-addressed variant record, compares it against protected quality,
latency, safety, determinism, and holdout constraints, and emits a recommend-only
upgrade decision by default.

Run the deterministic, no-model fixture canary with:

```sh
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node bin/evolution-canary.mjs
```

The canary exercises the complete lifecycle but does not mutate the source tree,
activate a candidate, publish, or deploy. Real reproduction, worktree mutation,
and activation require separately configured runners.
