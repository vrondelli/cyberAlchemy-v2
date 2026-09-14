# Measured delivery and unit-economics model

## What is measured

The [ledger](MEASURED-LEDGER.json) records two author campaigns and two separate
technical replays on one WSL2 host. The primary and replay command windows total
1,075.205 seconds. This is a lower-bound machine-time observation, not a labor
estimate. It excludes mechanism development, semantic interviews, data access,
most control preparation, human analysis, reporting and customer coordination.

The most useful measured facts for a pilot are:

- CRABS: 48 native cases, 48 sanitizer cases and two model-checking
  representatives completed in 141.195 seconds for the author and 156.35 seconds
  for the reviewer; model-checking dominated the reviewer runtime.
- Auth: the sealed author window from first pipeline counterexample through
  repaired completion was 633 seconds.
- Auth independent replay: the accepted toolchain mutation campaign, two EVF
  verifiers, regression tests, causal replay and structural verification took
  94.25 seconds; an additional package-bound mutation replay took 50.41 seconds.
- The largest recorded resident set in the accepted Auth replay was 411,824 KiB.

## Delivery ranges

Use bounded scope classes for quoting. These classes constrain work; they are
not time or price promises.

| Class | Property/implementation boundary | Evidence expectation | Repair |
| --- | --- | --- | --- |
| P1 narrow | One deterministic rule, one revision, existing build and fixtures | One executable route, frozen denominator, five control classes, one replay | One small isolated patch if a natural defect is confirmed |
| P2 multi-route | One rule, one revision, executable plus sanitizer, model or theorem route | P1 plus cross-route evidence and cause-specific mutants | One bounded repair with complete route retest |
| P3 stateful/distributed | One rule spanning transactions, replicas, concurrency or external systems | Custom state model, explicit state/resource bounds, failure and recovery controls | Quoted only after a paid definition phase |

The first customer pilot should be P1. Auth resembles P2; CRABS contains a
bounded distributed property and model-checking representatives and therefore
must not be used as a promise for unrestricted P3 delivery.

## Quote equation

After intake, calculate:

```text
delivery_cost =
  property_owner_hours * owner_loaded_rate
  + assessment_hours * assessment_loaded_rate
  + repair_hours * repair_loaded_rate
  + reviewer_hours * reviewer_loaded_rate
  + delivery_hours * delivery_loaded_rate
  + isolated_compute_cost
  + data_handling_cost
  + external_tool_licenses
  + contingency

quoted_price = delivery_cost / (1 - target_gross_margin)
```

Set every variable from the selected pilot and the organization's actual loaded
costs. Repair is a separately capped option because counterexample discovery and
repairability are not guaranteed. Retest beyond the frozen acceptance set uses
a pre-agreed change order. No price is approved by this candidate.

## Measurement required during the first pilot

Track role hours by phase, queue and elapsed time, CPU time, peak memory, storage,
licensed-tool consumption, data-onboarding effort, number of property revisions,
counterexample triage, repair iterations, reviewer corrections and reporting.
Only after that pilot should CyberAlchemy publish an internal P1 delivery range
or set a fixed fee.

## Open Questions

- Actual loaded rates and target margin are product-owner inputs.
- Cloud/isolation and legal/data-review costs remain unmeasured.
- One customer P1 measurement is required before a market price can be proposed.

