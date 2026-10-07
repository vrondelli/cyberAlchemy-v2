# ARE closure path portability — Linux package candidate

Status: candidate implementation evidence, 2026-10-04. This is not a release,
host installation, host-task handover, or product approval.

## Defect and repair

ARE's product closure previously treated its physical parent directory as the
source of logical `cyberAlchemy-v2/...` paths. A checkout mounted directly at
`/work` therefore looked for `/cyberAlchemy-v2/...`, and its distribution
guard treated `/` as the whole protected repository, rejecting temporary
staging under `/tmp`. Switching back to the original nested mount also left
Tauri's cached generated permission paths pointing at `/work`.

The source resolver now maps logical product paths to the actual checkout and
serializes them back to the stable `cyberAlchemy-v2/...` package identity.
The output guard rejects destinations inside the source project or containing
it, rather than rejecting every destination below the physical parent.
Core test-plan, isolated-test, candidate, release-verifier, and distribution
consumers use the same mapping. A regression test rejects traversal and
checks the stable logical prefix.

## Verification

- Focused product/distribution tests passed 15/15 in the normal checkout and
  15/15 when that checkout was mounted directly at `/work`.
- The two mount layouts produced the same development closure: 846 files and
  digest `f690864007ba3df62e1c0c93b2ee727c9ba30bec82370c106477c3edbf5a0b15`.
- The standard offline Linux builder completed from `/work`, bundled Node
  26.8.1 and the native orb, and produced the package below. No manual
  Debian assembly was needed for this candidate.
- The extracted package's ARE doctor reported `PASS`. Its WebKitGTK dashboard
  passed the seven-panel, product-diagnostic, and verified-Evolution narrow
  journey at an actual 340 × 740 window, including the compact index
  disclosure and first visible cycle summary. No package was installed.
- Recomputing the selected development closure from the extracted package
  returned the build's exact digest and 846 files.
- Two disposable package-only joined managed-session smokes passed with pinned
  WSL `codex-cli 0.155.0-alpha.16.4` (binary SHA-256
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`):
  default-paused and opt-in guarded Plan input. Each rendered the native orb
  and seven-panel dashboard, observed the same gateway as running, backend as
  ready, and hosted client as connected, then verified supervised stop after
  Companion exit. Both ran with network disabled and zero model calls.
  The first attempt in the lean runtime image failed before readiness because
  that image lacked `libxkbcommon-x11.so`; rerunning in the builder image with
  the declared desktop library passed. This failure is a test-image dependency
  gap, not a positive result for the lean image.
- The same extracted package passed a real two-turn hosted-client restart
  canary in a network-disabled container with an init process: two local
  fixture model calls, zero external calls, exact objective continuity,
  requirement tracking, and duplicate-dispatch rejection. The steering and
  compaction variant passed with four local fixture calls and zero external
  calls. Earlier runs without a container init process intermittently failed
  at `gateway.prior-backend-process-live`; a later no-init rerun passed, so
  container reaping alone does not explain the intermittent failure.

## Owned backend shutdown follow-up

The gateway previously signalled its owned backend on shutdown but did not wait
for that child to exit before reporting that the gateway had stopped. A fast
managed restart could therefore encounter a genuinely live prior backend and
correctly fail its process-identity guard. Current source tracks every owned
backend, refuses late handshakes once shutdown begins, awaits child exit, and
uses a bounded forced-stop fallback before reporting shutdown completion. An
unconfirmed exit fails closed. The gateway, process-birth, and managed-session
tests pass 169/169, including a new delayed-exit and late-handshake regression.
The updated source also passed the network-disabled, fixed-provider two-turn
steering/compaction restart canary with four local calls and zero external
calls.

The standard offline builder then produced
`dist/are-companion_0.1.0_amd64-backend-exit-20261004.deb` (SHA-256
`268b420ce09b913a530cf0f37fa4119e7c0909bb5e97a430930c3739d7b061cf`).
It contains 846 development-closure files with digest
`1a1a2962217eccde0cfd9eed4abadbfc165712a3e21d513f8b386b6550b0158f`.
The extracted gateway source hash exactly matched the current source hash
`3cc1be4cda16bfc53209a367e8265f8ee8d69785274846b1bc0a4315a1abdc12`.
Bundled ARE doctor reported `PASS`.

With Docker networking disabled and no container init process, the extracted
package passed one two-turn steering/compaction/requirement-tracking restart
canary (four local fixture calls, zero external calls) and three repeated
two-turn requirement-tracking restart canaries (two local fixture calls each,
zero external calls). Each retained the same objective after restart and
rejected duplicate dispatch. This samples the formerly intermittent boundary;
it is not a statistical guarantee against every shutdown race.

The same uninstalled package passed both default-paused and guarded Plan-input
joined WSLg/X11 smokes. Each rendered the native orb and seven-panel WebKitGTK
dashboard, saw gateway running, backend ready and hosted client connected,
then observed supervised Companion exit. These UI smokes made zero model calls.
All package-only tests used temporary state and left this desktop task outside
ARE control.

## Isolated installed-package follow-up

The same backend-exit `.deb` (SHA-256
`268b420ce09b913a530cf0f37fa4119e7c0909bb5e97a430930c3739d7b061cf`)
was installed with `dpkg -i` inside a disposable Ubuntu 26.04 container
(`are-companion-builder:native-managed-20260930`, image digest
`8257ee0c614928b5cb07da77d6acdb1bfafb6a6daf4bf50272703304dee1db1e`).
Docker networking was disabled; the package was mounted read-only before
installation, and no installation or settings change occurred on the host.
The installed `/opt/are-companion` runtime reported ARE doctor `PASS` with an
exact bundled Node 26.8.1 match.

The installed `--dashboard-only` entry opened a WebKitGTK dashboard with a
working Tauri bridge, all seven panels, and a passing product diagnostic. The
explicit `--webview-orb` fallback also opened that dashboard and passed the
seven-panel, skin, and bounded-source journey. The no-argument default launcher
spawned the bundled native orb; a test-only X11 pointer helper dragged and
clicked it, opening its owned dashboard. The dashboard passed the same
seven-panel/product check, closed and reopened under the orb, rejected duplicate
launches, and exited after abrupt orb loss. The native-orb harness reported
`dashboard_opened_by_icon_click: true`, `native_icon_moved_by_x11_drag: true`,
`dashboard_ui_verified: true`, and `abrupt_orb_loss_exited_owned_dashboard: true`.
The initial no-argument inspector probe found no WebView orb because the
bundled native orb is the default; it was not an application failure.

An independently created disposable one-cycle/one-commit Evolution ledger was
mounted read-only into a second installed-package container. The installed
dashboard showed a verified ledger, restored metrics, and the recorded cycle
before the candidate registry. The generic UI inspector formerly emitted a
hardcoded `package_installed: false` even for this run; its source now reports
`installation_posture: not-assessed-by-ui-probe` instead. Installation evidence
comes from the successful container `dpkg -i`, not from renderer inspection.
The disposable ledger was removed after the check.

The installed package then passed both zero-model managed-session UI smokes:
default-paused and opt-in guarded Plan input. Each used the bundled Node and
native orb with pinned `codex-cli 0.155.0-alpha.16.4` mounted read-only,
observed a running gateway, ready backend, connected hosted client, seven
dashboard panels, and supervised shutdown after Companion exit. The Linux
managed UI harness now reports `installation_posture:
not-assessed-by-ui-harness` instead of the previous hardcoded `installed:
false`; `dpkg -i` in the disposable container supplies the installation
evidence.

A stronger installed-package canary completed one disposable hosted read-only
turn against a private loopback Responses fixture. It observed one local
provider request, the UserPromptSubmit and Stop hooks, and native turn
completion, with no tool attempt or external model call. The Companion showed
the same selected gateway path, one completed backend-thread row, its verified
completion frontier after opening the state-and-evidence disclosure, and the
thread-linked Decisions view under the same gateway epoch. The current-source
test harness supplied the omitted test-only inspector and activated the
package's default native orb; the gateway, hosted client, and Companion ran
from the installed package. This result does not prove complete host-effect
coverage or control of this pre-existing desktop task.

This closes the isolated Ubuntu 26.04 installed-package launch/resource-path
and one read-only managed-turn UI check for this exact Linux candidate. It does
not test a normal host install, upgrade/rollback, physical pointer, Wayland
desktop, screen reader, resource budget, Windows parity, complete model-effect
coverage, or this desktop task's control.

A separate current-package Xvfb/Openbox run exercised the updated
`scripts/test-linux-ui.sh` against the installed backend-exit `.deb`. X11
synthetic pointer input moved the 84 × 84 native orb before activation, then a
pointer click opened its exact owned 1120 × 760 dashboard child. The WebKitGTK
inspector verified the Tauri bridge, seven panels, skin change, and bundled ARE
diagnostic. The first draft of the probe tried dragging after opening the
dashboard; its window covered the orb in that isolated display, so those
events targeted the dashboard and did not test orb drag. Reordering the probe
made the original packaged binary pass without a product-code change. This is
automated X11 pointer evidence, not a human pointer or compositor-diversity
test. Pixel captures show the [native orb](evidence/linux-xvfb-20261004/orb.png)
and [Evolution dashboard](evidence/linux-xvfb-20261004/dashboard.png) in the
registry-only posture; they do not show a running Evolution worker. The
disposable containers, diagnostic image, and raw X11 dumps were removed
afterward.

Package: `dist/are-companion_0.1.0_amd64-portable-20261004.deb`.
SHA-256: `85d01d3b238eff4280a1fbfd85d41e71d3bcc08701ed082f12de90f5b1328417`.

## Claim ceiling

This proves the tested Core closure, standard Linux packaging path, extracted
UI and joined managed-path journeys, isolated installed-container UI and
read-only managed-turn paths, and sampled local-provider managed turns for this
source. It does not
prove that every historical
development canary supports a shallow checkout, that symlinked source paths
are safe, that a Windows package has parity, or that this desktop task is
ARE-managed. The UI joined smokes have no model turn; the separate local-provider
canaries do not prove normal Windows model-entry enforcement or universal
effect interception. The latest backend-exit package supersedes the earlier
standard-builder package for further Linux testing. Both are unsigned; neither
is installed on the host, though the backend-exit package passed the isolated
container installation above.

## Open Questions

- Audit the remaining development-only scripts that independently derive a
  parent repository root before claiming arbitrary-checkout portability.
- Review symlink/canonical-path handling at the source and output boundary.
- Test the same source with native Windows WebView2 and a normal host-installed
  lifecycle, including upgrade and rollback.
