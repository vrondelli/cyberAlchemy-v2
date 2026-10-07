# IL-H04 Engine-Improvement Cycle

Status: completed bounded construction integration; variant recommended  
Cycle kind: `engine-improvement`  
Activation: none

## Objective

Integrate the retained IL-H04 deterministic continuity renderer into the ARE
Codex app-server wrapper at the objective-transition boundary without enabling
it in the repository serving profile.

## Current product frontier

Produce a disabled, reversible wrapper integration that consumes the exact
retained learning package and owner decision, derives objective identity from
the verified objective resolution, accepts the remaining control fields only
from an engine-owned closed binding, and emits the exact deterministic result
before model dispatch.

## Runnable product work

1. Bind the retained interaction-learning package and DG-IL-15 decision.
2. Add a closed renderer configuration whose repository default is disabled.
3. Materialize a digest-bound continuity projection from objective resolution
   plus an engine-owned high-risk binding.
4. Inject that projection into outgoing application context and emit a typed
   client notification before model dispatch.
5. Preserve low-risk bypass and fail closed on missing, malformed, or
   source-drifted bindings.
6. Verify exact parity with the retained 20-scenario cohort and run the full
   wrapper and evolution-runtime suites.
7. Settle all cycle artifacts through the durable coordinator and verify
   restart and SQLite-loss reconstruction.

## Acceptance contract

- exact package and owner-decision digests are configuration-bound;
- 20/20 retained scenarios have byte-equivalent rendered objects;
- enabled high-risk transitions produce both context and notification output;
- low-risk transitions produce neither output;
- enabled operation without an engine binding fails before model dispatch;
- the repository profile remains disabled;
- wrapper and evolution-runtime suites pass; and
- no serving pointer, production profile enablement, provider call, deployment,
  or controlled upgrade occurs.

## Rollback

Keep `continuity_renderer.enabled` false or remove the wrapper adapter and its
context/notification surface. Objective resolution and the retained learning
package remain unchanged.

## Result

The wrapper integration is implemented with the repository profile disabled.
The deterministic comparison produced 20/20 exact retained-renderer parity,
20/20 high-risk projections, and 0/20 baseline projections. The focused suite
passed 8/8, the full wrapper suite passed 208/208, and the evolution-runtime
suite passed 128/128. Five coordinator tasks settled, and both restart and
SQLite-loss reconstruction reproduced the same projection.

The resulting package decision is `recommend-variant` with `activation: none`.
Exact digests and claim limits are in [RESULTS.md](RESULTS.md).

## Operational tasks

No credential, provider, Docker, external service, or production host is needed
for this construction cycle. A future real-user confirmation cohort and any
serving activation belong to separately authorized cycles.

## Open Questions

- The shared headless RPC host is now confirmed by the
  [successor canary](../ilh04-host-confirmation-v1/RESULTS.md); Codex
  Desktop/Windows display remains open.
- What real-user cohort and false-positive threshold should gate a later
  controlled-upgrade proposal?
