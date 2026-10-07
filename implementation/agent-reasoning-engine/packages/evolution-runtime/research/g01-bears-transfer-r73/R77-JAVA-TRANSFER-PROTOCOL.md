# G01 r77 — fresh Bears Java functionality transfer

Status: prospective, private. Freeze before queries, source ranking, GLM
requests, or evaluation. Population is the exact 24 source-order Bears cases
in r76's gold-free `SOURCE-COHORT.json`; all had existing old-side `.java`
patch paths in the independently sealed r76 evaluator. They are unique
repositories and disjoint from the prior 246 BugSwarm occupancies, the
BugsInPy development repositories, and exposed ARB v2 trace2code projects.
Selection was conditioned on active status, source availability/caps, and
old-side Java label shape, not on any performance outcome. Do not replace a
case after a ranking or score is seen.

## Fixed inputs and rule

Use Bears structured failing-test details, not invented full logs. Construct
one <=1,024-byte query per case: first 256 UTF-8 bytes of newline-separated
`testClass#testMethod` names, then the UTF-8 suffix of newline-separated
`failureName: detail` records within the remaining budget. Remove ANSI and
redact credential-shaped strings with the r37 pattern. Both arms and the
functionality prompt receive the identical sealed query. Project only
`.java` files <=1 MiB from the exact failed-commit archive, no more than
64 MiB per repository, into isolated Git indexes. Do not read fixer content,
patch, evaluator paths, or passing source in source-side work. Keep all
provider payloads and receipts private.

Use the unchanged r62 functionality prompt, GLM `glm-5.3-flash`,
20–400-character summary validity rule, normal provider stop, 192 output
tokens, 8,192 total tokens per prompt, at most 24 tokenizer and 24 generation
calls, 60,000 aggregate admitted prompt tokens, and zero automatic retries.
Invalid summaries fall back to the raw query; a failed tokenizer admission
fails the run. No file or fix path is intentionally supplied in the prompt
beyond what occurs naturally in the structured failure evidence.

Use the unchanged r61/r62 ranking mechanism over each complete Java file
universe: ARE trace-text ranking, full-source 120-line chunk BM25 under raw
and functionality queries, baseline A as unweighted two-channel RRF(k=60) of
ARE and raw BM25. Candidate C is first-occurrence union of ARE, raw BM25,
and functionality BM25 top 10, capped at 30. Complete functionality BM25
top 30 with A's unseen remainder. Treatment is three-channel RRF(k=60)
within C, followed by A order outside C. No source-rank tuning,
per-repository adaptation, or post-hoc exclusions. Seal every ranking before
opening evaluator labels. Also report pure ARE and pure raw-BM25 ranks as
diagnostic comparators, but do not use them to choose cases or weights.

## Frozen gate and claim ceiling

Evaluate all 24 against r76's curated Bears old-side Java patch paths.
Report MRR@8, Hit@3, recall@20, cost/latency, 100,000 deterministic paired
repository-bootstrap draws, and wins/ties/losses. The bounded gate requires
24/24 valid case receipts, >=22 valid summaries, treatment MRR@8 at least
+0.05 above A, a positive paired 95% lower bound, no decline in Hit@3 or
recall@20, and >=14 repository wins. These are simultaneous conditions; a
failure of one is a gate failure. Report any label/projection mismatch as an
invalid campaign, not a dropped case.

A pass supports only bounded superiority on this label-shape-selected Bears
Java failure-detail file-localization task against the matched A comparator.
It does not repair r72's failed Python gate or establish general ARE product
superiority, ContextBench-wide superiority, end-to-end efficiency, or a
public product-page claim. Those require independent strong-baseline and
reviewer evidence beyond this private transfer.

## Open questions

- Does the fixed functionality mechanism improve early Java file ranking on
  this new population without sacrificing reach?
- Can it beat an independently implemented strong comparator at matched
  context and provider cost on another unopened population?
