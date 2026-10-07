# G01 source-neighborhood upper-bound diagnostic

The [pre-score freeze](UPPER-BOUND-FREEZE-r1.json) fixed a provider-free
transformation of the two already-exposed HEN-11 v22 predictions: expand every
selected implementation-source span by 16 lines on either side using the pinned
base checkout. The original trajectory steps were unchanged. **These extra
lines were not read or delivered to GLM**, and this is not a live ARE result.

| Exposed task | Receipt-backed r3 Span-F1 | Undelivered upper bound Span-F1 | File-F1 |
| --- | ---: | ---: | ---: |
| 1, zstd | 0.012753 | 0.100899 | 0.250000 |
| 4, Svelte | 0.085323 | 0.182173 | 0.545455 |

The upper-bound mean Span-F1 is `0.141536`, versus r3's `0.049038` and the
historical HEN-10 development threshold `0.073272`. This is evidence that
nearby source lines have enough retrieval-score headroom to test a live
acquisition mechanism, **not** evidence that ARE achieved those scores. The
score would change if the model selected different reads after seeing the
neighborhood, so it is not a predicted live outcome.

The pinned native scorer ran in a reusable Python 3.11 container on the VPS;
image ID `sha256:e592d8dcd42b3218edd36dbf1b959ef5964f203d099f382a301e2ec9bf1941ff`.
The [scorer Dockerfile](../../../../benchmarks/contextbench-v1/Dockerfile.scorer)
builds that environment. The two frozen predictions and [task-1](task-1-native-score-upper-bound.json)
and [task-4](task-4-native-score-upper-bound.json) native score receipts are
retained beside this note. The VPS source/checkouts/cache remained at the
freeze's `source_run` path. The evaluator's transient network fetch failed,
but its pinned local cache prepared both exact-commit worktrees and each score
completed without error.
As an environment parity check, rescoring the unexpanded r3 inputs with this
new image reproduced the earlier native `final` metric objects exactly for
both tasks ([task 1](task-1-native-score-r3-recheck.json),
[task 4](task-4-native-score-r3-recheck.json)). Full native JSON was not
byte-identical because non-final fields differ; no broader equivalence is
claimed.

Next: test a new opt-in live arm that performs bounded `read_file` neighborhood
acquisition on the base revision, delivers those bytes to GLM inside each real
8K request envelope, and binds them to terminal evidence. Freeze the mechanism
before an untouched prospective task. Do not tune further on these two exposed
tasks or count this synthetic score as an accuracy, token, or efficiency gain.

## Open Questions

- Which live read trigger and selection limit will cover nearby lines without
  crowding the 8K prompt or exhausting the phase token budget?
- Does receipt-backed live acquisition improve an untouched G01 task relative
  to the fixed historical comparison, including token and wall-time costs?
