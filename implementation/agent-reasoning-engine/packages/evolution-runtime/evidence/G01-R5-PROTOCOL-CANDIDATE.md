# G01 r5 — cross-branch fresh 8K replication protocol candidate

Status: **frozen and stopped after eight pre-model unscored pairs**, 2026-09-29. The [stopped-run record](G01-R5-STOPPED-RESULT-NOTE.md) owns the observed failure and receipt lineage. This document does not claim superiority or authorize publication. The [source-only cohort and readiness record](G01-CROSS-BRANCH-COHORT-CANDIDATE-R1.md) owns the task-selection, checkout, index, and storage receipts. G01 r4s and its exposed diagnostics remain immutable development evidence.

## Comparison and hypothesis

The prospectively selected cohort has 24 unique, previously unmanifested ContextBench tasks: six each in C, Go, JavaScript, and Rust, across PonyC, cli, grpc, Svelte, serverless, tracing, and fd. The source-only selector fixed its seed and quotas before any r5 model call. Its candidate ID-set SHA-256 is `ce6775a4a613e7da24c1dba4682b8a65e9b574b209c7957e3271aebdbc1e61bc`. C remains a one-repository stratum, and three JavaScript tasks come from Poly rather than Multi; those limits must accompany any result.

Both arms use GLM-5.3-flash, the same **8K request window**, identical source task and base commit, pinned tokenizer/transport, total-token and call caps, and zero automatic model retries. Control remains `intent-anchor-convergence-r3`; candidate remains `intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1`, with the source-only selected-span refinement bound to the candidate arm. The r8 source snapshot is a copy of r7 with exactly three changed source files: the locally tested module-stop syntax guard, campaign preparer, and pair runner. No new control, outcome-based task choice, or post-freeze candidate change is permitted. The hypothesis is that ARE improves native context selection quality *and* efficiency on this exact cohort.

## Frozen analysis rule

The pair is the analysis unit. Preserve all 24 attempts and every timeout, refusal, source/index failure, and native-score failure. Seal each arm's prediction and known usage before evaluator-only native scoring. Report native Span-F1 and File-F1, known model-token totals, summed per-task arm time, per-repository breakdowns, and all-attempt reliability. A directional branch superiority headline requires **24/24 natively scored pairs**, no unresolved label/score integrity issue, repository-stratified paired 20,000-resample 95% intervals wholly above zero for both ARE-minus-control quality differences, and wholly below one for both ARE/control token and summed-arm-time ratios. Use the seed and paired resampling method in the [replication plan](PRODUCT-PAGE-REPLICATION-PLAN.md). A single passing metric supports at most a qualified metric-specific statement; it does not convert the whole campaign to a win. No post-score task replacement or pooling with r1–r4s.

## Execution and storage

The source-only preflight passed 24/24 task-specific indexes with zero model calls, but 19 indexes were partial. The selected exact-commit shallow checkouts sum to 348,688 KiB. Four independent source checkouts per pair project 1,394,752 KiB before logs, temporary files, score outputs, and archive. Nine sizing-only checkouts were fully compared to a verified 83,013,838-byte archive (SHA-256 `282a8a380451e5ade9d109d09acbb30917add988652f9c679eec0e0211ac6fb5`) and removed; the prior caches, 14 new task-source checkouts, and all old campaign roots remain intact. Current pre-dispatch headroom is approximately 2.57 GB and must be rechecked before freeze and throughout dispatch. Use at most two concurrent pairs to bound temporary peak use. If storage or transport safety fails, stop and retain the failed-attempt evidence; do not silently remove earlier raw roots or substitute tasks.

Run the existing campaign preparer against the exact r5 definition to create immutable pair plans. Dispatch only after the definition, snapshot hashes, host topology, source caches, and scorer are verified. At terminal state, reconcile the 24 pair receipts, seal/score, run the paired analyzer and independent hash/metric auditor, then create a readable content-addressed private archive. The candidate task IDs become conservatively manifested as soon as source-only task files are materialized, even if GLM dispatch never starts.

The claim ceiling is this fixed GLM/8K/24-task, seven-repository comparison. It is not full ContextBench or general ARE superiority. Vlad and Dave must review the exact sanitized card and receipt package before any product-page publication.

The r5 run did not reach the scoring or claim gate. Its stopped-run record is part of the exposure and harness-failure lineage; the unattempted sixteen tasks are not a replacement pool or permission to patch this frozen result.

## Open Questions

- Will the remaining disk headroom cover the actual four-checkout peak and a verified archive without deleting prior evidence?
- Will the 19 partial indexes omit task-relevant material or cause incomplete paired scoring?
- Will the bounded quality and cost intervals both pass, rather than only a favorable valid-pair point estimate?
