# G02 16-call finalization screen

This exposed-task development hypothesis keeps the R2c ranked-source candidate,
the bounded-primer fix, the 1M configured window, the pinned JavaScript task and
the native scorer unchanged. Its only behavioral change is `maximum_calls: 16`
instead of 96 in the opt-in full-window profile. The existing 25K-token
finalization reserve starts the terminal phase with two calls left. Gold was
not mounted during generation; no DSH control was rerun.

Before dispatch, the pass criterion was a valid selection with native Span-F1
at least `0.3768548949307837`, File-F1 at least `0.14285714285714285`, fewer
than 82,817 known model tokens, no unknown dispatched usage, and less than
178.5 seconds. These are the valid DSH row's exposed-task values from the
[fresh paired probe](../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/g02-fresh-pair-20260926/RESULT-NOTE.md).
The 16-call cap is a hypothesis about stopping the long repeated-recovery
tail, not a deduplication mechanism or proof that the tail caused the cost.

`run_screen.py` binds the exact task, overlay, image, existing repository/cache
and credential path on the VPS. It writes `STARTED.json` before launch and a
settlement afterward. Native scoring and the immutable receipts are in the
[result note](../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/g02-callcap16-r1/RESULT-NOTE.md).

## Open Questions

Will the smaller call limit retain its advantage on genuinely unexposed
matched tasks? Does it help Go, where the prior DSH control did not produce a
valid score? How much of the saved cost came from finalization rather than
the particular model path in this one run?
