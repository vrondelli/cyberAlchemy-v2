---
title: L4 Formal and Independent Assurance Implementation Layering
status: planning-candidate
updatedAt: 2026-09-02
owner: DomainSpec v2 implementation owner
scope: capability-layer
authority_effect: none
---

# L4 Formal and Independent Assurance

## Decision and Boundary

After this layer, we know whether the compiled-graph, formal projection, generated bindings, and runtime observations support independent, non-inflating assurance claims.

- Minimum working unit: canonical checked interchange, independent Lean decoding, refinement theorems, omission mutants, pinned clean proof execution, and independent consumer evidence.
- Operator outcome: inspect a certificate whose claims are tied to exact source, graph, binding, and observation identities.
- Risk reduced: proving a fixture or projection while claiming the TypeScript compiler, generated targets, or runtime are universally covered.
- Main costs: checked interchange design, independent Lean decoder and theorems, omission mutants, pinned proof tooling, and independent consumer evidence.
- Boundary: acceptance, release, deployment, and production authorization remain separate owner decisions.

## CAV2-D65 Chain Accounting

| D65 stage | L4 requirement |
|---|---|
| Canonical definitions | Freeze theorem statements against exact DS-D1/DS-D8 and evidence-definition selectors. |
| Product Capability | Reuse the adopted formal-projection and conformance scope without inflating theorem conclusions. |
| Business ontology | Preserve the distinction among compiled contract, realization, observation, and conformance evidence. |
| Authored source | Bind every checked interchange payload to the exact authored-source manifest digest. |
| Compiled graph/system ontology | Define and independently decode the canonical checked graph; prove node, edge, source, and obligation preservation. |
| Exact implementation binding | Bind the TypeScript projection/compiler and each selected native provider to explicit refinement or equivalence evidence under the one-helper candidate rule. |
| Conformance evidence | Lean proof, omission mutants, clean pinned toolchain, EVF/BTE evidence, independent target, and runtime parity. |

The admitted `formalize` surface is `candidate.3`; its admission does not itself prove semantic preservation. Baseline `@10` remains immutable.

## Work and Deferral

- F01 → F02 → F03 → F04 → F05 may begin after B13.
- F06 begins after B15; F07 joins F05 and F06; F08 waits for R16.
- Defer theorem claims not encoded by the checked interchange and every release/production effect.

## Exit Evidence and Promotion

- Omission or substitution of a node, edge, source identity, obligation, predicate, or witness is rejected.
- Lean checks under one pinned clean toolchain.
- Independent consumer behavior detects semantic mutants beyond provenance markers.
- Report each proof’s exact proposition and claim ceiling; no L4 result authorizes release.
