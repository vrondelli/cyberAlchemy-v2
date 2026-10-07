# G1 hosted completion-state check

Status: bounded candidate UI construction evidence, 2026-09-28. The TUI is
discontinued and is not a target, fallback, or parity criterion.

The hosted browser previously set its runtime to `idle`, displayed `Ready`,
and enabled Send on a native `turn/completed` notification alone. That event
does not establish that the host's stored turn history has caught up with
ARE's durable completion receipt. The browser now keeps runtime `uncertain`
and Send disabled until its runtime endpoint returns an audited idle result.
Typed `windows-client.history-unavailable` responses receive bounded retry;
an older active snapshot for the same completed turn is likewise withheld.
Other errors do not retry, and a newer turn event invalidates an older runtime
read before it can change the UI.

The runtime-verification helper's three unit cases passed. The hosted asset
test confirms the new browser module is served from the exact allowlist.
The initial affected gateway, durable-store, observation, hosted-client,
helper, and browser suites passed 191 tests with 7 optional browser tests
skipped. The first browser attempt was blocked: WSL Chromium lacked
`libnspr4.so`, Windows Chrome could not use a Linux-launched debugging pipe,
and Playwright CLI's default Chrome distribution was absent.

The follow-up ran the existing browser suite with Windows Node and installed
Windows Chrome, forwarding `ARE_PLAYWRIGHT_ROOT` and `ARE_CHROMIUM` through
`WSLENV`. All 7 rendered-browser tests passed, including the transient 409
history, older active snapshot, blocked Send, and eventual audited Ready
regression. The separate Companion navigation browser script also passed its
responsive, keyboard, adapter, thread, decision, Evolution, and independent
failure-state checks with no uncaught page errors. Both runs used disposable
fixtures; they did not launch the packaged Companion, access the current
desktop task, or prove an exclusive host handover. This is rendered-browser
functional evidence, not a visual design review or native WebView2 pass for
this particular change.

This does not activate or hand over the current Codex desktop task. The
installed-host completed-turn and active-turn hard-crash canaries passed once
each with disposable state; the strict hosted polling canary also passed once.
They are integration fixtures, not release approval.

## Open Questions

- Inspect the hosted client's changed completion states visually before a
  production UI-readiness claim; validate the packaged Companion's WebView2
  dashboard separately.
- Verify exclusive desktop-task writer handover and complete ingress coverage
  separately; a hosted-client pass does not confer control of this chat.
