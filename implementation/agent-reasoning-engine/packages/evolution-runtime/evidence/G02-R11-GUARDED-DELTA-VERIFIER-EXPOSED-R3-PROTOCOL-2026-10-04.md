# G02 r11 guarded delta verifier r3 — exposed protocol

Status: prospectively fixed exposed-development protocol. This protocol was
written before the r3 shortlist was evaluated against gold and before any r3
provider request. It consumes no fresh task and cannot support a superiority
claim.

## Objective

Preserve the original ARE file selection and test whether the successful r1
multi-view acquisition layer can add a previously unread relevant file without
the false-positive damage caused by the rejected r2 listwise chooser.

The source-only builder considers the first 24 sealed r1 candidates. It keeps
at most eight paths per task by deterministically taking the first candidate in
these strata, then deduplicating by source rank and path:

1. fused ranks one and two;
2. non-test source implementation;
3. test;
4. documentation;
5. configuration;
6. outside the prior relation ranking; and
7. outside both prior rankings.

Each candidate receives bounded, line-numbered evidence selected from
issue-term overlap, structural declarations/headings/configuration, and file
header lines. Gold, DSH output, native scores, and reference-patch content are
not inputs.

## Two-stage gate

Before any provider request, an evaluator-only audit checks the frozen
shortlist. Continue only if it contains at least four undelivered gold files
across at least two repositories. This is an acquisition-supply gate, not a
quality result.

For each admitted candidate, GLM compares the candidate with `NO_ADDITION`.
The primary request places the candidate first. Only a valid primary `ADD`
receives a second request with option order reversed. There are zero retries.
An `ADD` must cite one to three line numbers present in the supplied card and
use one fixed causal reason code. A task proposes its file only when exactly
one candidate receives two valid, order-invariant `ADD` decisions; zero or
multiple accepted candidates cause abstention. The original baseline is never
removed or reordered.

The frozen advancement gate requires:

- every primary request valid and every required confirmation valid;
- no more than one proposed file per task;
- at least two new gold files across two repositories;
- proposal precision of at least one third;
- strictly positive mean File-F1 change; and
- more improved than regressed tasks.

All tokenizer and generation usage, elapsed time, invalid responses, and
abstentions remain in the denominator. Passing is exposed development only;
the exact mechanism would still require a separately frozen matched cohort.

## Pre-evaluation implementation freeze

- source-only packet builder SHA-256:
  `a7bb0a95bf13ffe4fe928562f7fc519e33075768dc8d382a6d7824206e9522ab`
- sealed packet SHA-256:
  `a9dc4039a4d859423ab33265c8283a13c4bb79aa6eefa28bd35b2876f5d63e61`
- shortlist coverage auditor SHA-256:
  `5d3ab463df6241acdb3d3fc5d5134f144fc0809e5dd6c0461dbed58184f002fa`
- zero-retry verifier runner SHA-256:
  `eaa655dbad3dd0dea97e51556129f63763d854f0a42172b8e59526b9630a6c11`
- response sealer SHA-256:
  `5d62dac4419c1738ccad45d29fe52ecc1c95e4911aba9d1159f4af2e9c67b1e0`
- final evaluator SHA-256:
  `b13ca27e0c501b102cd72e23465b2ce339ed12df7dc2ad7892285d1b846be1b7`
- private packet root:
  `/home/vlad_/are-benchmark-archive/g02-r11-guarded-delta-packets-exposed-r3-20261004`

The packet contains 45 candidate cards across 12 tasks. These hashes and the
gate above were fixed before the shortlist coverage auditor opened labels.

## External basis

- Pairwise Ranking Prompting reduces the burden of listwise ranking:
  <https://arxiv.org/abs/2306.17563>.
- Permutation self-consistency addresses order sensitivity:
  <https://aclanthology.org/2024.naacl-long.129/>.
- Selective retrieval supplies the abstention principle:
  <https://arxiv.org/abs/2403.10059>.

These papers motivate the mechanism; their results are not ARE results.

## Claim boundary

No actual ARE read, Span-F1, fresh transfer, DSH comparison, product claim, or
superiority claim follows from this exposed counterfactual.

## Open Questions

- Does the role-stratified shortlist retain enough of r1's new reach?
- Does order-invariant candidate verification improve precision enough to
  overcome the File-F1 penalty of an additional false-positive file?
- If it qualifies, will the same fixed policy transfer to a matched cohort?
