# G02 compact-system follow-through screen R2

Status: stopped after task 3 on 2026-09-26. This was an exposed development
screen, not untouched confirmation. The [predeclared manifest](../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-follow-through-r2/RUN-MANIFEST.json)
required task 3 to reach DSH Span-F1 0.512536 and File-F1 0.8 within 261,037
model tokens before task 2 could run.

The single-file overlay changed the frozen compact-system text, the actual
rendered system message, rather than the orchestrator appendix discarded in
R1. A local and in-container `compactRequest` check verified that the
follow-through instruction appears in the rendered request. The candidate
named no benchmark-labeled path, supplied no source bytes, and changed no
scorer or gold data. Its SHA-256 was
`a486280ceb5c878011ebe0e21902de8ab1d940eddbb85a4aee3b17f3c9299fb0`.

Task 3 made 87 model calls, all with known usage, totaling **286,850 tokens**.
The run then ended `run_error` with `glm.billing-unavailable`, so it produced
no native export or score. It had already exceeded the predeclared token
ceiling by 25,813 tokens; the exact candidate therefore cannot pass this
screen even if billing is restored. Task 2 was not dispatched, as specified
by the sequence rule. No replacement or retry was made.

The live trace contains successful base reads of
`pkg/cmd/repo/view/view_test.go` as well as `view.go` and `http.go`; R1's task 3
read only the implementation files. This is a useful mechanism observation,
not a quality result or proof that the prompt caused an improvement. A final
selection was never sealed, and the native scorer was not run.

The [generation receipts archive](generation-receipts-v1.tar.gz) preserves
the manifest, exact overlay, frozen worker receipts, full events, result and
source session (SHA-256
`b55caebfba380b608241da1663695ff3940bd7e18bc0f3fe6a4b060a335960d6`).
The original generation tree remains at
`/opt/are-benchmark-runs/g02-follow-through-r2/` on the VPS; the archive is
mirrored at `/opt/are/evolution-runtime/evidence/g02-follow-through-r2/`.

## Next step and open questions

Do not resume this exact candidate: it missed the token gate and billing is
unavailable. Restore provider billing before any new GLM dispatch. The next
G02 hypothesis should be a bounded runtime follow-through rule with an
explicit read/token budget and an early stopping signal, then a fresh sealed
task-3 screen and task-2 preservation check if task 3 passes. Will that rule
recover task-3 recall without exceeding the fixed budget or damaging task-2
precision?
