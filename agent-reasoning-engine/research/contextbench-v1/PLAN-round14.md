# Complete evidence-only exposure after bounded tokenizer repair

Status: selected successor construction; not frozen or live. Authority effect
none. Continuity is owned by `round14-continuity.json` under policy v3.

## Objective hierarchy

Enduring objective: improve reusable ARE reasoning, useful continuity, recovery,
correctness, and completed outcomes while minimizing cumulative model input plus
output tokens.

Initial GLM objective: finish GLM-5.3-flash qualification, completing the 8K
small context-window chapter before larger windows or other models.

Current milestone: clear the unchanged ContextBench acceptance contract through
frozen evidence-led rounds. This exposed development replication cannot itself
clear the benchmark. SWE-bench remains outside the active campaign.

## Research method

objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor

Round 13 tested evidence-only state but stopped after seven cells. A dispatched
stateless tokenizer request received zero response bytes after five fully
accounted model calls in cell 4 control. Nine cells remained unstarted. Only one
pair completed and favored state by +0.097256 span F1. Task 1 state lost
completion to control; task 3 state returned an invalid final while control
scored zero. These partial effects remain descriptive and H23 remains unresolved.

Gap: a transient stateless tokenizer transport failure can censor a frozen matrix
even though it creates no model-token ambiguity. The model endpoint must remain
single-attempt.

Question: does one same-digest tokenizer-only transport retry permit complete
exposure of the unchanged evidence-only hypothesis without adding model input or
output tokens?

- H24-R14 (selected): retry once only after tokenizer `request-failed` with zero
  response bytes, retaining both physical-attempt receipts.
- H20-R14: delta state is needed for lower token use.
- H0-R14: deterministic state cannot overcome semantic interpretation limits.

All hypotheses carry the enduring objective, initial GLM objective, current
milestone, exact method chain, reviewed predecessor, and retained counterevidence.

## Method-bound DAG

| Order | Task | Depends on | Completion evidence |
| --- | --- | --- | --- |
| R14-C | Continuity gate | Round 13 closeout | Policy v3 validates objective hierarchy, method, predecessor, counterevidence, scope and acceptance. |
| R14-I | Tokenizer retry | R14-C | One same-digest retry only for zero-response `request-failed`; both attempts recorded; no model retry. |
| R14-T | Verification | R14-I | Retry exclusions and full regression suites pass with zero model calls. |
| R14-D | Replication design | R14-T | Same cohort and H23 mechanism; common tokenizer-attempt policy is the only instrument change. |
| R14-P | Preflight | R14-D | Eight tokenizer-only envelopes and retry policy verified with zero model calls. |
| R14-F | Freeze | R14-P | Exact sources, v3 continuity, criteria and order frozen. |
| R14-R | Run | R14-F | Each new cell once; pause on shared failure. |
| R14-S | Score | R14-R | Native, validity, exposure, integrity and every model input/output token. |
| R14-L | Learn | R14-S | Reviewed H24/H23 result and v3-bound successor. |

## Fixed decision rule

Use the same eight tasks, 8K context, 7K recycle boundary, 96,000 cumulative
model-token cap, prompts, tools, scorer, state mechanism, 300,000 ms model
deadline, and paired rules as Round 13. Both arms allow at most two physical
attempts for the same tokenizer request only when the first ends as
`request-failed` with zero response bytes. Both attempts are recorded. No model
request is retried. HTTP responses, timeouts, malformed tokenizer data,
credential failures, and ambiguous failures are not retried.

H24 requires no shared instrument stop and zero unknown model usage. H23 still
requires eight complete pairs, paired span F1 at least +0.05, file and valid-
completion non-degradation, aggregate state model tokens below 352,655, exact
one-shot evidence-only exposure, zero outcome leakage, zero false facts/source
credit/effects, and all prior caps. No within-round change or lucky rerun.

## Open questions

- Does the tokenizer-only retry remove the observed censoring mode?
- Does H23 retain its task-2 benefit across a complete matrix?
- Do completion losses persist without outcome chronology?
- If H23 misses, do reviewed traces select delta state or the semantic null?
