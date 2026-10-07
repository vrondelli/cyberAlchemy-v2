# G01 live search-follow-through development screen

The [pre-dispatch freeze](FREEZE.json) fixed the opt-in
`intent-anchor-search-followthrough-r1` arm and one already-exposed zstd task.
The isolated VPS run completed `final_context_selected` at
`/opt/are/evolution-runtime/g01-search-followthrough-live-r1/attempt-01`.
It used 21 dispatched GLM calls, 81,450 known model tokens, and approximately
238.04 seconds from `started.json` to `result.json` file times. Maximum
reserved input was 5,841 tokens; adding the 2,048 output cap and two-token
margin yields 7,891, within the 8K envelope.

Six runtime-acquired base-source reads were confirmed in model-facing views
and terminally selected. They covered two `zstd_opt.c` regions, two
`zstd_lazy.c` regions, one `zstd_compress.c` region, and one
`zstd_double_fast.c` region. The C-file read followed the model's
`window.lowLimit` search at line 2437. Earlier model search hits for the
task-word `first` included C lines near 1342, but the symbol-only trigger
did not follow that query. The six-read cap was spent before later searches.

The pinned [native score](native-score.json) of the [sealed prediction](prediction.json)
was File-F1 `0.22222` (one of five gold files, four predicted) but **Span-F1
0 and Line-F1 0**. The selected C span was 2421–2453, outside the native gold
span intersections. The preceding source-neighborhood live screen had both
File-F1 and Span-F1 `0`, used 22 calls and 82,063 known model tokens, and
took approximately 255.51 seconds. The small efficiency differences and
file-discovery gain are exposed-task diagnostics, not controlled improvement.
Reject this arm as an accuracy candidate; do not promote it or claim a
prospective gain.

Remote SHA-256 receipts: `result.json`
`b5be425f8ad102ae91391b6566f99eba439aaa13c54bc4601729083dc3484b8a`,
`events.jsonl` `560ad4b20d6228b9825326283f87c341335b96ad52de29e6f4f525f5275bf56a`,
`prediction.json` `2e29bc106752f4692d59b7a38880777b2b7275619ef24751365567e13865fe92`,
and `native-score.json`
`c1c11f5ce70a6087ca14ca8f4008c1fe076d4928e792c79d17c414afa87fb4c3`.
The large raw journal and result remain on the VPS; compact prediction and
score are mirrored here.

Next hypothesis: prioritize exact search terms from the task objective and
diversify source reads by file before allowing repeated regions in one file.
Test the generic policy in fixtures and on an untouched task before treating
any accuracy or efficiency change as prospective evidence. Do not choose
parameters from gold locations on this exposed task.

## Open Questions

- Can objective-term priority avoid early budget exhaustion on tangential
  symbol searches without suppressing genuinely useful symbol evidence?
- Will the policy improve Span-F1 on an untouched task while preserving 8K
  validity and known-token efficiency?
