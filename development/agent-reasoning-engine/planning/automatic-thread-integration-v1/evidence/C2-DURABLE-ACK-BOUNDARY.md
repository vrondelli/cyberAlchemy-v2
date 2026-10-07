# C2 explicit durable-append acknowledgement

Status: bounded candidate construction evidence, 2026-09-28. The TUI is
discontinued and is not an integration or UI acceptance path.

## Gap and change

The gateway's session-store adapter returns `{ok: true}` only after its
append succeeds. Nineteen gateway call sites rejected `{ok: false}` but
treated an absent, malformed, or otherwise indeterminate append result as
success. That could expose a response or host observation before a durable
receipt existed if a store adapter violated its result contract.

The gateway now requires `ok === true` at those boundaries. Its existing
failure paths withhold the affected delivery or observation and stop the
session; an unknown dispatch remains unknown rather than being reported as
complete. The change does not alter the session-store record format or
silently redispatch a host operation.

## Validation

- Six focused cases passed for explicit failure and missing acknowledgement
  on wrapper and backend dispatch outcomes and on a marked host-history
  observation. Each indeterminate case stopped without a successful
  acknowledgement; the unknown request stayed unresolved.
- The complete gateway test file passed 95/95. The full wrapper package test
  command, `node --test --test-reporter=dot test/*.test.mjs`, exited 0;
  optional rendered-browser cases were not enabled by that Linux command.
- Completed lost-response and active-turn gateway hard-crash canaries both
  passed against the pinned installed WSL Codex binary,
  `codex-cli 0.155.0-alpha.16.4` (SHA-256
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`).
  Each used disposable state and a fixed loopback provider, reported zero
  external model calls, did not touch the current desktop task, and removed
  its temporary state.
- `node --check` passed for the edited gateway and test file. The scoped
  whitespace check passed.

## Claim ceiling and open questions

This closes one fail-open acknowledgement interpretation in the gateway. It
does not prove power-loss durability, all backend outcomes, universal effect
interception, or control of this Codex desktop chat. An exception thrown by
an external store adapter and the separate Evolution signal sink have their
own result boundaries; neither is certified by this test. G1 handover and O1
activation remain open.
