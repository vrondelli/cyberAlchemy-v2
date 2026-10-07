# CyberAlchemy v2 Source Map

Status: candidate
Owner: CyberAlchemy v2
Purpose: select the first source spine for a stable repository start without
turning source evidence into authority by proximity.

## CyberAlchemy Exchange

[CyberAlchemy Exchange](cyberalchemy-exchange/README.md) contains its internal
[KEP package](cyberalchemy-exchange/knowledge-exchange-protocol/README.md).
The old product/knowledge-exchange-protocol path is a compatibility symlink;
[relocation notes](cyberalchemy-exchange/RELOCATION.md) explain the preserved evidence.

## Source Cohorts

| Cohort | Primary sources | Role in v2 | Authority posture |
| --- | --- | --- | --- |
| Inventory and ontology condensation | [../.arcanum/inventory/index.md](../.arcanum/inventory/index.md), [../.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md](../.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md) | Reduce search and identify structure hypotheses. | Candidate read model only. |
| CyberAlchemy agentic system | [../cyberAlchemy/README.md](../cyberAlchemy/README.md), [../cyberAlchemy/agentic-system-definition.md](../cyberAlchemy/agentic-system-definition.md), [../cyberAlchemy/agentic-system-inventory-ontology-pipeline.md](../cyberAlchemy/agentic-system-inventory-ontology-pipeline.md), [../cyberAlchemy/agentic-system-ontology-entry-model.md](../cyberAlchemy/agentic-system-ontology-entry-model.md) | Existing product, method, ontology, and execution-loop material. | Candidate project authority until reviewed. |
| Arcanum public framework | [../arcanum/README.md](../arcanum/README.md), [../arcanum/framework/CYBERALCHEMY-METHOD.md](../arcanum/framework/CYBERALCHEMY-METHOD.md), [../arcanum/definitions/DEFINITIONS.md](../arcanum/definitions/DEFINITIONS.md) | Method, capability lifecycle, definitions precedent, public-safe framework structure. | Public canonical source for Arcanum terms and capabilities only. |
| Framework unification | [../projects/framework-unification/README.md](../projects/framework-unification/README.md), [../projects/framework-unification/CONCEPT-MAP.md](../projects/framework-unification/CONCEPT-MAP.md), [../projects/framework-unification/SCOPE.md](../projects/framework-unification/SCOPE.md) | Two-axis architecture: horizontal pipeline plus vertical mechanisms. | Draft architecture synthesis. |
| CyberAlchemy Lean fusion | [../projects/framework-unification/layers/cyber-alchemy-lean-fusion/README.md](../projects/framework-unification/layers/cyber-alchemy-lean-fusion/README.md), [../projects/framework-unification/layers/cyber-alchemy-lean-fusion/DESIGN.md](../projects/framework-unification/layers/cyber-alchemy-lean-fusion/DESIGN.md) | Claim-proof-residue gate and typed-residue integration boundary. | Operationalization candidate; Lean novelty lives elsewhere. |
| DomainSpec v2 precedent | [../projects/domainspec-v2/README.md](../projects/domainspec-v2/README.md) | Research-first, promotion-gated repository discipline. | Pre-implementation research precedent. |
| Private implementation evidence | [../implementation/domainspec](../implementation/domainspec) | Computable governance, registry/code binding, and runtime evidence patterns. | Private evidence; never public without boundary scrub. |
| ARE evolution lifecycle | [implementation/agent-reasoning-engine/packages/evolution-runtime/EVOLUTION-LIFECYCLE.md](implementation/agent-reasoning-engine/packages/evolution-runtime/EVOLUTION-LIFECYCLE.md) | Objective-driven evolution cycles, durable coordination, evidence flow, cross-cycle handoffs, and current HEN-10 integration status. | Candidate implementation narrative; linked registry, schemas, and evidence remain exact sources. |
| Validation evidence | [../validation/poker-team](../validation/poker-team) | Feature-pack validation shape and report precedent. | Private validation evidence. |
| UX/UI evidence and prototyping | [../arcanum/arcana/ux-lessons](../arcanum/arcana/ux-lessons), [../arcanum/arcana/ux-evidence-validator](../arcanum/arcana/ux-evidence-validator), [../arcanum/projects/ui-prototyping-studio/ARCHITECTURE.md](../arcanum/projects/ui-prototyping-studio/ARCHITECTURE.md) | Lesson capture, validator-safe claim classes, and governed UI mutation handoffs. | Candidate UX/UI governance interface; not authority without owner promotion. |
| ResonantOS economy research | [../../resonantos-economy-research/README.md](../../resonantos-economy-research/README.md), [authority/imports/resonantos-economy-research/README.md](authority/imports/resonantos-economy-research/README.md) | Standalone research surface for contribution economy resilience, failed DAO precedent, science-of-science, formal mechanisms, and socioeconomic behavior. | External research evidence; CAV2 method/provenance authority only. |

## Ingest Rules

1. Every imported claim must cite a source path or be labeled synthesis,
   inference, or open question.
2. Source cohorts should be ingested as references first, not copied wholesale.
3. Inventory evidence may seed context; ontology may condense candidates;
   definitions, constitutions, decisions, and promoted specs own authority.
4. Private implementation evidence can inspire private v2 structure, but public
   derivatives need a boundary scrub and owner review.
5. Generated runtime projections must point back to canonical sources before
   they influence capability contracts.

## First Extraction Targets

Owner routes below resolve only through
`cyberAlchemy-v2/agent-routing/routes.json`. The source cohorts are evidence;
they never become repository routing authorities.

Mandatory ontology-runtime gating is suspended while its governed Rust
replacement is constructed. Ontology targets retain their single owner route
and must bind only the exact records and selectors their work consumes.

| Target | Source basis | Owner route |
| --- | --- | --- |
| [Stable repository authority model](authority/AUTHORITY-MODEL.md) | Inventory findings plus public definitions precedent. | `CA2-ROUTE-DEFINITIONS` then `CA2-ROUTE-GOVERNANCE` |
| Source-ledgered amalgamation discipline | Inventory evidence sets plus CyberAlchemy pipeline. | `CA2-ROUTE-GOVERNANCE` |
| Two-axis architecture map | Framework-unification concept map. | `CA2-ROUTE-UNDERSTAND` |
| Knowledge governance stack | Inventory, ontology evidence, CyberAlchemy pipeline, and public method evidence. | `CA2-ROUTE-GOVERNANCE` |
| UX/UI knowledge governance | UX lessons, evidence validation, and UI prototyping sources. | `CA2-ROUTE-RESEARCH` then `CA2-ROUTE-DEFINE` |
| Public/private boundary | Parent AGENTS rules, inventory evidence cards, submodule discipline. | `CA2-ROUTE-GOVERNANCE` |

## Open Questions

### OQ-1. Visible `inventory/` and `ontology/`, or hidden `.arcanum/`?

Context: the inventory findings explicitly leave this unresolved. Recommendation:
keep visible folders as exported project surfaces for now, then decide before
standalone extraction. Status: OPEN.

### OQ-2. Which private implementation patterns can generalize?

Context: private DomainSpec and validation evidence are useful but boundary
sensitive. Recommendation: create public-safe pattern cards only after owner
review. Status: OPEN.
