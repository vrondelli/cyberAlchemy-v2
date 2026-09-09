# Private native ARE transport candidate

Status: tested implementation candidate; owner-directed next step, 2026-09-07.
Authority effect: none. Open questions are below.

## Completion

Implemented and tested after recovering from the development-machine reboot.
[Native transport documentation](../../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/docs/are-native-executor.md)
and [exact evidence](../../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/docs/are-native-evidence.json)
record 60 passing Rust tests, actual native completion and cancellation through
the private socket, offline replay and zero external model calls. The native
candidate is now stored persistently with all 1,332 manifest files verified.
The local preview and bridge stopped on reboot and were not reactivated by this
transport change. The follow-up [console/backend integration](NATIVE-CONSOLE-PLAN.md) now supplies
a local review/launch/result route and supervised access. VPS deployment, live
provider access and MCP remain separate.

## Selected product work

Build an explicit native-fixture transport for the one-node orchestrator adapter.
The existing orchestrator remains the only writer. A start/tick interface returns
control between bounded RPCs, allowing cancellation commands and lease renewal.
The private Node host owns the pinned candidate, immutable task, model fixture,
native process and completion checks. Requests may not select filesystem paths,
credentials, live providers or other tasks.

Order: (1) closed envelope and authenticated Unix-socket start/status/cancel,
(2) durable native dispatch guard and tick-based fencing, (3) hostile transport
and cancellation tests, (4) actual Codex/ARE fixture-provider end-to-end test,
(5) source-bound completion evidence and next frontier.

The transport binds the run, graph, command, attempt, fence, task digest, selected
candidate/profile digests and deadline. Successful native completion is evidence
for an orchestrator receipt; it is not owner acceptance. Provider fixture calls
and external provider calls must be counted separately. Live mode remains closed.

## Construction and operations

Current frontier: native transport implementation and tests, following the
[one-node fixture](ORCHESTRATOR-INTEGRATION-ANALYSIS.md). The D65 chain remains a
candidate supplied-text contract, immutable DAG and implementation/test witness;
no promoted ontology, product approval or admitted runtime follows automatically.
No additional ontology record/selector is a prerequisite for this exact adapter.

Runnable: local Rust and Node tests using the shared toolchain and existing
pinned native candidate. Operational owner: VPS operator. Socket mount/UID policy,
release manifest, persistent service supervision and provider credentials affect
the later VPS deployment stage, not local fixture construction. UI enablement,
research DAG contracts, planner inference, live canary and MCP remain deferred.

## Open Questions

- Which exact host/container identities and socket mount should be deployed?
- Which operator reconciliation handles host completion before receipt acceptance?
- The local console review/launch contract is implemented in
  [NATIVE-CONSOLE-PLAN.md](NATIVE-CONSOLE-PLAN.md); shared VPS integration remains open.
