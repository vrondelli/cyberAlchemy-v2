# Recovery qualification68: completed, no valid selection

The original fixed ContextBench task1 ran on official DeepSeek Harness with GLM.
The proxy admitted17 paid requests and rejected one oversized request before paid
dispatch. Native recovery followed that denial. The final recovery summary hit
its2048-token limit; the harness exited1 and proxy exited0. Both are stopped.

All78,695tokens are accounted for; zero unknown requests. Nine summary calls used
46,671tokens (59.31%); eight task-work calls used32,024. No patch was attempted.
There is no valid final source selection, so no native score or comparative
savings claim. The full paired run remains gated on a valid control export.

The recovery fix is confirmed as a mechanism, but it is insufficient for task
completion. Pinned native dsh-compaction-basic/lib/index.js finishError also
rejects max-tokens checkpoints. Passing the truncated response through our proxy
would therefore not make that checkpoint valid. Summary content grew from3293
to6004characters; the provider emitted no reasoning_content in summary calls.

Evidence: evidence/QUALIFICATION-EXPORT.json contains every receipt and the token
split; evidence/FREEZE.json binds generation inputs. PLAN.json precedes dispatch.
OBSERVATION.json is a candidate research record; native registration remains
pending. Three new export tests cover unsettled runs, unknown accounting and
paid failed-call preservation. The earlier29 transport/export tests passed.

## Open questions

The next candidate tests bounded checkpoint content, with lossless source payload
factoring as a separate branch. See ../DEEPSEEK-CONTROL-FIT-DAG.md. No new paid
experiment has been launched from this observation.
