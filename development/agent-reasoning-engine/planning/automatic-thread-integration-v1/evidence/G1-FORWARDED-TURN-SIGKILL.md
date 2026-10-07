# G1 forwarded-turn gateway hard-crash recovery

Status: bounded candidate test evidence, 2026-09-27. This test neither used
the current desktop task nor changed host configuration or installed software.

The [gateway session-store test](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/gateway-session-store.test.mjs)
(source SHA-256 `7a488d9379b60f6d05989ea2f958bd687bce21627288af34da7544d059f32b4f`)
starts a separate gateway process with a file-backed session store and a
controlled pass-through backend. An authenticated client creates one owned
backend thread and sends a stable-key `turn/start`. The child confirms that the
gateway forwarded that request after persisting its intent, then the test
kills the live gateway process with `SIGKILL`; no orderly close hook runs.

A new gateway process reclaims only the verified terminated writer lock and
resumes the same authenticated consumer. The original request key remains
`gateway.dispatch-outcome-unknown`; a different write key is blocked by
`gateway.session-outcome-unknown`. Neither request reaches the restarted
backend. An owned `thread/read` is still forwarded for read-only diagnosis.

The focused test and the full session-store suite passed on WSL/Linux Node
(27/27). The same full suite passed on native Windows Node 26.8.1 (27/27).
This adds actual gateway-process termination to the earlier clean-restart
test; it does **not** prove a Codex host response, terminal backend-history
reconciliation, power-loss durability, effect recovery, or exclusive control
of the active desktop chat. The backend in this test is controlled and does
not execute a model turn.

## Open Questions

- Does the same fail-closed result hold when the installed Codex backend has
  accepted and completed a turn, and the gateway is killed at each distinct
  receipt/checkpoint boundary?
- Can exact host-history marker and ARE semantic-state reconciliation complete
  after a process kill without a duplicate turn, including an active or
  interrupted backend turn and non-exhaustive history?
- What separate evidence establishes power-loss durability and Windows
  directory-flush behavior for the file-backed store?
