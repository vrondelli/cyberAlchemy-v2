# G01 BugSwarm r1 prospective trace-to-code transfer protocol

Status, 2026-10-04: **protocol before rankings, provider dispatch, or any
score.** This is an external, repository-separated transfer of the G01
GLM file-reranking mechanism, not original ContextBench Span-F1. The
[feasibility/admission note](G01-BUGSWARM-EXTERNAL-TRACE-POPULATION-FEASIBILITY-2026-10-04.md)
records the immutable candidate order and source/evaluator separation.

## Objective and frozen input boundary

The objective is to increase correct source-file retrieval from an original
failed CI build log at an exact pre-fix repository commit. The denominator is
the first **24 metadata-admitted cases in 24 distinct repositories** under
the already sealed BugSwarm 1.3.1 source order: 12 Python and 12 Java.
No case was selected, replaced, or reordered after opening model results;
no model result exists yet. Candidate IDs and order are bound by private
`METADATA-CANDIDATE-24-R1.json`, SHA-256
`fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d`.
The source-only code projection receipt is SHA-256
`29ace43945778671bfa2ec77bdda5f4bd57de8be385c354a822d6406b3535818`.
The source-only query seal is SHA-256
`0470c4aa7119b269a7150c0fa6a14567709605dc4d02a025823f87d797895995`;
the query file is SHA-256
`4dafeef345483b050df368efc6f3ec636b0b1bca5681950c08ab5da5846ce8e3`.
Every arm uses the **same** exact failed-commit code-only source universe and
query for each case. The source code consists of safe regular `.py`/`.java`
files at most 1 MiB each, up to 64 MiB per case, indexed without gold or
post-fix source. The query combines up to 256 UTF-8 bytes of failure-side
failed-test names when present with the ANSI-stripped tail of the original
failed-job log under a 1,024-byte ceiling. Three cases have no parsed test
names but still have log tails. Query construction, including the bounded
secret-like token redactor, is fixed by the linked script and seal.

The original BugSwarm logs and patch diffs were retrieved via the author's
unauthenticated **HTTP** API, not authenticated transport. Their job and
fail/pass identities were checked; exact failing source and patch-path
existence were checked over GitHub HTTPS. This does not authenticate the log
or diff payload itself. All conclusions must retain this provenance caveat;
independent source validation is required before a public external-transfer
claim. The first run may proceed as private, provisional research.

## Matched arms and model packet

1. **ARE file ranker:** run the retained
   [`ranked-source-acquisition-bm25-r1.mjs`](../research/arb-trace2code-r1/ranked-source-acquisition-bm25-r1.mjs)
   unchanged, `mode: trace-text`, 128 MiB maximum index, all projected
   code files ranked. This is a source-projected ranker, not a live ARE
   episode or end-to-end product result.
2. **Local chunk BM25 comparator:** nonoverlapping 120-line windows of the
   identical code files; ASCII alphanumeric/camel-case tokens; path plus
   window text; BM25 `k1=1.5`, `b=0.75`; decreasing score, then path/start
   line; deduplicate to a full-file order. It is not official ARB RepoMap.
3. **GLM reranker:** stable union of the first ten files from each standalone
   arm, ARE order first, at most 20 files. Use the same ARB-developed
   120-line, maximum distinct query-term overlap window, earliest tie,
   first 420 whitespace-collapsed characters, untrusted-data/JSON numeric-ID
   instruction template and up to eight distinct returned IDs. Admission
   limit is 8,192 prompt tokens inclusive of a 512-token output reserve.
   Use GLM-5.3-flash, low reasoning effort, one call per case on the VPS,
   no automatic retry. Put valid selections first, then fill from the ARE
   full-file order without duplicates. Invalid output, refusal, timeout,
   or token-limit rejection is an unscored attempt and fails completeness.

Seal both standalone ranking files and all 24 model packets before the first
GLM call. Send only source/query/packet data to the VPS model runner, never
gold or evaluator diffs. Preserve request/response hashes, valid-selection
checks, tokens, elapsed time, source/index time and provider cost privately.
Source and log text are untrusted data, never executable instructions.

## Evaluation and decision gate

Evaluator-only gold is the set of non-test `.py`/`.java` patch paths in the
pinned BugSwarm fail→pass diff that exist in the exact failed-commit
projection. The already sealed evaluator audit found **30 paths across
24/24 cases** before predictions; it did not export them to source inputs.
Its patch audit SHA-256 is
`962da35d492866ce6e587f82863ce6fda7969645be0b615ab07c8b315df957f8`;
its projection join SHA-256 is
`46ee78cabe65f4df304971fdab3640e0141aa6c5a87b2b0cc22a122a47f9c524`.
The evaluator may score only after all predictions are sealed. It cannot
change candidate selection, queries, source files, packet construction, or
rankings. Any identity or label failure remains in the 24-case denominator
and defeats the full-cohort gate.

Primary metric: per-case reciprocal rank of the first admissible gold file
at ranks 1–8 (zero otherwise), macro MRR@8 over 24 cases. Secondary:
Hit@3, Recall@20, candidate-union ceiling, per-language and per-repository
outcomes, and all-in source/index/model cost. Compare paired GLM-minus-ARE
and GLM-minus-chunk MRR@8 differences. Use 20,000 deterministic paired
bootstrap draws over the **24 repository units** (one case each), seeded
from the candidate SHA-256; report percentile 95% intervals and case
win/tie/loss counts. Do not treat prompt variations or repeated runs on
these cases as independent confirmations.

The private r1 advancement gate requires 24/24 valid GLM attempts and
labels, at least **+0.10 absolute MRR@8** over the stronger standalone arm,
a paired 95% lower bound above zero for that difference, and gains in at
least **16 of 24 repositories** over that arm. A failure is reported as a
failure; no post-hoc deletion or threshold change. A pass supports only a
provisional source-projected trace-to-code transfer result, subject to
HTTP-payload validation. It does **not** establish original ContextBench
Span-F1, official RepoMap superiority, lower cost, live ARE workflow
superiority, or a broad ARE product claim. Publication and Vlad/Dave review
are separate decisions.

## Open Questions

- Can independent HTTPS or artifact evidence authenticate the HTTP-served
  original log and diff payloads for this exact cohort?
- Will all 24 matched ranking packets and GLM attempts pass their frozen
  validity and cost checks on the VPS?
- Can this source-projected gain survive official RepoMap and live ARE
  delivery comparisons in separate campaigns?
