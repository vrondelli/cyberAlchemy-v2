# Bounded model deadline candidate

CAV2-D65 product frontier: finish small-window qualification after [baseline](../small-window-qualification-2026-09-08/README.md) achieved34/36 with two ordinary model requests timing out at30seconds. Hypothesis: allow those requests up to60seconds, without retry or increasing overall arm limits. This is a latency tolerance change, not evidence that every timeout would recover.

DAG: explicit model_timeout_ms configuration -> client identity and receipt binding -> offline transport/cancellation/config/report tests -> freeze source and schedule -> three full12-condition rounds -> independent aggregation and chapter decision.

Configuration admits30000..60000ms and defaults to the existing30000ms ordinary model timeout when omitted. Tokenizer remains30000ms. Final model deadline remains60000ms for the tested completion policy. The exact setting is bound in config, manifest, client identity and checked receipts. No new completion-policy version or task-specific branch.

Acceptance remains36/36 final verified; all delivery gates and positive headroom; continuity for every recycled trial and long8K recycling in every round; no public-validation execution errors and verified cleanup. Initial quality is separately reported. Same four tasks,8K/10K/12K,one shared correction per trial. Three rounds are predeclared before any live call. Caps516 model/1032 tokenizer attempts and72 public workers;580second arms, no automatic retries, failure replacements, activation or larger-context work. Sources remain frozen through all rounds.

Stage ownership: agent implements the bounded candidate, owns exact validation workers and records evidence; user owns activation and unrelated workloads. Source drift, incomplete accounting, unconfirmed cleanup and engine failures block continuation. A failed completed campaign remains failed and requires diagnosis before a separately frozen successor.

## Open Questions

Does60second tolerance yield a complete36/36 qualification? Does any completed call actually use the added time? Known-task success does not establish a latency SLA, held-out generalization or provider-internal compaction behavior.
