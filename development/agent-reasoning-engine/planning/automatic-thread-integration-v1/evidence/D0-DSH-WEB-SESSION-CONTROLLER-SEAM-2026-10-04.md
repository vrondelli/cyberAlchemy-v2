# D0 — disposable DSH Web session-controller seam

Status: **bounded feasibility proof**, 2026-10-04. Authority effect: none.
This is not an ARE-owned Web conversation or an activation receipt.

## Result

The pinned, installed DSH Web profile can replace its native
`session-controller` service in a disposable Host composition. An authenticated
Web RPC reached the replacement's `create`, `selectModel`, `rename`, `fork`,
`prompt`, `updateQueue`, and `cancel` methods, plus the separate
`openWorkspacePath` Host effect. Each rejected the request before calling the
native implementation. No Agent or model dispatch was requested by the probe.

The probe preserves DSH Web's normal launch-token-to-cookie exchange and
Origin-checked HTTP RPC: a no-cookie request and a cookie-bearing request
from a foreign Origin were rejected before reaching the replacement. It uses
a fresh `DSH_HOME`, a temporary overlay, disabled telemetry/effect tools,
and a controller that throws a fixed
`gateway/cancelled` response. It deletes its exact temporary home after
terminating the disposable process. The content-free marker proves the
replacement method ran; neither session content nor credentials are written.

The patch must **disable** the original `session-controller` row and **insert**
a new row with the replacement module. DSH's patch algorithm treats `name` on
an existing row as a match guard, not a replacement. The first attempted
`name` override was skipped; `--dump-config` and the absence of a construction
marker diagnosed it. The corrected patch was checked against the composed
config before boot. The replacement's method parameter must be named
`request` because the Typert gateway checks implementation parameter names
against the generated descriptor; `_request` was rejected before the method.

## Verification

| Check | Result |
| --- | --- |
| `node --test test/web-session-controller-probe.test.mjs` in the DSH adapter package | 1 passed, 0 failed |
| `npm test` in the DSH adapter package, including P2b | 22 passed, 0 failed |
| Native controller row | Disabled in the disposable overlay; not changed in the installed bundle |
| Replacement reachability | Web `session/create`, `session/selectModel`, `session/rename`, `session/fork`, `session/prompt`, `session/updateQueue`, `session/cancel`, and Host effect `session/openWorkspacePath` each returned the probe's denial and wrote its corresponding marker |
| Web trust fence | No-cookie and wrong-Origin RPCs did not reach the replacement; the normal token-to-cookie path did |

The [test](../../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/web-session-controller-probe.test.mjs)
and [denial fixture](../../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/fixtures/web-session-controller-deny-probe.mjs)
are opt-in local evidence. They do not forward prompts to ARE or modify the
normal Web profile.

## Claim ceiling and next dependency

This closes the **mutation insertion-point** question for the seven tested Web
session mutations and the separate path-opening Host effect on this pinned
package graph. It does not prove all Web mutation paths, browser-side UI
behavior, native session writer exclusivity, first-turn
objective binding, prompt acknowledgement versus terminal completion, journal
cursor recovery, approval handling, or absence of alternate direct ingress.
Those are P1/P2/P3/D1/D2 obligations. In particular, a subclass that only
denies methods is not yet a safe forwarding adapter. Before D1, inventory all
native session mutations and event streams, then mediate them with a durable
identity/writer record without creating a second text-replay history.

## Open Questions

- Do workspace, plugin, subagent and other Host service routes create any
  alternate turn/effect path outside these seven methods?
- Which native DSH session/journal identifiers and cursor are stable across a
  Web Host restart and generation change?
- How will an ARE decision receipt be tied to Web authentication without
  treating the caller-supplied session ID as authority?
