# Frozen context sweep — 2026-09-07

D65 continuation of the admitted explicit-finalization-v3 construction. User requested “plan and do” for the bounded 18-trial sweep. See effect.json for the routing receipt.

DAG: expose and validate soft-limit selection → 346 local tests → freeze source hashes and schedule → run 18 independent trials → check reports and aggregate repair, recycling continuity, calls, usage and latency → record continuation.

Only retention-tool-pairs, two retention policies, three soft limits (8000/10000/12000), three repetitions each. Hard limit 16384, output reserve 2048, token margin 256, safety margin 1024. Frozen prompt/runtime/oracle; no tuning or replacement of failed trials. Rotated order is in manifest.json. Per-arm caps 12 model calls, 24 tokenizer calls, 580 seconds; aggregate caps 216/432. Individual valid failure reports remain outcomes; source drift or report integrity failure stops the experiment.

Continuity requires actual recycling and archive recovery. A correct repair without recycling does not demonstrate continuity and must remain separate. Admission evidence cannot prove absence of provider-internal compaction. Defaults and fixtures stay unchanged. Complete private report inputs remain in /tmp; exported evidence excludes provider reasoning.

## Open Questions

Which tested soft limit improves repair and recycling continuity? How much variability remains with only three repetitions? Which failures reflect provider availability? Does this generalize to other tasks?
