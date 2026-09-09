# Fresh initial episodes with container feedback

Product frontier: integrated feedback passed a retained-proposal sample. Generate four fresh initial proposals on existing fixtures and measure first-pass versus final acceptance separately. These are fresh model executions, not unseen tasks.

Product DAG: closed four-trial schedule and source freeze -> fresh v20 episodes -> checked first-pass results -> v3 container feedback on each submitted proposal -> separate final oracle -> joined accounting. Archive8K recent, scoring8K clear, pairs12K recent, long8K recent. Preserve all failures and unsubmitted trials. Stop on source drift or invalid evidence; never retry or replace a trial.

Caps: first-pass60 model/120 tokenizer attempts plus at most4 corrective model/8 tokenizer attempts; each initial episode580s with660s driver ceiling; correction uses existing readiness, 2048 output, 8K soft admission and60s final deadline. At most8 validation containers. Target:4/4 final verified repairs, completion gates preserved, continuity for every recycled initial episode, long8K must recycle, zero validation execution failures and verified worker cleanup.

Affected stages: benchmark orchestration and scoring only; existing candidate prompts/defaults unchanged. Agent runs authorized provider calls and owned workers; user owns activation and other workloads. Causal blockers: host/bridge availability, source or task drift, invalid reports or cleanup failure. Deferred residue: unseen tasks, replication, full task/window factorial, hidden-oracle isolation and default integration. CAV2-D65 candidate construction, no ontology dependency or authority effect.

## Open Questions

Does correction improve fresh first-pass outcomes without introducing regressions? Four existing-task episodes are insufficient to estimate reliability, and observable recycling cannot prove provider-internal compaction absent.
