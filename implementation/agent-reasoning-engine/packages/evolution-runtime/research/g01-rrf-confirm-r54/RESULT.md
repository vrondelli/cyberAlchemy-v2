# G01 r54 result

Status: completed; frozen advancement gate failed  
Claim ceiling: failed private confirmation; diagnostic mechanism evidence only

## Outcome

R54 ran 72 counterbalanced GLM rankings over 24 fresh BugsInPy exact-commit
cases from 12 repositories. All source and prediction artifacts were sealed
before the official patch labels were opened.

- Tokenizer admission: 72/72
- Generation transport: 72/72 HTTP 200, no retries
- Strict application-valid responses: 61/72
- Cases with all three valid views: 15/24
- Known usage: 164,192 prompt tokens and 3,709 completion tokens
- Provider elapsed time: 151.937 seconds

The predeclared first gate required 72/72 valid generations. It failed, so the
remaining superiority gates are not eligible to pass and r54 supports no
superiority claim.

## Diagnostic metrics

The complete-case diagnostic covers 15 cases across 10 repositories:

| Arm | MRR@8 | Hit@3 | Recall@20 |
| --- | ---: | ---: | ---: |
| ARE | 0.36619 | 0.40000 | 0.78333 |
| Chunk BM25 | 0.24841 | 0.46667 | 0.83333 |
| ARE + three-view GLM RRF | 0.73333 | 0.80000 | 0.78333 |

RRF-minus-ARE MRR@8 was `+0.36714`, with repository-bootstrap 95% interval
`[+0.16381, +0.58901]`. RRF-minus-chunk was `+0.48492`, with interval
`[+0.24479, +0.68254]`. Selection into this subset depends on response validity,
so these values are mechanism diagnostics and not the frozen 24-case estimand.

Across all 24 cases, the untouched baselines were ARE MRR@8 `0.28963` and
chunk-BM25 MRR@8 `0.20526`. All 24 labels and exact source universes validated.

## Failure diagnosis and next action

The 11 invalid responses were formatting/value-contract deviations rather than
transport failures or content refusals. Two returned a bare list. Nine used the
requested object key but included at least one value that was neither a numeric
candidate ID nor an exact candidate path. No response was repaired, retried, or
retrospectively normalized.

The next exposed cycle uses provider JSON mode, numeric IDs only, and unchanged
strict client validation. It then tests the externally researched structured
query and CodeRankEmbed retrieval channels as a predeclared ablation. A later
fresh cohort is still required for any bounded superiority claim.

## Receipts

- Packet SHA-256: `96ff293011758569e70384fab36af16a96b24a0b0e8dd4308d782cbea3e28450`
- Prediction SHA-256: `d63bf39b9876a7335510e7c3f7c692e315c52be045004cf733fe95f83445f637`
- Provider receipt-set SHA-256: `c9e9aee795b3dd2ee4c4d64e4c6b9b2642d43314c2ac3f84ca3c85eda0fd5efd`
- Evaluation: private archive
  `rrf-confirm-r54/evaluation/EVALUATION.json`

## Open questions

- Does `glm-5.3-flash` accept Z.AI JSON mode on the exact benchmark endpoint?
- Does numeric-only JSON mode reach 100% strict validity without repair?
- Does the diagnostic RRF effect replicate on a full fresh cohort after the
  response contract is hardened?
