# G01 BugSwarm selective r39 multi-view protocol — 2026-10-04

Status: prospectively frozen private source-only ablation  
Claim ceiling: pre-gold retrieval and stability evidence; no accuracy or superiority claim

## Hypothesis

A deterministic exact symbol/path view, fused with unchanged ARE and graph-r2,
can provide a more stable candidate ordering and a richer uncertainty signal
than the r38 binary top-1 disagreement rule.

## Frozen inputs

- r36 source result: `14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395`
- r37 queries: `999d207a6108e7b374249cc131f1cde6fa9067bfe9931ada233f7a666d96ee65`
- r38 audit: `ef02489f4b42a1363fee82af76a2c812a98ce595ae1ce621d0e8ea10c2dc68fe`
- r38 ARE seal: `b5c6665bbb1a9142d9b77b9de69d222f014d1fe1847ea89d1208fead1621691d`

## Symbol/path channel

For each r37 query:

1. extract case-insensitive identifiers matching
   `[A-Za-z_][A-Za-z0-9_]{2,}`;
2. split query identifiers, file stems, and path segments on underscores,
   hyphens, dots, and camel-case boundaries;
3. ignore a fixed code/log stop list and tokens shorter than three characters;
4. inspect at most the first 256 KiB of every r36 source file;
5. extract Python `class`/`def` and Java
   `class`/`interface`/`enum`/`record` declaration names;
6. score each file by fixed evidence:
   - exact whole-stem identifier in query: +8;
   - each shared stem token: +2;
   - each shared non-filename path token: +1;
   - each exact declared symbol in query: +5; and
7. sort by descending score, then path lexicographically.

The output is a complete permutation, including zero-score files. No label,
previous outcome, learned parameter, raw log beyond r37's query, or model is
used.

## Fusion

Fuse the complete ARE, graph-r2, and symbol/path rankings with equal-weight
reciprocal-rank fusion:

`score(path) = sum(1 / (60 + rank_channel(path)))`

Sort by descending fused score, then path. `k=60` and all weights are frozen.
The full source set must survive. For future packets, also seal the uncapped
union of each channel's top ten; its maximum is 30 paths.

## Pre-gold census

Seal per case:

- all three channel top-1 paths and the fused top-1;
- whether all three agree, any two agree, or all three differ;
- how many channel top-five lists contain the fused top-1;
- top-ten union size; and
- complete ranking and source-tree hashes.

No dispatch threshold is admitted in r39. The census identifies candidate
features; any selector threshold needs a development evaluation and a separate
prospective freeze.

## Pass gate

All 24 symbol/path and fused rankings must be full permutations of the exact
r36 Git-indexed sets. An independent auditor must recompute source trees,
symbol/path scores, RRF rankings, hashes, and census counts byte-for-byte.
Network, GLM, gold, passing-source, and patch access remain zero.

## Open questions

- Does evaluator-only scoring show that fused ordering improves top-30 reach or
  MRR without losing files reachable by either r38 arm?
- Which pre-gold support feature, if any, predicts when GLM helps?
