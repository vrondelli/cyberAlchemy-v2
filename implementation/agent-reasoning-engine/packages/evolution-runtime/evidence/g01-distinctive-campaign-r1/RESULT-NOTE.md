# G01 distinctive-source four-language campaign

Status: complete, **predeclared aggregate pass rejected**. The [definition](DEFINITION.json), [campaign freeze](CAMPAIGN-FREEZE.json), and [verified result](CAMPAIGN-RESULT.json) bind four source-only tasks selected without reading gold/patch columns. Full model/tool receipts, pair plans, prediction seals, and pinned native scores remain on the GLM VPS at `/opt/are/evolution-runtime/g01-distinctive-campaign-r1`.

| Task | Native Span-F1 control → candidate | File-F1 control → candidate | Known tokens control → candidate | Seconds control → candidate | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| zstd C | 0.015981 → 0.104067 | 1.000000 → 1.000000 | 82,196 → 49,081 | 351.028 → 192.200 | Span and cost improved; file tied |
| GitHub CLI Go | 0 → 0.055615 | 0 → 0.250000 | 36,761 → 38,855 | 137.800 → 142.682 | Accuracy improved; cost and time regressed |
| Svelte JavaScript | 0 → 0.347903 | 0 → 0.285714 | 83,000 → 46,873 | 305.610 → 169.592 | All four task gates passed |
| clap Rust | Unscored control | Candidate selected context | — | — | Control `instrument.no-final-context`; pair invalid |

Across only the three scoreable pairs, macro Span-F1 was `0.005327 → 0.169195`, macro File-F1 `0.333333 → 0.511905`, summed known tokens `201,957 → 134,809` (−33.25%), and summed duration `794.438s → 504.473s` (−36.50%). These conditional aggregates do **not** satisfy the four-scoreable decision rule or prove a broad ARE advantage. There were no scored Span-F1 regressions, but the Go efficiency regression and C file-score tie remain visible.

The distinctive acquisition step activated in Svelte (two searches, two reads) and Rust (three searches, one read). It did not activate in C or Go; their candidate changes therefore cannot be attributed to that step specifically. Svelte is one prospective cross-repository four-gate win for the fixed arm. No task, source, or rule was changed after dispatch.

## Open Questions

- Should a future, separately frozen protocol score explicit control abstention as zero rather than make the pair unscored? The current campaign must not be reinterpreted post hoc.
- Which bounded stopping rule preserves the Svelte accuracy gain while eliminating the Go token/time regression?
- Does distinctive acquisition replicate on untouched tasks where it actually activates, across more than one repository?
