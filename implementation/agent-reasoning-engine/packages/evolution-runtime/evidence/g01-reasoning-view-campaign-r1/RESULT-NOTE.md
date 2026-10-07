# G01 reasoning-free view four-task campaign

The [pre-dispatch definition](DEFINITION.json) froze four untouched source-only tasks, one each in zstd C, GitHub CLI Go, Svelte JavaScript, and clap Rust. The candidate added reasoning-free model-facing historical views to the prior identifier-aware arm, while keeping complete raw exchanges. All four matched pairs ran against native convergence on the GLM VPS.

**The campaign rejects its frozen aggregate rule.** Three pairs scored; the Rust control ended with `glm.incomplete-output`, which is neither a native final context nor eligible no-final-context abstention. On the three scoreable pairs only, candidate macro Span/File-F1 rose **0.109842/0.222222 → 0.250309/0.666667** and known model tokens fell **176,168 → 156,375** (−11.24%), but summed measured duration increased **594.110 → 692.533 seconds** (+16.57%). This descriptive subset does not repair the invalid pair or establish a campaign pass.

| Task | Control Span/File-F1 | Candidate Span/File-F1 | Tokens, control → candidate | Seconds, control → candidate | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| zstd C `8bffb1b1` | 0 / 0 | 0 / 0.666667 | 81,799 → 62,356 | 205.172 → 279.066 | Span tie; duration regression |
| CLI Go `cedbb0cb` | 0.329527 / 0.666667 | 0.114180 / 0.666667 | 31,097 → 13,875 | 115.672 → 73.400 | Span regression; File-F1 tie |
| Svelte `01d1908e` | 0 / 0 | 0.636746 / 0.666667 | 63,272 → 80,144 | 273.266 → 340.066 | Accuracy gain; token/time regression |
| clap Rust `c763032c` | Provider error | Final context selected | — | — | Invalid matched pair |

The [exposed Svelte diagnostic](../g01-reasoning-view-svelte-diagnostic-r1/RESULT-NOTE.md) showed the view projection repairs the specific bounded-admission failure, but its native accuracy was 0/0. The prospective cohort now shows that globally omitting reasoning can change quality and time unfavorably. The successor hypothesis is a **fallback-only** view: preserve the original reasoning-bearing view when it fits, and omit reasoning only if that immutable view is denied under the exact 8K admission test. The raw exchange and receipts must remain intact in both cases. No completed result is reclassified or rerun.

Compact [campaign result](CAMPAIGN-RESULT.json), [freeze](CAMPAIGN-FREEZE.json), pair plans, seals, and pair results are retained here. Complete VPS receipts remain at `/opt/are/evolution-runtime/g01-reasoning-view-campaign-r1`.

## Open Questions

- Can a fallback-only view preserve the prior identifier-aware arm's ordinary behavior while resolving rare oversized reasoning exchanges?
- Why did the Rust control return `glm.incomplete-output`, and can a separately declared provider-reliability policy reduce future invalid pairs without post-hoc retries?
- Which G02 cross-layer source mechanism would raise NodeBB-like quality without losing efficiency?
