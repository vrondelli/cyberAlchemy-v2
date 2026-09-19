# Pre-live independent review

Ready for the frozen, bounded development execution. No blocking code finding
remains in the reviewed sources; this is not a result or product approval.

All **16 offline tests pass**. The native scorer smoke and real LongMemEval
tokenizer preflight provide operational prerequisites; the reviewer made no model
calls. Exact reviewed hashes are in [PREFLIGHT-REVIEW.json](PREFLIGHT-REVIEW.json).

The review fixes now cover the pool/native directory and result interfaces,
unknown-token reservations, HTTP 429/503 capacity propagation, nonempty request
admission evidence and interleaved benchmark dispatch. Actual request intervals,
not just worker counts, gate the proposed four-to-eight total worker escalation.

Both request ceilings are exactly 8,000 input-plus-reserved-output tokens. Full
trajectories, ingestion, reasoning, failures and separately dispatched rubric
judges count toward cumulative arm costs. The fixed success rule requires all
8 planned slots per arm, exact usage, completed scoring, quality/completion
nonregression and at least 15% saving overall and on the declared long stratum.
The two-stage maximum physical model budget is 1,945,600 tokens, with each stage
bounded to 204,800 LongMemEval including judges plus 768,000 ContextBench.

The cohorts remain exposed development tasks. LongMemEval has only **one**
independent source history over 8K; repetitions are not new independent tasks.
ContextBench scores source selection, not verified repair. The same GLM family
judges LongMemEval via the pinned rubric, creating a disclosed evaluator limitation.
These experiments cannot clear full ContextBench acceptance or held-out transfer.

## Open Questions

Measured quality, completion, 15% savings and provider capacity remain unanswered.
[REVIEW.md](REVIEW.md#open-questions) owns those questions until live results exist.
