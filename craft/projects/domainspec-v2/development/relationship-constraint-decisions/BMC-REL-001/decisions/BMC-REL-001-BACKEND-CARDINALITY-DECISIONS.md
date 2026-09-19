# BMC-REL-001 Backend Cardinality Decisions

Status: `d01-d08-owner-resolved-d08-no-additional-constraint-nonnumeric-pass-pending`

Date opened: `2026-08-22`

Authority effect: `domainspec-v2-local-relationship-authority-only`

Canonical mutation: `queries` replaced by `reads`; active sources narrowed from `Query|Calculation|Operation` to `Query|Operation`; `queries` retained only as a deprecated alias

## Purpose

Resolve the numeric endpoint bounds and related topology semantics for the 16 unresolved backend relationship signatures without deriving cardinality from legacy vocabulary tokens. The existing `creates` relation remains the sole numerically complete precedent at `0..1` on both endpoints. This record also carries the owner-confirmed RQ1 correction that separates the `Query` callable meta-type from the Entity-data dependency named `reads`.

RQ1 changes the local DomainSpec relationship authority and its active projections. The numeric-profile sections remain a decision surface only: they do not change the BMC evidence matrix, select unresolved bounds, register providers, materialize ontology relations, or grant promotion/release authority.

## Evidence bindings

- Canonical relationship authority: `projects/domainspec-v2/definitions/relationships/relationships.yml`, SHA-256 `82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1`.
- Rebased decision packet after the D07 P02 projection closeout: `projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json`, SHA-256 `a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0`.
- Definition authority: `projects/domainspec-v2/definitions/DEFINITIONS.md`, including DS-D8, DomainSpec-v2-D18, and DomainSpec-v2-D27.

## Decision sequence

1. `BMC-REL-D01` — choose the numeric-evidence policy used before relation-specific tightening.
2. `BMC-REL-D02` — define evaluation and behavior-participation closure.
3. `BMC-REL-RQ1` — remove the `Query`/`queries` ambiguity and restore Calculation purity before union-cardinality decisions.
4. `BMC-REL-D03` — after RQ1 rebaseline, decide pooled-versus-per-type aggregation for union endpoints: `exposes`, `applies`, `maps`, and `reads`.
5. `BMC-REL-D04` — distinguish ordered Workflow step occurrences from distinct Operation concepts for `orchestrates`.
6. `BMC-REL-D05` — define Mapping role and arity semantics for `maps`.
7. `BMC-REL-D06` — define ownership topology for `owns`.
8. `BMC-REL-D07` — define membership topology for `belongs-to`, independently from `owns`.
9. `BMC-REL-D08` — decide whether Event provenance requires additional constraints across `produces` and `emits`.

After these decisions, a separate nonnumeric pass must decide duplicate-edge policy, representation of ordered occurrences, inverse-view handling, self-edge and cycle topology, hostile fixtures, and partial-view validation behavior. UI and UI-backend audit-only rows remain outside this backend decision batch.

## BMC-REL-D01 — Numeric evidence policy

Question: What numeric baseline should apply to the 16 backend relationships whose endpoint bounds are currently unresolved?

### `BMC-REL-D01-A-EVIDENCE-MINIMUM` — Evidence-minimum baseline (recommended)

Assign `0..unbounded` to both endpoints as the conservative baseline. Tighten a relationship only when a later named decision supplies explicit semantic evidence for a finite maximum or a positive minimum.

Trade-off: minimizes false rejection and preserves partial repository views, but provides weak enforcement until relation-specific decisions are completed.

### `BMC-REL-D01-B2-ORTHOGONAL-STRICT-PROFILES` — Orthogonal strict relationship profiles (selected)

Define one canonical relationship-constraint profile whose independently owned axes include endpoint degree, role or dimension, closure and completeness, occurrence and order, feature scope, inverse authorship, representation, and concept-versus-runtime cardinality. Every required axis is explicit and machine-readable; unresolved required profiles fail closed before code generation.

The relationship fact is authored once as a canonical edge. One shared evaluator enforces the profile, one projection builder derives noncanonical views, and language generators consume the validated result. Cardinality never silently determines representation: a `0..1` relation may still declare a set-shaped projection, as `creates` currently does.

Trade-off: produces strict, centralized code constraints without collapsing independent semantics, but requires a normalized constraint representation, shared evaluator, explicit closure rules, and relation-specific owner decisions before the remaining profiles can become canonical.

The earlier `BMC-REL-D01-B-SEMANTIC-FAMILY` proposal was superseded before selection because it did not keep the constraint axes sufficiently independent.

### `BMC-REL-D01-C-EXPLICIT-TOKEN-RATIFICATION` — Explicit token ratification

Create a new owner policy that assigns numeric meanings to the existing `one_to_many`, `many_to_one`, and `many_to_many` tokens. The meanings would be explicitly authored and must not be inferred from the current tokens.

Trade-off: familiar notation and compact rules, but it risks overconstraining `belongs-to`, `maps`, and `orchestrates`, whose present examples do not cleanly support naïve token-to-bound conversion.

### `BMC-REL-D01-D-DEFER` — Defer numeric policy

Keep all 16 bounds unresolved and continue only unrelated work.

Trade-off: avoids premature semantics but leaves backend cardinality enforcement incomplete.

### `BMC-REL-D01-E-STOP` — Stop this decision route

Close the cardinality decision effort without selecting a policy.

Trade-off: makes no semantic change and performs no further progress on relationship constraints.

## Recommendation and selection

Selected `BMC-REL-D01-B2-ORTHOGONAL-STRICT-PROFILES`. It generalizes the proven `creates` architecture: one canonical semantic fact, centralized policy, shared enforcement, derived projections, and separate business/runtime responsibilities. Strictness means every independent axis is explicit and fail-closed; it does not mean forcing every relationship toward one-to-one.

## Owner disposition

Selected option: `BMC-REL-D01-B2-ORTHOGONAL-STRICT-PROFILES`

Decision owner: `user`

Decision timestamp: `2026-08-22T21:59:16+01:00`

Decision source: exact confirmation in the active conversation after the B2 architecture and `creates` implementation analogy were explained.

Rationale: keep CAV2-D16/D22/D29 orthogonality in the relationship design, centralize the semantic and enforcement rules, split responsibilities, prevent duplicated authored facts, and make invalid relationship structures unrepresentable or rejected by shared code.

Selection effect: D01 selects the constraint architecture only. It does not select any unresolved numeric bound, closure boundary, role dimension, representation shape, or runtime guarantee. `creates` retains its current canonical `0..1` outgoing, `0..1` incoming, same-feature, concept-level edge and generated set-shaped `creation_targets` projection.

## BMC-REL-D02 — Closure and positive-minimum enforcement

Status: `selected`

Question: What completeness evidence must an evaluator possess before a positive endpoint minimum may reject a relationship graph or permit code generation?

Typing, admitted scope, observed duplicate violations, and observed maximum violations remain independently enforceable whenever their evidence is present. D02 decides only when absence of a required relationship is evidence of invalidity rather than an incomplete view.

### `BMC-REL-D02-A-EXPLICIT-DIRECTIONAL-CLOSURE` — Explicit directional closure (recommended)

Each validation envelope declares its boundary identity and kind, completeness of the eligible source and target populations, and per-relation completeness of outgoing and incoming adjacency.

- Enforce a source-side positive minimum only where outgoing adjacency is closed.
- Enforce a target-side positive minimum only where incoming adjacency is closed.
- Require the relevant endpoint population to be complete for whole-boundary conformance.
- Report an open-view minimum as `not-evaluated-incomplete-closure`, not as valid or invalid.
- Fail code generation when a required positive-minimum proof lacks closure evidence.

Trade-off: provides precise incremental validation and preserves CAV2 orthogonality, but adds directional closure metadata and proof obligations.

### `BMC-REL-D02-B-TYPED-EVALUATION-MODES` — Typed evaluation modes

Provide fixed evaluator entrypoints such as `validate-fragment`, `compile-feature`, and `compile-project`. Each mode has a closed completeness contract; `feature_scope` does not silently choose a mode.

Trade-off: simpler public APIs and authoring than directional manifests, but less flexible and dependent on every loader proving the selected mode contract.

### `BMC-REL-D02-C-PROJECT-CLOSED-WORLD` — Project-only closed world

Enforce positive minima only on the fully merged project graph. Fragment and feature views enforce typing, scope, and observed maxima but never positive minima. Final generation requires the project-closed validation result.

Trade-off: simplest safe closure model, especially for cross-feature relationships, but delays feedback and forces full-project evaluation for constraints that narrower evidence could prove.

### `BMC-REL-D02-D-DEFER` — Defer closure semantics

Allow profiles with minimum zero to progress, while blocking positive-minimum enforcement and dependent code generation.

### `BMC-REL-D02-E-STOP` — Stop this decision route

End the backend-cardinality decision route without selecting closure semantics.

### D02 owner disposition

Selected option: `BMC-REL-D02-A-EXPLICIT-DIRECTIONAL-CLOSURE`

Decision owner: `user`

Decision timestamp: `2026-08-22T22:36:45+01:00`

Decision source: exact `A` response to the D02 option set in the active conversation.

Rationale: preserve outgoing closure, incoming closure, endpoint-population completeness, and placement scope as independent axes. Enforce observed invalidity immediately, enforce positive minima only with the exact directional closure proof, and block dependent code generation when required completeness evidence is absent.

Selection effect: open views report positive minima as `not-evaluated-incomplete-closure`; they do not silently pass. `creates` remains unchanged because both of its canonical minima are zero.

## BMC-REL-RQ1 — Query callable versus Entity-data dependency

Status: `selected`

Question: Should the `Query` meta-type be removed, should Operations be forced to invoke Query concepts, or should the relationship name be separated from the callable type?

Selected disposition: keep `Query`; replace the canonical `queries` relationship with `reads`; admit exactly `Query|Operation -> Entity`; exclude `Calculation`; preserve `queries` only as a rejected deprecated migration alias.

Code meaning:

- `Query` remains a read-only callable that returns a view and never mutates state.
- `Operation --[reads]--> Entity` records that a state-changing behavior reads Entity data as one dependency before or during its work; it does not make the Operation read-only and does not require an intermediate Query callable.
- `Query --[reads]--> Entity` records the same Entity-data dependency for a read-only callable.
- `Calculation` consumes explicit values and stays pure. Any future input-provenance model requires a separate relationship decision rather than repository access hidden inside Calculation.
- `queries` is not accepted in newly authored graphs. Its deprecated row exists only to provide deterministic `reads` migration guidance.

Owner disposition:

- Decision owner: `user`
- Decision timestamp: `2026-08-23T01:50:30+01:00`
- Decision source: exact `confirmed` response to the presented keep-Query/rename-to-reads/exclude-Calculation/deprecate-queries proposal.

Selection effect: this is a semantic authority correction, not a numeric-cardinality decision. The active signature count remains 31 and the compatibility token remains `many_to_many` until its numeric profile is separately selected.

D03 consequence: the earlier D03 admissibility request and receipt remain historical evidence bound to the superseded `queries` source union and predecessor hashes. They are not owner acceptance and must not be reused. The fresh post-RQ1 request and receipt bind the validated preselection `reads` packet; the exact owner response selected per-endpoint-type aggregation, and the candidate packet now records only that four-row facet decision.

## BMC-REL-D03 — Union endpoint aggregation

Status: `selected`

Question: When a relationship admits multiple endpoint meta-types, how should the shared evaluator group eligible edges before applying directional degree bounds?

Current union signatures are `Interface -> Operation|Query` for `exposes`, `Policy -> Operation|Calculation` for `applies`, `Mapping -> Entity|Interface` for `maps`, and `Query|Operation -> Entity` for `reads`. D02 independently controls whether positive minima are evaluable. Scope, ordering, named roles, projection shape, and runtime multiplicity remain separate axes.

Fresh Decision Gate evidence:

- Request: `decision-gate/BMC-REL-D03-READS-OPTION-ADMISSIBILITY-REQUEST.json`, raw SHA-256 `cb18dc95a2bc8b1eed3aecbd24b10ac146989f629fc4971bb63a6fc88f82c267`, canonical request digest `046874d9559de1e49961754707479025e215f506902e4e85866af07d97f9e9dd`.
- Receipt: `decision-gate/BMC-REL-D03-READS-OPTION-ADMISSIBILITY-RECEIPT.json`, raw SHA-256 `247b87ceb3b294f5f4690f9a4562113fe9714027ac28448bb6567447c57e728d`.
- Prefilter result: `gate`; all three action options plus explicit defer and stop are structurally admissible; no option is selected by the receipt.

### `BMC-REL-D03-A-POOLED-UNION-TOTAL` — Pooled union total

Count all admitted endpoint alternatives in one bucket. For example, one exposed Operation and one exposed Query produce a total outgoing `exposes` count of two.

Trade-off: smallest schema and evaluator, but cardinality loses the already-authoritative endpoint-type distinction and cannot express separate limits for Operations and Queries.

### `BMC-REL-D03-B-PER-ENDPOINT-TYPE` — Per-endpoint-type aggregation (recommended)

Create one counter for every member of the canonical endpoint-type union. Outgoing unions bucket by target meta-type; incoming unions bucket by source meta-type. Every declared union member requires an explicit constraint entry, and adding a new member without its bucket fails closed.

Trade-off: preserves the canonical type axis and enables strict centralized constraints without inventing new semantic roles, but produces more profile entries and makes endpoint-union changes explicit constraint-schema changes.

This option does not reinterpret `maps.Entity` and `maps.Interface` as input/output roles. D05 decides Mapping roles and arity independently.

### `BMC-REL-D03-C-NAMED-AGGREGATION-DIMENSIONS` — Named owner-admitted aggregation dimensions

Let each relationship declare named filtered counters that may pool types, separate types, or later select named roles. Selector coverage and overlap must themselves be explicit and validated.

Trade-off: most expressive and able to absorb later Mapping roles, but adds the largest schema/evaluator surface and risks renaming existing meta-types or introducing semantics before their owner decision.

Guardrail: D03-C admits selector-schema capacity only. A selector may use current canonical meta-types or a dimension admitted by a separate owner decision; it does not admit Mapping input/output roles reserved for D05 or any other new semantic role.

### `BMC-REL-D03-D-DEFER` — Defer union aggregation

Keep all four union aggregation profiles unresolved and block their code generation.

### `BMC-REL-D03-E-STOP` — Stop this decision route

End the backend-cardinality decision route without selecting union aggregation semantics.

### D03 owner disposition

Selected option: `BMC-REL-D03-B-PER-ENDPOINT-TYPE`

Decision owner: `user`

Decision timestamp: `2026-08-23T02:44:53+01:00`

Decision source: exact `B` response to the post-RQ1 D03 option set in the active conversation.

Rationale: preserve each canonical endpoint meta-type as an independent cardinality bucket, so strict enforcement does not collapse `Operation` with `Query`, `Operation` with `Calculation`, or `Entity` with `Interface`. This applies CAV2-D22/D29 orthogonality while using D01's centralized profile architecture.

Selection effect: `exposes`, `applies`, and `maps` aggregate outgoing degree separately by target meta-type; `reads` aggregates incoming degree separately by source meta-type. The packet records `multi_endpoint_semantics = per-type` for those four rows. Numeric bounds, Mapping roles, closure, representation, runtime cardinality, and packet-wide owner acceptance remain unresolved.

## BMC-REL-D04 — Workflow concept degree versus declared step count

Status: `selected`

Question: When `Workflow --[orchestrates]--> Operation` is constrained, does its cardinality count distinct Operation concepts, authored Workflow steps, or both on separate axes?

The current canonical signature is a direct `Workflow -> Operation[]` relationship with compatibility token `one_to_many_ordered`. The current ordered-Workflow implementation has a richer structure: every step has its own `step_id` and a separate `binding_id`, and multiple distinct step IDs may bind the same Operation. A read-only evaluator probe with four distinct steps and three distinct bindings passed, including two steps that reused one binding. This proves representational capacity in the candidate implementation; it does not decide canonical authority.

Fresh Decision Gate evidence:

- Request: `decision-gate/BMC-REL-D04-OPTION-ADMISSIBILITY-REQUEST.json`, raw SHA-256 `604cc41bcff1010e51d7fd8d5b1dc005b96b5fd67fb8de9ae74d8039b2b33e79`, canonical request digest `83d2fec355efec663cc54a82f8018cdf931c4efb5f7e36c85bb0303ca2abee0b`.
- Receipt: `decision-gate/BMC-REL-D04-OPTION-ADMISSIBILITY-RECEIPT.json`, raw SHA-256 `a4abd9d7b94542d1340c6821405f310f6b7d06e295fd0c20942c7099cf35db9b`.
- Prefilter result: `gate`; all three action options plus explicit defer and stop are structurally admissible; no option is selected by the receipt.

### `BMC-REL-D04-A-DISTINCT-OPERATION-CONCEPT-DEGREE` — Distinct Operation concept degree

Count unique Operation concepts adjacent to the Workflow. Two Workflow steps bound to the same Operation count as one graph target.

Packet effect after owner selection: `occurrence_semantics = concept-level`.

Trade-off: this is directly representable in the current packet vocabulary and keeps DS-D8 graph degree concept-level, but declared step count remains invisible unless a later representation decision models it separately.

### `BMC-REL-D04-B-ORDERED-STEP-OCCURRENCE-ARITY` — Declared step count

Count every authored ordered Workflow step. Two different step IDs bound to the same Operation count as two occurrences.

Packet effect after owner selection: add and use the closed token `design-time-step-occurrence`. The existing `runtime-occurrence` token is not an admissible substitute: a planned step is not a runtime execution.

Trade-off: directly constrains the authored sequence, but conflates DS-D8 concept-graph degree with declared step count if this becomes the sole cardinality axis.

### `BMC-REL-D04-C-SEPARATE-CONCEPT-DEGREE-AND-STEP-ARITY` — Separate concept degree and declared step count (selected)

The stable option ID retains `STEP-ARITY` because it identifies the exact historical gate candidate shown to the owner. The normative human and machine vocabulary selected here uses `declared step count`; `arity` is not used as the DomainSpec term.

Keep two explicit counters:

- distinct Operation concept degree over canonical `Workflow -> Operation` adjacency;
- declared step count over distinct Operation-bound Workflow `step_id` values.

If `ValidateSettlement` is used by `validate-before-write` and `validate-after-write`, the concept degree contribution is one and the declared step count contribution is two. The canonical concept edge is authored once; declared step identity and order remain separate from that edge.

Packet effect: add and use the closed token `separate-concept-degree-and-declared-step-count`. The current `both-with-separate-bounds` token is not reused because it does not distinguish design-time steps from runtime executions.

Trade-off: best preserves CAV2-D16/D22/D29 orthogonality and repeated-call expressiveness, but requires a small packet schema/validator vocabulary extension and later separate bounds for both axes.

Formal counting basis:

```text
operation_concept_degree(W) =
  |{ O | W --[orchestrates]--> O }|

declared_step_count(W) =
  |{ step_id(s) |
       s is declared by W
       and binding_kind(s) = Operation }|
```

Plain-language meaning: count each distinct Operation once in the concept graph, but count every separately named Operation-bound Workflow step. A retry at runtime changes neither count. A step bound to another Workflow is also excluded because the canonical `orchestrates` signature targets Operation.

Domain-context meaning: the current ordered-Workflow descriptor already separates `step_id` from `binding_id`. D04 interprets that separation but does not rename or mutate the implementation contract.

### Declarative Workflow-step direction

A future Workflow representation should describe stable step declarations rather than encode calls imperatively:

```ts
type WorkflowStepDeclaration = {
  step_id: StepId;
  binding_kind: "Operation" | "Workflow";
  binding_ref: ConceptRef;
  precondition_rule_ref: RuleRef | null;
  failure_policy: "stop" | "continue" | "compensate";
  compensation_intent_ref: CompensationIntentRef | null;
};

type WorkflowDeclaration = {
  steps: readonly WorkflowStepDeclaration[]; // array order is non-semantic
  ordered_step_ids: readonly StepId[];        // sole authored total order
};
```

`ordered_step_ids` must contain every declared `step_id` exactly once. Different step declarations may use the same `binding_ref`; this is deliberate reuse, not duplicated Operation code or a duplicated canonical relationship fact. `binding_ref` is the preferred future name because it refers to a declared concept; the existing implementation field remains `binding_id` until a separate representation task migrates it.

Authored `after` dependencies are deferred. Introducing them now would decide partial-versus-total order, branches, joins, cycles, and topological equivalence. If introduced later, either `after` or `ordered_step_ids` must be canonical and the other generated; both must not author the same ordering fact.

### `BMC-REL-D04-D-DEFER` — Defer occurrence semantics

Leave `orchestrates.occurrence_semantics` unresolved and block its constraint generation.

### `BMC-REL-D04-E-STOP` — Stop this decision route

End the backend-cardinality decision route without selecting Workflow occurrence semantics.

### D04 orthogonal boundary

D04 selects only what is counted. It does not select numeric minima or maxima, ordering rules, duplicate-step policy, canonical representation, inverse authorship, runtime execution cardinality, or closure behavior. In particular, repeated Operation bindings are not duplicate step IDs, and design-time step occurrence is not runtime multiplicity.

### D04 owner disposition

Selected option: `BMC-REL-D04-C-SEPARATE-CONCEPT-DEGREE-AND-STEP-ARITY`

Decision owner: `user`

Decision timestamp: `2026-08-23T13:21:44+01:00`

Decision source: exact `C` response to the D04 gate, followed by the owner's request to replace `arity` with clearer vocabulary and make the step description more declarative.

Rationale: preserve distinct Operation concept degree, Operation-bound declared step count, and runtime execution count as separate axes. Reuse one Operation implementation across multiple stable step declarations without duplicating code or canonical relationship facts.

Selection effect: only `orchestrates.occurrence_semantics` becomes owner-selected as `separate-concept-degree-and-declared-step-count`. Numeric bounds, ordering policy, serialized representation, duplicate policy, inverse semantics, runtime cardinality, and every other unresolved facet remain unresolved. No canonical relationship or Workflow implementation is changed by D04.

## BMC-REL-D05 — Mapping concept degree versus declared role count

Status: `selected`

Question: When `Mapping --[maps]--> Entity|Interface` is constrained, should it count distinct adjacent endpoint concepts, declared Mapping-role assignments, or both on separate axes?

The canonical signature contains one `Mapping -> Entity|Interface` adjacency with compatibility token `many_to_many`. D03 already requires distinct endpoint concept degree to be bucketed independently by canonical endpoint meta-type. The current canonical relationship, packet schema, and validator do not define Mapping-role identities or a role-bearing Mapping declaration substrate.

Fresh Decision Gate evidence:

- Request: `decision-gate/BMC-REL-D05-OPTION-ADMISSIBILITY-REQUEST.json`, raw SHA-256 `6db785478f98a1b25b3127e26f08ddc16ed26f39477af335c838f32456deb09e`, canonical request digest `6aca7e81cb4aca5811640065a3028e7789bbda03db760ab07ebb3f1573fc0087`.
- Receipt: `decision-gate/BMC-REL-D05-OPTION-ADMISSIBILITY-RECEIPT.json`, raw SHA-256 `ac04a5c3758571ec341f08d8819d21376e12fe38f9fc96d3441d8f3ad6226666`.
- Prefilter result: `gate`; all three action options plus explicit defer and stop are structurally admissible; no option is selected by the receipt.

### `BMC-REL-D05-A-DISTINCT-ENDPOINT-CONCEPT-DEGREE` — Distinct endpoint concept degree

Count only unique canonical endpoint concepts adjacent to the Mapping, with Entity and Interface degree kept in separate D03 buckets.

Packet effect after owner selection: `occurrence_semantics = concept-level`.

Trade-off: fits the current canonical graph and packet vocabulary, but cannot distinguish multiple declared uses of the same endpoint concept.

### `BMC-REL-D05-B-DECLARED-INPUT-OUTPUT-ROLE-COUNT` — Declared Mapping-role count

Count each distinct declared Mapping-role assignment, even when multiple assignments refer to the same endpoint concept. The historical option ID names input/output because that wording was presented at the gate; it does not itself establish a closed role vocabulary or role polarity.

Trade-off: exposes repeated declared use, but as the sole axis it would hide distinct concept degree and would require a separately governed role identity and declaration substrate.

### `BMC-REL-D05-C-SEPARATE-CONCEPT-DEGREE-AND-ROLE-COUNT` — Separate concept degree and declared role count (selected)

Keep two independent counters:

- distinct endpoint concept degree over canonical `Mapping -> Entity|Interface` adjacency, bucketed separately by endpoint meta-type under D03;
- declared role count over distinct Mapping-role assignment identities associated with the Mapping.

Formal counting basis:

```text
endpoint_concept_degree(M, T) =
  |{ X | M --[maps]--> X and meta_type(X) = T }|

declared_role_count(M) =
  |{ role_identity(r) |
       r is a declared Mapping-role assignment owned by M
       and endpoint_ref(r) is canonically adjacent to M }|
```

The second expression is an abstract count basis, not a representation decision: the identity, storage, vocabulary, and validation of `r` remain unresolved.

Complexity-aligned examples:

- Low: `CustomerMap` is adjacent to one Entity and has one hypothetical declared role assignment referencing it. Entity concept degree is `1`; declared role count is `1`.
- Medium: `PriceDiff` is adjacent to `PriceSnapshot` and `PriceDelta`. Two hypothetical role assignments reference `PriceSnapshot` and one references `PriceDelta`. Entity concept degree is `2`; declared role count is `3`.
- Complex: `LedgerCrosswalk` is adjacent to two Entities and one Interface through five hypothetical role assignments. D03 concept-degree buckets are Entity=`2` and Interface=`1`; declared role count is `5`. D05 does not decide how those five would be grouped by a future role vocabulary.

These examples illustrate the selected separation only. They are not evidence that a role-bearing Mapping substrate currently exists and do not select limits, role labels, coverage, or representation.

Packet effect: add and use the closed token `separate-concept-degree-and-declared-role-count` for `maps.occurrence_semantics`.

Trade-off: preserves concept, endpoint-type, declared-role, and runtime axes independently, but requires later owner decisions and implementation evidence before declared role counts can be enforced.

### `BMC-REL-D05-D-DEFER` — Defer Mapping role and endpoint-count semantics

Leave `maps.occurrence_semantics` unresolved and block Mapping constraint generation on this basis.

### `BMC-REL-D05-E-STOP` — Stop this decision route

End the backend-cardinality decision route without selecting Mapping count semantics.

### D05 orthogonal boundary

D05 selects only that distinct endpoint concept degree and declared Mapping-role count are separate count bases. It does not select a Mapping role inventory or polarity, role-assignment identity, per-role versus total counting, overlap or coverage rules, numeric minima or maxima, closure, duplicate policy, ordering, inverse semantics, serialized representation, runtime cardinality, or canonical edge generation. Entity and Interface remain endpoint meta-types and must not be reinterpreted as roles.

### D05 owner disposition

Selected option: `BMC-REL-D05-C-SEPARATE-CONCEPT-DEGREE-AND-ROLE-COUNT`

Decision owner: `user`

Decision recorded at: `2026-08-23T14:35:56+01:00`

Decision source: exact `C` response after the complexity-aligned D05 option explanation. The preceding examples had `authority_effect: none` and did not select an option.

Rationale: preserve canonical endpoint concept degree, D03 endpoint-meta-type buckets, declared Mapping-role count, and runtime cardinality as independent axes without inventing a role substrate or numeric bounds.

Selection effect: only `maps.occurrence_semantics` becomes owner-selected as `separate-concept-degree-and-declared-role-count`. D03 `maps.multi_endpoint_semantics = per-type` remains unchanged, every other unresolved Mapping facet remains unresolved, and packet-wide owner disposition remains pending. No canonical relationship or Mapping implementation is changed by D05.

## BMC-REL-D06 — Ownership uniqueness per admitted dimension

Status: `selected`

Machine projection: `satisfied-candidate-packet-only`

Question: When one Entity directly `owns` another for lifecycle, custody, or write responsibility, must the owned Entity have one direct owner across all ownership responsibilities, may it have several undifferentiated direct owners, or is owner uniqueness evaluated separately for each explicitly admitted ownership dimension?

The canonical `owns` signature is `Entity -> Entity`, admits same-feature and cross-feature edges, and generates the reverse navigation view `owned-by`. Its compatibility token `one_to_many` is not numeric authority. D27 supplies a one-owner-per-semantic-responsibility principle, but its only current machine-executable application is `creates`; applying it to `owns` requires separate finite authority and validation evidence.

Fresh Decision Gate evidence:

- Request: `decision-gate/BMC-REL-D06-OPTION-ADMISSIBILITY-REQUEST.json`, raw SHA-256 `99db10d17aa038e2aae59c883116d8d00aec41288f02e2601012921d53cc93a1`, canonical request digest `f7107f8455ee5f92d99aa6603417e95c72f52e22ae151355f2c081c53b47057c`.
- Receipt: `decision-gate/BMC-REL-D06-OPTION-ADMISSIBILITY-RECEIPT.json`, raw SHA-256 `d1c8594dc9166e3caad86d26658bbe4cc0bb7b497a18750708965518bee14e07`.
- Prefilter result: `gate`; all three action options plus explicit defer and stop are structurally admissible. The receipt rejects mandatory ownership for every Entity, authored `owned-by`, and numeric bounds derived from `one_to_many`; it does not select an option.

### `BMC-REL-D06-A-ONE-DIRECT-OWNER-OVERALL` — One direct owner overall

Apply one direct-owner uniqueness slot across all ownership responsibilities for a target Entity.

Trade-off: gives the simplest accountability rule, but collapses lifecycle, custody, and write responsibility into one slot and may reject a legitimate division of responsibilities.

### `BMC-REL-D06-B-SHARED-DIRECT-OWNERSHIP` — Shared direct ownership

Allow several undifferentiated direct owners for the same target Entity.

Trade-off: supports shared or federated responsibility without a new dimension vocabulary, but cannot distinguish complementary responsibility from conflicting co-ownership.

### `BMC-REL-D06-C-ONE-OWNER-PER-OWNERSHIP-DIMENSION` — One owner per ownership dimension (selected)

Apply direct-owner uniqueness independently inside each ownership dimension that a later Definitions Governance decision explicitly admits. This is conditional uniqueness, not mandatory ownership.

Formal voice:

```text
Let D_admitted be the ownership dimensions admitted by a later
Definitions Governance decision.

Let owns_d(o, t) classify a direct canonical owns fact from owner Entity o
to target Entity t under admitted dimension d. D06 does not authorize how d
is named or represented.

For every t, every d in D_admitted, and owner Entities o1 and o2:
  owns_d(o1, t) and owns_d(o2, t) implies o1 = o2.

No existence condition is selected:
  D06 does not require any owns_d(o, t).
```

Plain-language voice: for any recognized kind of ownership, one Entity cannot have two competing direct owners for that same kind. Different recognized kinds may later have different owners. This choice does not require every Entity to be owned.

Domain-context voice: `owns` remains one canonical Entity-to-Entity relationship and `owned-by` remains generated navigation. The current prose words lifecycle, custody, and write-responsibility illustrate the semantic area, but D06 does not turn them into a closed vocabulary or decide where a dimension is stored.

These voices explain the selected D06 policy in this decision record. They are not a new canonical definition card. Any ownership-dimension vocabulary must be separately admitted through Definitions Governance with its own colocated formal, plain-language, and domain-context voices.

Trade-off: best preserves D27 uniqueness per semantic responsibility while allowing genuinely distinct responsibilities to have different owners, but it creates an explicit follow-up dependency on vocabulary, packet representation, evaluator rules, and fixtures before enforcement.

### `BMC-REL-D06-D-DEFER` — Defer ownership topology

Leave the direct-owner grouping rule unresolved and keep dependent constraint generation blocked.

### `BMC-REL-D06-E-STOP` — Stop this decision route

End the backend-cardinality decision route without selecting an ownership grouping rule.

### Rejected D06 constructions

- Mandatory exclusive ownership for every Entity is inadmissible without a root or ownership-eligibility selector; on a finite closed population it would also force a self-edge or cycle and pre-decide the separate nonnumeric topology pass.
- `owned-by` cannot become authored authority because DS-D8 defines it as a generated navigation view.
- `one_to_many` cannot supply numeric bounds because D01 and the packet validator prohibit token-derived cardinality.

### D06 future validation obligations

A later authorized vocabulary and typed packet representation must support positive and hostile fixtures that:

- permit different direct owners for the same target only when they are bound to distinct admitted dimensions;
- reject two distinct direct owners for the same target in the same admitted dimension;
- reject unknown or unbound dimension tokens;
- reject interpreting C as a positive minimum or mandatory owner;
- reject deriving flat numeric bounds from `one_to_many`;
- reject authored `owned-by`;
- reject copying an `owns`-only topology token to another relationship;
- reject resolving self-edge, cycle, transitive, duplicate, closure, inverse, representation, or runtime policy through D06.

The candidate packet and validator now enforce the representation-level obligations: the exact `owns`-only
policy and registry binding, no object on another relationship, no ordinary facet resolution, no mandatory
ownership inference, and preserved generated `owned-by`. Per-fact dimension storage and graph enforcement remain
future implementation obligations; P02 deliberately does not invent them.

### D06 owner disposition

Selected option: `BMC-REL-D06-C-ONE-OWNER-PER-OWNERSHIP-DIMENSION`

Decision owner: `user`

Decision date: `2026-08-23`; the exact user-message clock timestamp is not exposed to this record.

Decision source: exact `C` response to the D06 gate in the active conversation.

Rationale: preserve D27's one-owner-per-semantic-responsibility principle without collapsing distinct ownership responsibilities into one undifferentiated slot.

Projection closeout:

- P01 selected `BMC-REL-D06-P01-B-GOVERNED-EXTENSIBLE-REGISTRY`; canonical `domainspec-v2-D29` admits exactly
  `lifecycle`, `custody`, and `write-responsibility` at registry SHA-256
  `91898f538b49f29a1be659560f6b442644a34b3ecb3f0a8916b7a0e53680bad4`.
- P02 selected `BMC-REL-D06-P02-B-OWNS-SCOPED-TYPED-EXTENSION` by the user's exact `B` response at
  `2026-08-23T15:44:08+01:00`.
- P02 candidate SHA-256: `33119d1b53b1c7eaf5f2a354bb8daece9c06f689e61a823bb0c31ad7cdc0eb2f`;
  request raw SHA-256: `e1e07f41a52653ca8784807515d1f883c8188b17d791bb04f5f42ac2321fcd3a`;
  canonical request digest: `c4927ba3cdd0d2f0e8ffbce620efb210f6a723d361195fa300d2c5ad42214296`;
  receipt raw SHA-256: `f53baa362ff33a0c3e147627afd6c4d122f170ecf5d318aea6d2f2e7b9b4f8ec`.
- Applied candidate packet SHA-256: `3d2f7695197b1e8eaa1b2cfd0c2662ad0355888604ee7ad0e6e9dd34ce0107b3`;
  schema SHA-256: `eabaeb7c9f37dc3d016873fa30e2dd86c6e09903f5f7bcbf3b072b2adb8ddbde`;
  validator SHA-256: `03ed61edc240478430a9c5a1eaf2297682beea63d76ac6c44a792172c738def9`.

Selection effect: D06 conditional uniqueness now has a finite governed vocabulary and one closed, schema-discriminated
`owns`-only candidate-packet representation. The object records only the policy and exact registry binding; it
declares no dimension instances or storage. The `owns` row and all its ordinary facets remain unresolved, the
packet-wide owner disposition remains pending, and `authority_effect` remains `none`. D06 does not require every
Entity to have an owner, resolve numeric or other topology, change `owns` or generated `owned-by`, or establish
product enforcement.

## BMC-REL-D07 — Membership topology for `belongs-to`

Status: `selected`

Machine projection: `satisfied-candidate-packet-only`

D07 repaired canonical vocabulary applied: after exact rollback of the first broken-link package, the user
selected the fresh repaired action through exact `A` at `2026-08-23T18:17:44+01:00`. Canonical D30/index/registry
hashes are `92f31e0a...`/`d0c8032b...`/`854ff80f...`; both D30 local anchors resolve and canonical validation passes.
P02 option `BMC-REL-D07-P02-B-BELONGS-TO-SCOPED-TYPED-EXTENSION` was selected by exact `B` at
`2026-08-23T18:38:33+01:00` and applied only to the candidate packet, schema, and main validator.

Question: When one Entity canonically `belongs-to` another through membership, classification, or home assignment,
is direct membership grouped into one parent slot overall, left as multiple undifferentiated memberships, or grouped
independently by membership kinds admitted through a later Definitions Governance decision?

Strict boundary: `belongs-to` remains independent from `owns` and is not `owns^-1`; `many_to_one` is compatibility
vocabulary, not numeric authority. D07 does not infer mandatory membership, numeric minima or maxima, self-edge,
cycle, transitive, closure, duplicate, inverse, representation, or runtime semantics, and does not change canonical
authority or implementation.

Fresh Decision Gate evidence:

- Candidate: `candidates/BMC-REL-D07-MEMBERSHIP-TOPOLOGY-CANDIDATE.md`, raw SHA-256
  `18ed4c699c53924bb054050a741efa857c1fe8b256d21868748d0387e402cbda`.
- Request: `decision-gate/BMC-REL-D07-OPTION-ADMISSIBILITY-REQUEST.json`, raw SHA-256
  `fa90d189baca57ac6cc6d8e6c8b983b6da68fe210eefdb21d62aa4ff5b8fc1b8`, canonical request digest
  `b74624d515c7052eb5b5bcc56a2f783b182eac28a424db64636c0152a337c7c7`.
- Receipt: `decision-gate/BMC-REL-D07-OPTION-ADMISSIBILITY-RECEIPT.json`, raw SHA-256
  `94bac73b0d7746d5c5d2e8651b80bce1cd83fb6a686ae848d279c857ee2e83b0`.
- Prefilter result: `gate`; all three action options plus explicit defer and stop are structurally admissible. Four
  overreaching constructions are rejected. The receipt does not satisfy the authority gate or select an option.

### `BMC-REL-D07-A-ONE-DIRECT-MEMBERSHIP-PARENT` — One direct membership parent overall

Group all direct `belongs-to` facts from an Entity into one overall parent slot.

Trade-off: simplest and unambiguous, but collapses membership, classification, and home assignment into one slot
and may force independently meaningful targets to compete.

### `BMC-REL-D07-B-MULTIPLE-UNDIFFERENTIATED-MEMBERSHIPS` — Multiple undifferentiated direct memberships

Permit several direct `belongs-to` targets without a kind discriminator.

Trade-off: preserves the current single verb and admits multiple targets without new vocabulary, but cannot
distinguish complementary membership purposes from conflicting assignments.

### `BMC-REL-D07-C-ONE-DIRECT-MEMBERSHIP-PER-GOVERNED-KIND` — One direct parent per governed membership kind (selected)

Evaluate direct-parent uniqueness independently inside each membership kind that a later Definitions Governance
decision explicitly admits.

Formal voice:

```text
Let K_admitted be the membership kinds admitted later by Definitions Governance.
Let belongs_to_k(e, p) classify a direct canonical belongs-to fact under k without deciding representation.

For every Entity e, kind k in K_admitted, and parent Entities p1 and p2:
  belongs_to_k(e, p1) and belongs_to_k(e, p2) implies p1 = p2.

No existence condition is selected:
  no Entity is required to participate in belongs_to_k.

Different parents in distinct admitted kinds are permitted but not required.
```

Plain-language voice: one recognized kind of membership cannot give the same Entity two competing direct parents.
Different recognized kinds may later use different parents. An Entity need not belong anywhere.

Domain-context voice: `belongs-to` remains one canonical `Entity -> Entity` verb, independent from `owns` and not
its inverse. The current prose words membership, classification, and home assignment illustrate the semantic area
only; this D07 selection does not turn them into stable IDs or choose where a kind is represented.

Trade-off: preserves distinct membership purposes and rejects competition within one later-admitted kind, but
requires a separately governed finite vocabulary, typed packet representation, and fixtures before enforcement.

These three voices explain the D07 choice in this record; they are not a canonical definition package.

### `BMC-REL-D07-D-DEFER` — Defer membership topology

Leave membership grouping unresolved and dependent constraint generation blocked.

Trade-off: avoids premature semantics but makes no progress on `belongs-to` projection or enforcement.

### `BMC-REL-D07-E-STOP` — Stop this decision route

End the relationship-constraint decision route without selecting D07.

Trade-off: makes no semantic change and terminates further progress explicitly.

### Rejected D07 constructions

- Numeric bounds cannot be derived from `many_to_one`; it is compatibility vocabulary only.
- `belongs-to` cannot collapse into `owns^-1`; DS-D8 and the relationship non-collapse test keep them independent.
- Mandatory membership for every Entity is unsupported because no positive minimum, eligibility selector, or root
  policy is selected.
- Membership, classification, and home assignment cannot become fixed kind tokens from prose alone.

### D07 owner disposition

Selected option: `BMC-REL-D07-C-ONE-DIRECT-MEMBERSHIP-PER-GOVERNED-KIND`

Decision owner: `user`

Decision timestamp: `2026-08-23T16:17:11+01:00`

Decision source: exact `C` response to the D07 option set in the active conversation.

Rationale: preserve membership-purpose orthogonality without collapsing `belongs-to` into `owns`, without allowing
competing direct parents inside one membership purpose, and without treating current prose as machine vocabulary.

Selection effect: D07 selects only conditional uniqueness of the direct parent inside each later-admitted membership
kind. It does not admit kind labels, require any membership, select numeric bounds or another topology axis, choose
representation, update the candidate packet, change DS-D8 or canonical `belongs-to`, or implement enforcement.

### P01 governance-model disposition

Selected option: `BMC-REL-D07-P01-B-GOVERNED-EXTENSIBLE-REGISTRY`

Decision owner: `user`

Decision timestamp: `2026-08-23T16:35:24+01:00`

Decision source: exact `B` response to the P01 vocabulary-model option set in the active conversation.

Exact P01 gate binding:

- Candidate SHA-256: `012068ac18dcaced1d5fbcbacb4a1a8505a3d2eed1cae7e1583914b2c01eec04`.
- Request raw SHA-256: `a96864ea845824e6374e53cda7b66adb0030c3dbfd06000d0d225d4046604915`.
- Canonical request digest: `e25fb8791a4ff3c76c899c48d533e5510d347d9b1843f9569b81422ce24d2ae6`.
- Receipt raw SHA-256: `a8b820d60b12b5c67b47c6f24c1a99f27926b626949a127931146d41b8177623`.
- Selection receipt: `sidecars/BMC-REL-D07-PROJECTION/receipts/BMC-REL-D07-P01-SELECTION-RECEIPT.json`.

P01 selection effect: choose only a finite digest-bound membership-kind registry governance model with owner-gated
add, revise, deprecate, and remove operations. P01 does not create the registry, definition card, IDs, meanings,
aliases, initial active set, digest, packet representation, or enforcement.

### P01 contents disposition

Selected option: `BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND`

Decision owner: `user`

Decision timestamp: `2026-08-23T16:58:14+01:00`

Decision source: exact `A` response to the contents option set in the active conversation.

Exact contents gate binding:

- Candidate SHA-256: `cd612231118dd8352bbc78921ba0d75c57284756d21fc28c008b2ecafe1c0afb`.
- Request raw SHA-256: `8ff4bd8c5c504d968dd02bdf3ff948b119537fba448eff5c2b4444de17b4baf4`.
- Canonical request digest: `b1db2f8f3c4f5afa97e1e06ab9a19a6104fdfbf8c9d5da4de66a8eb9aff2ce47`.
- Receipt raw SHA-256: `682beb6cbe08ebed7713a285efd3f37914f289db97f18f7f2b21bc763dde1df6`.
- Selection receipt SHA-256: `fa17a79ddedbd822b912a3c59eb90b79c9664b43d615009018042c7a41bc2b31`.

Contents selection effect: select exactly `classification` and `home-assignment` with the admitted candidate's
formal, plain-language, and DomainSpec-context meanings, pairwise non-overlap and fail-closed rules. Generic
`membership` and `collection-membership` remain inactive. There is no existence condition; different parents under
distinct active kinds are permitted but not required; the vocabulary remains independent from `owns`. This
selection does not apply canonical bytes or choose representation.

Projection dependency: the first exact package action was applied and rolled back after two broken local anchors.
The separately accepted repaired action
`BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-A-APPLY-EXACT-REPAIRED-PACKAGE` was selected by exact `A` at
`2026-08-23T18:17:44+01:00` and applied atomically against restored preimages. Canonical postimages are
`92f31e0a888ff0e6bfadd6d0d79dbb7894b88c6ca435672ca57409989dd51bdf` for definitions,
`d0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb` for the index, and
`854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c` for the registry. Selection receipt SHA-256
is `2e2f3307442f740c0bc6199763e43c9c0ff4f1a83fe92027673f1f8700ab7a47`; atomic apply receipt SHA-256 is
`9c7cfa75dc7f6cf027659e0130ba7ab62789239df8930abc8a7cd789e0dd47df`.

P02 gate: the fixed policy is `one-parent-per-admitted-membership-kind`, bound to the exact canonical registry and
`belongs-to` only. Candidate/request/receipt SHA-256 values are
`16ea98d8fdb4d84430bc76133433a7cab1ae9797f5f919be5b95ec5201df925b`,
`187d9e1478ac0a987021f303dfec9b6ca4b9573f16d5101acb983ed204e0d3f2`, and
`c0fdc792deca1d8d2734a558310f41277d4a2d35c8df67bd7f192ade0f29f7ec`; canonical request digest is
`c9e44f49fa84fc890494954d0c1cb736e56750dfdcfc87a797ac5769774ce1ab`.

P02 selected option: `BMC-REL-D07-P02-B-BELONGS-TO-SCOPED-TYPED-EXTENSION`.

Decision owner: `user`.

Decision timestamp: `2026-08-23T18:38:33+01:00`.

Decision source: exact `B` response to the P02 option set in the active conversation.

Selection receipt SHA-256: `5a680b76fa8eef8fe4676e4deeae67c59e22f2ae0a1d825b92a55262643ff65c`.

P02 application postimages: packet `a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0`,
schema `d68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7`, and main validator
`69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975`.

P02 application effect: add an exact closed `membership_topology` object only to `belongs-to`; bind policy
`one-parent-per-admitted-membership-kind` to the canonical registry path and digest; and reject missing, misplaced,
drifted, overreaching, or open-key variants. All ordinary `belongs-to` proposed facets remain unresolved. No kind
instance or storage, existence minimum, numeric bound, other topology, inverse, representation, runtime behavior,
or equivalence with `owns` is selected. Packet-wide owner disposition remains pending and authority effect remains
`none`.

Package acceptance gate canonical request digest:
`bc274e58c4cb412d7bd9f865eda92920d9d92c5376e0f04385fc5953773fff6b`.

## BMC-REL-D08 — Event provenance across `produces` and `emits`

Status: `selected-no-additional-constraint`

Decision effect: `preserve-canonical-endpoint-provenance-only`

Question: should D08 add an explicit verb-local non-collapse constraint across canonical `produces` and `emits`,
retain only their existing endpoint-specific provenance meanings without an additional constraint, defer, or stop?

Strict boundary: `Operation --[produces]--> Event` means an Operation causes an Event on successful completion;
`Entity --[emits]--> Event` means an Entity is the Event subject/source. The shared Event target does not establish
cross-verb equality, implication, pairing, existence, uniqueness, or numeric authority. D08 does not derive numbers
from `one_to_many`, collapse Operation into Entity, permit `Operation --[emits]--> Event`, require emission, infer
runtime occurrences or causal chains, resolve any ordinary facet, choose representation, or mutate authority.

Fresh Decision Gate evidence:

- Candidate SHA-256: `3ba43eef923c675eab66b9d8e97fbae2ab951a0cd96cbe1f550ef14b36d4e35e`.
- Request SHA-256: `bb511c45109029b0bec1bb5732b7bed218926e27260bcc43b5c6e96deeb89a15`.
- Canonical request digest: `afda6994c499b285a0ef0c4cc30dcdf47f8b145cc10687dedcc19df80039ea0c`.
- Prefilter receipt SHA-256: `f6ef196c08951712f4054d5ed9e76e3151f3bbc4767caff0a150792fe2f977fd`.
- Prefilter result: `gate`; two action options plus defer and stop are presented. Four overreaching constructions
  are rejected. No option is selected.

### `BMC-REL-D08-A-VERB-LOCAL-TYPED-PROVENANCE-NON-COLLAPSE` — recommended, not selected

Make the endpoint/verb distinction explicit: each `produces` fact carries only Operation-cause provenance; each
`emits` fact carries only Entity-subject/source provenance; neither implies, requires, equals, or supplies the
other.

Trade-off: preserves evidenced provenance axes and rejects endpoint collapse, but adds a cross-row invariant that
would require a later typed representation and hostile fixtures.

### `BMC-REL-D08-B-RETAIN-CANONICAL-ENDPOINT-PROVENANCE-ONLY` — selected

Retain the two current cards and endpoint policy without adding a D08 cross-row constraint.

Trade-off: smallest authority surface, but supplies no machine-readable invariant beyond existing per-signature
endpoint authority.

### `BMC-REL-D08-C-DEFER`

Leave additional Event provenance constraints unresolved pending application-specific validity evidence.

### `BMC-REL-D08-D-STOP`

Terminate the relationship-constraint decision route without adding D08 authority.

Rejected constructions: collapse of `produces` and `emits`; mandatory cross-verb pairing; numbers derived from
`one_to_many`; endpoint collapse; invented cross-verb equality; mandatory emission; and runtime publisher,
payload, occurrence, storage, or causal-chain semantics.

Historical pre-selection recommendation: `BMC-REL-D08-A-VERB-LOCAL-TYPED-PROVENANCE-NON-COLLAPSE`, because the canonical
Event endpoint policy and relationship non-collapse test directly support the typed distinction. The aligned
low/medium/complex hypothetical ladder has `decision_effect: none` and does not serve as evidence or consent.

Owner choices presented: `A`, `B`, `C`, `D`, or `Explain`.

### D08 owner disposition

Selected option: `BMC-REL-D08-B-RETAIN-CANONICAL-ENDPOINT-PROVENANCE-ONLY`

Decision owner: `user`

Decision timestamp: `2026-08-23T19:11:29+01:00`

Decision source: exact `B` response to the D08 option set in the active conversation.

Selection receipt SHA-256: `31ff7cdc1daac554db4d9989e0d159571c4083beddabbd0ad1e7b1169a798d0b`.

Rationale: Entity `emits` is broader than Event Sourcing. The current canonical cards and fixtures already
distinguish Entity subject/source provenance from Operation cause provenance, and no concrete downstream consumer
proves a new cross-row invariant would change validation, generation, or implementation behavior.

Selection effect: preserve the current canonical `Operation --[produces]--> Event` and
`Entity --[emits]--> Event` endpoints and meanings, including the invalid `Operation --[emits]--> Event` rule.
Add no cross-row constraint. D08 projection: `none`. The packet, schema, main validator, relationships, definitions,
and implementation remain unchanged by D08.

Remaining blockers: the separate nonnumeric pass for duplicate-edge policy, ordered-occurrence representation,
inverse-view handling, self-edge and cycle topology, hostile fixtures, and partial-view behavior; per-fact ownership
and membership kind/dimension representation with executable fixtures; runtime-cardinality semantics; packet-wide
owner acceptance; and product enforcement or implementation.

## Claim ceiling

This record proves that the owner selected the B2 design strategy, explicit directional closure, the RQ1 `reads`
semantic correction, per-endpoint-type aggregation for canonical union endpoints, separate Operation concept
degree from Operation-bound declared step count for `orchestrates`, separate endpoint concept degree from declared
Mapping-role count for `maps`, conditional direct-owner uniqueness within each admitted ownership dimension for
`owns`, and conditional direct-parent uniqueness within each later-admitted membership kind for `belongs-to`. The
candidate packet is synchronized through the D07 representation decision. This record does
not require every Entity to have an owner, declare dimension instances or storage, select numeric bounds or other
topology, change DS-D8 or `owns`/`owned-by`, admit the packet as a whole, register providers, implement enforcement,
materialize ontology relations, promote, publish, release, deploy, or prove production use. D07 definitions link
repair and candidate typed packet projection are now applied. D01-D08 owner decisions are resolved, with D08
selecting no additional provenance constraint, but the nonnumeric constraint pass, per-fact kind representation,
and executable ownership and membership fixtures remain unresolved before cardinality
enforcement can be claimed. The D07 vocabulary application admits only exact local D30/index/registry authority;
P02 adds only a candidate-packet typed projection and does not accept the packet or implement enforcement. D08 is
closed without an additional cross-row invariant or projection; this does not establish
application-specific runtime provenance validity, packet-wide acceptance, enforcement, or implementation.
