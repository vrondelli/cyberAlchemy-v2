# G1 hosted-client active-turn reconciliation

Status: bounded local implementation evidence, 2026-09-26. This is not a
handover or activation of the current Codex desktop task.

The hosted client previously displayed `Ready` after history hydration even
when its owned thread had a live turn. Its send button could then issue a
second `turn/start`. The client now reads only its owned thread's App Server
`thread/read` runtime status and newest `thread/turns/list` status. It renders
`Working` for active turns, `Ready` only for an idle host with no turn or a
terminal newest turn, and `Turn state uncertain` otherwise. The host rejects
`POST /api/turns` unless that same read-only reconciliation is idle. A local
in-flight guard also rejects concurrent starts for one thread. Runtime output
contains status and turn identity only, never reasoning, tool output, or text.

The browser disables Send while disconnected or uncertain, reconnects its
event stream, rechecks status on reconnection, and does not automatically
redispatch a failed turn request. It resets its event cursor if the hosted
client event stream restarts. This reduces false Ready and duplicate starts;
it does not prove exact-once execution after an unknown host response.

## Verification

- Focused host suite: `node --test test/windows-client-host.test.mjs` passed
  16/16, including active and contradictory-status rejection.
- Full serial wrapper suite:
  `node --test --test-reporter=dot --test-concurrency=1 test/*.test.mjs`
  exited 0.
- Installed `codex-cli 0.155.0-alpha.16.4`, binary SHA-256
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`:
  `node scripts/native-user-input-canary.mjs <exact-binary> <exact-version>
  --gateway-recovery` passed. During a real App Server user-input wait,
  status was `active`, the turn ID matched, and a duplicate start returned
  HTTP 409. After completion and a file-backed gateway/client restart, status
  was `idle`. The canary used a fixed loopback Responses fixture, zero external
  model calls, temporary configuration, and no current-desktop-task access.
- `node --check client/app.js` and scoped `git diff --check` passed.
- Browser CLI validation was attempted but did not run: WSL Chromium lacks
  `libnspr4.so`; WSL Firefox lacks `libasound.so.2`. No UI visual pass is
  claimed by this initial run. A later privately staged Chromium check is
  recorded in [browser-send replay evidence](G1-BROWSER-SEND-REPLAY.md).

## Open Questions

- A lost `turn/start` response may still have executed. Gateway unknown-outcome
  handling blocks automatic redispatch, but cross-process browser request
  identity and an explicit operator resolution flow remain unverified.
- The browser status/reconnect path needs a real rendered-browser regression
  once its dependencies or a Windows browser runner are available.
- Desktop-client writer relinquishment, UI ingress and approval redirection,
  account binding, effect interception, and rollback remain outside this proof.
