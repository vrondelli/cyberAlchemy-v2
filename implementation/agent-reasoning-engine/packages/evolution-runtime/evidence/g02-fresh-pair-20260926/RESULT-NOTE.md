# G02 fresh two-task paired probe — rejected candidate

Status: generation and native ContextBench scoring completed 2026-09-26. Both
arms used GLM-5.3-Flash on the same VPS and pinned source commits. The ARE arm
was the R2c ranked-source candidate plus a bounded-primer compatibility fix;
DSH was the pinned 0.1.5-rc.2 external control. This is a prospective
two-task development probe, not a full benchmark result or proof of patch
correctness. The source-only task selection and limitations are in the
[run README](../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-fresh-pair-20260926/README.md).

| Task | Arm | Native Span-F1 | Native File-F1 | Known model tokens | Calls | Wall time |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Go / flipt | ARE | 0.2489826677 | 0.3478260870 | 141,647 | 29 | 310.3s |
| Go / flipt | DSH | no valid selection | no valid selection | 944,969 | 29 | 267.3s |
| JavaScript / NodeBB | ARE | 0.3777138118 | 0.3750000000 | 393,999 | 95 | 953.2s |
| JavaScript / NodeBB | DSH | 0.3768548949 | 0.1428571429 | 82,817 | 10 | 178.5s |

The Go DSH control exhausted its 1M-token transport budget before dispatching
the next model call and before a terminal selection. Its 944,969 tokens are
accounted, with no unknown usage, but it has **no native quality score**. ARE
completed that task with a valid selection using 85.01% fewer tokens, yet took
longer. Do not turn the missing DSH quality score into an invented F1 value.

On the one fully scoreable pair, JavaScript, ARE improved Span-F1 by only
0.0008589168 and File-F1 by 0.2321428571, while using **4.757×** the model
tokens and **5.34×** the wall time. The candidate therefore fails the joint
accuracy/token/efficiency objective. A two-task total would mix one valid pair
with one incomplete control and must not be reported as matched token savings.

The JavaScript ARE trace contains 101 `recover_archived_read` tool results but
only 12 distinct output digests (89 repeated outputs). Go has 14 recovery
results but only two distinct digests. This is a concrete successor hypothesis:
retain or present a compact receipt-bound memo of already recovered archive
handles and test whether it reduces repeated recovery calls **without** losing
source coverage or native quality. The counts identify repetition, not its
cause; the next experiment must test the mechanism prospectively.

The first VPS attempt failed on partial-clone/Git-safe-directory setup with
zero benchmark model calls. The second failed before dispatch because ARE's
long problem statement exceeded its ranked-primer query limit and DSH's proxy
used an 8K request profile. The third attempt's original DSH proxy then failed
its 1M-window constructor with a sub-1M token budget, also before dispatch;
only the separately labeled DSH repair slots made paid control calls. These
attempts are retained, not recast as scored runs. The sealed run has no active
workers.

The [corrected receipt archive](G02-FRESH-R3-RECEIPTS-R2.tar.gz) has SHA-256
`cd0a12b0643a704b85b8064ac620565612e0380eb5bbcfd5480440f3a2066c33`.
It includes exact task inputs, candidate overlays, ARE run ledgers, settlements,
and native exports, excluding source checkouts/caches, DSH working state, and
secret material. The original archive is retained but its broad `state`
exclusion also omitted nested ARE transport ledgers; use the corrected archive.
Per-arm predictions, native scores, and the invalid Go control seal sit in
this directory. Original full run evidence remains on the VPS under
`/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926/`; the first two
failed attempts remain under matching `g02-fresh-pair-20260926` and
`g02-fresh-pair-r2-20260926` roots.

## Open Questions

Can a receipt-bound recovery memo cut the 89 repeated JavaScript recoveries
and most of the 95 model calls? Will a new candidate preserve JavaScript
quality while using fewer tokens and less wall time than DSH? Does the Go
completion advantage recur when the control has sufficient budget to score?
