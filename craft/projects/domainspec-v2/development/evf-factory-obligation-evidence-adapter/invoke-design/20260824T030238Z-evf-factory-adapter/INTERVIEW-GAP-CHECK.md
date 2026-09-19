# Structured Interview Gap Check

- Target scope: EVF-to-factory obligation/evidence adapter Design
- Mode: `gap-check`
- Questions asked: `0`
- Decisions recorded: accepted option `FMP-EVF-B` reused; no new decision invented
- Artifacts updated: this run only
- Verdict: `flag`

The direct owner decision already fixes the topology, separate Design route, and authority ceiling. Asking the user to choose those again would reopen an accepted decision.

The remaining choices are protected downstream owner choices, not safe interview defaults:

1. exact EVF input and output schema bytes and version;
2. exact factory verification/currentness handle;
3. role-to-person assignments for EVF, factory, provider, artifact, and validator owners;
4. exact negative fixtures accepted by the EVF and factory owners.

These are recorded as owner gates. Their absence flags Plan readiness but does not block a bounded Design candidate or deterministic Design selection.
