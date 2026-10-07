# G02 task-path filter — prospective rejection; DSH quality unscorable

The candidate was frozen after a gold-blind filter applied to two exposed
sealed predictions. On the preceding no-archive task, the post-hoc filter
improved native Span/File-F1 from `0.51869`/`0.38462` to
`0.52041`/`0.41667`, with no new model calls. That was diagnostic only, not
qualification. The [rule](../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-task-path-filter-r1/filter-prediction.mjs)
was then frozen at SHA-256
`0045683aec458d0223dcb8c46c0c38b1d05f0f34ba32e77171f5be8e2f00890b`.

A fresh NodeBB task was selected deterministically from source-only parquet
columns; its literal ID had no prior match in the benchmark evidence, and its
commit was present in the VPS cache. ARE and DSH launched concurrently against
the same task and pinned image. Gold was absent from both generation arms.

ARE settled validly in 14 model calls, 154,310 known model tokens, zero
unknown-usage requests, and 202.02 seconds. Its unfiltered native
Span/File-F1 was `0.3051711122`/`0.6666666667`. The frozen filter removed
one selected file and **reduced** the prospective Span/File-F1 to
`0.2963829518`/`0.5882352941`. The
[filter diagnostic](are-filtered/diagnostic.json),
[unfiltered native score](are-original/native-score.json), and
[filtered native score](are-filtered/native-score.json) preserve that failure.
Decision: reject the filter; its exposed-task gain did not generalize.

DSH stopped without a final selection at `dsh-transport.request-budget`:
41 model calls, 988,911 known tokens, zero unknown-usage requests, and 455.26
seconds. The [transport accounting](DSH-ACCOUNTING.json) is complete, but
there is no valid DSH native quality score. Thus ARE's lower observed tokens
and wall time are descriptive against a stopped control, **not** a paired
accuracy/efficiency win. Do not impute a zero score or treat an unscored
control as proof of superiority. No model worker remains active.

The [receipt archive](G02-TASK-PATH-PROSPECTIVE-R1-RECEIPTS.tar.gz) has
SHA-256 `e139990187e48a038974213289b42faa5f413876cfaeabc68c856e655c1faec2`.
It retains exact code/task, ARE transport and run evidence, DSH transport/tool
receipts, and settlements, while excluding source checkouts, DSH working state
and credentials. VPS root: `/opt/are-benchmark-runs/g02-task-path-prospective-r1`.

## Open Questions

What mechanism can discover semantically relevant support files whose names
do not match task wording? Can a fresh matched control complete within a
predeclared budget on a more bounded task without task-shopping?
