# G1 gateway-marker binding through hard-crash recovery

Status: bounded candidate construction evidence, 2026-09-30. The TUI is
discontinued and was not used. No current desktop task or external model was
activated.

## Failure and repair

An isolated installed-host completed lost-response canary failed after
gateway `SIGKILL` with `reasoning.recovery-marker-state-unbound`. The gateway
had durably recorded the original `turn/start` request binding, then added
its durable `clientUserMessageId` marker before forwarding to the wrapper.
The wrapper checkpoint had bound the augmented request, so the two valid but
different digests could not match when exact host history was inspected.

The gateway now supplies the original request-binding digest to the wrapper
only when it adds the gateway-owned marker. Before checkpointing, the wrapper
checks marker shape, removes just that marker from the received request,
recomputes the original binding, and rejects a mismatched override. Direct
wrapper traffic and client-supplied markers do not gain an override. The
gateway's unknown-delivery and no-redispatch rules remain unchanged.

## Verification

- A new file-backed wrapper regression rejects a false original binding,
  accepts the exact marker-bearing request, restarts after a completed turn,
  and reconciles the host marker against the original binding.
- The full Linux wrapper suite passed 671 tests, with 19 platform skips and
  zero failures.
- Against the installed `codex-cli 0.155.0-alpha.16.4` on WSL/Linux, the
  disposable completed lost-response hard-crash canary passed: one exact host
  marker, one semantic recovery, no redispatch, unsafe retries rejected.
  The separate active-turn hard-crash canary passed: one exact interrupted
  host-history receipt, preserved prior frontier, and one distinct new turn.
  Each reported zero external model calls, no current desktop-task access,
  and removal of scratch state.
- The [exact extracted Windows package](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/WINDOWS-MARKER-RECOVERY-PACKAGE-2026-09-30.md)
  subsequently passed both native Windows canary modes against a hash-verified
  disposable copy of installed `codex-cli 0.155.0-alpha.16.4`. The interrupted
  turn kept its prior frontier and completed a distinct next turn; the
  completed lost-response turn matched one marker, rejected unsafe retries,
  and did not redispatch. Both reported zero external model calls, no
  current-task access, and complete scratch removal.

## Claim ceiling

This repairs one original-request/marker checkpoint mismatch and proves the
two scoped Linux and native Windows installed-host crash paths. It does not
prove every crash point, power-loss behavior, surviving-backend reattachment,
or ARE control of the current
ChatGPT app task. The desktop host writer/ingress handover remains open.

## Open Questions

- Does the same binding survive all host-supported input variants and
  compaction timing windows beyond these fixtures?
- What supported desktop-host API can prove exclusive task ownership and
  complete ingress coverage without bypassing the gateway?
