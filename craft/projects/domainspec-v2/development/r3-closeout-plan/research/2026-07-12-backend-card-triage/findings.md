---
dispatch_id: 2026-07-12-r3c-backend-card-triage
artifact_role: governed-research-finding
status: accepted
created: 2026-07-12
source_commit: 33859b561dc34e3d0b9cb3da76b6cb3d196daa65
final_audit: ACCEPT
---

# SWU-R3C-005 Backend-Card Triage Findings

## Finding

The 14 v1 backend concept cards contain useful implementation and review
evidence, but none transfers authority into DomainSpec v2. The converged
classification is:

| State | Count |
|---|---:|
| `evidence-ready` | 5 |
| `staged-review` | 8 |
| `deferred` | 0 |
| `reject-or-superseded` | 1 |

`evidence-ready` is only a staging classification. It means that a precisely
scoped passage or example adds non-vacuous implementation guidance without an
unresolved contradiction inside that scope. A staging row or evidence link
does **not** transfer authority, prove a DS-D1 formation criterion, or promote
any DS-D1 candidate. Current v2 schemas remain the machine shape boundary;
semantic authority remains owner-gated.

## Converged 14-card matrix

| # | Exact v1 source | Pinned v1 commit | Current v2 counterpart | Primary state | Scoped reusable evidence | Unsafe material / residue | Rationale |
|---:|---|---|---|---|---|---|---|
| 1 | `implementation/domainspec/architecture/pattern-library/concepts/backend/entity.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | `projects/domainspec-v2/impl/spec/meta-types/structural/entity.schema.yml` | `evidence-ready` | Immutable entity type and an explicit transition function guarded by current state. | The purpose claims lifecycle tracking and mutation history, but the example records no history; exclude that claim from reusable evidence. | The code example adds concrete authoring form beyond the schema and its `performs`, `contains`, and `emits` relationship claims align with the current endpoint types. It remains implementation evidence only. |
| 2 | `implementation/domainspec/architecture/pattern-library/concepts/backend/value-object.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | `projects/domainspec-v2/impl/spec/meta-types/structural/value-object.schema.yml` | `staged-review` | Readonly type, validating factory, and pure-operation convention. | The example does not declare or demonstrate the current Equality clause criterion; numeric money representation is not semantic authority. | The constructor pattern is useful, but the card cannot serve as compatible formation evidence until equality is explicit and reviewed. |
| 3 | `implementation/domainspec/architecture/pattern-library/concepts/backend/enum-type.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | `projects/domainspec-v2/impl/spec/meta-types/structural/enum.schema.yml` | `staged-review` | TypeScript union convention and centralization of a finite set of values. | Its `transitions <- State Machine` and `reflects <- State Indicator` relationship claims are not admitted for Enum by the current DS-D8 endpoint signatures. | The language-level example is useful, but the relationship block is unsafe and must be reformulated before any evidence scope is admitted. |
| 4 | `implementation/domainspec/architecture/pattern-library/concepts/backend/operation.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | `projects/domainspec-v2/impl/spec/meta-types/behavioral/operation.schema.yml` | `staged-review` | Dependency-injected mutation sequencing: rule check, lookup, persistence, event publication, and returned result. | `uses Calculation` is not a current canonical relationship; the example performs a status change without an explicit state-machine transition. | The example adds implementation detail, but its relationship vocabulary and lifecycle discipline require review against the current boundary. |
| 5 | `implementation/domainspec/architecture/pattern-library/concepts/backend/query.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | `projects/domainspec-v2/impl/spec/meta-types/behavioral/query.schema.yml` | `evidence-ready` | Injected read function, null handling, and API-friendly result shape for side-effect-free retrieval. | The result-shape choice is illustrative, not a required v2 shape or semantic proof. | The implementation form is non-vacuous and the `queries`, `exposed by`, and `fetched by` claims align with current endpoint types. |
| 6 | `implementation/domainspec/architecture/pattern-library/concepts/backend/calculation.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | `projects/domainspec-v2/impl/spec/meta-types/behavioral/calculation.schema.yml` | `evidence-ready` | **Only** the explicit pure-function boundary, supplied `rate` input, and Value Object return. | Do not reuse the claim that constants are isolated: the example demonstrates no isolated constant. Exclude `Number((...).toFixed(2))` from reusable money guidance because it is runtime-specific arithmetic. | Popper found the narrowly scoped function/input/return evidence non-vacuous. The row remains ready only while the staging link excludes the unsupported constants claim and unsafe arithmetic. |
| 7 | `implementation/domainspec/architecture/pattern-library/concepts/backend/rule.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | `projects/domainspec-v2/impl/spec/meta-types/behavioral/rule.schema.yml` | `staged-review` | One-intent pure predicate plus an explicit assertion wrapper. | `enforces-cross` is retired; cross-feature enforcement is metadata on `enforces`, not a distinct relationship. | The predicate example is useful, but the relationship block cannot be admitted unchanged and the retired label must not survive staging. |
| 8 | `implementation/domainspec/architecture/pattern-library/concepts/backend/policy.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | `projects/domainspec-v2/impl/spec/meta-types/behavioral/policy.schema.yml` | `staged-review` | Pure runtime strategy selector with explicit inputs and separation of selection from execution. | `used by Workflow decision points` has no current DS-D8 signature; current `applies` targets Operation or Calculation, not Workflow. | The selector helps distinguish Policy from Rule in code, but its dependency prose is partly stale. |
| 9 | `implementation/domainspec/architecture/pattern-library/concepts/backend/workflow.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | `projects/domainspec-v2/impl/spec/meta-types/behavioral/workflow.schema.yml` | `staged-review` | Ordered operation calls, explicit undo stack, and compensation for partial failure. | The purpose narrows Workflow to one feature although current v2 admits `intra-feature` or `cross-feature`; `applies <- Policy` is unsupported. | The compensation mechanics are useful, but scope and relationship claims must be rewritten against the current Workflow criterion. |
| 10 | `implementation/domainspec/architecture/pattern-library/concepts/backend/saga.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | **None.** Possible residue destination only: `projects/domainspec-v2/impl/spec/meta-types/behavioral/workflow.schema.yml` with explicit `scope=cross-feature`. | `reject-or-superseded` | Participant boundaries, forward/compensation pairs, and retry/dead-letter questions may survive as research residue under a scoped Workflow. | No standalone current Saga meta-type exists. The card's `produces-for`, `triggers-cross`, and retired `enforces-cross` block is not admissible as copied authority. | Existing evidence does not establish a non-circular Saga-only formation witness. Reject the independent type while preserving only reviewable compensation residue under Workflow. |
| 11 | `implementation/domainspec/architecture/pattern-library/concepts/backend/interface.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | `projects/domainspec-v2/impl/spec/meta-types/connective/interface.schema.yml` | `evidence-ready` | **Only** the thin controller, injected operation, delegation, and boundary response shape. | DTO validation is stated but contradicted by the example's direct `req.body` pass-through; treat validation as unresolved residue, not demonstrated evidence. The example does not define authoritative `interface_kind` values. | Popper found the controller/delegation slice non-vacuous. It remains ready only with the undemonstrated validation instruction excluded from the evidence scope. |
| 12 | `implementation/domainspec/architecture/pattern-library/concepts/backend/event.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | `projects/domainspec-v2/impl/spec/meta-types/connective/event.schema.yml` | `evidence-ready` | Typed past-tense payload, postcondition publication timing, and an injected event-bus publication function. | “Asynchronous reactions” and the bus mechanism are implementation choices, not required v2 semantics. | The example is concrete and its `produced by`, `transitions`, and `triggers-cross` claims align with current endpoint types when expressed in canonical direction. |
| 13 | `implementation/domainspec/architecture/pattern-library/concepts/backend/mapping.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | `projects/domainspec-v2/impl/spec/meta-types/connective/mapping.schema.yml` | `staged-review` | Pure, explicit field-by-field transformation is a useful authoring intent. | The example violates its own no-hidden-default rule with `customerId: "unknown"`, uses an unsafe status cast, and claims `shapes -> View Model`, which is not admitted for Mapping. | It is valuable negative/review evidence, but unsafe as direct implementation guidance until the example and relationship claim are corrected. |
| 14 | `implementation/domainspec/architecture/pattern-library/concepts/backend/state-machine.md` | `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` | `projects/domainspec-v2/impl/spec/meta-types/lifecycle/state-machine.schema.yml` | `staged-review` | Explicit allowed-transition table, invalid-transition rejection, and a pure transition function. | The card authors `State Machine --reflects--> State Indicator`; current DS-D8 admits `State Indicator --reflects--> State Machine` and rejects the reverse direction. The example also omits guards, effects, and invariants named by the current code pattern. | Lakatos downgraded this row because a card containing a directionally invalid relationship cannot be evidence-ready as a whole. The transition-table slice remains useful review material. |

## Disagreement and adjudication

Abramsky classified 6 cards as `evidence-ready`, 7 as `staged-review`, and 1 as
`reject-or-superseded`, emphasizing concrete authoring utility. Noether
classified all 13 current-type matches as `staged-review` and the Saga card as
`reject-or-superseded`, emphasizing that the global commit pin did not yet
provide per-card source-to-destination/status accounting and that similarity
cannot establish authority.

Turing reconciled the positions by making `evidence-ready` a narrow staging
classification rather than an admission or promotion claim. The exact source
must be commit-pinned, the reusable slice must be non-vacuous, and that slice
must contain no unresolved DS-D1 or DS-D8 contradiction. The parent Task
Session must still materialize per-card provenance. This produced a pre-review
6/7/0/1 matrix.

Popper returned **REVISE** without changing the pre-review totals. Calculation
may remain ready only for its explicit function boundary, supplied rate, and
Value Object return; its constants claim and `Number(...toFixed(2))` arithmetic
are excluded. Interface may remain ready only for its thin controller, injected
operation, delegation, and response shape; DTO validation is unresolved because
the example passes `req.body` through directly.

Lakatos returned **REVISE** and downgraded State Machine from `evidence-ready`
to `staged-review` because the card reverses the admitted `reflects`
relationship. That correction establishes the final totals: **5
`evidence-ready`, 8 `staged-review`, 0 `deferred`, and 1
`reject-or-superseded`**.

## Saga is not the dropped app-builder pipeline

`implementation/domainspec/architecture/pattern-library/concepts/backend/saga.md`
is a v1 domain concept card. Its independent Saga type is rejected or
superseded here, while narrowly scoped compensation residue may be reviewed
under Workflow with `scope=cross-feature`.

The separately dropped `domainspec-pipeline` is an app-builder capability. Its
DROP does not prove that Saga collapses into Workflow, and Saga residue cannot
rehabilitate that pipeline capability. These are separate artifacts and
separate decisions.

## Executable parent Task Session handoff

1. Create a non-authoritative v2 backend-card staging matrix containing these
   exact 14 rows, primary states, evidence scopes, residue, current
   counterparts, full v1 paths, and commit pin.
2. Add source-to-destination/status accounting to
   `projects/domainspec-v2/IMPORT-MANIFEST.md` as needed so each card has
   explicit provenance; do not treat an evidence link or staging row as an
   authority transfer or DS-D1 promotion.
3. Preserve `implementation/domainspec` as read-only. Do not rewrite or
   normalize the v1 cards.
4. Run the parent task's `validate:docs` gate after its authorized writes and
   retain the validation evidence in the Task Session receipt.
5. Do **not** close the Craft card-triage gap after SWU-R3C-005 alone. Close it
   only after SWU-R3C-006 also completes with its own receipt.
