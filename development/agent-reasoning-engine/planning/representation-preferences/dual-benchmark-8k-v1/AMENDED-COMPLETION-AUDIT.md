# Amended experiment completion audit

The requested bounded execution is complete. The common 15% objective is **not**
achieved for both benchmarks: LongMemEval passes the declared development criteria;
ContextBench saves 9.41%, with only four valid treatment selections out of eight.

| Native work task | Required evidence and disposition |
| --- | --- |
| AF | AMENDMENT-FREEZE.json binds unchanged original sources, the zero-exposure failure, exact cache repair and additive evaluator/runner code. |
| FX | The supplemental CB4 pair completed with 161,663 known tokens and no unknown calls. Its original zero-call failure remains preserved. |
| AG | AMENDED-SCALING-ADMISSION.json passed unchanged health requirements; no quality outcome selected scaling. |
| AS2 | All eight second-stage scheduler jobs are terminal. CAPACITY-RESULTS.json proves four overlapping requests per benchmark, eight total. |
| AJ | Native ContextBench scoring, 16 separate LongMemEval judge calls and AMENDED-POSTRUN-AUDIT.json reconcile all fixed slots and 1,292,617 known tokens. |
| AD | AMENDED-FINAL-REVIEW.json owns independent review. Amended native D02/D04 records retain positive LongMemEval evidence and negative ContextBench acceptance evidence. |

All source freezes remain in force. Original and amended result sets are separate.
No failed model answer was retried outside the two declared repetitions. The only
supplement covered a proved zero-model-exposure prerequisite failure. There were
no unknown usage calls, no generation rate-limit/overload responses, and no request
window violations. The treatment's output-cap failure remains a counted outcome.

LongMemEval: 75,384 → 23,912 tokens, 5/8 → 7/8 correct, 8/8 answers per arm.
Its single long-history identity improved 1/2 → 2/2 correct and saved 77.29%.
ContextBench: 626,119 → 567,202 tokens, 3/8 → 4/8 valid selections, and
3.66% → 16.07% macro Span-F1. Quality nonregression does not waive the 15% or
full-completion requirements.

The work-state replay records completed evidence dispositions. It does not assert
that the rejected ContextBench hypothesis succeeded, that four exposed tasks are
a population benchmark, or that the candidate is admitted to production.

## Open Questions

[NEXT-ROUND-DAG.md](NEXT-ROUND-DAG.md) owns the successor hypotheses, outstanding
ContextBench target, untouched LongMemEval confirmation, worker-slot scheduling
fix and broader transfer questions. Storage cleanup must preserve the scored,
reconstructable evidence and use the existing completed-cell lifecycle checks.
