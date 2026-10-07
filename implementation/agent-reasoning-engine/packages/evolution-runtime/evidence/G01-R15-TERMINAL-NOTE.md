# G01 r15 — terminal private campaign failure and exposed diagnosis

The frozen r15 r2 24-pair campaign is **terminal failed**, not live. Its
no-reclaim serial coordinator stopped after the second ordered task on
2026-10-02: **one scored pair, one unscored pair, 22 unattempted tasks**.
There was no automatic retry, task replacement, top-up, or retrospective
change to the frozen rule. Pair 2 (`task-02`, Ansible) ended `unscored` because
both control and candidate returned `run_error` with
`intent-anchor-integration.no-delivered-confirmed-read`. Neither produced a
native score. The frozen 24/24 validity gate is therefore false, regardless
of pair 1's result; no r15 superiority claim or 24-task interval estimate is
admissible.

The exact [definition and freeze](G01-R15-R2-OVERLAY-FREEZE.md) remain at
SHA-256 `0ff88d4ff39237d62ecafb66c5ee96d06ba3cc750a58b36ad1b69daf033bc6bf`
and `d68a1ab13122f5a0e4887e5e3fb41fbabe43c6265b301e7f88b4418424819eda`.
The [independent receipt auditor](../research/g01-fast-live-v1/audit-campaign-r11.mjs)
verified all 413 frozen source files, 24 task/plan/config bindings, pair 1's
pre-score seal and recomputed native File-/Span-F1, pair 2's exact no-score
failure shape, and the absence of run outputs for the 22 unattempted tasks.
Its immutable private VPS/WSL terminal audit is SHA-256
`2a235d72b1c9560802665acc361b68fa1730d5f33ad2f238f188cb5e4cdc5004`.

Both attempted pairs' effective overlay source trees were fully restored from
private WSL cold archives and checksum-compared with their live VPS views.
The archive hashes are
`3d63157908bcd2a73d3bbff06adafdc53a097a7ab808c9386a1e109868ec9c95`
(pair 1) and
`412963fa32045faef8db02872af20cff172b633abf3092cdb70964247db2a8ed`
(pair 2). Each archive manifest matches its terminal pair-result hash and
records zero VPS deletions. The entire campaign root was copied to
`/home/vlad_/are-benchmark-archive/g01-product-replication-r15/terminal/`;
a checksum dry run found no content differences. Prior scratch, pinned lower
checkouts, overlay upper layers, and campaign receipts remain retained.

## Exposed failure mechanism

The two arms each recorded one convergence-confirmed base read, but neither
exact native read ID appeared in the final branch-confirmed delivery join.
Each arm did deliver a shorter range on the same file and source hash. Code
inspection shows a base read can be confirmed when its tool result is
produced, before that result is shown to a later model request; terminal
mapping correctly rejects an undelivered confirmed read. This is a
source/protocol timing problem, not evidence that the overlay changed source
content.

In a separate **provider-free, evaluator-blind replay on this already exposed
task**, the [diagnostic](../research/g01-fast-live-v1/diagnose-g01-r15-delivered-read-r1.mjs)
checked support coverage and each delivered read's full-file SHA-256 against
the pinned base commit before binding it. The original mapping had **0**
delivered confirmed bindings in either arm; the proposed late binding mapped
**1** control and **2** candidate reads. Its private VPS/WSL receipt SHA-256
is `14532de549e292c5e69b7de108d0d3de953a33ecfcbc0f35f4b31d6ec8bfa61f`.
It made zero new model calls and opened no gold. This shows a plausible
mechanism, **not** a repaired frozen result, native score, quality gain,
cross-task transfer, or superiority.

A separately versioned, opt-in [late-binding helper](../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/late-bind-delivered-base-r1.mjs)
now checks that a branch-confirmed delivered read is covered by recorded hint
support and that its full-file hash matches `git show` at the pinned base
commit. The ordinary terminal mapping remains the default; only its exact
`no-delivered-confirmed-read` failure invokes the fallback when a future
freeze enables it. Focused terminal/integration tests passed **9/9** and
campaign preparation/pair tests passed **7/7**. The broader episode test was
interrupted after it stalled, so it is not counted as passed.

The new helper was copied into a separately named VPS shadow source, leaving
the r15 frozen source untouched. A provider-free replay of the **same exposed
task 02** reproduced the original mapping failure, then mapped **1 control**
and **2 candidate** delivered reads with base-hash verification. Its
[qualification script](../research/g01-fast-live-v1/qualify-g01-r15-late-binding-r1.mjs)
emitted only hashes and counts; the private VPS/WSL receipt SHA-256 matches at
`cda59b166c90a4fbbd23d8592a9d436d702bcd069da201bb703f6c8516bbe6f6`.
There were zero model calls, no gold reads, and no historical score changes.
This corroborates the timing mechanism on one exposed task; it does **not**
show transfer, answer quality, or campaign reliability. Before a new live
campaign, the opt-in path needs broader end-to-end tests and an exposed
cross-task check, while the separately selected fresh cohort needs full
preflight and a new freeze.

A later provider-free [no-op check](G01-R16-SOURCE-COHORT.md) confirmed that
all 26 arms in 13 exposed scored pairs from r14/r15 already map normally, so
this fallback would not be entered there (private receipt SHA-256
`6d9952e33a15cb4ac2982ee037c26515685e25afef971c81cccff275e8414d0a`).
That does not establish transfer on another failed task. A fresh r16
source-only cohort is now selected for preflight, not frozen or dispatched.

## Open Questions

- Does the opt-in rule transfer to another truly undelivered supported read
  without weakening evidence integrity? The 26 scored arms passed a no-op
  mapping check but did not exercise the fallback.
- What unexposed, clean-label source supply remains after conservatively
  excluding the 24 r15 selected IDs and other manifested G01/G02 IDs?
- Can a separately frozen successor complete 24/24 valid pairs and meet both
  quality and efficiency interval gates on that fresh population?
