# Experiment Results Template

Copy this file into `experiments/<experiment-key>/results/<run-id>-results.md` when an experiment run completes.

Analysis follows the 10-step empirical pipeline from Wohlin et al. (2012):
Integrity → Descriptive Stats → Hypothesis Testing → Subgroups → Gap Taxonomy → Sensitivity → Triangulation → Validity Threats → Claim Adjudication → Synthesis.

Tier usage:

| Step | Foundation Tier | Full Tier |
|---|---|---|
| 1 Data Integrity | required | required |
| 2 Descriptive Statistics | required | required |
| 3 Hypothesis Testing | required | required |
| 4 Subgroup Analysis | concise minimum | detailed required |
| 5 Gap Taxonomy | optional | required |
| 6 Sensitivity Analysis | optional | required |
| 7 Triangulation | optional | required |
| 8 Validity Threats | concise minimum | detailed required |
| 9 Claim Adjudication | required | required |
| 10 Synthesis | required | required |

---

## EX: [Experiment Title]

**Status:** not-started | in-progress | completed
**Date range:** YYYY-MM-DD — YYYY-MM-DD
**Operator:** [name]
**DomainSpec version:** [version]

---

### Step 1: Data Integrity (required for foundation and full)

- Location: `experiments/<experiment-key>/data/<run-file>.jsonl`
- Rows: actual / expected (%)
- Schema violations: N
- Integrity: sha256 of raw file
- Protocol deviations: None / [list deviations]
- Gate: PASS / BLOCKED

### Step 2: Descriptive Statistics (required for foundation and full)

| Metric | Value |
| ------ | ----- |
| ...    | ...   |

_Include per-subgroup tables, frequency distributions, and coverage rates as applicable._

### Step 3: Hypothesis Testing (Success Criteria) (required for foundation and full)

| Criterion | Target | Observed | 95% CI | Effect Size | Status |
|-----------|--------|----------|--------|-------------|--------|
| SC-1      | ...    | ...      | ...    | ...         | ✅/❌  |

### Step 4: Subgroup Analysis (foundation concise, full detailed)

_Per-subgroup metrics, cross-group variance, Simpson's paradox check._

| Subgroup | Metric | Value | Passes Criterion? |
|----------|--------|-------|-------------------|

### Step 5: Gap Taxonomy (optional foundation, required full)

| Category | Pattern | Frequency | Severity | Remediation |
|----------|---------|-----------|----------|-------------|

### Step 6: Sensitivity Analysis (optional foundation, required full)

| Perturbation | Original Result | Perturbed Result | Conclusion Stable? |
|-------------|-----------------|------------------|-------------------|

### Step 7: Triangulation (optional foundation, required full)

| Experiment | Finding | Relation | Convergence |
|-----------|---------|----------|-------------|

### Step 8: Validity Threats (foundation concise, full detailed)

**Internal:** ...
**External:** ...
**Construct:** ...
**Conclusion:** ...

### Step 9: Claim Adjudication (required for foundation and full)

| Claim | Evidence Strength | Status | Revision Needed? |
|-------|------------------|--------|-----------------|
| CX    | strong / moderate / weak / contradicted | supported / partial / insufficient / contradicted | yes / no |

### Step 10: Synthesis (required for foundation and full)

- Paper action: [none | revise §N | add data to §N]
- Session learnings: [what improved the pipeline]

---

## Conclusions

1. ...

## Impact on Paper Claims

- Claim CX: [strengthened / weakened / unchanged]
- Recommended paper revision: [description]
