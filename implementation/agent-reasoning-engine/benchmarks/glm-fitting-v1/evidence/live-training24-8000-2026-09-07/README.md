# Live GLM training benchmark: 24 tasks

Date: 2026-09-07. Authority effect: none. User requested a planned live run on
the existing benchmark tasks. Runtime code and scorer were unchanged.

## Plan and scope

Evaluate all 24 training tasks in four source groups: routing, goals,
governance, and define. Each group contains lookup, declared-reference
architecture, synthetic conflict, synthetic continuation, JSON-profile repair,
and abstention tasks. Keep 12 development and 12 held-out tasks untouched.
Six routing tasks had already been exercised in the earlier pilot; this is not
a new independent test set.

The [prewritten plan](plan.json) pins the dataset, source files, runtime, and
scorer. Four sequential batches allow six model calls each, with no retries.
Aggregate limits were 24 model calls, 48 tokenizer calls, and 1,440 seconds;
each batch had a 360-second deadline. Source drift or uncertain transport
failure would stop later batches. All inputs were projected through the existing
gold-blind adapter; evaluator labels and gold answers were not sent to GLM.

The hard window was 16,384 tokens, soft threshold 8,000, output reserve 2,048,
and tokenizer margin 256. The adapter performs single-turn QA with supplied
evidence and no tools. Its `clear-v1` label does not make this a clearing versus
retention comparison: there is no preceding history to retain. No v2 or Kite
performance claim follows from these tasks.

## Results

**24/24 tasks passed the unchanged exact-JSON scorer; zero failed attempts.**
Each of the six task families scored 4/4. All 24 visible responses parsed as JSON
objects, none contained Markdown fences, and every finish reason was `stop`.

| Measurement | Observed |
| --- | ---: |
| Model calls / tokenizer calls | 24 / 24 |
| Input / output tokens | 23,435 / 386 |
| Reported cache tokens | 0 |
| Recycles | 0 |
| Overall wall time | 67.4 seconds |
| Median attempt latency | 2.60 seconds |
| P95 attempt latency, nearest rank | 3.54 seconds |
| Remaining soft headroom, including output reservation | 4,065–5,162 tokens |

The dataset validator and 21 benchmark/adapter tests passed before live calls.
Every dispatched complete request passed tokenizer-backed admission. This
demonstrates budget enforcement on these small inputs, not near-limit behavior
or absence of provider-internal compaction. Billing dollars were unavailable.

## Interpretation and next work

The starter corpus provides a clean structured-answer baseline. A perfect result
on short supplied-evidence questions leaves little accuracy signal for prompt
fitting. It does not establish real code-repair ability, multi-file reasoning,
historical conflict resolution, post-recycle continuity, or retrieval quality.
The corresponding family names describe the synthetic task formats, not those
broader capabilities.

The next useful benchmark candidate is a separate set of multi-step repository
episodes with real tool reads, executable repair checks, distractors, and
controlled evidence positions. Compare clearing and v2 on the same episodes,
under matched soft thresholds and call budgets, with repeated runs and varied
arm order. Do not overwrite this passing starter corpus or consume held-out
answers during tuning.

Current product frontier: live starter evaluation completed; broader episode
construction and repeated retention evaluation are pending. The evaluator owner
owns source-backed gold and partition separation; the runtime owner owns tool
and context admission; the run operator owns later call/time limits and endpoint
availability. Activation, publication, and deployment remain deferred.

## Evidence

- [Plan](plan.json): exact task IDs, source pins and finite limits.
- [Summary](summary.json): four completed batches and total wall time.
- [Analysis](analysis.json): per-family scores, usage, latency, format and
  admission checks, plus hashes of the attempt files.
- [Routing](routing.jsonl), [goals](goals.jsonl),
  [governance](governance.jsonl), [define](define.jsonl): flushed start/final
  attempt records and visible model responses, including transport receipts.

Private credential-reference manifests remain outside the repository. No raw
credential values or provider reasoning content are stored in these results.

## Open Questions

- Which real repository episodes give independent, sufficiently challenging
  training and evaluation tasks?
- How should evidence size, distraction and placement vary independently?
- Does retention v2 at 8,000 repeat its coding-canary success on those episodes?
- Which output errors appear once answers require multiple dependent tool steps?
- What provider evidence could establish internal truncation/compaction behavior?
