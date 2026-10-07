# G01 cap-12 Svelte extension — four gates pass on one new repository

This [prospective extension](EXTENSION-FREEZE.json) ran source-only
`SWE-PolyBench__javascript__maintenance__bugfix__63513ada` on pinned Svelte
commit `8d7d0ff7dd7b248ca6d9b6b4cac098430c6e6ffa`. The cap-12 candidate
was unchanged after the earlier GitHub CLI dispatch. The
[control](CONTROL-FREEZE.json) and [candidate](CANDIDATE-FREEZE.json) each
completed a valid terminal selection, and [both predictions](PREDICTION-SEAL.json)
were sealed before native scoring. The [decision](PAIR-DECISION.json) applies
the extension's strict four-gate rule.

| Metric | Control | Cap-12 shortlist |
| --- | ---: | ---: |
| Native Span-F1 | 0 | 0.479265 |
| Native File-F1 | 0 | 0.333333 |
| Known model tokens | 84,841 | 41,078 |
| Run duration | 261.338 s | 188.494 s |
| Model calls | 27 | 13 |

The candidate used 51.58% fewer known model tokens and finished 27.87%
faster while improving both native quality metrics. It selected
`src/compiler/compile/render_dom/wrappers/IfBlock.ts`, which native scoring
recognized as a gold file; control selected only the unrelated example
`site/content/examples/03-logic/02-else-if-blocks/App.svelte`.

Full receipts remain under `/opt/are/evolution-runtime/g01-shortlist-cap12-svelte-r1/`.
Local artifacts: [control prediction](control-prediction.json),
[candidate prediction](candidate-prediction.json),
[control native score](control-native-score.json), and
[candidate native score](candidate-native-score.json).

This is a second independently scored, prospective four-gate pass with the
same cap-12 mechanism, now across GitHub CLI Go and Svelte JavaScript. It does
not retroactively convert the parent cohort's unscored zstd task into a pass.
Two scored tasks are still too few for the full ContextBench campaign or the
high-level ARE product claim.

## Open Questions

- Does the cap generalize to additional tasks and languages without the
  bounded-view and retained-reasoning errors seen on the separate zstd task?
- How much of the observed time reduction persists across repeated tasks
  under provider latency variance?
