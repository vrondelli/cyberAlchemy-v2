# Small-window baseline qualification

Completed all36 predeclared trials with one source freeze. Acceptance failed:29/36 first-pass and34/36 final verified. Round finals were10/12,12/12,12/12. The two final failures were ordinary dispatched model requests exceeding30seconds in Round1 long8K and long10K. No failed trial was replaced or retried.

All five corrections passed separate oracle validation (three schema recoveries and two semantic corrections). All eight recycled trials passed continuity; Round1 long8K failed before reaching recycling, so that round did not meet context acceptance. All36 public validation workers cleaned up with no execution failures. Total311 model and330 tokenizer attempts,2496467ms.

Evidence: [manifest](run/manifest.json), [aggregate](run/result.json), [plan](PLAN.md), [controller tests](controller-tests.log). Round evidence includes visible responses, full schema diagnostics, transport receipts, public checks and independent oracles. Private credentials and provider reasoning are excluded.

CAV2-D65 result: controller implemented and tested; campaign completed; candidate not accepted. Next bounded hypothesis: a separately configured60second ordinary model deadline may tolerate intermittent latency, while retaining30second tokenizer and existing total-arm limits. It requires a new source freeze and complete qualification, not removal of baseline failures.

## Open Questions

Will the deadline candidate meet36/36? These known-task results do not establish held-out generalization, large-context support or provider-internal compaction behavior.
