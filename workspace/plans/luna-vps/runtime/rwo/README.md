# Bounded RWO / ARE / Workspace integration

Status: isolated VPS services active; live RWO / ARE smoke and Workspace projection PASS, 2026-09-07. Authority effect: none.
Open questions are owned below. MCP remains deferred.

## Plan and construction boundary

The user's “lets plan and do this” continues the existing VPS integration.
`CA2-ROUTE-IMPLEMENT` selects exact native mutation under the D65 construction
boundary; its consequence gate is not a new approval or governance admission.
This extension owns only a single fixed no-tool smoke command, its durable
history, its private ARE host state, and a read-only Workspace projection.

1. Bind the recovered kernel by exact file hashes, without changing its semantics.
2. Compile and reduce a two-node composition using that kernel. Persist accepted
   command history and dispatch intent before calling the private ARE control socket.
3. Verify ARE's completion receipt, then accept the terminal event. Replay both
   transitions through the kernel before exposing a successful result.
4. Prove failures and replay with fixtures, then execute one fresh VPS smoke in
   a separate host state directory with one provider request and 512 output tokens.
5. Expose that stream at a loopback `/api/v1/state` endpoint and show its command,
   native thread/turn, graph, and completion bindings in Workspace.

## Exact source binding

[source-binding.json](source-binding.json) points to the complete vendored crate
in the sibling `cya-orquestrator` checkout. Its manifest and kernel match
[the existing RWO bindings](../../../../../work-orchestration-implementation/bindings.json).
The top-level sibling crate lacks `src/admission.rs`; the explicit vendor ledger
supplies its exact hash. `stage-build.py` checks all three required source files
before copying implementation bytes into a new temporary build directory. There
is no alternate source search or fallback at build/runtime.

The kernel admits only its existing fixture payload `{job_id: string}`. The
requested job ID is a digest reference to the exact host request binding. The
terminal job ID binds the command identity and verified ARE result. This proves
one candidate integration, not a general task schema or a promoted RWO contract.
Host code verifies the result; the pure kernel does not independently verify ARE.

## Build and tests

The isolated build uses Ubuntu 24.04 image digest
`sha256:33ceb71981b602c1a7443a53469e4dba065f7503eab3078a2d7a57a2ab987517`,
Rust 1.98.1, the checked-in Cargo lock, and ICU 74 / Unicode 15.1. ICU 74 is
already installed on the selected VPS. The local Ubuntu 26.04 test uses copies
of those VPS libraries under `/tmp/ca2-rwo-icu74` via `LD_LIBRARY_PATH`; no system
library replacement is needed.

```sh
python3 stage-build.py /tmp/new-rwo-build
# In the pinned Ubuntu image, with Rust and ICU 74 available:
cargo build --release --offline --locked
node test-adapter.mjs /absolute/rwo-are-pilot-kernel
node test-native.mjs /absolute/ARE-candidate /absolute/rwo-are-pilot-kernel
```

[Adapter tests](../../evidence/rwo-adapter-test.json) exercise the actual kernel,
durable command-before-effect ordering, changed-input rejection, concurrent
dispatch, timeout, invalid completion, corrupted history, loopback HTTP and the
real Workspace TypeScript projection. [Native tests](../../evidence/rwo-native-test.json)
exercise actual Codex, persisted exact hook trust, ARE context and completion,
then replay with the native host offline. Both use zero external model calls.

## Persistence and operations

`history.json` is atomically replaced after file fsync, followed by directory
fsync. An exclusive dispatch lock prevents concurrent execution. An interrupted
or uncertain dispatch retains its lock and state and never retries automatically.
A completed history replays without requiring the native host. A corrupted
history returns HTTP 503 instead of successful task evidence. These files are
owner-controlled local integrity evidence, not signed or independently trusted
attestations. Back up the whole private state directory together.

`adapter.mjs config.json run` executes or returns verified completed history.
`verify` projects verified history once; `serve` exposes GET `/api/v1/state` on
IPv4 loopback. There are no HTTP write or dispatch operations. CORS allows HTTP
loopback origins only. The projection deliberately reports worker activity as
unknown: a stored completion proves no live capacity. Its single-call budget is
reported consumed after success.

The isolated native host retains the prior launcher implementation and fixed
prompt. Its new state does not reset the already completed pilot. The existing
orchestrator application and the original `are-luna-pilot.service` are separate.
Stop the new host and projection units to roll back execution/listening; retain
history and do not clear locks as a retry mechanism.

## Active VPS binding and Workspace connection

Deployment: `/srv/are-luna-pilot/rwo/ab3cb26bb908e0cc` on the selected
`root@187.77.248.154` VPS. `are-rwo-luna.service` owns the private native host;
`are-rwo-workspace.service` serves the read-only projection. State is under
`/var/lib/are-luna-pilot/rwo-host` and `rwo-history`. The control socket is
`/run/are-rwo-luna/control.sock`, accessible only as the dedicated service user.
Port 18081 was occupied; preflight rejected it before mutation. Port 18082 was
verified free and selected explicitly. The original pilot and application stayed healthy.

To connect Workspace's **Local orchestrator** field, keep this SSH tunnel running:

```sh
ssh -N -o BatchMode=yes -o StrictHostKeyChecking=yes -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:18082:127.0.0.1:18082 root@187.77.248.154
```

Enter `http://127.0.0.1:18082` in Workspace. If that local port is occupied,
choose another local port on the left side of the forward and enter that port.
The verification tunnel was closed after testing. This does not expose a VPS
public listener or supply dispatch controls to the browser.

The [live result](../../evidence/rwo-live-result.json) records request
`rwo_luna_live_20260907_01`, one provider call, reply `ARE_LUNA_LIVE_OK`, and the
two accepted RWO transitions. [Post-live checks](../../evidence/rwo-post-live-check.json)
prove zero-call replay and existing-service health. The
[Workspace live check](../../evidence/rwo-workspace-live.json) passed through a
strict SSH forward and the real TypeScript projection. Targeted strict typing
and TSX compilation passed; the full Workspace build/browser rendering were not
run because its dependencies are absent in this checkout.

Rollback on the VPS:

```sh
systemctl disable --now are-rwo-luna.service are-rwo-workspace.service
```

Keep both state directories for inspection. Neither rollback nor a completed
smoke authorizes resetting the request budget or dispatching another task.

## Open Questions

- The [immutable text-task extension](../TASKS.md) now handles supplied text and
  bounded output; tool-enabled tasks remain separate. Neither extension expands
  the frozen kernel's payload admission.
- Owner-mediated reconciliation after uncertain dispatch remains manual; do not
  infer permission to redispatch from a timeout or process restart.
- Workspace launch controls, multiple workers, cancellation, and adoption of
  arbitrary existing Codex sessions are not implemented by this smoke adapter.
- Equivalence between the recovered source and the existing deployed Python
  orchestrator release is unproven; this integration uses its own explicit kernel.
- Broader host lifecycle and MCP questions remain in [HOST-PLAN.md](../../HOST-PLAN.md#open-questions).
