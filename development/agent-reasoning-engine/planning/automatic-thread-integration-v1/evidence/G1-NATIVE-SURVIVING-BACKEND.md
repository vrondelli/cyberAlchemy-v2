# G1 orphan-backend lifetime after a gateway hard crash

Status: bounded candidate evidence, 2026-09-27. This is not a proof of
safe reattachment to a still-running backend. The TUI was not used; the
current desktop task and external models were untouched.

The `--active-turn --surviving-backend` variant of
`native-gateway-hard-crash-recovery.mjs` killed the gateway while the
installed `codex-cli 0.155.0-alpha.16.4` backend waited at a disposable
`item/tool/requestUserInput`. Unlike the earlier active-turn hard-crash
test, the driver did **not** immediately kill the orphaned backend. It
verified the exact PID, executable and private working directory after the
gateway died. A fresh gateway resumed the authenticated private session and
read exact host history. The probe checked that same original process again
immediately before and after the read, then cleaned up the private state.

Two runs passed with the same bounded observation: the old backend was live
immediately after the gateway kill but had exited before the host-history
read. The host returned the exact turn as `interrupted`; ARE projected
`recovery-terminal` with one durable history receipt. No provider was
started after the crash and no new turn was attempted in this variant. Its
report explicitly sets `surviving_backend_guard_not_exercised: true` and
`new_user_turn_completed: false`. An initial diagnostic incorrectly treated
the `interrupted` history as contradictory merely because the process had
been live earlier; the additional liveness checks disproved that inference
for these runs.

## Claim ceiling

This is installed-host evidence that the orphan exits naturally before
reconciliation in this version and checkpoint. It does not show that every
Codex backend exits after gateway death, that a genuinely surviving backend
would be blocked, that all host-history statuses prove OS-process absence,
or that the current desktop task can be handed over. The separate [active
hard-crash proof](G1-NATIVE-ACTIVE-TURN-HARD-CRASH.md) explicitly terminates
the verified orphan, then proves a distinct subsequent user turn.

## Open Questions

- How should a durable gateway record and verify backend-process ownership
  before recovery so a genuinely live orphan cannot be mistaken for a
  terminal host-history result? A PID alone can be reused and needs a
  conservative identity/liveness policy across Linux and Windows.
- Can a controlled persistent-backend fixture hold the old process alive
  through the new gateway's history read and prove the desired fail-closed
  behavior without weakening the installed-host claim boundary?
- Does the same natural-exit timing hold on native Windows and for other
  pending host requests, tool calls, and crash checkpoints?
