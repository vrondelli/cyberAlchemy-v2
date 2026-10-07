# Companion independent-observation freshness

Status: source-level UI prototype evidence, 2026-09-26. No packaged native
renderer or installed-client claim.

Adapters, Decisions, Evolution ledger, and the separate gateway Improvement
Signal inbox now each validate their own source observation time. An already
expired, missing, or implausibly future timestamp cannot become a current UI
claim. A successful reading ages out independently after the bounded window:
the Adapters Overview loses its Ready summary, Decisions no longer presents
a process-local list as current, and Evolution stops displaying current cycle
and candidate counts. The existing Threads freshness behavior remains separate.
The top-bar action is labeled “Refresh view” and rechecks every independent
source represented on the Evidence page; it does not start a service or model.

Verification: `node --test apps/desktop-companion/ui/dashboard.test.mjs`
passed 14/14; `node --check apps/desktop-companion/ui/app.js` passed. Tests
cover simultaneous expiry of independent sources and rejection of an expired
adapter snapshot that otherwise advertises Ready.

Claim ceiling: this is frontend freshness behavior against the configured
read projection. It does not prove native Windows or Linux renderer behavior,
source authenticity beyond the bridge, backend liveness, or ARE control of the
current Codex desktop task.

## Open Questions

- Should a future installed build display last-seen Evolution and Decision
  evidence in a dedicated historical mode instead of hiding current cards?
- Which per-source freshness budgets are appropriate after measured gateway
  and native-renderer latency on supported platforms?
