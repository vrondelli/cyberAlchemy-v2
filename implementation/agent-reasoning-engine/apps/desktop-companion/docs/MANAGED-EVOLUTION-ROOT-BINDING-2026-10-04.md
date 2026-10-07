# Managed Companion Evolution root binding

Status: isolated Linux package and unsigned Windows installer candidate
evidence, 2026-10-04. The Linux package was installed only inside a
disposable, network-disabled container. The Windows installer was extracted
for static inspection, not installed. Neither package was released or
activated on the host. The desktop task open in Codex remains outside this
managed session.

## Boundary and change

The native Companion already reads either a bundled candidate registry or an
explicit durable Evolution root. The managed-session launcher previously let
`ARE_COMPANION_EVOLUTION_ROOT` pass through from its ambient environment, so a
managed Companion could silently select an unrelated ledger. There was also no
launcher option to bind the known durable root. The launcher now accepts
`--companion-evolution-root /absolute/existing/root` only alongside
`--companion-command`, resolves it to one existing canonical directory, strips
inherited Companion Evolution root and signal-log variables case-insensitively,
and passes only that selected root to Companion. The ready record reports
whether a root was configured, not whether its evidence was verified.

The joined Linux UI harness now checks registry-only mode when no root is
selected and verified-ledger mode against exact expected cycle and commit
counts when a root is selected. It deliberately supplies a false ambient root
in both modes, so an accidental environment inheritance fails the UI check.
The Companion observer remains read-only: it does not create a missing root,
open the operational SQLite index, activate a cycle, or infer worker liveness.

## Validation

- Managed-session focused tests passed 9/9, including explicit-root preflight,
  canonical path selection, and ambient root/signal-log removal. Dashboard
  tests passed 67/67. The full wrapper suite reported 806 tests: 782 passed,
  zero failed, and 24 platform skips.
- A network-disabled, uninstalled Linux package UI smoke used current launcher
  source with the previously built `backend-exit-20261004` Companion binary and
  one disposable Evolution fixture. The native orb, owned dashboard, seven
  panels, product diagnostic, running gateway, ready backend, and connected
  hosted client were observed; Evolution rendered a verified ledger with one
  cycle and one commit. The matched registry-only smoke also passed with the
  false ambient root and no explicit root. Both made zero model calls and
  verified supervised Companion exit.
- The pinned offline builder then produced
  [`are-companion_0.1.0_amd64-evolution-binding-20261004.deb`](../dist/are-companion_0.1.0_amd64-evolution-binding-20261004.deb)
  (SHA-256 `b6d38a9323e8eb8dc0f78b2e50dffb2582a1ad27166fffd2feb7c361954f6477`,
  846 closure files, digest
  `a3bb286741def772379419883313ee3c31545f33299ff2a20517058a124ab89f`).
  Extraction confirmed the new launch option in the bundled manager. Three
  network-disabled package-only joined UI smokes then passed using its bundled
  Node, ARE resources, native orb, and manager: registry-only despite a false
  ambient root, verified 1-cycle/1-commit fixture, and verified live
  5-cycle/33-commit ledger mounted read-only. Each observed the seven-panel
  dashboard, running gateway, ready backend, connected hosted client, and
  supervised Companion exit with zero model calls.
- The actual ARE MCP Evolution coordination projection had digest
  `cd25bfb3f3cd45cc42bf6659b76d243a1fb7a600d55d4096e1b2fc8bd488d31c`.
  Direct read-only coordination inspection of
  `/home/vlad_/.local/share/are/evolution-runtime-v1` returned the same digest,
  33 commits, and five phases. A third network-disabled UI smoke mounted that
  exact root read-only and displayed a verified ledger with five cycles and 33
  commits. A subsequent MCP inspection returned the same coordination digest
  and counts. This proves the display can read that snapshot; it does not prove
  a worker is running or that a host chat is controlled by ARE.
- The visual smokes used the existing Ubuntu builder image and WSLg X11 socket.
  A separate `dpkg -i` of the exact new `.deb` inside a disposable container
  also passed the joined managed UI smoke from `/opt/are-companion` against the
  read-only live ledger: verified five cycles and 33 commits, seven panels,
  gateway/backend/client ready, supervised Companion exit, and zero model
  calls. No WSL or Windows host installation occurred. The smokes do not
  establish Windows parity, host-chat control, or worker liveness.
- A fresh package-only rerun of that exact `.deb` used its bundled Node,
  manager, ARE resources, native orb, and dashboard in a network-disabled
  container. With the live Evolution root mounted read-only, the joined UI
  reported seven panels, gateway running, backend ready, hosted client
  connected, verified five cycles and 33 commits, supervised Companion exit,
  and zero model calls. A matched run with no explicit root stayed
  registry-only despite the harness's false ambient root. The direct ledger
  observer still reported five cycles and 33 commits afterward; its separate
  operational index status remained `rebuild-required`. These checks do not
  assert a live worker, index repair, host installation, or this chat's control.
- The pinned native Windows builder produced
  `D:\acw\ARE_Companion_evolution_binding_20261004_x64-setup.exe` (SHA-256
  `5b1566a00579c6b4c185888e4810959b68ffd24990ce2fa47ba726a1c0cf5ac4`,
  33,850,035 bytes, 846 source-closure files, closure digest
  `8bd99df5fd5ba4d1216e854619f029f246b69a6cfc912acf7800203de9d10c28`).
  The unsigned NSIS archive passed `7z t` and extraction. Its extracted
  resources include the Companion executable, native orb, bundled Node, and
  managed launcher with the new Evolution-root option. Subsequent direct
  native Windows feature and staged WebView2 probes exercised the seven-panel
  dashboard, 40-thread paging, registry-only Evolution, a verified live-root
  Evolution view, and a narrow two-definition fixture. Local captures are
  retained under `D:\acw\ARE_current_*.png`; the staged package was not
  installed. The joined Windows managed-session harness now tests both
  explicit verified-root and no-root behavior, including false ambient roots,
  but that new joined test has not completed natively: WSL-to-Windows process
  launch currently fails before the test starts
  (`UtilAcceptVsock:273: accept4 failed 110`). This is not a product verdict.

## Open Questions

- Verify native Linux host behavior and resource limits separately before an
  installed-host or release claim; the container test proves only its exact
  isolated environment.
- Restore Windows process/tool interop and complete the extracted installer's
  joined managed-session Evolution source-binding and coordination-fixture
  probes, without altering the current desktop task.
- Keep host-task control separate: a successful ARE MCP call or a managed
  Companion display does not activate control of this Codex desktop task.
