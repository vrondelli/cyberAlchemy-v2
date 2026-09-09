# Define Experiment Metrics

Status: `prepared-candidate-metrics`

Metrics are reported per task and condition before any aggregate. Every
aggregate retains low- and high-ambiguity strata.

The calculator emits each task's paired deltas, the median paired delta for
each comparison, an all-task condition summary, and separate condition
summaries for low- and high-ambiguity strata. One invalid row excludes its
complete four-condition block from these paired calculations.

## Primary Outcomes

| Metric | Formula | Interpretation |
| --- | --- | --- |
| plan semantic score | mean of two reviewer rubric totals; range 0–12 | plan preserves accepted task meaning |
| hidden acceptance pass rate | passed hidden cases / total hidden cases | implementation behavior matches frozen cases |
| outcome match rate | observed action equals the frozen `implement`, `abstain`, `ask`, or `escalate` action | agent chose the right kind of next move |
| weighted semantic defects | `5*critical + 2*major + minor` | severity-sensitive semantic failure burden |
| total rework minutes | observed post-result correction time | downstream repair burden |

## Guardrails

| Metric | Purpose |
| --- | --- |
| critical semantic defects | block a positive interpretation that hides severe failure |
| unnecessary change | detect action when abstention was correct |
| incorrect abstention | detect over-cautious failure to implement |
| owner corrections | expose hidden human repair |
| scope violations | expose work outside the accepted task boundary |
| reviewer rejection count | expose invalid or unhelpful output |
| comprehension score | mean blinded reviewer/user ability to explain and extend; range 0–4 |
| total active minutes | material preparation + planning + implementation + review + rework |
| material preparation minutes | ticket/notes/pack/gate production cost allocated to the condition |
| material preparation tokens | model cost for producing the condition material |
| total tokens | operational cost, not productivity by itself |
| artifact characters | verbosity control |
| protocol deviations | invalidate or qualify the affected comparison |
| blinding guess/confidence | diagnose whether reviewers recognized condition presentation |

## Comparisons

Report paired task-level differences:

```text
selected_information = equivalent_notes - ticket_only
define_structure     = definition_pack - equivalent_notes
evidence_enforcement = definition_pack_evidence_gate - definition_pack
combined_system      = definition_pack_evidence_gate - ticket_only
```

For defect, time, rework, correction, rejection, and violation measures, lower
is better. For plan, acceptance, and comprehension measures, higher is better.

Do not report only `combined_system`; it cannot identify which intervention
caused the difference.

## Pilot Continuation Rule

A pilot may justify a replication proposal—not a product claim—when:

- median `define_structure` plan improvement is at least 2 points out of 12 on
  the four high-ambiguity tasks;
- weighted semantic defects are lower on at least three of those four tasks;
- the Definition Pack condition introduces no critical semantic or permission
  defect;
- low-ambiguity controls show no material correctness degradation;
- information parity and every integrity rule pass; and
- median total active-time overhead for the Definition Pack is no more than
  20% over equivalent notes.

For this comparison, total active time includes material preparation. Do not
report downstream time while excluding the cost of making the pack.

These thresholds are candidate continuation rules. They are not KPIs and have
no product authority.

## Review Agreement

Preserve both reviewer records. Report absolute rubric-score difference and
acceptance disagreement per task. Do not average away material disagreement.

## Missing Data

- Missing required run data invalidates the row.
- A blocked or escalated run remains a result; do not encode it as zero.
- Unobserved work is `null`, named in `unknown_fields`, and never represented
  as zero. Such a row cannot be `completed` and is excluded from aggregates.
- Protocol deviations remain visible and exclude the affected row from an
  unqualified comparison. Because the comparisons are paired, one affected
  row excludes its complete four-condition task block from aggregates.
