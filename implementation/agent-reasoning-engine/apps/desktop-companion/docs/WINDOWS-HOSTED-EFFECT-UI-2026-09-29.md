# Windows hosted-effect Companion projection — 2026-09-29

Status: bounded development evidence. The TUI is discontinued and is not a
product or validation target. This check did not install an application, start
an external model turn, transfer the current desktop task, or approve a host
effect.

## Exact package and source

- Unsigned NSIS candidate:
  `dist/ARE_Companion_0.1.0_x64-setup-hosted-effect-ui-20260929.exe`.
  SHA-256: `eca39b831e46289300c5f7f9c85066d6f25ad67a50572dfac86a73232d98c14f`.
- The native Windows builder staged 801 ARE closure files from current source;
  closure digest `7ef1d7aff016ea037225e04c5048ffecdd0bfbcbc334da721338b74be71394d9`,
  Core closure digest `3902ea50a261bf1c216e2ca17913400be1e20d790e930249a0ee29f9b517d538`,
  bundled Node 26.8.1, pinned Rust 1.98.1 MSVC, and unsigned NSIS output.
- A first build failed only because its Windows C: temporary Rust stage filled
  the volume. The exact failed `acw-vrOyWe` stage (about 835 MiB) was removed
  after confirming the compiler processes had exited. A fresh build staged on
  D: and succeeded; unrelated caches and prior installers were not removed.
- The NSIS archive integrity test and extraction both reported `Everything is
  Ok`, 809 files and 122,047,837 uncompressed bytes. The extracted executable
  SHA-256 is `868e9d5247d191529d1f89993aab08b6ce6f7baa434b50bcc0e54327ce37515f`;
  its adjacent Node SHA-256 is
  `5cba0ea928508c65ddadefc0681d2fb6d95f1f3beea4428f04397631140ee8e5`.
  The retained extracted payload is `D:\are-companion-extracted-stGVWT`.

## Native checks

The extracted package's own Node passed all 11 checks in
[`test-windows-features.mjs`](../scripts/test-windows-features.mjs), including
product health, route/context decisions, Reasoning State loading, bounded plan
context, thread/decision observation clients, and Evolution SQLite replay.
The product health reported `0.10.0-rc.1` and the exact Core closure digest
above.

The extracted executable passed the default seven-panel
[`test-windows-ui.mjs`](../scripts/test-windows-ui.mjs) WebView2 journey. The orb
opened `http://tauri.localhost/dashboard.html` with `readyState: complete`, a
nonblank 1,001-character body, visible Overview, seven navigation items,
adapter/evidence/appearance journeys, keyboard focus, saved skin/corner
relaunch, and independent product-versus-gateway status. The baseline screenshot
is `D:\are-companion-extracted-stGVWT\dashboard-baseline.png`.

Two additional native WebView2 runs exercised an authenticated disposable
gateway observation:

- `--adapter-live --unknown-hosted-effect` showed one unresolved gateway
  hosted-effect dispatch in the aggregate Threads warning **and** on the
  matching backend-thread card. Both explicitly said host execution was
  unknown and did not authorize a retry. Screenshot:
  `D:\are-companion-extracted-stGVWT\hosted-effect-thread-same-session.png`.
- `--adapter-live --unknown-hosted-effect-foreign` kept the aggregate warning
  visible but did **not** attribute a foreign consumer session's request to
  the displayed thread. Screenshot:
  `D:\are-companion-extracted-stGVWT\hosted-effect-thread-foreign-session.png`.

The first test-fixture draft put the request in a foreign session while
expecting per-thread attribution; the resulting WebView failure confirmed the
session join was enforcing that boundary. The fixture now tests the two cases
separately. The assertion checks the rendered WebView document, not just the
source text. No real host command was requested by these UI fixtures.

The package-only [`test-managed-session-windows.mjs`](../scripts/test-managed-session-windows.mjs)
smoke passed against the extracted executable, its adjacent ARE runtime and
Node, and pinned `codex-cli 0.155.0-alpha.16.4`. It showed gateway running,
backend ready, hosted client connected, hosted-input proof configured, and
model-turn ingress paused. It made zero private or external model calls and
reported `current_desktop_task_control: false`. An initial run reached the
managed stop record but hit the harness's 8-second manager-exit deadline.
The manager's documented child shutdown path can wait 10 seconds per child;
the harness now waits up to 35 seconds and checks child exit. The rerun passed
with supervised stop in 10,184 ms and exit code 0.

`node --check` passed on both updated native smoke scripts. The extracted
payload and screenshots remain on D: for review. Only the task-specific empty
D: build parent and the disposable local 7-Zip extraction tool directory were
removed after use.

The gateway's cross-platform regression suite now explicitly tests the same
consumer-session join and foreign-session suppression. Its first draft tried
to bind the same backend thread to two sessions and was correctly rejected by
the store's exclusive ownership rule; separate stores now exercise both
postures. The gateway suite passed 143/143 on WSL and 143/143 with native
Windows Node. The native run required a platform-native temporary fixture root
instead of the prior hard-coded POSIX `/tmp` path; its task-specific D: temp
directory was removed after the tests. The full WSL wrapper suite passed
633/649 with 16 skips, and the native Windows dashboard source suite passed
45/45.

## Claim ceiling and open questions

This proves current-source packaging and rendered read-only projection on an
extracted Windows executable. It does not prove installer registration,
installation/upgrade/uninstall, WebView2 bootstrap on a machine without it,
private-state ACLs, resource budget, normal Windows managed model-turn
ingress, human approval delivery, a host command's execution, hosted-effect
outcome reconciliation, or exclusive ARE control of this desktop task.

- Can the installed desktop expose a supported writer/input handover for the
  exact task without duplicate ingress?
- Can Windows host callback input and all advertised effect paths be bound
  before normal managed turns are unpaused?
- What installed-package lifecycle and resource evidence is required before
  product approval?
