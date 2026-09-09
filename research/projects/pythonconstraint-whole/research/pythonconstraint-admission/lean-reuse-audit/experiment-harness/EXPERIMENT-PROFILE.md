# Experiment Profile

- `PROFILE_ID`: `pythonconstraint-proof-agent-factorial/v1`
- `LIFECYCLE_OWNER`: `CyberAlchemy-v2 PythonConstraint experiment owner`
- `ARTIFACT_TYPE`: `proof-program-experiment` (not a spell or sigil)
- `CONTRACT_PATH`: `protocol.json`
- `PROMPT_SET`: generated from the frozen task and context-condition manifests
- `REGIME_SET`: `one_worker`, `two_sequential`, `two_parallel`
- `PROFILE_VALIDATION`: `python3 scripts/harness.py validate`
- `STATUS`: `candidate-prepared-not-authorized`
- `AUTHORITY_EFFECT`: `none`

The generic Experiment Harness mechanics are adapted here for a formal-proof program. Runtime
responses must be artifact bodies plus structured receipts; prose save summaries are not run
evidence. Existing files are never overwritten by the harness. A rerun requires a new repetition
or an explicit replacement decision outside this package.

Quality is determined by native proof evidence, not prose confidence. Anti-patterns include
counting a process exit as a grader result, treating declared parallelism as observed parallelism,
giving ontology-on extra facts, encoding unknown telemetry as zero, losing rejected attempts,
or reporting an aggregate ranking from incomplete paired cells.
