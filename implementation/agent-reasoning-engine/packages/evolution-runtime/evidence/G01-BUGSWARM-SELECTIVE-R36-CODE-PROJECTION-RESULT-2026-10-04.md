# G01 BugSwarm selective-GLM r36 — code-only projection result

Status: passed the prospectively fixed projection gate at **24/24**.

Protocol SHA-256:
`c811ccb6c56b059a93a532c0e17c456db2894b336c362ec694c5c78cf3bcf276`.
Runner SHA-256:
`d3e14d8c23144d01ace029184c7573230d4894b3a4dfd1480bf387ae2f45fd69`.
Private result SHA-256:
`14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395`.

R36 reverified every r35 archive and materialized **7,894** bounded regular
source files totaling **44,165,449 bytes** into 24 private roots. Python slots
contain only bounded `.py` members; Java slots contain only bounded `.java`
members. Every root has an isolated Git index and a sorted JSONL manifest that
binds each relative path to its byte count and SHA-256.

An independent read-only audit rehashed the result, freeze, runner, protocol,
24 case receipts, and 24 manifests; recomputed every one of the 7,894 file
hashes and all 24 projected-tree hashes; and confirmed that every Git index and
on-disk non-`.git` file set exactly equals its manifest. It reproduced the
44,165,449-byte total.

The result records `network_calls=0`, `gold_opened=false`,
`passing_source_opened=false`, `patches_opened=false`, and `model_calls=0`.

## Claim boundary

R36 proves only that the sealed r34 population has complete, hash-bound,
code-only failed-source roots. It establishes no ranking, accuracy, efficiency,
ContextBench, or superiority result. Next is unchanged authenticated-log query
projection followed by unchanged ARE and graph-r2 rankings, still before gold.

## Open Questions

- What is the unchanged ARE/graph top-1 disagreement count?
- Does the r27 disagreement router preserve the always-GLM quality advantage on
  this prospectively sealed transfer population?
- Can the new multi-view rank-fusion hypothesis improve acquisition without
  increasing GLM dispatch enough to erase the efficiency gain?
