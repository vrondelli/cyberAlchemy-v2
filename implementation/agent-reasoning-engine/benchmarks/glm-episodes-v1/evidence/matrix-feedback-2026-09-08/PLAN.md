# Frozen twelve-condition feedback matrix

Product frontier: four fresh existing-task episodes passed first and final evaluation. Expand to one trial for each of four tasks at 8K,10K,12K. Scoring uses clear retention; other tasks use recent-v2. This is a task/window factorial at fixed task-specific retention, not replicated sampling of each condition or unseen-task evaluation.

Product DAG: closed matrix validation and source freeze -> twelve initial v20 episodes -> independently checked first-pass report -> container v3 feedback preserving all twelve trials -> separate final oracle -> first/final/cost/continuity summary. Window blocks ascend; task order reverses at10K. No candidate tuning, retries or failure replacement during this batch.

Caps:160 initial model/320 tokenizer attempts plus at most12 corrective model/24 tokenizer attempts. Initial arms580s, subprocess660s, batch start deadline7920s. At most24 public-validation containers with existing resource/time/cleanup bounds. Readiness before every needed corrective call; output cap2048 and effective corrective soft bound7744. Unsubmitted trials remain failures without invented proposals.

Target:12/12 final verified proposals with all completion gates, continuity for every recycled initial trial, recycling on long8K, positive recorded headroom, no validation execution failures and verified worker cleanup. A failed target remains a valid result. Stage completion is separate from acceptance.

Affected stages: evaluator schedule validation/orchestration only. Prompts, candidate policies and validation semantics stay fixed. Agent runs authorized provider calls and owned containers; user owns other workloads and activation. Causal blockers: source drift, invalid reports, incomplete accounting, engine failure or unconfirmed cleanup. Deferred residue: within-condition replication, unseen tasks, broader retention comparison, capacity reservation, hidden-oracle isolation and default activation. CAV2-D65 candidate construction, no ontology dependency or authority effect.

## Open Questions

How do first-pass and final acceptance vary by window? Which failures are semantic, delivery, transport or execution failures? Does correction improve acceptance without regressions, and at what cost? This small matrix cannot establish production reliability or absence of provider-internal compaction.
