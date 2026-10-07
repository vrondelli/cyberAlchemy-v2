# Managed-session Linux Companion UI — 2026-09-28

Status: current-source, development-only evidence. TUI is discontinued and
was not used. This is not an installed package, release, physical-pointer,
resource-budget, or current Codex desktop-task-control result.

## Exact path

The current Linux Companion source was compiled with the locked repository
Rust toolchain in the existing Ubuntu 26.04 builder container, offline. A
direct host link failed because this host lacks GTK/WebKitGTK development
libraries; the container has those libraries. The source executable ran as
non-root in a disposable, network-disabled container with the installed
`codex-cli 0.155.0-alpha.16.4` binary mounted read-only. Codex's sandbox
needed container user namespaces; the test container used an unconfined
seccomp profile, no network, and a temporary isolated Codex home. Neither
the package nor Codex's active configuration was installed or changed.

`scripts/test-managed-session-linux.mjs` created private state, configured a
no-model local provider endpoint, and started `are managed-session` with the
current-source Companion executable. The launcher started one gateway, one
hosted client, and the read-only Companion observation socket. A test-only
WebKit inspector clicked the floating orb and checked the dashboard. The
inspector is not enabled in a normal Companion launch.

## Observed result

- The managed launcher reported the Companion process started, and the
  authenticated hosted client's `/api/state` returned ready.
- The WebKitGTK orb and dashboard documents rendered. All seven navigation
  panels, the ARE product diagnostic, continuity/dispatch disclosures, the
  unconfigured Evolution sources, and a Cobalt skin change passed the
  existing inspector checks.
- On the Adapters panel, the same managed gateway rendered `running`, its
  backend `ready`, and the client link `connected`. Current desktop-task
  control remained `unverified`.
- The smoke returned `are.managed-session-linux-ui-smoke/v1` with zero model
  calls and no installation. It then terminated the exact disposable Companion
  child and observed the managed launcher stop the full session with a
  `companion` stop reason. The launcher and children terminated; no
  matching managed processes remained afterward. Source dashboard tests
  passed 40/40.

A second joined run used the same installed Codex binary and current-source
Companion with three exact-hash trusted hooks in a disposable Codex home and a
fixed loopback Responses provider. The managed hosted client created one
thread and completed one turn. The Tauri dashboard observed exactly one
backend-thread row with a verified completion frontier from the same gateway
epoch as Adapters, then followed that row into a populated Decisions view.
The private provider handled two requests; the pre-tool hook blocked the
fixture command; prompt context, Stop, and host completion were observed.
`hosted-hook-denial-canary.mjs --managed-session-ui` returned success, zero
external model calls, no active configuration change, and no current-task
handover. The read-only UI did not itself send a turn or approve an effect.

The first clean-container attempt exposed a real integration defect: the
gateway's live-version verifier accepted only a `Codex Desktop/` user-agent
prefix. Without the parent app's inherited
`CODEX_INTERNAL_ORIGINATOR_OVERRIDE`, the installed App Server reported the
authenticated client's declared name instead. The verifier now admits only
that exact declared name (or the existing Desktop prefix) with the pinned
version. Focused gateway/identity tests passed 133/133, and the installed-host
managed-turn canary passed with the override explicitly removed, using its
isolated trusted-hook fixture and zero external model calls. This is still a
self-reported transport version, not a cryptographic host-identity proof.

## Claim ceiling and open questions

This verifies one integrated, newly owned ARE path with a rendered read-only
Linux UI, including a bounded turn-to-Threads-to-Decisions journey. It does
not verify normal Linux desktop drag/pinning, package
install/upgrade, Windows installed launch, long idle cost, power-loss
recovery, complete host effect interception, or control of this already-open
Codex desktop task. The first UI smoke started no thread or model turn; the
separate joined fixture deliberately started one owned turn through the
hosted client, not through the read-only Companion.

- Can the current desktop task's writer and ingress be transferred through a
  supported host contract? If not, this remains a separate ARE-owned client.
- What exact installed Linux/Windows lifecycle, private-state permissions,
  numeric resource budget, and compositor matrix will define release proof?
