# C2 hosted thread-creation retry checkpoint

Status: bounded local candidate evidence, 2026-09-28. Owner: ARE integration work-pack C2. This does not activate or take over the current desktop task.

## Change

The hosted browser now checkpoints a content-free `are.codex-client-pending-thread/v1` record before requesting a new thread. It contains a stable request key, SHA-256 workspace digest, and timestamp; it stores neither the workspace path nor a message. After an uncertain HTTP response or reload, the browser offers only an explicit retry with the same key and exact workspace. It blocks a different workspace, disables overlapping creation clicks, and gives a warning before the user forgets the marker. Forgetting does not delete any host-created thread.

The authenticated HTTP host rejects absent, blank, padded, or overlong thread-creation keys before backend dispatch. Its static asset allowlist serves the new browser module. The existing gateway stable-request binding remains the authority for completed-result replay and unknown-outcome refusal; this slice does not substitute browser state for gateway recovery.

When that gateway returns the exact `gateway.dispatch-outcome-unknown` error,
the HTTP host now returns a typed 409 without claiming a thread identity. The
browser explains the quarantine and retains its retry marker. A same-key retry
cannot resolve a gateway-unknown creation by itself, and a new key remains
blocked by the gateway's unresolved-mutation guard. The pinned Codex
`thread/start` parameter contract has no client correlation field analogous to
the verified `turn/start` `clientUserMessageId`, so a nearby `thread/started`
notification is not treated as proof of which request created a thread.
The current `codex-cli 0.155.0-alpha.16.4` `generate-ts --experimental`
output was regenerated into an isolated temporary directory on 2026-09-28:
`ThreadStartParams` declares no caller-supplied thread ID or correlation marker,
and `ThreadStartedNotification` carries only a `Thread`. The latter reports a
host-generated ID, workspace, and timestamps but no stable request key. This
is a version-bound protocol limit, not a claim about every future host.

## Verification

- `node --test test/pending-thread.test.mjs test/windows-client-host.test.mjs`: 43 passed, 0 failed (before the browser fixture addition).
- Full `npm test` in the wrapper package after the browser regression: 447 passed, 10 skipped, 0 failed. The static-host asset test was then tightened and its focused host suite passed 41/41.
- Chromium was run in WSL with `libnspr4`, `libnss3`, and `libasound2t64` downloaded and extracted under a temporary `/tmp` directory for `LD_LIBRARY_PATH`; no system package was installed. The browser suite passed 6/6, including lost-response/reload/same-key retry and typed gateway-unknown quarantine with the marker retained after reload.
- Focused gateway and HTTP-host tests passed 2/2 for unknown thread creation. They prove same-key unknown, different-key mutation denial before backend dispatch, typed HTTP 409, and no claimed hosted thread ID. They do not prove recovery of a created host thread.
- The full wrapper suite with Chromium enabled after these changes passed 455, skipped 5, and failed 0 (460 tests total). The five skips are unrelated opt-in checks; the six hosted-browser fixtures were executed, not skipped.

## Claim ceiling

This closes the browser's fresh-key-on-retry defect for hosted thread creation and the host's missing-key acceptance. It does not prove a full native installed-app journey, a power-loss window, unknown gateway/backend delivery recovery, or exclusive control of this desktop task. The TUI is discontinued and is not a validation target.

## Open Questions

- Run an installed-host lost-response canary; the browser fixtures use a fake RPC backend.
- Determine whether a gateway-unknown `thread/start` outcome can be reconciled from exact host evidence without risking duplicate creation.
- Keep G1/O1 exact desktop-task ingress and one-writer handover separate from this hosted-client fix.
