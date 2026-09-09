---
tags: [ontology, vault, agents]
node_type: discovery
is_session: true
layer: ontology
nature:[[technical, explanatory, procedural]]
status: active
created: 2026-03-24
timestamp: 2026-03-24T16:55:54-03:00
expires: 2026-05-23
conversation_id: b77a3d93-fbec-496f-8f5b-7c03be7a5666
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/ontology/README.md, specs/ontology/backlog-ontology.md]
promoted_candidates: [specs/ontology/library-science-foundations-discovery.md]
expected_importance: 8
importance_rationale: "Formally integrated Ranganathan's Library Science principles into the vault's constitution and established strict, agent-enforced procedural standards (workflows) for maintaining spec directories and backlog files, preventing future knowledge entropy."
---

# Library Science Foundations & Agent Governance Patterns

**Date:** 2026-03-24 16:55 (UTC-3)
**Tags:** #ontology #vault #agents

## Summary

This session focused on elevating the methodological sophistication of the vault by officially integrating principles of Biblioteconomia (Library Science), specifically S.R. Ranganathan's Faceted Classification, as the fourth intellectual pillar of the system. The discussion confirmed that the vault's existing orthogonality axioms already mirror these 95-year-old principles. Following this conceptual alignment, we authored a formal discovery document proposing concrete governance mechanisms (Authority Files, Graph Health Lints, Tag Thesauri) to maintain the graph as content scales. 

Subsequently, to prevent "context collapse" and "over-engineering without control", we built practical engineering guardrails. We established strict documentation patterns for how backlogs and `/specs/` directories must be organized. Two new agent workflows (`backlog-pattern.md` and `readme-pattern.md`) were created, and the primary agent instructions (`AGENTS.md`) were updated to mandate that agents always read and maintain these navigational artifacts.

### Intellectual Foundation Expansion
- **Problem/Goal:** The user identified that the vault's structure heavily intersects with formal Library Science principles and requested we analyze this overlap and formally integrate it.
- **Decision:** Recognized Ranganathan's Colon Classification (1933) as structurally isomorphic to the vault's 7-label facet system. Decided to formally append this to the vault's `ontology-constitution.md`.
- **Changes:** Updated `docs/vault/ontology-constitution.md` to list Ranganathan alongside Zettelkasten, Evergreen Notes, and Bayesian Epistemology. Authored `library-science-foundations-discovery.md` detailing how to use library science techniques (authority files, linting isolated nodes) to govern the vault.

### Backlog Pattern Standardization
- **Problem/Goal:** We needed a standardized way to log ideas from the discovery without polluting navigational files.
- **Decision:** Extracted the categorized backlog pattern from the existing CCB workflow and codified it into a mandatory agent workflow.
- **Changes:** Created `.agent/workflows/backlog-pattern.md` and updated `specs/ontology/backlog-ontology.md` to map the new discovery items using this precise format.

### Specification Directory Navigation (README enforced)
- **Problem/Goal:** Ensure agents and humans can orient themselves inside `/specs/` without conflating navigation with backlog ideas.
- **Decision:** Every folder in `/specs/` must have a purely navigational `README.md` containing business context, why it matters, and a file map. Agents must be heavily constrained to read this before interacting with the folder.
- **Changes:** Created `.agent/workflows/readme-pattern.md`, authored a model README for `specs/ontology/`, and injected strict `MANDATORY` directives into `AGENTS.md` (Rule 3) enforcing the reading and updating of these READMEs.

## Key Decisions
- **Vault Intellectual Lineage:** Biblioteconomia (Information/Library Science) is formally recognized as the overarching conceptual framework that validates the vault's structural design.
- **Governance over Content:** Agreed on the strategic sequence of building strong conceptual frameworks and automated governance lints *before* executing mass data ingestion into the vault.
- **Mandatory Navigational Separation:** Navigational documents (`README.md`) are strictly separated from ideation/task documents (`backlog-*.md`), with automated agent enforcement via `AGENTS.md`.

## Files Changed

### Code (Agent Config and Workflows)
| File | Action | Description |
|------|--------|-------------|
| `AGENTS.md` | `modified` | Injected strict mandates for agents to read/update READMEs in `/specs/` and to use the backlog pattern when creating backlogs. |
| `.agent/workflows/backlog-pattern.md` | `created` | Workflow defining the required structure, frontmatter, and categorization for any backlog specification. |
| `.agent/workflows/readme-pattern.md` | `created` | Workflow defining the mandatory sections (Context, Navigation) for any README inside a `/specs/` folder. |

### Documents
| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/ontology-constitution.md` | `modified` | Added Faceted Classification (Ranganathan) as the fourth intellectual foundation. |
| `specs/ontology/library-science-foundations-discovery.md` | `created` | Discovery proposing authority files, node linting, and tag governance derived from Library Science. |
| `specs/ontology/backlog-ontology.md` | `modified` | Restructured the ontology backlog using the new pattern and ingested the library science tasks into it. |
| `specs/ontology/README.md` | `created` | Model navigational map for the ontology specifications. |

## Connections

| Type | Target | Description |
|------|--------|-------------|
| `validates` | `[[ontology-axioms]]` | The session validated that AX-ONT-2 (Orthogonality) is mathematically isomorphic to Ranganathan's facets. |
| `contextualizes` | `[[ontology-constitution]]` | Provides the historical context behind the addition of the 4th pillar to the constitution. |
| `contextualizes` | `[[library-science-foundations-discovery]]` | This session was the origin of the discovery document. |
