---
title: KEP Hosted Devnet VPS Deployment Implementation Layering
status: draft-candidate
updatedAt: 2026-09-03
owner: Future hosted Devnet deployment and evidence owner
scope: infrastructure
---

# KEP Hosted Devnet VPS Deployment Implementation Layering

This model applies the co-op engine's isolated VPS release pattern to the hosted
Knowledge Exchange Protocol without treating deployment evidence as product
acceptance or production readiness.

## Context

- Target: `CA2-CAP-HOST-DEVNET-KNOWLEDGE-EXCHANGE` VPS realization.
- Current state: protocol kernel accepted and locally conformant; hosted UI and
  deployment binding not accepted; deployment system-ontology selector absent.
- Primary operator: future hosted Devnet deployment and evidence owner.
- Primary constraint: preserve client-held secrets and fail closed around every
  remote effect.
- Sources: hosted definitions `KEP-HOST-D1` and `KEP-HOST-D6`, adopted Product
  Capability, admitted hosted system ontology, ORODI deployment-transition
  model, and `projects/co-op-engine/infra/deploy-static-vps.sh`.

## Layering Method

Each layer ends at the smallest evidence-bearing decision. Later layers preserve
Devnet-only operation, ciphertext-only persistence, client-held private keys,
no hosted transaction signer, and originator-preserving co-ownership.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Outcome | Main risk reduced | Promotion |
| --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether one isolated VPS can serve the UI and API against durable PostgreSQL on public Devnet. | One image, one database, one Traefik route, staged swap, health observation and rollback. | Two users can reach the disposable hosted workbench. | Packaging and host-integration uncertainty. | Continue only after exact deployment authorization and observed HTTPS health. |
| L1 | After this layer, we know whether releases and encrypted off-host recovery are repeatable. | Immutable image identity, scheduled backup, disposable restore drill and receipt. | Operator can recover ciphertext state without the primary VPS. | Single-host loss and manual-release error. | Continue after restore evidence matches backup identity. |
| L2 | After this layer, we know whether degraded dependencies fail safely and are observable. | Alerts, RPC degradation tests, bounded log retention and rollback exercise. | Operators can distinguish denial, dependency failure and unhealthy state. | Silent failure and unsafe continuation. | Continue after ORODI commissioning evidence. |
| L3 | After this layer, we know whether a limited external pilot is supportable. | Separate pilot identities, operating policy, support window and incident process. | A bounded third party can test the protocol. | Pilot coordination and operational ownership. | Pilot, narrow, or stop. |

## Layer 0 - Minimum Working Unit

Included: a UI-enabled Rust binary, immutable local image build, PostgreSQL,
private backend network, existing Traefik edge, exact remote directory,
preflight, staged configuration, rollback snapshot, internal health check and
public HTTPS observation.

Deferred: Mainnet, paid RPC, production claims, high availability, horizontal
scale, automatic production restore, customer material, marketplace economics,
and any server-held wallet or encryption secret.

Exit evidence: validator PASS, accepted exact hosted deployment binding, exact
deployment authorization, image digest, remote pre-state, Compose health, HTTPS
`/health`, root-page response, and rollback/teardown observation.

## Non-Regression Guardrails

- The protocol-only accepted material remains byte-identical.
- The service never receives wallet secrets, encryption private keys, content
  keys, or plaintext.
- The server observes finalized Devnet state but never signs or submits Solana
  transactions.
- PostgreSQL is not exposed on a host port.
- Every remote execution requires a separate exact authorization token and
  stops after an ambiguous effect.

## Open Decisions

- Admit a KEP-specific deployment transition into the hosted system ontology.
- Accept the exact UI-and-deployment implementation binding after two stable
  validations.
- Select the final DNS record and independent encrypted backup destination.
