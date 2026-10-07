# G02 follow-through prompt screen R1

Status: failed score screen; intended treatment not exposed on 2026-09-26. This was a two-task exposed development screen,
not untouched confirmation. The [predeclared manifest](../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-follow-through-r1/RUN-MANIFEST.json)
fixed the task-2 preservation and task-3 recovery gates before dispatch.

The candidate overlaid exactly one frozen orchestrator file. It attempted to add
a generic source-only instruction to inspect a surfaced adjacent
test/fixture/integration path before finalizing. The compact-request layer
replaced the system message afterward, so this instruction was **not delivered
to the model**. It did not name benchmark-labeled paths, change source tools,
alter the native scorer, or inject gold/reference data.

| Task and arm | Span-F1 | File-F1 | Model tokens | Calls |
| --- | ---: | ---: | ---: | ---: |
| Task 2 prior ranked acquisition | 1.000000 | 1.000000 | 461,176 | 94 |
| Task 2 follow-through R1 | **0.447545** | **0.363636** | 363,581 | 95 |
| Task 3 prior ranked acquisition | 0.393657 | 0.800000 | 234,326 | 95 |
| Task 3 follow-through R1 | **0.393792** | **0.800000** | 253,433 | 95 |

The run fails both fixed quality requirements. Task 2 lost its perfect
precision and recall despite 21.16% fewer tokens than its prior ranked run.
Task 3 gained only 0.000135 Span-F1, remained below DSH's 0.512536, and used
8.15% more tokens than its prior ranked run. The joint ARE accuracy/token goal
is **not** established by this run. Because the treatment was not exposed,
the scores cannot estimate the effect of the proposed prompt.

## Mechanism observation

Task 2 read multiple test and integration files and selected nine files,
sharply reducing precision. Task 3 still read and selected only the two
implementation files. These behaviors cannot be attributed to the proposed
instruction: frozen `compactRequest` rewrote the whole system message to
`COMPACT_SYSTEM` after the overlay appended it. The journal's instruction-hash
event proves only that the overlay executed, not that the provider saw the
instruction. No evaluator-only file identity is eligible for generation input.

## Integrity and receipts

Both frozen-source tasks passed preflight: all 636 source bindings matched,
task hashes matched, and the single overlay loaded from its read-only mount.
The overlay SHA-256 was
`6643ef5a6c84386ad2e9639fab6cce459d8e66eb7e275cc7f00972dbaf406cb1`;
both journals recorded its instruction hash, but the compact request discarded
the instruction. Both Docker workers exited zero
with valid native exports. Each scored prediction exactly equals its sealed
export. Both model ledger digests recompute, all 190 dispatched calls have
known usage, and each ledger sum equals its 363,581/253,433-token seal. The
largest measured inputs were 11,446 and 4,607 tokens, so configured 1M
capacity was not materially occupied. The two frozen scorer bindings match;
both native scores reported no error.

The [generation receipts archive](generation-receipts-v1.tar.gz) contains the
overlay and manifest, frozen task/config/source package, full journals,
predictions, and model ledgers (272 entries; SHA-256
`4ca54f58c456b512dd0687d3d7510463892ac0f635c85ce73eaecf6d108588a7`).
The separate evaluator outputs are [task 2](task2-native-score.json) and
[task 3](task3-native-score.json). The original generation trees remain at
`/opt/are-benchmark-runs/g02-follow-through-r1/` on the VPS; the archive is
mirrored at `/opt/are/evolution-runtime/evidence/g02-follow-through-r1/`.

## Next hypothesis and open questions

First test the same generic instruction at the compact-system boundary and
verify its actual rendered request before spending model calls. If that still
fails, test a deterministic, bounded follow-through rule that inspects a
source-only adjacent candidate through the ordinary read tool and binds its
delivery before terminal selection, without forcing an irrelevant file into
the final context. The rule must have explicit budget cost and preserve task-2
precision. Can either mechanism recover task-3 recall while meeting its
261,037-token threshold?
