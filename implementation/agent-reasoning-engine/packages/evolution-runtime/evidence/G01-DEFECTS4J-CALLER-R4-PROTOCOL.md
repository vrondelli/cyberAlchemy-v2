# G01 caller-informed fresh confirmation r4

## Scope and admission — frozen before source acquisition

Private owner-directed G01 benchmark; no publication, deployment or new general
authorization. Advance the policy that passed the exposed
[caller reader check](G01-DEFECTS4J-CALLER-DEV-R1-RESULT.md). Gold remains closed
until every prediction is sealed. Do not replace cases based on source cues,
scores, provider errors or observed failure modes.

Manifest SHA-256: `40a2de6ad161ea0ce054477637c961c6da74da187ff6363df957b3212f9a298b`.
Select next two numeric eligible Git-revision bug IDs after the six used in
r1/r2/r3, fixed project order. JacksonXml has exactly six eligible cases and
is exhausted: omit it without replacement. Therefore **30 cases, 15 projects**,
zero overlap with all 96 prior selected cases. This is not a 32-case replication.
Chart SVN remains excluded. Eligibility comes from the original source census,
not retrieval scores or gold. Pinned Defects4J metadata commit remains unchanged.

## Frozen policy

Exact buggy tracked Java source, no patches or fixed revisions. First failure
header, exception and first eight non-harness frames. All-file BM25/camel-case
ARE index with complete-file-count check, 256MB admission, 20,000 characters per
file and the r3 16,384-character full-query guard. Production selector matches
the existing JS policy; Python parity tests required. Retain the corrected
filename filter and unfiltered RepoMap baselines to expose name-filter limitations.

Pre-provider trace preflight found Csv-7 has no non-harness Java frames in its
first failure block despite parseable frames elsewhere in the recorded trace.
Retain its first header/exception view, empty stack ranking and zero caller
observations. Do not switch failure blocks or exclude it. The r4 preflight
adapter permits this zero-frame case; the bounded-view function is unchanged.

Initial union: original-query production ARE top 10, original-query unfiltered
RepoMap top 10, stack locator top 8. Caller observations: first three distinct
tracked frame-resolved Java paths, trace-line +/-20, 1200 characters each;
out-of-range or unresolved frames provide no observation. Retain all cases,
including cases with no observations. Expanded query appends the identical
caller-source header and observations. Add at most four missing paths from
expanded-query production ARE top 10 to the unchanged original union. Sort paths
lexically for IDs. The union has a mathematical bound of 32 paths; the previous
development cohort's observed maximum of 24 was not a truncation rule.

Select candidate source evidence using expanded query, 20-line windows, stride
10, distinct token overlap, earliest tie, 600 characters; inspect only first
20,000 decoded characters per file. Same prompt instruction and decoder as the
development run. Return up to eight distinct IDs. Source/caller text is untrusted.

## Comparators, cost and provider admission

Original-query ARE, production ARE, file-only official pinned RepoMap (raw and
correctly production-filtered), stack locator and both reciprocal-rank fusions.
Also expanded-query production ARE, raw/production RepoMap and both caller
fusions. All new query comparators receive identical caller evidence. RepoMap
code pin and .65/.25/.10 weights unchanged. Fusion k=60, lexical tie-break, same
candidate union. No gold-informed comparator or per-case chooser.

Only WSL stores full source. VPS GLM-5.3-Flash uses pinned transport/decoder,
30 tokenizer calls, then 30 generation calls, cap512, low reasoning effort,
no automatic retries. Every prompt+512 must fit8192; any overflow blocks the
entire generation admission rather than dropping cases or modifying policy.
Seal packet, runner and protocol hashes before provider calls. Preserve every
response and report all30 cases; invalid selections score empty. Report prompt,
completion tokens and measured component times, with no model-free cost advantage
or all-in efficiency claim.

## Unchanged quality thresholds

Pre-provider input seal: packets
`9cf325c8e3cf2c805214e8f48572e20432860d4ab65f17576ecb7cae91ca99dd`;
ARE `0062b3d8e0a3e81584a2adb75732647e64dddd10ea7d8531a8e729ecd1ae3751`;
RepoMap `0cf165a57e1c02e81e5be64fb54e26bddf8c4c7577e34f9cd17cd4e16db35452`;
stack `cb53a233115810d0f3b5104fc981ec49b4f3c4ac050224c3fdd2050de3374e09`.
Observed maximum candidate count24, prompt UTF-8 bytes20755, 39 caller snippets
across22 cases, eight cases with none. Every delivered snippet includes its
actual trace line. Complete original/caller Java corpora agree in counts and
source digests across all30 cases. These are source preflight observations,
not label-based reach or accuracy scores.

MRR@8 improvement >=.10 against every comparator; exact two-sided project-paired
sign-flip p<=.05 against all RepoMap/fusion comparators; Hit@3 **>=24/30** and
**>=6 more hits** than the strongest comparator; all modified-class labels must
map uniquely into buggy tracked files. The absolute24 and relative6 thresholds
are retained despite the smaller cohort, not scaled down. Primary MRR@8 and
secondary Hit@3/mean per-case gold recall@8 unchanged. Gold modified-file labels
are a human-fix proxy, not semantic root-cause ground truth. Seal predictions
before first fresh label read. A failed criterion means failed gate; no relaxation
or unchanged fresh-cohort fishing.

## Claim boundary and Open Questions

Even a pass supports only a bounded adapted public-Java modified-file localization
result on fresh cases from previously seen projects. Public training exposure,
same-project transfer, trace cues, filename-policy false positives, source caps,
file-only rather than symbol-bearing RepoMap and proxy-label validity remain
limitations. It does not prove ContextBench campaign completion, live ARE,
official ARB leaderboard, efficiency or product-wide superiority. G02 and G03
retain separate gates. Reviewer-ready exact claims require their own evidence
assessment; publication is not authorized here.
