# Hosted Rejoin observation — 2026-10-01

Status: implemented and tested as a read-only managed-client candidate. No
installation, release promotion, or control of the current Codex desktop task
is claimed. The TUI is discontinued and is not an interface or fallback.

## Boundary

The hosted client exposes one loopback-only `/api/observation/rejoin` read with
a distinct token. Its token cannot authenticate the control API. Requests use
up to 32 hashed `backend-thread:` references; responses contain only owned
hashed references, bounded status, typed reason, and observation time. The
managed launcher gives this scoped token and URL to Companion, not the hosted
client's browser/control token. A missing or failed read leaves Rejoin
eligibility unclaimed. A ready preflight still requires explicit native Rejoin;
it does not authorize Send. Gateway Reasoning State remains a separate source.

Implementation: [hosted client](../../../packages/codex-app-server-wrapper/src/windows-client-host.mjs),
[scoped reader](../../../packages/codex-app-server-wrapper/src/hosted-rejoin-observation-client.mjs),
[managed launcher](../../../packages/codex-app-server-wrapper/bin/are-managed-session.mjs),
[Companion command](../src-tauri/src/main.rs), and
[Threads view](../ui/dashboard.html).

## Validation

- Windows-client host suite: 85/85, including read-only token isolation,
  content-free payload, Rejoin-ready and rejoined states, and observer denial
  at `/api/state`.
- Companion dashboard suite: 52/52. Rust `cargo check --offline` passed.
- Linux current-source and extracted `.deb` managed smokes passed: native orb,
  seven-panel dashboard, gateway/backend/client path, zero-row hosted Rejoin
  line, and supervised stop. The package was extracted, not installed.
- Linux unsigned development package:
  `dist/are-companion_0.1.0_amd64-hosted-rejoin-20261001.deb`, SHA-256
  `c758970b6d58c8c3992cad513f84421c34b86c3379a6f6b0bc0571e2b1f83c7e`.
- Windows unsigned NSIS package:
  `D:\are-win-focus-YDTVzk\ARE_Companion_hosted_rejoin_20261001_x64-setup.exe`,
  SHA-256 `e32bb83e6617eca41b50fead321f3402b1b44c53b78e0e441223a9186be608fe`.
  7-Zip integrity passed (825 files); extracted bundled Node reported ARE
  product-health PASS. Extracted WebView2 dashboard-only, connected seven-panel
  journey, baseline managed orb, and guarded one-turn managed fixture passed.
  The fixture used one loopback-only model response, zero external model calls,
  and showed one gateway completion frontier with one separately hosted-owned
  thread row. The setup was neither installed nor executed.

## Claim ceiling

These checks establish a scoped Rejoin observation path for a managed hosted
client and current Linux/Windows development packages. They do not establish
exclusive writer handover, attachment to this desktop chat, release admission,
signed installers, or general deployment readiness. The Windows unguarded
baseline keeps model ingress paused; the guarded fixture is a candidate path.

## Open Questions

- What exact host-supported handover evidence would allow ARE to become the
  exclusive writer of this already-running Codex desktop task? No such proof is
  available from this observation channel.
- Should a future cross-OS observer that is not launched by the managed hosted
  client receive a separate Rejoin observation? It currently has no scoped
  hosted-client token and correctly shows this source as unconfigured.
- What release gate will sign, install, and validate these packages on target
  OS environments? Neither development package has crossed that gate.
