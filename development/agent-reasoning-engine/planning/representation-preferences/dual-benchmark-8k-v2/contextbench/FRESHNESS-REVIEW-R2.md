# Freshness review R2

Approved for offline candidate and replay scope. All 13 tests pass. The prior archive-loss blocker is fixed by retaining every previously accepted observation identity independently of the pinned snapshot; the A → A+B → A regression passes. R1 remains preserved.

Independent replay exactly reproduces all 97 receipt-bound historical boundaries: 79 populated catalogs and 18 empty boundaries before first delivered evidence. Current-request receipts and captures are excluded. Exact source and dependency bindings are in [the review receipt](FRESHNESS-REVIEW-R2.json).

Populated snapshots preserve paging and handles; receipt-bound notices identify newer evidence. Demand projection supplies both required messages, but opening still changes first-snapshot timing. The result establishes controller behavior only, not model behavior, provider-token fit, savings or quality. No live integration or execution is approved.

## Open Questions

Matched visibility/freshness semantics, actual token admission, persistence and full-trajectory evaluation remain under [the candidate protocol](RECOVERY-FRESHNESS.md).
