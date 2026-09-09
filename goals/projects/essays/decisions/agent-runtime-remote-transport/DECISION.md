# Essays Agent Runtime Remote Transport

Result: selected
Selected option: `OPT-REMOTE-HTTPS-SSE`
Authority effect: none

Remote clients will send versioned JSON commands and queries through HTTPS and
receive daemon events through Server-Sent Events with resumable cursors. The
remote adapter preserves the same command, revision, idempotency, event, error,
and receipt identities as local IPC.

HTTPS and an open SSE stream do not grant Essays authority. Identity,
authentication, capability authorization, hosting, and public exposure remain
separate decisions.

The machine-readable decision is `selection.json`, bound to request digest
`ca1d96958d6020d6b77bea43b2e11b19ee44b209ad9bbbce1d15513086ce5e18`.
