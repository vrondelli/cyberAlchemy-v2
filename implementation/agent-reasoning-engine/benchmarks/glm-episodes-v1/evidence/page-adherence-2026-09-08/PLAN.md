# Page adherence v13 fixed repeatability check

Product frontier: reduce skipped starting offsets and repeated page reads without increasing the v12 budget. V13 inherits 4000-unit pages and 16 model/32 tokenizer attempts at 8K (5500 and 12/24 at larger windows), 24 native tool calls and unchanged token reservations. New-file offset zero is explicit. A late user message names exactly the next required native read after current observations, or asks for the patch once required delivery and recovery are satisfied. Instructions remain advisory; calls are not rewritten, skipped bytes do not count, and incorrect calls still consume budget.

Runnable product work / DAG: v12 failure traces -> exact next-page helper and late instruction -> 16-turn resumed integration and gap tests -> full suite -> source freeze -> four fixed 8K trials -> independently checked aggregation. Inputs and oracles are unchanged. This is another tuned candidate, not an unseen-task or causal comparison.

Schedule: long workload at 8K, repetition 1 clear then recent; repetition 2 recent then clear. Four trials, 64 model/128 tokenizer aggregate, per arm 16/32 and 580 seconds, 2640-second batch start deadline. Success target: at least 3/4 correct repairs, all four gates and recycling continuity, zero input reservation overruns, positive headroom and valid source/report checks. No retries, replacement, or mid-batch changes. Retain every failure.

Operational tasks and owners: agent runs owner-authorized calls; product owner owns future activation decisions. Affected stages: candidate prompt/helper and policy bindings, local tests, benchmark evidence. Causal blockers: validation, source/fixture drift, provider availability. Deferred residue: token-adaptive page search, robust budget slack for deviations, unseen tasks, operational pilot/default activation. Native owner-directed CAV2-D65 boundary; no new ontology selectors. Defaults, fixtures and pinned upstream retention/archive implementations remain unchanged.

## Open Questions

Does explicit offset zero and one late action reduce skipped/repeated pages? Can the model still produce correct patches reliably within sixteen responses? Provider-internal compaction remains unobservable; observable recovery alone does not prove it absent.
