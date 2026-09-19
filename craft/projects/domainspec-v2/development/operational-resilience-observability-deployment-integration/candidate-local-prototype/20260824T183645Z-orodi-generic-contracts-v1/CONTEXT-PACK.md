# ORODI Candidate-Local Prototype Context Pack

Run: `20260824T183645Z-orodi-generic-contracts-v1`

## Intent

Implement the smallest repository-local generic contract and validator slice that proves the ORODI semantic boundaries without binding a live subject, environment, tool, profile, infrastructure target, or deployment transport.

## Authoritative local inputs

- `invoke-define/20260824T165443Z-orodi-v1/SPEC.md`: C01-C16/M01-M13 denominator, disjoint evidence states, claim ceiling.
- `invoke-define/20260824T165443Z-orodi-v1/domain.md`: `EvaluationBinding`, `OperationalEvaluation`, and non-actuating evaluation invariants.
- `invoke-define/20260824T165443Z-orodi-v1/states.md`: evaluation and simulation/live state separation.
- `invoke-define/20260824T165443Z-orodi-v1/interfaces.md`: telemetry, receipt, profile, infrastructure, and authorization boundaries.
- `invoke-design/20260824T165443Z-orodi-v1/ARCHITECTURE.md`: owner-separated evidence spine.
- `invoke-design/20260824T165443Z-orodi-v1/DECISIONS-RISKS.md`: fail-closed and private/public boundary decisions.
- `invoke-design/20260824T165443Z-orodi-v1/PLANNED-WITNESSES.json`: C01-C16 witness intent.

## Prototype interpretation

The live binding blocker is deliberately not solved. The prototype accepts synthetic, repository-local fixture identities only and labels every result `candidate-local-prototype`. It validates structure and deterministic semantics; it cannot establish runtime behavior, profile admission, tool correctness, infrastructure safety, deployment effect, or production readiness.

## Excluded context

No credentials, live topology, provider configuration, infrastructure state, canary controller, deployment target, external monitoring system, or public Arcanum source is required or admitted.

## Runtime convention

Reuse the existing private implementation root and its installed TypeScript/`tsx` runtime. Do not add a package root or dependency.
