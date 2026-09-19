# Supervisor candidate review

Not approved yet. All six supplied synthetic tests pass; two additional synthetic probes expose missing coverage.

1. Local settlement is skipped when the returned terminal is absent or invalid, or its durable write fails. After generation is invoked, run settlement independently of validation/persistence success and preserve both primary and cleanup errors. Missing-terminal reproduction invokes settlement zero times.
2. Cancellation during scoring can still return `scored` and `development_target_passed:true` alongside `caller-cancelled`. Recheck cancellation before declaring supervisor success; preserve any scoring evidence.

Configuration isolation, disjoint canonical fresh roots, bounded supervision persistence, fixed assignment metadata and saved-terminal handoff are present. These do not supply the pending production callback evidence. No providers, gold reads or frozen-source edits occurred. Exact source hashes are in RECOVERY-LAUNCHER-REVIEW.json.

## Open Questions

RECOVERY-LAUNCHER.md owns production qualification/settlement, aggregate capacity and outer deadline prerequisites. Resolve the two findings and add focused regressions before candidate approval.
