# P1c — opt-in Codex binding admission

Status: **bounded candidate implementation**, 2026-10-04. Authority effect:
none. This is a gateway dispatch guard, not an activated desktop integration
or an admitted P3 objective/context join.

## Implemented seam

The Codex gateway accepts an optional `conversation_binding_gate` only with
the native Codex backend adapter, a file-backed fsynced session store, and
three trusted Host callbacks: `host_context_for`, `verify_host_context`, and
`verify_release`, plus an explicit binding TTL. The subsequent
[P1d creation join](P1D-CODEX-NATIVE-CREATION-JOIN-2026-10-04.md) uses the
same callbacks at native thread creation. No shipped profile supplies or
enables them.
The gateway reconstructs the exact consumer's durable binding chain for each
model-entry candidate, finds one binding for the native thread, verifies the
fresh Host assertion, active state, expiry, and current journal head, and
denies before sending the candidate to the backend on any mismatch. The check
applies to direct client actions and wrapper-generated actions, including
`turn/start`, `turn/steer`, `review/start`, and `thread/compact/start`. Errors
from a callback are mapped to a bounded diagnostic code; injected error text
is not returned to the client.

The option is deliberately not exposed as a CLI flag or configured from a
gateway client message. A caller-supplied `consumer_id`, thread ID, or
connection token is not a verified Host principal. A future Host adapter must
own callback construction and prove the underlying assertion; simply passing
test callbacks would not make a desktop task ARE-controlled.

## Verification

The [gateway tests](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/gateway.test.mjs)
show unbound direct turns denied without backend writes, an active matching
binding allowed, changed Host identity and draining state denied, and an
unbound wrapper-generated turn denied and stopped before backend dispatch.
Configuration rejects an in-memory store or incomplete callback set. The
gateway plus P1a/P1b suites passed 171/171, zero failures. The complete
wrapper package suite passed 796, skipped 24, and failed 0 (820 total). The
tests use a fixture-only Host assertion; they do not witness the installed
Codex app.

## Remaining dependencies

- P1: obtain a real Host-owned principal/client/workspace/writer/creation
  assertion and prove that stock desktop or custom client has no alternate
  model writer. The gateway cannot derive that identity from its connection.
- P3: bind and durably verify an exact objective, route/context, and first-turn
  receipt against the native creation event. This guard checks conversation
  ownership only; it does not interpret the user's goal or package context.
- C0/C1: observe an installed desktop New Chat invoking the selected gateway
  and receiving the same native thread/reply. Gateway fixture tests cannot
  substitute for that app-owned witness.
- D0b/D1: DSH Web Agent ingress bypasses and lower admission remain a separate
  branch. This Codex guard does not mediate DSH.
- Recovery: prove expiry/renewal, uncertain append, release and restart at a
  real Host boundary before enabling a production profile. Existing P1b
  journal tests cover local replay, not a live Host lifecycle.

## Open Questions

- Which supported Host surface can issue the exact identity and native
  creation receipt before the first model turn?
- How should the objective/context receipt be stored and verified with the
  same writer without making a rejected first turn appear accepted?
