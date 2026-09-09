# Micro-Swarm Findings

Experiment: `context-footprint-micro-swarm-control`
Coverage: 6/6 tasks; complete=true.

## Accepted claims

- **C-CHILD-CONCURRENCY** (MAP-006): The current host permits at most three concurrent child instances in addition to the root.
  - Non-claim: This does not prove provider-request or self-hosted serving concurrency.
- **C-FIVE-MINUTES** (MAP-002): The current strategy does not meet the five-minute target in the observed run.
  - Non-claim: The receipt is not pure model latency or H200 runtime.
- **C-H200-CAPACITY** (MAP-004): The H200 arithmetic supports only a conditional memory-capacity hypothesis of about 4–5 BF16 or 8–10 FP8 full-context requests.
  - Non-claim: It does not establish safe concurrency, latency, throughput, replicas, or quality.
- **C-RUNTIME-WINDOW** (MAP-003): The nine registered execution-agent sessions span 1,410.725 seconds, or 23.5121 minutes.
  - Non-claim: Parent preparation and post-agent verification are excluded.
- **C-STATIC-PROMPTS** (MAP-001): The nine-agent fixture contains exactly 5,539 persisted initial-prompt characters.
  - Non-claim: This is not provider-accounted input usage.

## Judge matrix

| Claim | Verdict | Reason |
| --- | --- | --- |
| C-CHILD-CONCURRENCY | ACCEPT | Observed host bound is preserved without transfer to serving concurrency. |
| C-FIVE-MINUTES | ACCEPT | The observed wall window falsifies five-minute completion for this run. |
| C-H200-CAPACITY | ACCEPT | Accepted only as conditional memory arithmetic with serving exclusions. |
| C-LUNA-SOL-PARITY | NOT_EVALUABLE | No frozen blind quality comparison exists. |
| C-RUNTIME-WINDOW | ACCEPT | The runtime receipt supplies the exact scoped wall window. |
| C-STATIC-PROMPTS | ACCEPT | Exact fixture arithmetic with an explicit usage non-claim. |

## Deadline assessment

- Exploration wall time: 1300 ms (maximum-card-elapsed-control-estimate).
- Judge time: 2000 ms.
- Accounted time: 3300 ms of 300000 ms.
- Result: **PASS**.

This control report is experiment evidence only and makes no quality-parity, serving, admission, or deployment claim.
