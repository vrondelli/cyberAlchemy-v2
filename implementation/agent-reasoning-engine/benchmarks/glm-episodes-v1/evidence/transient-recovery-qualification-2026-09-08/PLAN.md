# Explicit transient recovery qualification

CAV2-D65 product frontier: finish the small-window chapter after [baseline34/36](../small-window-qualification-2026-09-08/README.md) and [deadline-only32/36](../model-deadline-qualification-2026-09-08/README.md). All six final failures across those campaigns were dispatched model transport deadlines. The provider/network cause is unknown; longer deadlines alone did not establish recovery.

DAG: separate opt-in adapter contract -> durable physical/logical accounting -> GLM configuration and independent reporter -> cancellation, exhaustion, resume and full16-turn recycling fault tests -> one source freeze -> three12-condition rounds -> independent audit -> chapter decision.

The existing stateless adapter retains its no-retry promise. A separate bounded-recovery adapter admits one retry of identical bytes within a logical inference. GLM maximum_model_retries is explicit0..2, default0; this candidate selects2 across each initial trial, with at most one retry for any logical request. Retry after1second only for dispatched deadline/request/interruption failures or500/502/503/504 with no business code or generic500. Authentication, billing, rate limits, malformed output, tokenizer calls, cancellation and semantic/schema corrections do not retry. The adapter cannot invoke tools.

The client identity binds the policy. Every physical attempt carries logical sequence, attempt index, request hash and retry classification. Logical turn accounting projects one result per request; physical receipts retain all attempts and unknown usage. Retry reservation stays model-pending; crash or exhausted failure cannot resume blindly. Successful pause/resume retains consumed retry budget. Reusing the same stateless request does not add a second output to the context.

The candidate preserves60second model,30second tokenizer and580second arm deadlines; same prompts, four tasks,8K/10K/12K,16 logical calls at8K and12 at larger windows, unchanged token margins and one shared correction. Initial per-round caps184 model/320 tokenizer attempts include24 possible retries; correction adds12/24. Three-round caps588 model/1032 tokenizer attempts and72 public workers. No default activation, large-window work or failed-trial replacement. Source changes are forbidden during the campaign.

Acceptance remains36/36 final verified, all delivery gates and positive measured headroom, continuity for all recycled trials, actual long8K recycling each round, no validation execution errors and verified cleanup. Report initial quality, recovery attempts and correction quality independently. A failed complete run remains failed.

Stage ownership: agent owns this bounded implementation, exact validation workers and evidence; user owns activation and unrelated workloads. Source drift, incomplete accounting and unconfirmed cleanup block continuation.

Research: Z.AI distinguishes server failures from account/authentication/billing conditions in its [error reference](https://docs.z.ai/api-reference/api-code); the [official SDK](https://github.com/zai-org/z-ai-sdk-python) exposes explicit timeout/retry configuration. These references support bounded differentiated handling, not our numerical budget or a claim about the observed timeout cause.

## Open Questions

Does this exact policy meet36/36? How many live retries occur and recover? Provider billing for timed-out calls remains unknown. Known-task success does not establish held-out generalization, larger context support or visibility into provider-internal compaction.
