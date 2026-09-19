# Recovery freshness repair

Candidate implementation only. The original objective remains perfect quality and at least 15% cumulative model-token saving per benchmark under exact 8K admission. Frozen runs are unchanged. Open questions are listed below.

The actual-wire audit found 97 empty catalog presentations. The old controller pinned its first empty snapshot until a model-requested refresh. The additive `recovery-freshness.mjs` repairs that specific failure: when the pinned snapshot is empty and the receipt-bound archive first contains source evidence, the next prepare builds a populated snapshot automatically. No active read handle is invalidated because the previous page had none.

Nonempty snapshots remain immutable during traversal. A separate user message reports the number of genuinely new source observations and instructs the model to finish current pages and refresh. Observation identity includes source path, revision hash, line range and body; extra receipts or repeated prompts alone do not count as new evidence. The message must appear exactly once in the acknowledged wire request. The page and notice are both required for execution. Prepare failure revokes prior acknowledgement, and retained archives may not silently lose source observations. A monotone set remembers every identity accepted by successful preparation, not just those in the pinned page snapshot.

`demand-recovery-fresh.mjs` uses this same controller after opening. Its returned `messages` contains the complete required projection; callers must not insert only `page.model.text`. Entry mode still opens on request. Equivalent recovery semantics do not guarantee identical snapshot timing between eager and demand-driven visibility; that treatment difference must be declared, measured and kept separate from the original empty-catalog defect.

Thirteen tests cover successful receipt binding, failures, own-message/schema requirements, all 37 reads through multiple pages, refresh and stale handles, corruption, detached results, empty-to-populated transition, stable active handles despite newly delivered evidence, freshness-message binding and archive shrink rejection, including evidence that arrived after the pinned snapshot. Synthetic byte-based measurement exercises paging only; it is not token evidence.

The next source-only replay uses the four retained treatment archives at each of the 97 recorded presentation boundaries. Only earlier successful receipts can contribute source evidence. It makes no provider calls and does not predict model behavior. A byte-based fixture measurer may establish controller operation, but actual provider-token fit remains a prerequisite before live generation.

Product frontier: review and replay this repair, integrate both candidate projections, preregister the tokenizer comparison, and validate compact final persistence before a full-trajectory run. Coordinator owns implementation and evidence joins. D:/WSL live storage checks remain separate prerequisites; C: is excluded. No authority promotion, release or deployment is requested.

## Open questions

Will the model open or refresh when notified? Does the notification cost outweigh any savings? Can equal recovery semantics improve evidence discovery and final quality? The old 97 empty presentations cannot answer these questions. Synthetic/replay success cannot establish token savings or a perfect benchmark score.
