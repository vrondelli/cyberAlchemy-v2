# Context Bundle: E5-observer-executor-separation

Tier: full
Primary claims: C3

## 1. Scope and Claim Target

- Decision question: does role separation improve governance signal fidelity at acceptable cost?
- Primary claim target: C3
- Secondary claim target: C4

## 2. Source Role Matrix

| Source ID | Entry Type | Role | Authority Level | Version Pin |
|---|---|---|---|---|
| PAPER-CONANT-ASHBY-1970 | paper-abstract | primary separation rationale | primary | ijss-1-2-89-97 |
| PAPER-BAI-CONSTITUTIONAL-AI-2022 | paper-abstract | two-model intervention comparison | supporting | arXiv:2212.08073 |
| PAPER-SHANNON-1948 | paper-abstract | channel-noise interpretation | supporting | bell-system-27-3-379-423 |
| BOOK-TALEB-ANTIFRAGILE-2012 | paper-abstract | pruning and minimalism framing | supporting | book:random-house-2012 |
| PAPER-WOHLIN-2012 | paper-abstract | evaluation policy | primary | book:springer-2012 |

## 3. Normalized Terminology Map

| Canonical Term | Source Aliases | Operational Meaning |
|---|---|---|
| unified mode | single-agent mode | same agent executes and emits signals |
| separated mode | dual-agent mode | executor produces artifacts, observer emits signals |
| governance-gap detection rate | recall of true governance gaps | governance_gaps_detected / governance_gaps_present |
| observer overhead | intervention cost | observer_context_tokens or added cost share |

## 4. Metric Definition Map

| Metric | Definition | Source Field(s) |
|---|---|---|
| signal_emission_rate | signals_emitted / signals_expected | signals_emitted, signals_expected |
| signal_accuracy | signals_accurate / signals_emitted | signals_accurate, signals_emitted |
| governance_gap_detection_rate | governance_gaps_detected / governance_gaps_present | governance_gaps_detected, governance_gaps_present |
| observer_cost_overhead | (total_cost_separated - total_cost_unified) / total_cost_unified | total_cost |

## 5. Conflict Log and Resolution Decisions

| Conflict ID | Conflict Type | Resolution | Status |
|---|---|---|---|
| E5-CF-01 | cost increase vs detection gain trade-off | enforce acceptance threshold: >=20% gain with <=20% overhead | resolved |

## 6. Open Risks and Follow-Up Actions

1. Keep session tasks comparable across unified and separated groups.
2. Use blind human audit for governance-gap ground truth where possible.
