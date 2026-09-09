# Exact-Binding Evidence Closure

**Contract:** `exact-binding`  
**Handoff verdict:** `ready`  
**Meaning:** every required positive row is bound, deferred, or killed. This is a writer-readiness result only; it grants no architecture, implementation, adoption, conformance, security, performance, publication, deployment, or effect authority.

## Closure matrix

| ID | Claim or fixture | Immutable source identity and exact selector | Explorer/reviewer return | Evidence scope | Proof status | Disposition |
|---|---|---|---|---|---|---|
| ECB-001 | CyberAlchemy-v2 meaning/effect authority and ARE reasoning/context ownership must remain separate | `README.md` SHA `5434e26b…`, lines 6–140; `design/ARCHITECTURE.md` SHA `1958758a…`, lines 46–162 | Shannon §§Working runtime, Ownership; Wiener CR-020/021; Lakatos PASS | Current local source meaning and candidate architecture | observed | **bound** |
| ECB-002 | Existing Context Envelope, Reasoning State, gateway, and continuation are extend-owned candidates rather than dependencies to adopt | `context-envelope.mjs` SHA `93c98f54…`, lines 41–243; `reasoning-state-runtime/index.mjs` SHA `22d9e270…`, lines 94–135, 207–316, 543–806; `gateway.mjs` SHA `6ea479d6…`, lines 51–290; `continuation.mjs` SHA `a1391040…`, lines 68–145 | Shannon §§Reuse/extend, Exact sources; Wiener revised CR-021/Component disposition; Lakatos REPAIR | Current source mechanisms and ownership only | observed | **bound** |
| ECB-003 | Current ARE conformance and current performance fitness | `implementation-binding.v2.json` SHA `e0efea7a…`; historical assessment SHA `30a4f2e5…`; historical canary SHA `1c93f930…`; reported 15-file drift | Shannon §§Measured evidence, Drift; Wiener CR-003; Popper BLOCK | Historical candidate evidence over different bytes | unverified for current bytes | **deferred** pending exact-current-byte replay |
| ECB-004 | The minimal coding-loop relation is positive precedent, but mini-swe-agent must not own ARE state, authority, or production sandboxing | `SWE-agent/mini-swe-agent@a83fcae82d2a08f0ee0c688f9d137b3566c097f8`; `default.py:88-190`, `__init__.py:43-80`, `local.py:24-30,72-92`, `interactive.py:124-181` | Nyquist §§What v2 is, Disposition, Security; Wiener CR-011; Lakatos PASS | Upstream source behavior at v2.4.6 | observed in source, not executed locally | **bound** as precedent; production adoption **killed** |
| ECB-005 | The published 76.8% result binds mini-swe-agent 2.0.0 and its exact model/config, not v2.4.6 or this runtime | `SWE-bench/swe-bench.github.io@193160a463a435d05cf44a1fa9dc5eac832113c3`, `data/leaderboards.json` mini-swe row | Nyquist §Performance; Wiener CR-004; Lakatos PASS | Published benchmark artifact only | observed | **bound** with narrow ceiling |
| ECB-006 | BAML v0 supplies compiler/generated clients, JSONish parsing, streaming, retries, tests, and ephemeral tracing | `BoundaryML/baml@da2a673b52dceea8bc592462ab3b0ba2d965f65e`; `engine/Cargo.toml:1-26,191-196`; `generator.rs:13-37`; `jsonish/README.md:5-24`; `retry_policy.rs:31-60`; `fallback.rs:68-94`; `events.rs:15-33,100-164`; `storage.rs:31-51,76-93` | Turing §§What v0 provides; Wiener Evidence/Disposition | Pinned upstream v0.225.0 source behavior | observed in source, not executed locally | **bound** |
| ECB-007 | BAML modular request/parse is suitable and performant as the ARE/App Server seam | Live modular API documentation is not pinned to the v0.225.0 source selector; no local distribution exists | Turing §§Hot-loop, Performance; Wiener revised CR-085; Lakatos REPAIR; Popper BLOCK | Candidate integration fitness | unverified | **deferred**; BAML is benchmark-only |
| ECB-008 | Current gateway reconnect is authenticated, durable, and exactly-once | `gateway.mjs` SHA `6ea479d6…`, lines 51–290; `rpc-client.mjs` SHA `9e505e5d…`, lines 180–235 | Shannon §Missing obligations; Taleb verified threats; Wiener CR-063 | Current same-process transport | observed counterevidence | **killed** as current capability claim |
| ECB-009 | Candidate safe continuity needs default-deny credentials, persisted cursor/acks, domain-separated actions, immutable capability approvals, authenticated results, and fail-closed ambiguity | Same local gateway/RPC selectors as ECB-008; mini-swe `local.py` and `docker.py` exact selectors in `research.md`; Taleb repair list | Taleb §§Threats/repairs; Wiener revised CR-030/050/060–073 | Design requirements inferred from counterexamples | unverified as implementation | **bound** as candidate obligations only |
| ECB-010 | “Ferrari” latency targets and traceability/safety preservation | Historical context p95 `94.26293 ms`; canary event stream lacks duration/token/byte distributions; BAML and mini-swe upstream lack applicable distributions | Popper full verdict; Wiener CR-005/075/080–085 | Current combined-runtime fitness | unverified | **killed** as present claim; **deferred** as benchmark target |
| ECB-011 | Four-way benchmark and chaos suite is reproducible enough to falsify the candidate | Wiener revised CR-080–085; Popper required contract; exact variants/controls/run counts/metrics/mutants stated in `synthesis-revised.md` | Popper §Required contract; Wiener §§Four-variant benchmark | Prospective experiment specification | unverified until run | **bound** as a candidate fixture specification |
| ECB-012 | New coordinator, result ledger, or sandbox owner is necessary and non-duplicative | `design/ARCHITECTURE.md` SHA `1958758a…`, lines 46–162; ownership mapping in Wiener revised CR-022 | Lakatos REPAIR; Wiener CR-022/091 | Owner and component-boundary question | unverified | **deferred** to explicit owner mapping/decision |

## Closure checks

- Exact local and upstream identities are present for every source-positive row.
- Each positive row names source-local selectors, return provenance, evidence scope, and proof status.
- The BAML modular seam, current conformance, current performance, authenticated reconnect, and new-owner necessity are not presented as closed facts.
- Reviewer counterevidence remains visible; no negative result was converted into an architecture recommendation.
- No explorer feedback is required: missing BAML pinned modular-API proof and current runtime measurements are future empirical work, not evidence that can be repaired inside this read-only dispatch.
- The writer may proceed only if it preserves every `deferred` and `killed` disposition and the claim ceiling above.

## Residue

- `inventory_lookup_readiness_blocked_and_diagnostic_count_drifted`
- `current_are_exact_byte_conformance_not_evaluable`
- `baml_modular_api_pinned_source_binding_missing`
- `four_variant_benchmark_not_run`
- `authenticated_durable_reconnect_not_witnessed`
- `participating_kernel_atomic_effect_result_not_witnessed`
- `sandbox_enforcement_owner_unselected`
- `new_component_non_duplication_unproved`
- `all_ferrari_safety_traceability_and_production_fitness_claims_not_evaluable`
