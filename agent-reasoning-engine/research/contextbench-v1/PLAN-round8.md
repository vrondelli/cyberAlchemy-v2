# Tokenizer-fitted exact-generation state experiment

Status: selected successor construction; not frozen or live. Authority effect
none. Continuity: [round8-continuity.json](round8-continuity.json).

## Objective and gap

The enduring objective remains reusable ARE reasoning, useful continuity,
recovery, correctness, and completed outcomes within cumulative model input plus
output tokens. The initial objective remains GLM-5.3-flash qualification, small
context windows first. The current milestone remains the unchanged
[ContextBench acceptance contract](acceptance.json); SWE-bench is excluded and
reserved confirmation remains untouched.

Round seven proved the exact-generation boundary: four post-recycle model
requests received state and no speculative state measurement occurred. It also
found the next causal gap. The rolling state grew from 514 to 886 presented
tokens, then measured 1,224 tokens against the frozen 1,024-token cap. The
treatment stopped after eight successful model calls while its matched control
completed with no context selection. H13 therefore has counterevidence through
completion degradation, although semantic utility remains unmeasured.

Question: does deterministic tokenizer fitting preserve enough recent process
state to improve native evidence selection after recycling without projection-
size failures?

## Competing hypotheses

- H14: exact tokenizer fitting keeps recent state useful and prevents the
  observed state-cap completion failure.
- H15-R8: only per-generation delta facts are sufficiently token-efficient.
- H0-R8: state representation is not the limiting factor; semantic reasoning is.

H14 is selected because it repairs the exact observed boundary while preserving
H13’s verified exact-generation mechanism. The alternatives remain typed in
[hypotheses-round8.json](hypotheses-round8.json).

## Method-bound DAG

| Order | Task | Depends on | Evidence |
| --- | --- | --- | --- |
| R8-C | Continuity review | Reviewed round-seven closeout | Objective hierarchy, ontology method, counterevidence, hypotheses, fixed acceptance. |
| R8-I | Token-fit implementation | R8-C | Exact measurement and deterministic oldest-fact eviction, newest facts retained. |
| R8-E | Controls and trace replay | R8-I | Four-measurement bound, tiny-cap failure, full suites, exact round-seven failing-trace tokenizer replay. |
| R8-D | Fixed matched design | R8-E | Same eight exposed tasks and 16 matched cells; only state treatment differs. |
| R8-F | Freeze | R8-D | Initial-envelope preflight, trace replay, D03/D07/D08 bindings, source closure, freeze continuity pass. |
| R8-R | Run | R8-F | Every frozen cell retained once; no replacement, tuning, threshold change, or lucky rerun. |
| R8-S | Score | R8-R | Native scores, exposure, fitting, integrity, completion, and all model input/output tokens. |
| R8-L | Learn | R8-S | Typed observation, reviewed decision, acceptance gap, and method-bound successor. |

The required chain remains objective → gap → question → competing hypotheses →
selection → experiment/tasks/criteria → results → observations → reviewed
decision → successor.

## Fixed development decision rule

Use the same eight exposed language-stratified tasks at 8K, recycle at 7K, and
96K cumulative model-token cap per cell. Both arms use identical source access,
tools, output deferral, structured terminal submission, correction allowance,
provider profile, scorer, and task-state limits. Only the treatment presents
tokenizer-fitted exact-generation state. Pair order remains alternating.

H14 requires at least +0.05 paired macro span F1, file F1 and valid-completion
non-degradation, at least one verified treatment presentation, zero control
presentations, zero speculative measurements, every presented state at or below
1,024 tokens, at most four state-tokenizer measurements per render, zero false
facts/source credit/effects, zero unknown model usage, and every cell below 96K
model input plus output tokens. Any state-cap episode failure is counterevidence.

This development round cannot clear ContextBench. Clearance still requires all
1,136 tasks, 8K/10K/12K windows, 48K/96K/192K token tiers, two confirmation
repetitions, the fixed bootstrap lower-bound criterion, non-degradation checks,
and retained missing/error outcomes from [acceptance.json](acceptance.json).

## D65 construction boundary

Product frontier: fit exact-generation state, replay the observed overflow,
freeze the matched round, execute, score, and review. The executing agent owns
bounded construction and evaluation. Existing public repository caches,
credential reference, tokenizer endpoint, model endpoint, and scorer are
operational prerequisites. Missing source integrity, failed controls,
preflight/replay failure, provider failure, or accounting failure blocks its
affected stage. Publication, deployment, default activation, product approval,
larger windows, reserved confirmation, other models, and other domains remain
deferred residue. No ontology-runtime selector dependency is introduced; the
research-learning ontology is an exact declared method dependency.

## Open questions

- Does fitted state finish enough matched cells to permit a native comparison?
- How many facts and tokenizer calls does fitting remove in live episodes?
- If H14 completes but misses quality, does H15 delta state or H0 best explain it?
- When development evidence passes, which untouched identities form the first
  confirmation slice without changing the acceptance contract?
