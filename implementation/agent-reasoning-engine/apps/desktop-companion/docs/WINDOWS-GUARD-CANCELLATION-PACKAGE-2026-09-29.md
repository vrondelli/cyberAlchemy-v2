# ARE Companion Windows guard-cancellation package — 2026-09-29

Status: bounded development candidate and staged native tests. No installation,
release, current-task activation, live provider, or TUI validation.

## Exact artifact

The fresh unsigned NSIS installer is
`D:\are-companion-guard-cancel-20260929.exe` (29,577,601 bytes; SHA-256
`5fdbf45e9f2b45ff82723eeb5bdf39d4c07f9fe7589919e1e2abe379265fe4c8`).
The retained Windows build stage is `D:\acw-ucVb2Q`. It contains 807
development-distribution files with closure digest
`22829ddb0f73bd7c0a2a722e7da13d0423ba74277a87072c420645080cc622af`;
the Core closure digest is
`78d652cce64bb0c6b1475f4c51174ad7be5d8085b608c1e379d4860eda03e9b8`.
At build time, the staged `model-wire-guard.mjs` had the same SHA-256 as its source,
`c98949410173b4ba42319ce1569c5ab16e53644df60b43f0b2985ced1625c919`.
This check hashed the installer and tested its retained build stage; it did not
extract the NSIS payload or execute the installer.
The guard source subsequently gained a documented refusal-event fixture and
no longer has that build-time hash. This package remains the tested
guard-cancellation UI snapshot; it does not contain the later refusal-event
source change. See the [guard evidence](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-MODEL-WIRE-GUARD-CANDIDATE.md#documented-refusal-event-fixture--2026-09-29).

## Current-source checks

- Guard cancellation passed seven focused tests on WSL and native Windows Node.
  Both pinned installed Codex binaries passed the disposable managed mid-stream
  guard-fault canary: the local provider stream closed and the managed session
  stopped without another model request. The full wrapper test suite exited
  zero. See the [guard evidence](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-MODEL-WIRE-GUARD-CANDIDATE.md#in-flight-guard-cancellation--2026-09-29).
- The Companion dashboard source suite passed 47/47. Staged bundled resources
  passed 11 native feature checks: exact Node, product health, route/context,
  Reasoning State, bounded plan context, thread/decision clients, and Windows
  Evolution SQLite write/observe/reopen/replay.
- The staged executable passed its default native WebView2 orb and nonblank
  seven-panel journey. A separate live-adapter run rendered a gateway
  reasoning-state thread, linked decision, source-separated status, and correct
  withdrawal of live claims on gateway loss.
- A package-only managed-session smoke used the adjacent staged Node and ARE
  runtime with the pinned Windows Codex binary. Gateway, hosted client, and
  Companion started together; the dashboard rendered seven panels; unexpected
  Companion exit stopped the session. Windows hosted turn ingress remained
  paused with `windows-client.hook-boundary-unverified`. Model calls were zero,
  and current desktop task control remained false.
- A no-debug, default-preset orb-only sample observed seven processes,
  146,685,952 summed private bytes, 325,156,864 working-set bytes, and
  0.140625 CPU-seconds during a 10-second measurement interval. This is one
  short development sample, not a low-resource acceptance verdict.

## Claim ceiling

The package contains the guard-cancellation source tested for this build, but the staged UI tests
do not exercise a real-provider guarded turn. They also do not establish the
installer's payload integrity, installed lifecycle, Windows hook coverage,
exclusive current-chat handover, a numerical resource budget, or a release
decision. The dashboard must continue to distinguish an observed disposable
gateway path from control of this desktop task.

## Open Questions

- Does the actual NSIS payload, followed by a separately authorized install,
  preserve these same resources and UI behavior through upgrade and rollback?
- What supported host boundary supplies complete Windows turn/effect coverage
  and an exclusive writer handover for this exact chat?
- What CPU, memory, cold-start, and longer-run bounds define acceptance for the
  low-resource Companion?
