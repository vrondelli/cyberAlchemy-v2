# ORODI Business Ontology View

All records below are candidates pending semantic-owner review.

| Node | Role | Meaning |
|---|---|---|
| `operational-evidence` | product-capability | Evaluate claims from exact, typed, fresh evidence without creating authority |
| `exact-binding` | invariant | Bind contract, profile, subject, observation, and freshness identities |
| `evidence-state-noncollapse` | invariant | Preserve passed, failed, not-run, not-evaluable, and absent states |
| `failure-separation` | invariant | Keep product, infrastructure, harness, and evidence failures distinguishable |
| `observability-separation` | invariant | Observation cannot mutate or actuate the observed system |
| `simulation-boundary` | evidence-boundary | Simulation is not deployment or runtime truth |
| `missing-data-fail-closed` | invariant | Required missing evidence blocks evaluation |
| `observer-nonactuation` | authority-boundary | Runtime observation carries no actuation authority |
| `telemetry-conservation` | invariant | Requests, outcomes, and errors reconcile across the window |
| `canary-decision` | decision | Canary outcome is computed from bound evidence, never guessed |
| `rollback-restoration` | outcome | Restoration requires zero candidate-image references |
| `infrastructure-safety` | safety-boundary | Lab construction, execution, and teardown are separately controlled |
| `effect-authority-separation` | authority-boundary | Evaluation and commissioning are distinct owner decisions |

The canonical definitions, Product Capability identities, and business-ontology admission are still open residues.

