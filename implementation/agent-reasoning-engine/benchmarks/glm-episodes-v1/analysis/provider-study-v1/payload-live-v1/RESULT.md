# H23 controlled live result

**Frozen screen: supporting. All18 trials complete.** Controller session96620 exited0. Independent source/receipt/exposure/sandbox review and original-envelope reconstruction audit passed. No retries, transport failures or replacement rows. Total94 model and113 tokenizer calls, within240/480 caps.

| Condition | H21 baseline correct | H23 complete-payload view correct |
| --- | --- | --- |
| Split unpressured,8K/10K/12K | 3/3 | 3/3 |
| Observed near-boundary pressure,8K/10K/12K | 0/3 | 3/3 |
| Stronger neutral-padding pressure,8K/10K/12K | 0/3 | 0/3 |

Every H23 near-boundary task completed in seven model calls without recycling, with both independently revised facts in the final request. Baseline recycled after full-history rejection and lost both facts at first fallback. Baseline8K/10K proposals were independently verified incorrect;12K had no attributable final proposal and keeps unknown raw semantics. Baseline8K recovered only the route fact later, not both facts.

All six stronger-pressure trials blocked with recycling.fresh-context-too-large after one model call, before either decisive fact was delivered. They demonstrate early capacity rejection, **not retention failure after fact delivery**. These six missing proposals plus the12K near-pressure baseline yield seven unknown raw-semantic outcomes. No unknown outcome is converted into incorrect code. The frozen narrow screen requires actual recycling in stronger-pressure candidate rows, but does not establish successful fallback dispatch there.

The prior matched-token experiment measured316/320/319 saved input tokens at8K/10K/12K. This live comparison now demonstrates the corresponding completion benefit on this fixed task family. The experiment is a pilot, not model-general acceptance or full GLM qualification. Both arms use the same frozen H21 agent; only the tool-envelope adapter differs. Original source payloads, task fixtures, observed padding and reserves remain unchanged. Core/default sources and serving configuration remain unchanged.

[Independent review](review-final/report.json), [projection audit](projection-audit.json), [canonical research records](research.json), [DAG](../research/dag-payload-live-87-final.json):122 records/206 edges. The projection audit reconstructs132 original tool messages across51 candidate renders and verifies original/projected hashes and replay identity. Eleven attributable proposals received pinned Docker validation with verified cleanup; generated source was not executed on the host.

## Construction and operational lanes

Completed frontier: explained, live-tested near-boundary candidate improvement. Next product-construction work: independently replicate on held-out tasks and separately design a pressure condition in which both facts are delivered and a reduced request is admitted. Preserve this completed cohort; do not retune or replace its rows. Adoption, core integration, serving activation and publication remain separate user-owned decisions. No controller is active.

## Open Questions

Does the benefit replicate on held-out repository tasks and larger source payloads? What representation or recovery policy preserves needed evidence once complete source payloads genuinely exceed capacity? How should paged/unknown tool envelopes be supported? Full GLM readiness remains owned by the GLM finish plan.
