# Operational Evidence Implementation Layering

Status: non-executing planning model. Layers describe ownership and prerequisites; they are not implementation units.

## Layer graph

| Layer | Purpose | Entry evidence | Exit evidence | Current state |
| --- | --- | --- | --- | --- |
| L0 Owner and target binding | name subject, environment, owner roles, stable/candidate artifacts, topology | accepted Define/Design | exact owner-binding decision packet | blocked: identities absent |
| L1 Semantic and ontology admission | accept local concepts, CAV2 crosswalk direction, C01-C16 denominator, C17-C20 disposition | L0 owners | separate semantic/crosswalk decisions | blocked: owners absent |
| L2 Profile and tool admission | select monitoring, load, infrastructure, canary, deployment and rollback profiles plus exact tools/runtimes | L0-L1 | lifecycle-owned profile admission receipts | blocked: profiles unselected |
| L3 Policy and receipt binding | bind SLI/SLO, privacy, workload, plan, canary, rollback, evaluator and freshness contracts | L0-L2 | immutable policy/evaluator/receipt-schema packet | blocked: values and schemas absent |
| L4 Witness assembly and proof | assemble `W-ORODI-001-R2` exact refs and run non-effecting validators | L0-L3 | refreshed execution-candidate or new blockers | not admitted |
| L5 Protected execution | fault/load runs, infrastructure apply, canary, deployment and rollback | fresh execution plan and separate authorization | independently observed runtime/effect receipts | forbidden in current Plan |
| L6 Promotion and release | accept evidence, promote admitted artifacts, release | owner-specific exact-byte gates | promotion/release receipts | forbidden in current Plan |

## Dependency rule

Each layer may consume only exact receipts from prior owners. Passing a lower layer does not authorize a higher one. L5 and L6 require a future Invoke Refresh, a new execution-candidate Plan, readiness audit, and protected owner decisions.

## Smallest coherent next unit

`ORODI-OWNER-BINDING-PACKET-001`: one immutable decision packet naming the target subject/environment and every accountable owner class needed to decide L1-L4. It contains no tool selection, mutation command, credential, infrastructure target action, or external effect.

Recomposition: the packet provides stable identities for each later profile/policy admission receipt; those receipts can then bind the `ControlEvaluationCell` graph without changing the accepted semantic denominator.
