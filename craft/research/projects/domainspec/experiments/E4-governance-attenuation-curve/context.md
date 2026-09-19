# Context Bundle: E4-governance-attenuation-curve

Tier: full
Primary claims: C3

## 1. Scope and Claim Target

- Decision question: how does compliance fidelity change with increasing governance density?
- Primary claim target: C3
- Secondary claim target: C1

## 2. Source Role Matrix

| Source ID | Entry Type | Role | Authority Level | Version Pin |
|---|---|---|---|---|
| PAPER-SHANNON-1948 | paper-abstract | primary channel-capacity model | primary | bell-system-27-3-379-423 |
| BOOK-ASHBY-CYBERNETICS-1956 | paper-abstract | variety-bound interpretation | primary | book:chapman-hall-1956 |
| PAPER-MILLER-1956 | paper-abstract | bounded-capacity heuristic | supporting | psych-review-63-2-81-97 |
| PAPER-CONANT-ASHBY-1970 | paper-abstract | regulator-modeling constraint | supporting | ijss-1-2-89-97 |
| PAPER-WOHLIN-2012 | paper-abstract | experiment design and validity policy | primary | book:springer-2012 |

## 3. Normalized Terminology Map

| Canonical Term | Source Aliases | Operational Meaning |
|---|---|---|
| governance density | rule count | total active governance obligations in instruction set variant |
| compliance fidelity | per-rule compliance | followed / applicable rule ratio per session |
| attenuation curve | fidelity decay curve | compliance as a function of governance density |
| inflection point k* | critical layer count | density threshold where additional rules reduce effective capacity |

## 4. Metric Definition Map

| Metric | Definition | Source Field(s) |
|---|---|---|
| avg_rule_compliance | session_compliant_rules / session_total_rules | session_compliant_rules, session_total_rules |
| compliance_slope | fitted slope vs rule_count | rule_count, compliant |
| inflection_k_star | modeled threshold for negative marginal fidelity | variant, rule_count, compliant |

## 5. Conflict Log and Resolution Decisions

| Conflict ID | Conflict Type | Resolution | Status |
|---|---|---|---|
| E4-CF-01 | theoretical k* estimates differ by model | report model-specific k* and compare directionally, not as exact equality | resolved |

## 6. Open Risks and Follow-Up Actions

1. Hold task scope constant across V1-V5 to avoid confounding variance.
2. Keep human compliance labels and rubric versioned for reproducibility.
