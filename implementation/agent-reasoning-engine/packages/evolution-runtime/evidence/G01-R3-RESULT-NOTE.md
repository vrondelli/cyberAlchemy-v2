# G01 r3 — fresh 8K ContextBench confirmation

Status: **terminal, privately analyzed, and independently receipt-audited, 2026-09-29 UTC**. This separately frozen 24-pair jq/cli/Svelte/clap cohort tested ARE's context selection against the native intent-anchor control with GLM-5.3-flash under the same 8K window and symmetric receipt-backed `non_tool_terminal_after_convergence` policy. It is not a repair, top-up, or pooled extension of G01 r2.

All **24/24 attempts** reached terminal pair receipts. **21/24** have both sealed native scores. Three Svelte controls ended without a final selection, while all three corresponding ARE arms selected a final context:

| Frozen pair | Control failure |
| --- | --- |
| `javascript-svelte-2180c91a-18` | `intent-anchor-episode.budget-exhausted` |
| `javascript-svelte-1e29a469-22` | `glm.request-failed` |
| `javascript-svelte-2a93ee66-23` | `unbound-retained-reasoning` |

These are distinct failure classes, not automatically interchangeable or eligible for silent retry. No pair was replaced. The frozen 24/24 native-scored completeness gate **failed**, so `campaign_pass` and `directional_product_headline_admissible` are both **false** despite favorable valid-pair results.

Receipt-level diagnosis further separates the failures. The budget-exhausted control remained in discovery after 20 model calls and 82,353 known tokens against the 96,000-token arm cap; it did not produce a final context. The `glm.request-failed` control's last model request was dispatched with a 120,000 ms timeout and returned no HTTP status after 120,197 ms, with zero automatic retries; this is a transport-settlement failure, not evidence of a model answer or a provider content refusal. The third control failed the retained-reasoning provenance check: [the accounting rule](../../../benchmarks/external-context-v1/accounting-v1/accounting.mjs) rejects an assistant reasoning message when its hash is absent from the model receipts supplied to that request. Its last recorded model response had HTTP 200, but the subsequent retained-reasoning binding did not pass. These observations identify distinct repair hypotheses for a future version; they do not alter r3 scores or authorize reruns.

| Valid-pair descriptive measure (21 pairs) | ARE relative to control | Paired 95% interval |
| --- | ---: | ---: |
| Native Span-F1 difference | +0.17285 | [+0.10664, +0.24423] |
| Native File-F1 difference | +0.41477 | [+0.27676, +0.55422] |
| Known model-token ratio | 0.59867 | [0.53861, 0.67459] |
| Summed arm-time ratio | 0.72470 | [0.62739, 0.84972] |

For the 21 scored pairs, mean native Span-F1 was **0.17947 ARE versus 0.00661 control**, and mean File-F1 was **0.46012 versus 0.04535**. These low absolute control scores and the three missing pairs must accompany any descriptive presentation. The paired intervals resampled full task rows within repository strata 20,000 times. The bootstrap implementation-timing disclosure in the [replication plan](PRODUCT-PAGE-REPLICATION-PLAN.md) still applies. Neither the valid-pair intervals nor the fact that ARE completed the three invalid-control tasks repairs the frozen completeness gate. No directional product-page superiority headline or complete ContextBench claim follows from r3.

The separate independent auditor reports `status: passed` across all 24 plan bindings, 21 sealed/scored pairs, and three invalid-pair receipts. Its ceiling is receipt, policy, seal, and native-metric integrity; it does not approve a quality claim.

## Private receipt bindings

| Artifact | VPS path | SHA-256 |
| --- | --- | --- |
| Definition | `/opt/are/evolution-runtime/g01-product-replication-input-r5/DEFINITION.json` | `b5a29ece7386c037a9b2e5e36410179f93d80c52e42b20a6e75caa743a74e2bd` |
| Campaign freeze | `/opt/are/evolution-runtime/g01-product-replication-r3/CAMPAIGN-FREEZE.json` | `7ddf069e96cb6cf1610da5f21efaf747de152cb1aa597286e5f3b4666555b4bb` |
| Campaign result | `/opt/are/evolution-runtime/g01-product-replication-r3/CAMPAIGN-RESULT.json` | `1b052d65e6dec716b74acc1f02b4a12cf019f2bed2194898fe2aeaafc75b5a67` |
| Product analysis | `/opt/are/evolution-runtime/g01-product-replication-r3/PRODUCT-ANALYSIS.json` | `dbff54bea4d47ea7ba4c66801219e40304bc0fb837382018b7c97a98fa8cfa4a` |
| Independent hash audit | `/opt/are/evolution-runtime/g01-product-replication-r3/HASH-AUDIT.json` | `a6b28e5740b92461c1ae19b61dee46bffe3994174318d00fc045ed18dee0d0d0` |

The private raw r3 root is approximately 6.8 GiB. At terminal analysis the VPS had only 4.9 GiB free, so **no full raw archive was attempted** and no files were deleted. The raw root remains intact. A verified cold-storage or additional-space path is required before archiving or retention cleanup; do not silently discard evidence to make space.

## Open Questions

- Which of the three control failure mechanisms is reproducible, and which is transport-specific? Diagnose from retained receipts before changing a future protocol.
- Should a separately frozen G01 successor predeclare an all-attempt completion/reliability endpoint with conservative missing-score sensitivity, while keeping native quality on valid pairs separate? Do not retrofit r3.
- What exact untouched task population and storage budget remain for independent confirmation?
