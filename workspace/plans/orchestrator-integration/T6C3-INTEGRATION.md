# T6C3 — Shared scheduler and Workspace controls

Candidate construction, 2026-09-08. Authority effect: none. Owner authorization:
user “continue”, under [D65](../../../agent-routing/ROUTER.md#d65-construction).

## Implemented integration

The sibling `runtime/src/native_scheduler.rs` composes the existing registration,
recovery and coordinator APIs. Web startup validates a private operator host map,
scans persisted attempts, and obtains shared capacity from recovery before starting
either executor. Native ticks run on a separate thread from blocking research
calls. Both use the same OrchestratorService and capacity tracker. The consistent
lock order is native scheduler, then run owner. Live attempts keep renewing and
observing cancellation even when scheduling is paused. Unresolved attempts are
never redispatched after restart.

New web controls use the existing origin/content-type/intent boundary:

| Endpoint | Intent | Body |
| --- | --- | --- |
| `POST /api/v1/native-runs` | `register-native-run` | `host_handle`, `reviewed_task_digest` |
| `POST /api/v1/runs/{key}/cancel` | `cancel-native-run` | `{}` |
| `POST /api/v1/runs/{key}/reconcile-stop` | `reconcile-native-stop` | `{}` |

Registration must exactly match an operator-configured immutable reviewed task.
It does not accept a browser-selected socket, credential, model or task override.
The owner journal makes repeated registration converge on one run. Cancellation
is recorded in that owner; the native tick observes it. Stop reconciliation only
stops uncertain work and does not accept its output. Completed output comes from
offline owner receipt/event replay. Web projection includes native execution state,
fixture mode, text-task icon, model, verified result, advertised controls, recovery
capacity and a separate native executor pool entry sharing the global limit.
Endpoint addresses and token contents are excluded from that projection.

## Operator configuration

Set `ORCHESTRATOR_NATIVE_HOST_MAP` on an isolated `orchestrator_web` candidate to
an owner-readable private regular JSON file (no group/other access; same UID as
its state root). Its closed structure is:

```json
{
  "schema_version": "are-native-host-map/v1",
  "hosts": [
    {
      "registration": "Replace with the complete ReviewedNativeRegistration object",
      "socket_path": "/absolute/operator/provisioned/host.sock",
      "token_path": "/absolute/operator/provisioned/token"
    }
  ]
}
```

The `registration` placeholder above is documentation, not runnable configuration.
Use the typed contract in sibling `runtime/src/native_registration.rs`: a
`native-fixture` binding, exact reviewed task digest, review timestamps, execution
deadline, host handle and admission reference. Duplicate handles/sockets and
non-absolute endpoints reject. Real endpoint permissions are validated by the
existing UnixHost adapter. Missing configuration starts with no launchable native
hosts but still recovers reservations for existing attempts.

The dashboard gains an optional `scheduler` configuration field:

```json
{
  "runtime_id": "shared-main",
  "origin": "http://127.0.0.1:18086",
  "public_origin": "https://orchestrator.example",
  "controls_enabled": true
}
```

`origin` is a selected loopback endpoint; `public_origin` must match the web
owner's configured control origin. The runtime ID must differ from the existing
console connection. Existing dashboard configuration and behavior remain valid
when this field is omitted. No installed configuration was changed in this task.

## Existing frontend and histories

The gateway merges observations using distinct runtime/run identities. It does
not copy histories or write execution journals. Native fixture runs appear in the
existing Dashboard and embedded console with text-task icons. Native cancel and
stop actions are forwarded only when advertised by a fresh selected-owner view.
Offline observations retain prior results and remove controls. Unknown delivery
returns an explicit check-runs diagnostic. Browser input cannot alter the selected
upstream origin or owner key beyond choosing an advertised run.

The same frontend also supports these controls in standalone web mode. Overview
remains the first tab; graph rendering still follows the existing graph-property
rules. Results reported through the HTTP gateway remain **source-reported** in
Workspace; they do not acquire the separate console adapter's independent offline
verification claim. The existing source-task composer still uses its selected
native console connection. This task adds the main owner's reviewed registration
API; it does not silently move old launches or provision hosts from the browser.

## Validation

[T6C3 evidence](T6C3-EVIDENCE.json) binds sources and logs. Coverage includes:

- Registration convergence, exact host review, start/tick/result replay, shared
  capacity, owner cancellation during pause, startup uncertainty and explicit stop.
- Web route/intent validation, registration and cancellation, redacted projection.
- Existing Rust, frontend and Workspace projection regressions.
- HTTP gateway targeting, rejected origin/body/action, result provenance and
  offline retention with controls removed.
- Chromium journey through real candidate UI and gateway with an HTTP host double:
  Overview first, cancel, uncertain stop reconciliation, reload without repeating
  controls, offline transition and no page errors.
- Candidate dashboard build with existing reference snapshot hashes preserved.

These tests use temporary owners and host doubles, not a real native App Server
call through the new scheduler. The installed fixture budget is not consumed.

The final ARE continuation receipt reports Define-profile provenance drift.
The [evidence](T6C3-EVIDENCE.json) retains that diagnostic; routing metadata was
not refreshed. Construction and test completion remain separate from that
blocked bookkeeping call.

## Open Questions

T6D remains the next task: real isolated native fixture acceptance through this
path, including the exact host provisioning/registration handoff and interruption
scenarios. The host map is operator-provisioned; it is not an authenticated human
review service or a general host provisioner. Existing proxy/authentication
boundaries still apply to deployed web controls. Live provider modes remain
rejected by the native graph contract.

Long host timeouts or large native pools can delay bounded ticks; lease expiry
fails closed, but load/performance acceptance remains T7. Live coordinator stop
confirmation can be re-reconciled conservatively on restart when no durable full
recovery acknowledgement exists. Uncertain output is not reconstructed or accepted
by this integration. T8 owns selected deployment, service identity and budget.
MCP remains last. Standard catalog snapshot drift remains outside this candidate.
