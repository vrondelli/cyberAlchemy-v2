# Failure analysis before the reservation experiment

Six failed episodes from the completed cohort; descriptive evidence only. Each source is hash-bound in [failure-analysis.json](failure-analysis.json).

| Episode | Hypothesis tool calls | First stage | Exact repeated reads | Observed limit |
| --- | --- | --- | --- | --- |
| 16417-early-r1 | 4 | none | 1 | output cap exhausted before candidate |
| 16417-delayed-r1 | 23 | none | 7 | investigation ended without a candidate |
| 16542-early-r1 | 4, 22 | none | 14 | terminal protocol rejection after hypothesis recording |
| 16542-delayed-r1 | 23 | none | 10 | investigation ended without a candidate |
| 16542-delayed-r2 | 19, 20 | 22 | 9 | candidate failed public test at call 23; no revision turn |
| 16542-early-r2 | 17 | none | 11 | investigation ended without a candidate |

Hypothesis call counts include rejected calls; acceptance is visible in the linked events. Repeated reads may reflect lost evidence, checking details, or deliberate investigation. They do not establish a memory defect. The model explanations are self-reports.

The selected manipulation changes construction scheduling only. It leaves output allowance, terminal protocol, memory and task information fixed. A positive result would support this scheduling policy in the observed tasks; a negative result could indicate that exploration or task knowledge matters more than reserved recovery time.

## Open Questions

See [PLAN.md](PLAN.md#open-questions).
