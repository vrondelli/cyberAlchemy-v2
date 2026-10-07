# Linux Companion package with marker recovery repair — 2026-09-30

Status: unsigned, uninstalled development `.deb`. The TUI is discontinued and
was not used. No current desktop task was moved under ARE.

## Package and source binding

The current checkout built offline in the retained Ubuntu 26.04 builder image
using the repository's locked toolchain and Node 26.8.1. The resulting
[development package](../dist/are-companion_0.1.0_amd64-marker-recovery-20260930.deb)
has SHA-256
`0c3216cced9439cf939acedee702617466b5ef6cf7cbceca5a146226693cbb5f`,
811 ARE distribution files, and distribution closure digest
`45bf15c45b8cb65687ea1f3878f1c276fd33e337c4d1428acd2724e0af548506`.
It declares GTK 3 and WebKitGTK 4.1 runtime dependencies; it is not a
universal Linux binary.

The `.deb` was extracted without installation. Its executable matched the
just-built source executable byte-for-byte. Its extracted `gateway.mjs`,
`wrapper.mjs`, and `backend-process-birth.mjs` matched current source
byte-for-byte. The bundled Node returned ARE product-health `PASS` and an
exact Node-version match; the core source-closure digest was
`1cd52bb702fcdec3b894cfc47ea01a8e4fffcd28deeb0773c50b9daef942c606`.

## Rendered check

The extracted executable ran as an unprivileged user in a disposable,
network-disabled Ubuntu 26.04 container attached to WSLg X11. The WebKitGTK
inspector observed the orb document and Tauri bridge, opened a nonblank
dashboard, navigated all seven panels, saw the bundled diagnostic and
steer/dispatch recovery disclosures, and applied the Cobalt skin.
Evolution showed five candidate definitions as `Registry only`, an
unconfigured separate signal inbox, and no claimed cycle or commit counts.

The first run failed because the inspector still expected the former hidden
`Not configured` Evolution view. The inspector now checks the current
registry-only presentation and its absent cycle/commit claims. The rerun
passed on the same extracted package.

## Claim ceiling and open questions

This is a WSLg/WebKitGTK renderer and bundled-runtime check. It does not
prove physical pointer dragging, normal Linux compositor behavior,
screen-reader usability, installer lifecycle, low-resource budget acceptance,
live host-effect enforcement, or control of this ChatGPT app task.

- Can the exact package pass free drag, placement persistence, and readable
  pixels on a normal Linux desktop?
- What numerical idle-resource budget should govern the floating orb on the
  supported OS matrix?
