# Workspace, RWO, ARE and Luna on a VPS

Status: bounded RWO / ARE / Workspace integration implemented and live-tested, 2026-09-07.
Objective routes: `CA2-ROUTE-IMPLEMENT`, then exact `CA2-ROUTE-PUBLISH`. Authority effect: none.
Owner: Workspace product owner; runtime and deployment owners remain to be bound.

Current continuation: [VPS host plan and local tests](HOST-PLAN.md). The full ARE
repository-wrapper native pilot now passes locally. The user selected the
DomainSpec Core VPS at `187.77.248.154`; strict SSH and the existing live
orchestrator state API now pass. The existing Python Luna worker reports
available. The isolated native Node/Codex/ARE fixture runtime is now installed
and tested. The private launcher is active and a fresh no-tool Luna turn through
Codex/ARE passed. The [bounded RWO adapter](runtime/rwo/README.md) now dispatches
through a separate private ARE host, records verified completion, and exposes
replay-checked history to Workspace. One fresh live request passed; replay made
zero new provider calls. The next [immutable text-task extension](runtime/TASKS.md)
is now implemented and live-tested on the VPS with one supplied summary task.
The [Workspace launch controls](runtime/WORKSPACE-LAUNCH.md) are implemented and
browser-tested through the VPS, with explicit objective binding and a private
local bridge. Tool-enabled work, multi-worker execution and packaged desktop validation remain open.

## Intended result

Use Workspace to observe bounded Luna work orchestrated by RWO, with ARE
mediating execution through Codex App Server on one selected VPS. Start with
one task and one worker, then prove a finite multi-worker DAG. This is a new
continuation candidate assembled from available sources, not a recovered or
approved historical deployment plan.

## Located sources

Paths below are relative to this plan.

| Component | Source | What the current files establish |
| --- | --- | --- |
| Workspace monitor | [monitor plan](../../experiments/control-center/LUNA-MONITOR-PLAN.md), [projection adapter](../../runtime/src/features/control-center/workers.ts) | Pool/task projection from `/api/v1/state`; endpoint validation currently permits only loopback HTTP. |
| Luna observation | [closed canary observation](../../runtime/src/features/control-center/are-luna-observation.json) | Records a September 6 completed `gpt-5.6-luna` turn with zero effect requests. Its absolute `cyberalchemy-successor` source is absent here; this is historical observation, not a fresh verification. |
| RWO integration | [realization README](../../../work-orchestration-implementation/README.md), [bindings](../../../work-orchestration-implementation/bindings.json) | Finite DAG and bounded shell executor candidate; the referenced `projects/cyberalchemy-orchestrator/implementations/rwo-rust` kernel is absent from the inspected sibling checkout. The existing micro-swarm example uses a RunPod shell contract, not a proved Codex adapter. |
| ARE model | [coding runtime](../../../development/agent-reasoning-engine/codex-integration/coding-agent-runtime/README.md) | Bounded coding candidate and historical gateway restart/reconnect canary scope. |
| ARE implementation | [App Server wrapper](../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/README.md), [coding runtime](../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/README.md) | Local source exists for the wrapper, gateway and injected coding transport; current tests and exact source bindings still need evaluation. |

`../domainspec-core` relative to the repository root is an additional source
repository, not this checkout's parent. It contains RWO research and older ops
campaigns. Its Co-Op Engine VPS README describes static-site hosting and does
not select a Luna host. Do not substitute that deployment for this plan.

## Product construction frontier

The frontier is the integration contract prototype. Individual components exist;
the complete Workspace -> RWO -> ARE -> Codex App Server -> Luna path has not
been demonstrated by this inspection.

Runnable planning work is to specify one task envelope, stable request identity,
explicit model selection, result/verification envelope and state projection.
The proposed first model is the exact historical `gpt-5.6-luna` identifier;
availability on the eventual authenticated runtime remains unverified.

The next implementation boundary should follow this sequence:

1. Bind the recoverable RWO kernel and ARE implementation bytes. Inspect the
   existing source contracts and tests before creating an adapter. Correct
   checkout-layout assumptions in a separately scoped candidate if required.
2. Define an RWO executor adapter that delegates a bounded task to ARE. Keep
   scheduler state, ARE session identity and Codex thread/turn identity distinct.
   Preserve the existing accepted-history owner and explicit effect decisions.
3. Test the adapter locally with scripted transport: one dispatch per request,
   changed-request conflict, timeout, cancellation, failed verification, and
   ambiguous completion. An uncertain delivery must not silently redispatch.
4. Project actual adapter observations into the existing Workspace schema.
   Demonstrate disconnected, stale, queued, active and terminal states without
   inferring a running worker from a planned strategy node.
5. After a bounded live-run scope is selected, prove one Luna task in a
   disposable fixture through the actual App Server transport. Record exact
   binary/profile/model, task/session identities, result and independent
   verification. Then test restart/reconnect without duplicate work.
6. Extend to a small finite DAG with bounded concurrency and explicit fan-in.
   Only after that product candidate passes its required tests should its
   owner review it and a separate VPS deployment decision be prepared.

This sequence carries D65 forward: prototype definitions and navigation ontology
scaffold -> product/business/DomainSpec/system and implementation prototypes ->
one exact testable candidate -> current tests -> product approval -> separate
operational decisions. Existing scaffolds are dependencies to inspect, not
admission inherited by this proposed composition. No registered ontology runtime
is required for this planning document; no ontology records were queried or
promoted. The composition's exact record selectors must be bound before its
implementation candidate is evaluated.

## Operational support

| Task | Owner | Affected stage | Current causal effect |
| --- | --- | --- | --- |
| Locate or restore the exact RWO kernel checkout | Repository/runtime owner | Step 1 and actual RWO integration tests | Missing source blocks actual-kernel integration, but not contract planning. |
| Verify current Codex binary, profile and Luna access | Runtime operator | Step 5 | Blocks the live canary only; scripted tests remain independent. |
| Select VPS, service identity, work directory and persistence layout | Deployment owner | Remote runtime | Host, `are-luna` identity and isolated source/home paths are bound and fixture-tested; operational journal policy remains open. |
| Select authenticated transport from Workspace to the remote service | Workspace/runtime owners | Remote observation | Temporary strict-SSH forwarding to the existing loopback state API passed; persistent observation transport remains open. |
| Prepare exact deployment, recovery and rollback envelope | Deployment owner | Post-product-review remote rollout | Deferred; no provisioning, credential access, service launch or external effect is authorized by this document. |
| Route and index sibling sources | Repository navigation owner | Source discovery only | Delegated in this conversation; not an execution prerequisite. |

## Evidence and acceptance

Required product evidence is one trace linking a bounded task to its RWO state,
ARE request, Codex turn, verified outcome and Workspace observation, followed
by negative and restart cases. A UI render, historical canary or model name
alone cannot establish this whole path. Each claimed result must identify the
tested bytes and distinguish scripted, local live and remote live evidence.

No runtime tests or live model calls were run while authoring this plan. The
current local checkout reports no Git HEAD, so its files cannot be presented
as a restored committed checkpoint. The Goals router also reports that planning
candidates cannot presently be registered as admitted execution state.

## Open Questions

- Where is the exact RWO kernel/successor checkout corresponding to these bindings?
- Which VPS and runtime operator should own the first remote instance?
- Which existing ARE transport contract should the RWO executor bind, and what
  persistence owner reconciles a crash between task acceptance and dispatch?
- Should the first remote Workspace connection use a local tunnel or a separately
  tested authenticated remote adapter?
- Is the September 6 Luna canary's original source recoverable, and does a fresh
  bounded run reproduce its result with the selected binary/profile?

These questions belong to this continuation candidate. Future execution must
resolve only the questions causally required by its selected stage.

Current runtime continuation: the isolated VPS fixture bundle is staged and tested;
see [runtime setup receipt](evidence/runtime-setup.json) and [HOST-PLAN.md](HOST-PLAN.md).
Operational supervision and a bounded live Luna turn now pass; RWO wiring and
broader task/recovery scope remain open there.
