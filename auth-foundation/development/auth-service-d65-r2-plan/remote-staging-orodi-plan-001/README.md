# Auth remote-staging ORODI plan

This candidate package plans one production-shaped, remotely isolated Auth
staging epoch. It reuses the existing Auth V3 verification and local supervised
staging evidence, then applies ORODI's non-inflating operational-evidence
contracts to deployment, canary, telemetry, recovery, and independent review.

The package contains:

- [PLAN.md](PLAN.md): outcome, lanes, gates, bounds, owners, and stop rules.
- [DAG.json](DAG.json): machine-readable nodes, dependencies, and outputs.
- [DAG.md](DAG.md): reviewable graph and execution waves.
- [EVALUATION-BINDING.v1-candidate.json](EVALUATION-BINDING.v1-candidate.json):
  the unexecuted ORODI denominator and proposed Auth operational profile.
- [EVIDENCE-CLASSIFICATION.md](EVIDENCE-CLASSIFICATION.md): claim classes and
  the boundary before production evidence.
- [PREDECESSORS.json](PREDECESSORS.json): exact source and evidence digest seal.
- [ORODI-PREFLIGHT-DIAGNOSTIC.json](ORODI-PREFLIGHT-DIAGNOSTIC.json): current
  source-package state, workspace-layout repair, and fail-closed status check.
- [implementation/](implementation/README.md): fail-closed local evaluators and
  deterministic Z0, S0, B0, and P0 frontier runner.
- [EXECUTION-STATUS.json](EXECUTION-STATUS.json): typed state and causal blockers
  for every DAG node after the latest local run.
- [VPS-STAGING-PROFILE.v1-candidate.json](VPS-STAGING-PROFILE.v1-candidate.json):
  exact single-VPS, loopback-only rehearsal profile and claim limitations.
- [execution/x0/RESULT.json](execution/x0/RESULT.json): experimental deployment
  result, retained counterevidence, and independent-review disposition.
- [validate.py](validate.py): deterministic structural validation for this plan.

`authority_effect: none`

## Open Questions

See [PLAN.md](PLAN.md#open-questions).
