# G02 call-cap16 fresh pair — rejected on quality

Status: one source-only JavaScript/NodeBB ARE–DSH pair was generated and native
scored on 2026-09-26. Both arms used GLM-5.3-Flash on the same VPS, pinned
commit `8fd8079a84d8e71ab02eaa69ef15cb33fcea85c7`, with no gold mounted
during generation. The task ID had no literal experiment-record match in the
checked repository paths outside the generic acceptance list; compressed or
external exposure is not ruled out. The selected Go task was **not run** after
the JavaScript quality gate failed.

| Measure | ARE, 16-call cap | DSH control | ARE minus control |
| --- | ---: | ---: | ---: |
| Native Span-F1 | 0.0889283000 | 0.3960750270 | −0.3071467270 |
| Native File-F1 | 0.1739130435 | 0.4000000000 | −0.2260869565 |
| Known model tokens | 45,253 | 482,228 | 90.62% fewer |
| Arm wall time | 119.45s | 223.41s | 46.53% less |
| Valid selection | yes | yes | both valid |

This pair **rejects** the 16-call candidate for the joint accuracy, token and
time goal despite its large efficiency advantage. Both native score files are
under `exports/`. The ARE arm used 15 model calls and selected five files;
DSH selected seven. ARE read dropdown templates repeatedly, while DSH covered
notification and topic client modules that ARE missed. The initial ARE primer's
top eight hints were template-heavy. This is a concrete diagnosis, not proof
that a primer change alone will restore quality.

The [receipt archive](G02-CALLCAP16-CONFIRM-JS-RECEIPTS.tar.gz) has SHA-256
`71c8351e4f229f0dab0cff9e4924e49a1bad4ffdefc10e405a0a89cb874ebb1e`.
It includes source-only task inputs, exact candidate code, command and
settlement receipts, ARE transport ledger and DSH transport/tool records.
Source checkouts, DSH working state and credentials are excluded. The full
run is retained on the VPS at
`/opt/are-benchmark-runs/g02-callcap16-confirm-r1`.

Decision: retain the exposed-task success as development evidence, but reject
call-cap16 as a promoted G02 candidate. The next fast hypothesis should
improve initial source-hint diversity, then screen treatment-only on this now
exposed JavaScript task against its pinned DSH row. Do not spend calls on the
unrun Go slot for this rejected candidate.

## Open Questions

Can a source-diverse primer cover notification and topic modules within a
bounded call budget? How many calls are actually needed to retain native
quality on broad multi-subsystem issues? Will any repaired candidate hold its
quality and efficiency advantage on another fresh matched pair?
