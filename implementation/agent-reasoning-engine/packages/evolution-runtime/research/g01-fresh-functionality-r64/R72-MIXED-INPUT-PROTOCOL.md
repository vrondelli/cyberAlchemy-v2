# G01 r72 — fresh, mixed-input BugSwarm transfer

Status: frozen before r72 query projection, source ranking, provider calls, or
score. Private research only. The 24 repositories and order are the sealed r67
source cohort; do not replace a case after seeing a score.

## Inputs and separation

Read only the r67 gold-free cohort, failure-side BugSwarm metadata, r68/r70
log receipts and admitted complete failure logs, and exact failed-commit
archives. Never read passing archives or r67 evaluator paths in source-side
work. Logs are admissible only when receipt `admitted=true`, identity matches,
and bytes and SHA-256 recheck. For 19 r68 cases use r68; for ordinal 10 use
the r70 complete log. For ordinals 1, 12, 22, and 23, use only the first 256
UTF-8 bytes of failure-side failed-test names. Never use truncated log bytes.

The query projection inherits r37: normalize `#` in test names to newline;
strip ANSI from complete logs; append their UTF-8 suffix within a 1,024-byte
query cap; redact the same sensitive-token pattern. Metadata-only queries
contain the test-name heading and no synthetic log tail. Both benchmark arms
and the functionality prompt receive exactly this same sealed query. Preserve
query text and hashes privately, not on a public product page.

Use the r62 functionality prompt, GLM `glm-5.3-flash`, stop and 20–400-character
validity rules. Tokenizer before generation: at most 24 calls each, 192 output
tokens, 8,192 total per prompt, 60,000 aggregate admitted prompt tokens, zero
automatic retries. Invalid summaries fall back to raw query; any failed
tokenizer admission is a failed run. Store private provider payloads and usage.

Source ranking is the unchanged r61/r62 rule over the exact failed-commit
Python source universe: full-repository 120-line chunk BM25, ARE complete
ranking, raw BM25 and functionality BM25; baseline two-channel RRF(k=60);
candidate first-occurrence union of three top-10 lists capped at 30;
treatment three-channel RRF(k=60) within that candidate set, baseline order
outside it. No score-based tuning, per-case adaptation, exclusion, or
post-hoc fallback. Seal all source rankings before evaluator paths are opened.

## Evaluation and claim ceiling

Evaluate the 24 sealed rankings against r67 direct-Git-blob changed old-side
Python source paths. Metrics: MRR@8, Hit@3, recall@20, paired repository-level
bootstrap (100,000 draws, fixed seed), and wins/ties/losses. Report complete
log (20) and metadata-only (4) strata separately. A bounded pass requires
24/24 valid case receipts and at least 22 valid functionality summaries,
MRR@8 uplift >= +0.05, positive paired bootstrap 95% lower bound, no decline
in Hit@3 or recall@20, and >= 14 repository wins. These gates are prospective
and not a license to omit failed cases. This is a source-order, label-shape-
selected, mixed-input BugSwarm Python cohort. Even a pass supports only that
bounded result, not general ARE product superiority or ContextBench-wide
superiority. A public claim additionally requires independent reviewer
approval of exact text and caveats.

## Open questions

- Does the fixed mechanism pass on this fresh population and each input stratum?
- Can a further external dataset and stronger comparators support a broader
  superiority claim without tuning against this cohort?
