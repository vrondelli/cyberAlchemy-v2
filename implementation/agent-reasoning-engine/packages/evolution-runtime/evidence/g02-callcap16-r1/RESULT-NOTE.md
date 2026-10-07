# G02 call-cap16 exposed-task screen — passed

Status: one JavaScript/NodeBB development screen completed and native-scored
2026-09-26. This is not fresh matched confirmation or patch-correctness proof.
The exact intervention is the [16-call profile and runner](../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-callcap16-r1/README.md).

| Measure | ARE call-cap16 | Pinned DSH control | Difference |
| --- | ---: | ---: | ---: |
| Native Span-F1 | 0.3956380144 | 0.3768548949 | +0.0187831195 |
| Native File-F1 | 0.2857142857 | 0.1428571429 | +0.1428571428 |
| Known model tokens | 58,670 | 82,817 | 29.16% fewer |
| Wall time | 142.68s | 178.5s | 20.06% less |
| Model calls | 15 | 10 | 5 more |

The [native screen](native-screen/screen.json) passed its predeclared validity,
quality and token gates with zero unknown usage; the separately checked wall
gate also passed. The worker settled with exit code 0 and a valid terminal
selection. The trace has four `recover_archived_read` results, one distinct
output (three repeats), versus 101 results and 12 distinct outputs in the
earlier 95-call ARE run. This supports the bounded-finalization hypothesis on
this exposed task, but does not isolate the cause or generalize to other tasks.

The [receipt archive](G02-CALLCAP16-R1-RECEIPTS.tar.gz) has SHA-256
`8383b0ef9b5d52ee11fc0563aa28991c46e1a176b56cc3af9855cce0ef001363`.
It contains the task-bound profile, command, settlement, worker result, events
and transport ledger. Source checkouts and the credential are excluded. The
full run remains on the VPS at `/opt/are-benchmark-runs/g02-callcap16-r1`.

Decision: promote this candidate to a separately selected fresh matched
comparison; do not claim broad ARE superiority or an occupied 1M-window
advantage from this screen alone.

## Open Questions

Will the improvement repeat on an unexposed cohort? Can both arms terminate
validly under the same source and cost envelope? Does a less abrupt recovery
memory mechanism improve quality beyond this call-cap result?
