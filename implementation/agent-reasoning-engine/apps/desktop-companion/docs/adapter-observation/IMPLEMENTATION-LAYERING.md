# Adapter observation: implementation layering

Status: candidate planning lens, 2026-09-26. Target: read-only live adapter
observability in ARE Companion. Source: [analysis](IMPLEMENTATION-ANALYSIS.md)
and [UX brief](../ux/ADAPTERS.md). No layer is claimed complete.

| Layer | Decision unlocked | Minimum working unit and included scope | Deferred scope | Exit evidence |
| --- | --- | --- | --- | --- |
| L0 — truthful projection | After this layer, we know whether gateway state can be reduced to a safe, non-effectful adapter snapshot. | Versioned schema, pure allowlist projector, fixture-backed per-link state rules; no live IPC or UI. | Discovery, transport, OS integration. | Tests show correct states for no session, initialized backend, failed/stale session, and no private fields. A projection call creates no session or backend. |
| L1 — functional Linux prototype | After this layer, we know whether the UI explains adapter state and a development-only Linux gateway can be observed without altering it. | Fixture-backed Adapters UI first; then a fixed read command and local gateway observation endpoint in an isolated, same-user test harness. Minimum bounds: explicit endpoint, private local access, fixed schema, no effectful RPC, timeout/output cap, no credentials or raw session data in the renderer. | Full threat model, adversarial access tests, Windows support, packaging, MCP/hook proof. | UI normal/empty/error checks; test-harness live probe changes no session/backend/store counts; timeout and stale-state checks. Not enabled as a packaged general-purpose service. |
| L2 — functional portability | After this layer, we know whether the prototype also behaves on Windows and through failures. | Native Windows development-harness transport, reconnect/restart handling, packaged-resource *dry-run* checks, browser isolation and resource measurements. | Full security hardening, installed-product claim, macOS, signing/updater, broader optional adapters. | Native Windows fixture/live harness checks, Linux regression, bounded idle CPU/memory evidence. No cross-user/security or installer-readiness claim. |
| L3 — security and package gate | After this layer, we know whether the finished observation path can safely be enabled and packaged. | Final threat/privacy review, OS access-control and unauthorized-client tests, redaction/replay proof, then exact package closure and installed Linux/Windows smoke, rollback/uninstall and freshness evidence. | Candidate freeze, deployment, product approval and release. | Security tests pass before package enablement; repeatable installed-product evidence follows. Exact freeze remains a separately authorized future action. |

Layer promotion requires the previous layer's evidence. L0 does not justify
“connected”; L1 does not justify Windows support or packaged enablement; L2
does not justify deployment. The next product-construction frontier is **L0**.
Full security hardening is deliberately last at L3, after functional evidence.
The narrow L1 development harness still requires a private local boundary and
bounded, non-effectful reads; if those cannot be guaranteed, use fixtures only
until L3. Signing, updater, and future macOS support are operational residue.

## Open Questions

- Does the product owner want L1 to show aggregate active-session counts, or
  only the selected path and its coarse connection state?
- Which OS/version matrix and numerical idle-resource budgets govern L2/L3?
