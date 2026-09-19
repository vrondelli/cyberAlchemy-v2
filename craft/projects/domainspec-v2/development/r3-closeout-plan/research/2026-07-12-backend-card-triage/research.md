---
dispatch_id: 2026-07-12-r3c-backend-card-triage
artifact_role: verbatim-explorer-transcript
status: collected
created: 2026-07-12
---

# SWU-R3C-005 Backend-Card Triage — Explorer Returns

## Agent 1 — Abramsky, Samson

Read-only inventory complete; no validators executed and no files changed.

Current v2 has 13 registered backend candidates. Their `.schema.yml` files are the machine source of truth for shape, while deeper semantic authority remains confirmation-gated. The v1 cards therefore have possible implementation utility but no authority by copy alone.

| v1 card | Distinctive guidance / example | Dependencies and stale assumptions | Closest current v2 schema / definition | Utility vs authority | Restates schema? | Proposed state |
|---|---|---|---|---|---|---|
| `implementation/domainspec/architecture/pattern-library/concepts/backend/calculation.md` | Pure deterministic formula; isolate constants; return VOs. `calculateFee(Money, rate)`. | `calculates -> Operation` matches DS-D8. `Number`/`toFixed` is runtime-specific money arithmetic, not reusable authority. | `projects/domainspec-v2/impl/spec/meta-types/behavioral/calculation.schema.yml`; DS-D1.6 in `projects/domainspec-v2/definitions/meta-types/meta-types.yml` | High implementation-example utility; zero authority. | No—adds concrete TS/formula practice. | **evidence-ready** |
| `implementation/domainspec/architecture/pattern-library/concepts/backend/entity.md` | Immutable entity type; explicit transition functions guarded by rules/state machine. Payment lifecycle example. | `performs`, `contains`, `emits` all match active DS-D8. Claims mutation history, but example records none; this is an implementation gap, not a schema conflict. | `projects/domainspec-v2/impl/spec/meta-types/structural/entity.schema.yml`; DS-D1.1 | Strong authoring example; v2 schema alone owns shape criterion. | No—adds transition/code guidance. | **evidence-ready** |
| `implementation/domainspec/architecture/pattern-library/concepts/backend/enum-type.md` | Prefer TS unions; centralize finite values. `PaymentStatus`. | Relationship block is stale: v2 Enum has no edge participation; `transitions` targets State Machine from Event, and `reflects` targets State Machine from State Indicator. | `projects/domainspec-v2/impl/spec/meta-types/structural/enum.schema.yml`; DS-D1.3 | Useful language-level example; relationship prose is unsafe. | No—adds union authoring convention. | **staged-review** |
| `implementation/domainspec/architecture/pattern-library/concepts/backend/event.md` | Typed past-tense payload; publish after postconditions; bus example. | `produces`, `transitions`, `triggers-cross` align with active DS-D8. “Asynchronous reactions” is narrower than v2’s general past-fact criterion. | `projects/domainspec-v2/impl/spec/meta-types/connective/event.schema.yml`; DS-D1.12 | Good event-authoring evidence; async mechanism remains non-authoritative. | No—adds naming, payload, publication timing. | **evidence-ready** |
| `implementation/domainspec/architecture/pattern-library/concepts/backend/interface.md` | Thin boundary/controller; DTO validation; delegate business logic. HTTP controller example. | `exposes -> Operation|Query` and `contracts <- Form` match active DS-D8. Example says validation but does not demonstrate it. | `projects/domainspec-v2/impl/spec/meta-types/connective/interface.schema.yml`; DS-D1.11 | Useful adapter-line guidance; does not define `interface_kind`. | No—adds boundary implementation form. | **evidence-ready** |
| `implementation/domainspec/architecture/pattern-library/concepts/backend/mapping.md` | Pure explicit field mapper; avoid hidden defaults. Row-to-entity example. | `maps -> Entity|Interface` aligns. `shapes -> View Model` is invalid for Mapping; DS-D8 assigns `shapes` to Adapter. Example also violates its own rule via `customerId: "unknown"` and unsafe status cast. | `projects/domainspec-v2/impl/spec/meta-types/connective/mapping.schema.yml`; DS-D1.13 | Valuable negative/review evidence; unsafe as direct guidance. | No—adds field-level code, albeit flawed. | **staged-review** |
| `implementation/domainspec/architecture/pattern-library/concepts/backend/operation.md` | DI factory; rules first; persist then publish; payment mutation example. | `enforced by`, `produces`, `exposed by` align. `uses Calculation` is not a DS-D8 verb; canonical direction is `Calculation --calculates--> Operation`. Example bypasses an explicit state-machine transition. | `projects/domainspec-v2/impl/spec/meta-types/behavioral/operation.schema.yml`; DS-D1.4 | Strong implementation seed, but relation vocabulary and lifecycle handling need review. | No—adds sequencing and side-effect practice. | **staged-review** |
| `implementation/domainspec/architecture/pattern-library/concepts/backend/policy.md` | Pure runtime strategy selector; separate choice from execution. Gateway selection example. | `applies -> Operation` aligns, but “used by Workflow decision points” has no current DS-D8 signature; `applies` targets only Operation or Calculation. | `projects/domainspec-v2/impl/spec/meta-types/behavioral/policy.schema.yml`; DS-D1.8 | Good Rule-vs-Policy implementation discriminator; dependency prose is partly stale. | No—adds executable selector pattern. | **staged-review** |
| `implementation/domainspec/architecture/pattern-library/concepts/backend/query.md` | DI read function; side-effect-free retrieval; API-friendly result. Payment status example. | `queries -> Entity`, `exposed by Interface`, and `fetched by Binding` all match active DS-D8. | `projects/domainspec-v2/impl/spec/meta-types/behavioral/query.schema.yml`; DS-D1.5 | Strong aligned implementation evidence; no authority transfer. | No—adds read-side factory/result-shape guidance. | **evidence-ready** |
| `implementation/domainspec/architecture/pattern-library/concepts/backend/rule.md` | One-intent pure predicate plus assertion wrapper. Max-amount example. | `enforces -> Operation` and `mirrors <- Guard` align. `enforces-cross` is superseded: cross-feature enforcement is metadata on `enforces`, and the old label must be rejected. | `projects/domainspec-v2/impl/spec/meta-types/behavioral/rule.schema.yml`; DS-D1.7 | Predicate example is useful; relationship block cannot be admitted unchanged. | No—adds predicate/assertion authoring. | **staged-review** |
| `implementation/domainspec/architecture/pattern-library/concepts/backend/saga.md` | Participant boundaries; forward/compensation steps; retry/dead-letter decisions. Settlement rollback example. | No current registered Saga schema. Current registry has 13 backend members; closest admitted model is Workflow with `scope: cross-feature`. Existing evidence found no non-circular Saga-only formation witness. | `projects/domainspec-v2/impl/spec/meta-types/behavioral/workflow.schema.yml`; evidence: `projects/domainspec-v2/development/ds-d1-improvement-plan/research/2026-07-11-saga-existing-evidence-adjudication/findings.md` | Compensation guidance remains useful research residue; it has no standalone current node authority. | No schema exists to restate. | **reject-or-superseded** |
| `implementation/domainspec/architecture/pattern-library/concepts/backend/state-machine.md` | Explicit allowed-transition table; reject invalid moves; pure transition function. | `transitions <- Event` and `reflects <- State Indicator` match active DS-D8. Example omits guards/effects/invariants named by the current schema’s code pattern, but does not contradict its shape criterion. | `projects/domainspec-v2/impl/spec/meta-types/lifecycle/state-machine.schema.yml`; DS-D1.14 | Strong minimum implementation exemplar; incomplete as a semantic model. | No—adds executable transition table. | **evidence-ready** |
| `implementation/domainspec/architecture/pattern-library/concepts/backend/value-object.md` | Readonly type; factory validation; pure operations. `Money` example. | `contains <- Entity` and `maps <- Mapping` align. Current v2 criterion requires an explicit Equality clause; example only implies value equality and therefore is insufficient as formation evidence. | `projects/domainspec-v2/impl/spec/meta-types/structural/value-object.schema.yml`; DS-D1.2 | Useful constructor pattern, but incomplete against current criterion. | No—adds factory/validation code. | **staged-review** |
| `implementation/domainspec/architecture/pattern-library/concepts/backend/workflow.md` | Ordered/branched operation orchestration; undo stack and compensation. Fulfillment example. | `orchestrates -> Operation[]` aligns. Purpose says “within one feature,” but current Workflow admits intra- or cross-feature scope. `applies <- Policy` is unsupported because Policy applies only to Operation or Calculation. | `projects/domainspec-v2/impl/spec/meta-types/behavioral/workflow.schema.yml`; DS-D1.9 | Excellent orchestration/compensation example; scope and relationship prose require reformulation. | No—adds concrete compensation mechanics. | **staged-review** |

Summary: 6 **evidence-ready**, 7 **staged-review**, 0 **deferred**, 1 **reject-or-superseded**. None of the 14 cards is merely a schema restatement; all add code-level guidance or examples, though several contain stale relationship claims that prevent direct admission.

## Agent 2 — Noether, Emmy

### Admission boundary

The current boundary admits 13 backend candidate types: `DS-D1.1..9` and `DS-D1.11..14`; `DS-D1.10` is intentionally absent. Schema presence proves checked shape, not semantic authority, and promotion remains owner-gated (`projects/domainspec-v2/definitions/meta-types/meta-types.md:8-22`).

A v1 card is not `evidence-ready` merely because its title matches. The allowed evidence set contains no v1 card bodies, so criterion compatibility cannot be proven. The defensible result is 13 `staged-review` and one `reject-or-superseded`. This follows the task’s own state definitions (`TASK-R3C-CARDS.md:24-31`).

Provenance code used below: **P1** = globally commit-pinned to v1 commit `33859b…`, but no per-card source→destination/verdict/status row exists in the manifest. The manifest requires such row-level accounting (`IMPORT-MANIFEST.md:2-19`); SWU-R3C-005 likewise requires all 14 cards to have provenance (`TASK-R3C-CARDS.md:35-44`).

| # | v1 backend card | Current type alignment | Criterion compatibility against machine boundary | Provenance | Triage |
|---:|---|---|---|---|---|
| 1 | Entity | Exact: `DS-D1.1`, structural | Conditional: typed fields and ≥1 truthy `Identity` (`entity.schema.yml:12-23`) | P1 | `staged-review` |
| 2 | Value Object | Exact: `DS-D1.2`, structural | Conditional: no identity, all types nonempty, Equality clause (`value-object.schema.yml:9-22`) | P1 | `staged-review` |
| 3 | Enum | Exact: `DS-D1.3`, structural | Conditional: machine schema checks a `Value` column; prose additionally claims ≥1 row, which the schema does not state | P1 | `staged-review` |
| 4 | Operation | Exact: `DS-D1.4`, behavioral | Conditional: `state_change=yes` | P1 | `staged-review` |
| 5 | Query | Exact: `DS-D1.5`, behavioral | Conditional: `state_change=no` | P1 | `staged-review` |
| 6 | Calculation | Exact: `DS-D1.6`, behavioral | Conditional: `formal_return_type=value` | P1 | `staged-review` |
| 7 | Rule | Exact: `DS-D1.7`, behavioral | Conditional: `formal_return_type=boolean` | P1 | `staged-review` |
| 8 | Policy | Exact: `DS-D1.8`, behavioral | Conditional: `formal_return_type=strategy` | P1 | `staged-review` |
| 9 | Workflow | Exact: `DS-D1.9`, behavioral | Conditional: `scope` exactly `intra-feature` or `cross-feature` | P1 | `staged-review` |
| 10 | Orchestration | No current meta-type; occupies the retired `.10` gap by inference from the 14→13 delta | Incompatible as an independent type. Multi-step coordination must be recast as scoped Workflow; app-builder pipeline orchestration is separately DROP | P1; no card row | `reject-or-superseded` |
| 11 | Interface | Exact: `DS-D1.11`, connective | Conditional: machine schema checks only presence of `interface_kind`; prose narrows values, creating review residue | P1 | `staged-review` |
| 12 | Event | Exact: `DS-D1.12`, connective | Conditional: `temporal=past` | P1 | `staged-review` |
| 13 | Mapping | Exact: `DS-D1.13`, connective | Conditional: machine schema checks only presence of `direction`; prose narrows values, creating review residue | P1 | `staged-review` |
| 14 | State Machine | Exact: `DS-D1.14`, lifecycle | Conditional: `has_transitions=yes` | P1 | `staged-review` |

Key distinction: the retired Orchestration card is not automatically the same artifact as the dropped pipeline capability. Its reusable concept evidence may be reviewed under Workflow, but only after it declares one admitted ownership-boundary scope. No validators were executed.

## Agent 3 — Turing, Alan

Turing reconciled the explorer disagreement by defining `evidence-ready` as a
staging classification only: the source must add non-vacuous implementation
guidance, the material linked must contain no unresolved DS-D1/DS-D8
contradiction, and the exact source must remain pinned to v1 commit
`33859b561dc34e3d0b9cb3da76b6cb3d196daa65`. It does not transfer authority or
promote a DS-D1 candidate. The parent must still materialize per-card
source-to-staging provenance.

Turing proposed the following matrix before adversarial review:

| # | v1 source | Proposed state | Synthesis rationale |
|---:|---|---|---|
| 1 | `backend/entity.md` | `evidence-ready` | Immutable type and explicit transition-function example; active `performs`, `contains`, and `emits`; mutation-history claim remains a caveat. |
| 2 | `backend/value-object.md` | `staged-review` | Factory and pure-operation guidance is useful, but the current Equality criterion is not demonstrated. |
| 3 | `backend/enum-type.md` | `staged-review` | Union-type example is useful; `transitions` and `reflects` relationship claims contradict DS-D8. |
| 4 | `backend/operation.md` | `staged-review` | Sequencing is concrete; `uses Calculation` is non-canonical and the example bypasses state-machine discipline. |
| 5 | `backend/query.md` | `evidence-ready` | Injected read function and API result add implementation form and align with active relationships. |
| 6 | `backend/calculation.md` | `evidence-ready` | Pure formula/function boundary and Value Object return add implementation form; runtime-specific money arithmetic is not authority. |
| 7 | `backend/rule.md` | `staged-review` | Predicate/assertion example is useful, but `enforces-cross` is deprecated. |
| 8 | `backend/policy.md` | `staged-review` | Runtime selector is useful; the claimed Workflow relationship is not admitted. |
| 9 | `backend/workflow.md` | `staged-review` | Undo/compensation mechanics are useful; scope and Policy relationship claims require reformulation. |
| 10 | `backend/saga.md` | `reject-or-superseded` | No standalone current type; residue may be reviewed only under explicitly scoped Workflow. |
| 11 | `backend/interface.md` | `evidence-ready` | Thin controller and delegation are concrete; DTO validation is stated but not demonstrated. |
| 12 | `backend/event.md` | `evidence-ready` | Typed past-tense payload and postcondition publication are concrete and aligned; async is implementation-specific. |
| 13 | `backend/mapping.md` | `staged-review` | Pure mapping is useful, but hidden defaults, unsafe cast, and `shapes` claim are unsafe. |
| 14 | `backend/state-machine.md` | `evidence-ready` | Transition table and invalid-move rejection are concrete; guards/effects/invariants are incomplete. |

Pre-review total: 6 `evidence-ready`, 7 `staged-review`, 0 `deferred`, 1
`reject-or-superseded`.

Turing also preserved the distinction between `saga.md` and the separately
dropped `domainspec-pipeline` app-builder capability. Neither can establish an
independent Saga or Orchestration meta-type.

## Agent 4 — Popper, Karl

Verdict: **REVISE**, without changing the pre-review totals.

- Calculation may remain `evidence-ready` only for the explicit function
  boundary, supplied rate, and Value Object return. The card does not
  demonstrate isolated constants, and `Number(...toFixed(2))` must be excluded
  from reusable money guidance. If staging cannot scope the useful evidence
  away from that arithmetic, the row must become `staged-review`.
- Interface may remain `evidence-ready` for the thin controller, injected
  operation, delegation, and boundary response shape. DTO validation is an
  instruction contradicted by the example's direct `req.body` pass-through, so
  it is unresolved residue rather than demonstrated evidence.
- Entity, Query, Event, and State Machine passed the non-vacuity test.
- Every finding remains staging evidence only.

## Agent 5 — Lakatos, Imre

Verdict: **REVISE**.

1. Change State Machine from `evidence-ready` to `staged-review`. The v1 card
   authors `State Machine --reflects--> State Indicator`, while DS-D8 admits
   `State Indicator --reflects--> State Machine` and explicitly rejects the
   reverse direction.
2. Revised totals: 5 `evidence-ready`, 8 `staged-review`, 0 `deferred`, 1
   `reject-or-superseded`.
3. Entity, Query, Calculation, Interface, and Event remain implementation/example
   evidence only; none proves DS-D1 formation.
4. Every staging row must record the exact v1 path and commit
   `33859b561dc34e3d0b9cb3da76b6cb3d196daa65`.
5. `saga.md` is the v1 Saga concept card, not an Orchestration card or inferred
   `DS-D1.10`. Its compensation residue may survive only under Workflow with
   explicit `scope=cross-feature`; deprecated `enforces-cross` must not survive.
6. The separately dropped `domainspec-pipeline` is an app-builder capability.
   Its DROP does not prove the Saga collapse, and Saga residue cannot
   rehabilitate it.

No reviewer changed files or ran validators.
