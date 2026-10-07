# Linux Evolution phase view — native candidate check

Status: development evidence, 2026-10-03. No installer was installed, no live
Evolution root or worker was touched, and no desktop task was handed to ARE.

The current Evolution observer now projects at most eight verified coordination
phases in canonical order. Each row includes a phase label, an already-visible
cycle reference when available, five work-state counts, and a recorded event
count. It omits task and worker identifiers and does not interpret a durable
lease as worker liveness. The Companion bridge validates the bounds and the
dashboard shows the rows under the existing verified-ledger heading.

The final unsigned [Linux package](../dist/are-companion_0.1.0_amd64-phaseview-guard-20261003.deb)
has SHA-256 `1ab4f453e8e5eb6d9499a4b0343c76d18e7794d65ebe80755abe744d77cce528`.
Its extracted executable and resources were mounted read-only in the existing
Linux builder image with no network, an isolated home, and a test-only WebKit
inspector. The disposable two-commit coordination fixture reported one
`construction` phase with one planned and one leased item; no private task or
worker ID appeared in the observer response. This final package includes the
additional bridge/dashboard guard that reconciles per-phase counts against
the aggregate and accepts the source protocol's full 256-character phase
identifier bound.

The native WebKitGTK dashboard passed 1120 × 760 to 340 × 740 resize, no
horizontal overflow, seven-panel bridge loading, and the verified per-phase
row at the actual 340 × 740 viewport. A separate registry-only run passed the
same narrow layout without fabricating coordination evidence. Source checks:
Evolution durable-kernel suite 22 passed and 2 Windows-only skipped; dashboard
suite 64 passed; Linux Rust bridge `cargo check --offline` passed. The wider
Evolution suite has eight pre-existing H-EN benchmark failures from a declared
source-byte drift in the untracked
`development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/BENCHMARK-EVOLUTION-WORKFLOW.md`;
this phase-view change did not refresh that benchmark manifest.

Windows-native requalification of this new source did not run: WSL interop
failed before `node.exe` or `cmd.exe` could start with
`UtilAcceptVsock:273: accept4 failed 110`. The previous Windows installer
therefore remains evidence for the earlier source only. The Linux package is
uninstalled; physical pointer, screen-reader, long-duration, and worker
liveness checks are still open.

## Open Questions

- Which source-owned, authenticated heartbeat could ever justify a *current*
  Evolution worker state, distinct from a recorded lease?
- Should the future objective drill-down expose more than this bounded phase
  summary, and under which privacy rule?
- When Windows interop is healthy, does the rebuilt native WebView2 package
  render these same rows and retain narrow-window accessibility?
