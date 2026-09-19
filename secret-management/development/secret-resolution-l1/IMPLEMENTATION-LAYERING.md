---
module: secret-management-resolution
version: candidate
status: selected-one-unit
updatedAt: 2026-08-16
docType: implementation-layering
---

# Implementation Layering: Secret Management Resolution

## Purpose

Advance the independent secret-management project by one provider-neutral,
fake-local proof without treating a local Python contract as a credential store,
backend integration, or production security boundary.

## Current Evidence

- L0 lives at `projects/secret-management` and provides opaque `SecretRef`
  identity plus redacted evidence envelopes.
- Live pre-refresh evidence on 2026-08-16 is 6/6 secret L0 tests, 7/7
  ElevenLabs static-projection tests, and 3/3 voice no-network tests.
- That evidence is candidate-local. It proves neither secret storage nor real
  authorization, encryption, provider connectivity, publication, or release.

## Layer Decision Table

| Layer | Decision Question | Smallest Working Unit | Included Scope | Deferred Scope | Exit Evidence | Promotion Decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | Can a reference cross evidence surfaces without exposing its logical identity or purpose? | `SWU-SEC-001`, already present as candidate evidence. | Opaque reference grammar, digest identity, redacted projection, no resolver imports. | Resolution, grants, material, backends, CLI, provider calls. | 6/6 local tests plus current voice zero-effect regressions. | Satisfies only the candidate dependency for L1A. |
| L1A | Can one already-issued structural grant permit exactly one fake in-memory resolution and one bounded consumption while all rejected grants make zero resolver calls? | `SWU-SEC-002A`. | Grant binding and expiry, one-shot claim, resolver protocol, internal lease, redacted result, test-owned fake. | Grant issuance/authenticity, SOPS, files, environment, subprocess, CLI, network, provider, voice integration, concurrency. | Focused matrix plus full secret and voice regression suites. | Candidate evidence only; do not infer real-backend readiness. |
| L1B | Can one approved SOPS policy implement the resolver boundary without output or identity leakage? | `SWU-SEC-002B`, blocked. | Future SOPS adapter and controlled process evidence. | CLI execution, cloud/service, migration. | Recipient/recovery/CI identity decision plus controlled adapter evidence. | Requires a separate owner decision and Task Session. |
| L1C | Can local operators inspect reference and resolver health without resolving material? | `SWU-SEC-003`, blocked. | Future redacted `describe` and `doctor`. | `get`, show, clipboard, child execution, provider calls. | CLI JSON, no-shell, no-resolution fixtures. | Requires accepted L1A and a separate selected unit. |
| L2 | Can a trusted child or named managed backend consume material under an accepted threat model? | Separate process/cloud units. | Explicit argv injection or one named service adapter. | Broad rollout and migration. | Owner-approved identity, audit, cleanup, degraded-mode, and external-effect evidence. | Separate authorization; no inheritance from L1A. |
| L3 | Can broader adoption be recovered and operated? | Separate migration/operations work. | Inventory, rotation, rollback, recovery exercise. | Other projects and organization-wide store. | Exact migration and recovery receipts. | Separate migration authority. |

## L1A Coherence Decision

Grant validation, one resolver call, and one lease consumption remain one SWU.
Separating them would remove the independently reviewable property: every denial
must stop before resolution, while one valid claim must consume material once and
clear the owned buffer. Package exports, documentation, and tests are projections
of that behavior, not child tasks.

## L1A Evidence Ceiling

- Single-process, single-threaded CPython 3.12 candidate behavior only.
- The consumer callback is explicitly trusted to perform one bounded effect. A
  malicious callback can copy material; preventing that is outside this layer.
- `ExecutionGrant` proves structural binding and one-shot use, not authenticity,
  signing, issuance policy, or distributed replay prevention.
- Python object introspection is not an access-control boundary.
- Digests are sensitive linkable metadata and are not authorization.

## Non-Regression Guardrails

- Validate backend class, reference, consumer, request, expiry, and unused grant
  state before any resolver call.
- Define freshness as `now_epoch_seconds < expires_at_epoch_seconds`; equality is
  stale.
- Mark the grant and lease claimed before invoking untrusted callback code.
- Clear the lease-owned mutable buffer in `finally` on success and failure.
- Normal results, representations, errors, and serialization surfaces expose no
  material, raw identifier, consumer identifier, request content, or mismatch.
- Keep the fake resolver test-owned and out of package exports.
- Do not add effectful imports or cross-project coupling.

## Recommended Next Layer

Execute only `SWU-SEC-002A`. On a passing terminal receipt, return no automatic
successor: L1B remains blocked on policy and L1C remains unselected.
