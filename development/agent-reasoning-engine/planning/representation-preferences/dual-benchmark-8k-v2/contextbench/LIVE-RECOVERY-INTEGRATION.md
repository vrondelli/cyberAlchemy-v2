# Live recovery episode candidate

The additive `discovery-v1/episode-recovery-v2.mjs` connects the reviewed compact recovery controllers to the actual episode/recycler loop. Frozen discovery and tokenizer code remains unchanged. This is tested integration, not a new benchmark result or admission for provider generation.

Both variants use the same history projection, discovery reminders, budgets and terminal native export. `limits.recovery_visibility` selects `eager` or `demand`; recovery still requires the existing discovery-retention prerequisites. The adapter returns the exact tools and messages for the current request. Eager includes the populated catalog and freshness notice. Demand initially includes only `open_recovery`; opening stages expansion for the next request. Tool execution checks the current request's declared tool set, so an opening action cannot enable a recovery tool midway through a batch.

The controller instance survives context recycling. Its retained archive is separate from projected history. Every successful recovery presentation is acknowledged against its actual model receipt; expanded snapshots retain exact archive prefix bindings. Entry-only presentations have no fabricated snapshot. Source results become eligible only after successful receipt-confirmed delivery, not immediately when a tool returns them. Pending first delivery remains protected by the real recycler.

Ten synthetic-transport tests use the actual recycler and native selection exporter. They verify demand opening followed by original-source recovery across recycling, rejection of undeclared recovery, successful native export, exact known call costs, eager empty-to-populated transition without explicit refresh, no admission bypass for oversized pending results, failed-dispatch accounting, strict recovery JSON, reminder behavior, history projection and source-output deferral. The first freshness assertion incorrectly expected unconfirmed pending source to be archived; the final test explicitly checks that the second request still sees an empty archive and the next sees confirmed evidence without a refresh call.

## Remaining execution gates

Independent review must validate the narrow integration and test coverage. Full-trajectory execution also needs compact reference-based final records, bounded source preparation/persistence, exact paired experiment records, a reviewed source freeze and complete cumulative token accounting. The 97-boundary input-only result (12.32% reduction) does not replace these steps or establish perfect quality and at least 15% total-token savings.

The candidate contributes to reusable reasoning-state retention, with GLM 8K as the current qualification target. It does not change the original objective, research ontology or DAG method. No new provider calls, release, commit or authority promotion occur in this integration step.

## Open questions

Will GLM choose to open/refresh at useful times? Does recovery reduce repeated exploration or improve discovery sufficiently to reach perfect native quality? What opening and output costs offset the measured input reduction? How does the result generalize beyond exposed histories? Only a preregistered complete-trajectory run and later untouched confirmation can answer these questions.
