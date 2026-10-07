# C2 managed objective compaction and restart

Status: bounded installed-host construction proof on the selected WSL/Linux
Codex CLI. Authority effect: none. TUI is discontinued and out of scope.

## Result

The managed hosted-client fixture completed one user turn, requested
`thread/compact/start` through its owned, stable-key HTTP endpoint, and waited
for a gateway-durable `compaction-turn-accepted` plus
`compaction-item-completed` observation bound to the same backend thread and
turn. It then stopped and restarted the managed gateway/client, rejoined the
same thread, rejected a changed-list replay of the first turn in tracking
mode, and completed a distinct second user turn. Both objective transition
records retained the same objective ID. In tracking mode, the second record
retained the first explicit requirement snapshot and bound its predecessor
continuity digest.

The fixed private provider received exactly three requests: first user turn,
native compaction, second user turn. It made zero external model calls. The
first probe failed because the canary incorrectly assumed compaction used no
model request; the corrected accounting passed in tracked and untracked modes,
and the tracked mode passed a second full run. These checks used disposable
private state and did not touch the current desktop task.

## Verification

```sh
node implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/managed-objective-restart-canary.mjs /absolute/path/to/codex --requirement-tracking --compaction
node implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/managed-objective-restart-canary.mjs /absolute/path/to/codex --compaction
```

Both modes returned `ok:true`, `compaction_before_restart:true`,
`same_objective_after_restart:true`, two objective events, and three local
model calls. The tracked mode returned `verified-explicit-seed` and passed
twice. Existing wrapper and gateway unit fixtures separately cover admitted
and rejected steering, mismatched host acceptance, and compaction-history
guards; this native fixture exercises the hosted compaction/restart join.

### Combined tracked steering, compaction and restart run

The selected installed WSL/Linux `codex-cli 0.155.0-alpha.16.4` passed the
same disposable managed canary with `--requirement-tracking --compaction --steering`.
The private provider held the first response while the owned
hosted client submitted one exact active-turn correction. The gateway
recorded an accepted steer for that turn; the turn completed, and native
compaction reached a durable accepted/completed observation before a clean
managed restart. The client rejoined the same backend thread, recovered the
first turn without redispatch, and completed a second turn. Both objective
events retained the same objective ID and the explicit `Include sources`
requirement. The result reported four local model calls (including the steer
successor and compaction), zero external calls,
`same_objective_after_restart:true`, and
`current_desktop_task_control:false`.

That WSL run joins three previously separate C2 behaviors on one ARE-owned
thread. Its scope excludes lost steering responses, abrupt or power-loss
recovery, native Windows, unknown backend delivery, and desktop-client
handover; the Windows modes below test some of those separately.

### Current-source guarded Windows join

Windows Node 26.8.1 ran this checkout's current canary and imported source
through the WSL UNC path against a staged `codex.exe` whose SHA-256 matched
the installed Windows package binary
(`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`).
The host reported `codex-cli 0.155.0-alpha.16.4`. Three disposable modes
passed with `--requirement-tracking --compaction --steering --windows-guarded-steering`:

- Clean managed restart: compaction completed before restart.
- Lost steer RPC response followed by abrupt managed-stack loss: the exact
  pending key was recovered and acknowledged before compaction after restart.
- Lost steer HTTP response followed by the same abrupt-stack recovery and
  post-acknowledgement compaction.

Each mode reported `ok:true`, one resumed owned thread, two objective events,
the same objective and explicit requirement after restart, no duplicate
dispatch, four local fixture-model calls, zero external calls, and
`current_desktop_task_control:false`. The two abrupt modes reported their
respective lost-response recovery flags and
`abrupt_managed_stack_loss_recovered:true`. The canary used temporary
private state and removed it. This is a current-source, staged-binary native
Windows construction proof, not an installed Companion or installer lifecycle
test, whole-machine power-loss proof, or desktop-task takeover.

## Claim boundary

The joined Windows modes now cover clean restart and two lost-response abrupt
process-tree restarts. They do not prove a backend acceptance lacking terminal
durable evidence, whole-machine power-loss recovery, installed-package
lifecycle, exclusive desktop writer handover, universal effect enforcement,
or current desktop-task control. This is not a release verdict.

## Open Questions

- Can a backend acceptance lacking terminal durable evidence ever be
  reconciled without redispatch, or must it remain quarantined?
- Can the installed Windows package reproduce the staged, current-source
  managed join without a test-only harness or process-lifecycle assumption?
