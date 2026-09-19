# Context Bundle: E1-derivation-determinism

Tier: foundation
Primary claims: C2

## 1. Scope and Claim Target

- Decision question: does fixed concept graph + fixed derivation rules produce deterministic obligations?
- Primary claim target: C2
- Secondary claim target: C1 (traceability discipline)

## 2. Source Role Matrix

| Source ID | Entry Type | Role | Authority Level | Version Pin |
|---|---|---|---|---|
| BOOK-Evans-BlueBook | paper-abstract | domain-model semantics baseline | primary | book:addison-wesley-2003 |
| PAPER-WOHLIN-2012 | paper-abstract | experiment design and reproducibility policy | primary | book:springer-2012 |
| BOOK-UTTING-LEGEARD-MBT-2007 | paper-abstract | deterministic testing comparison baseline | supporting | book:morgan-kaufmann-2007 |
| PAPER-SWEBENCH-2023 | paper-abstract | stochastic baseline context | supporting | arXiv:2310.06770 |

## 3. Normalized Terminology Map

| Canonical Term | Source Aliases | Operational Meaning |
|---|---|---|
| concept graph | model, domain graph | typed concept + relationship graph used as derivation input |
| derivation rule set | rule pack, delta set | deterministic rule family applied to concept graph |
| obligation set | derived tests, T | output set of test obligations for a run |
| run agreement | determinism score | similarity score across repeated runs |

## 4. Metric Definition Map

| Metric | Definition | Source Field(s) |
|---|---|---|
| run_agreement_jaccard | pairwise overlap between run obligation sets | test_obligations |
| obligation_count | number of derived obligations per run | obligation_count |
| derivation_drift_rate | proportion of runs with non-identical output | test_obligations, run_number |

## 5. Conflict Log and Resolution Decisions

| Conflict ID | Conflict Type | Resolution | Status |
|---|---|---|---|
| E1-CF-01 | deterministic vs stochastic baseline interpretation | treat baseline as contextual comparator, not acceptance criterion | resolved |

## 6. Open Risks and Follow-Up Actions

1. Ensure run environments use identical concept snapshots to avoid false drift.
2. Record any non-deterministic outputs with root-cause labels before claim interpretation.
