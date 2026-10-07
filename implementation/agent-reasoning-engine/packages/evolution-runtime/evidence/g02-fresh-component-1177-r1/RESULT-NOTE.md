# G02 fresh Flipt component pair: rejected

The prospectively frozen, same-instance comparison completed on
`SWE-Bench-Pro__go__maintenance__bugfix__1177cd53` at base commit
`165ba79a44732208147f516fa6fa4d1dc72b7008`. Both predictions were
sealed before native scoring; see [freeze](FRESH-PAIR-FREEZE.json),
[pre-score seal](PAIR-PRE-SCORE-SEAL.json), [ARE prediction](candidate-prediction.json),
and [DSH prediction](dsh-prediction.json). Native scoring used the pinned
ContextBench wrapper, reference-patch fallback disabled.

| Arm | Span-F1 | File-F1 | Known model tokens | Wall seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE GLM treatment | 0.47204 | 0.50000 | 104,231 | 125.82 |
| DSH control | 0.54523 | 0.71429 | 773,892 | 437.36 |

ARE saved 86.53% of model tokens and 71.23% of wall time, but lost both
strict native quality gates. **Reject this candidate; no promotion.** The
treatment final context contained six files, all relevant, whereas DSH
selected ten relevant files. ARE's six-file precision is useful, but its
coverage is insufficient for this configuration-wide issue. The runtime
component selector inferred `tracing/jaeger` but made zero additions or drops,
so this pair tests the packet/episode workflow's generalization, not the
backend-filter adjustment seen in the exposed OCI replay.

Source receipts: [ARE results](RESULTS.json), [ARE settlement](result.json),
[selector receipt](selector-receipt.json), [DSH export](dsh-EXPORT.json),
[DSH settlement](dsh-SETTLEMENT.json), [ARE native score](are-native-score.json),
and [DSH native score](dsh-native-score.json). The pre-score seal pins their
prediction and accounting hashes. The run-local exporter did not call the
model or read gold; its first attempt failed because it was not in the pinned
snapshot, and a second read-only-container attempt needed a bounded `/tmp`
tmpfs for source-map projection. The successful export preserved the same
sealed DSH run. The bounded [DSH receipt archive](dsh-receipts.tar.gz)
contains transport, tool, state, export, and settlement records (SHA-256
`b033d70e0eb1bc2211e52ab638ff92c24ad3fb3cd2f87d5ed0dabbff428eb4e7`);
it excludes source checkouts and secret files.

## Next bounded hypothesis

Improve *source-relationship coverage* for configuration issues: before
model dispatch, derive a small receipt-backed packet of declaration,
defaults/schema, and example/test fixture neighbors from the pinned source
tree. Keep it constrained by source-only evidence and measured packet bytes;
do not use this task's gold paths as selection rules. Test it first on
source-only tasks and an exposed development screen, then freeze a different
untouched matched pair. No claim about the full ContextBench campaign or the
other benchmark objectives follows from this one pair.

## Open Questions

- Can a source-only relationship packet raise file coverage without losing
  ARE's token and time advantage?
- Will it improve both native quality metrics on a different untouched task?
