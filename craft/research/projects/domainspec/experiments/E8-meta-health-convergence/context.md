# Context Bundle: E8-meta-health-convergence

Tier: foundation
Primary claims: C4

## 1. Scope and Claim Target

- Decision question: do meta-health indicators converge toward healthier values over repeated runs?
- Primary claim target: C4
- Secondary claim target: C3

## 2. Source Role Matrix

| Source ID | Entry Type | Role | Authority Level | Version Pin |
|---|---|---|---|---|
| BOOK-BEER-BRAIN-1972 | paper-abstract | feedback-system convergence framing | primary | book:allen-lane-1972 |
| PAPER-MEADOWS-1999 | paper-abstract | intervention leverage interpretation | supporting | sustainability-institute-1999 |
| BOOK-TALEB-ANTIFRAGILE-2012 | paper-abstract | pruning and reduction framing | supporting | book:random-house-2012 |
| BOOK-HOFSTADTER-GEB-1979 | paper-abstract | bounded strange-loop framing | supporting (waived) | book:basic-books-1979 |
| PAPER-WOHLIN-2012 | paper-abstract | longitudinal empirical policy | primary | book:springer-2012 |

## 3. Normalized Terminology Map

| Canonical Term | Source Aliases | Operational Meaning |
|---|---|---|
| orphan rate (M-001) | unanchored concept rate | proportion of concepts lacking traceable implementation links |
| friction rate (M-002) | governance friction | proportion of runs blocked or delayed by governance gaps |
| governance ratio (M-005) | governance completeness ratio | fraction of governance checks satisfied over window |
| overhead ratio (M-006) | governance cost ratio | governance overhead relative to domain work |

## 4. Metric Definition Map

| Metric | Definition | Source Field(s) |
|---|---|---|
| m001_orphan_rate | orphan concepts / total concepts | m001_orphan_rate |
| m002_friction_rate | friction events / run window | m002_friction_rate |
| m005_governance_ratio | passed governance checks / total checks | m005_governance_ratio |
| m006_overhead_ratio | governance work share / total work | m006_overhead_ratio |

## 5. Conflict Log and Resolution Decisions

| Conflict ID | Conflict Type | Resolution | Status |
|---|---|---|---|
| E8-CF-01 | trend interpretation with sparse points | require >=20 points before convergence claim upgrades | resolved |

## 6. Open Risks and Follow-Up Actions

1. Record metric computation tool/version per measurement point.
2. Do not infer convergence from short windows with unstable sampling intervals.
