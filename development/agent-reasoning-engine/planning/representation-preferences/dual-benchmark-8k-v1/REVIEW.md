# Independent dual-8K review

Status: pre-live code review passed; see PREFLIGHT-REVIEW.md for the final disposition.
Authority effect: none.
This is bounded development evidence, not full benchmark qualification.

## Fixed efficiency and quality contract

Use exactly **8,000 tokens** for the admitted model input plus maximum output,
including tool/schema overhead. Report this explicitly; 8,192 is a different
ceiling. Freeze model, reasoning, sampling, output caps, source revision, cohort,
arm order, scoring, budgets and stop rules before generation.

For each benchmark separately, reduction is
`1 - sum(treatment cumulative input+output) / sum(control cumulative input+output)`.
Require at least 0.15 together with complete matched planned slots, exact usage,
unchanged quality gates, and no completion regression. Do not average per-task
percentages or pool unlike benchmarks. Show paired task costs and absolute
tokens as well as the aggregate. Repetitions do not enlarge independent task N.

All history ingestion, repeated history, memory generation, model-assisted
retrieval, reasoning output, answer/review calls and failed attempts count.
Auxiliary model judging must be separately disclosed in physical spend; any
asymmetric inference needed by an arm belongs to that arm's cost. Unknown usage
holds its full reservation and prevents an exact efficiency success claim.

ContextBench shared-prefix cost belongs to **both logical arm totals**; charge
it **once to physical spend**. Terminal-call reduction alone does not establish
15% reduction on the long task. Prior/sunk prefixes may be reused only with exact
receipts, identical matched ancestry and disclosed reuse; they remain in the
logical denominator. Never count omitted source exposure as compression without
naming a changed retrieval protocol and matching control access.

LongMemEval must preserve success and completion on all planned task/repetition
slots and report category outcomes. ContextBench must preserve its existing
selection, provenance and native-quality gates; the new 15% requirement is an
additional conjunction. An incomplete or failed cohort has no passing aggregate
treatment estimate. Failed slots remain visible; they cannot become savings.

## Selection, freeze and rejection

Select tasks deterministically from the declared development partition using
source metadata and predeclared long-history eligibility, before model outcomes.
Freeze exact IDs and any category/language quotas. Record every admission failure
and reject post-freeze replacement. Gold and scoring data never enter prompts,
retrieval indices or selection heuristics. Previously inspected confirmation
tasks are exposed evidence, not untouched holdouts. A small development run can
yield a local result only; confirmation requires a separately frozen untouched
cohort. Preserve the full ContextBench acceptance contract unchanged.

Reject clearance for manifest/source drift, unmatched histories, changed scorer,
gold exposure, unknown usage, hidden retries, missing receipts, incomplete slots,
quality/completion regression, or less than 15% cumulative saving. Keep negative
and stopped attempts with their original IDs; successor experiments get new IDs.
An instrument repair cannot retrospectively turn a stopped trial into a clean run.

## Worker and budget gates

Two workers **per benchmark** means four total; four per benchmark means eight
total. The [previous live probe](../concurrent-benchmark-v1/RESULTS.md) measured
only two total on tiny synthetic requests. It provides no evidence of four/eight
total capacity or token savings. Initial four-total dispatch is a bounded live
capacity measurement, with slowdown on rate-limit/overload and no automatic retry.

All active benchmarks and capacity probes share one physical-token ceiling.
Atomically reserve input plus maximum output across all in-flight jobs before
dispatch; unknown usage retains its reservation. Alternatively partition an
explicit global ceiling into non-overlapping immutable branch allocations.
Independent full-size branch caps are not a shared global cap.

Eight-total testing requires completed four-total evidence with exact usage,
dependency isolation, no duplicate requests, no capacity failures and sufficient
remaining budget for a frozen matched probe. Compare identical work with
counterbalanced order; record actual overlap, makespan, completion, latency and
tokens. Worker count is not quality or efficiency evidence. Do not scale an
invalid benchmark configuration to seek a passing result.

## Current empirical prerequisites

Before live benchmark dispatch, code/tests must demonstrate 8K admission, source
and freeze integrity, global reservations, scorer isolation and matched accounting.
Long-history costs must be projected using real tokenizer admission; a repeated
full-history note protocol can make 15% unreachable before quality is considered.
ContextBench needs actual runnable source/scorer bindings and complete shared-prefix
receipts. Documentation alone satisfies none of these prerequisites.

Prior [LongMemEval evidence](../benchmark-pilot-v2/execution/RESULTS.md) had worse
treatment success and approximately 2% more tokens. The
[ContextBench report](../../../../../agent-reasoning-engine/research/contextbench-v1/CONTEXTBENCH-RESEARCH-REPORT.md)
confirms a bounded 8K milestone, not full acceptance or a 15% long-task saving.
The [Round 55 accounting](../../../../../agent-reasoning-engine/research/contextbench-v1/round55-confirmation-outcome.json)
has control 586,770, treatment 583,202 and physical 598,417 tokens. Therefore
the shared prefix is 571,555 and the control terminal suffix is 15,215 tokens.
Observed whole-task reduction is only **0.608%**; even a zero-token treatment
suffix could save at most **2.593%** on those same prefixes. A terminal-only
intervention cannot reach 15% there. Test earlier repeated-history reduction,
or preserve this as an explicit failed feasibility result.
Its [acceptance contract](../../../../../agent-reasoning-engine/research/contextbench-v1/acceptance.json)
still requires 1,136 identities, 8K/10K/12K windows and two confirmation repetitions.

## Open Questions

Will the frozen intervention achieve 15% after full-history and prefix costs?
Can it preserve quality and completion? Can this account sustain four, then eight,
representative concurrent requests? The new run's receipts and results must answer
these questions; this preflight review makes no empirical success claim.

## Pre-live code review

Reviewed `pool.mjs`, `worker.mjs`, LongMemEval adapter/pair runner and the
ContextBench representation, pair runner and native orchestration copy. Executed
the initial 11 offline checks: all passed. These cover bounded retrieval, AB/BA,
tokenizer admission, actual-note retokenization, failed control isolation,
unknown-usage reservations, worker groups/resume, unchanged native delivery
reconstruction, schema constraints and compact-observation accounting.

The review found concrete integration faults: the pool precreated a directory
ContextBench refused, expected a different result filename, and consumed different
unknown-usage/provider-failure field names. The branch owners are aligning those
interfaces before live dispatch. Provider overload must reach the pool's throttle.
Freeze must bind those final sources, not intermediate test hashes.

The pool's scheduler also counts jobs waiting for a benchmark slot as active.
Interleave benchmark jobs in the frozen manifest to avoid filling all scheduler
slots with one benchmark's queued jobs. Measure actual request overlap; setting
four/eight workers alone does not demonstrate that many simultaneous requests.

The chosen ContextBench intervention now runs independent full trajectories and
compacts actual requests before native prompt capture, addressing the earlier
terminal-only feasibility limit. This changes instructions and tool metadata,
not just identifiers; resulting behavior and quality must be evaluated directly.
Exact source text/identities remain reconstructible in the offline test.

The four LongMemEval rows are already exposed oracle-adaptation development rows.
Only one original history exceeds 8K in the tokenizer preflight; report its result
separately. An all-four token reduction cannot establish long-history generality.
Neither benchmark's selected tasks are an untouched confirmation cohort.

Required before dispatch: final interface tests, source/manifest freeze, successful
real tokenizer admission, exact global/branch reservations and declared score gates.
No additional quality threshold or approval flow is introduced by this review.

Final disposition: integration faults above are resolved; 16 offline tests pass.
The final [preflight review](PREFLIGHT-REVIEW.md) supersedes the earlier pending status.
