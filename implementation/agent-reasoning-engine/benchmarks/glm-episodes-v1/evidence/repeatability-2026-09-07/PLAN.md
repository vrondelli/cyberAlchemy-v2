# Frozen repeatability benchmark

Owner-directed evidence collection under the existing CAV2-D65 V3 construction.
Authority effect none; no ontology runtime dependencies.

Predeclared scope: two controlled tasks, two retention policies, three repetitions
per task/policy, for twelve independent arms. manifest.json fixes source hashes,
order and policies before live calls. Task and policy order alternate across
repetitions. All arms use explicit-finalization-v3, bounded-reads-v1 and
inspected-mutation-v1. No source/prompt tuning, failure replacement or acceptance
changes occur during the benchmark. A failed arm remains a failed arm.

Per arm: 12 model attempts,24 tokenizer attempts,580 seconds of execution. Overall
attempt ceilings:144 model and288 tokenizer calls. Soft context8000,hard16384,
output reserve2048,token margin256. The driver checks source hashes before and
after each arm and verifies task identity across repetitions. Protocol/source
or report-integrity failures stop the experiment; ordinary model/provider arm
failures remain recorded while the next predeclared arm can run. No automatic
within-run retries. Twelve distinct single-arm runs avoid replacing or losing an
arm when a neighboring policy fails.

Product frontier: quantify reproducibility of the frozen working candidate.
Runnable work: twelve arms, checked reports and aggregate statistics. Operational
owner: run operator; existing credential bridge and endpoint are prerequisites
for each live request. No new compiler, credentials or service configuration.
Default activation, publication and deployment remain deferred.

## Open Questions

- Are verified repair and continuity repeatable for each task/policy?
- What failure modes, token costs and latency variation appear?
- Does a later independently scoped context-window sweep reproduce these results?

Results and interpretation are owned by README.md in this directory.
