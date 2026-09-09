# CC-003: reconcile the lookup route dependency

Product construction: add the declared CA2-ROUTE-LOCATE policy to the existing
ARE profile, local-read only, using registry match/exclusion metadata. Update
only its route-registry provenance and deterministic profile digest. Other
policies, provenance, effect classifications and authority boundaries stay fixed.

Before changing bytes, inspect profile schema, loader and tests. Then add
lookup regression tests, run the complete request-decision-router suite and
prepare CC-003 with CC-002 lineage. Preserve CC-002 and the legacy manifest.
Selected ontology dependencies remain the profile's explicit provenance files;
no ambient ontology runtime or admission is used.

Candidate evidence: exact-source and nested-profile checks plus lookup tests.
No previous test PASS or approval is inherited. The current budgets stay byte
identical. Full build closure, desktop smoke and performance campaign remain
separate test work. Native-smoke prerequisite success does not imply a tested
desktop or product approval.

Operational support: current agent owns local tests and evidence capture; no
restart or publication required. No causal operational blocker for this repair.
Deferred operational residue: reconciliation/commit/release remain owner choices.
