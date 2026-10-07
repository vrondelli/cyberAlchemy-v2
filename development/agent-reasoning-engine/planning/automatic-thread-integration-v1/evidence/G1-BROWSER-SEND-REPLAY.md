# G1 browser send recovery through a stable gateway key

Status: bounded local implementation evidence, 2026-09-26. This does not
activate or take over the current desktop task.

The hosted browser now checkpoints one pending `turn/start` intent before
dispatch. Its origin-local storage contains only the owned thread ID, a random
stable gateway request key, a SHA-256 digest of the trimmed message, and a
timestamp; the message itself is not stored. If the HTTP result is lost or the
page reloads before acknowledgement, Send changes to Recover send. A changed
message or another thread is rejected locally. Re-entering the exact message
reuses the same key and exact RPC payload. A known gateway result is replayed
without another host dispatch; a gateway unknown outcome remains an error and
the pending checkpoint is retained. The browser never automatically retries.

This is recovery of a browser acknowledgement, not proof that all backend
unknown outcomes can be reconciled. It depends on the same authenticated
gateway session and browser origin surviving or being restored.

## Verification

- `node --test test/pending-turn.test.mjs test/windows-client-host.test.mjs`
  passed 19/19. Tests cover content-free storage, exact-key reuse, changed
  text/thread rejection, malformed state, and checkpoint failure.
- The full serial wrapper suite and browser JavaScript syntax checks exited 0.
- The installed `codex-cli 0.155.0-alpha.16.4` canary with a fixed loopback
  Responses fixture passed a hosted turn, file-backed gateway/client restart,
  same-key `/api/turns` replay, identical turn ID, and no extra provider call.
  Binary SHA-256:
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
  The canary used a disposable thread, zero external model calls, temporary
  configuration, and did not touch the current desktop task.
- Playwright Chromium ran with three shared-library packages staged only in
  an isolated temporary directory. On the recovered disposable thread, a
  simulated pending checkpoint survived page reload; the page displayed
  Recover send and disabled New thread. Different text was refused without a
  send. Re-entering the exact text cleared the marker and restored Ready and
  Send. The rendered conversation did not gain another turn; browser console
  reported zero errors. The temporary packages were removed after the run.

## Open Questions

- Origin-local storage is not shared if the host changes its HTTP origin
  (including its port). A server-side content-free pending-intent handoff is
  still needed for arbitrary-port or cross-device recovery.
- This checkpoint covers one pending send per browser origin. Multi-tab
  contention and an explicit reviewed resolution path for a genuinely unknown
  gateway/backend outcome are not yet proved.
- This does not grant desktop client writer relinquishment, complete host
  ingress/effect interception, account binding, or live rollback.
