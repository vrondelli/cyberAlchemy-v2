# G02 narrow final evidence — exposed Go rejection

This screen reused the exposed Go task `05aad678` and the six-read
receipt-bound initial source packet. The only model-facing change from `r2`
was source guidance to check distinct issue requirements, re-read short
pinned-base line ranges before final selection, and include supporting sources
actually cited in the final summary. The candidate was pinned and checked
before dispatch; no gold input entered the run.

ARE completed a valid native selection in 16 model calls, 208,281 fully
accounted model tokens, and 202.12 seconds. All six packet reads were
confirmed by successful model receipts, with zero unmapped reads. The
[native screen](native-screen/screen.json) rejected both accuracy gates:
Span/File-F1 `0.24370`/`0.63636` versus the same-instance DSH control
`0.25710`/`0.73684`. ARE used 67.9% fewer tokens and 32.2% less wall time.

Compared with the preceding packet run, Span-F1 rose from `0.20528` to
`0.24370`, File-F1 from `0.55556` to `0.63636`, and tokens fell from 294,889
to 208,281; wall time increased 9.8 seconds. This is promising development
movement but not a quality win. The model selected ten paths, including
configuration fixtures, but still missed task-wide implementation and
integration evidence. No candidate is promoted.

[Receipt archive](G02-NARROW-FINAL-EVIDENCE-GO-R3-RECEIPTS.tar.gz) SHA-256:
`9e6879c12b117d116c282495c66b68f43229f6b83a6b4227b40db2ece78ef1d1`.
It excludes source checkouts and credentials. VPS run root:
`/opt/are-benchmark-runs/g02-narrow-final-evidence-go-r3`.

## Open Questions

Can clause selection cover late issue sections and split compound identifiers
without broadening source hints so much that the model loses precision? Any
improvement here still needs an untouched matched task.
