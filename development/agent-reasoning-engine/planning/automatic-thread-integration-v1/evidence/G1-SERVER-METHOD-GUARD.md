# G1 Codex gateway server method and response guard

Status: bounded candidate implementation, 2026-09-26. No current desktop-task
handover, product approval, or activation is claimed.

The `codex-app-server/v1` gateway now classifies host-to-client methods using
the selected installed host's generated `ServerNotification.json` and
`ServerRequest.json` method catalog. The catalog records method order,
required/optional `threadId` groups, and both schema hashes. The disposable
catalog verifier passed against `codex-cli 0.155.0-alpha.16.4`: 82 server
notification variants and 11 server request variants matched. Gateway startup
now checks the selected host version and all four generated schema hashes
through its configured command and prefix before listening. See
[G1 startup schema binding](G1-STARTUP-SCHEMA-BINDING.md) for the later
implementation and verification evidence.

For declared thread-scoped notifications and server requests, a malformed,
missing, or unowned `threadId` stops the Codex consumer before its payload
reaches the wrapper or browser. The nested `thread/started` identity keeps its
separate creation-response binding. Known notifications without a thread ID
are suppressed. Known unscoped server requests, including legacy approvals,
receive a bounded JSON-RPC unsupported error directly from the gateway; their
payload is not forwarded to the browser. Unknown server methods fail closed.

Every Codex host request forwarded by this gateway is now registered by its
request ID and source thread reference until its response arrives. An
unsolicited response, duplicate pending ID, or a response reporting a
different thread ID stops the session before payload delivery. A result without
an explicit thread ID remains correlated to the forwarded request ID and the
trusted backend's response semantics; it is not independent content-level
verification of that result. Model-neutral backend adapters are unchanged.

Focused gateway and method-policy tests passed 65/65. Negative fixtures cover
missing/unowned event IDs, unscoped output, legacy approval suppression,
unsolicited responses, and a mismatched read response. The restart fixtures
now use owned, schema-shaped events and a durable creation acknowledgement;
their focused run passed. The full serial wrapper suite exited `0`. The
disposable installed-host user-input canary again reported `PASS`, with two
fixed local provider requests, zero external model calls, its temporary
configuration removed, and no touch to the current desktop task.

## Claim ceiling

This is ingress isolation for the admitted Codex gateway profile, not a
universal App Server enforcement boundary. The direct stdio wrapper, older
proxy integrations, DSH protocol, global host diagnostics, and all possible
result payload semantics need their own review. G1 exact-task handover and O1
activation remain unadmitted.

## Open Questions

- Which suppressed global notifications are needed for diagnostics, and how
  can they be projected without disclosing unrelated task data?
- Can result types without a self-identifying thread be verified more strongly
  than request-ID correlation for the exact installed host version?
- What is the exact recovery contract for non-stable read responses interrupted
  by a gateway restart, without treating unknown delivery as acceptance?
