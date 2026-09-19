# Context Bundle: E10-developer-productivity

Tier: full
Primary claims: C1, C2

## 1. Scope and Claim Target

- Decision question: does DomainSpec-guided execution improve alignment/quality with acceptable time overhead versus freeform agent usage?
- Primary claim target: C2
- Secondary claim target: C1

## 2. Source Role Matrix

| Source ID | Entry Type | Role | Authority Level | Version Pin |
|---|---|---|---|---|
| PAPER-SWEBENCH-2023 | paper-abstract | benchmark framing for real-world coding tasks | supporting | arXiv:2310.06770 |
| PAPER-SWE-AGENT-2024 | paper-abstract | agentic coding baseline | supporting | arXiv:2405.15793 |
| PAPER-WOHLIN-2012 | paper-abstract | controlled experiment design and validity policy | primary | book:springer-2012 |
| PAPER-KITCHENHAM-2002 | paper-abstract | empirical SE evaluation guidance | supporting | paper:kitchenham-2002-guidelines |
| BOOK-KAHNEMAN-2011 | paper-abstract | cognitive-load interpretation for user outcomes | supporting | book:fsg-2011 |

## 3. Normalized Terminology Map

| Canonical Term | Source Aliases | Operational Meaning |
|---|---|---|
| condition A | DomainSpec mode | structured pipeline-based implementation condition |
| condition B | freeform mode | unstructured direct prompting implementation condition |
| alignment score | spec-code alignment | normalized alignment audit score (0-1) |
| productivity profile | outcome profile | combined view of time, defects, coverage, and satisfaction |

## 4. Metric Definition Map

| Metric | Definition | Source Field(s) |
|---|---|---|
| alignment_delta | condition A alignment minus condition B alignment | alignment_score, condition |
| defect_delta | defects in A versus B | defects_found_in_review, condition |
| time_ratio | A completion time / B completion time | time_to_complete_minutes, condition |
| test_intensity | tests_written normalized by feature scope | tests_written, feature |

## 5. Conflict Log and Resolution Decisions

| Conflict ID | Conflict Type | Resolution | Status |
|---|---|---|---|
| E10-CF-01 | developer familiarity confounding | counterbalanced order and familiarity labels are mandatory fields | resolved |

## 6. Open Risks and Follow-Up Actions

1. Ensure independent review of alignment scoring to reduce evaluator bias.
2. Track training effects between condition order blocks explicitly.
