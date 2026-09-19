# Fixed twelve-outcome comparison schedule

Status: deterministic candidate schedule built from the actual retained four-task cohort. Four verification test groups pass; independent review pending. No model, tokenizer or evaluator calls, source clones or live admission.

[comparison-schedule.mjs](comparison-schedule.mjs) verifies the supplied cohort digest and the original configuration bytes against the cohort's recorded hash. Task IDs, instance IDs, public task paths/digests and base commits must match the original ordered cohort exactly. Existing cell construction also verifies each public task's file hash. The new [schedule](COMPARISON-SCHEDULE-R1.json) binds the config/cohort paths and hashes, all twelve cells and their hashes, two workers, one repetition, 1,152,000 maximum model tokens and 1,152 maximum model calls. Those are reservation ceilings, not predicted or measured spend.

The first task starts minimal-history, current-ARE, independent-investigations. The next two rotate that order. The fourth reverses the original order. This fixes scheduling order; with two workers it does not promise completion order or eliminate temporal/provider confounding. Every task has exactly one outcome for each arm. No missing, duplicate, altered or reordered slot is valid under exact reconstruction.

## Verification

```sh
node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-schedule.test.mjs
```

Four groups pass against actual public task inputs: deterministic twelve-slot construction with exact reservations/order; rejection of slot/cell/worker/admission changes; rejection of config/cohort digest drift; rejection of changed cohort ordering even when its bytes receive a fresh caller hash. This validates the supplied source binding; the execution freeze must separately bind the expected cohort and schedule hashes. A caller-selected replacement cohort is not intrinsically authoritative.

The schedule says dispatch_admitted=false. Its hash is an integrity binding, not approval or benchmark completion. The original eight-outcome experiment and all its failures remain unchanged; this is a separate prospective twelve-outcome comparison.

## Product frontier and open questions

Coordinator owns next runnable work: two-worker execution supervision, complete outcome recording, immutable generation sealing and native score/accounting reconciliation. Every unstarted, failed or completed slot must remain in the denominator. Failed known costs and unknown reservations must survive exceptions and disk failures. Native experiment continuity and exact prompts/history/allocation differences must be carried into the final reviewed execution freeze. Real tokenizer qualification and D:/WSL admission precede live dispatch; C: is excluded. Perfect quality, at least 15% savings against both comparators and untouched confirmation remain unproved. Release/deployment remain deferred residue.
