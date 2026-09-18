# Concurrent benchmark review

Status: independent prospective review; candidate evidence; authority effect none.

The [previous pilot](../benchmark-pilot-v2/execution/RESULTS.md) supports a throughput
experiment, not a claim that running more agents improves ARE memory quality.
LongMemEval treatment achieved 3/8 successes versus 6/8 control, selectivity tied
semantically at higher token use, and PersonaMem had no admissible quality run.
The [workflow](research-workflow.json) preserves this distinction and the separate
ContextBench qualification frontier.

## Requirements for the implementation

- Independent pairs may overlap. Within a pair, preserve declared AB/BA arm order
  and sequential note dependencies. Record dispatch and completion times rather
  than assuming array order establishes execution order.
- Reserve worst-case input and output tokens atomically before each provider call.
  Count all attempts, failed generations and extraction/scoring calls. Unknown
  usage retains its reservation; it must not become zero actual usage.
- Persist a started attempt before dispatch. A started attempt without a terminal
  receipt is uncertain after restart and cannot be automatically dispatched again.
  Resume only work proved never started or explicitly authorized by an amendment.
- Keep each task, arm, repetition and experiment's memory separate. Hash the frozen
  settings, source selection, adapter and evaluator; reject stale resumes.
- Reduce concurrency on rate or overload errors without concealing failures or
  re-running failed answers. Admission failure and model failure are different
  outcomes. No unverified assumption about the account's concurrency limit.
- Automated reports retain fixed planned denominators, blocked dependencies,
  errors, missing usage, reservations and actual totals separately. Do not pool
  incomparable quality scores or treat repeated tasks as independent examples.
- Verify crash/restart, budget races, concurrent ownership, independent progress,
  dependency failure, unknown usage and deterministic report reconstruction with
  meaningful tests. Prove actual overlap in a bounded live canary before claiming
  live concurrency. Compare serial/concurrent throughput using equivalent work;
  a single concurrent run establishes function, not measured speedup.
- Keep held-out answers out of hypothesis and implementation workers. Freeze the
  selected candidate before held-out evaluation. Infrastructure canaries do not
  reopen completed pilot results or qualify GLM, ContextBench or release.

## Research integration

Candidate hypotheses and prospective experiments are D01/D03 inputs. Only actual
results support D02 observations and reviewed D04 decisions. Use the existing
native D07 graph and D08 work APIs with source-verifying registrations; a JSON DAG
alone does not establish native integration. Retrospective registration must say
so. This review and its workflow do not invent admitted ontology records.

The coordinator selects one bounded next experiment after parallel helpers join.
Hypothesis helpers cannot launch model evaluations or change frozen rubrics. The
implementation helper cannot judge its own ambiguous outputs. A reviewed negative
or blocked result is a legitimate close condition; success is not forced by retries.

## Initial code findings

The first scheduler revision released its ownership lock from `finally` even when
a persistence error could leave provider calls active. The core owner was asked
to drain active work or retain the lock on exceptional exit and test this case.
The first memory adapter also represented AB/BA ordering as a successful-result
dependency, causing one failed arm to block independent later arms. Ordering must
wait for a terminal state; note dependencies must require successful output.
These findings require verification against the final implementation before live
execution or completion, and this section is a historical finding, not a claim
that either defect remains in a later revision.

Pre-live source verification: both implementation defects are corrected. The
scheduler drains active effects before releasing ownership, and `after` ordering
edges release on terminal outcomes independently from successful note dependencies.
The corresponding regression tests and adapter integration test passed. A combined
run exposed a timing-dependent overlap test that assumed a 10 ms delay exceeded
filesystem scheduling latency; the core owner was asked to use a deterministic
worker barrier before recording the final suite result. No provider call was made
by this reviewer. Final live results still require independent claim review.

## Open questions

What concurrency does this account admit without overload? Does increased overlap
reduce end-to-end time enough to matter after tokenization and review? Which
quality hypothesis survives source-level failure analysis? The workflow records
those questions separately; none is answered by a scheduler unit test.
