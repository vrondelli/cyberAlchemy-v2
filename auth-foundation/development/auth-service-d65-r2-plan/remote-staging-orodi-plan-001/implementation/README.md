# Auth-local ORODI implementation

`auth_orodi.py` implements pure, fail-closed checks needed before a remote Auth
staging epoch: B0 profile and B1 full-binding preflight, evidence-ledger aggregation, telemetry
conservation, and rollback restoration. `build_z0.py` selects exact active ORODI
definitions and candidate implementation inputs while refusing to consume stale
ORODI admission decisions. `seal_s0.py` verifies every predecessor digest,
`assess_p0.py` records the exact Auth product gaps, and `run_local_frontier.py`
executes all dependency-ready local nodes and writes `EXECUTION-STATUS.json`.

The implementation performs no network, credential, infrastructure, deployment,
fault, rollback, admission, or production effect.

## Run

```bash
python3 implementation/build_z0.py
python3 implementation/seal_s0.py
python3 implementation/assess_p0.py
python3 implementation/run_local_frontier.py
python3 implementation/cli.py preflight-profile EVALUATION-BINDING.v1-candidate.json
python3 implementation/cli.py preflight EVALUATION-BINDING.v1-candidate.json
python3 -m unittest discover -v -s implementation/tests
```

The current B0 candidate is expected to exit 2 with evidence state `missing`
until owners bind the profile, observer, policy, fixture, tool, and extension
decisions. B1 remains missing until the selected environment, artifact,
topology, rollback inventory, time, and invalidation fields are exact.

## Open Questions

See [PLAN.md](../PLAN.md#open-questions).

`authority_effect: none`
