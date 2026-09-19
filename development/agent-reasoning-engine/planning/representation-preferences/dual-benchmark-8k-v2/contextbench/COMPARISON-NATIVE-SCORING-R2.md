# Twelve-outcome native scoring R2

Status: eight offline tests pass; independent review pending. No actual evaluator or provider execution.

The R1 review found that schedule-source drift could prevent final failure-report persistence: post-score reconciliation detected the drift, but summary construction reread the changed source and threw outside the integrity handler. The actual config-file mutation regression fails against the preserved R1 with `comparison-schedule.config-digest`.

`score-comparison-campaign-r2.mjs` validates and retains a failure summary before evaluator access. Successful final summary construction occurs inside the integrity handler. Any post-score failure invalidates all native scores and uses the prevalidated failure summary to persist twelve assigned rows and original generation costs without rereading the drifted sources. Failed integrity never establishes quality, savings or completion. Original scorer, tests and 97-binding rejection remain unchanged.

Seven orchestration tests pass, including actual config-file drift and persisted full-denominator failure evidence. One production preparation test executes the current ARE runner with scripted transport and real temporary Git source, tools, recycler and persistence; it reconstructs the saved prediction and rejects subsequent source drift. The original COMPARISON-NATIVE-SCORING.md describes boundaries and injected test seams. These are implementation tests, not benchmark scores.

## Open questions

Coordinator owns independent R2 review, actual isolated evaluator integration, external process settlement, prospective experiment amendment and source freeze. Production callers must select R2 explicitly. A real twelve-outcome campaign, untouched confirmation and full benchmark scope remain pending. No success claim follows from synthetic perfect metrics.
