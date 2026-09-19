---
module: financial-settlement-executable-test-generation
version: 0.1.0
status: draft
updatedAt: 2026-07-23
docType: invoke-define
discovery: source-backed
---

# Financial Settlement Executable Test Generation

## What This Work Owns

This work connects the existing Financial Settlement DomainSpec documents to
the development BTE so every registered backend node and authored relationship
receives a runnable structural test. It does not claim that every business
behavior has an executable oracle.

The output is development-only. It does not change release, production,
admission, or public Arcanum state.

## Source Boundary

- Feature source:
  [`validation/poker-team/docs/features/financial-settlement/`](../../../../validation/poker-team/docs/features/financial-settlement/)
- Existing document derivation:
  [`test-derivation-engine/src/grammar/`](../../impl/test-derivation-engine/src/grammar/)
- Existing hybrid test emitter:
  [`emit/tests.ts`](../../impl/test-derivation-engine/src/emit/tests.ts)
- Development BTE:
  [`bte/development-pipeline.ts`](../../impl/test-derivation-engine/src/bte/development-pipeline.ts)

The live source currently parses to 62 document-IR nodes, 2 legacy parser
edges, and 79 behavioral obligations. Hybrid emission produces 12 executable
assertions, 1 property, and 67 explicit coverage gaps.

The structural projection is instead anchored to the feature `SPEC.md`
Concepts table and Feature Concept Graph:

- 10 registered backend nodes across 9 kinds;
- 7 authored edges across 6 relationship families;
- an expected 52 structural BTE obligations after subset support.

## Capability

```mermaid
flowchart LR
    Docs[Financial Settlement docs] --> Projector[Feature BTE projector]
    Projector --> Project[DevelopmentProject subset]
    Project --> Generator[Structural test generator]
    Generator --> Tests[Runnable Vitest module]
    Tests --> Report[Exact coverage and diagnostics]
```

| Capability | Outcome |
| --- | --- |
| Feature projection | Convert registered concepts, formation evidence, and feature-graph rows into a deterministic `DevelopmentProject`. |
| Declared-subset execution | Run the BTE over the feature's declared subset without requiring all 13 kinds and 16 relationship families in one feature. |
| Instance conformance | Re-evaluate the complete formation of each node and the complete endpoint/scope/order contract of each edge. |
| Runnable emission | Emit one executable Vitest case per structural `TestCase`, with no structural `todo` or `skip`. |
| Honest residue | Keep behavioral oracle gaps and invalid source relationships explicit rather than manufacturing passes. |

## Definition Of Complete Structural Generation

For a feature source snapshot, structural generation is complete when:

1. every registered backend concept has a stable source anchor;
2. every registered node produces a node-instance conformance test;
3. every applicable formation criterion is represented;
4. every Feature Concept Graph row produces an edge-instance conformance test;
5. every used kind and relationship family is represented in the catalogues;
6. missing or contradictory formation evidence produces a failing test with a
   stable diagnostic;
7. invalid endpoints, scope, direction, or ordering produce a failing test;
8. the emitted file is byte-stable and runnable with Vitest;
9. catalogue membership exactly matches the source projection;
10. behavioral gaps remain in the existing hybrid report and are not counted as
    structurally covered.

## Current Expected Structural Census

| Plane | Expected |
| --- | ---: |
| Registered nodes | 10 |
| Distinct node kinds | 9 |
| Formation criteria by used kind | 11 |
| Authored edges | 7 |
| Distinct relationship families | 6 |
| Total structural obligations | 52 |

The `maps` row from `SettlementRequestToInput` to `SettlementResult` currently
conflicts with the development BTE endpoint contract. Proper generation means
that test is emitted and fails with the relationship diagnostic. Correcting the
feature source or widening the relationship contract is a separate decision.

## Non-Goals

- Converting the 67 behavioral coverage gaps into invented assertions.
- Replacing the existing behavioral derivation pipeline.
- Requiring every feature to exercise the complete 13/16 backend profile.
- Editing the Financial Settlement source while building the generator.
- Producing admission, release, production, or lifecycle receipts.
- Adding IOLM or Body War work to this feature-scoped path.

## Acceptance Boundary

The implementation is complete when a single command projects Financial
Settlement, emits and runs all 52 structural cases, reports the current source
failure precisely, and leaves the existing 79-obligation hybrid report
unchanged.
