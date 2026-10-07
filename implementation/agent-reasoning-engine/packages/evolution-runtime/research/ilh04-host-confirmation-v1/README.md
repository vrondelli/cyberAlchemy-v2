# IL-H04 Host-Confirmation Cycle

Status: completed non-activating host confirmation  
Cycle kind: `controlled-upgrade`  
Phase: `non-activating-host-confirmation`  
Activation: none

## Objective

Confirm that the shared headless Codex RPC host can validate, receive, surface,
receipt, and recover the IL-H04 continuity notification without enabling the
repository serving profile.

## Boundary

DG-IC-01=A authorized a bounded local canary and its evidence. The cycle added
a closed continuity consumer to the shared RPC client, exercised the real
wrapper-to-client JSON-RPC path, and retained structural receipts. It made no
provider or model call and changed no serving pointer.

This confirms the programmable headless host surface. It does not confirm that
Codex Desktop on Windows displays the custom notification.

## Result

The canary surfaced 6/6 high-risk notifications and emitted no continuity
notification for six low-risk cases or the disabled-profile case. It rejected
a tampered projection and suppressed a replay after host-state recovery. The
focused suite passed 23/23, the complete wrapper suite 214/214, and the
evolution-runtime suite 128/128. Five coordinator tasks settled, with restart
and SQLite-loss recovery verified.

Exact evidence and digests are in [RESULTS.md](RESULTS.md).

## Rollback

Keep `continuity_renderer.enabled` false and remove the optional host consumer
binding. The wrapper renderer and predecessor learning package remain intact.

## Open Questions

- Does a future Codex Desktop/Windows adapter expose a supported custom
  notification surface?
- The missing engine-owned binding provider was resolved by the subsequent
  [`ilh04-continuity-provider-v1`](../ilh04-continuity-provider-v1/RESULTS.md)
  engine-improvement cycle. Activation and a real-user cohort remain separate
  controlled-upgrade decisions.
