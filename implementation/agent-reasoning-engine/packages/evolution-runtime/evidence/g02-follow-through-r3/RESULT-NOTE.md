# G02 follow-through R3 exposed development screen

Status: task 3 failed the predeclared quality gate on 2026-09-26; task 2 was
not dispatched. [Manifest](../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-follow-through-r3/RUN-MANIFEST.json).

The candidate produced a valid native export in **16 model
calls, 57,296 tokens**. Native Span-F1 was **0.4651219021** and File-F1 **0.8**.
The fixed task-3 gate was Span-F1 at least 0.5125361243, File-F1 at least
0.8, and no more than 261,037 tokens. Thus the candidate is much cheaper but
does not establish the joint accuracy/efficiency objective. All model usage
was known, with no retry or provider error.

The intended conditional checkpoint **did not appear in any rendered provider
request**. The synthetic local boundary test was insufficient because the live
history projection changed what `compactRequest` could observe. The generic
static instruction to inspect an adjacent test was exposed, so this run tests
that instruction, not the conditional handoff. The model read an adjacent test source, and terminal review listed that
delivered base observation as handle `h1`. Its final selection omitted `h1`
and selected only the two implementation paths. The native trajectory scored
the earlier test read as an observation, but the final score correctly uses
only the sealed selection. This is a mechanism observation, not permission to
retroactively alter the prediction.

The [generation receipts](generation-receipts-v1.tar.gz) preserve the exact
overlay, manifest, source session and full run (SHA-256
`a19ffe5efaba33051479ce3f5b7867c911e6b886d52173f78891fd02e5665311`).
The separate native [score](task3-score/native-score.json) and
[screen](task3-score/screen.json) are local. Original generation evidence
remains at `/opt/are-benchmark-runs/g02-follow-through-r3/` on the VPS.

## Open Questions

Will a source-only terminal review instruction retain truly relevant adjacent
test evidence without including unrelated tests or harming task-2 precision?
Any future checkpoint needs an episode-state binding and a live rendered-request
exposure test, not a count over projected prompt history.
