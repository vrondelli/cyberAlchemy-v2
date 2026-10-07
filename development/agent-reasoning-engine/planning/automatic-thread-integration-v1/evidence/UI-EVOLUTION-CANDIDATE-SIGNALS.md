# Companion Evolution candidate signal observation

Status: tested Windows and bounded Linux development UI candidate, 2026-09-26. This follows the separate
[F2 gateway signal intake](F2-GATEWAY-EVOLUTION-SIGNAL-INTAKE.md). It does not
activate a host task, admit an Evolution cycle, or establish a release.

The Evolution page now reads the gateway candidate inbox independently of
the durable cycle root. `ARE_COMPANION_EVOLUTION_SIGNAL_LOG` must explicitly
name the same absolute private log configured for the gateway. The Node
observer reads no writer state, rejects missing, torn, non-checkpointed or
oversized evidence, verifies the Reasoning State ledger and Improvement Signal
records, and returns at most 16 content-free kind/digest rows plus a count.
The Rust bridge validates the closed projection and freshness before exposing
it to the UI. The page labels these as candidates, not cycles or deployed
changes; missing signal evidence does not hide independently observed cycles.

The Evolution package passed 185 tests; the dashboard passed 10 static
structure checks; the Companion Rust bridge passed offline `cargo check`.
The 718-file Windows development closure includes both new observer files.
A native Windows fixture created one verified candidate signal. The rebuilt
unsigned NSIS package passed the extracted bundled-runtime feature check;
its matching extracted executable passed the real WebView smoke: orb render,
nonblank dashboard, all seven panels, Evolution cycle source unconfigured,
one gateway candidate visibly rendered, source separation, keyboard heading
focus, appearance persistence, and no mutation of the signal log. The panel
screenshot was visually inspected. The tested installer SHA-256 is
`edde912a951eb18d7f8aac798e7c399f63f8835163e3d51cb9df4ccea7c6d2b2`.
The installer was **not run or installed**. The smoke is a disposable fixture,
not a live gateway or current desktop-task observation.

The updated Linux development `.deb` was built in the existing Ubuntu 26.04
container with network disabled, then extracted without installation. It
bundled Node 26.8.1 and a 719-file development ARE closure (digest
`eb337929556449fc975bb3adae4f570dbd318a57a96f9691310e5f27e5f87bc4`);
the bundled `doctor --json` returned `PASS`. Package SHA-256:
`c58cd3cb9ffc0abae6d677e2bbfd90c265848f29f69ff594ad3e175c06cd3fa0`.
The package was kept in an isolated `/tmp` directory and was not installed.

An extracted WebKitGTK/WSLg container smoke opened the orb and a real 1120×760
dashboard, navigated all seven panels, and applied the Cobalt skin. The
development-only WebKit inspector then checked two separate Evolution states:
without a signal log, both candidate inbox and cycle source were `Not
configured`; with one verified isolated signal log, the candidate inbox showed
one “Semantic evaluation blocked” row while the cycle source remained `Not
configured`. The fixture log hash was unchanged after observation. The
dashboard's ten static/source tests passed. This proves bounded renderer and
source-separation behavior, not visible pixels, physical Linux pointer/drag,
normal-desktop usability, full UX/accessibility, or an executing Evolution
cycle. The inspector was enabled only inside the disposable test container.

## Open Questions

- Select private log custody and retention before live configuration.
- Run physical Linux pointer/pixel and installed-package checks, plus Windows
  empty, corrupt, stale and source-loss fixtures. The bounded Linux default
  and one-candidate paths and the one-candidate Windows path passed.
- Preserve the separate cycle/signal distinction when adding objective
  drill-down and other signal kinds.
