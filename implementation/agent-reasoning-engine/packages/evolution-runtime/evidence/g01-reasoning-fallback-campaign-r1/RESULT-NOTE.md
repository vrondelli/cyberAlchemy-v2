# G01 fallback-only reasoning-view campaign

The [pre-dispatch definition](DEFINITION.json) froze four untouched source-only tasks, one each in zstd C, GitHub CLI Go, Svelte JavaScript, and clap Rust. A single campaign command froze, dispatched, sealed, natively scored, and summarized all four matched pairs on the GLM VPS. The candidate preserved the ordinary reasoning-bearing historical view unless exact 8K admission denied it, in which case it could retry without reasoning. Complete raw exchanges remain on the VPS.

**The campaign rejects its predeclared aggregate rule:** three of four pairs scored. C/zstd was unscored because the control failed bounded-view admission and the candidate returned `glm.incomplete-output` at its fixed 2,048-token output cap. These are not eligible no-final-context abstentions. The three scored pairs each passed all four task-level gates, but cannot repair the invalid fourth pair. Their descriptive macro Span/File-F1 rose **0/0 → 0.182680/0.638889**; summed known model tokens fell **202,104 → 110,976** (−45.09%) and summed duration fell **823.098 → 484.098 seconds** (−41.19%). The controls scored zero on both accuracy metrics in all three pairs, so replication against stronger controls remains important.

| Task | Control Span/File-F1 | Candidate Span/File-F1 | Tokens, control → candidate | Seconds, control → candidate | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| zstd C `a47dfbbf` | Not scored | Not scored | — | — | Invalid pair: control bounded view; candidate output cap |
| CLI Go `3d1b3145` | 0 / 0 | 0.339542 / 1.000000 | 38,916 → 19,573 | 155.292 → 91.429 | Four-gate win |
| Svelte `03fc2f07` | 0 / 0 | 0.111782 / 0.250000 | 81,468 → 46,433 | 336.624 → 223.581 | Four-gate win |
| clap Rust `92158fba` | 0 / 0 | 0.096715 / 0.666667 | 81,720 → 44,970 | 331.182 → 169.087 | Four-gate win |

No candidate activated the reasoning-omission fallback: the 9, 7, 11, and 12 stable candidate views in C, Go, Svelte, and Rust respectively all used the ordinary `original` policy. Thus the scored gains cannot be attributed to this new mechanism. An exposed Svelte diagnostic at `/opt/are/evolution-runtime/g01-reasoning-fallback-svelte-diagnostic-r1` also completed without fallback activation. Provider-free tests cover both fallback branches, but live activation remains unverified.

The compact [campaign result](CAMPAIGN-RESULT.json), [freeze](CAMPAIGN-FREEZE.json), pair plans, prediction seals, and pair results are retained here. Full model and tool receipts remain at `/opt/are/evolution-runtime/g01-reasoning-fallback-campaign-r1`; frozen source is `/opt/are/evolution-runtime/g01-reasoning-fallback-source-r1`. No task from this campaign may be reused as untouched prospective evidence.

## Open Questions

- Can a shared, predeclared reliability policy keep both baseline and candidate scoreable after bounded-view denial or output-cap exhaustion without changing the substantive candidate comparison?
- Does the fallback ever activate on a prospective task, and when it does, does it preserve or improve native accuracy and cost?
- Will G01 gains replicate against controls that achieve nonzero native accuracy, and across a larger fresh cohort?
