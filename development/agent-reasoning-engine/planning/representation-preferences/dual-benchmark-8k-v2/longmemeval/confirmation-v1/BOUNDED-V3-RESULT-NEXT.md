# Bounded-v3 result and prospective next question

Generation and native evaluation completed on 2026-09-18. Evidence: [generation seal](live-bounded-v3-r1/GENERATION-SEAL.json), [isolated native evaluation](evaluator/score-bounded-v3-r1/RESULTS.json). No original run, source cohort or frozen policy is changed by this document.

| Arm | Completed / assigned | Correct / assigned | Generation tokens | Judge tokens | Total tokens |
| --- | --- | --- | --- | --- | --- |
| Compact-note control | 2 / 4 | 1 / 4 | 357,730 | 402 | 358,132 |
| Deterministic source retrieval | 4 / 4 | 4 / 4 | 11,593 | 1,127 | 12,720 |

All requests met the exact 8K input-plus-reserved-output limit. There were 98 generation calls and six judge calls, with 370,852 total known tokens and no unknown usage. The observed 96.45% token difference is descriptive only: incomplete controls prevent confirmation. Four treatment successes do not clear the full benchmark.

## Failure evidence

Ninety-two ingestion calls started; ninety completed. Completed calls used 78–350 output tokens (median 230). Two updates consumed the entire 384-token output allowance and returned HTTP 200 with `finish_reason: length`:

- `06db6396-control-ingest-12`: 4,309 input, 384 output, including 52 reasoning tokens.
- `54026fce-control-ingest-6`: 3,916 input, 384 output, including 134 reasoning tokens.

These requests were below the input window limit. Output truncation blocked their dependent control answers. Retain both failures and all prior ingestion costs. A valid HTTP response does not make a truncated memory update complete.

## Candidate hypotheses and order

This is a candidate plan, not a frozen experiment or an authority promotion.

1. Complete: independent review passed ten tests; actual receipt reconciliation passed with all costs retained. [Reconciliation](postrun-bounded-v3-r1/RECONCILIATION.json), [native observation](postrun-bounded-v3-r1/OBSERVATION.json) and [learning decision](postrun-bounded-v3-r1/LEARNING-DECISION.json) record an inconclusive comparison.
2. H-budget: a larger output allowance lets the same compact-note protocol finish ingestion reliably. H-protocol: raising the allowance does not reliably prevent truncation, or accumulated notes still lose answer evidence. The current result establishes the immediate truncation cause, not the success of either remedy.
3. Prepare an additive successor with a predeclared 768-token ingestion allowance as a candidate. Preserve question IDs, source ordering, retrieval algorithm, final-answer policy and judge. Requalify actual request sizes, including carried notes and output reserves, under 8K; do not assume the previous chunk qualification remains sufficient.
4. Independently review and register prospective native hypotheses, experiment, continuity and falsifiers. Freeze the complete generation/judge reservation and storage policy before dispatch. Do not resume or overwrite bounded-v3-r1.
5. Run the fixed paired comparison with two workers only after its gates pass. Require all eight answers and judgments, 4/4 correct treatment, no quality regression, known complete usage and at least 15% token reduction. Failed completion remains inconclusive; a valid comparison that fails quality or efficiency is counterevidence.
6. Keep ContextBench's component repair and shared-capacity supervisor as separate dependencies. Four-worker throughput and full-benchmark generalization remain unproven.

## Open Questions

Is 768 enough when reasoning and visible note text share the output allowance? Does greater note capacity improve control accuracy and how much does note carry cost? Does treatment correctness replicate on untouched tasks? The successor must answer these questions without dropping failed slots or tuning retrieval against evaluator answers.
