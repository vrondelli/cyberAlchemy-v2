# Context Bundle: E2-derivation-vs-manual

Tier: foundation
Primary claims: C2

## 1. Scope and Claim Target

- Decision question: do derived obligations provide better coverage and traceability than manual plans?
- Primary claim target: C2
- Secondary claim target: C1

## 2. Source Role Matrix

| Source ID | Entry Type | Role | Authority Level | Version Pin |
|---|---|---|---|---|
| BOOK-Evans-BlueBook | paper-abstract | domain semantics baseline | primary | book:addison-wesley-2003 |
| BOOK-UTTING-LEGEARD-MBT-2007 | paper-abstract | coverage-comparison baseline | supporting | book:morgan-kaufmann-2007 |
| PAPER-NORTH-BDD-2006 | paper-abstract | manual scenario-authoring baseline | supporting | article:better-software-2006 |
| PAPER-WOHLIN-2012 | paper-abstract | experiment design policy | primary | book:springer-2012 |
| PAPER-KITCHENHAM-2002 | paper-abstract | empirical quality and threats policy | supporting | paper:kitchenham-2002-guidelines |

## 3. Normalized Terminology Map

| Canonical Term | Source Aliases | Operational Meaning |
|---|---|---|
| derived set D | generated suite | obligations produced by deterministic pipeline |
| manual set M | human-authored plan | tests planned by tester without derived output |
| overlap ratio | agreement | |D ∩ M| / |D ∪ M| |
| traceability percent | spec-link rate | percentage of tests tied to explicit spec anchor |

## 4. Metric Definition Map

| Metric | Definition | Source Field(s) |
|---|---|---|
| derived_count | number of derived tests | derived_count |
| manual_count | number of manual tests | manual_count |
| overlap_count | shared tests between D and M | overlap_count |
| derived_traceable_pct | traceable tests in D | derived_traceable_pct |
| manual_traceable_pct | traceable tests in M | manual_traceable_pct |

## 5. Conflict Log and Resolution Decisions

| Conflict ID | Conflict Type | Resolution | Status |
|---|---|---|---|
| E2-CF-01 | ambiguous manual test granularity | normalize by obligation category before overlap comparison | resolved |

## 6. Open Risks and Follow-Up Actions

1. Keep manual authors blind to derived outputs before data capture.
2. Classify D\M and M\D differences by severity, not count only.
