# C2 accepted-but-unknown turn recovery overlap

Status: bounded local implementation, 2026-09-28. The
[work-pack](../INTEGRATION-WORK-PACK.md) owns C2 status.

## Boundary

An accepted `turn/start` may have a durable host acceptance receipt while its
gateway dispatch outcome remains unknown after a crash or undurable outcome.
Previously, the presence of that receipt bypassed the existing marker-based
unknown-turn recovery path, leaving this overlap permanently write-blocked.
The gateway now takes the marker path for an unknown turn with zero or one
acceptance receipt. If both exist, their hashed host turn IDs must agree before
the marker observation is persisted. A disagreement faults the exact session.
A terminal host-history status that contradicts a durable native completion
also faults the session; a lagging active snapshot is rejected as stale without
replacing the terminal witness.
The existing terminal host-history, Reasoning State semantic receipt, client
recovery confirmation, and durable `dispatch-recovered` gates remain required.
Acceptance alone still does not authorize retry or release the block.

## Validation

- The gateway fixture verifies marker-only and accepted-plus-marker terminal
  recovery, receipt confirmation, durable recovered status, and refusal to
  replay the recovered `turn/start` to the host.
- A contradictory accepted turn ID or terminal status faults the session
  without semantic reconciliation or a recovered dispatch; a lagging active
  snapshot leaves the session active and clears its read audit.
- Focused recovery cases: 6/6 passed. Full wrapper package suite: 490 passed,
  13 skipped, zero failures.
- A later native Windows Node run of the entire gateway fixture initially found
  a test-harness-only mismatch: the history-audit quarantine case supplied a
  Unix observation socket path. The fixture now selects a local named pipe on
  Windows while keeping its Unix socket on Linux. The exact gateway file then
  passed 133/133 under Windows Node 26.8.1 and 133/133 under Linux Node. The
  adjacent native Windows session-store, host-marker, pending-thread, and
  pending-turn suites passed 32/32, 2/2, 2/2, and 9/9 respectively. The full
  Linux wrapper suite passed 557 tests with 14 platform skips. These are local
  fixture results, not an installed-host unknown-delivery or desktop handover
  proof.
- Against the installed native Windows `codex-cli 0.155.0-alpha.16.4` binary
  (SHA-256 `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`),
  the disposable `--unknown-acceptance-marker-probe` passed after gateway and
  backend restart. It observed exactly one marked host turn and one durable
  marker receipt, retained the unknown write block until semantic recovery
  confirmation, rejected same-key and new-key dispatch while unknown, then
  rejected replay of the recovered request. The companion recovery projection
  showed one recovered dispatch; no provider request was duplicated. The
  `--hosted-pending-marker-probe` also passed: the authenticated hosted client
  recovered its content-free pending intent, confirmed the gateway receipt,
  and answered the same key locally without redispatch. Both used fixed local
  provider responses, made zero external model calls, removed temporary
  configuration, and left the current desktop task untouched.

## Claim ceiling and open questions

The fixture tests use a semantic-recovery test double; the two native Windows
lost-response canaries additionally exercise the installed host. A host history
without the ARE marker, absent semantic state, ambiguous marker, or unfinished
turn remains blocked. Exact desktop writer handover, operational storage policy,
and live activation remain separate G1/O1 work. TUI is discontinued and is not
an integration target or parity criterion.
