# Windows Companion package with gateway-marker recovery repair — 2026-09-30

Status: unsigned development package, extracted and tested without installation
or activation. The TUI is discontinued and was not used. The current desktop
task was not moved under ARE.

## Exact package

- Installer: `D:\are-companion-marker-binding-20260930.exe`; SHA-256
  `b468e8a47ae4cf196f6cfe8cff74b459d1c022781dbb6e171d660dc559d93eaa`.
- Retained build stage: `D:\acw-TfY5NK`; extracted NSIS payload:
  `D:\are-marker-payload-56dzms` (820 extracted files).
- Development distribution: 811 files, closure digest
  `e0058d7e093bcc68a48dd27b742a559ef8e7d322e9cd904fc6beeced476030d1`;
  core closure digest
  `5d48b852ff95ef6b21943063008321e2ff7051bd7a2de4c9589dada2d769d01c`.
- The extracted `gateway.mjs`, `wrapper.mjs`, and
  `backend-process-birth.mjs` match the current source byte-for-byte. The
  extracted executable SHA-256 is
  `2c370d6bb824608b99da4eb682bfecca9c78938eaa02443bcf70062a337488d9`.
  NSIS bundle patching changes the executable from its pre-bundle stage, so
  stage/extracted executable equality is not claimed.

## Checks

The extracted Node 26.8.1 and ARE resources passed all 13 native Windows
feature checks, including product health, route/context decisions, Reasoning
State, bounded plan context, observations, and Evolution SQLite reopen.
The extracted executable passed the default WebView2 orb and nonblank
seven-panel dashboard journey. A separate connected fixture passed the
active Reasoning State first-viewport check, one confirmed gateway recovery
distinguished from activation, and withdrawal of live source claims after
gateway loss. The connected Overview reported desktop-task control as
`unverified` and explicitly did not present this chat as ARE-managed.

The source UI suite passed 48/48. The source wrapper suite passed 671 tests,
with 19 platform skips and no failures. Separate disposable installed-host
WSL/Linux active-turn and completed lost-response gateway `SIGKILL` canaries
passed after the [marker binding repair](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-GATEWAY-MARKER-BINDING-RECOVERY.md).
The Windows WebView2 fixtures do not themselves exercise a real model turn or
the installed host crash path.

## Packaged native Windows hard-crash follow-up

The extracted Node and ARE canary from this exact NSIS payload were run on
native Windows against a disposable, hash-verified copy of installed
`codex-cli 0.155.0-alpha.16.4` (SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`).
The active-turn `SIGKILL` mode passed with one exact `interrupted` history
receipt, preserved prior frontier, and one distinct completed next turn. The
completed lost-response mode passed with one marker match, blocked same-key
and new-key unsafe retries, confirmed semantic recovery, and no redispatch.
Both used the fixed local provider, reported zero external model calls and no
current-task access, and removed their temporary state. The backend had
already exited after the gateway kill, so neither run exercised the
live-survivor guard.

## Eight-cycle UI resource sample

The same extracted executable passed eight supervised dashboard open/close
cycles with an isolated connected-adapter fixture; every reopen was nonblank.
The first ten-second orb-only process-tree sample counted seven processes
(Companion plus six WebView2 children), 142,548,992 private bytes, and
0.015625 process CPU-seconds in the sampling interval. The first settled
dashboard sample counted eight processes and 219,660,288 private bytes. After
the eighth close, the seven-process tree held 151,822,336 private bytes,
9,273,344 above that run's orb baseline. The fixture gateway is excluded from
these Companion process-tree totals. This is a bounded prototype sample, not
an owner-approved low-resource budget pass or a long-duration leak finding.

## Claim ceiling and open questions

This verifies package contents and read-only UI behavior. The installer was
not executed; install, upgrade, rollback, resource-budget acceptance, broad
crash-point coverage, and complete host-effect
coverage remain unproved. A supported desktop-host writer/ingress handover
is still required before ARE can control the current task.

- Can a supported host API provide exclusive current-task handover with exact
  task/account identity, all ingress and approval paths, and rollback?
- Can the remaining crash windows and installer lifecycle be tested without
  weakening the present fail-closed effect boundaries?
