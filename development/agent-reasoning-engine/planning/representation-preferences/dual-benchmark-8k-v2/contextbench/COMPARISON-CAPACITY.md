# Bounded comparison artifact capacity

The retained-trace probe found that twelve copies of the largest observed allocation exceed the old run stage's 120 MiB ordinary allowance. The additive comparison guard supports exactly two capacities: 256 MiB runs and 64 MiB outcomes. Both retain an 8 MiB final reserve, 4,096-entry ceiling, allocation-aware reservations, temporary-write overlap accounting, exclusive paths and poisoned-writer rejection. Arbitrary capacity values reject. Metadata, scoring and supervision remain 32 MiB each.

`comparison-generation-storage-r2.mjs` applies these limits and includes remaining allocation in D:/WSL admission. `comparison-generation-worker-r2.mjs`, `comparison-generation-process-r2.mjs` and `comparison-launcher-r3.mjs` select the successor without changing generation, cancellation, scoring, model budgets or acceptance. Frozen predecessors remain intact. Thirty-three tests cover guard capacity boundaries, inherited allocation/path/entry protections, source/storage admission, real process cancellation and launcher failure accounting.

`qualify-comparison-capacity.mjs` replays twelve copies of the largest retained run by allocated bytes, separately the run with most entries, and separately the largest result as outcome payloads. It uses the actual guard implementation with in-memory filesystem metadata, records source-file hashes, compares old and new admission, and checks current D:/WSL capacity with a combined reservation for 2 GiB sources and 416 MiB artifacts. It copies no benchmark files and invokes no provider. The exclusive qualification artifact records the observed results; the script refuses to overwrite it.

## Recorded qualification

The metadata replay rejects the old run cap and accepts the successor: twelve maximum-byte traces occupy 150,114,304 bytes of a 260,046,848-byte ordinary allowance, with 1,213 entries. Twelve largest outcomes occupy 21,532,672 bytes of a 58,720,256-byte ordinary allowance. The separate maximum-entry replay also passes. D:/WSL admission passed with a 2,583,691,264-byte combined reservation and 28,120,457,216 D: free bytes at measurement. These are dated run receipts, not guarantees of current future capacity. Zero files were physically copied and zero model calls occurred.

The first metadata harness run was intentionally interrupted (exit 130) because virtual directory scans consumed excessive CPU; it produced no qualification artifact. The successor indexes virtual children and completed the recorded qualification. Guard semantics were unchanged by this harness optimization.

## Open questions

Independent exact-source review and production freeze remain required before live admission. Historical replay is an empirical headroom test, not a proven future upper bound; hard evidence guards still stop unexpected growth. Source checks remain periodic and can overshoot between checks. The final production qualifier must remeasure D:/WSL capacity, bind all revised execution imports, validate actual request shapes and source identities, and retain every failed outcome. Full twelve-outcome generation/scoring, untouched confirmation and broader benchmark scope remain pending.
