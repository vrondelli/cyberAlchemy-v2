# DomainSpec reconciliation charter

Status: **candidate current-state contract**, DSR-003. Authority effect: none.
This charter is not a release promise, canonical amendment or owner admission.
Its machine-readable companion is [support-matrix.json](support-matrix.json).

## Outcome

Make each DomainSpec capability traceable from its intended meaning to its
source, generated code, runtime boundary, tests and exact package. Preserve
working and accepted implementations while making their differences visible.

Three outcomes remain separate:

1. **Inventory-reconciled:** every capability has evidence, state, owner role,
   consumer, disposition and next action. Missing history remains explicit.
2. **Tested-product-reconciled:** every selected supported promise works through
   the required end-to-end path in an exact tested package. Documenting a broken
   promise as unsupported does not satisfy that promise.
3. **Canonically-reconciled:** separately authorized owners admit changes after
   exact product testing and product approval. Neither a matrix nor a passing
   validator grants that authority.

These are the existing DEC-01 candidate definitions, not a new recorded owner
selection. Closing the final support/release contract still requires its owner
decision. Publication and deployment are separate.

## Seven independent states

| State | Evidence required | What it does not establish |
| --- | --- | --- |
| Authored | An explicit contract, source form or advertised command | Successful compilation or execution |
| Canonical | An exact governing definition/signature or owner-bound admission | Implementation of every described behavior |
| Implemented | Identified code path, with profile/language limits | Complete behavior or current test success |
| Tested | A result bound to exact inputs, toolchain and case denominator | Acceptance, publication or production safety |
| Accepted | Owner decision bound to an immutable candidate | Acceptance of later working-tree changes |
| Packaged | Exact archive and member identity | Source equivalence, installation success or publication |
| Published | Exact distribution/provenance evidence | Deployment, adoption or production readiness |

`not-established` means the selected evidence does not establish a claim; it is
not proof that an event never occurred. `not-run-current` means product tests
were not rerun for this matrix. Historical reports stay historical. No row uses
a blanket PASS, and no version string substitutes for these states.

Every row carries all seven states and source references. The conservative
`packaged: inspect-evidence-counterpart` state points to the separate
`package_counterparts` and `package_states` sections: a packaged module can exist
while current dependency closure remains unaccepted and untested.

## Scope and denominators

The selected core/CLI matrix covers 13 backend types, 39 TypeScript/Python/Rust
realizations, 31 canonical relationship signatures, 24 dispatched commands,
25 selected profiles and 247 profile/type/language cells. The 24 commands are
21 advertised stable commands, one advertised experimental command and two
dispatcher-only candidates. Fourteen UI or mixed relationship signatures are
accounted for but excluded from the v1 CLI release; 17 are backend signatures.

Profile families remain distinct: core source bodies, typed contracts, static
calculation semantics, exact UInt64 realization, application output layout,
composition/portability, provider-neutral formation, host runtime, candidate
application ontology, candidate composition extensions and minted-project
formation. A minted-project profile is not automatically a CLI realization flag.
Host runtime and language-independent formation are not extra output languages.

This is not the entire historical/research portfolio inventory. DSR-002 and
DSR-041 own that denominator and disposition. Additional profiles discovered
there must be added explicitly, not hidden under an existing row.

## How combinations are represented

The matrix is normalized rather than duplicating one status thousands of times.
Each `cells` row names a profile, type, language, declared command consumers,
seven states and evidence references. `resolveCombination` in
[matrix.mjs](matrix.mjs) is a total lookup:

- A declared cell/command combination returns `source-applicability-only` with
  all seven states. This does not assert semantic test coverage.
- A combination outside the declared dimensions or consumers returns
  `not-applicable` with a reason. It is not a passing product test.
- Product-level commands such as `doctor`, `capabilities` and recipe commands
  retain their own command rows; arbitrary per-type profiles are not invented
  for them. Library-only runtime profiles are explicitly not CLI commands.

The validator exercises all 39,000 selected type/language-context/profile/command
queries. That is lookup coverage, not 39,000 product behavior tests. DSR-018 and
DSR-029 must expand selected real promises into their positive/negative cases.

## Important current distinctions

| Surface | Current evidence | Reconciliation work |
| --- | --- | --- |
| Entity / Value Object / Enum | Separate canonical meanings; some share typed-record or sum representation | Preserve identity, value, variant and field/cardinality distinctions; no automatic database-table meaning |
| Query | Typed row evaluator and typed read-only closure exist; untyped TS/Python copies state, Rust panics | Define profile-specific behavior and cross-language proof |
| Calculation | Numeric evaluators exist; current graph validation requires an outgoing `calculates` edge | Reconcile pure standalone use without fabricated consuming Operations |
| Rule / Policy | Typed Rule is Boolean; static Policy uses Rule references while typed Policy has inline predicates | Preserve the two existing forms and select the intended composition contract |
| Mapping | Explicit field/source/target contracts exist | Keep computed inputs distinct from canonical relationship admission |
| State Machine | Transition helper exists; incoming Event is bound against `effect_event_ref` | Separate trigger from emitted effect |
| Workflow | Orchestration/recovery models and in-process recovery helpers exist | Separate target identity, occurrence identity and durable dispatch |
| Relationships | All 31 signatures are accounted for; current CLI has bounded backend checks | Reconcile BMC facets, multiplicities and ownership/membership axes |
| Composition | Project certificate includes compositions; checked interchange rejects them | Close assurance/runtime integration without implying a new canonical graph verb |
| Application commands | `application-check` / `application-build` are in the dispatcher, absent from capability/help lists | Reconcile metadata, candidate test coverage and packaging |
| Storage / UI | Candidate application bindings exist | Supplied SQL and UI assets do not imply DDL generation or canonical UI admission |

All ten identified gaps have evidence and next work-item IDs in the matrix.
The four candidate test suites for outbound composition, request custody,
service security and stream lifecycle are absent from the default test script.
This unit records that gap; it does not change the test aggregate.

## Package and source identity

The accepted successor is DSV2-CLI-SUCCESSOR-002, with exact archive digest
`c7c785282f82cb5435efedc202d62cd37c604ac7dff7d610307dfecd19de9d9c`.
Its later acceptance decision controls acceptance; its earlier immutable
candidate file still says awaiting acceptance and must not be rewritten.

Thirteen of its 199 source-manifest members now differ. The old manifest also
cannot cover newly added files. Current working source is therefore not silently
the accepted product. The output-layout release candidate has a separate archive
and still records pending product acceptance. No publication is established by
the selected records.

## Construction and operational boundaries

DSR-003 authors this candidate view only. Its predecessor DSR-001 remains intact.
Next product work is DSR-006: a candidate Definition Pack using existing meanings
and the distinctions captured here; then DSR-007's minimum Entity/Query proof.
DSR-002 portfolio inventory and DSR-004/005 recovery remain separate work, not
implicit blockers for that minimum proof. No helper was dispatched.

The write envelope is this contracts directory and exact DSR-003/frontier
synchronizations in PLAN.md and WORK-ITEMS.json. No compiler, canonical source,
frozen candidate, DSR-001 artifact, Git index, commit or external state is changed.

## Open Questions

Product decisions are owned by [DECISIONS.md](../DECISIONS.md), particularly
DEC-01 and DEC-04 through DEC-08. This document is an internal candidate contract,
not user-facing release documentation. Its validation cannot select those
decisions or promote an unsupported syntax/profile into the product.
