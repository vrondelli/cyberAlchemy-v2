# G01 BugsInPy fresh trace-to-code r1 protocol candidate

Status: **prospective protocol candidate, before packet construction, provider
dispatch, or gold opening.** This specifies a fresh, repository-separated
transfer test for the ARB-developed GLM file reranker. The 24-case source-only
[cohort freeze](G01-BUGSINPY-FRESH-TRACE-COHORT-2026-10-04.md) is fixed at
SHA-256 `888952ed833231141fe3c9f86efd357a7f84bcbeeafdcdb790a775f6e9f7df33`.
No case replacement or gold-aware redesign is allowed. Any code or input
change after observing results must be a separately named development run.

## Task and matched inputs

For each frozen `(repository, bug ID, buggy commit)`, retrieve the files
responsible for the observed buggy pytest trace from that exact-commit
source archive. Read only the frozen `bug_buggy.txt` as the query; decode
UTF-8 with replacement and take the first and last 509 UTF-8 bytes separated
by `\n...\n` if longer than 1,024 bytes. Check its SHA-256 against the
source-only census. All arms receive the same edge query and file universe.

Project every source archive to regular, safe-relative, non-NUL-in-first-8K
files of at most 1 MiB, sorted by path. Links and special members are never
followed; `.git` components are excluded. Fail the case if paths duplicate,
the projected text exceeds 64 MiB, or the index omits a projected file.
The [source-only coverage preflight](../research/arb-trace2code-r1/preflight-bugsinpy-index-r1.py)
found **24/24** under 64 MiB, maximum 2,248 files and 25,739,948 bytes;
this is an admission estimate, not a run result. These codeload projections
are not verified Git worktrees, so no exact-Git or live ARE claim follows.

## Arms and packet

1. **ARE file ranker:** unchanged
   [`ranked-source-acquisition-bm25-r1.mjs`](../research/arb-trace2code-r1/ranked-source-acquisition-bm25-r1.mjs),
   `mode: trace-text`, 64 MiB index, same 1,024-byte query, all projected
   files ranked. This is a source-only ARE candidate, not a live episode.
2. **Chunk BM25:** deterministic local comparator over nonoverlapping
   120-line windows of the same projected files. Tokenize ASCII alphanumerics
   with camel-case splitting, score path plus window text with BM25
   `k1=1.5`, `b=0.75`, sort by decreasing score then path/start line, and
   deduplicate to a full-file order. This is *not* the official ARB
   implementation and must be named as a local comparator.
3. **GLM rerank:** take the first ten files from each preceding arm, stable
   union in ARE-then-chunk order (at most 20). For each candidate, select
   the 120-line window with greatest distinct query-term overlap, then
   earliest start line; collapse whitespace and retain the first 420
   characters. Use the same ARB-development instruction template: untrusted
   failure/source text, up to eight distinct numeric IDs in ranked order,
   JSON only. Prompt admission is 8,192 tokens inclusive of a 512-token
   output reserve. Use GLM-5.3-flash, `reasoning_effort: low`, one call per
   case, no automatic retry. Place valid selected files first in model
   order, then fill from ARE file order without duplicates. Invalid output,
   refusal, timeout, or tokenizer rejection gets no replacement; it is
   counted as an unscored attempt and defeats the completeness gate.

All packet construction and arm rankings must be sealed by SHA-256 *before*
any provider call. The VPS receives source-only packets, not gold. Source
text and logs are untrusted data, never instructions. Model request/response
receipts, prompt/token admission, timing and cost are retained privately.

## Gold and analysis boundary

Only after all prediction files are sealed may a separate evaluator read
`bug_patch.txt` from the pinned BugsInPy metadata archive. Parse its unified
diff headers to identify changed paths that existed in the frozen projected
buggy source universe. Report all changed paths, paths not in the source
universe, and any patch parse or identity failures. A case with no admissible
existing changed file is **not dropped or replaced**: report it as invalid
and fail the full-cohort claim gate. The evaluator cannot modify rankings.

Primary metric: per-case reciprocal rank of the first admissible changed
file at rank 1–8, otherwise zero; macro-average MRR@8 over all 24 frozen
cases. Secondary: Hit@3 and Recall@20, per-case and per-repository outcomes,
candidate-union ceiling, and all-in source/index/model cost. Compare paired
GLM-minus-ARE and GLM-minus-chunk differences. Use 20,000 paired bootstrap
resamples of the 12 fixed repositories (keeping each two-case cluster
together), deterministic seed from the first eight hex digits of the cohort
freeze SHA-256; report percentile 95% intervals and repository win/tie/loss
counts. Do not present a case-bootstrap interval as independent evidence.

The bounded r1 advancement gate requires 24/24 valid attempts and labels,
at least **+0.10 absolute MRR@8** over the stronger standalone arm, a
repository-cluster 95% lower bound above zero for that paired difference,
and gains over that arm in at least eight of 12 repositories. If it fails,
report the failure and continue research on a new, non-reused cohort. Even
if it passes, the permitted claim is only source-projected file-retrieval
quality on these fresh BugsInPy traces. It does not establish efficiency,
official RepoMap superiority, original ContextBench Span-F1, live ARE
workflow superiority, or a general ARE product headline. Publication and
exact-card reviewer approval are separate gates.

## Open Questions

- Will the source projection and candidate ranking code match this protocol
  exactly and admit all 24 cases before provider dispatch?
- Will evaluator-only patch parsing find at least one existing changed file
  for every case without exposing paths to source selection?
- Can matched official RepoMap and live ARE comparisons be added in separate
  preregistered campaigns without reusing this cohort as untouched evidence?
