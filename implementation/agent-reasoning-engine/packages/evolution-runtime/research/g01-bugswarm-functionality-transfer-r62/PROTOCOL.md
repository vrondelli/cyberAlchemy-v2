# G01 r62 — BugSwarm Python cross-dataset development transfer

Status: prospective protocol; freeze before any r62 GLM call or score.  
Population: the 17 Python repositories in the already exposed, authenticated
BugSwarm selective-r28/r34 cohort. These cases have prior label exposure in
another campaign: this is **development transfer**, not fresh confirmation.

## Bound inputs and unchanged mechanism

Use the exact failed-commit `.py` source projections from r36, authenticated
failure queries from r37, and complete ARE rankings from r38. All identities,
source roots, queries, and source file universes are pinned by SHA-256 before
new calls. Do not inspect the prior r40 evaluator labels until all r62 source
rankings are sealed.

The functionality summary prompt and validity rule are copied unchanged from
r57: one plain-text sentence about expected failing-test functionality,
20–400 characters after whitespace collapse, no Markdown fence, normal
provider stop. Invalid summaries fall back to the authenticated raw query.
Use `glm-5.3-flash`, at most 17 tokenizer admissions and 17 generation calls,
192 output tokens, at most 8,192 input-plus-output tokens per case, at most
40,000 aggregate admitted prompt tokens, zero automatic retries. Retain all
private provider payloads and usage receipts. No file, label, or fix path may
be supplied in the prompt beyond what already occurs in the authenticated
failure excerpt.

Reproduce r61's source ranking rule without tuning:

1. Full-repository 120-line chunk BM25 over exactly the ARE-ranked source
   universe, with path and chunk text fields, under both raw and functionality
   queries. Use the same pinned BM25 implementation as r60.
2. A is unweighted `RRF(k=60)` of complete ARE and raw-BM25 rankings.
3. Candidate C is the first-occurrence union of ARE top 10, raw-BM25 top 10,
   and functionality-BM25 top 10, capped at 30.
4. Complete the functionality-BM25 top-30 order with A's unseen remainder.
   Rank only C by unweighted three-channel `RRF(k=60)` of complete ARE,
   raw-BM25, and completed functionality-BM25. Append non-C paths in A order.

No per-case model selection, score-tuned weight, added guard, or post-hoc
fallback is allowed. Missing source, invalid case identity, or failed
provider admission is recorded as a protocol failure, not silently excluded.

## Frozen development gate and claim ceiling

Evaluate all 17 cases on direct Git-tree file labels from the prior r40
evaluator, using MRR@8, Hit@3, recall@20, and 100,000 deterministic
repository-bootstrap draws. Advance only if all 17 source rankings and
provider attempts have receipts, at least 15 summaries are valid, treatment
MRR@8 exceeds A by at least `+0.05`, the paired 95% lower bound is positive,
Hit@3 and recall@20 do not fall, and at least 10 of 17 repositories improve.
Report provider tokens and elapsed time. A pass supports a separate unopened
BugSwarm cohort; it cannot establish superiority because these 17 are exposed.

## Open questions

- Does the r61 lexical mechanism transfer from BugsInPy to authenticated
  BugSwarm Python failures under the unchanged rule?
- If it does, can a wholly unopened, repository-disjoint 24-case cohort be
  admitted without availability-driven outcome selection?
