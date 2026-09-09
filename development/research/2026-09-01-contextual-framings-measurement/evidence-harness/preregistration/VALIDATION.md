# ACFT Preregistration Candidate Validation

Validated: 2026-09-01

## Outcome

The experimental-design candidate and unresolved owner-decision template are
structurally valid. They are not ready or authorized for live execution.

```text
candidate_valid: true
decision_fields_total: 22
decision_fields_resolved: 0
decision_fields_unresolved: 22
decision_posture: pending_owner_decisions
claim_status_update_allowed: false
live_ready: false
live_execution_authorized: false
```

## Commands

```text
$ python3 generate_fixtures.py
{"decision_fields": 22, "live_ready": false, "resolved": 0, "status": "pass"}

$ python3 validate.py --candidate candidate.json --decision owner-decision-template.json --output results/decision-readiness.json
{"candidate_valid": true, "claim_status_update_allowed": false, "decision_fields_resolved": 0, "decision_fields_total": 22, "decision_fields_unresolved": 22, "decision_posture": "pending_owner_decisions", "live_execution_authorized": false, "live_ready": false, "preregistration_id": "acft-owner-controlled-preregistration@1", "remaining_gate": "owner_decisions_then_acceptance_then_separate_live_authorization", "schema_version": "acft-preregistration-readiness@1", "status": "pass_candidate"}

$ python3 validate.py --candidate candidate.json --decision owner-decision-template.json --require-live-ready
LIVE_BLOCKED:owner decisions, acceptance, and separate authorization required
{"live_ready": false, "status": "blocked"}
```

The last command exited non-zero as required.

## Negative fixtures

The validator rejected:

```text
fixtures/fail-silent-default.json
  SILENT_DEFAULT:decision.decisions.sample_size

fixtures/fail-premature-claim-upgrade.json
  CLAIM:decision.claim_status_update_allowed

fixtures/fail-stale-binding.json
  EXACT_REF:decision.candidate_ref:digest
```

## Regression suite

```text
$ python3 test_preregistration.py
Ran 6 tests in 1.582s

OK
```

## Evidence and authority boundary

This validation shows that the candidate preserves its bindings, unresolved
decisions, lifecycle, and claim ceiling under the tested mechanics. It does not
show that the experimental design has been selected, that an owner has accepted
the preregistration, that human-research requirements are satisfied, or that
live execution is authorized.

The next gate is explicit completion of all 22 decision records, followed by
owner acceptance of immutable bytes. Recruitment and execution would still
require a later, separate authorization.
