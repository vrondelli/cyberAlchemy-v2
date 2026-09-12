# One-shot recycle-boundary state

Status: selected successor construction; not frozen or live. Authority effect
none. Continuity is owned by `round10-continuity.json`.

## Objective hierarchy

Enduring objective: improve reusable ARE reasoning, useful continuity, recovery,
correctness, and completed outcomes while minimizing cumulative model input plus
output tokens. Local tokenizer calls, latency, and price are outside the selected
optimization cost.

Initial GLM objective: finish GLM-5.3-flash qualification, completing the small
context-window chapter before larger windows or other models.

Current milestone: clear the unchanged ContextBench acceptance contract through
frozen, evidence-led rounds. This eight-task 8K development round can select a
successor or prepare confirmation; it cannot clear the benchmark. SWE-bench
remains outside the active campaign, even when ContextBench source identities
originate from SWE datasets.

## Research method

Every round follows this exact chain:

objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor

Round nine completed all sixteen cells. Its selected fitted-state hypothesis
missed the fixed target: seven complete pairs produced state-minus-control mean
span F1 of -0.065503, while state consumed 86,838 more model tokens and caused
twelve more recycles. The decisive mechanism observation is that 89 state
presentations covered only 37 recycle generations. Fifty-two presentations
repeated within a generation and directly occupied 42,681 model-input tokens.
The common output-cap correction received zero live exposure.

Question: does presenting receipt-bound state once on the first dispatched
request of each recycled generation retain useful continuity while removing
repeated state input and recycle amplification?

- H19 (selected): one-shot recycle-boundary state preserves useful continuity
  and reaches the fixed native gain with less state-arm model-token use than
  round nine.
- H20-R10: a later receipt-bound delta representation is needed to reduce state
  further without removing new facts.
- H0-R10: deterministic process state cannot solve the remaining semantic
  evidence-selection errors.

The exact records and selection are in `hypotheses-round10.json`. Round-nine
failures, native counterevidence, token totals, output-recovery non-exposure, and
the analyzer defect remain retained in `round9-closeout.json` and its evidence.

## Method-bound DAG

| Order | Task | Depends on | Completion evidence |
| --- | --- | --- | --- |
| R10-C | Continuity gate | Reviewed round-nine closeout | Policy v2 verifies the objective hierarchy, method markers, exact source hashes, hypotheses, counterevidence, metrics, and acceptance scope. |
| R10-A | Analysis integrity | R10-C | Frozen round-nine analyzer preserved; arm-dimension repair and three regression tests retained. |
| R10-I | Boundary-state implementation | R10-A | At most one receipt-bound presentation per recycled generation, including typed incomplete-output dispatches. |
| R10-E | Controls | R10-I | Same-generation success and correction cases plus full ContextBench and coding-runtime suites. |
| R10-D | Design | R10-E | Same exposed eight tasks and sixteen cells; only state presence at the recycle boundary differs. |
| R10-P | Initial-envelope preflight | R10-D | Eight tokenizer-only envelopes, zero model calls, common policies verified. |
| R10-F | Freeze | R10-P | D03/D07/D08 bindings, exact source closure, continuity freeze review, deterministic cell order. |
| R10-R | Run | R10-F | Each frozen cell exactly once; retain and stop on a shared failure. |
| R10-S | Score | R10-R | Native metrics, validity, per-generation exposure, integrity, recycling, and every model input/output token. |
| R10-L | Learn | R10-S | Typed observation, reviewed decision, acceptance gap, and method-bound successor. |

## Fixed decision rule

Use the same eight exposed tasks at 8K, recycle at 7K, and cap each cell at
96,000 cumulative model input plus output tokens. Control receives no task-state
projection. Treatment receives the fitted receipt-bound projection only on the
first dispatched request of each new recycle generation. Source, tools, output
deferral, structured terminal submission, one incomplete-output correction,
provider, scorer, call limit, and every other policy remain common.

H19 requires state-minus-control paired macro span F1 of at least +0.05; file F1
and valid completion may not degrade. Every treatment recycle generation must
have exactly one matching presentation, every generation must have at most one,
each state must be at most 1,024 tokens with at most four fitting measurements,
and aggregate treatment model tokens must remain below round nine's fixed
396,085-token state total. False state facts, false source credit, unmatched
presentations, terminal repository effects, unknown model usage, and control
presentations must be zero. A second incomplete output or any policy mismatch is
an instrument failure.

No task, source, prompt, cap, threshold, or stopping rule may change after
freeze. Missing and failed outcomes remain in the denominator. A favorable
development result may prepare untouched confirmation under the existing
acceptance contract; it is never benchmark clearance.

## D65 construction boundary

The executing agent owns bounded implementation, verification, preflight,
freeze, live evaluation, scoring, and review. Existing repository caches,
credential reference, endpoint, and native scorer are operational prerequisites.
Publication, deployment, default activation, product approval, larger windows,
reserved confirmation, other models, and other domains remain deferred. The
research-learning ontology is the exact method dependency.

## Open questions

- Does one boundary presentation reduce the recycle cascade as predicted?
- Does the first post-recycle response carry enough state into later turns?
- Can H19 recover the task-one completion benefit without the task-two/task-three regressions?
- If H19 misses the native target, does the evidence support delta state or the semantic null?
