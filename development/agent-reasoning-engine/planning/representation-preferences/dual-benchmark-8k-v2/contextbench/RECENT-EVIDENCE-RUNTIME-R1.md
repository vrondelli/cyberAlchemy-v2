# Recent-evidence candidate runtime integration

See [protocol](RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md) for H-L and all fixed gates.

Runner/schedule/census: 11 tests and independent approval in
RECENT-EVIDENCE-RUNNER-REVIEW-R1.json. Candidate arm is recent-evidence-ledger.
Raw receipt-bound mechanism counts match the prior trace audit exactly. Census
source bytes, response calls, request bodies and receipt digests are verified.
Incomplete and zero-denominator evidence cannot produce eligible rates.

Campaign/adjudication: 10 tests and independent approval in
RECENT-EVIDENCE-CAMPAIGN-REVIEW-R1.json. Every assigned task is retained. Native
scores/costs survive post-evaluation measurement failure. Local supporting
mechanism outcome cannot override native perfect-quality gates or declare saved
tokens. Unknown provider outcomes stop further work and preserve reservations.

Initial tokenizer qualification: 16 tests, construction review pending. Model
requests are forbidden; every receipt family is checked. Qualification requires
measured request size, intact source/review pins, complete persistence and clean
process settlement. It does not qualify populated ledger prompts or final context.

## Open Questions

Live initial, populated-ledger and terminal qualification and exact production
launch binding remain required. No live provider execution occurred during this
implementation. Subsequent benchmark data must decide H-L, not these fixtures.
