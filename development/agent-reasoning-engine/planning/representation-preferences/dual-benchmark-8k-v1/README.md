# Dual 8K benchmark study

Read [RESULTS.md](RESULTS.md) for the measured outcome: LongMemEval met the 15%
development target; ContextBench saved 9.41% and still has incomplete selections.
The live test reached four concurrent workers per benchmark.

- [Frozen original plan and DAG](PLAN.md)
- [Explicit zero-exposure amendment](AMENDMENT.md)
- [Original results](RESULTS.json) and [amended comparison](AMENDED-RESULTS.json)
- [Raw receipt audit](AMENDED-POSTRUN-AUDIT.json) and [capacity evidence](CAPACITY-RESULTS.json)
- [Native research DAG](amended-research-dag.json) and [completion audit](AMENDED-COMPLETION-AUDIT.md)
- [Proposed successor work](NEXT-ROUND-DAG.md)

Execution artifacts are immutable evidence. Do not rerun `prepare`, overwrite
freezes, replace failed outcomes or resume completed trials with changed code.
The additive offline audit and research scripts support `--check` verification.
See [AMENDED-NATIVE-GUIDE.md](AMENDED-NATIVE-GUIDE.md) for native record replay.

## Open Questions

The successor plan owns the unmet ContextBench efficiency requirement, broader
long-history confirmation and evidence-retention questions. These pilots do not
establish full-benchmark, general-model or production acceptance.
