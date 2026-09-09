# Expanded fixed v8 validation

Product frontier: measure frozen verified-completion-v8 across all four existing repository tasks, both retention policies, and 8K/10K/12K windows. Two repetitions of every cell = 48 trials. This adds retention-tool-pairs and all missing context combinations to the previous 12-arm batch; these are existing tuned tasks, not held-out tasks.

Runnable product work: validate local suite, pin sources, execute fixed schedule, independently check reports, analyze every outcome. DAG: local checks -> source freeze + manifest + criteria -> 48 sequential arms -> checked aggregation -> candidate pilot recommendation.

Bounds: 12 model and 24 tokenizer attempts per arm, 580 seconds per arm; aggregate 576 model and 1152 tokenizer attempts, 31,680-second batch start deadline. Zero retries or replacement arms. Stop on source drift or invalid report; keep provider and model failures and continue the declared schedule. No changes during the batch.

Predeclared pilot criteria (all required): all 48 reports valid; at least 44/48 verified repairs; each task/window group at least 3/4 repairs; every accepted candidate passes independently checked completion requirements; zero input reservation overruns; positive soft headroom on every admitted request; all four long-window 12K arms demonstrate continuity. Report continuity for recycled arms separately from arms that never recycle. Unknown provider usage remains unknown. A failed criterion means no pilot recommendation, even if other metrics pass.

Operational tasks and owners: agent runs authorized provider calls using existing credential references; product owner retains future default activation and deployment decisions. Affected stages: benchmark evidence only. Causal blockers: credential/provider availability, source integrity and local validation. Deferred residue: default changes, operational pilot, deployment, expanded unseen task construction. No new ontology selectors; native owner-directed CAV2-D65 boundary; evidence grants no authority.

## Open Questions

Does v8 meet these criteria across the wider matrix? Do smaller windows fit long observations? How much variation is provider availability? This batch cannot prove absence of provider-internal compaction or generalize beyond these four tuned fixtures. Future unseen tasks and more independent repetitions remain needed.
