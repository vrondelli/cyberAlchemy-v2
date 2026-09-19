# W2 — Security and Resource Hardening

Layer/slice: L2 / SFC-S3. Units: SWU-SFC-011 through SWU-SFC-014.

## Outcome

Close dependency evidence and pointer-only isolation while enforcing and
measuring the selected resource envelope on Linux x64 / Node 24.19.0.

## Parallel shape

After SWU-SFC-010 closes, the disjoint lanes `011 → 012` and `013 → 014` may run
in parallel. SWU-014 additionally requires SWU-012 and benchmark input
`SFC-PR-003`, so its final campaign cannot pass before the security lane joins.

Exit requires all four Task Session and closeout receipts, zero canary leakage,
no network/telemetry, total dependency classification, exact boundary admission,
and measured over-bound failure. Parent join is mandatory. Only then may
SWU-SFC-015 become eligible.
