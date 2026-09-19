---
module: ui-meta-type-formalization
artifact_id: UIF-HYPOTHESIS-MATRIX-v0.1
status: frozen-experiment-input
updatedAt: 2026-07-11
created_by: SWU-UIF-001
authority_boundary: candidate hypotheses only; all labels remain formation-deferred
next_consumer: SWU-UIF-002
---

# UI Candidate Hypothesis Matrix v0.1

## Use Boundary

This matrix freezes falsifiable inputs for later experiments. It does not define,
approve, rank, or promote any UI meta-type. Every formation hypothesis below is
an inference from candidate prose, UI11 review evidence, active DS-D8 pressure,
and the public structural-validation method.

Allowed witness classes:

- `structural-table`: bounded authored structure that a table-walk validator can
  inspect;
- `exercised-ds-d8-edge`: a concrete instance exercises an active root signature;
  raw edge-set difference is insufficient; and
- `separating-fixture`: the same candidate criterion accepts the candidate and
  rejects or reroutes a named neighbor.

The provisional outcomes are `candidate-schema-ready`, `merge-candidate`,
`relation-not-node`, `framework-vocabulary`, `split-candidate`, and
`defer-evidence-gap`. This SWU selects none of them.

## Matrix

| ID | Label | Formation hypothesis | Nearest neighbors | Allowed witness pressure | Forbidden shortcuts | Possible outcomes | Correction route | Source pressure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DS-D1.15 | Page | A terminal navigable route that owns primary content, names its layout/access context, and renders an inventory of UI units may separate Page from Component and Layout. | Component; Layout; framework route segment | structural route/content table; exercised `renders`, `wraps`, or `protects`; separating route/shell/unit fixtures | route-path string alone; filename convention; `renders` endpoint use alone | candidate-schema-ready; merge-candidate; framework-vocabulary; split-candidate; defer-evidence-gap | No terminal route -> Component; shell/slot ownership -> Layout; framework-only segment -> framework vocabulary. | UI11 Page construction/collapse attacks; DS-D8 `renders`, `wraps`, `protects` |
| DS-D1.16 | Layout | A shell that owns named content slots and shared chrome, carries no page-specific primary content, and wraps pages may separate Layout from Page and Component. | Page; Component; app shell convention | structural slot/region/chrome table; exercised `wraps`; separating shell/page/unit fixtures | reuse claim alone; CSS arrangement; file/folder convention; `wraps` edge alone | candidate-schema-ready; merge-candidate; framework-vocabulary; split-candidate; defer-evidence-gap | Owns terminal content -> Page; no stable slots/shell contract -> Component or framework vocabulary. | UI11 Layout construction/collapse attacks; DS-D8 `wraps` |
| DS-D1.17 | Component | A non-routable visual unit with typed inputs/outputs and no independent route, domain-data, validation, or access authority may survive as a narrow fallback type rather than an umbrella for all UI constructs. | Page; Layout; Form; Guard; State Indicator | structural props/callback/slot table; exercised `renders`, `composes`, `consumes`, or `displays`; separating specialized-type fixtures | `component_kind` tag alone; framework component declaration; edge presence alone; broad reusable-unit prose | candidate-schema-ready; merge-candidate; framework-vocabulary; split-candidate; defer-evidence-gap | Independent route -> Page; validation/submission aggregate -> Form; access gate -> Guard; state-to-visual map -> State Indicator; no narrow law -> framework vocabulary. | UI11 Component supertype attack; DS-D8 `renders`, `composes`, `consumes`, `displays` |
| DS-D1.18 | View Model | A typed, display-scoped shape with explicit domain/query sources and display-only selection, formatting, or computed fields may separate View Model from Value Object, Query projection, and Adapter output. | Value Object; Query projection; Adapter; Mapping | structural field/source/display-purpose table; exercised `derives`, `displays`, or `shapes`; separating domain/display/transform fixtures | `display_context` tag alone; DTO naming; any `derives` edge alone; non-authoritative prose without field evidence | candidate-schema-ready; merge-candidate; relation-not-node; framework-vocabulary; defer-evidence-gap | Domain equality/identity -> Value Object or Entity; raw retrieval -> Query projection; transform procedure -> Mapping/Adapter; no durable record -> relation/read model. | UI11 View Model overlap attack; DS-D8 `derives`, `displays`, `shapes` |
| DS-D1.19 | Hook | A framework-neutral reactive contract with typed inputs/returns and explicit state, effect, lifecycle, or resource behavior may separate Hook from Binding, Action, and a plain utility. | Binding; Action; local-state utility; framework hook | structural input/return/effect/lifecycle table; exercised `consumes`; cross-framework separating fixtures | `useX` naming; React API call alone; self-declared hook kind; component-consumes edge alone | candidate-schema-ready; merge-candidate; relation-not-node; framework-vocabulary; defer-evidence-gap | Endpoint connection only -> Binding/relation; named user intent -> Action; no neutral contract -> framework vocabulary; pure utility -> existing code-level vocabulary. | UI11 Hook framework-specificity attack; DS-D8 `consumes` |
| DS-D1.20 | Form | A user-input aggregate with typed fields, validation/error contracts, a submission action, and an aligned interface may separate Form from a generic Component and Interface. | Component; Interface; Action | structural field/validation/error/submission table; exercised `submits` and `contracts`; separating valid/plain-component fixtures | form element or filename alone; schema-ref tag alone; `submits` endpoint use without field/validation structure | candidate-schema-ready; merge-candidate; relation-not-node; split-candidate; defer-evidence-gap | No validation/submission aggregate -> Component; boundary contract only -> Interface; trigger/outcome only -> Action. | UI11 Form strongest construction pressure and collapse attack; DS-D8 `submits`, `contracts` |
| DS-D1.21 | Action | A named user intent with trigger, target kind, effect boundary, and observable success/error/navigation outcome may separate Action from a passive handler, Binding, and backend Operation. | event handler; Binding; Operation; Hook | structural intent/trigger/target/outcome table; exercised `submits` as target plus future relationship request if needed; separating UI/backend/passive fixtures | click-handler existence; imperative function name; self-declared target; backend mutation semantics inferred from code | candidate-schema-ready; merge-candidate; relation-not-node; framework-vocabulary; defer-evidence-gap | Backend state-changing domain contract -> Operation; endpoint connector -> Binding; reactive behavior -> Hook; passive handler -> framework vocabulary. | UI11 Action target-signature gap and broad-handler attack; DS-D8 target of `submits` |
| DS-D1.22 | Guard | A non-authoritative UI gate with a protected surface, source rule/permission, finite condition inputs, and fallback behavior may separate Guard from the authoritative Rule and a wrapper Component. | Rule; Component wrapper; route middleware convention | structural protected-target/condition/source/fallback table; exercised `protects` and `mirrors`; separating UI-gate/backend-rule fixtures | condition tag alone; client-side authorization claim; wrapper naming; edge presence without fallback/source evidence | candidate-schema-ready; merge-candidate; relation-not-node; framework-vocabulary; defer-evidence-gap | Authoritative business/access decision -> Rule; surface wrapper without durable contract -> Component or relation; framework middleware only -> framework vocabulary. | UI11 Guard Rule-projection attack; DS-D8 `protects`, `mirrors` |
| DS-D1.23 | Binding | A durable UI integration record with source surface, exactly one query/mutation endpoint mode, parameter/result mapping, and cache/trigger/invalidation behavior may separate Binding from Hook and a pure relationship. | Hook; DS-D8 connection; Mapping; Action | structural endpoint-mode/mapping/cache table; exercised `fetches` or `mutates`; separating node-record/relation fixtures | endpoint edge alone; hook name; both fetch/mutate without mode; cache tag without a durable record | candidate-schema-ready; merge-candidate; relation-not-node; framework-vocabulary; defer-evidence-gap | Connection with no durable record -> relation-not-node; reactive lifecycle contract -> Hook; pure shape transform -> Mapping; named user intent -> Action. | UI11 Binding noun-versus-relation attack; DS-D8 `fetches`, `mutates` |
| DS-D1.24 | Adapter | A UI-boundary transform with explicit source/target schemas, field mapping, formatting/lossiness rules, and a produced display shape may separate Adapter from Mapping only if the boundary changes the constructible contract. | Mapping; View Model; Binding | structural source/target/field-transform table; exercised `shapes`; separating UI/general transform fixtures | `boundary=ui` tag alone; adapter naming; purity claim; `shapes` edge alone | candidate-schema-ready; merge-candidate; relation-not-node; framework-vocabulary; defer-evidence-gap | Same constructible law as Mapping -> Mapping with UI metadata; no transform table -> defer; endpoint behavior -> Binding; output record only -> View Model. | UI11 Adapter collapse attack; existing Mapping candidate; DS-D8 `shapes` |
| DS-D1.25 | State Indicator | A complete state-to-visual mapping over a declared domain state source may separate a domain State Indicator from a generic Component, while loading/error/empty request state may require a distinct split or remain a component role. | Component; Enum; State Machine; async request state | structural state/value-to-visual coverage table; exercised `reflects`; separating domain-state/async-state/generic-component fixtures | badge/spinner naming; color/icon presence alone; `reflects` edge without coverage; conflating domain and request state | candidate-schema-ready; merge-candidate; framework-vocabulary; split-candidate; defer-evidence-gap | Generic visual unit -> Component; domain state model -> Enum/State Machine source plus UI projection; async state mismatch -> split-candidate or framework vocabulary. | UI11 State Indicator meaning conflict; DS-D8 `reflects` |

## Coverage And Freeze

- Labels covered: 11 of 11 (`DS-D1.15` through `DS-D1.25`).
- Current status of every label: formation-deferred.
- Outcome selections: none.
- Criteria/schema selections: none.
- Corpus/fixture selections: none; owned by `SWU-UIF-002`.
- Freeze rule: downstream changes to a hypothesis, neighbor, witness class, or
  expected outcome must version this matrix and invalidate affected registered
  expectations before experiment execution.

## Source References

- `projects/domainspec-v2/development/meta-type-definitions/CANDIDATES.md`
- `projects/domainspec-v2/development/ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/findings.md`
- `projects/domainspec-v2/development/ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/attacks.md`
- `projects/domainspec-v2/development/meta-type-formalization/research/2026-07-02-formalism-and-primitives/findings.md`
- `projects/domainspec-v2/development/meta-type-formalization/research/2026-07-07-node-noncollapse-gate-redteam/findings.md`
- `projects/domainspec-v2/definitions/relationships/relationships.yml`
