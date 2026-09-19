# Context Bundle: E3-mutation-testing

Tier: foundation
Primary claims: C2

## 1. Scope and Claim Target

- Decision question: do derived tests kill meaningful mutants and protect business rules?
- Primary claim target: C2
- Secondary claim target: none

## 2. Source Role Matrix

| Source ID | Entry Type | Role | Authority Level | Version Pin |
|---|---|---|---|---|
| BOOK-Evans-BlueBook | paper-abstract | business-rule criticality baseline | primary | book:addison-wesley-2003 |
| PAPER-VERIGUARD-2025 | paper-abstract | formal-verification comparison context | supporting | arXiv:2502.xxxxx |
| BOOK-UTTING-LEGEARD-MBT-2007 | paper-abstract | model-based fault-detection comparison | supporting | book:morgan-kaufmann-2007 |
| PAPER-WOHLIN-2012 | paper-abstract | experimental design policy | primary | book:springer-2012 |
| PAPER-KITCHENHAM-2002 | paper-abstract | construct-validity framing | supporting | paper:kitchenham-2002-guidelines |

## 3. Normalized Terminology Map

| Canonical Term | Source Aliases | Operational Meaning |
|---|---|---|
| mutant | injected fault | syntactic/semantic code change used for test effectiveness evaluation |
| kill | detected mutant | mutant causes at least one test failure |
| survivor criticality | business impact class | trivial / moderate / critical survivor categorization |

## 4. Metric Definition Map

| Metric | Definition | Source Field(s) |
|---|---|---|
| mutation_score_derived | killed_by_derived / total_mutants | total_mutants, killed_by_derived |
| mutation_score_manual | killed_by_manual / total_mutants | total_mutants, killed_by_manual |
| mutation_score_combined | killed_by_combined / total_mutants | total_mutants, killed_by_combined |
| survivors_critical | surviving business-rule mutants | survivors_critical |

## 5. Conflict Log and Resolution Decisions

| Conflict ID | Conflict Type | Resolution | Status |
|---|---|---|---|
| E3-CF-01 | mutation operator quality differences by module | report operator set alongside scores and avoid cross-operator comparisons | resolved |

## 6. Open Risks and Follow-Up Actions

1. Ensure mutation runs use identical code baseline for derived/manual/combined variants.
2. Review critical survivors manually before claim decisions.
