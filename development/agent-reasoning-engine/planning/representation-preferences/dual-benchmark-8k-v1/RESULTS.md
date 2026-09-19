# 8K dual-benchmark results

**LongMemEval met the 15% development target. ContextBench did not.** Both stages
ran on GLM-5.3-flash, first with two workers per benchmark and then four. Each
request was bounded by 8,000 input plus reserved output tokens.

This is a small development comparison: **four exposed tasks per benchmark,
each repeated twice**, giving eight outcomes per arm. It is not a full benchmark
run, an official leaderboard score or untouched confirmation.

## Measured results

Token totals include all model input and output, ingestion, reasoning, cached
inputs, failed calls and LongMemEval judging. Each benchmark must meet the 15%
requirement separately.

| Benchmark | Control tokens | Treatment tokens | Reduction | Quality and completion | Verdict |
| --- | ---: | ---: | ---: | --- | --- |
| LongMemEval | 75,384 | 23,912 | **68.28%** | Correct answers 5/8 → 7/8; both arms returned 8/8 answers | Development criteria met |
| ContextBench | 626,119 | 567,202 | **9.41%** | Valid selections 3/8 → 4/8; Span-F1 3.66% → 16.07% | Below 15%; incomplete selections remain |

ContextBench Span-F1 improved by **12.41 percentage points**. Span coverage,
precision and file coverage/precision also did not regress. That improvement is
useful, but neither the token requirement nor the strict complete-selection gate
passed. A valid selection is not proof that a code repair succeeded.

Only **one independent LongMemEval source history exceeds 8K** in this oracle
subset. Across its two repetitions, treatment used 6,526 tokens versus 28,730
(77.29% fewer), with 2/2 correct versus 1/2. This is encouraging evidence from one
long task, not confirmation across a broad long-history population. Evaluation
used the pinned native rubric with an arm-blinded GLM judge; same-model judging
is a limitation.

## What was tested

LongMemEval compared model-written sequential notes with a deterministic archive
projection that prioritizes user turns and relevant assistant context. Avoiding
model-written ingestion accounts for much of the saving. This is a declared
retrieval-versus-notes adaptation, not the official full-history evaluation.

ContextBench compared complete native request trajectories with compact repeated
instructions, tool descriptions and redundant metadata. It did **not** include
the previously confirmed H72 terminal-handle treatment. The earlier Round 55
result remains intact; this isolated component study does not replace it.

## Why ContextBench still misses the target

- Cheaper requests can fund more calls before the same spending-based stop. In
  one valid pair, calls rose from 27 to 30 and total usage stayed near 81K.
- Three first-pass rejected selections referenced real delivered reads containing
  edited lines absent from the pinned source revision. These were provenance
  failures, not invented IDs.
- Two empty first-pass selections had historical evidence but no IDs visible in
  the last prompt after context recycling.
- One second-pass treatment exhausted its 2,048-token output allowance. The failed
  call's 6,002 tokens remain counted. Its lower task total is not an efficiency win.

See [the provenance and retention analysis](contextbench/FAILURE-ANALYSIS.md),
[output-cap analysis](contextbench/STAGE2-OUTPUT-FAILURE.md), and
[full trace accounting](contextbench/all-trace-analysis.json).

## Worker scaling and total spending

The request traces prove simultaneous **2 + 2** and then **4 + 4** API requests.
Both capacity stages passed the measured overlap and timing-coverage checks, with
no HTTP429/503 or other non-200 generation responses. All usage is known. These
are concurrent requests on the same model/account, not eight deployed servers.

Second-stage request p95 latency was 12.27 seconds versus 15.17 seconds in the
original first stage. This does not establish a causal speedup: task trajectories,
arm order, a repaired prerequisite and scheduler underutilization differ. The
group-slot scheduling issue is recorded for correction before larger campaigns.

Actual spending was **1,292,617 model tokens**, including **4,781 judge tokens**,
below the fixed 1,945,600 ceiling. The first stage plus its supplemental first
exposure used 647,284; the second stage used 645,333. Research-orchestration agent
tokens are not measured by these benchmark receipts and are not claimed as zero.

## Preserved amendment and audit trail

The original fourth ContextBench task failed to clone its pinned commit before
any model call. The commit existed but lacked a containing Git ref. Adding a ref
to that exact commit repaired cloning; all four clone/checkouts were verified.

The [prospective amendment](AMENDMENT.md) preserved the zero-call failure and
ran only that task's first model exposure. It changed no task, prompt, scorer,
quality threshold or outcome. The original failed scaling gate remains intact;
the amended gate passed the same health criteria. Therefore the combined result
is **amended development evidence**, not a retrospectively clean original run.

- [Original results](RESULTS.json) and [original completion audit](COMPLETION-AUDIT.md)
- [Amended results](AMENDED-RESULTS.json) and [raw token audit](AMENDED-POSTRUN-AUDIT.json)
- [Measured concurrency](CAPACITY-RESULTS.json)
- [Amended native research DAG](amended-research-dag.json)
- [Amended completion audit](AMENDED-COMPLETION-AUDIT.md)

## Next work and open questions

Follow [the successor DAG](NEXT-ROUND-DAG.md). For ContextBench, first validate
compact, base-revision evidence after recycling; then test one stopping or reuse
intervention with unchanged acceptance criteria. For LongMemEval, freeze an
untouched cohort of genuinely long histories before claiming transfer. Keep 8K
and the 15% target. No production promotion or full-benchmark clearance follows
from this pilot.
