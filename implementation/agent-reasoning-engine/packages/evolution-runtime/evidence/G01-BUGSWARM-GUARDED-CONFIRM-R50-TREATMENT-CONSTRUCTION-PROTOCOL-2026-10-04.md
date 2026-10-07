# G01 BugSwarm guarded confirmation r50 — treatment construction protocol

Status: frozen gold-blind construction protocol for the untouched 24-case
confirmation cohort.

## Objective

Apply the already-fixed r44 treatment without tuning:

1. construct each failure query using the byte-pinned r37/r2 query rule;
2. rank the exact failed-source corpus using the byte-pinned BM25 source ranker;
3. apply the byte-pinned graph-r2 reranker to the complete BM25 candidate set;
4. build entity cards with the byte-pinned r43 rule over the first 30 graph
   candidates;
5. present the same one-shot prompt and later preserve the first four graph
   candidates as the fixed guard prefix.

Frozen inputs include the r46 cross-validated logs, r48 code projections, r49
eligibility result, BugSwarm failure-side metadata, and the exact historical
query, BM25, graph, and entity-card rule source bytes. Gold paths from r49 are
not an input to construction and must not be opened by these scripts.

No rule, weight, candidate cap, prompt wording, prefix length, output cap, model,
or reasoning effort may change. Construction is local and makes no provider
call. Any identity, coverage, size, or hash mismatch is terminal.

## Fixed live-run contract

- model: `glm-5.3-flash`;
- one tokenizer call and one generation call per case;
- no retry;
- at most 512 output tokens;
- low reasoning effort;
- tokenizer admission requires prompt plus reserve at most 8,192 tokens and
  summed prompts at most 240,000 tokens;
- stop on the first invalid transport/admission boundary.

## Evaluation contract

Seal predictions before evaluator-only labels are opened. Report graph-prior,
raw-model, and guarded-prefix-4 MRR@8, Hit@1, Hit@3, and reach@30. The primary
paired estimand is guarded minus graph MRR@8 with a deterministic exact-seed
bootstrap 95% interval. No superiority claim is allowed unless the separately
frozen claim gate is met.

## Open Questions

- Do all prompts pass the 8K tokenizer boundary?
- Does the guarded paired interval remain above zero on untouched cases?
- Is any observed improvement large and stable enough for a bounded replicated
  superiority claim?
