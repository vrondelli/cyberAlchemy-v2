# G01 r15 r2 — overlay-backed 24-pair private freeze

Status, 2026-10-02: **terminal failed** after two pairs; see the
[terminal note](G01-R15-TERMINAL-NOTE.md). This file preserves the
pre-dispatch freeze and live launch record, not an aggregate result.

The score-blind r15 r2 cohort contains 24 ContextBench tasks (18 Python, six
TypeScript) across five origins. Its source-only candidate SHA-256 is
`0d713aefd06e38043c48073af7226e6aab55ed0cff16efd7d77f55bb1c7da496`.
Exact caches, 24 checkouts, bounded indexes, and an evaluator-only native
reference audit passed before freeze; the latter admitted 62/62 reference
files without exporting gold paths to the selector.

The first overlay input definition failed the freeze guard before any campaign
root or model dispatch because its task specs omitted `base_commit`; the task
JSON already carried that field. Its SHA-256 is
`68fc5f0e72a86c187f49400db81a68fe275befde0a9e2a2e3d52231d5ac1cd9e`.
The separately named r2 input added only that task-spec binding, preserving
all 24 IDs, order, source task bytes, caches, source code, protocol, and claim
rule. Corrected definition SHA-256:
`0ff88d4ff39237d62ecafb66c5ee96d06ba3cc750a58b36ad1b69daf033bc6bf`.
Its WSL cold copy matches the VPS by checksum.

The frozen campaign is
`/opt/are/evolution-runtime/g01-product-replication-r15/CAMPAIGN-FREEZE.json`
at SHA-256
`d68a1ab13122f5a0e4887e5e3fb41fbabe43c6265b301e7f88b4418424819eda`.
It binds the 413-file opt-in source tree at SHA-256
`27e101482c86019378d458bba586c6806b7922d6bcb69727466eeab47518ee8e`,
the one-checkout-per-task residency receipt at
`6126f19bf4d9ed73dfd3589a0067d3e9fad99f0b515eb9b5652488207f776f57`,
and the same GLM-5.3-flash 8K context-window / 160K per-arm budget used in
the prospective configuration. Each task has a distinct frozen control and
candidate plan. The freeze and inputs have private, checksum-matched WSL copies.

The guarded [serial coordinator](../research/g01-fast-live-v1/run-g01-r15-overlay-serial-wsl-r1.mjs)
passed its read-only 24-task and storage-floor check before dispatch. Fresh
same-account readiness returned tokenizer and tiny-generation HTTP 200/200 at
private receipt SHA-256
`08b50f735d2d2f607e7657783a21d7d54445e8be305a948fdcd04467521804a9`.
The live run uses zero automatic model retries and zero task replacement.
It stops on an unscored pair; after each terminal pair, the
[cold-copy verifier](../research/g01-fast-live-v1/archive-g01-r15-overlay-pair-wsl-r1.mjs)
restores and checksum-compares both effective source trees. It leaves VPS
lower checkouts, overlay uppers, mounts, and all prior scratch intact.

Pair 1 reached a scored terminal state and a verified WSL source archive at
SHA-256
`3d63157908bcd2a73d3bbff06adafdc53a097a7ab808c9386a1e109868ec9c95`.
Pair 2 was unscored, its source archive was verified, and the coordinator
stopped without attempting the remaining 22. No interim quality or efficiency
estimate was used to alter the protocol.

The predeclared narrow claim requires all 24 pairs to score, intact pre-score
seals, independent receipt/native-score audit, no unresolved label or score
integrity issue, and repository-stratified paired 20,000-resample 95%
intervals above zero for both ARE-minus-control Span-F1 and File-F1 and below
one for both known-token and summed-arm-time ARE/control ratios. Even if all
gates pass, it would support this fixed cohort only—not full ContextBench or
general ARE-product superiority.

## Open Questions

- What fresh, unexposed cohort and storage layout can support a successor
  24-pair campaign now that all r15 selected IDs are conservatively exposed?
- Can a prospective, opt-in mechanism pass end-to-end tests, then complete
  the successor validity and paired-analysis gates?
- What independent population could confirm a favorable successor finding
  before a broader product statement?
