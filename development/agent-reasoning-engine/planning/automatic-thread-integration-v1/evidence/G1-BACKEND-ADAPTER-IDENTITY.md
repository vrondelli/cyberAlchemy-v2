# G1 gateway backend-adapter identity binding

Status: bounded candidate implementation, 2026-09-26. This does not activate
ARE control of the current desktop task or approve a product handover.

The gateway now binds every new durable consumer session to its selected
`backend_adapter_id`. The binding survives session-store compaction and reopen.
A later gateway process refuses to recover that consumer through a different
adapter before spawning a backend. Legacy durable sessions without an adapter
binding also fail closed on recovery; they are not silently assigned to the
new selection. A client may declare `expected_backend_adapter_id` in the
handshake; the gateway rejects a mismatch before creating a session. The
Codex-specific Windows client declares `codex-app-server/v1`, and the generic
gateway client verifies the successful connect receipt's consumer, lane, and
requested adapter identity.

Focused tests cover an incompatible Codex client, adapter drift across a
shared-store gateway restart, legacy unbound recovery, and compaction/reopen
of the bound identity. The DSH integration suite passed 14/14. The native
installed-binary user-input canary with gateway recovery returned `PASS`: the
session resumed, its owned thread rejoined, and a repeated request key did
not redispatch. It used a fixed local provider, made zero external model
calls, and did not touch the current desktop task.

## Claim ceiling

The bound value is the adapter contract identifier, not proof of the exact
executable bytes, daemon, account, model configuration, host task, or present
desktop-chat ownership. Two implementations claiming the same adapter ID are
not distinguished here. The gateway does not migrate legacy unbound durable
sessions; those require an explicit migration or fresh consumer session. A
successful adapter link remains distinct from host-task control and from the
UI's process-local Reasoning State observations.

## Open Questions

- Should a later deployment also bind a versioned adapter implementation or
  executable digest, and how would that identity survive legitimate upgrades?
- What explicit migration procedure, if any, should retire legacy unbound
  durable sessions without guessing their backend?
- How should the desktop UI join adapter and thread observations from the
  same gateway epoch without implying control of the current host task?
