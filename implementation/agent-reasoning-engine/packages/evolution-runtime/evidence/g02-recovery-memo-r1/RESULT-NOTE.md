# G02 repeated-path memo — rejected

This exposed JavaScript treatment kept the diverse primer and 32-call limit
fixed, adding only a receipt-derived memo of repeatedly delivered source
paths to recovery prompts. The memo appeared in 28 of 31 dispatched request
captures. It did not reduce repetition: the trace shows 41
`recover_archived_read` results with nine distinct outputs, versus 22 with
three distinct outputs in the prior 32-call run.

The run sealed a valid selection in 31 calls, 110,575 known model tokens,
zero unknown usage and 241.38 seconds. Native Span/File-F1 was
`0.1771725397`/`0.2727272727`; the pinned DSH pair scored
`0.3960750270`/`0.4000000000` in 223.41 seconds. The
[native screen](native-screen/screen.json) rejects the memo on quality and
wall time. The difference in recoveries is descriptive, not a controlled
causal estimate from one stochastic model run.

The [receipt archive](G02-RECOVERY-MEMO-R1-RECEIPTS.tar.gz) has SHA-256
`2693f98e4837f2abb68024748df33948d1267bd7b263c8dbc6f6799e00c2e654`.
It contains the exact overlay, source-only task, model and transport receipts,
events and settlement, excluding source checkouts and credentials. Full run:
`/opt/are-benchmark-runs/g02-recovery-memo-r1` on the VPS.

Decision: reject the memo. Test demand-mode recovery next; it preserves
recovery capability but removes the expanded archive tools from initial
exploration requests.

## Open Questions

Does demand mode allow more direct source exploration and better native
quality? Would disabling recovery entirely be necessary, or would it damage
long-workflow continuity after compaction?
