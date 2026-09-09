# Workspace / ARE VPS pilot plan

Status: private services active; bounded RWO → ARE → Luna and Workspace projection live-tested. Authority effect: none.
Owner: Workspace product owner; VPS selected from DomainSpec Core configuration.
Service identity: `are-luna`; supervisor: `are-luna-pilot.service`. Broader recovery and task ownership remain open.

## Outcome and current frontier

Run one bounded worker through the full ARE repository wrapper and native Codex
host on a selected VPS. Keep the native host, gateway client and hook callback
bridge on that VPS so native loopback callbacks reach the correct process.
The existing orchestrator state API is now verified at VPS loopback
`http://127.0.0.1:18080/api/v1/state`. A temporary SSH local forward and the
unchanged Workspace projection passed against this live endpoint. ARE gateway
JSON-RPC is not `/api/v1/state`.

The [host candidate](host-binding.candidate.json) contains the exact profile
reference and hash, proposed single-client overrides, tested runtime versions,
and the observed isolated installation paths. The user selected the existing
DomainSpec Core VPS configuration: `root@187.77.248.154`, corroborated by the
Co-Op Engine and Body War deployment scripts linked in the candidate. This
selects the shared host only; existing application directories and services
are not ARE deployment targets.

The [bounded RWO integration](runtime/rwo/README.md) now passes with the exact
kernel recovered from the sibling vendor ledger, a durable host command journal,
the ARE native host, and Workspace's actual projection. One new live request
succeeded; replay verified both RWO transitions with zero new provider calls.
The read-only endpoint is VPS loopback `http://127.0.0.1:18082/api/v1/state`.
The complete interactive product remains incomplete: arbitrary task admission,
Workspace launch controls and multiple workers are still outside this smoke scope.
The existing orchestrator release was found at
`/srv/cyberalchemy-orchestrator/releases/9de7de67`. The existing
Python Luna worker reports available through the live state API. A separate
no-tool native `gpt-5.6-luna` turn now passed through the ARE service in one
provider call, with the exact expected reply and a bound native completion. The isolated Node/Codex/ARE fixture bundle is now installed under
`/srv/are-luna-pilot/candidates/04384954e710e58f`, with private home
`/var/lib/are-luna-pilot`. It passed the full native gateway canary as `are-luna`.
This source snapshot is sufficient for the fixture, not a complete checkout.
See [runtime setup evidence](evidence/runtime-setup.json) and the
[reproducible runtime tooling](runtime/README.md). The private service is now
active; [launcher operations](runtime/LAUNCHER.md) and
[live evidence](evidence/luna-live-test.json) record its exact scope. It accepts
only the completed fixed smoke request; broader task admission is not implemented.

## Proposed host binding

| Surface | Candidate choice | Evidence / remaining binding |
| --- | --- | --- |
| Native binary | Codex 0.153.0-alpha.5, exact SHA in candidate | Exact binary installed in the isolated candidate; VPS native fixture PASS. |
| Node | 26.8.1 | Exact binary installed; host libatomic1 prerequisite resolved. |
| Repository layout | Isolated candidate parent containing selected `cyberAlchemy-v2` source snapshot | Actual profile load and native fixture passed on VPS; broader checkout remains separate. |
| Backend | `direct-stdio`, `app-server --listen stdio://` | Native test passed; avoids an unselected daemon. |
| Gateway client | `codex:luna-pilot`, `interaction-bound`, maximum one client | Candidate overrides tested through the full wrapper. |
| Gateway transport | Private Unix socket owned by the dedicated service user | `are-luna`; private service sockets under `/run/are-luna-pilot`; journals under its private state home. |
| Callback transport | Ephemeral loopback HTTP with a per-process credential | Bridge credential file belongs to the host; use mode 0600, not command-line secrets. |
| Persistent state | Gateway session journal and per-consumer reasoning state outside disposable test data | Private home `/var/lib/are-luna-pilot` selected; per-generation journals are implemented; process-loss recovery explicitly blocks. |
| Workspace observation | SSH local forward to the RWO loopback HTTP state endpoint | Live VPS loopback port 18080 and unchanged Workspace projection passed. |
| Live model | Exact requested `gpt-5.6-luna` | Native no-tool turn verified in one provider call; exact reply and ARE completion binding recorded. |

The service retains generation journals and a fsynced, one-attempt live ledger.
Resume credentials and callback bindings stay in memory; process loss leaves
a lock requiring inspection. Clean restart can return a completed result without
a new provider call. Local/VPS fixture tests also cover failed-outcome blocking.

## Plan and acceptance gates

1. **Remote inventory completed.** Strict SSH succeeds as `root` on
   `srv1772692`, Ubuntu 24.04.4 LTS x86-64. Existing orchestrator release and
   loopback state API are verified. The dedicated runtime candidate is now
   staged and tested; existing application directories were not repurposed.
2. **Exact candidate checked on the host (PASS).** Render the candidate overrides over
   the hash-matched base profile and run `loadRepositoryProfile` against the
   observed checkout parent. Reject missing or changed sources. Verify the
   single allowed consumer and private transport paths.
3. **Disposable and installed native pilots completed (PASS).** Use the tested host composition and the
   fixed local model fixture first. Require prompt/tool/Stop attribution,
   three native turns across two threads, completion after reconnect, stable
   turn replay, and exactly one fixed `printf` execution. Clean up the test
   configuration, processes, sockets and fixture state.
4. **Operational launcher implemented and activated (PASS).** The single
   supervisor owns gateway, client, native host and callback bridge. Exact hook
   hashes are persisted and reverified without a bypass. Code is root-owned;
   private state belongs to `are-luna`. The key arrives through systemd
   credentials. Automatic restart is disabled and uncertain outcomes block.
5. **One live Luna task verified (PASS).** The fixed no-tool smoke returned
   `ARE_LUNA_LIVE_OK` through native Codex and ARE. The provider allowed one
   request and at most 512 output tokens. Replaying the same request returned
   its recorded result without another call. Different request IDs are rejected
   by this pilot's completed attempt limit.
6. **Integrate RWO and Workspace.** Recover the exact RWO kernel and adapter
   contract; trace one task into the real state API. Test a loopback SSH forward
   with that endpoint, stale/disconnected status and cancellation. Then consider
   a finite multi-worker DAG; the pilot is deliberately one worker.

Stop conditions are missing source bindings, version/hash mismatch, unauthorized
consumer, uncertain dispatch outcome, missing prompt binding or failed outcome
verification. None should trigger a new request key or automatic redispatch.

## Tests performed

| Test | Result | Scope |
| --- | --- | --- |
| VPS full-wrapper native fixture | PASS | Disposable `nobody` test, then installed `are-luna` test; three turns/two threads and replay without duplicate dispatch. |
| Installer boundaries | PASS, five checks | Valid manifest, changed file, unexpected file, symlink and path escape. |
| Candidate profile load | PASS | Actual source loader and proposed overrides; local paths only. |
| Full repository wrapper + native gateway + callback bridge | PASS | Three turns, two threads, one fixed tool; authenticated reconnect and replay without duplicate execution. |
| Workspace worker contract | PASS, four existing test bodies | Unchanged TypeScript source loaded by Node; native assertions substituted for unavailable Vitest imports. |
| SSH forward syntax | PASS | `ssh -G` with synthetic host and ports; no SSH connection. |
| Selected VPS SSH inventory | PASS | Strict SSH succeeds; runtime and release metadata read without changes. |
| Live SSH tunnel + Workspace projection | PASS | Actual state API; 12 tasks reported succeeded and Luna worker available, active 0. Tunnel closed after test. |
| Deployed release manifest | PASS, eight files | Release `9de7de67`; source manifest match, not RWO conformance. |
| Native Codex/ARE runtime | PASS | Pinned runtime and private supervised launcher tested under `are-luna`. |
| Fresh live Luna task | PASS | One no-tool request, exact expected reply, bound native completion; cached replay used no new call. |

The [test receipt](evidence/host-plan-tests.json) links exact native evidence,
source hashes and the temporary harness patch. The full-wrapper experiment was
derived from the existing native canary, with an actual repository-profile load,
isolated journals, the single-client allowlist and explicit architecture prompts
for all three turns. It did not change product source. The patch records that
local experiment; its paths are specific to this checkout and temporary profile.
The earlier short “next” case remains covered by the original native canary.

## Operational tasks and owners

| Task | Owner | Affected stage | Causal blocker |
| --- | --- | --- | --- |
| Dedicated runtime installation | Runtime / deployment owner | Native VPS pilot | Completed: pinned bundle staged and full native fixture passed as `are-luna`. |
| Bind service user, paths, source snapshot and pinned runtime | Runtime operator | Host candidate validation | Completed and verified on VPS. |
| Exact hook trust and service activation | Host / deployment owner | Operational activation | Completed for the tested private single-pilot launcher. |
| Process-loss recovery | Runtime owner | Process restart | Explicitly blocked by stale lock; no automatic restart or redispatch. |
| Bind exact RWO source and ARE executor | RWO owner | Native end-to-end integration | Completed for the isolated fixed smoke; equivalence to the existing Python orchestrator release remains unproven. |
| Broader task, worktree and budget admission | Runtime / task owner | Next live work | Fixed one-call no-tool pilot completed; further task scopes remain to be bound. |
| MCP | Integration owner | Final adapter | Remains last. |

D65 posture: existing prototype definitions and navigation ontology → source-bound
host-composition candidate → local and VPS tests → user-directed private
service activation, exact recovered RWO kernel binding, and bounded live evidence. This grants no broader task or
governance authority. The Goals route does not register
this plan as admitted execution state. No new ontology-runtime selector or
authority record is introduced.

## Recovery and rollback proposal

For the disposable pilot, stop the bridge/client/gateway and remove only its
temporary root. For a future service, capture the prior service configuration
before installation; stop the candidate service and restore that exact prior
configuration on rollback. Preserve journals for uncertain outcomes and
investigation. Do not delete durable state or replay an uncertain task as a new
request. Exact service names and rollback commands require the selected host.

## Open Questions

- Which broader repository/worktree snapshot is needed for the first live task beyond the tested fixture bundle?
- How should process-loss recovery and the existing credential file's reboot lifecycle be owned?
- Which RWO source revision and executor contract produced deployed release `9de7de67`?
- What next bounded task/worktree/budget should follow the completed no-tool live pilot?

The historical [VPS connection test](evidence/vps-connection-test.json) records
the initial host-key diagnostic. The [current remote readiness receipt](evidence/vps-readiness-tests.json)
supersedes that blocker with successful strict SSH, live projection and release checks. The earlier local test
receipt records the prior host-unbound planning snapshot; its local profile
overrides and tested product source remain unchanged.
