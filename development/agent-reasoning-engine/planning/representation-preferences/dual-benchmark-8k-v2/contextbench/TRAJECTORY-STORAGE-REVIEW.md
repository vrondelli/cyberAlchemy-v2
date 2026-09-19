# Trajectory storage review

Approved as an offline candidate. Fifteen independent focused tests pass: eleven inherited guard cases and four storage cases. The initial source-backing gap is resolved: both source and evidence roots now pass the inherited D/Ubuntu mount checks with the same combined growth reservation. Exact source bindings are in [the review receipt](TRAJECTORY-STORAGE-REVIEW.json); [R1](TRAJECTORY-STORAGE-REVIEW-R1.json) is retained.

The evidence cap increases to 128 MiB while preserving an 8 MiB final reserve and existing writer protections. Source scanning enforces admission/monitoring against a 2 GiB envelope. Independent read-only tree counts match the footprint document; they are not worst-case runtime bounds.

Source growth is not kernel-limited, and host reservations are not exclusive. Fresh capacity checks, measured source preparation, shared storage identity and worker settlement remain required. No live execution is approved.

## Open Questions

Global supervisor and scorer integration remain under [the storage contract](TRAJECTORY-STORAGE.md).
