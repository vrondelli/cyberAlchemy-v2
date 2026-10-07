# Linux source-matched Companion package — 2026-10-01

Status: unsigned, extracted-only development `.deb`; not installed or released.
Authority effect: none. The TUI is discontinued and was not built or tested.

## Exact package

- [`are-companion_0.1.0_amd64-inflight-20261001.deb`](../dist/are-companion_0.1.0_amd64-inflight-20261001.deb):
  45,784,022 bytes, SHA-256
  `2cf0779969e617a576db8068886bb49bb3a8e0c102c8c7737fcac93732a3318e`.
- Built offline in the existing Ubuntu 26.04
  `are-companion-builder:native-managed-20260930` image with repository-locked
  Rust and Node 26.8.1. The builder reported 813 ARE closure files and digest
  `8723be9441f9eb60b939ca6e0e33c017a03ed64fa15343fafc8664e77787fa19`.
  No host package was installed. The package is `amd64` version `0.1.0`.
- Extracted, without installation, to `/var/tmp/are-linux-inflight-ENqQFV`.
  The bundled `windows-client-host.mjs` matches the guarded checkout source
  SHA-256 `768d898a1788275467d0bf9b6a71a68fe9dceb7bda1a762087c4afe5198716fa`.
  The Tauri executable SHA-256 is
  `4f635c9125ee617922f86563993f5b6a5c78ca1f46cd320d725a17371d725c01`;
  the native orb SHA-256 is
  `e28316906476fddf5d567293fa2596924117dfdf1dc2b61fe8c2f2b9048560`.
  No TUI path component appeared in the extracted ARE tree.

## Extracted-package checks

- Bundled Node ran `are doctor --json` with product status `PASS`. This is a
  local product diagnostic, not service or current-task readiness.
- An isolated, network-disabled Ubuntu container attached to WSLg/X11 ran the
  extracted `--dashboard-only` executable. WebKitGTK inspection verified the
  Tauri bridge, all seven panels, navigation, and the bundled product
  diagnostic. No orb WebView was created.
- A separate run launched the bundled native orb through the default app path,
  then repeated that launch to activate its dashboard. The WebKitGTK inspector
  again verified the seven-panel dashboard and diagnostic with no orb WebView.
  The existing Linux native-orb binary is byte-identical to the preceding
  package; the newly built Tauri executable was exercised here.

## Claim boundary

This matches the Windows in-flight guard source in a Linux package and proves
bounded WSLg/X11 UI loadability. It does not test a Linux interrupted-turn
recovery fixture, normal Linux desktop pointer behavior, an installed app,
Wayland placement, sustained resource use, or control of this Codex task.
The Windows fixed-loopback crash/relaunch result remains separate
[evidence](WINDOWS-INFLIGHT-RECOVERY-PACKAGE-2026-10-01.md).

## Open Questions

- Run a Linux joined gateway-crash fixture for both an in-flight Plan question
  and a verified completed turn against these exact package bytes.
- Validate normal-desktop pointer, Wayland, accessibility, installed lifecycle,
  and resource budget before product approval or release.
- Verify host writer handover and real ingress/approval control before claiming
  ARE owns an existing chat.
