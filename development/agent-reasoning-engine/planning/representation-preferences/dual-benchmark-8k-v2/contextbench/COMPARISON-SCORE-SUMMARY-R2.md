# Score summary R2

Status: additive correction; seven offline tests pass. Independent R2 review pending.

The [R2 summary](comparison-score-summary-r2.mjs) requires total known model spend to fit within the safe-integer sum of supplied request reservations. The [R1 review](COMPARISON-SCORE-SUMMARY-REVIEW.md) reproduced a development pass with four one-token reservations despite 17K/20K known spend. The new regression failed against R1 and passes with R2. Original source/tests and 85-binding rejection remain unchanged.

All prior gates remain: twelve valid outcomes, exact per-task alternative perfection, complete accounting, <=8K requests, long trajectories, settlement/integrity and exact15% savings versus both comparators. The original [contract](COMPARISON-SCORE-SUMMARY.md) owns parsed-evidence limits and full benchmark exclusions.

## Open questions

Actual isolated scoring, authenticated input bindings and process settlement remain pending. Production callers must select R2 explicitly. Coordinator owns independent review/integration; no live score or quality/savings claim follows.
