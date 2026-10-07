# G1 hosted-client ownership and policy boundary

Status: bounded local implementation evidence, 2026-09-26. Authority effect:
none. This does not activate or hand over the current desktop task.

## Boundary closed

The authenticated hosted-client API already refused `thread/resume`, history,
runtime reads and new turns for thread IDs outside its client-owned set. Its
`POST /api/turns/interrupt` path did not apply that check. It now rejects an
external thread ID before calling App Server and requires a read-only runtime
observation of the exact owned active turn ID before forwarding an interrupt.
An idle, unknown or mismatched turn fails closed.

The browser previously could submit `approvalPolicy` and `sandbox` on thread
creation, including values weaker than the intended hosted-client posture.
The HTTP API now rejects caller-supplied `approvalPolicy`, `sandbox`,
`sandboxPolicy` and `permissions` on creation, resume and turn start. The
trusted host constructor owns the policy: its current default is `onRequest`
with `workspaceWrite`; a test-only `never` policy is permitted only with
`read-only`. Unrestricted sandbox modes are rejected. The host sends its
selected policy again on `thread/resume` and `turn/start` so a recovered or
previously altered thread does not silently inherit a different client
setting. The user-input canary selects its `never`/`read-only` fixture in
trusted host construction, not in the browser request.

## Verification

- Focused hosted-client tests passed 24/24, covering external and stale
  interrupts, rejection before RPC, exact owned active-turn interruption,
  forbidden browser policy fields, and host-owned start/resume/turn policy.
- Source and native-canary JavaScript syntax checks passed; the full serial
  wrapper suite exited 0 after the final edit.
- The installed `codex-cli 0.155.0-alpha.16.4` fixed-provider
  `native-user-input-canary.mjs --gateway-recovery` passed after policy was
  bound at resume and turn start. Binary SHA-256:
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
  It reported zero external model calls, one resolved user-input request,
  gateway-process restart, same-key replay without redispatch, and no contact
  with the current desktop task.

## Claim ceiling and open questions

This is an ingress and ownership guard for the ARE-hosted client, not proof
that the installed desktop routes its own input through ARE. At the time of
this evidence, the default `workspaceWrite` profile could allow host-side
operations that emit no approval request; native proof here used a trusted
read-only fixture, while workspace-write was covered by local mocks. The
hosted client was subsequently pinned to read-only and the Codex gateway
gained a closed lifecycle parameter contract, including two installed-host
negative probes; see [parameter evidence](G1-HOST-PARAMETER-CONTRACT.md).
The advisory hook and handled approval methods are still not a universal,
non-bypassable effect boundary. G1 and O1 remain open.

Before activation, decide and test the exact host-enforced effect profile,
desktop-client writer relinquishment, account/history watermark, complete
request coverage, and rollback on a disposable equivalent. Neither a
client-owned set nor a policy field on a request authorizes handover of a
desktop-owned task.
