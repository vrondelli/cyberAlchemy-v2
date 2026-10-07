# G01 objective-search fresh-task matched screen

The [source-only task](../../../../benchmarks/contextbench-v1/development-tasks/Multi-SWE-Bench__c__maintenance__bugfix__5b90848f.json)
was present in historical scoreability inventories, but a repository evidence
search found no prior prediction or native outcome for this instance. We fixed
the `intent-anchor-convergence-r3` control and
`intent-anchor-objective-search-r1` candidate, the same task, GLM profile,
8K limit, and source snapshot before either successful dispatch. Both used
the same generic malformed-tool-argument recovery and no candidate view.
The paired [prediction seal](PREDICTION-SEAL-r3.json) was written before
native scoring. Failed attempt 01 was a sparse-cache local-clone failure before
model dispatch; control attempt 02 ended after eight model calls on malformed
tool JSON without native export. Neither failed attempt enters this pair.
Attempt 03 used a full Git cache verified by a local-clone preflight.

| Arm | Native Span-F1 | File-F1 | GLM calls | Known model tokens | Elapsed |
| --- | ---: | ---: | ---: | ---: | ---: |
| [Control](control-native-score.json) | 0 | 0 | 22 | 79,212 | 231.63 s |
| [Candidate](candidate-native-score.json) | 0 | 0 | 23 | 81,959 | 284.11 s |

Maximum reserved input plus the 2,048-token output cap and two-token margin
was 7,821 for control and 7,987 for candidate, both within 8K. The candidate
made **zero** `objective-search-acquisition` events, so it delivered no
candidate-specific source reads. Its extra 2,747 tokens and 52.48 seconds
are descriptive run differences, not a measured mechanism cost. Both final
predictions missed the task's native gold file. This screen rejects the
current objective-search trigger as an improvement candidate and provides no
causal quality benefit; do not promote it.

The model searched for task-related API identifiers such as
`ZSTD_COMPRESSBOUND(srcSize)` with `path_prefix: "lib"`, and also searched
single-file paths such as `lib/zstd.h`. The trigger admitted only a bare exact
objective token and a prefix with at least two path segments. Those conditions
excluded every search. A next generic hypothesis may normalize API identifiers
and allow a bounded one-segment prefix while retaining path/file diversity;
the now-exposed task cannot serve as its prospective proof.

Remote attempt 03 receipt SHA-256 values are in the prediction seal.
Native score SHA-256: control
`cf697fe38a60c4b3eb4b7ad7ca143d4bb75f19c1c06cee873013c0b8b22886e0`,
candidate `2ecee7fc18fbb964c34f237e89bb6449eba51f02dfc34324a548bffe2e1ada58`.
Raw journals and results remain at
`/opt/are/evolution-runtime/g01-objective-search-fresh-r1` on the VPS;
predictions and native scores are mirrored here.

## Open Questions

- Can a task-grounded identifier match activate on a new, previously unscored
  task without spending its read cap on unrelated paths?
- Does that mechanism improve native Span-F1 and File-F1 while reducing known
  tokens and elapsed time against its same-task control?
