# Shared run views — candidate

This package supplies a non-executing view contract for the Workspace dashboard,
Runs surface and later cross-feature links. The implementation DAG is
[the integration plan](../../../../plans/orchestrator-integration/PLAN.md).
Authority effect: none. T2 now consumes these adapters through a local
read service and the Workspace Dashboard. T1 itself grants no control.

## Contract

[run-contract.ts](run-contract.ts) separates presentation identity, owning run
reference, execution state, scheduling, source freshness, environment and result
verification. The stable view ID is namespaced by an explicitly configured
runtime instance. Native launches keep their view ID after verified completion
provides an owning run reference. The real run key is not calculated from the
launch ID or title. Missing cross-feature origins and lifecycle decisions remain
empty/null. Control negotiation belongs to T4; actions are empty in T1.

[run-adapters.ts](run-adapters.ts) exports:

- `projectNativeRuns(snapshot, source, ownerObservations?)`: asynchronously
  validates task bytes/digest and native result bindings; optionally attaches
  an exact replayed owner response indexed by launch ID.
- `projectOrchestratorRuns(snapshot, source)`: projects the current sibling v1
  run schema and preserves reported lifecycle, results and node counts.
- `combineRunProjections(projections)`: combines distinct configured source
  instances while rejecting duplicate sources and run references.

The source observation explicitly supplies identity, availability and timing.
A stale/offline snapshot remains visible with its freshness label. An unavailable
source is not equivalent to an empty fresh list. Parsing errors must be surfaced
by the later connection layer; callers must not replace them with sample runs.

Native success without an owner observation is only `source-reported`, has no
run reference and carries a diagnostic. `owner-verified` means the trusted backend
supplied a successful offline Rust replay and the adapter checked its task,
output and completion bindings. This is not a signed receipt or browser-side
cryptographic authentication. A browser must never supply the owner observation
to authorize a control action. T1 verifies successful completed histories; active,
cancelled and uncertain owner-reference inspection is future adapter expansion.

The driver now adds `schema_version: are-native-owner-result/v1` and its actual
registry `run_key` to successful run/replay responses. Existing result/status
fields remain. The installed pinned driver and its binding are not replaced.
Legacy histories can be inspected using the new driver on a private copy.

Legacy v1 has incomplete executor/mode metadata. A known deterministic fixture
or demonstration is labeled fixture; research with the known live producer and
Luna strategy is labeled live based on reported producer semantics. Other cases
stay unknown. These are observations, not permission to launch or proof a provider
call occurred. A future explicit producer mode/contract field should replace
this narrow compatibility mapping. Result verification remains source-reported
for the legacy projection; accepted history is not owner acceptance.

## Shared Workspace views

[RunsProvider.tsx](RunsProvider.tsx) supplies one polling subscription to Dashboard
and the registered orchestrator frontend. The earlier Workspace RunsSurface
was superseded by the sibling's existing UI. The host and adapter are described
in [frontend hosting](../../frontends/README.md).

## Checks

From the repository root:

```sh
node --test workspace/plans/orchestrator-integration/run-adapters.test.mjs
```

Node 26 executes the pure TypeScript adapters through built-in type stripping;
there is no React or model dependency. Strict targeted TypeScript compilation
is also required. Workspace permits `.ts` import extensions with `noEmit` so the
same source works in its bundler and the standalone contract checks.

[verify-existing-native.mjs](../../../../plans/orchestrator-integration/verify-existing-native.mjs)
copies one completed task's orchestrator history, performs offline Rust replay,
checks the projection and proves original journal bytes, launch records and
remaining budget were unchanged. It never dispatches a task. Arguments are an
operator-owned console config and the new driver executable; its library path
must use the established ICU/toolchain setup.

## Open Questions

Connection identity persistence, context sharing, reconciliation and VPS
activation are owned by the [integration plan](../../../../plans/orchestrator-integration/PLAN.md#open-questions).
T2 supplies the trusted observation provider and dashboard; T3 supplies shared
run navigation, and T4 owns runtime connection selection and controls.


## Recorded strategy

RunView carries an optional validated strategy. Legacy sources with a full graph
retain their nodes, edges and persona bindings; older model-only descriptors
leave strategy unavailable. Native runtime delivery reads the actual registered
manifest, checks its graph digest and task identity, and projects that graph.
The existing sibling renderer shows it on Overview and Strategy. Overview is
first and default when opening a run and does not switch on completion updates.
