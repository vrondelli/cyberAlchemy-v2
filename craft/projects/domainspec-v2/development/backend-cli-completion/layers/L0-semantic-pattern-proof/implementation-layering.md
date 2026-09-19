---
title: L0 Semantic Pattern Proof Implementation Layering
status: planning-candidate
updatedAt: 2026-09-02
owner: DomainSpec v2 implementation owner
scope: capability-layer
authority_effect: none
---

# L0 Semantic Pattern Proof

## Decision and Boundary

After this layer, we know whether one formerly thin meta-type can travel from exact authored meaning through the compiled graph to deterministic TypeScript, Python, and Rust behavior through the CLI.

- Minimum working unit: Rule end to end.
- Operator outcome: author a Rule, compile it, generate all three targets, execute the shared corpus, and receive causal verification evidence.
- Risk reduced: placeholder generation may be replaced without embedded arbitrary source or generator-authored meaning.
- Main costs: baseline reconciliation, semantic IR, generic authoring, three generators, hostile tests, and independent review.
- Boundary: Query, Calculation, Mapping, Policy, runtime providers, and durability remain outside L0.

## CAV2-D65 Chain Accounting

| D65 stage | Selected predecessor or L0 output | L0 rule |
|---|---|---|
| Canonical definitions | DS-D1 Rule, DS-D8 relationships, and `CAV2-D67` Product Capability definition | Resolve exact selectors and source digests before implementation. Missing or ambiguous Rule meaning stops the DAG. |
| Product Capability | `domainspec.meta-type-semantic-enforcement` (`owner-adopted`) | Immutable selected product outcome; L0 cannot alter adoption. |
| Capability-local business ontology | `domainspec.meta-type-semantic-enforcement-ontology@1` (`owner-adopted`) | Rule must map to authored meaning, obligation set, compiled contract, native realization, observation, and conformance evidence. |
| DomainSpec v2 authored source | Rule schema/body plus positive and hostile project fixtures | Source is the only semantic author; no generator default may fill missing meaning. |
| Deterministic compiled graph and system ontology | Typed Rule IR, graph projection, applicable obligation IDs, predicates, and witnesses | Identical selected inputs must produce byte-identical graph/certificate outputs. |
| Exact implementation binding | Candidate Rule bindings for TypeScript, Python, and Rust | Any new or materially revised exact binding candidate is authored and self-validated by exactly one bounded native helper under `CA2-ROUTE-DELEGATE`; the parent independently joins it. |
| Conformance evidence | Cross-language corpus, hostile/source-sensitivity tests, clean CLI replay, independent review | Evidence remains candidate evidence and cannot grant acceptance, publication, release, deployment, or external effects. |

Immutable predecessor: `domainspec-meta-types-current-implemented@10`, digest `bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda`. It is verified, never regenerated or rewritten.

## Included Scope

- B00 freezes the exact backend denominator and selected D65 predecessor chain.
- B01 restores one reproducible validation baseline without mutating `@10`.
- B02 introduces a typed semantic IR sourced from authored bodies.
- B03 introduces deterministic generic `add <type>` authoring infrastructure.
- B04 implements Rule authoring, compilation, three native bindings, and evidence.
- Positive, invalid-shape, semantic-hostile, source-sensitivity, deterministic-replay, and cross-language equivalence cases.

## Explicitly Deferred

- The other four thin meta-types and whole-backend relationship closure.
- `domainspec run`, in-memory and durable providers, outbox relay, recovery, and production behavior.
- Lean refinement beyond preserving the current bounded formalization surface.
- Baseline successor selection, acceptance, publication, release, or deployment.

## Exit Evidence

- Every node in `execution-dag.json` reaches `passed` or an explicitly causal `not_evaluable`; no required node is omitted.
- Rule behavior changes when exact source semantics change, and malformed or semantically incomplete Rule input fails before generation.
- TypeScript, Python, and Rust agree on every selected positive and hostile result.
- Repeated compilation/generation from identical inputs is byte-identical.
- The documented CLI root performs the entire Rule vertical without hidden skips or cancelled tests.
- One independent read-only review checks the exact candidate postimage after the implementation helper is closed.

## Promotion Decision

- Continue to L1 when Rule supplies a reusable typed IR and authoring/generation pattern while all L0 exit evidence passes.
- Pivot when the Rule pattern requires type-specific embedded source or generator-authored semantics.
- Stop when selected definitions, capability, ontology, or authored source do not determine one executable Rule meaning.

## Working DAG

- Machine form: `execution-dag.json`
- Human execution guide: `execution-dag.md`
- Terminal node: `L0-EXIT-01`
