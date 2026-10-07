# Windows extracted-installer provenance — 2026-09-28

Status: development evidence only. The unsigned NSIS installer was inspected and
extracted, not run or installed. TUI is discontinued and is not a target of this
package or the companion UI.

## Exact candidate

- Installer: `D:\are-companion-attested-jAYjg8\ARE_Companion_provenance_ui_20260928.exe`
- SHA-256: `2f160ac2fa013d0da1f3be13ead50a395a04866bb23aa96615856db4e53bebdd`
- Extracted payload: `D:\are-companion-attested-jAYjg8\installer-extracted`
- Archive inspection: NSIS-3 Unicode, 778 files, 121,664,171 uncompressed bytes.
  Extraction reported `Everything is Ok`.
- The extracted `are/` tree compares byte-for-byte with the retained build
  stage's `src-tauri/resources/are/` tree. Bundled `node.exe` also has the same
  SHA-256 in both trees:
  `5cba0ea928508c65ddadefc0681d2fb6d95f1f3beea4428f04397631140ee8e5`.
- The extracted `are-companion.exe` differs from the stage's executable in
  exactly three bytes: Tauri's embedded `TAURI_BUNDLE_TYPE_VAR_` marker is
  `NSS` in the NSIS payload and `UNK` in the pre-bundle stage. The extracted
  executable SHA-256 is
  `56e366aa6b4cd7b1268a06759597157d8c79f47ff9747e4598a18d6ea2ad0888`.
- No `cyberalchemy-tui/` or TUI resource path is present in the extracted
  payload.

## Native Windows checks against extracted bytes

The package's own Node 26.8.1 executed
[`test-windows-features.mjs`](../scripts/test-windows-features.mjs) against the
extracted resource directory. Its 11 checks passed, including exact bundled
Node, `are doctor --json` with `PASS`, direct route/context decisions, bounded
Reasoning State plan context, thread/decision observation module loading, and
native Evolution SQLite write/read/reopen. The reported product version is
`0.10.0-rc.1`, closure digest
`b6b659c26bd7b9c9263b90f4647d30b15fc8575ecfbc6e085d2156afa9d26816`.

The same Node ran [`test-windows-ui.mjs`](../scripts/test-windows-ui.mjs)
against the extracted `are-companion.exe`. It opened the orb and a nonblank
dashboard; all seven destinations, source-separated status, navigation,
appearance, keyboard focus, contrast, reduced motion, and preference relaunch
checks passed. The dashboard loaded `http://tauri.localhost/dashboard.html`
with `readyState: complete`, a visible grid shell, and seven navigation items.

Finally, [`test-managed-session-windows.mjs`](../scripts/test-managed-session-windows.mjs)
ran the extracted executable and Node with a disposable Windows Codex host and
private manager state. The rendered Adapters page showed gateway `running`,
backend `ready`, client `connected`, hosted-input proof `configured`, host
control `unverified`, and model-turn ingress `paused`. The check reported zero
private or external model calls, supervised Companion exit, and no control of
the current desktop task.

The first managed smoke sourced its launcher and hosted client from the working
checkout. An explicit `--package-root` mode now binds the launcher, hosted
client, profile, and ARE entry to the exact `are/cyberAlchemy-v2` tree adjacent
to the extracted executable; it also requires the adjacent bundled Node. Two
native Windows runs of that package-only mode passed with
`resource_origin: adjacent-extracted-package`, the same seven rendered panels,
connected gateway and hosted client, hosted-input proof `configured`, turn
ingress `paused`, zero private/external model calls, and supervised cleanup.
The probe script itself remained in the checkout; the exercised ARE runtime
and Companion resources came from the installer payload.

An extracted-executable `--resource-cycles 3` run passed its open, close,
reopen, nonblank-render, and process-tree checks. It measured 155,099,136
private bytes for the initial orb tree, 240,537,600 on the first dashboard
opening, and 158,048,256 after the final close (2,949,120 above that run's
initial orb sample). A separate no-debug, default-browser-preset, ten-second
orb-idle run passed with seven processes, 129,093,632 private bytes, and
0.140625 CPU seconds in the sample interval. Short, differently launched runs
are not a production resource budget or a leak verdict.

## Claim ceiling and open questions

Extraction validates package contents and running the extracted app, not the
NSIS installation lifecycle. The installer was not executed; WebView2
bootstrap/download, Windows registration, shortcuts, uninstaller, installed
resource lookup, file ACLs, upgrades, and rollback are unverified. The native
checks used an already available WebView2 runtime. The package-only managed
smoke verifies the adjacent extracted ARE runtime, not an installed
launch/registration path. It does not show that this desktop task is
ARE-controlled or that Windows host hooks carry complete callback input.
Those remain separate G1/O1 gates in
the [integration work-pack](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/INTEGRATION-WORK-PACK.md).
