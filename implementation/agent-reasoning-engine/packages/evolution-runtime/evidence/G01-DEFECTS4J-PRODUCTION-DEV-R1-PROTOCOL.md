# G01 production-aware Defects4J development reader protocol

Status: frozen before these development requests, 2026-10-06. All 32 cases
are the already-exposed r2 cohort. This is not prospective confirmation.

Hypothesis: using the complete Java ARE ranking to select its first ten
production-source paths reduces test-caller crowding while preserving a
bounded reranking list. Use exactly the previously sealed
`PRODUCTION-CANDIDATE-SCREEN.json` (SHA-256
`0939bf688ef13cb9133c92f1b64f4846f3ecb5f8da7ce9faf03749725c54dc04`).
Union that top ten with original adapted RepoMap top ten and stack locator
top eight, sorted lexically and deduplicated. Do not use modified classes to
choose candidates or excerpts. Candidate universe remains all tracked Java
at the exact buggy commit. Excerpts retain the r2 20,000-character source
projection, 20-line windows at ten-line strides, query-token-overlap selection,
earliest-window ties, and 600-character excerpt cap. Prompt and decoder are
unchanged from r2. No label-specific instructions or paths are injected.

Run GLM-5.3-flash on the VPS, one request per case, 512 output tokens,
low reasoning effort, zero retries. Same-account tokenizer admission must
leave that output reserve within 8,192 tokens. Preserve all response receipts;
reject invalid IDs as empty rankings, and do not regenerate terminal runs.
Gold was already exposed, so every receipt must say development/exposed.

After sealing predictions, use the same r2 modified-class-to-path mapping,
MRR@8, Hit@3, Recall@8, and equal-project sign-flip calculations. Comparators
are production-filtered ARE top20, original adapted RepoMap top20, stack
locator, and rank fusion k=60 over the same candidate union. Reuse r2 numeric
quality thresholds only as a development advancement screen: mean MRR delta
at least .10 over each comparator, p<=.05 versus RepoMap and fusion, Hit@3
at least 24/32 and six above the strongest comparator, with complete label
mapping. Passing cannot retroactively change r2 or establish superiority.

Report tokenizer/generation calls, tokens and elapsed time, and compare
the original r2 scores descriptively. A quality gain establishes no cost win.
Before fresh confirmation, freeze the final policy and appropriately stronger
matched baselines; retain public-data exposure, same-project transfer, and
adapted file-text RepoMap limitations. Live ARE integration is separate.

## Open Questions

- Does GLM realize the seven newly reachable cases as top-three successes?
- Do stronger production-aware and symbol-bearing baselines erase the gain?
- Will a frozen policy generalize to fresh cases and a live ARE episode?
