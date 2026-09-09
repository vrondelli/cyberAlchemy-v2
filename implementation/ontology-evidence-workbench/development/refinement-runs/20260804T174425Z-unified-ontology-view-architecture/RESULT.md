# Unified Ontology View Architecture — Refine Result

Status: `pass` at Refine architecture/planning ceiling.

## Outcome

The run compared eleven ontology-view families and selected one framework-neutral, lossless `KnowledgeScene` with separate source, View Pack, query, navigation, layout, renderer, evidence/index, linear, and static boundaries. React Flow 12.10.1 plus ELK 0.9.3 is the first pinned adapter candidate; Cytoscape remains a separately admitted alternative. Body War is the full-scale acceptance fixture, not a special semantic implementation.

The design directly answers the failed prototype:

- bounded home/focus scenes replace the all-node black box;
- actual relation paths and markers replace relation cards;
- each exact predicate has its own color token plus label, pattern, and direction phrase;
- node kind/role icons supplement visible text;
- Grouped Portals summarize destination clusters while retaining every cut relation;
- Path, graph, inspector, and index share exact relation IDs;
- the complete 577-row index remains available independently of graph filters;
- source-owned builds replace compiled/minified bundle surgery.

## Evidence

- Context: [CONTEXT-PACK.md](stages/01-context-builder/CONTEXT-PACK.md)
- Research decision: [TOOL-COMPARISON.md](stages/04-research-decision/TOOL-COMPARISON.md)
- Architecture: [ARCHITECTURE.md](stages/06-invoke-design/ARCHITECTURE.md)
- UX and acceptance: [UX-CONTRACT.md](stages/06-invoke-design/UX-CONTRACT.md), [ACCEPTANCE-CONTRACT.md](stages/06-invoke-design/ACCEPTANCE-CONTRACT.md)
- Design repair: [DISTILL-REPAIR.md](stages/08-distill-repair/DISTILL-REPAIR.md)
- Work Pack: [WORK-PACK.md](stages/09-invoke-plan/WORK-PACK.md), [SWU-MANIFEST.md](stages/09-invoke-plan/SWU-MANIFEST.md)
- Final critique: [INTERROGATION-RESULT.md](stages/10-final/INTERROGATION-RESULT.md)

The executable toy game read the actual Body War bundle and confirmed the design denominator of 276 nodes, 301 relations, 39 exact-predicate colors, and 577 index rows. It caught all thirteen planned semantic/navigation degradations. This is contract evidence, not working-frontend or browser evidence.

## Next selected unit

`SWU-UOVA-001`: pure SourceGraph normalization and fixtures. It is the narrowest reversible start and makes no visible UI or build-cutover change. Execute through Task Session, one SWU at a time.

## Claim boundary

No OEW product code, Body War ontology, generated frontend, dependency, or Git publication was changed by Refine. The current broken UI is not fixed by this result. A testable local prototype requires SWU-UOVA-001 through 020 to pass, especially source-owned build cutover and browser/performance acceptance.
