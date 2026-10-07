# G01 identifier-aware four-language campaign

The [pre-dispatch definition](DEFINITION.json) froze four previously unused source-only tasks, one each from zstd C, GitHub CLI Go, Svelte JavaScript, and clap Rust. The identifier-aware candidate ran against native convergence on the GLM VPS. All four matched pairs were sealed before scoring and all eight arms produced final-context predictions accepted by the pinned native scorer. The predeclared `explicit-no-final-context-zero-r1` attempt-level policy was **not invoked** (zero policy-abstention arms).

The campaign **passes its frozen aggregate rule**. Macro Span-F1 improved **0.022165 → 0.193051** and macro File-F1 **0.071429 → 0.412500**. Summed known model tokens fell **306,794 → 185,449** (−39.55%); summed measured arm duration fell **886.292 → 653.846 seconds** (−26.23%). No task had a Span-F1 regression.

| Fresh task | Control Span/File-F1 | Candidate Span/File-F1 | Tokens, control → candidate | Seconds, control → candidate | Per-task four gates |
| --- | ---: | ---: | ---: | ---: | --- |
| zstd C `5adf8efc` | 0 / 0 | 0 / 0.400000 | 81,895 → 49,374 | 230.142 → 158.607 | No: Span-F1 tie |
| GitHub CLI Go `0f51ce0e` | 0.088662 / 0.285714 | 0.357410 / 0.500000 | 82,929 → 40,735 | 192.908 → 130.595 | Yes |
| Svelte JavaScript `c26fd1ab` | 0 / 0 | 0.259767 / 0.500000 | 60,453 → 46,459 | 231.730 → 215.523 | Yes |
| clap Rust `3a080ce7` | 0 / 0 | 0.155026 / 0.250000 | 81,517 → 48,881 | 231.513 → 149.122 | Yes |

The [campaign result](CAMPAIGN-RESULT.json), [freeze](CAMPAIGN-FREEZE.json), pair plans, seals, and pair results are preserved here. Full prediction, model, source, and native-score receipts remain on the VPS at `/opt/are/evolution-runtime/g01-identifier-itt-campaign-r1`. This is a positive four-task G01 replication for this candidate, **not** complete ContextBench or cross-benchmark ARE product proof. The earlier [distinctive-source campaign](../g01-distinctive-campaign-r1/RESULT-NOTE.md) remains rejected; its missing Rust control score was not retroactively repaired.

## Open Questions

- Does the candidate retain the advantage on a larger untouched ContextBench cohort and across repository strata beyond these four?
- Does the underlying mechanism, rather than an incidental task mix, explain the wins? Audit activation receipts without changing the frozen result.
- Do ARE×DSH and the third benchmark/evolution cycle show compatible gains under their own predeclared metrics?
