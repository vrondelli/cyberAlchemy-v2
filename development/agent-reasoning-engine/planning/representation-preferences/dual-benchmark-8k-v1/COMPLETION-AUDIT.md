# Original protocol completion audit

This audit closes the **original protocol disposition**, not the 15% objective.
The separately frozen [amendment](AMENDMENT.md) preserves these records and owns
the repaired task's first exposure and conditional second stage.

The first stage finished all eight scheduler jobs. A completed scheduler job can
contain failed benchmark outcomes. Original generation used 483,193 tokens and
the LongMemEval judge used 2,428, for **485,621 known model tokens**. There is no
unknown usage. [The raw audit](POSTRUN-AUDIT.json) reconciles those receipts.

| DAG task | Evidence and disposition |
| --- | --- |
| P | PLAN.md and implementation-dag.json freeze the objective, method and 15% rule. |
| L | TEST-RESULTS.json and measured LongMemEval preflight establish adapter admission. |
| C | Native source/scorer preflight and tests passed; the later CB4 clone failure remains counterevidence to preflight completeness. |
| Q | Pool tests, reservations and receipts establish bounded model spending and concurrency. |
| F | PREFLIGHT-REVIEW.json and freeze.json bind the reviewed implementation; frozen sources remain unchanged. |
| S1 | RESULTS.json records terminal jobs, known usage, fixed denominators and all failures. |
| G | SCALING-ADMISSION.json rejects original scaling solely because CB4 had zero exposure in both arms. |
| S2 | No original second stage was dispatched. The explicit non-admission is its disposition, not a successful run. |
| J | Native scoring, separate blinded judging and POSTRUN-AUDIT.json account for outcomes and costs. |
| D | FINAL-REVIEW.json owns independent review. Native observations and decisions preserve the incomplete original comparison. |

LongMemEval's executed first pass achieved 3/4 correct control and 4/4 treatment,
with 67.82% fewer tokens including judges. It cannot satisfy the original two-pass
criterion by itself. ContextBench produced one valid selection per arm; its 21.60%
apparent token saving includes failed early termination. Neither original branch
established the complete preregistered success criterion.

The CB4 checkout failed before any model dispatch. Its original zero-cost failure
is preserved. The amendment is a prospective infrastructure exception, not a retry
of an unfavorable model answer or a replacement task.

## Open Questions

The amended results own whether four workers per benchmark are sustained and
whether either candidate meets the full development criteria. Generalization to
untouched long histories, other models and the full benchmarks remains unproved.
