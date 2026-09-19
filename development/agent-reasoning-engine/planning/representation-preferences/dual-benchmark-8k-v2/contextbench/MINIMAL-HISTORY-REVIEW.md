# Minimal-history adapter review

Approved as an offline adapter. All four tests pass independently; an additional one-exchange probe confirms the now-corrected documentation.

The adapter reuses the frozen complete-exchange projector and validates the full executed history before pruning. It preserves retained assistant reasoning and tool fields, entire results and complete parallel exchanges without mutating input. Older malformed/orphan/incomplete or duplicate-ID exchanges cannot be hidden by pruning. There are no summaries, silent repairs or injected persistent notes.

The policy is structural, not a token bound. Zero exchanges preserve plain assistant messages; one keeps messages from that exchange onward; thereafter the newest two complete exchanges and following plain messages remain. Oversized retained exchanges stay intact and require native admission to reject them if necessary.

Exact transitive sources and corrected documentation are bound in the JSON review. No provider calls or frozen edits occurred.

## Open Questions

MINIMAL-HISTORY.md owns the complete baseline episode, capture preservation, finalization budget, common comparison/history semantics, real tokenizer qualification and twelve-outcome campaign freeze. No live execution is admitted.
