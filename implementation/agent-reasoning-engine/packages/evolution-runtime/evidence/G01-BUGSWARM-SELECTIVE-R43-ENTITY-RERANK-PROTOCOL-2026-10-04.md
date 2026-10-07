# G01 BugSwarm selective r43 entity-card rerank protocol — 2026-10-04

Status: frozen before packet construction and model calls  
Population: all 23 r41-admissible exposed-development cases  
Claim ceiling: mechanism development only; not confirmation or superiority

## Objective

Test the external late-code-chunking hypothesis without changing source
acquisition. Preserve each frozen graph-r2 top-`N` candidate set exactly, where
`N = min(30, candidate_count)`, replace generic file excerpts with deterministic
source entity cards, and ask one bounded GLM call to reorder only those files.

## Frozen inputs

- r36 code projection:
  `14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395`
- r37 authenticated queries:
  `999d207a6108e7b374249cc131f1cde6fa9067bfe9931ada233f7a666d96ee65`
- r38 independent ranking audit:
  `ef02489f4b42a1363fee82af76a2c812a98ce595ae1ce621d0e8ea10c2dc68fe`
- r41 admission census:
  `88f011f1c532609e633e0f6a023c23c8894068babd4655436c64e38c200bf78e`
- r42 exposed score result:
  `fcc670625a78d8056fbf8c95f944eafc2b1ff9b3bc5b08a837466f5d91db18c4`
- r42 independent score audit:
  `ba83e2b7b64a0cffbb83ed6c67b7a682d44618a5a16d80ba738bd4d309963f1d`

Ordinal 15 is retained as an excluded population receipt. Its evaluator gold
path and every other gold path are forbidden from packet construction, VPS
transfer, tokenizer requests, and generation requests.

## Entity-card construction

For each graph-r2 top-`N` file at the exact failed commit, construct one compact
card containing:

- path and frozen graph rank;
- up to eight class/function/method declarations, ordered by exact overlap
  with identifiers in the frozen failure query and then source order;
- up to four imports, with query-overlapping imports first; and
- up to two normalized source lines containing query identifiers, ordered by
  number of distinct matched identifiers and then source line.

Python entities and imports use the standard-library AST with a deterministic
regex fallback. Java uses pinned regular expressions for types, methods, and
imports. Read at most 262,144 bytes per file. Each card is capped at 480 UTF-8
bytes. No embedding, evaluator label, passing source, patch, network lookup, or
learned weight participates.

The prompt contains the frozen failure query and exactly `N` cards in graph
order. It instructs GLM to return only
`{"candidate_ids":[...]}` with at most eight distinct IDs. Each prompt is at
most 24,000 bytes.

## Provider run

- private VPS: `root@187.77.163.194`
- model: `glm-5.3-flash`
- maximum tokenizer calls: 23
- maximum generation calls: 23
- maximum output: 512 tokens
- reasoning effort: low
- context admission: prompt tokens plus 512 at most 8,192
- aggregate prompt-token cap: 220,000
- automatic retries: zero
- timeout: 120 seconds per generation
- failure policy: stop without replacement

No source tree or evaluator data is transferred to the VPS. Only sealed
packets, protocol, runner, and provider receipts are stored there.

## Prediction rule

Independently reparse every provider response. A response is valid only if its
entire normalized body is the required JSON object and every selected ID is a
distinct in-range packet candidate. The full treatment ranking is selected
paths in returned order, followed by the unchanged graph-r2 full ranking with
duplicates removed. Because all selectable paths are graph top-`N` paths, the
treatment top-`N` set must exactly equal the graph-r2 top-`N` set.

## Metrics and advancement gate

Use r40's per-case first-gold rank, RR@8, Hit@1, Hit@3, and top-30 reach.
Compare treatment minus graph-r2 MRR@8 with 200,000 paired bootstrap samples,
seed `430043`, using the same empirical percentile indexes as r42.

R43 advances to a new, pre-screened confirmation cohort only if:

1. all 23 tokenizer and generation responses are valid and independently
   sealed;
2. treatment top-`N` sets equal graph-r2 top-`N` sets on 23/23 cases;
3. treatment MRR@8 exceeds graph-r2 and the paired 95% lower bound is above
   zero;
4. treatment Hit@3 is at least graph-r2 Hit@3; and
5. the independent score audit reproduces every case and aggregate.

Passing this gate establishes a development candidate only. A superiority
claim still requires a distinct prospectively frozen matched confirmation
population, complete validity, authenticated labels, cost accounting, and its
own claim gate.

## Open questions

- Do source entities improve ordering when candidate acquisition is held fixed?
- Which entity fields drive wins and losses across Python and Java?
- If R43 qualifies, is the added prompt and model cost justified on fresh data?
