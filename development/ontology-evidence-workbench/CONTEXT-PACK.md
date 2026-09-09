# Ontology Evidence Workbench — Context Pack

Date: 2026-07-27
Context Builder mode: `standard`, strict
Target: private, local-first interface over verified ontology candidate-graph evidence
Working name: **Ontology Evidence Workbench (OEW)**

## Obligations

| ID | Obligation | Evidence selected | Status |
| --- | --- | --- | --- |
| O-01 | Reuse the implemented candidate-graph prototype instead of redesigning its evaluator. | `ontology-candidate-graph-prototype/INVOKE-RESULT.md`; implementation package and SWU-OCGP-008 run bundle | covered |
| O-02 | Use Understand-Anything without collapsing its generalized graph vocabulary into ontology authority. | upstream README, core schema/types, dashboard package at pinned commit | covered |
| O-03 | Make the interface exploratory, comprehensible, and visibly evidence-aware. | existing prototype Design/UX; Understand-Anything dashboard capabilities | covered |
| O-04 | Demonstrate the design with Poker Team O13 while keeping the submodule read-only. | candidate fixture/result and existing worked example | covered |
| O-05 | Preserve IOLM ownership and its selected execution frontier. | current Craft ledger; IOLM context/work pack | covered |
| O-06 | Produce Define, Design, and Plan only. | Invoke contracts and user request | covered |
| O-07 | Keep private sources local and prevent candidate evidence from implying authority. | CyberAlchemy authority rules; verified terminal receipt contract | covered |

## Selected Context

| Source | Selector | Obligation fit |
| --- | --- | --- |
| `cyberAlchemy-v2/.craft/ledger.yml` | `CTX-CAV2-IOLM` and workable-example frontier | O-05 |
| `cyberAlchemy-v2/development/ontology-candidate-graph-prototype/INVOKE-RESULT.md` | outcome, evidence ceiling, L3/L4 deferrals | O-01, O-06 |
| `cyberAlchemy-v2/development/ontology-candidate-graph-prototype/define/SPEC.md` | candidate-only contract and acceptance boundary | O-01, O-07 |
| `cyberAlchemy-v2/development/ontology-candidate-graph-prototype/design/ARCHITECTURE.md` | six-view evaluator architecture | O-01 |
| `cyberAlchemy-v2/development/ontology-candidate-graph-prototype/design/EXAMPLE.md` | Poker Team F1 → R1 → D1 and D2 conflict | O-04 |
| `cyberAlchemy-v2/development/ontology-candidate-graph-prototype/design/UX-PLAN.md` | equivalent human inspection surfaces | O-03 |
| `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/package.json` | Node 22 ESM runtime and verifier commands | O-01 |
| `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/generated/runs/SWU-OCGP-008/result.v1.json` | proven candidate result | O-01, O-04 |
| `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/generated/runs/SWU-OCGP-008/terminal-receipt.json` | verified bundle boundary | O-01, O-07 |
| `cyberAlchemy-v2/development/interactive-ontology-learning-map/CONTEXT.md` | read-only source-preserving UI boundary | O-05 |
| `cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md` | active A2 selection and non-collapse rules | O-05 |
| `Egonex-AI/Understand-Anything@2cda14e89535049e49120198886bc0b82e9e630f` `README.md` | dashboard, local viewer, graph and knowledge workflows | O-02, O-03 |
| same commit `packages/core/src/types.ts` and `schema.ts` | closed node/edge vocabulary and graph contract | O-02, O-07 |
| same commit `packages/dashboard/package.json` and `src/App.tsx` | React/XYFlow/Zustand/Vite UI and data loading | O-02, O-03 |

Upstream reference: <https://github.com/Egonex-AI/Understand-Anything/tree/2cda14e89535049e49120198886bc0b82e9e630f>

## Inventory Lookup

`.arcanum/inventory/index.json` was read first and passed
`validate-index-json.sh` with `lookup_readiness=ready`. Relevant matches included
the verified IOLM strategy/workable-example entries and ontology
working-prototype research. Inventory supplied discovery evidence only; it did
not select authority or mutate the package.

## Key Findings

1. The candidate engine is already working and independently receipt-verified;
   the missing unit is a trustworthy interactive projection, not another
   evaluator.
2. Understand-Anything is an excellent UI substrate, but its closed generalized
   edge vocabulary cannot represent every candidate relation without loss.
3. Therefore the source bundle remains authoritative for this prototype lane.
   A presentation adapter emits a generalized graph for layout while a separate
   evidence sidecar retains exact relation, disposition, digest, and receipt
   fields.
4. The existing IOLM is a separate private product lane with an active selected
   SWU. OEW may reuse its read-only lessons but must not write into or silently
   replace that plan.

## Excluded Candidates

- Whole-repository `/understand` analysis: excluded from L0 because it may
  consume private material and substantial model tokens.
- Direct modification of `validation/poker-team/`: excluded; it is a read-only
  example and product authority remains with Poker Team.
- Direct edits to Understand-Anything upstream: excluded from this invocation;
  the Plan owns a pinned adaptation boundary only.
- Public Arcanum integration: excluded because this package contains private
  source bindings.

## Context Result

- Files/sources selected: 14
- Obligation coverage: 7/7
- Strict coverage: pass for authoring
- Runtime handoff: not emitted; Context Packs for individual SWUs belong to
  later Task Sessions
- Blockers: none for Define/Design/Plan

## Open Questions

See [define/SPEC.md](define/SPEC.md#open-questions).
