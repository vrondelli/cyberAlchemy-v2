# H-R: source acquisition before patch exploration

Status: candidate design, not registered, implemented or admitted for live testing.
This is a separate successor to the receipt-budget experiment. It does not change
that frozen experiment or allocate additional live workers.

## Objective and evidence

Improve reusable evidence acquisition and retention inside GLM's measured 8K
request window. Preserve the perfect native quality objective, full cost
accounting and untouched confirmation. The original 15% savings target remains
unproven; no fresh controls are scheduled.

The reviewed frontier census found that confirmed observations reached projection
and mapped observations reached export, yet exported-union span coverage on the
three completed tasks was 62.35%, 30.30% and 0.76%. This motivates a search-policy
hypothesis, not a conclusion that retrieval will solve interpretation or output
selection. Evidence: [census](bounded-archive-frontier-descriptive-live-r2/POSTRUN-ANALYSIS.json)
and [review](bounded-archive-frontier-descriptive-live-r2/POSTRUN-REVIEW.json).

## Competing hypotheses

H-R: an explicit repository inventory and deterministic query-based source search
help the model discover relevant evidence that conversation-led search misses.
The mechanism should improve delivered source coverage and final native quality
within the existing cumulative model-token budget.

H-R-null: lexical retrieval repeats obvious matches, misses conceptual connections,
or consumes context that the model would use more effectively for exploration.
H-R-interpretation: relevant evidence is acquired but the model still fails to
interpret it or select the final spans.

Perfect-quality claim falsifier: any fixed task remains nonperfect. A provider
failure fails campaign completion but is not evidence about retrieval quality.
Mechanism observations: record acquisition, projected delivery and final selection
separately. More retrieved bytes or tool calls alone do not support H-R.

## Bounded proposed mechanism

1. Enumerate tracked source paths from the assigned repository and pinned base
   revision. Record path, byte length, content hash and exclusion reason. Exclude
   binary content and generated index files; make every exclusion visible in the
   inventory manifest. Never consult evaluator annotations, solution patches,
   previous gold-derived spans or hidden tasks.
2. Build a deterministic lexical index over source text and paths. Query terms
   come only from the task problem statement or an explicit model tool request.
   Pin normalization, stop words, scoring, tie-breaking and index limits before
   tests. Rankings must not depend on task identity or historical gold scores.
3. Expose a source-search tool that returns ranked, contiguous source spans,
   revision/content hashes and truncation metadata. Each span must be reconstructed
   from indexed bytes and must obey the existing bounded tool-output admission.
   A search hit is a candidate source, not proof of relevance or confirmed delivery.
4. Put a compact inventory summary and retrieval instructions in the initial
   request. The model makes actual tool calls; do not synthesize model decisions,
   fabricate tool receipts or grant delivered-evidence credit to unread index rows.
   Prompt fitting accounts for the added inventory and tool schema.
5. Continue the native issue-resolution attempt with existing read/edit/test
   capabilities, immutable archives and measured request admission. An edit must
   invalidate affected current-revision index entries. Base and current snapshots
   remain distinct. Reject stale current-source references.
6. Export only evidence supported by the existing receipt-confirmed delivery
   chain. Rank positions, index rows and omitted source text are not exportable
   merely because retrieval examined them.

This is new-source acquisition. Searching only previously observed archive entries
is a different mechanism and must not be presented as implementing this protocol.

## Protocol and DAG

Use the same four exposed tasks, GLM model/profile, 8K request admission,
96K total model tokens and 96 calls per task, 384K campaign ceiling, and at most
two concurrent workers shared with other candidate runs. Preserve the existing
exploration/finalization allocation and no-retry rule. Index construction itself
uses no model calls; all model-assisted query and interpretation tokens count.
There is no new control arm. Candidate comparisons remain descriptive.

Order:
1. Review this design and select exact index bounds and ranking specification.
2. Register the prospective hypothesis, counterhypotheses, experiment and DAG.
3. Implement index, source-search tool, snapshot invalidation and measured prompt
   integration as a separately named candidate.
4. Test omitted/binary/oversized files, deterministic ranking, stale revisions,
   source reconstruction, delivery-vs-retrieval distinctions and full production
   accounting. Include a fixture where the relevant file was never read before
   search; archive-only recovery cannot pass that test.
5. Freeze, independently review, qualify real tokenization and storage.
6. Run and score all four assignments, preserving failures and all model costs.
7. Audit native scores and acquisition/delivery/selection losses; retain, reject
   or revise the hypothesis. Untouched confirmation follows development success.

Product frontier: design review and native registration; implementation is pending.
Research coordinator owns construction. Research operator owns live source,
storage, qualification and process-settlement prerequisites. No release work
blocks this construction. Existing receipt-budget generation proceeds independently.

## Open Questions

- What index byte/file bounds cover the assigned sources within the WSL guard?
- Which fixed lexical ranking and contiguous-span size best fit the source-search
  contract without task-specific tuning?
- Does the native delivery binder support the new tool directly, or require a
  separately tested result adapter?
- How much 8K context does the inventory and added tool schema consume?
- Does improved acquisition survive interpretation and final selection?
