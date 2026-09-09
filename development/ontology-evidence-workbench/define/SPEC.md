---
id: OEW-SPEC-001
title: Ontology Evidence Workbench
status: approved-for-design-and-plan
scope: private local prototype
discovery_artifact: ../CONTEXT-PACK.md
discovery_waiver_reason: null
authority_effect: none
---

# Ontology Evidence Workbench Specification

## Purpose

OEW is a private, local-first, read-only workbench for exploring **verified
candidate-graph run bundles**. It reuses the graph interaction and dashboard
patterns of Understand-Anything while preserving CyberAlchemy's exact evidence,
policy, provenance, and authority boundaries.

The workbench answers:

> What candidate evidence exists, how does it compose, what contradicts it,
> which relationships are indeterminate, and what receipt proves the view came
> from an unmodified verified run?

It does not answer:

> What is canonically true, which candidate should be admitted, or whether a
> product/release is ready?

## Actors

| Actor | Primary need |
| --- | --- |
| ontology/architecture reviewer | inspect a lineage and its exact evidence contract |
| domain/product owner | understand a conflict without reading JSON first |
| implementation auditor | trace a visible node/edge back to run bytes and code context |
| learning-oriented collaborator | follow a guided tour from finding to research to definition |

## Capability Boundary

OEW SHALL:

1. accept only a bundle that passes the existing independent terminal-receipt
   verifier;
2. preserve source IDs, exact relation verbs, policy disposition, diagnostics,
   authority effect, and file/digest references;
3. generate a generalized presentation graph for Understand-Anything layout and
   search without presenting generalized edge types as source semantics;
4. render a central graph, trust/status rail, evidence inspector, equivalent
   outline/table, search/filters, guided walkthrough, and receipt drawer;
5. make contradiction and policy-indeterminate residue visible by default;
6. support the Poker Team O13 example `F1 → R1 → D1`, with `D2 contradicts D1`
   visible and `specializes(D2,D1)` visibly unbound;
7. keep all serving local and read-only;
8. optionally overlay a separately generated Understand-Anything code graph in
   a later layer, with explicit evidence-to-code mappings.

OEW SHALL NOT:

- mutate candidate input, generated run bundles, Poker Team, IOLM, ontology,
  authority, Craft, or public Arcanum sources;
- infer semantic admission from a UI link, LLM summary, generalized graph edge,
  terminal receipt, or code relationship;
- run whole-repository LLM analysis by default;
- combine code-context and ontology-evidence states into one unlabeled graph;
- claim security, production readiness, publication, or human usability proof
  from authored design artifacts.

## Functional Requirements

| ID | Requirement |
| --- | --- |
| OEW-FR-01 | Verify the selected terminal receipt before producing or serving a view. |
| OEW-FR-02 | Refuse incomplete, digest-drifted, authority-effecting, or unsupported bundles with deterministic diagnostics. |
| OEW-FR-03 | Produce `presentation-graph.json` plus `evidence-sidecar.json` from one verified run. |
| OEW-FR-04 | Preserve a one-to-one mapping from every presented node/edge to exact source evidence. |
| OEW-FR-05 | Show exact relation and disposition in the inspector even when the presentation graph uses a generalized upstream type. |
| OEW-FR-06 | Provide graph, outline, and table surfaces with shared selection state. |
| OEW-FR-07 | Provide filters for evidence kind, exact relation, disposition, diagnostic, and authority effect. |
| OEW-FR-08 | Provide a guided Poker O13 tour and deterministic URL/view-state deep links. |
| OEW-FR-09 | Expose bundle digest, verifier result, upstream UI pin, freshness, and source paths in the receipt drawer. |
| OEW-FR-10 | Keep optional code-context nodes in a separate namespace and visual lane. |

## Non-Functional Requirements

- **Determinism:** identical verified bundle bytes and adapter version produce
  byte-identical adapter artifacts.
- **Traceability:** every selected visual object resolves to exact source IDs,
  paths, and digests.
- **Accessibility:** all critical information is available without color and
  without graph-only interaction; keyboard traversal and equivalent outline/
  table are required.
- **Privacy:** bind to loopback, require a per-process token, make no external
  runtime calls, and default to no LLM analysis.
- **Upgradeability:** pin Understand-Anything by immutable commit and isolate
  upstream adaptations behind a compatibility boundary.
- **Performance target:** L0 should become interactive within two seconds for
  the Poker fixture on a developer laptop; larger thresholds require measured
  evidence before optimization.

## Acceptance Criteria

| ID | Acceptance |
| --- | --- |
| OEW-AC-01 | A valid SWU-OCGP-008 bundle verifies and generates deterministic adapter outputs twice. |
| OEW-AC-02 | A digest-tampered bundle is rejected before any view is served. |
| OEW-AC-03 | The Poker tour selects exactly `F1`, `R1`, `D1`; `D2` remains visible but outside grounding closure. |
| OEW-AC-04 | The UI displays `specializes` as `policy-indeterminate / POLICY_OWNER_UNBOUND`, not as admitted hierarchy. |
| OEW-AC-05 | The generalized presentation edge never replaces the exact candidate relation in the evidence inspector or sidecar. |
| OEW-AC-06 | Graph, outline, and table select the same source object and expose the same status facts. |
| OEW-AC-07 | No network request leaves loopback during the pinned Poker walkthrough. |
| OEW-AC-08 | Protected source digests and `validation/poker-team/**` remain unchanged. |
| OEW-AC-09 | Automated accessibility checks pass and manual screen-reader/usability checks remain separately reported. |
| OEW-AC-10 | Closing the L0 proof grants no authority, promotion, IOLM, publication, or production status. |

## Source and Authority Order

1. Candidate bundle bytes plus independent terminal receipt.
2. Candidate prototype contracts and exact relation/policy rules.
3. OEW adapter sidecar and validation receipts.
4. Generalized Understand-Anything presentation graph.
5. Human annotations or optional model-generated summaries.

Lower levels may explain higher levels but cannot redefine them.

## Delivery Boundary

- Implementation target: `cyberAlchemy-v2/implementation/ontology-evidence-workbench/`
- Planning target: this package
- Upstream integration: pinned MIT-licensed
  `Egonex-AI/Understand-Anything@2cda14e89535049e49120198886bc0b82e9e630f`
- First example input: existing SWU-OCGP-008 generated run bundle
- Existing IOLM and Poker Team paths: read-only

## Resolved Questions

1. **L1 integration strategy — resolved 2026-07-28.** Maintain the first
   working version as an OEW-owned patch overlay over the immutable upstream
   pin. ADR-OEW-002 owns the pin/overlay boundary and ADR-OEW-007 owns the
   coherent vertical UI slice. A downstream fork or reusable-component
   extraction requires new compatibility evidence and a new Design decision.

## Open Questions

1. Should the optional code-context lane be generated from only the candidate
   engine or from a larger private scope? Default: engine path only.
2. Which named humans will perform manual keyboard and screen-reader
   acceptance? Automation cannot answer this.
3. Does a future IOLM owner want to adopt the adapter, keep its current viewer,
   or share only a neutral read model? No IOLM change is authorized here.
