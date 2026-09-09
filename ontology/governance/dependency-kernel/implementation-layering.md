---
title: Governance Dependency Kernel Implementation Layering
status: selected-candidate
updatedAt: 2026-08-31
owner: CyberAlchemy v2 governance-model owner
scope: governance validation system
---

# Governance Dependency Kernel Implementation Layering

## Context

- Target: selector-level governance dependency validation and bounded enforcement.
- Current state: the whole-epoch Python ontology gate is suspended; a no-effect Rust interpreter exists only as a development example.
- Primary operator: repository work owner and agent-routing integration owner.
- Primary constraint: unrelated ontology changes must not block work, while stale or ambiguous selected meaning remains fail-closed.
- Source references: governance `identity-policy.json`, CAV2-D54, CAV2-D58, CAV2-D65, the Governance Product rule `GOV-RULE-HASHES-NOT-LIFECYCLE-CLOCKS`, and owner selection `CA2-DEC-GOVERNANCE-DEPENDENCY-KERNEL-001`.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Outcome | Promotion decision |
| --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether a Rust program can distinguish relevant, irrelevant, and indeterminate drift deterministically. | Validate one JSON program and request, close explicit dependency edges, read bounded selectors, and emit a no-effect verdict. | Operator receives PASS, CANDIDATE, BLOCK, or NOT_EVALUABLE with exact dependency evidence. | Continue when two-run bytes and hostile relevance tests pass. |
| L1 | After this layer, we know whether candidate construction and exact program selection remain safe across repeated local use. | Add exact candidate-input selection, program identity, owner-selection binding, and stable receipts. | Expected relevant drift can become a non-active candidate instead of blocking construction. | Continue when candidate mode cannot activate or weaken admitted-use behavior. |
| L2 | After this layer, we know whether durable crash-safe evidence can support review and activation decisions. | Append-only content-addressed program, request, dependency, and evaluation storage with atomic publication. | Reviews survive process interruption without rewriting history. | Continue when crash, replay, and immutability tests pass. |
| L3 | After this layer, we know whether one exact routing integration can enforce an owner-selected program. | Rust adapter requiring an immutable activation binding over program, kernel, scope, and route digests. | Only the selected surface maps a kernel verdict to a bounded stop/continue effect. | Activate only through a separate exact owner decision and conformance review. |

## Non-Regression Guardrails

- Unselected dependency drift never blocks a request.
- Missing, duplicate, cyclic, path-escaping, or ambiguous selected dependencies return NOT_EVALUABLE.
- Admitted-use mode blocks any selected digest drift.
- Candidate-construction mode requires the request to name the exact observed digest and never returns an active allow.
- Kernel evaluation never grants authority, adopts governance, changes files, or activates an enforcement binding.
- Every later layer preserves deterministic evaluation and the distinction between evidence, selection, activation, and effect.

## Recommended Layer

Implement L0 and L1 together because exact candidate-input selection is required to construct the kernel without recreating the suspended gate's self-hosting deadlock. Durable storage and routing activation remain deferred to L2 and L3.
