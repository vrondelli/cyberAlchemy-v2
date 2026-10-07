# C2 hosted-hook callback crash-restart evidence

Status: bounded candidate construction, 2026-09-28. Authority effect: none.
The TUI is discontinued. This is the hosted Codex client callback path, not
the current desktop task's controller.

## Boundary and change

The hosted client passes `--hook-connection-file` to
[`startHostedHookControl`](../../../../../implementation/agent-reasoning-engine/src/hosted-hook-control.mjs).
Previously a hard-killed client left its exclusive private callback file in
place, so a restart at the same path failed with `EEXIST` before the browser
host started. Clean shutdown alone did not test this failure mode.

The controller now publishes a versioned connection with local owner platform,
host, and PID. It writes and syncs a unique private temporary file, then
hard-links it to the configured path without replacing an existing file. A
new process reclaims the configured file only when it has the exact versioned
shape, belongs to the same platform and host, its owner PID is absent, and
its file identity and bytes have not changed before removal. A live owner,
untagged legacy file, foreign-host marker, malformed file, symlink, or
uncertain liveness still fails closed. Only the exact stale callback file is
removed; no gateway session, backend task, or user configuration is deleted.

## Validation

- Linux controller fixtures: 4/4 pass, including an actual `SIGKILL`, live
  owner refusal, same-path restart, and foreign/legacy-file preservation.
- Linux hosted-client CLI fixture: pass. The CLI starts through the fake
  gateway, enforces its callback, is hard-killed, starts again at the same
  path, and then cleans its new binding on normal shutdown.
- Windows Node 26.8.1 controller fixtures: 4/4 pass using an isolated copy
  of the bundled ARE tree with the exact changed controller and test overlaid.
- The hosted-client CLI fixture now passes on both Linux and native Windows
  Node 26.8.1. On Windows it uses a unique local named pipe for its disposable
  fake gateway. After a hard kill, the same executable restarts at the same
  callback path, denies an unowned tool event, creates one new owned fixture
  thread, binds prompt context, and denies that thread's tool proposal. The
  staged Windows controller and CLI test files have the same SHA-256 values
  as the current checkout files. This is not a packaged or installed-Codex
  Windows lifecycle result.
- ARE product suite: 103/103 pass. The disposable hosted-client canary against
  `codex-cli 0.155.0-alpha.16.4` (SHA-256
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`)
  passes prompt context, strict `PreToolUse` denial, Stop and native completion
  with two loopback-provider requests, zero external model calls, no active
  configuration change, and clean private-callback removal.

## Claim limit

The installed-host canary validates the normal path, while the process-kill
fixtures validate the restart path; they are not one end-to-end installed-host
crash run. A file from the pre-versioned implementation remains blocked for
manual diagnosis rather than being deleted. A crash between temporary-file
creation and publication can leave a private orphan temporary file, but cannot
occupy the configured callback path. Power-loss durability, network filesystems,
Windows signal termination does not run the client's Unix-style cleanup
handler; the fixture observes its versioned callback file still present and
the disposable test removes its own private directory. A later guarded start
can reclaim that file after the owner process is gone, but Windows graceful
shutdown needs its own lifecycle design. Complete host-effect coverage,
installed-Codex Windows crash/restart, and exclusive handover of this desktop
chat remain unverified.

## Open Questions

- What retention and cleanup rule should govern orphan private temporary files
  in a deployed host?
