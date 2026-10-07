# G01 identifier-aware eight-task replication

The [frozen definition](DEFINITION.json) selected eight previously unused source-only tasks across zstd C, GitHub CLI Go, Svelte JavaScript, and clap Rust (two per repository). It reused the identical identifier-aware candidate, native-convergence control, GLM setup, and predeclared attempt-level scoring policy from the prior four-task campaign. All eight pairs ran; no early outcome stopped the campaign.

**The campaign rejects its predeclared aggregate pass.** Seven pairs scored; the eighth, Svelte `575f5d76`, is invalid because the candidate stopped after nine model calls with `intent-anchor-episode.bounded-view-not-admitted`. This is neither a final-context prediction nor the exact `instrument.no-final-context` abstention eligible for policy zero. The frozen result remains invalid; it is not repaired by the favorable seven-pair subset.

Among those seven scoreable pairs, candidate macro Span/File-F1 was **0.373263/0.669048** versus control **0/0**. Summed known model tokens were **306,027 versus 561,991** (−45.55%), and summed measured arm duration **1,037.850 versus 1,634.073 seconds** (−36.49%). Six pairs passed all four task-level gates; zstd `35ed56f6` tied at zero Span-F1 while improving File-F1 and efficiency. No scored task had a Span-F1 regression. One control, Go `1ba303a5`, received the predeclared `instrument.no-final-context` attempt-level zero; the other thirteen scored arms used the pinned native scorer. These seven-pair figures are descriptive only and must not be reported as an eight-task win.

| Task | Pair status | Candidate Span/File-F1 | Control Span/File-F1 | Task-level result |
| --- | --- | ---: | ---: | --- |
| zstd C `35ed56f6` | Scored | 0 / 0.666667 | 0 / 0 | Span tie; other three gates pass |
| CLI Go `062a3b2e` | Scored | 0.518109 / 0.800000 | 0 / 0 | Four gates pass |
| Svelte `776ecce5` | Scored | 0.144129 / 0.250000 | 0 / 0 | Four gates pass |
| clap Rust `1db0c403` | Scored | 0.361518 / 0.500000 | 0 / 0 | Four gates pass |
| zstd C `9a7be8ba` | Scored | 0.382119 / 0.666667 | 0 / 0 | Four gates pass |
| CLI Go `1ba303a5` | Scored; control policy-zero | 0.637315 / 0.800000 | 0 / 0 | Four gates pass under attempt-level policy |
| Svelte `575f5d76` | **Invalid** | — | Native-scoreable | Candidate bounded-view admission failed |
| clap Rust `c9cd2b2c` | Scored | 0.569648 / 1.000000 | 0 / 0 | Four gates pass |

Failure diagnosis from the retained VPS receipts: the failing Svelte candidate had a pending two-search exchange at discovery call nine. Its assistant message carried 8,470 bytes of retained reasoning. Even after the admission helper deferred both tool results, the last measured prompt still had 5,127 input tokens and a 1,956-token retained-reasoning reservation. With the fixed 2,048 output allowance and 512 margin, the mandatory envelope remained above 8,000. This is an archive-view projection defect, not a provider outage; no tenth model call was made. The raw exchange remains preserved. A successor hypothesis should omit reasoning text from the *model-facing historical view* while keeping the raw exchange and accounting receipts immutable, then test it separately. This diagnosis does not change the frozen result.

The [campaign result](CAMPAIGN-RESULT.json), [freeze](CAMPAIGN-FREEZE.json), pair plans, seals, and pair results are local. Complete model, source, prediction, native-score, and failed-admission receipts remain on the VPS at `/opt/are/evolution-runtime/g01-identifier-itt-replication-r1`.

## Open Questions

- Can a reasoning-free historical tool-call view be admitted within 8K without changing source-delivery provenance or degrading selection quality?
- Does an independently frozen successor clear a new untouched cohort after the exposed Svelte diagnostic?
- Can G02's cross-layer acquisition gap be improved without losing its existing efficiency gains?
