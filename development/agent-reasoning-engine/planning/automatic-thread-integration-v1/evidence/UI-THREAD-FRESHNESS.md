# Companion Threads freshness and last-seen state

Status: bounded source implementation evidence, 2026-09-26. This does not
activate a desktop task or establish an ARE-managed host session.

The Companion Threads panel now refreshes the gateway-owned backend-thread
observation every ten seconds only when Threads or Evidence/Diagnostics is
visible. The Rust bridge already refuses a source snapshot older than five
seconds; the browser view additionally checks that timestamp and ages its
own displayed observation out after ten seconds. On expiry or source loss,
the last verified rows remain inspectable but their phase changes to “Last
seen · phase was …”. A prior zero-record observation becomes unknown, not a
current “no threads” claim. Hidden panels do not keep polling the gateway;
returning to a visible panel triggers a fresh read.

## Verification

- `node --test implementation/agent-reasoning-engine/apps/desktop-companion/ui/dashboard.test.mjs`
  passed 12/12. Dynamic VM tests exercised an expired active row, source-loss
  last-seen posture, and an expired zero-record observation. The dashboard
  source passed `node --check`.
- This test covers the current UI source logic, not an extracted Windows
  WebView2 build, a Linux compositor, or a live current-task handover.

## Open questions

- The gateway currently projects backend threads in its own process, not a
  complete list of verified ARE-managed host tasks. A title, exact host/task
  binding, and live frontier canary remain prerequisite for that broader UI.
- Native renderer timing, idle resource cost of ten-second visible polling,
  and accessibility of the last-seen transition remain to be measured in
  packaged builds.
