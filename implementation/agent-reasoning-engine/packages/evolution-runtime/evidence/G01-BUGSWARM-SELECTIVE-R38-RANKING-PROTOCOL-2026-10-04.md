# G01 BugSwarm selective r38 ranking protocol — 2026-10-04

Status: prospectively frozen private benchmark protocol  
Scope: 24-case authenticated 17-Python / 7-Java mechanism-test population  
Claim ceiling: pre-gold source-only ranking and routing census; no accuracy or superiority claim

## Objective

Transfer the unchanged ARE trace-text ranker and unchanged graph-r2 ranker to
the r36 code-only roots using the r37 authenticated-log queries. Seal their
complete rankings and measure the already defined r27 selective-router trigger:

> dispatch GLM if and only if unchanged ARE and graph-r2 top-1 paths differ.

R38 does not call GLM and does not open evaluator-only labels. It establishes
the exact denominator and cost exposure for a later matched always-GLM versus
selective-GLM test.

## Frozen inputs

| Input | SHA-256 |
| --- | --- |
| r36 `RESULT.json` | `14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395` |
| r37 `QUERIES.jsonl` | `999d207a6108e7b374249cc131f1cde6fa9067bfe9931ada233f7a666d96ee65` |
| r37 `QUERY-SEAL.json` | `ed0e5d6b1f9ef71c1ac64b0d36b1083ee84e41374744a951896216b9b364ad2d` |
| unchanged ARE ranker | `52629ca2faddf20db18e78ea8b7debb880d0140413d42c67ec759e5f53aa5788` |
| unchanged graph-r2 rule | `e0664909091562e38a547f04c7901e88ae2723bfe9d4bd2f0cdef2c561a770d0` |

## ARE arm

- `mode`: `trace-text`
- `allow_projection`: `true`
- maximum index bytes: 128 MiB per case
- input: the exact r37 query
- output: a full permutation of the Git-indexed r36 file set
- partial indexes, missing files, duplicate files, or tree drift fail the stage

## Graph arm

Use the unchanged graph-r2 `rank_case` function. Its inputs are the complete
ARE ranking, exact r37 query, and raw authenticated failure log recovered only
through the r37 sealed provenance path and hashes. The output must be a full
permutation of the same file set.

## Pre-gold census

For every case, record only:

- ARE top-1 path;
- graph-r2 top-1 path;
- whether the paths are equal; and
- the two complete ranking-file hashes.

The selective trigger count is the number of unequal top-1 pairs. No target
path, reciprocal rank, hit metric, diff, patch, passing source, or correctness
judgment may enter r38.

## Gates

R38 passes only if:

1. all 24 ARE rankings are complete and independently sealed;
2. all 24 graph-r2 rankings are complete and independently sealed;
3. source trees and candidate sets match r36 exactly;
4. all raw logs match r37 provenance hashes after decompression;
5. an independent audit recomputes every ranking hash, file-set equality, and
   top-1 disagreement bit; and
6. network calls, model calls, gold access, passing-source access, and patch
   access all remain zero.

## Next boundary

After r38 passes, freeze the candidate-packet and prediction protocol before
any provider call or gold access. The external-technique r39 symbol/path fusion
is a separate ablation and must not alter this baseline retrospectively.

## Open questions

- Is the disagreement denominator large enough to test meaningful call savings?
- Do later gold outcomes show that disagreement is correlated with errors?
- Should score margins be added in a separately versioned census if the two
  unchanged rankers expose commensurable scores?
