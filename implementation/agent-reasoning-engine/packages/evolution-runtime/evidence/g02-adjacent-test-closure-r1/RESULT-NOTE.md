# G02 adjacent-test closure R1 exposed development screen

Status: rejected at the predeclared task-3 screen on 2026-09-26. Task 2 was not
dispatched. [Prospective manifest](../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-adjacent-test-closure-r1/RUN-MANIFEST.json).

The worker exited zero with a valid native export after **95 calls** and
**236,348 fully known model tokens**. Native Span-F1 was **0.3895137421** and
File-F1 **0.5**, below the fixed task-3 gates of 0.5125361243 and 0.8.
No automatic retry occurred. The opt-in 261,037-token ceiling was not reached.

The static adjacent-test instruction appeared in 94 captured model requests,
but the terminal evidence packet contained only `view.go` and `http.go` reads.
No test source had been delivered. Consequently `runtime_added_read_ids` was
empty, and the new terminal closure had no source it could legitimately add.
The failure is at evidence acquisition before closure, not a scored test of
closure quality. An offline replay of the R3 sealed packet shows the policy
would have added its delivered `view_test.go` read; the historical perfect
task-2 packet has no adjacent test candidate, so that replay would add none.
Those replays are mechanism checks, not prospective scores.

The [generation archive](generation-receipts-v1.tar.gz) retains exact overlays,
manifest, source session, journal and result (SHA-256
`fa5cb702b445245d6a2bc6567d2557261c5134ddb458202522e8fddbbec75fbd`).
Separate native [score](task3-score/native-score.json) and
[screen](task3-score/screen.json) are local. Original generation evidence is
at `/opt/are-benchmark-runs/g02-adjacent-test-closure-r1/` on the VPS.

## Open Questions

Can the source-only acquisition stage surface and deliver a relevant adjacent
test earlier, without depending on repeated prompt nudges? Once it does, does
bounded terminal closure improve the final native score on fresh tasks?
