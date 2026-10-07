# G1 restored-history browser view

Status: local construction evidence, 2026-09-26. This does not activate the
current desktop task.

## Change and boundary

After a hosted-client restart, the browser now loads a bounded stored-history
view for an ID previously created by that client and recovered under the same
gateway session. The HTTP host requests one latest-first page of up to 20
turns from App Server using `thread/turns/list` with `itemsView: summary`.
It projects only user text and assistant messages (at most 80 messages,
8 KiB per message and 64 KiB total text), then orders the page for reading.
Reasoning, tool output, file changes and other item types are excluded. An
unknown or external thread ID is rejected before the App Server call. The
browser hydrates on load/rejoin, clears the previous thread's panel on a
switch, and labels bounded or unavailable history explicitly. No old turn is
replayed through the ARE decision path.

## Verification

- The focused Windows client-host fixture passed, including external-ID
  denial and checks that reasoning text and tool output never appear in the
  HTTP projection.
- An installed-binary canary completed an isolated turn, restarted both the
  file-backed gateway and hosted client, rejoined the same ARE-created thread,
  and found its original user and assistant messages through the new HTTP
  endpoint. It used a fixed loopback provider with zero external model calls.
- A Chromium browser snapshot of the recovered client showed the original
  thread ID, private-file recovery mode, the prior user question and assistant
  answer in the conversation panel. The UI did not show a blank panel. A
  second Chromium check after the layout correction showed zero console errors
  while the fixture was running; the canary then exited `PASS` and removed its
  temporary configuration.
- The full serial wrapper suite exited 0 after the history implementation.
  Source syntax and `git diff --check` were run before the final report.

## Claim ceiling

This covers one recent-page read for an owned legacy-history thread after a
completed turn. It does not cover arbitrary older-page navigation, media,
partial or interrupted turns, all App Server item types, browser event
reconciliation under concurrent turns, native Windows WebView, or desktop-task
handover. The current chat remains outside ARE control.

## Open Questions

- How should older pages and non-text media be presented without exposing
  tool or reasoning internals by default?
- What exact event/history reconciliation rule is needed when a turn is active
  while the browser reconnects?
