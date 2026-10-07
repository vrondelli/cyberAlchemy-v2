# G01 BugSwarm selective-GLM r35 — exact failed-source archive result

Status: passed the prospectively fixed source-only gate at **24/24**.

Protocol SHA-256:
`0fa6a18cff8dc375c1dc4a8e1c278f325407cc3957f86b1dc147640919281c84`.
Runner SHA-256:
`8c1d582fc16adbfeaa04a35dc9276902953d9d39960b7c4359571bd7d4b6b12a`.
Private result SHA-256:
`5ef1dfeeb71d4df32d166ffab322aabdd9fda32e592ab4e9a7c8b93a27b3e1ff`.

R35 made exactly 24 sequential GitHub codeload requests with zero automatic
retries. Every request returned HTTP 200, completed inside the 256 MiB
per-archive bound, had a valid gzip/tar stream, and passed the frozen safe-root,
member, regular-byte, code-byte, and duplicate-path inspection rules. The 24
archives occupy **179,049,092 bytes**, contain **18,389 tar members**, and
expose **7,894** bounded `.py`/`.java` files for the next projection stage.
There are no `.partial` files.

Slot 14 (`square/retrofit`) resolved to an archive root with a changed GitHub
owner prefix. It passed the rule frozen before any request: exactly one safe
root ending in the declared repository basename and the exact failing commit's
seven-character prefix. No repository basename or commit substitution was
allowed.

An independent read-only audit rehashed the result, freeze, 24 case receipts,
and 24 archives; reread every tar member; reproduced the root constraints and
owner-rename classification; and verified 24 unique repositories and commits.
It matched all reported byte counts and SHA-256 values.

The result records `gold_opened=false`, `passing_source_opened=false`,
`patches_opened=false`, and `model_calls=0`.

## Claim boundary

R35 proves only that the sealed r34 mechanism-test population has complete,
exact failed-source archives under the bounded acquisition rule. It establishes
no ranking, accuracy, efficiency, ContextBench, or superiority result. The next
stage is a hash-bound code-only projection, followed by unchanged ARE and
graph-r2 rankings before any gold access.

## Open Questions

- How many bounded code files and bytes remain after exact code-only
  materialization?
- What is the pre-gold ARE/graph top-1 disagreement rate on this population?
- Does the frozen selective router preserve the always-GLM quality advantage
  while materially reducing calls, tokens, and elapsed time?
