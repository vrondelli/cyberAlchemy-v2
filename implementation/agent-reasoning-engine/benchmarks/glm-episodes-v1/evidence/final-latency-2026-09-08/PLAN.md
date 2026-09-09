# Final latency v14 fixed broader validation

Product frontier: v13 long 8K final responses succeeded in 9–14 seconds in three trials; the fourth hit its 30-second deadline. This is censored latency evidence, not proof a longer deadline will repair it. V14 inherits v13 and adds an opt-in 60000ms deadline only for tool-free model requests. Tokenizer and tool-enabled calls retain 30000ms. Client identity binds the deadline; receipts record the selected deadline; the agent requires the v14 setting. Overall arm remains 580 seconds. No retries or additional attempts.

Runnable product DAG: recorded latency -> scoped transport policy -> deadline and resumed episode tests -> full suite -> frozen sources -> 12 fixed trials -> checked reports -> results. Four tasks, each at 8K/10K/12K, alternating clear-v1 and recent-observations-v2 across task/window. This covers both policies overall, not a full factorial or matched causal comparison. Cap 160 model and 320 tokenizer attempts; 580 seconds per arm, 7920-second batch start deadline. Success target: all 12 correct repairs and completion gates, all recycled trials pass continuity, at least one observed recycle, positive headroom, no reservation overruns, all report/source checks valid. Zero retries, replacement or mid-batch changes. Every failure retained.

Operational tasks and owners: agent runs owner-authorized candidate tests and provider calls; product owner owns activation. Affected stages: transport, policy bindings, local checks, benchmark evidence. Causal blockers: source drift, invalid reports, provider availability. Deferred residue: replicated factorial validation, unseen tasks, provider internal compaction visibility, activation. CAV2-D65 owner-directed candidate construction; no ontology selector dependencies, authority promotion, default changes or fixture edits.

## Open Questions

Do any successful final responses need more than 30 seconds? Does v14 generalize beyond the tuned long 8K task? Recovery proves observable continuity only; provider-internal compaction remains unobservable.
