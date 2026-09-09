# Proactive recycling construction

User-selected target: prevent native compaction by recycling context beforehand.
Compaction recovery is retained only as failure detection/diagnostic residue;
it is no longer the normal continuation strategy. Prior evidence is unchanged.

Product construction, runnable: define conservative pre-dispatch budget checks;
implement effect-free recycling and handover decisions; test threshold boundaries,
unbounded work rejection, capsule integrity and old-generation fencing.
Definitions: ContextBudget is a verified upper bound, not lifetime token usage.
StepReservation covers all growth until the next intercepted provider step.
RecycleBoundary is strictly below the effective native compaction trigger.
StateCapsule preserves supplied task state and evidence by digest; it is not a
host-generated summary. ContextGeneration identifies one replaceable model
context underneath the logical task. Old-generation events cannot change the
successor. Violation means the no-compaction target can no longer be guaranteed.
Ontology scaffold: LogicalTask owns ContextGeneration; Budget bounds Step;
StateCapsule binds Checkpoint; Handover replaces ContextGeneration.
Product prototype: continue the task in fresh context before native compaction.
Business hypothesis: predictable continuity, cost and quality remain unmeasured.
DomainSpec contract: CONTRACT.json. Compiled-system prototype: dispatch gate ->
reserve bounded growth -> recycle decision -> quiesce -> state capsule -> fresh
context -> verified receipt -> generation switch. Implementation: recycling.mjs.
Product tests: recycling.test.mjs. No host effects or automatic activation.

Done: no continue decision can reach the configured recycling boundary; unknown
or stale bounds and uncontrolled model loops cannot proceed; fresh context must
fit the capsule plus next step; verified capsule/current-state correspondence and
fresh-context identity required before routing switch; stale events fenced.

Operational support owner: host integrator. Exact affected stages: provider-step
interception and trusted threshold/usage acquisition (runtime enforcement), fresh
context creation and receipt verification (integration), live canary (product test),
activation. These are deferred. Current app-server model-visibility evidence does
not establish these controls. Their absence blocks a live never-compact claim,
not this local prototype. No new model calls; latest two-turn budget exhausted.
Causal local construction blockers: none. Deferred residue: automatic handover
transport, semantic capsule completeness, crash-safe handover settlement.
