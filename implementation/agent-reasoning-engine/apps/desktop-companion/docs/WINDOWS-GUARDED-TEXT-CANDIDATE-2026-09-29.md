# Windows guarded text-only Companion candidate — 2026-09-29

Status: opt-in, unsigned, uninstalled development candidate. The TUI is
discontinued. None of these checks activates this Codex desktop task or proves
release readiness.

## Boundary and UI behavior

Normal Windows managed sessions still pause new model turns with
`windows-client.hook-boundary-unverified`. The new
`--windows-guarded-text-turns` option is accepted only on native Windows with
an exact restricted Codex home, a verified per-process model-wire guard, no
hosted effects, and no test-only unverified-hook probe. The launcher verifies
the effective provider binding, requires matching gateway and hosted-client
startup records, and marks the Companion's read-only Adapter view as
`guarded text-only (candidate)`. The UI says that this is launch-declared:
it cannot independently verify the guard, prove host-effect coverage, or
claim control of the current desktop task. Older snapshots without the new
field remain `unverified`.

The launcher now binds both IPC-owned children to its lifecycle. They reject
an invalid or already-disconnected managed IPC marker, stop on an abrupt
parent-channel disconnect, and make concurrent stop notifications
idempotent. The launcher removes inherited managed-boundary markers before
setting its own exact values.

## Native source checks

The pinned installed Windows host was `codex-cli 0.155.0-alpha.16.4`, SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`.
Disposable fixed-loopback `managed-wire-guard-turn` and
`managed-wire-guard-restart-turn` passed after the lifecycle hardening,
using the guarded option without the earlier test-only Windows pause bypass.
The fixture-facing model tool catalog was empty, the clean restart rebound
the guard, and there were zero external model calls or current-task touches.
These were fixture responses, not an authenticated live provider.

The native [`test-managed-parent-loss-windows.mjs`](../scripts/test-managed-parent-loss-windows.mjs)
passed three isolated modes: launcher killed after readiness, launcher killed
when its first child appeared, and launcher killed after starting the
Companion. In each mode, the captured IPC-owned children exited; the full-tree
mode also observed the Companion exit. The script captured exact child PIDs,
used only a disposable state root, and made no model request. Its startup-loss
mode proves this sampled early-kill point, not every possible scheduler race.

The staged WebView2 smoke passed both launch postures. Without the option,
the orb and seven-panel dashboard rendered and Adapters showed `paused` while
hosted turn execution remained disabled. With it, Adapters showed
`guarded text-only (candidate)` and the isolated hosted client reported turn
execution enabled. Both runs kept desktop-task control `unverified`, made zero
model calls, and verified that an unexpected Companion exit stopped the
managed session. The combined focused Node/UI suite passed 133/133 after the
managed-IPC change.

## Exact staged Windows package

The final native build exited cleanly and produced the unsigned NSIS installer
`D:\are-companion-guarded-current-20260929.exe` (29,575,509 bytes; SHA-256
`eeacaea4a61262a1fb1a94f98cace9fbe1d747a8d2d97d35228e113dfdc63982`).
Its retained stage is `D:\acw-DFFozG`; the staged executable SHA-256 is
`91fedcba3a774e09ac82bad66e82feebe09901b5ce8d208a7be647ef68b602c3`.
The builder reported 807 development-distribution files, closure digest
`ee725d21a8b2b9ea3a8710b2bb2872f462e03aba0b25fffc0263d9edecfd4a8b`,
and Core closure digest
`f2422053cf9391bac9b9e299a68adcb46627ddaf2f30f19783205740de601a22`.
At staging, the manager, gateway, hosted client, and dashboard JavaScript
each had the same SHA-256 as their corresponding checkout source.

The staged resource tree passed all 11 `test-windows-features.mjs` checks:
bundled Node 26.8.1, ARE product health, direct route/context, bounded
Reasoning State, thread/decision observation-client loading, and native
Evolution SQLite write, observation, reopen, and replay. The staged
executable passed the 36-check default WebView2 UI journey. With
`--package-root` bound to the ARE resources adjacent to that executable,
both default-paused and opt-in-guarded managed WebView2 smokes exited zero.
The guarded run showed `turn_execution.enabled:true`, a candidate ingress
label, zero model calls, no current-task control, and exact supervised
Companion-exit cleanup. These are tests of adjacent **staged** package
resources; the NSIS payload was not extracted or installed.

A separate no-debug, default-preset ten-second orb-idle sample observed seven
processes, 127,442,944 summed private bytes, 315,330,560 summed working-set
bytes, and 0.1875 CPU-seconds over the interval. This short sample is not a
numeric resource-budget pass or a longer-run stability result.

## Claim ceiling

The guard is a candidate model-wire boundary for the explicitly selected
managed process and text-only tool catalog. These checks do not establish a
real authenticated Responses exchange, provider event-variant compatibility,
complete tool/effect control, installed lifecycle, or exclusive handover of
this desktop task. Normal Windows sessions remain paused. The opt-in mode is
not an assertion that ARE currently controls the user's ChatGPT/Codex chat.

## Open Questions

- Which supported provider configuration and captured event corpus validate
  real guarded turns without broadening the tool catalog?
- Which host interactions beyond text turns require ARE-owned brokers before
  any wider Windows turn/effect mode can be admitted?
- What exact-task identity, one-writer handover, rollback, installed-package,
  and numerical resource evidence is needed for release admission?
