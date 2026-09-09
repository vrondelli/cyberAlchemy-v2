# Steering and compaction construction

Product construction, runnable now: define revision and recovery contracts; build
an isolated adapter over the existing lifecycle; test fresh-process recovery,
supersession, provenance and rejection paths. Candidate is this package and its
source-hashed lifecycle dependencies. Prior candidates remain unchanged.

Definitions: RequestRevision is a host turn plus monotonic nonnegative revision.
Supersession ends an unfinished revision without a completed learning episode.
ContextRestore re-emits an exact current projection after context loss; it does
not ingest a summary, author a request, learn feedback or manufacture completion.
Ontology scaffold: HostTurn contains RequestRevision; RequestRevision supersedes
RequestRevision; Projection binds RequestRevision and LearningState;
ContextRestore references Projection. These are navigation scaffolds only.
Product prototype: corrections during work get separate attribution; current
preferences survive model context loss. Business hypothesis: fewer lost
corrections, unmeasured. DomainSpec prototype: CONTRACT.json. Compiled-system
prototype: ingress revision validation -> existing lifecycle -> ledger projection
-> revision-bound restore. Implementation: adapter.mjs. Product tests: regression
suite plus continuity.test.mjs. Approval and operational authority remain absent.

Done: only the current revision completes; superseded revisions never become
completed episodes; restore preserves guidance and temporary exceptions, rejects
stale request/state/digest and duplicate IDs, and never learns summary text.

Operational support: host integrator owns native event mapping and another canary
(product-test stage), then separately approved activation. Deferred: four-turn
Luna allowance exhausted; zero new model calls or installations here. This does
not block local construction. Causal local construction blockers: none.
Deferred construction: native steering delivery acknowledgement, independent user
evaluation, multi-agent attribution, capability learning and physical deletion.
