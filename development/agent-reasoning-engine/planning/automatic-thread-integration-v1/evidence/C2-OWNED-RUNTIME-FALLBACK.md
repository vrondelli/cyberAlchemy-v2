# C2 owned-thread runtime fallback

Status: bounded local candidate, 2026-09-28. This does not activate the
current desktop task, recover unknown thread creation, or reconstruct host
transcript history. The [integration work-pack](../INTEGRATION-WORK-PACK.md)
owns C2 status.

## Problem and construction

Some installed-host states reject both `thread/turns/list` and
`thread/read(includeTurns:true)` with `list_turns is not supported yet`.
`thread/read(includeTurns:false)` may still say `idle`, but its empty `turns`
field is not proof that the thread has no turns. Previously the hosted client
withheld the next send in this condition; it must continue to do so unless it
has independent exact evidence.

The new private gateway method `cyberalchemy/gateway/ownedRuntime/get` returns
an ID-bound, content-free terminal proof only for the authenticated
interaction-bound consumer's owned thread. It requires the active, nonfaulted
durable session, no pending history audit, every retained `turn/start` intent
matched to an exact durable host acceptance with a completed dispatch outcome,
one terminal host completion for the latest accepted turn, and a matching
checkpointed ARE Reasoning State completion frontier. Missing, unknown,
conflicting, or truncated evidence fails closed. The response has the hashed
turn reference, status and evidence digests, not user or assistant text.

The hosted client consults this method only after the exact unsupported
`thread/read(includeTurns:true)` error and only when its separate
`includeTurns:false` read says the same thread is idle. It validates the closed
gateway response before allowing a next send. It labels the runtime source
`gateway-owned-frontier`; the stored-history endpoint remains unavailable.
This is a next-turn runtime check, not an empty-history assertion or a C2
thread-creation recovery proof. The gateway still rejects unknown turn
delivery and other unsettled mutations.

## Validation and limits

- Gateway test: no frontier, then durable completion without frontier, both
  refuse; a matching frontier returns the terminal proof; foreign and malformed
  reads refuse.
- Hosted HTTP test: when both detailed history methods are simulated as
  unsupported, a valid closed owned-runtime proof permits one next turn while
  transcript history remains 409. A tampered authority field again blocks.
- Real wrapper file-backed test: the exact completion proof is absent before
  completion, present afterward, and byte-for-byte recoverable after restart.
- Focused gateway and hosted-client suites passed 157/157. The full wrapper
  package suite passed 502, skipped 13, failed zero (515 tests). Syntax checks
  passed for the touched source and canary.
- The disposable installed-Codex canary against
  `codex-cli 0.155.0-alpha.16.4` completed two loopback-provider turns,
  applied and replayed feedback across gateway/client restart, and verified
  second-turn lesson text on the private model wire. It made zero external
  model calls. Its first turn used a host-history proof. In the restarted
  client, an explicit `ARE_INTEGRATION_TEST_MODE=1` seam simulated the exact
  unsupported responses for both detailed-history methods, while all real
  gateway, wrapper, installed-host turn execution, and `thread/read` idle
  checks remained active. The second turn used the owned-runtime frontier
  proof. The result reported one proof of each kind. This validates the
  fallback through the installed-host execution path under simulated history
  unavailability; it does not claim the installed host actually returned the
  unsupported responses in that run.

The current installed host's exact empty-thread history limitation in
[accepted thread-creation recovery](C2-THREAD-CREATION-ACCEPTANCE-RECOVERY.md)
remains: this method needs a completed accepted turn and cannot establish
that a newly created thread had no earlier turn. Nor does it prove exclusive
desktop-client writer release, current-task ingress, installed package
behavior, or universal effect enforcement. TUI is discontinued.

## Open Questions

- Can an installed-host run encounter the exact double-unsupported history
  posture naturally after a completed owned turn, without the test seam?
- What host capability or exclusive-writer causal proof will resolve unknown
  accepted thread creation before any turn?
