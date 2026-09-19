# Trajectory request verifier review

Approved for offline known-trajectory verification. Both synthetic tests pass. Independent replay exactly matches all eight saved arms: 218 model calls, 605,550 tokens and configured 512-token margin. Exact code, cell configuration and archive paths/hashes are bound in [the review receipt](TRAJECTORY-REQUEST-REVIEW.json).

Ordered dispatches bind captured prompts, reconstructed model requests, preceding same-wire tokenizer measurements and retained-reasoning reservations. Actual usage and reserved output must fit the configured 8K limit.

The verifier trusts the supplied stream census and frozen cell profile; it cannot prove omitted external calls or transport settlement. Failed/unknown trajectories require separate conservative accounting. No semantic quality, native scoring or live campaign clearance follows from this replay.

## Open Questions

Global sealed-source integration and independent scorer joins remain under [the campaign contract](RECOVERY-CAMPAIGN.md).
