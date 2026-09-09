# CC005: explicit campaign selection

Product frontier: bind repaired measurement-v2 apparatus and candidate-aware
selection without modifying CC004 or its historical tests. Add candidate.json,
validate.mjs, validate.test.mjs, this plan and README.md; add campaign/selected.mjs,
selected.wdio.conf.mjs and selected.test.mjs. Reuse fixed-population collection,
host thresholds and latency budgets unchanged.

Sequence: explicit allowlisted selection with required candidate/binary digests;
fixed mock-only launch descriptor; independent worker preflight; successor source
binding and predecessor lineage; negative selection tests and candidate validation;
read-only preflight against the retained test executable. No full desktop campaign
is part of this bounded implementation test. Existing binaries are selected by
digest, not claimed to have complete build/source provenance.

Operational support: current agent owns read-only preflight at product-test stage.
Full source/build/process closure, exact candidate product tests, qualified host
and prior-candidate population remain prerequisites for final differential proof.
Those do not block the selection prototype. Product owner owns later approval;
commit, merge, publication and deployment are deferred separate decisions.
