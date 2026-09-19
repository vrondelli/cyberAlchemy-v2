# Comparison schedule review

Approved as an offline schedule component. All four tests passed independently, and the actual COMPARISON-SCHEDULE-R1.json exactly reconstructed from its config, cohort and public task files. Exact transitive source and input bindings are in the companion JSON.

The schedule retains twelve fixed outcomes, two declared workers, one repetition, 1,152,000 model-token and 1,152 model-call ceilings, with dispatch_admitted=false. The documented rotation/reversal and mutation rejection match the implementation. No blocking defect found.

Caller-selected cohort hashes are not authority; final execution freeze must pin them. Scheduling order does not guarantee completion order or remove temporal confounding. Concurrency enforcement, complete failed-cost accounting, immutable sealing and scoring remain later integration obligations. No live admission or quality/savings claim follows.

## Open Questions

Owned by [COMPARISON-SCHEDULE.md](COMPARISON-SCHEDULE.md).
