# Comparison outer launcher

Status: nine offline tests pass; independent review pending. No live provider dispatch or evaluator execution in this suite.

`comparison-launcher.mjs` connects the comparison generation process to R2 native scoring. It freezes a copy of the request, validates the fixed schedule and disjoint fresh roots, requires explicit qualification, and persists the launch plan. Its generation deadline defaults to 150 minutes and aborts the shared child signal. The existing process adapter supplies escalation and process-group settlement. Settlement runs even when the child returns no terminal, and before terminal persistence, so an evidence-write failure cannot skip cleanup.

Scoring requires a successful, unforced child exit and an absent local process group. Saved generation result and manifest must match the returned terminal hashes and content. The scoring callback rechecks settlement and saved metadata before and after native evaluation. Scorer storage admission uses the D:/WSL guard. Cancellation or any launcher failure prevents a development success claim.

Failure recovery retains all twelve assigned slots. It takes the maximum known token witness per slot across returned queue outcomes, returned reconciliation, saved outcomes and digest-checked transport ledgers; duplicate representations are not added. Saved files are read only after local settlement, with regular-file, canonical-path and byte limits. Returned witnesses remain available even if outcome persistence failed. Every possibly attempted slot retains at least its full 96K reservation; an unknown terminal never means zero spend. Recovery witnesses are explicitly not reconciled benchmark accounting and cannot establish savings. Disk evidence remains in place, and final report failure returns the in-memory report through the thrown error.

Tests cover successful callback ordering and final persistence, denied qualification, lost terminal with 1,152,000-token conservative reservation, forced process closure, changed metadata, deadline abort, post-generation write failure, duplicate-witness accounting and returned paid failures. A ninth test uses an actual child and process supervisor, confirms the PID has exited before scoring, and revalidates settlement. Generation payload and scorer are fixtures there; no successful full production child/evaluator campaign is claimed.

## Open questions

Coordinator owns independent review, prospective research amendment, exact source freeze and live qualification. Qualification must verify the complete production composition, credential availability without exposing secrets, cumulative artifact capacity and source-write growth between periodic storage checks. The launcher requires this callback and has no permissive production default. Native scoring was separately replayed against retained evidence; actual twelve-outcome generation/scoring remains pending. Untouched confirmation and full benchmark scope remain open.
