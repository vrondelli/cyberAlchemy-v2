# Joint-diagnostics qualification: 35/36

All 36 trials completed under one source freeze: 30 initial proposal passes and 35 final verified; round finals 12/12, 11/12, 12/12. All 36 delivery gates, nine recycled-trial continuity checks and three long 8K recycling requirements passed. Two initial transport timeouts recovered. All 41 public workers cleaned up without execution failures. Total 329 model and 351 tokenizer attempts in 2492630ms.

The sole failure was Round 2 pairs 12K: its source passed public checks, but the schema-correction model call exceeded 60000ms. Tokenizer admission succeeded at 3702 input tokens; no correction response arrived. Correction transport still had zero retries. Five of six correction calls reached final success.

The [retained development matrix](retained/README.md) separately reached 12/12 with two calls, including the exact combined schema/semantic defect fixed in one response. That prior failure remains preserved.

Evidence: [plan](PLAN.md), [aggregate](run/result.json), [independent audit](independent-audit.json), [source freeze](run/manifest.json), [42 passing correction tests](tests.log).

CAV2-D65: joint diagnostics implemented and tested; complete qualification not accepted. The remaining transport boundary requires the same explicit recovery policy, with one logical correction and separately counted physical attempts.

## Open Questions

Will correction transport recovery close the final failure? Provider causes/billing, held-out quality, larger contexts and provider-internal compaction remain outside this chapter.
