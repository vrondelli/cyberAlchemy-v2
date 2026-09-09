---
tags: [vault, ontology, agents]
node_type: conceptual
is_session: false
layer: ontology
nature: reference
status: active
version: 0.1.0
last_updated: 2026-03-31
---

# Graph Edge Index

> Materialized index of all declared edges in the vault. Generated from `## Connections` sections. Update this file whenever you add or modify a `## Connections` section in any vault document.
>
> **Purpose:** Lets agents traverse the knowledge graph without opening individual files. One read replaces N reads.

| Source | Target | Edge Type | Description |
|--------|--------|-----------|-------------|
| `axiom/business-axioms.md` | `premise/business-premises.md` | `derives-from` | Business premises sit on top of these axioms |
| `axiom/business-axioms.md` | `constitution/event-system-constitution.md` | `derives-from` | AX-BIZ-1 justifies append-only reproducible event log |
| `axiom/business-axioms.md` | `conceptual/mission.md` | `derives-from` | AX-BIZ-1 and AX-BIZ-2 are the bedrock the mission builds on |
| `axiom/ontology-axioms.md` | `axiom/system-axioms.md` | `contextualizes` | System axioms are the architecture-layer equivalent |
| `axiom/ontology-axioms.md` | `premise/ontology-premises.md` | `derives-from` | Ontology premises sit on top of these axioms |
| `axiom/ontology-axioms.md` | `ontology-conventions.md` | `derives-from` | The label schema is a direct implementation of AX-ONT-1 and AX-ONT-2 |
| `axiom/ontology-axioms.md` | `confidence-levels.md` | `derives-from` | The maturity lifecycle implements P-ONT-9 (adaptivity) |
| `axiom/ontology-axioms.md` | `ontology-constitution.md` | `contextualizes` | The constitution describes the intellectual foundations |
| `axiom/system-axioms.md` | `premise/system-premises.md` | `derives-from` | System premises sit on top of these axioms |
| `axiom/system-axioms.md` | `constitution/folder-structure-constitution.md` | `derives-from` | AX-SYS-3 is the bedrock of screaming architecture |
| `axiom/system-axioms.md` | `constitution/development-practices-constitution.md` | `derives-from` | AX-SYS-1 and AX-SYS-2 justify deterministic pipelines and domain isolation |
| `axiom/system-axioms.md` | `constitution/event-system-constitution.md` | `derives-from` | AX-SYS-4 and AX-SYS-5 enforce immutability and observability |
| `conceptual/epistemic-principles.md` | `ontology-conventions.md` | `contextualizes` | The Orthogonality Principle is the governing constraint of the conventions |
| `conceptual/epistemic-principles.md` | `conceptual/event-system-foundations.md` | `contextualizes` | Event Sourcing as Ledger principle applied to the event system |
| `conceptual/epistemic-principles.md` | `ontology-architecture-draft.md` | `contextualizes` | Occam's Razor applied to the technology choices |
| `conceptual/event-system-foundations.md` | `constitution/event-system-constitution.md` | `contextualizes` | The three disciplines explain why the constitution's rules are shaped as they are |
| `conceptual/event-system-foundations.md` | `axiom/system-axioms.md` | `derives-from` | AX-SYS-4 (Immutability) and AX-SYS-5 (Observability) are the formal expression of the intuitions here |
| `conceptual/event-system-foundations.md` | `conceptual/mission.md` | `contextualizes` | The financial context (FIDC, CCBs, auditors) is what makes the epistemological rigor non-negotiable |
| `conceptual/fidc-and-credit-rights.md` | `conceptual/mission.md` | `contextualizes` | This market overview is the context where the mission is set |
| `conceptual/fidc-and-credit-rights.md` | `premise/system-premises.md` | `contextualizes` | Premises P1 and P3 gain meaning in the context of this market |
| `conceptual/mission.md` | `conceptual/fidc-and-credit-rights.md` | `derives-from` | The mission is set within this market context |
| `conceptual/mission.md` | `premise/business-premises.md` | `derives-from` | Business premises P-BIZ-1 and P-BIZ-2 motivate this mission |
| `conceptual/mission.md` | `axiom/business-axioms.md` | `derives-from` | AX-BIZ-1 and AX-BIZ-2 are the bedrock the mission builds on |
| `conceptual/mission.md` | `premise/system-premises.md` | `derives-from` | Premises P-SYS-3 and P-SYS-7 are the technological bets that make this mission viable |
| `constitution/development-practices-constitution.md` | `constitution/folder-structure-constitution.md` | `contextualizes` | Folder structure constitution applies these principles to directory organization |
| `constitution/development-practices-constitution.md` | `premise/system-premises.md` | `derives-from` | P1, P3, P6 directly motivate these development practices |
| `constitution/event-system-constitution.md` | `constitution/development-practices-constitution.md` | `derives-from` | Amendment process and agent autonomy rules live there |
| `constitution/event-system-constitution.md` | `constitution/folder-structure-constitution.md` | `contextualizes` | Defines where event_log_service.py, event_catalog.py, and domains live |
| `constitution/event-system-constitution.md` | `axiom/system-axioms.md` | `derives-from` | AX-SYS-4 (Immutability) and AX-SYS-5 (Observability) are the bedrock constraints |
| `constitution/event-system-constitution.md` | `premise/system-premises.md` | `derives-from` | P-SYS-9 (Streams), P-SYS-10 (Fail-Open), and P-SYS-11 (Hashes) shape the rules |
| `constitution/event-system-constitution.md` | `premise/system-premises.md` | `derives-from` | P-SYS-6 (Implied Knowledge is Lost Knowledge) motivates the strict catalog contract |
| `constitution/event-system-constitution.md` | `conceptual/event-system-foundations.md` | `derives-from` | Ontology, Digital Twins, and Event Sourcing are the three traditions that shaped the design |
| `constitution/folder-structure-constitution.md` | `premise/system-premises.md` | `derives-from` | P4 (domains are hypotheses) applies directly to this structure |
| `constitution/folder-structure-constitution.md` | `conceptual/fidc-and-credit-rights.md` | `contextualizes` | Code domains mirror business market domains |
| `domain/aquisicao-liquidacao/architecture-installment-upload.md` | `domain/aquisicao-liquidacao/context-installment-upload.md` | `contextualized-by` | Business meaning of the objects in this flow |
| `domain/aquisicao-liquidacao/architecture-installment-upload.md` | `constitution/event-system-constitution.md` | `governed-by` | Rules for all event emission in this feature |
| `domain/aquisicao-liquidacao/architecture-installment-upload.md` | `constitution/folder-structure-constitution.md` | `governed-by` | Layer rules: domain -> infrastructure -> shared_services |
| `domain/aquisicao-liquidacao/architecture-installment-upload.md` | `constitution/development-practices-constitution.md` | `governed-by` | General engineering principles |
| `domain/aquisicao-liquidacao/context-installment-upload.md` | `domain/aquisicao-liquidacao/architecture-installment-upload.md` | `implemented-by` | Code structure, services, flow diagram |
| `domain/aquisicao-liquidacao/context-installment-upload.md` | `constitution/event-system-constitution.md` | `governed-by` | Event emission rules for all upload events |
| `premise/business-premises.md` | `conceptual/mission.md` | `derives-from` | The mission document is an application of P-BIZ-1 and P-BIZ-2 |
| `premise/business-premises.md` | `axiom/business-axioms.md` | `derives-from` | Business axioms are the foundational layer below these premises |
| `premise/business-premises.md` | `conceptual/fidc-and-credit-rights.md` | `contextualizes` | Market overview provides the factual substrate for these premises |
| `premise/ontology-premises.md` | `axiom/ontology-axioms.md` | `derives-from` | All premises derive from one or more axioms |
| `premise/ontology-premises.md` | `ontology-conventions.md` | `implements` | The label schema is a direct implementation of these premises |
| `premise/ontology-premises.md` | `ontology-constitution.md` | `contextualizes` | The constitution describes the intellectual foundations; these premises are the working bets |
| `premise/system-premises.md` | `axiom/system-axioms.md` | `derives-from` | System axioms are the foundational layer below these premises |
| `premise/system-premises.md` | `constitution/folder-structure-constitution.md` | `derives-from` | P-SYS-1 and P-SYS-5 justify the directory structures |
| `premise/system-premises.md` | `constitution/development-practices-constitution.md` | `derives-from` | P-SYS-3 and P-SYS-7 are the primary justification |
| `premise/system-premises.md` | `constitution/event-system-constitution.md` | `derives-from` | P-SYS-9, P-SYS-10, and P-SYS-11 justify the event pipeline rules |
| `business-philosopher/assuntos/meta-representations/formalization-roadmap.md` | `business-philosopher/assuntos/theorem/strategy.md` | `contextualized-by` | Strategy defines the investigation goal and success criteria for the roadmap |
| `business-philosopher/assuntos/meta-representations/formalization-roadmap.md` | `business-philosopher/assuntos/theorem/scope.md` | `contextualized-by` | Scope is the audit orchestration that audits the roadmap's blockers through four parallel registers |
| `business-philosopher/assuntos/meta-representations/formalization-roadmap.md` | `business-philosopher/assuntos/theorem/possible-theorems.md` | `contextualized-by` | Maps where T0 sits in the full theorem space; shows which theorems are GS instances |
| `business-philosopher/assuntos/meta-representations/formalization-roadmap.md` | `business-philosopher/assuntos/meta-representations/open-questions.md` | `derives-from` | P13's Claim A / Claim B distinction is the epistemic spine of the roadmap |
| `business-philosopher/assuntos/meta-representations/formalization-roadmap.md` | `business-philosopher/assuntos/meta-representations/new-layers-post-domainspec.md` | `derives-from` | The promoted layers L0.5, L1.5, L2.5 are the architectural object the Step 1 axioms encode |
| `business-philosopher/assuntos/meta-representations/formalization-roadmap.md` | `business-philosopher/assuntos/meta-representations/domainspec-synthesis.md` | `derives-from` | DomainSpec is the engineering conjecture the roadmap attempts to promote to a theorem |
