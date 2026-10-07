# G01 Defects4J production-aware r3 prospective protocol

Status: frozen before selecting/reading new source contents, r3 generation,
and r3 modified-class gold, 2026-10-06. Policy follows the separately exposed
[development result](G01-DEFECTS4J-PRODUCTION-DEV-R1-RESULT.md). This is a
new-policy confirmation, not a retry of the failed r2 protocol.

## Cohort and retrieval

Within each of the same 16 Git projects in the fixed Defects4J source-supply
manifest order, skip the first four eligible active numeric bug IDs used in
r1/r2 and take the next two. Eligibility is a recorded parseable trigger trace
and a Git buggy revision; exclude Chart SVN. Keep all 32 cases, without
score-dependent replacements. Verify zero overlap with both prior cohorts.
Reuse of projects means case holdout, not unseen-project transfer. Acquire
only exact buggy sources; do not inspect fixed revisions or patches.

The query retains the r2 first failure header and exception line plus up to
eight non-harness Java frames. Index every tracked Java file, including tests,
at the exact buggy revision, with the first 20,000 Unicode characters per file
for both ARE and pinned official RepoMap code. Candidate counts and source
projections must match and no Java file may be omitted. ARE remains the sealed
Java BM25/trace-text implementation; RepoMap retains its official code pin and
.65 query/.25 PageRank/.10 affinity weights and adapted file-text projection.

The only treatment change from r2 is production-aware ARE shortlisting. From
the full ARE ranking, take the first ten production paths. A production path
is Java without a test/tests/testing/testsrc directory (case insensitive) or
a filename matching Test-prefix or Test/Tests/TestCase suffix (case sensitive).
This is the exact exposed screen's generic heuristic, not label-specific
knowledge. Union that top ten with original unfiltered RepoMap top ten and
stack-locator top eight, deduplicated and lexically ordered. Test caller files
remain in the complete index and other candidate arms. Do not add new
question-specific exclusions or tune the candidate union after gold.

Each candidate retains r2's 20-line source windows at ten-line strides,
maximum distinct query-token overlap, earliest tie, and 600-character excerpt
from the first 20,000 source characters. Retain the r2 prompt and integer-ID
decoder: exact decimal strings optionally bracketed are accepted before
checking range, uniqueness and maximum eight IDs; other outputs are empty.

## Frozen comparators and requests

Technical admission correction before any r3 provider requests or gold: the
complete frozen query view can exceed the prior private ranker's 1,024-byte
internal guard (r3 maximum is 1,362 bytes). Raise only its `rankAll` input
guard to 16,384 bytes; do not truncate the query or alter tokenization, scores,
indexing, shortlist selection or prompt. The native tool schema and live ARE
integration are unchanged. Verify parity on a prior admitted query and acceptance
of the complete longest fresh query. This is an input-contract correction,
not a score-dependent policy amendment.

Score original ARE, production-filtered ARE, original adapted RepoMap,
production-filtered RepoMap, stack locator, original retrieval fusion over the
treatment union, and production-aware retrieval fusion over that same union.
Fusion uses reciprocal ranks with constant 60 on the top20 retrieval lists
and stack list. The production-aware fusion uses both production-filtered
retrieval lists; its policy is identical to the development stronger-baseline
audit. Keep every comparator even if it beats GLM. No symbol-bearing projection
is claimed; testing one remains separate work.

Run GLM-5.3-flash on the VPS, exactly one generation request per case,
max_tokens=512, low reasoning effort, zero generation retries. Same-account
tokenizer requires prompt+512<=8,192. A transport failure preserves the batch
and forbids reissuing completed requests; invalid selections count as empty.
Write all responses/cost and the final prediction seal before any r3 gold read.

## Metrics and unchanged gate

Gold is the recorded modified production classes mapped uniquely to tracked
buggy Java paths, a human-fix file-localization proxy rather than root-cause
proof. Report mapping failures and do not replace cases. Primary MRR@8;
secondary Hit@3 and gold-file Recall@8. Two cases per project give equal
project weight. Report all project effects and exact two-sided project-level
paired sign-flip tests. Advance only if every condition holds:

- GLM mean MRR@8 delta >=.10 versus **every** frozen comparator.
- Project sign-flip p<=.05 versus original and production-filtered RepoMap,
  and original and production-aware fusion.
- GLM Hit@3 >=24/32 and at least six more than the strongest comparator.
- All labels mapped completely and all 32 sealed cases retained.

These are the r2 numerical thresholds with stronger comparators, not weakened
criteria. A failure remains failed; no reclassification as a pass or rerunning
unchanged fresh cohorts until favorable. Any later policy needs distinct
development evidence and its own prespecified confirmation.

Report tokenizer/generation calls, tokens, elapsed time, source acquisition,
indexing and all-in limitations separately. No cost win over zero-model
retrieval is inferred. A passed result supports only a bounded claim for this
adapted public Java cohort. Pretraining exposure, trace-path cues, same-project
holdout, symbol-free RepoMap adaptation and human-fix labels remain caveats.
It does not prove ContextBench Span-F1, a published leaderboard, unseen-project
or cross-language transfer, live ARE episodes, G02/G03 success, or product-wide
superiority. Publication and deployment are not authorized.

## Open Questions

- Does the unchanged policy clear the stronger frozen gate on fresh cases?
- Will stronger symbol-bearing retrieval alter the comparison?
- Does live ARE delivery retain quality under matched all-in budgets?
