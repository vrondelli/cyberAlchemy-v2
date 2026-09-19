---
artifact_role: non-authoritative-evidence-staging
scope: DomainSpec-v1 backend pattern-library cards
source_commit: 33859b561dc34e3d0b9cb3da76b6cb3d196daa65
status: triaged
owner: architecture-pattern-enforcement
promotion_owner: definitions-governance
---

# Backend Pattern-Card Evidence Staging

This matrix stages reusable evidence from the frozen DomainSpec v1 backend
pattern library. It is not a definition catalog: a source link, a triage state,
or an example does not transfer authority, prove a DS-D1 formation criterion,
or promote a candidate. Current schemas remain the machine shape boundary, and
definitions-governance owns any later Evidence-link or promotion decision.

The accepted research finding is
[`2026-07-12-backend-card-triage/findings.md`](../../../r3-closeout-plan/research/2026-07-12-backend-card-triage/findings.md).
Every source below is pinned to v1 commit
`33859b561dc34e3d0b9cb3da76b6cb3d196daa65` and remains read-only.

## Converged backend-card triage

| Source card | Current v2 counterpart | State | Scoped reusable evidence | Unsafe material or residue | Owner / evidence note |
|---|---|---|---|---|---|
| [`entity.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/entity.md) | [`entity.schema.yml`](../../../../impl/spec/meta-types/structural/entity.schema.yml) | `evidence-ready` | Immutable type and explicit guarded transition function. | Mutation-history claim is not demonstrated by the example. | APE may link only the scoped example; definitions-governance owns any DS-D1.1 Evidence link. |
| [`value-object.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/value-object.md) | [`value-object.schema.yml`](../../../../impl/spec/meta-types/structural/value-object.schema.yml) | `staged-review` | Readonly type, validating factory, and pure-operation convention. | The current Equality clause is not declared or demonstrated. | Owner review must reconcile equality before definition evidence. |
| [`enum-type.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/enum-type.md) | [`enum.schema.yml`](../../../../impl/spec/meta-types/structural/enum.schema.yml) | `staged-review` | TypeScript union convention for a finite set. | Relationship claims point `transitions` and `reflects` at Enum, which DS-D8 does not admit. | Owner review must remove stale edge claims before evidence use. |
| [`operation.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/operation.md) | [`operation.schema.yml`](../../../../impl/spec/meta-types/behavioral/operation.schema.yml) | `staged-review` | Dependency-injected mutation sequencing and postcondition publication. | `uses Calculation` is non-canonical; the example bypasses explicit state-machine transition discipline. | Owner review must reformulate relationships and lifecycle handling. |
| [`query.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/query.md) | [`query.schema.yml`](../../../../impl/spec/meta-types/behavioral/query.schema.yml) | `evidence-ready` | Injected read function, null handling, and API-facing result projection. | The result shape is illustrative, not required v2 semantics. | APE may link the implementation slice; definitions-governance owns any DS-D1.5 Evidence link. |
| [`calculation.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/calculation.md) | [`calculation.schema.yml`](../../../../impl/spec/meta-types/behavioral/calculation.schema.yml) | `evidence-ready` | Only the pure-function boundary, supplied rate, and Value Object return. | Exclude the unsupported isolated-constants claim and `Number(...toFixed(2))` money arithmetic. | Evidence-ready only while the link is scoped away from unsafe arithmetic; promotion remains owner-gated. |
| [`rule.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/rule.md) | [`rule.schema.yml`](../../../../impl/spec/meta-types/behavioral/rule.schema.yml) | `staged-review` | One-intent pure predicate and assertion wrapper. | Retired `enforces-cross` must not survive; cross-feature enforcement is metadata on `enforces`. | Owner review must remove retired relationship vocabulary. |
| [`policy.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/policy.md) | [`policy.schema.yml`](../../../../impl/spec/meta-types/behavioral/policy.schema.yml) | `staged-review` | Pure runtime strategy selector separating selection from execution. | The claimed Workflow decision-point relationship is not admitted by DS-D8. | Owner review must reformulate dependency prose. |
| [`workflow.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/workflow.md) | [`workflow.schema.yml`](../../../../impl/spec/meta-types/behavioral/workflow.schema.yml) | `staged-review` | Ordered operations, undo stack, and compensation mechanics. | Purpose is restricted to one feature and the Policy relationship is unsupported. | Owner review must declare `intra-feature` or `cross-feature` scope and remove the stale edge. |
| [`saga.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/saga.md) | No standalone current type; possible residue under [`workflow.schema.yml`](../../../../impl/spec/meta-types/behavioral/workflow.schema.yml) only | `reject-or-superseded` | Participant boundaries and compensation/retry questions may survive as research residue under scoped Workflow. | Independent-type authority is rejected; retired `enforces-cross` cannot survive. This is separate from the dropped app-builder pipeline. | No standalone Evidence link. Any residue review belongs to definitions-governance with explicit `scope=cross-feature`. |
| [`interface.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/interface.md) | [`interface.schema.yml`](../../../../impl/spec/meta-types/connective/interface.schema.yml) | `evidence-ready` | Only the thin controller, injected operation, delegation, and response shape. | DTO validation is stated but the example passes `req.body` through directly; validation is not demonstrated. | Evidence-ready only for the scoped controller slice; promotion remains owner-gated. |
| [`event.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/event.md) | [`event.schema.yml`](../../../../impl/spec/meta-types/connective/event.schema.yml) | `evidence-ready` | Typed past-tense payload and postcondition event publication. | Asynchrony and the event-bus mechanism are implementation choices, not required semantics. | APE may link the scoped example; definitions-governance owns any DS-D1.12 Evidence link. |
| [`mapping.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/mapping.md) | [`mapping.schema.yml`](../../../../impl/spec/meta-types/connective/mapping.schema.yml) | `staged-review` | Explicit field-by-field transformation as an authoring intent. | Hidden default, unsafe cast, and `shapes -> View Model` make the example unsafe as direct guidance. | Use as negative/review evidence until owner reformulation. |
| [`state-machine.md`](../../../../../../implementation/domainspec/architecture/pattern-library/concepts/backend/state-machine.md) | [`state-machine.schema.yml`](../../../../impl/spec/meta-types/lifecycle/state-machine.schema.yml) | `staged-review` | Allowed-transition table, invalid-transition rejection, and pure transition function. | The card reverses the active `reflects` direction; guards, effects, and invariants are incomplete. | Owner review must correct the DS-D8 direction before any definition evidence use. |

Totals: 5 `evidence-ready`, 8 `staged-review`, 0 `deferred`, and 1
`reject-or-superseded`.

Relationship-card classification is intentionally absent. It belongs to
`SWU-R3C-006`, which must classify active, generated, deprecated, and deferred
DS-D8 states separately.
