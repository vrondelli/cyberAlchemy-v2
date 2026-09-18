# Source-bound D07 successor projection

Status: retrospective research projection, authority effect none. This version closes
the missing D07 edges identified in the earlier work-tracking audit. That historical
audit and its D08 snapshots remain unchanged. No new quality result is invented.

`project-dag-v1.mjs` uses the documented `verify_registration` seam in native
`materializeResearchDag` and `verifyResearchDag`. Its local registration schema wraps
existing native hypothesis, experiment, observation and decision records. It verifies
record integrity, exact selection from source files, hypothesis/experiment/observation
cross-references, result-file byte hashes, historical freeze source hashes, source
bindings, and question derivation from the recorded next action. Registration hash
equality alone cannot pass. Three negative cases reject invalid source binding,
foreign observation substitution and an unsupported successor question.

The prior prototype registration stays intact. New wrappers are explicitly
retrospective; D07 is logical research order, not proof of historical preregistration.
All three new decisions are inconclusive. The implementation node means exact
source evidence for that experiment or admission diagnostic, not a serving release.

## selectivity-v2

The predecessor question asks whether scoped state improves appropriate outcomes at
equal model-token budgets. The actual selectivity successor tests that question and
has sixteen reviewed generations. Its recorded observation and decision remain
inconclusive about causal benefit. Source bindings include its historical protocol,
freeze, provider, adapter, scorer, raw result aggregate and blind review.

## longmemeval-sequential-v1

The same predecessor question motivates this external sequential-history test. Its
actual experiment stopped before a final answer, with incomplete note output. The
D07 observation is that stopped experiment's recorded inconclusive result. The open
question uses the recorded next action; it does not claim that v2 has succeeded.

## personamem-admission

The predecessor question also motivates the selected PersonaMem branch. Its existing
planned hypothesis and experiment are linked to the actual context-admission
observation. All four development histories exceed 8K admission after oracle-system
removal. The resulting decision is inconclusive about quality, with an open question
about an explicitly different budget or retrieval successor. No model answers exist.

## Native DAG and D08 reconciliation

`research-dag-v1.json` contains 24 nodes and 23 edges: four existing/retrospectively
registered chains, each hypothesis → experiment → observation → decision → question,
with implementation → experiment edges. Three explicit lineage declarations connect
the original open question to these successor hypotheses. This document is their
source declaration, not a claim that the declarations predated execution.

`d07-bound-work-plan-v1.json` and `d07-bound-work-state-v1.json` rebind the earlier
D08 event history to this new DAG. The script first runs the original substantive
criterion verifier in `reconcile.mjs --check`; only verified historical completed
tasks can carry their exact evidence forward. New native replay binds their plan,
criterion, validator and current artifact hashes. Blocked A-v2 remains blocked in
this historical snapshot. Later recovery requires another state version.

Run:

`node development/agent-reasoning-engine/planning/representation-preferences/benchmark-pilot-v2/execution/work-tracking/project-dag-v1.mjs --check`

Files ending `-v1.json` are the reproducible successor records. No parent frozen
artifact, historical snapshot, live runner or provider was changed.

## Open Questions

A-v2 quality observations await actual completed outputs and independent review.
PersonaMem still needs a feasible, explicitly frozen protocol before a live quality
run. Later reviewed observations should extend the graph through a new version;
these retrospective wrappers do not authorize changes to frozen experiments.
