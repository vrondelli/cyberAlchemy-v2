# H-EN prototype and R5 replay review R1

Rejected for construction/source-integrity approval. Live admission remains false.

The worker inventories pinned Git OIDs but indexes worktree bytes without comparing them to those objects. An independent actual-Git fixture proves that assume-unchanged can conceal a tracked modification: both status checks pass and a hint for substituted text carries the original base commit. Fix pinned-object validation with an explicit checkout-normalization policy, preserving R1.

The synchronous parent/worker path also lacks demonstrated descendant process-group settlement. Blocking pipe reads happen before the worker’s five-second wait; parent timeout alone does not certify all descendants stopped. Timeout/cancellation and post-verification regressions remain necessary before integration.

The three provided fixture tests pass. Separately, R5’s saved arithmetic verifies: 4/4, 1/1, 1/1 and 3/3 missing labeled paths appear among hints, nine total. All four tasks return 80 hints, with 68/57/47/62 distinct paths. Query hashes reconstruct from task/selected-path facets generated before label comparison. Saved hint windows meet path diversity and native line/byte bounds. Seven task-1 hint hashes match checkout bytes but differ from raw Git blobs only by CRLF normalization; this is a byte-policy caveat, not evidence of malicious substitution in R5.

The result supports only exposed-cohort candidate-path coverage. Iterative R1–R5 tuning prevents treating the design as label-independent or untouched evidence. Hints provide no read credit, native quality or token-savings proof. No provider or evaluator calls were made during review. Exact source and evidence bindings are in the JSON.

## Open Questions

Resolve canonical bytes, source substitution immunity and descendant settlement first. Then measure bounded hint presentation, retain source receipt semantics, specify prospective transfer tests and preserve fixed budgets/two workers. Perfect quality, 15% savings and untouched confirmation remain unproven; controls stay suspended.
