# Transient recovery qualification:35/36

Completed all36 trials with one source freeze:29 initial proposal passes and35 final verified; round finals12/12,11/12,12/12. All36 delivery gates, nine recycled-trial continuity checks and three long8K recycling requirements passed. Two60second model timeouts recovered on their single retry in4757ms and4776ms; both physical attempts remain recorded. All39 public workers cleaned up without execution errors. Total330 model and352 tokenizer attempts,2463807ms.

The sole final failure was Round2 archive10K: schema repair succeeded, but consumed the one correction allowance before public checks exposed a start-boundary semantic defect. Separate oracle7/8 confirmed the remaining error. No trial was replaced. Six of seven correction requests reached final success.

Evidence: [plan](PLAN.md), [aggregate](run/result.json), [independent audit](independent-audit.json), [source freeze](run/manifest.json). Offline conformance includes64 transport/config/resume tests and a16-logical-turn completion with18 physical attempts across pause/resume and recycling.

CAV2-D65: bounded opt-in transport recovery implemented and tested; candidate not accepted. Next general mechanism: collect schema diagnostics and public semantic diagnostics before the single corrective request, using a validation-only envelope derived from the already scope-checked source.

## Open Questions

Can joint diagnostics reach36/36 without another corrective attempt? Provider/network causes and billing of timed-out requests remain unknown. Large-context and held-out qualification remain outside this chapter.
