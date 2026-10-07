# G02 focused source packet — exposed Go live rejection, offline joint lead

The live treatment preserved the r3 primer and narrow-final guidance, then
added two issue-derived pinned-base reads to the six-read initial packet:
`cmd/flipt/bundle.go` and `build/testing/integration.go`. A gold-free preflight
verified eight reads totaling 11,410 source bytes. In the live run all eight
read IDs bound to successful model receipts, with zero unmapped reads.

ARE completed valid native selection in 14 model calls, 167,007 fully
accounted tokens, and 154.95 seconds. The [live native screen](native-screen/screen.json)
passed Span-F1 (`0.28220` vs pinned DSH `0.25710`) and efficiency (74.2%
fewer tokens; 48.0% less time), but failed File-F1 (`0.47619` vs DSH
`0.73684`). The model did not select the two focused paths, and selected
alternative Git/local storage paths. The live candidate is rejected.

A separate [post-run, label-free selector replay](offline-backend-selection/RESULT-NOTE.md)
used the issue's explicit `storage.type: oci`, confirmed packet read IDs, and
path structure to add the focused/OCI packet reads and omit selected Git/local
backend siblings. On this exposed trajectory, unchanged native scoring rose
to Span/File-F1 `0.27544`/`0.76190`, above DSH on both metrics, at the same
model cost. This is **not** a prospective or fresh benchmark pass: the rule
was designed after inspecting this task's results. No candidate is promoted.
Only one of the 904 source-only development tasks has the exact
`storage.type: <name>` pattern, so the rule needs a broader, predeclared
semantic binding and an untouched matched task to test generalization.

[Receipt archive](G02-FOCUSED-PACKET-GO-R5-RECEIPTS.tar.gz) SHA-256:
`43ccd3d226e986e548da72d18870c38a5570371d817ef5fa95c53ec43adffac2`.
It excludes source checkouts and credentials. VPS run root:
`/opt/are-benchmark-runs/g02-focused-packet-go-r5`.

## Open Questions

How should the runtime identify a task's active component and competing
sibling implementations without hardcoded issue syntax or label leakage?
Can a frozen selector plus focused packet win on an untouched matched task?
