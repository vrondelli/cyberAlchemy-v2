# Adapter observation plan review

Status: self-review of the [candidate work-pack](WORK-PACK.md), 2026-09-26.
Review scope: source fidelity, causal order, effect/privacy boundaries,
portability, tests, and execution readiness. This is not an independent
subagent review or product-owner approval.

## Verdict

**Usable as a construction roadmap; blocked as an executable work-pack.** The
L0 projector is a coherent smallest proof. Per the user's sequencing decision,
full security hardening is now the final gate before package enablement, not a
prerequisite for fixture UI or private development-harness work. A separate
bounded implementation request and task-local write scopes are still needed.

## Findings and resolution

| Finding | Severity | Review result |
| --- | --- | --- |
| Normal gateway connect is effectful: it can create a session and spawn Codex/DSH. A “ping by connect” would violate read-only scope. | Critical | Plan requires a separate observation path and a test proving no session, child, or store mutation. [Source](../../../../packages/codex-app-server-wrapper/src/gateway.mjs). |
| Gateway `inspect()` contains consumer/session internals and its call prunes expirations; passing it through to Companion would be a privacy and effect-boundary error. | Critical | Plan inserts a pure, allowlisted projector with negative-field assertions. Observation cannot call raw `inspect()` merely to render. [Source](../../../../packages/codex-app-server-wrapper/src/gateway.mjs). |
| “Configured” was at risk of implying a selected backend when the gateway is offline. | High | Analysis now separates explicit endpoint configuration from live gateway-verified adapter identity. Offline adapter identity is unverified. |
| “Ready” was at risk of surviving a backend crash after initialization. | High | Plan now requires both successful initialization and a currently alive child; no global readiness claim with zero sessions. |
| A historical receipt or replayed response could be mistaken for current liveness. | High | Development path binds a fresh nonce and runtime epoch to a bounded response, with stale/replay fixtures. Final adversarial proof is B. |
| Source fixtures and live/OS checks were mixed; source tests alone cannot establish a missing gateway or Windows ACL behavior. | Medium | Fixture matrix now assigns in-process states to projector tests and unavailable/schema states to CLI/UI tests; native checks remain separate L1/L2 gates. |
| Candidate freeze was bundled with validation despite separate authority. | Medium | L3 now stops at repeatable installed-product evidence; any exact freeze/release is a later owner-authorized operation. |
| The plan is high complexity but lacks split task contracts, exact file scopes, execution owners, and per-SWU commands. | Blocking for execution | Work-pack gate remains `block`; create task-local contracts and select one SWU under a later implementation route. |

## Acceptance and residue

- The revised DAG lets A/C/D and G prove the state model and interface with
  fixtures. E/F/I can then test a private same-user live path. B follows H and
  blocks J, where the endpoint would be enabled in an installer. If the basic
  private boundary fails, E/F/I stop and G remains fixture-only.
- G cannot paint a fixture as live status. It can show live status only after F
  validates a current E response. Windows functional claims wait for I;
  security and installed-product claims wait for B and J.
- Optional MCP/hook adapters are intentionally unverified in the first live
  slice; adding them requires source-owned registration/connection proof, not
  discovery from product metadata.
- The Companion must distinguish `doctor` PASS from adapter liveness, including
  after refresh failure. The current [dashboard](../../ui/dashboard.html)
  still has no Adapters panel; this review tested the plan, not that UI.
- Platform and operational owners still need exact OS matrix, ACL policy,
  privacy allowlist, freshness window, and CPU/memory limits. These decisions
  are not implied by this review.
- The generated Invoke skill package did not contain its linked `plan.md` mode
  contract, and the UX brief is candidate rather than approved design. The
  available layering/work-pack guidance shaped these candidate artifacts, but
  no formal Invoke pass or admitted execution state is claimed. Repository
  Goals validation also remains blocked for admission.

## Recommended next gate

Product/runtime owner reviews A's status schema and narrow output allowlist.
Then execute only A–D as a bounded L0 implementation slice, with exact task
files and test commands. G can proceed on fixtures. E requires only a proven
private local development harness; B's full threat/ACL review occurs after
functional completion and before J packages or enables the endpoint.

## Open Questions

- Who owns the product/runtime schema and security decision, and which exact
  aggregate fields are acceptable to expose to the local Companion?
- Which native Windows test environment can prove named-pipe ACL behavior for
  a different OS user, not merely same-process success?
