---
title: DSH and ARE Integration Implementation Layering
status: implemented-local-boundaries-external-gates-open
updatedAt: 2026-09-25
owner: CyberAlchemy v2 product owner
scope: capability
---

# DSH and ARE Integration Implementation Layering

This document defines the progressive implementation and promotion path for using DeepSeek Harness (DSH) as an ARE backend and exposing that backend to desktop and hosted clients.

## Context

- Target: one ARE routing, context, consequence, and continuity path with selectable Codex or DSH execution.
- Current state: the local successor-candidate path is implemented and tested; remote website adoption and deployment are not evidenced.
- Primary operator: CyberAlchemy developers and the ARE website operator.
- Primary constraint: preserve repository authority and frozen Candidate 020 evidence while preventing hosted clients or backend overlays from widening effects.
- Source references: `agent-routing/routes.json`, `packages/request-decision-router`, `packages/codex-app-server-wrapper`, and `packages/dsh-gateway-backend-adapter`.

## Layering Method

- L0 proves a backend-neutral ARE gateway turn through DSH.
- Each later layer answers one operational question and preserves all earlier fail-closed properties.
- Promotion depends on test or deployment evidence, not implementation presence alone.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Outcome | Main risk reduced | Promotion state |
| --- | --- | --- | --- | --- | --- |
| L0 | Can ARE route context through the existing gateway into DSH? | Selectable DSH adapter plus loopback provider canary | One bounded end-to-end turn | Semantic integration failure | Passed locally |
| L1 | Does the adapter survive realistic multi-turn and restart behavior? | Bounded history, durable thread state, resume, streaming, diagnostics | Repeatable local conversations | Lost continuity and opaque failure | Passed locally |
| L2 | Are routing and hosted boundaries fail-closed? | Posture-aware routing, confined sources/cwd, overlay closure, quotas, TLS/origin/embed controls | Governed local/host-ready surface | Inference override, file escape, capability widening | Passed locally; TLS needs deployment evidence |
| L3 | Is website adoption and public operation credible? | Exact private-branch merge, tenant identity, secret custody, TLS edge, CSP/origin configuration, abuse controls, rollback | Pilot-ready ARE website integration | Cross-tenant and deployment risk | Externally gated |

## Capability Progression

| Capability | L0 | L1 | L2 | L3 |
| --- | --- | --- | --- | --- |
| Backend selection | `codex` or `dsh` | Stable adapter identity | Backend-specific readiness | Deployment policy binding |
| Context | ARE `additionalContext` delivered | Context plus bounded history | Repository paths confined | Compiled context bundle promoted and signed |
| Continuity | Process-local thread | Durable per-thread state and `thread/resume` | Bounded state and active-turn quotas | Tenant-scoped durable store and retention policy |
| Capability safety | Stock tools disabled | Timeout and process-tree cancellation | Provider-only overlay IDs and zero-effect protocol | OS/container isolation and deployment attestation |
| Transport | Unix gateway | Streaming JSON-RPC lifecycle | TLS-required public bind, bearer auth, exact origin/CSP frame allowlists | Website branch integration and live acceptance |
| Observability | Turn status | Correlated digest-only private diagnostics and adapter telemetry | Bounded output and latency records | Central metrics, quota/usage accounting, alerting |

## Implementation DAG

```text
R0 immutable repository policy bundle
 ├─ R1 posture-aware routing
 ├─ R2 structured route/effect enforcement
 └─ C0 confined context-source loader

D0 selectable DSH backend
 ├─ D1 ARE context delivery
 ├─ D2 closed provider-overlay boundary
 ├─ D3 timeout/process-tree/output/concurrency bounds
 ├─ D4 streamed lifecycle + correlated diagnostics
 └─ D5 durable thread state + resume

R1 + C0 + D1 + D2 + D3 + D4 + D5
 └─ H0 authenticated browser host
     ├─ H1 TLS required for non-loopback
     ├─ H2 exact Origin allowlist
     └─ H3 explicit CSP frame-ancestor allowlist
         └─ X0 private website branch adoption
             └─ X1 tenant/secret/quota/retention deployment
                 └─ X2 live rollback-tested pilot
```

`R0`, `R1`, `C0`, `D0` through `D5`, and `H0` through `H3` are implemented in this working tree. `R2` is partially implemented: no-write ceilings are machine-enforced, but the registry's richer natural-language ceilings and blockers still require a structured policy migration. `X0` through `X2` require authenticated access to the exact website branch and a deployment target.

## Implementation Waves

| Wave | Layer | Implemented artifacts | Verification / exit evidence |
| --- | --- | --- | --- |
| W0 | L0 | policy bundle, backend registry, context delivery, product component | router suite, adapter gateway test, loopback DSH canary |
| W1 | L1 | streamed deltas, durable state files, resume, telemetry, diagnostic digests | adapter restart and stream tests |
| W2 | L2 | inferred-objective non-selection, source confinement, provider-only overlay schema, concurrency, TLS/origin/CSP controls | router, wrapper, host, and adapter tests |
| W3 | L3 | website merge, deployment configuration, tenant controls, acceptance and rollback evidence | blocked until exact branch and target are accessible |

## Non-Regression Guardrails

- Candidate 020 evidence stays immutable; this work is successor-candidate material.
- An inferred objective never suppresses conflicting explicit user text.
- DSH receives no effect capability through the ARE protocol; custom provider overlays cannot add plugin IDs.
- Repository context bindings and DSH working directories cannot escape their configured roots.
- Non-loopback browser hosting requires TLS and an explicit Origin allowlist.
- Enabling iframe embedding requires an explicit CSP `frame-ancestors` list; the default remains non-embeddable.
- Private diagnostic text never crosses to the browser; only byte counts, digests, status, and correlation IDs do.

## Explicitly Deferred and Blocked

- Consolidating every route policy field into one authoring representation requires an authority-schema migration, registry validation changes, profile regeneration, and a new policy bundle. The current immutable runtime bundle prevents live source drift, but authoring duplication remains.
- Natural-language write ceilings and blockers must become structured allowed/blocked effect classes before ARE can enforce every route-specific sentence mechanically.
- The exact `feat/hosted-dsh-iframe` branch could not be authenticated from this checkout, so no claim is made that its components, routes, or deployment files were merged.
- TLS key custody, tenant authentication, provider-secret isolation, durable usage accounting, rate limiting, OS/container isolation, production monitoring, and rollback rehearsal require the actual hosting environment.

## Promotion Decisions

- Continue to L3 only after the exact website branch is locally available and its base commit is known.
- Pivot if the website already owns a different authenticated streaming contract; adapt that contract to the ARE gateway rather than adding a parallel reasoning path.
- Stop public exposure if TLS, exact Origin/CSP policy, tenant-scoped credentials, quotas, or rollback evidence are missing.

## Open Questions

- Which identity provider and tenant key will bind website users to gateway sessions?
- Which deployment owns TLS termination, rate limiting, audit retention, and provider-secret rotation?
- Should the remaining route-policy migration amend `agent-routing/routes.json`, or introduce a separately governed repository policy source compiled into the same immutable bundle?
- What signed release process promotes this successor candidate beyond frozen Candidate 020?
