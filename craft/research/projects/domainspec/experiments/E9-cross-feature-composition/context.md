# Context Bundle: E9-cross-feature-composition

Tier: full
Primary claims: C2

## 1. Scope and Claim Target

- Decision question: are additional composition operators required to model cross-feature/cross-context semantics?
- Primary claim target: C2
- Secondary claim target: C1

## 2. Source Role Matrix

| Source ID | Entry Type | Role | Authority Level | Version Pin |
|---|---|---|---|---|
| BOOK-Evans-BlueBook | paper-abstract | cargo domain and DDD composition baseline | primary | book:addison-wesley-2003 |
| BOOK-Vernon-IDDD | paper-abstract | multi-context collaboration baseline | primary | book:addison-wesley-2013 |
| GH-CargoTracker | domain-model | run-2 CD1 evidence | primary | repo:github-cargotracker-current |
| GH-IDDD-Samples | domain-model | run-2 CD2 evidence | primary | repo:github-iddd-samples-current |
| GH-eShopOnContainers | domain-model | run-2 CD4 evidence | primary | repo:github-eshoponcontainers-archived |
| GH-system-design-primer | domain-model | run-2 CD3/CD5/CD6 reconstruction corpus | supporting | repo:github-system-design-primer-current |

## 3. Normalized Terminology Map

| Canonical Term | Source Aliases | Operational Meaning |
|---|---|---|
| composition edge | cross-context edge | relation connecting concepts owned by different feature/context graphs |
| model_status_original | baseline fit status | works/strained/broken classification against original relationship set |
| composition operator | G_AoplusB | formal operator for merged graph semantics |
| cross derivation rules | Delta_cross | derivation rules that depend on cross-context edges |

## 4. Metric Definition Map

| Metric | Definition | Source Field(s) |
|---|---|---|
| edge_count | number of enumerated cross-context edges | edge_id |
| broken_edge_rate | broken edges / total edges | model_status_original |
| extension_resolution_rate | previously broken edges resolved by proposed operators | model_status, model_status_original |
| recurring_pattern_coverage | recurrent patterns observed across selected domains | pattern_id |

## 5. Conflict Log and Resolution Decisions

| Conflict ID | Conflict Type | Resolution | Status |
|---|---|---|---|
| E9-CF-01 | run-2 initial classification inconsistencies | rerun with stricter mapping rubric retained as canonical | resolved |

## 6. Open Risks and Follow-Up Actions

1. Add immutable commit pins for mutable repository sources.
2. Confirm whether any additional edge types are needed after E11 adjudication.
