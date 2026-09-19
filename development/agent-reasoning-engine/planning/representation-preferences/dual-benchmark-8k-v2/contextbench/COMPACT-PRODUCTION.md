# Compact production entry points

Status: additive offline candidate; no fresh live freeze or launch.

## Component selection

The actual CLI is run-comparison-compact-production.mjs. It selects
comparison-compact-production.mjs, whose required source bindings include that
CLI, itself, comparison-compact-production-stage.mjs and its exact worker.
The base verifier comparison-compact-production-base.mjs requires the compact
generation process, dynamic generation worker, campaign runner and scorer.
Static dependency closure binds the compact arm, live factory, V4 transport and
all three matching evidence reconstruction paths.

Production qualification and scoring run in the bounded stage subprocess.
Generation uses comparison-compact-generation-process.mjs, selecting the
previously reviewed compact generation worker. Existing cancellation, process
group settlement, source-drift rejection and exact live-review requirements are
preserved. The twelve slots, two workers, 96K per arm/task, 1,152,000 total model
token envelope, 8K request checks, storage reservation and native quality/savings
criteria remain unchanged. Reviewed predecessors remain unchanged.

The original exported function names are retained so the interfaces remain
compatible; explicit module paths distinguish this candidate.

## Tests and evidence limits

Seventeen offline tests pass with NODE_OPTIONS=--experimental-vm-modules:
twelve production/qualification tests and five process-stage tests. They cover
static closure, omitted dynamic workers and CLI, altered source/prompts,
qualification ordering/window/model-call rejection, storage denial, exact review,
awaited preflight failure, settlement before scoring, post-score settlement loss,
and default subprocess rejection/settlement. Fixtures inject qualification and
scoring dependencies where necessary. No real provider or native evaluator call
occurs; this is not quality or efficiency evidence.

## Remaining live prerequisites

- Prospectively register and qualify a fresh workload that actually exercises
  retained reasoning; the preceding canary remains qualification_passed=false.
- Generate fresh initial-window qualification for the selected compact runtime.
- Register the complete comparison treatment and unchanged acceptance gates.
- Build and independently review an exact new source/data/credential-reference
  freeze; run fresh D:/WSL and source admission before dispatch.
- Run, independently score and review all twelve assignments, then confirm on
  untouched tasks. Historical controls cannot substitute for fresh controls.

The CLI is executable code but this document and offline tests grant no live
admission. Existing frozen runs must not be restarted.

## Open Questions

Does the fresh reasoning-bearing workload exercise the intended continuity?
Do fresh initial prompts fit every slot? Does a fully reviewed live comparison
reach perfect native quality and at least 15% cumulative model-token savings
against both controls? Can those results generalize to untouched tasks?
