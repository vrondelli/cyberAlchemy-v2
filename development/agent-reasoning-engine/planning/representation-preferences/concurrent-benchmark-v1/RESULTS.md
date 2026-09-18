# Concurrent GLM worker result

The scheduler is implemented and the first live probe passed. Four identical
synthetic tasks took **19.811 seconds serially** and **10.690 seconds with two
workers**: 46.0% less elapsed time, or 1.85 times the observed throughput.
Provider attempt intervals show two overlapping model requests.

| Condition | Completed / planned | Exact output correct | Model tokens | Elapsed |
| --- | --- | --- | --- | --- |
| One worker | 4 / 4 | 4 / 4 | 108 | 19.811 s |
| Two workers | 4 / 4 | 4 / 4 | 118 | 10.690 s |

All calls used `glm-5.3-flash`, enabled low reasoning, temperature zero and the same
prompt and output cap. There were no failed calls or unknown model token usage.
Actual combined usage was **226 tokens**, below the 4,096-token reservation.
The parallel condition used ten more tokens because generated reasoning lengths
can vary; concurrency does not promise token reduction.

This is one serial-then-parallel synthetic probe. Service timing and order can
affect the comparison. It proves the worker path executes concurrently here; it
does not establish a general 1.85x speedup, better memory quality, ContextBench
completion, GLM qualification, or production release readiness.

## What is implemented

- Concurrent dependency queue with one shared token budget and isolated job state.
- Sequential note dependencies plus independent control/treatment ordering.
- Atomic checkpoints, source/manifest binding, exclusive ownership, safe resume,
  failure isolation and conservative unknown-usage reservations.
- Rate-limit/overload reduction without hidden retries.
- GLM tokenizer admission and a LongMemEval complete-history adapter.
- Automatic per-run reports and independently reconstructed probe results.
- Three parallel implementation/review workers, bounded research-helper roles,
  candidate hypotheses, and native research records preserving the original goals.

The actual LongMemEval adapter is tested with controlled providers; this live probe
does not rerun or revise the prior negative quality experiment. Research helpers
remain coordinator-dispatched; this change does not create an autonomous service
that launches arbitrary Codex or GLM agents.

## Evidence and reproduction

[Plan and DAG](PLAN.md), [test receipt](TEST-RESULTS.json),
[machine results](RESULTS.json), [freeze](freeze.json),
[pre-live review](PREFLIGHT-REVIEW.md), [research workflow](research-workflow.json),
[hypotheses](hypotheses.json), [observations and decision](observations.json),
[native research DAG](research-dag.json), [work plan](research-work-plan.json),
[completed work replay](research-work-state.json),
[independent final review](FINAL-REVIEW.md), and [completion audit](COMPLETION-AUDIT.md).

From the repository root, reproduce evidence without any provider calls:

```sh
node development/agent-reasoning-engine/planning/representation-preferences/concurrent-benchmark-v1/probe.mjs check
node development/agent-reasoning-engine/planning/representation-preferences/concurrent-benchmark-v1/research.mjs --results --check
```

For future runs, use the [scheduler guide](../../../../../implementation/agent-reasoning-engine/packages/benchmark-scheduler/README.md).
Keep each experiment's own manifest and directory; do not delete old results to
reuse an ID or bypass a failed trial. The probe's `prepare` command refuses to
overwrite its frozen manifests.

## Open questions and next work

Keep concurrency at two until a counterbalanced, representative workload confirms
its benefit. Four-worker scaling requires its own bounded probe. The next quality
experiments should separately test exact evidence recovery and current-request
precedence, with reviewed hypotheses and untouched confirmation data. More
workers accelerate those tests; they do not resolve the prior quality failures.
