# G02 normalized clauses, 20-call exposed screen — accuracy gain, latency miss

The source-only task `e31ec45c` was already exposed by its fresh matched pair.
This development screen changed only the ranked-primer clause parser: it
decoded a valid double-encoded JSON string before splitting lines. The
unit tests passed. The first captured model request contained twenty hints,
including post-summary, client post-tools, and Write API schema paths;
the predecessor broad-primer run on this task had only six hints.

ARE completed a valid native selection in 19 model calls, 202,872 known
model tokens, zero unknown-usage requests, and 195.01 seconds. Native
Span/File-F1 was `0.4334687008`/`0.7777777778`. The same-task DSH control
scored `0.3161899079`/`0.5555555556` in 260,281 tokens and 157.15 seconds.
Accuracy and token consumption improved, but ARE was slower. The
[native screen](native-screen/screen.json) passes its F1/token subgates;
the complete accuracy-token-time gate fails. This is an exposed-task
development result, not a prospective comparative claim.

The [receipt archive](G02-NORMALIZED-CLAUSES-R1-RECEIPTS.tar.gz) has SHA-256
`ff2ade47d782c157383eecd83c3a2d28388fa8ccac443d866942af6d111742aa`.
It excludes source checkouts and credentials. VPS run root:
`/opt/are-benchmark-runs/g02-normalized-clauses-r1`.

Decision: test the same normalized acquisition with a 16-call cap on this
exposed task. Only an all-metric pass may advance to another untouched task.

## Open Questions

Can earlier finalization retain the extra source coverage and bring wall time
below the same-task control? Will any such gain generalize?
