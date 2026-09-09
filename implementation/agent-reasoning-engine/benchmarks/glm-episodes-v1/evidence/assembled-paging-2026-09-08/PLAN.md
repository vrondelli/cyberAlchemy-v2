# Assembled paging v11 targeted refinement

Product frontier: preserve exact inspected requirement fields once paged source is fully assembled and hash-verified. V10 delivered all files in four 10K/12K trials but all four repairs failed; partial-source omission removed persistent requirements. V11 reconstructs those fields only after full pinned-hash validation and records source page call IDs. Existing attachment size cap stays 2048 bytes. Completion delivery remains independently confirmed; inspecting all pages does not itself satisfy delivery.

Runnable product work / DAG: v10 failure diagnosis -> exact assembled requirements projection -> missing-page/forged-hash tests -> full suite -> source freeze -> four fixed live trials -> checked aggregation. Candidate inherits compact v10 prompt, 5500-unit page limit, one final response reservation, 12 model/24 tokenizer cap and all token reservations.

Schedule: long workload 10K clear, 10K recent-observations-v2, 12K clear, 12K recent-observations-v2. Four trials; 48 model/96 tokenizer aggregate, 580 seconds per arm, 2640-second batch start deadline. Success target: 4/4 repairs and gates, no reservation overrun; report continuity separately because recent retention may not recycle. No retries, replacements, fixture/oracle/request edits, or changes during the batch. This is adaptive tuning, not independent validation. All earlier failed batches remain included in the evidence chain.

Operational tasks and owners: agent runs authorized bounded calls; product owner owns any future pilot/activation. Affected stages: local candidate and benchmark evidence. Causal blockers: local checks, drift, provider availability. Deferred residue: token-adaptive page sizing for 8K (not solved or retested here), model turn/page budget tradeoffs, unseen tasks, pilot/default changes. Native owner-directed CAV2-D65; no new ontology selectors or admission claims.

## Open Questions

Do reconstructed requirements restore correct repairs? Does extra prompt text fit at 10K? How should 8K paging coordinate measured token size with the fixed turn budget? Defaults remain unchanged; broader validation must follow any successful tuned example.
