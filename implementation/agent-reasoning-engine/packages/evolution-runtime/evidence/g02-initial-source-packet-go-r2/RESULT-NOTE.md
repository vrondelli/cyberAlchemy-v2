# G02 receipt-bound initial source packet — exposed Go rejection

The updated VPS credential passed the presence check. A first launch (`r1`)
stopped before model dispatch because Docker could not create a new file mount
under the read-only `/repo` tree. The run-local `r2` overlay embedded the
hash-pinned helper in the episode file and completed normally.

The `r2` treatment used the already-exposed Go task `05aad678`, not a fresh
confirmation. It prefetched six pinned-base reads (9,271 source bytes),
including `internal/oci/file.go`, before the first model request. All six
read IDs were confirmed by successful model receipts, with zero unmapped reads
and zero unknown-usage dispatched requests. The model selected
`internal/oci/file.go` in its native final context, fixing that specific
behavioral omission from the prior neighborhood-hint screen.

The [native screen](native-screen/screen.json) rejected the candidate:
Span/File-F1 `0.20528`/`0.55556`, versus the same-instance DSH control
`0.25710`/`0.73684`. ARE used 294,889 known model tokens and 192.31 seconds
versus DSH 648,011 tokens and 298.07 seconds. This is 54.5% fewer tokens and
35.5% less wall time, but both accuracy gates failed. No candidate is promoted.
More actual source delivery is therefore not sufficient by itself: the final
selection still omits relevant files and spans. The next hypothesis should
address task-wide coverage and terminal selection, not merely increase the
initial packet or reuse this exposed task as confirmation.

A [gold-free offline replay](offline-summary-selection/RESULT-NOTE.md) recovered
three paths omitted from final selection and raised exposed-task File-F1 to
`0.76190`, but Span-F1 remained below DSH (`0.21164` using narrow reads;
`0.25710` required). This is diagnostic, post-run analysis, not promotion.

[Receipt archive](G02-INITIAL-SOURCE-PACKET-GO-R2-RECEIPTS.tar.gz) SHA-256:
`c9b8875696e3837dab0a0db55b4731ea2138e823b10799bcb812ba11774ec633`.
It excludes source checkouts and credentials. VPS run root:
`/opt/are-benchmark-runs/g02-initial-source-packet-go-r2`.

## Open Questions

Can a bounded, gold-free acquisition and final-selection mechanism cover
task-wide code, tests, schema, and configuration evidence while retaining the
token/time advantage on untouched matched tasks?
