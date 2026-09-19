# Context Bundle: E7-signal-emission-rate

Tier: foundation
Primary claims: C3, C4

## 1. Scope and Claim Target

- Decision question: how much governance signal loss occurs in normal pipeline sessions?
- Primary claim target: C3
- Secondary claim target: C4

## 2. Source Role Matrix

| Source ID | Entry Type | Role | Authority Level | Version Pin |
|---|---|---|---|---|
| PAPER-SHANNON-1948 | paper-abstract | signal-loss interpretation baseline | primary | bell-system-27-3-379-423 |
| PAPER-CONANT-ASHBY-1970 | paper-abstract | observer-modeling rationale for missed governance gaps | primary | ijss-1-2-89-97 |
| BOOK-BEER-BRAIN-1972 | paper-abstract | feedback-loop framing | supporting | book:allen-lane-1972 |
| PAPER-BAI-CONSTITUTIONAL-AI-2022 | paper-abstract | split-role comparison baseline | supporting | arXiv:2212.08073 |
| PAPER-WOHLIN-2012 | paper-abstract | longitudinal measurement policy | primary | book:springer-2012 |

## 3. Normalized Terminology Map

| Canonical Term | Source Aliases | Operational Meaning |
|---|---|---|
| expected signals | planned signals | heuristic expected signal count from run activity |
| emitted signals | observed signals | signal count actually appended for run |
| emission rate | signal fidelity ratio | actual_signal_count / expected_signal_count |
| missed types | absent signal classes | expected signal categories not emitted |

## 4. Metric Definition Map

| Metric | Definition | Source Field(s) |
|---|---|---|
| expected_signal_count | heuristic expected count from run stages and observed gaps | expected_signal_count |
| actual_signal_count | emitted signal count | actual_signal_count |
| emission_rate | actual / expected | actual_signal_count, expected_signal_count |
| missed_type_count | number of missing expected categories | missed_types |

## 5. Conflict Log and Resolution Decisions

| Conflict ID | Conflict Type | Resolution | Status |
|---|---|---|---|
| E7-CF-01 | heuristic expected-signal estimator drift | version estimator logic and store estimator version per row | resolved |

## 6. Open Risks and Follow-Up Actions

1. Ensure session-level estimator assumptions are recorded for each row.
2. Coordinate with E5 to separate unified vs separated-mode cohorts.
