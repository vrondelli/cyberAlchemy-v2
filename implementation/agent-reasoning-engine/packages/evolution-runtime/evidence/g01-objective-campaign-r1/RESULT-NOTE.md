# G01 objective-anchor four-language campaign r1

Status: completed, **predeclared campaign pass rejected**. The new opt-in
`intent-anchor-terminal-shortlist-objective-r1` arm was frozen against native
convergence on four previously unexposed, source-only ContextBench tasks.
The [definition](DEFINITION.json), [campaign freeze](CAMPAIGN-FREEZE.json),
and [machine result](CAMPAIGN-RESULT.json) bind the task order, code hashes,
pair plans, prediction seals, and pinned native scores. No exact gold was
inspected before dispatch.

| Task | Control Span/File-F1 | Candidate Span/File-F1 | Known model tokens, control → candidate | Duration seconds, control → candidate | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| zstd C `2b5e5e23` | 0 / 0 | 0.042403 / 0.800000 | 83,271 → 39,601 | 180.456 → 136.154 | All four task gates pass |
| GitHub CLI Go `0498ad7f` | 0 / 0 | 0 / 0 | 83,593 → 40,064 | 256.122 → 145.082 | Cost gain; accuracy tied at zero |
| Svelte JavaScript `00fd24ea` | unscored | unscored | — | — | Control exhausted non-tool corrections; candidate selected no final context |
| clap Rust `0e4346f7` | 0 / 0 | 0.157197 / 0.500000 | 82,482 → 81,575 | 208.391 → 190.373 | All four task gates pass; small cost margin |

Only three of four pairs scored, so the all-pairs-scoreable gate fails. On
those three, descriptive macro Span/File-F1 moved
`0/0 → 0.066533/0.433333`, summed known model tokens
`249,346 → 161,240` (35.33% lower), and summed duration
`644.969 → 471.608` seconds (26.88% lower). These pooled values do not
override the frozen validity rule. Two tasks passed all four per-task gates;
the Go task was cost-only. This is directional evidence, not a complete
ContextBench or cross-benchmark ARE proof.

The Svelte candidate's only terminal offer was a 2017 CSS blog post; there
were zero eligible wide source ranges. GLM returned an empty handle list for
the `nth-of-type` parser task, which the exporter reported as
`instrument.no-final-context`. The new substantive-read gate had been
satisfied by the generic issue sentence “this also fixes the following
along the way,” not by a distinctive parser source. The control separately
ended with `intent-anchor-episode.non-tool-corrections-exhausted`.
Do not force the unrelated blog handle or retroactively score this pair.

Compact local receipts include every pair plan and freeze, each pair result,
the three prediction seals, and their prediction/native-score files. Full
trajectories and model receipts remain at
`/opt/are/evolution-runtime/g01-objective-campaign-r1` on the GLM VPS.

Next hypothesis: extract task-distinctive identifiers from the source-only
issue text (for example `nth-of-type`), require those signals in source
acquisition, and allow a bounded, receipt-delivered search/read step before
early finish when the shortlist contains only generic or non-source paths.
Keep abstention honest if that step fails. Test the new arm on exposed tasks
first, then freeze untouched tasks for any gain claim. Also track control
non-tool validity independently of candidate quality.

## Open Questions

- Can distinctive-term acquisition improve accuracy without erasing the
  observed token and duration savings?
- How often do short title-only tasks, such as the Go hostname task, lack
  enough lexical signal for the current anchor gate?
- Does the Svelte control's non-tool correction failure reproduce under a
  generic harness repair, and should validity be a separate primary metric?
