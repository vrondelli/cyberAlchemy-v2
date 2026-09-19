# Context Bundle: E6-vocabulary-sufficiency

Tier: full
Primary claims: C2

## 1. Scope and Claim Target

- Decision question: does the DomainSpec vocabulary cover concepts and relationships across diverse domains?
- Primary claim target: C2
- Secondary claim target: C1

## 2. Source Role Matrix

| Source ID | Entry Type | Role | Authority Level | Version Pin |
|---|---|---|---|---|
| BOOK-Evans-BlueBook | paper-abstract | canonical DDD concept baseline | primary | book:addison-wesley-2003 |
| BOOK-Vernon-IDDD | paper-abstract | multi-context DDD baseline | primary | book:addison-wesley-2013 |
| GH-CargoTracker | domain-model | logistics domain-model extraction | primary | repo:github-cargotracker-current |
| GH-eShopOnContainers | domain-model | enterprise multi-context extraction | primary | repo:github-eshoponcontainers-archived |
| GH-system-design-primer | domain-model | broad system-design domain corpus | supporting | repo:github-system-design-primer-current |

## 3. Normalized Terminology Map

| Canonical Term | Source Aliases | Operational Meaning |
|---|---|---|
| covered concept | clean fit | concept maps to one existing meta-type without semantic loss |
| strained concept | forced fit | concept maps only with semantic compromise |
| uncovered concept | missing type | concept has no adequate meta-type in taxonomy |
| relationship coverage | edge-fit rate | proportion of edges represented by existing relationship set |

## 4. Metric Definition Map

| Metric | Definition | Source Field(s) |
|---|---|---|
| concept_coverage | covered / total_concepts | covered, total_concepts |
| relationship_coverage | relationship_covered / relationship_total | relationship_covered, relationship_total |
| strained_count | number of forced-fit concepts | strained |
| uncovered_count | number of uncovered concepts | uncovered |

## 5. Conflict Log and Resolution Decisions

| Conflict ID | Conflict Type | Resolution | Status |
|---|---|---|---|
| E6-CF-01 | implicit architecture sources vs explicit domain sources | classify source confidence and mark reconstructed concepts with lower confidence | resolved |

## 6. Open Risks and Follow-Up Actions

1. Backfill remaining E6-only domains into inventory entries.
2. Add commit-SHA hard pins for mutable repository sources.
