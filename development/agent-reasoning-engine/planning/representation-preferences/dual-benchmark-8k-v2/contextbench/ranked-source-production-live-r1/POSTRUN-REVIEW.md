# Ranked-source postrun census review R1

Approved for census integrity. Independent read-only reconstruction exactly reproduces the retained analyzer output, including all capture/receipt/projection/export joins. No provider or evaluator calls occurred.

| Task | Confirmed / exported | Union coverage | Final coverage | Selection loss | Raw hinted paths later base-read |
|---|---:|---:|---:|---:|---:|
| 1 | 93 / 93 | 7.8606% | 0.0000% | 7.8606 pp | 0 |
| 2 | 68 / 68 | 98.4984% | 97.4072% | 1.0912 pp | 0 |
| 3 | 3 / 3 | 30.3035% | 30.3035% | 0.0000 pp | 2 |
| 4 | 124 / 124 | 30.4714% | 3.8558% | 26.6157 pp | 1 |

All confirmed observations are accounted for with zero unmapped changed lines. None of the delivered unions reaches perfect reference coverage; final selection alone cannot produce perfection. Tasks1/2/4 additionally lose delivered coverage during selection.

Raw successful ranking calls are5/2/1/1, returning25/10/5/5 hints over7/6/3/4 distinct paths. The0/0/2/1 later-read counters count successful base reads of previously hinted paths in event order. They do not require hinted-range overlap or prove that the model received or acted because of a hint; previously read paths may count. These are not receipt-confirmed hint-following or causal-benefit metrics.

Twelve oversized read_file failures reproduce as1/9/1/1. Their isolated token cost is not inferred. All four assignments retain270,649 model tokens and78 calls. Exact bindings are in POSTRUN-REVIEW.json.

## Open Questions

Why are useful sources absent from confirmed delivery, and why is delivered coverage discarded during selection? Raw acquisition, confirmed delivery, semantic interpretation and causal tool benefit remain distinct. Perfect quality, matched15% total-token savings and untouched confirmation remain unmet. No further execution or cleanup is admitted.
