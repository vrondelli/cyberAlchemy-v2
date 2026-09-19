---
module: stable-foundation-cli
version: candidate-1
status: plan-authored
updatedAt: 2026-08-16
docType: implementation-layering
---

# Implementation layering — Stable Foundation CLI

## Boundary heuristic

Each layer stops when the next work item answers a different decision more
efficiently than it strengthens the current one. Later layers preserve every
earlier accepted invariant.

## Layer decisions

| Layer | Decision question | Minimum working unit | Included | Deferred | Exit evidence | Promotion |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether the selected contract can be represented and fail closed without authority collapse. | closed foundation contract validator; explicit project-root/P2 source binding; separate receipt and diagnostic decoders | SWU 001–006 | supported command implementation, package migration, campaigns | killed contract/root/profile/schema/causal mutants | promote only if every closed contract has a stable negative |
| L1 | After this layer, we know whether the two commands run repeatably as compiled JavaScript on the pinned runtime. | `lint` and `receipt`, atomic result channels, npm one-lock build, two-root artifact equality | SWU 007–010 | full security/resource/compatibility/operator evidence | command/no-write/partial-output tests and clean-root build receipt | promote only on deterministic equal bytes |
| L2 | After this layer, we know whether dependency, privacy, resource, version, and invalidation boundaries fail closed. | script/dependency audit, redaction/no-network proof, limit campaign, N-1 decoder | SWU 011–016 | release archive/recovery and pilot | security/resource/compatibility receipts with killed mutants | promote only if no accepted contract is weakened |
| L3 | After this layer, we know whether the exact private candidate is reconstructable, recoverable, and operable enough to request a release decision. | immutable candidate/archive drill, acceptance freeze, independent green/red pilot and support handoff | SWU 017–020 | complete July product, release authorization, deployment | candidate manifest, invalidation proof, operator/verifier receipts | request owner decision; never auto-release |

## Non-regression guardrails

- L1 cannot weaken L0 closed decoding, explicit-root, or authority-none behavior.
- L2 cannot replace deterministic results with best-effort diagnostics or ambient state.
- L3 cannot rewrite historical receipts, bypass profile/conformance owners, or turn
  a candidate receipt into release authority.
- Resource/security/compatibility failures stop; they are not waived to preserve schedule.
- The supported command remains read-only at every layer.

## Value/cost rationale

L0 is intentionally contract-first and dependency-free so the first mutation is
small and reversible. L1 introduces build/package risk only after the interface can
reject drift. L2 invests in adversarial and boundary campaigns after a runnable
artifact exists. L3 spends coordination cost only after deterministic technical
evidence is available.

## Recommended next layer

- Next layer: L0.
- First unit: `SWU-SFC-001`.
- Decision unlocked: whether one machine-readable contract can bind SF-01..SF-21
  and reject an independently mutated branch without touching current product/profile bytes.
- Major deferral: actual product/release authorization and the complete July `0.1.0` system.

