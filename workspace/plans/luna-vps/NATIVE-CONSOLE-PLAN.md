# Native console integration

Status: owner-directed local implementation candidate, 2026-09-07.
Authority effect: none. This implements the bounded next step after
[NATIVE-TRANSPORT-PLAN.md](NATIVE-TRANSPORT-PLAN.md), under the existing CAV2-D65
construction chain. No new ontology record or selector is required. MCP remains
last; live-provider and VPS activation are separate operational work.

## Plan and implemented scope

1. Add `/native` to the full sibling orchestrator React console.
2. Serve that build and its task API from one loopback origin.
3. Review immutable supplied-text tasks; reserve durable launch intent before
   provisioning a private native host; execute through the tested Rust driver.
4. Expose cancellation, actual verified results and restart-safe history.
5. Test the real transport and browser, then supervise the local console.

The [console adapter](runtime/native-console-server.mjs) runs the existing
[orchestrator native driver](../../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/runtime/src/bin/are_native_fixture.rs).
Each task has its own registered run and journal. That Rust process is its sole
history writer. Node stores launch intent and projects the driver's result; it
never fabricates supervisor receipts or edits run history. The driver checks a
private cancellation marker and submits cancellation through its owning service.
Unique task IDs now also identify the native run's semantic work.

The full console has a dedicated local route; existing direct-provider research
runs are not migrated into this task collection. The local server exposes no
legacy run-creation or provider endpoints. This is an incremental integration,
not the unified VPS scheduler or a replacement for its existing console backend.

## Protocol and boundaries

- `GET /api/v1/native-tasks`: actual local launch records and verified results.
- `POST .../review`: closed task contract, objective `understand`, fixed candidate
  and profile, task digest, five-minute review and fixed fixture budget.
- `POST .../launch`: review ID and task digest only. Changed digests are rejected;
  repeated launches return the existing job without redispatch.
- `POST .../<job>/cancel`: persisted request, forwarded by the Rust owner.

All writes require the exact loopback Origin, application/json and
`X-Orchestrator-Intent: native-task`. Host validation prevents DNS rebinding.
There is no cross-origin permission. The HTTP interface is for the local OS
operator; it is not an authenticated remote/multi-user service. It binds only
127.0.0.1. Browser users do not need an API token; the internal host socket token
is private and is never returned by this API.

Mode is closed to `native-fixture`: actual ARE and Codex execution, a deterministic
fixture response, zero external model calls, one active task, at most ten reserved
launches per configured lifetime budget. The installed instance has five. Review
is not execution approval by ARE and native completion is not owner acceptance.
The page states that the response is a test result, not model-generated analysis.

## Persistence and recovery

The adapter holds an OS file lock. Each launch reservation is atomically written
and fsynced before dispatch. Budget and candidate/profile/driver/host bindings
are retained across restarts; changing configuration does not reset them.
Completed history is verified by the Rust offline replay path before display on
startup, including task/result binding. Interrupted or unverifiable tasks become
`uncertain` and prevent new launches. There is no automatic replay, retry, guard
removal or budget replenishment.

The user service supervises the process group and handles graceful cancellation
on stop. An abrupt machine loss retains the uncertain reservation. Runtime socket
files live under a private `/tmp` directory and can disappear on reboot; durable
run and launch evidence lives under the user's persistent state directory.

## Local use

Open **http://127.0.0.1:18085/native**, edit the task, select **Review task**, then
**Launch fixture task**. The result appears in history. No token entry is needed.

Installed service: `ca2-native-console.service`, a systemd user service enabled
for the user session. It starts when the Linux user session starts; this does not
promise that Windows will start WSL automatically.

```sh
systemctl --user status ca2-native-console.service
systemctl --user restart ca2-native-console.service
journalctl --user -u ca2-native-console.service -n 40 --no-pager
```

Config and durable state: `~/.local/state/are-workspace/native-console-01/`.
Published frontend and pinned driver: `~/.local/share/are-workspace/native-console-01/`.
Native candidate: `~/.local/share/are-runtimes/candidates/6b12d9c903080a07/`.
The older preview and task bridge state are preserved and are not used by this
console. Do not delete task records, native guards or old bridge launch ledgers
as a restart procedure.

## Validation

[Test the API and native path](runtime/test-native-console.mjs) covers hostile
headers, closed tasks, review binding, duplicate launch, capacity, actual native
completion, offline restart verification, cancellation, exhausted budget and
interrupted state. [Full browser acceptance](runtime/test-native-console-browser.mjs)
checks the real built console, edit/review invalidation, launch/result, reload,
mobile overflow and browser errors. Exact results and source hashes are recorded
in [NATIVE-CONSOLE-EVIDENCE.json](NATIVE-CONSOLE-EVIDENCE.json).

## Open Questions

- Which admitted live-provider profile and budget should be enabled next?
- How should this native task collection join the VPS shared scheduler and run
  projection without creating a second history writer?
- What operator reconciliation may resolve interrupted execution versus accepted
  receipt gaps? Until defined, uncertainty blocks new dispatch.
- Which VPS service identity, socket mount and authenticated console route will
  host this mode? Local supervision is not a VPS deployment.
