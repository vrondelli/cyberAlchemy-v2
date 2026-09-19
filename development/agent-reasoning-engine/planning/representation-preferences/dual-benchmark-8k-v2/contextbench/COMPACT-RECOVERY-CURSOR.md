# Compact recovery cursor candidate

The first actual-tokenizer study is terminal and inconclusive: 12/97 pairs completed, with 35 successful tokenizer responses and one interrupted attempt whose token count is unknown. It made no model-generation calls. All 97 slots and failed attempt evidence remain in `recovery-tokenizer-r1/`. Partial input differences are not an accepted savings result.

[Recorded-measurement diagnosis](RECOVERY-PAGE-FIT-R1.json) identifies a concrete representation failure. The first populated snapshot in one history had eight observations. Its full page measured 306 tokens. Reducing the number of entries introduced a 244-character cursor. Even the one-entry page measured 295 tokens, exceeding the unchanged 256-token limit. No allowed page could make progress. These counts come from actual retained tokenizer receipts; the diagnosis made no provider calls.

The additive `recovery-index-compact.mjs` changes the cursor encoding to decimal offset plus a 43-character base64url SHA-256 digest of version, snapshot fingerprint and offset. It preserves the full digest rather than truncating it. For a one-digit offset the cursor is 45 characters. Snapshot validation, canonical encoding, offset range, page integrity, exact observation identities, immutable paging and recovery membership remain enforced. This is an integrity checksum, not authenticated authorization. A new page-format version rejects old cursors; frozen predecessors remain unchanged.

Seven synthetic tests pass, including full 37-read traversal, stale and altered cursors, noncanonical offsets, source mutation, page tampering, tiny budgets, failed delivery exclusion and exact source-identity deduplication. The initial test run failed because its expected error pattern excluded the legitimate stale-cursor rejection; the corrected assertion accepts the intended cursor rejection class. No provider-token fit or scientific improvement is established for this candidate yet.

Next: independent index review → additive freshness/demand/measurement integration → prospective amended records and exact source freeze → a fresh tokenizer stage over all 97 boundaries. Keep the same 256-token page limit, cohort, two workers, no retries, complete accounting and inconclusive-on-infrastructure-failure rule. Do not resume or overwrite the failed R1 run. Compact final evidence persistence and live full-trajectory evaluation remain separate prerequisites for perfect benchmark quality and 15% cumulative-token savings.

## Open questions

Does the compact cursor fit the actual tokenizer on every page? Can very long source paths still prevent a one-entry page from fitting? Does lower catalog overhead translate into complete-trajectory savings while preserving perfect quality? These require prospective measurement and full model runs, not byte-based estimates.
