# Task Session Result — SWU-IOLM-00C-UI-A4

## Task Session Result

- Task: `SWU-IOLM-00C-UI-A4` — Firefox browser acceptance and evidence
- Result: `BLOCK`
- Validation aggregation: automated `FAIL`; manual `NOT_RUN`; overall `FAIL`
- Passed scenarios: `PW-BB-01`, `PW-BB-02`, `PW-BB-03`
- Failed scenario: `PW-BB-04`
- Not run by fail-fast rule: `PW-BB-05`–`PW-BB-10` and post-browser deterministic replay
- Blocker: `B-IOLM-A3-FIREFOX-EVENT-TARGET`
- Owner route: `SWU-IOLM-00C-UI-A3` defect repair
- Browser acceptance handle: not emitted
- Firefox and loopback server: closed cleanly after evidence capture
- Subagent closeout: A3→A4 synchronization helper spawned 1, joined 1, closed 1, open 0, result `PASS`; owner handle `iolm-ui-a3-a4-refresh-applied/v1`

## Evidence-backed failure

The deep URL rendered correctly with the permanent posture strip, exact 4/3
counts, selected UnlockDoor, and provenance inspector. The Player question
rendered the exact 2/1 stable-ID set, and graph/outline/table parity passed.

In the native Relations table, clicking the Player-performs-UnlockDoor stable-ID
button caused Firefox to deliver a text-node event target. `app.mjs:56` called
`target.closest(...)`, threw `TypeError`, and left the selected stable ID and
inspector unchanged. This violates shared relation selection/persistence and the
no-console-error acceptance contract.

## Honest stop

- A4 did not repair A3 code because its write boundary forbids that mutation.
- Required manual checks remain `NOT_RUN`; no accessibility or usability claim is made.
- `iolm-browser-acceptance/v1` does not exist for this run.
- The six-value eligibility fence remains present in all durable run results.
- Resume only after A3 returns a fresh passing viewer receipt, then create a new A4 run rather than overwriting this failed evidence.
