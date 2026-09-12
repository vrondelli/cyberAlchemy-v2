# Complete one-shot boundary-state replication

Status: selected successor construction; not frozen or live. Authority effect
none. Continuity is owned by `round11-continuity.json`.

## Objective hierarchy

Enduring objective: improve reusable ARE reasoning, useful continuity, recovery,
correctness, and completed outcomes while minimizing cumulative model input plus
output tokens. Local processing, tokenizer calls, latency, and price are outside
the selected optimization cost.

Initial GLM objective: finish GLM-5.3-flash qualification, completing the small
context-window chapter before larger windows or other models.

Current milestone: clear the unchanged ContextBench acceptance contract through
frozen, evidence-led rounds. This exposed eight-task 8K replication can resolve
the current hypothesis and prepare untouched confirmation; it cannot clear the
benchmark. SWE-bench remains outside the active campaign even when source task
identities originate from SWE datasets.

## Research method

Every round follows this exact chain:

objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor

Round ten verified the intended mechanism: its 27 state presentations mapped
one-to-one onto 27 recycled generations, with no repeated same-generation state.
Three complete pairs had descriptive mean state-minus-control span F1 of
+0.228794, and attempted state arms used 57,576 fewer known model tokens. The
matrix is not decision eligible because a GLM request exceeded the common
120-second deadline: thirteen cells were attempted, three remained unstarted,
only three pairs completed, and one dispatched request has unknown usage.

Gap: the promising one-shot result remains censored by an avoidable provider
deadline, so neither H19 support nor the semantic null is established.

Question: does the one-shot boundary-state signal replicate over all eight
GLM-5.3-flash 8K pairs when both arms use a common five-minute model deadline?

- H21-R11 (selected): one state presentation per recycled generation yields the
  fixed native gain and lower cumulative model tokens over a complete matrix.
- H20-R11: delta-only boundary state is needed to reduce token input further.
- H0-R11: process state cannot reliably improve native evidence selection because
  semantic interpretation is the limiting factor.

The exact records and selection are in `hypotheses-round11.json`. Round-ten
attempts, missing cells, unknown usage, within-task validity conflict, and all
earlier counterevidence remain retained by `round10-closeout.json` and its refs.

## Method-bound DAG

| Order | Task | Depends on | Completion evidence |
| --- | --- | --- | --- |
| R11-C | Continuity gate | Reviewed round-ten closeout | Policy v2 verifies the hierarchy, method, predecessor, counterevidence, hypotheses, scope, and acceptance. |
| R11-I | Provider-deadline repair | R11-C | Five-minute ceiling is admitted only for ContextBench profiles and is common to both arms. |
| R11-T | Runtime verification | R11-I | ContextBench and coding-runtime suites pass; exact round-ten runtime remains preserved. |
| R11-D | Replication design | R11-T | Same exposed eight tasks and sixteen cells; arm order is reversed within every pair; state presentation is the sole paired difference. |
| R11-P | Initial-envelope preflight | R11-D | Eight tokenizer-only envelopes, zero model calls, common 300,000 ms deadline, caps, and one-shot policy verified. |
| R11-F | Freeze | R11-P | D03/D07/D08 bindings, exact source closure, continuity freeze review, and deterministic order. |
| R11-R | Run | R11-F | Each newly versioned frozen cell exactly once; retain and pause on shared failure. |
| R11-S | Score | R11-R | Native metrics, validity, per-generation exposure, integrity, recycling, and every known or unknown model token receipt. |
| R11-L | Learn | R11-S | Typed observation, reviewed H21 decision, acceptance gap, and method-bound successor. |

## Fixed decision rule

Use the same eight exposed tasks at 8K, recycle at 7K, and cap each cell at
96,000 cumulative model input plus output tokens. Control receives no task state.
Treatment receives one fitted receipt-bound state on the first dispatched request
of each new recycle generation. Both arms use the same source, tools, prompt,
output deferral, terminal submission, one incomplete-output correction, provider,
scorer, call limit, and 300,000 ms model deadline. Deadline duration is not an
optimization metric and never excuses unknown token usage.

H21 requires all eight scheduled pairs and state-minus-control paired macro span
F1 of at least +0.05. Scheduled zero-filled file F1 and aggregate valid completion
may not degrade. Every treatment recycle generation must have exactly one matching
presentation, every generation at most one, each state at most 1,024 tokens and
four fitting measurements, and aggregate treatment model tokens below round
nine's fixed 396,085-token state total. False state facts, false source credit,
unmatched presentations, generation mismatches, terminal repository effects,
unknown model usage, and control presentations must be zero.

No task, source, prompt, cap, threshold, state mechanism, or stopping rule may
change after freeze. Round-ten attempts are historical evidence, not substitute
runs. Missing and failed outcomes remain in the denominator. A favorable result
may prepare untouched confirmation under the existing acceptance contract; it
does not clear ContextBench.

## D65 construction boundary

The executing agent owns bounded implementation, tests, preflight, freeze, live
evaluation, scoring, and review. Existing repository caches, credential reference,
endpoint, and native scorer are operational prerequisites. Publication,
deployment, default activation, product approval, larger windows, reserved
confirmation, other models, and other domains remain deferred. The
research-learning ontology is the exact method dependency.

## Open questions

- Does the favorable partial span signal survive all eight pairs?
- Does one-shot state reduce tokens once both arms have complete exposure?
- Why did state restore validity for task three but lose validity for task four?
- If H21 misses, do task-level traces support delta state or the semantic null?
