# G02 focused-hint R2c task-2 development result

Status: valid native task-2 result on 2026-09-26; **failed the predeclared
perfect-preservation gate**. [Manifest](../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-ranked-focus-r2c/RUN-MANIFEST.json).

| Task/arm | Span-F1 | File-F1 | Model tokens | Calls |
| --- | ---: | ---: | ---: | ---: |
| Task 2 historical DSH | 0.7869999050 | 0.5714285714 | 587,645 | 22 |
| Task 2 R2c ARE | **0.8863161138** | **0.6666666667** | **427,053** | 86 |
| Task 3 historical DSH | 0.5125361243 | 0.8 | 307,103 | historical row |
| Task 3 reused R2b ARE | **0.5239497752** | **1.0** | **225,745** | 53 |

R2c task 2 was valid and fully accounted, with no automatic retry or unknown
usage. It did **not** retain the prior ranked task-2 perfect 1.0/1.0 result,
so the [fixed task-2 screen](task2-score/screen.json) correctly rejects it.
Its terminal selection included four paths: the two serialization files plus
`doc/dom.md` and `element-inl.h`. The latter two reduced native file
precision against this evaluator's labels; `doc/dom.md` is nevertheless
plausibly relevant to the user task, which explicitly asks for documentation.
No conclusion about semantic uselessness follows from the labels alone.

The opt-in worker set `total_tokens=461176` and a 25,000-token finalization
reserve. **No `finalization-start` event occurred.** The model completed
naturally in 86 calls, so neither its lower spend nor its lower quality can be
attributed to reserve-triggered finalization. The worker seal records the
reserve parameter; it is configuration evidence, not treatment exposure.

The R2c task-2 and bound R2b task-3 rows both descriptively exceed their
historical DSH Span/File-F1 scores while using fewer tokens: 652,798 versus
894,748 combined model tokens, a **27.0411% reduction**. This is useful
exposed-cohort evidence for a possible comparative candidate, **not** a
predeclared joint screen pass, fresh matched confirmation, latency advantage,
full-benchmark result, or proof of occupied large-window behavior. The two
task rows came from separately labeled development runs; earlier failed R2 and
R2b task-2 costs remain recorded rather than hidden in this successful-row
sum.

The [R2c generation archive](generation-receipts-v1.tar.gz) contains exact
code, manifest, source session, full journal and result (SHA-256
`f20264152f3b6320764ce84ae6ec96a38083e40f9715d910b01376521700e8bc`).
The [task-2 native score](task2-score/native-score.json) is separate from
generation. The bound [R2b task-3 result](../g02-ranked-focus-r2b/RESULT-NOTE.md)
owns its own receipt archive. Original R2c evidence remains at
`/opt/are-benchmark-runs/g02-ranked-focus-r2c/` on the VPS.

## Open Questions

Will a prospectively frozen candidate retain both quality and token gains on
fresh matched tasks? Can terminal context selection improve precision without
excluding legitimately requested documentation? What are comparative wall time
and behavior when a large fraction of the configured context is occupied?
