## Agent 1 — formal entailment and countermodels

## Explorer report — Lawvere, F. William

### Initial position

The owned system already proves **relationship-type non-collapse** and partially proves **DS-D1 meta-type non-collapse**. It does **not** yet prove a general minimality law for individual domain concepts or canonical facts. Orthogonality does not determine multiplicity. The narrowest repair is a DomainSpec-local build-from-owned specialization for concept identity and single canonical authorship—not a new CAV2 primitive and not a widening of `CAV2-D22`.

## 1. Owned predicates

Let `Ind_d(A,B)` mean that `A` and `B` can vary independently for decision `d`.

### Typed coupling

```text
¬Ind_d(A,B)
⇒ before the dependency governs work, declare
R(A,B) = (source, target, kind, direction, owner, evidence, effect)
```

This follows directly from `CAV2-D16`: non-independent objects require an explicit typed relation before affecting authority, routing, validation, or implementation; an untyped coupling remains residue rather than a hidden assumption.

Evidence: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:650-676`.

### Axis orthogonality

```text
Orth_d(a_i,a_j)
⇔ move(a_i) ⇏ move(a_j), unless an explicit bridge R_ij exists
```

This is about non-implied movement among dimensions, schema/instance axes, validation concerns, or artifact properties. It is not isolation, consistency, or statistical/mathematical orthogonality.

Evidence: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:1798-1828,1858-1864`.

### Classification admission

For an owned classification tuple `K(x)`, candidate classifier `k_p` is admissible only when it contributes an operational distinction not derivable from `K(x)`, with any dependencies made explicit.

Evidence: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:1230-1267`.

Claim limit: `CAV2-D22` explicitly governs **classification axes, taxonomy labels, and ontology groupings**, not every node, edge instance, attribute, or serialized fact. Applying it directly to all model elements would silently widen its scope.

### Ontology completeness, not minimality

`CAV2-D19` requires an actionable ontology to carry typed nodes, typed edges, ownership, evidence, confidence, promotion posture, gates, and use obligations:

```text
O_U = (N,E,B,R,C,P,G)
```

It does not state that `N` or `E` is minimal, nor that each semantic fact has one canonical encoding.

Evidence: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:879-919`.

### Primitive specialization boundary

`CAV2-D31` permits lower layers to instantiate, specialize, or compose a primitive, but forbids silent redefinition. It explicitly says a CAV2 primitive is not a DomainSpec DS-D1 meta-type.

Evidence: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:1968-1979,2019-2024`.

Therefore any repair belongs in DomainSpec as a cited specialization.

## 2. What DomainSpec already entails

### Relationship-type minimality: entailed

`domainspec-v2-D3` admits an edge type iff it composes into different code and adds a non-redundant distinction over:

```text
{concept-type, relation-kind, composition-shape, feature-boundary}
```

Evidence: `projects/domainspec-v2/definitions/DEFINITIONS.md:99-117`.

`domainspec-v2-D18` makes that operational:

```text
AuthoredRelationship(r)
⇒ ∃p ∈ {
  reject/allow,
  derivation,
  projection,
  composition path,
  owner route,
  generated artifact
}: remove(r) changes p
```

If no property changes, the candidate must remain prose, metadata, reading aid, generated view, or residue.

Evidence: `projects/domainspec-v2/definitions/DEFINITIONS.md:720-748`.

The property cards provide concrete proof classes:

- validation verdict: lines `775-811`
- derived obligation: lines `813-848`
- non-authoritative projection: lines `850-887`
- typed composition path: lines `889-929`
- owner route: lines `931-965`
- generated artifact: lines `967-1001`

Important qualification: a projection consequence can justify a generated view but not automatically an authored relationship (`:870-875`); generation evidence likewise does not promote generated output (`:984-991`).

### DS-D1 meta-type minimality: partially entailed

The local `meta-type` definition requires each concept to have exactly one node kind, fixing well-formedness, edge participation, and code pattern (`:220-234`). Its challenge contract already rejects two meta-types that reduce to one and names a separating structural or authority-resolved edge witness (`:250-258`).

This proves non-collapse among **meta-type kinds**. It does not prove distinct identity among two concepts carrying the same meta-type.

### DS-D8 carries multiplicity but does not derive it

A DS-D8 signature contains:

```text
(verb, source types, target types, scope, multiplicity, lifecycle, optional effect binding)
```

Yet the stated edge-admissibility check validates verb, endpoints, scope, and effect binding; no cardinality semantics or enforcement rule appears in that check.

Evidence: `projects/domainspec-v2/definitions/DEFINITIONS.md:1125-1140`.

Thus the selected definitions establish multiplicity as an authority field, but do not prove which value is correct or that it is executable.

## 3. Obligations not entailed

### Individual concept identity

Countermodel: `Customer: Entity` and `Client: Entity` have the same formal criterion, edges, lifecycle, owner, and generated code. Both satisfy DS-D1 typing. No selected predicate forces them to merge because D6 separates node **kinds**, not concept registry instances.

Positive model: `Invoice: Entity` and `Receipt: Entity` may share shape but have different identity, lifecycle, allowed operations, or relationship consequences. Shape equality alone must not collapse them.

Required specialization:

```text
AuthoredConcept(c)
⇒ removing or identifying c changes a named identity,
lifecycle, validation, composition, ownership, or generation consequence
```

### Single canonical authorship

Countermodel: a canonical edge `r(a,b)` and canonical attribute `b ∈ targets(a)` are constrained biconditionally. `CAV2-D16` requires the dependency to be explicit but does not choose which side is authoritative. D18 can reject a redundant **relationship type**, but it does not prohibit the same fact being independently authored in heterogeneous forms.

Required specialization:

```text
Equivalent(f_1,f_2)
⇒ exactly one is canonical;
the other is derived/generated with provenance and a validation bridge
```

### General generated-view classification

DomainSpec already handles generated relationship labels and projections: canonical DS-D2 verbs exclude labels listed only as generated, deprecated, or deferred (`projects/domainspec-v2/definitions/DEFINITIONS.md:1080-1104`). It does not yet provide one general classifier for derived attributes, aliases, compositions, inverse edges, and duplicated facts.

## 4. Orthogonality does not constrain multiplicity

Positive many-to-many model:

```text
Student --enrolls--> Course
```

Suppose `enrolls` changes validation and composition and is not derivable from another fact. It passes D3/D18 while remaining many-to-many.

Positive unique-creator model:

```text
CreatePlayer --creates--> Player
```

A uniqueness rule may forbid another creator, but that is an explicit identity/ownership/cardinality constraint—not a theorem of `CAV2-D22` or `D29`.

Therefore:

```text
non-collapse / orthogonality ⟂ graph multiplicity ⟂ runtime instance count
```

Any coupling among these axes must be explicitly typed under `CAV2-D16`.

## 5. Narrowest authority route

1. Keep `CAV2-D16/D22/D29` unchanged.
2. Keep D3/D18 as the relationship-type specialization; do not widen D18 past its explicit boundary, which excludes DS-D1 formation (`projects/domainspec-v2/definitions/DEFINITIONS.md:768-773`).
3. Treat the existing D6 node-side challenge as the meta-type-kind rule.
4. Add or formalize two DomainSpec-local build-from-owned obligations:
   - **concept-instance non-collapse**;
   - **canonical-fact single authorship with generated-view provenance**.
5. Keep multiplicity in DS-D8 as a separate typed constraint whose vocabulary, meaning, evidence obligation, and validator behavior still require explicit specification.

## Claim limits

This report establishes entailment from the selected canonical definition text only. It does not establish that the named validators implement every claimed rule, that duplicate concepts currently exist in the corpus, or that any particular `creates` multiplicity is correct. Those require the computational explorer’s live-corpus and validator evidence.

### Robot-talks confrontation — Lawvere

**Initial position.** The owned system proves a relationship-type non-collapse rule and partial DS-D1 meta-type non-collapse, but it does not prove individual-concept minimality, canonical-fact single authorship, or any multiplicity value from orthogonality.

**ACCEPT — Shannon.** I accept the executable finding that `creates` and `creation_targets` are two authored encodings tied by exact parity validation, while multiplicity is absent from the executable relationship types. D26’s biconditional makes the two forms extensionally equivalent, and the validator’s equality check proves coupling rather than independent information. This is the concrete witness my paper-only countermodel lacked. I also accept the wider corpus pattern: generated `owned-by` and collapsed `enforces-cross` demonstrate that canonical-plus-derived representation is already an implemented DomainSpec precedent.

**ACCEPT — Spivak.** I accept the anti-laundering correction. My initial claim that D3/D18 fully entail relationship-type minimality was too strong. D18’s literal existential admits projection or generated-artifact change (`projects/domainspec-v2/definitions/DEFINITIONS.md:727-739`), but D22 says a projection does not automatically justify first-class authorship (`:870-875`). A candidate could manufacture its own witness by being echoed into a generated artifact. Therefore a separating consequence must be independently owned or provenance-grounded, not merely causally downstream of inserting the candidate.

**NARROW — “semantic duplication.”** Shannon’s verdict should be read as **duplicate authorship of one extensional fact**, not proof that the `creates` semantic relation itself is unnecessary. If `creates` controls a distinct reject/allow, owner, derivation, or generation obligation, it can remain the canonical representation while `creation_targets` becomes derived—or vice versa. The evidence chooses “one authority plus one projection,” but does not logically choose the direction.

**Paper completeness versus executable evidence.** Canonical prose supplies necessary admission predicates; Shannon shows those predicates are not uniformly executable. D18 exists, yet form, guard, and binding endpoint facts can drift because no parity or single-authoring enforcement was found. DS-D8 carries multiplicity, yet no runtime type or validator enforces graph degree. Hence “defined” must not be reported as “validated.”

**Logical corollary versus unnecessary definition.** I agree with Spivak that no new CAV2 primitive or widened `CAV2-D22` is justified. But the missing single-authority rule is not a corollary of D16: D16 permits explicit coupled representations and does not select authority direction. It therefore needs a DomainSpec-local normative specialization before schemas and validators implement it. Individual-concept non-collapse likewise cannot be silently inserted into D6 because D6 governs meta-type kinds and explicitly distinguishes kinds from concepts.

**Final position.** Preserve CAV2 unchanged; clarify D18 with an independent/provenance-grounded witness condition; add narrow DomainSpec-local rules for individual-concept non-collapse and single canonical fact authorship; then implement validators/generators. Keep graph multiplicity and runtime cardinality independent. Surviving dissent: the evidence establishes that one of `creates` or `creation_targets` must be derived, but does not yet establish which should be canonical or what `creates` multiplicity should be.

## Agent 2 — computational corpus normalization

## Corpus audit — Shannon lane

### Initial position

The live model already demonstrates the right general pattern in three places: `owned-by` is generated rather than authored, `enforces-cross` is collapsed into `enforces + scope`, and Adapter/State Indicator variants are represented as aliases or projections rather than duplicate nodes. The main inconsistency is that this discipline is not applied uniformly to authored edge/attribute pairs.

`creates` is the strongest example: the edge and `creation_targets` are definitionally equivalent, independently authored, and checked for equality. That is consistency-by-duplication, not orthogonality. Separately, its `many_to_many` multiplicity is authoritative prose but neither corpus-witnessed nor executable.

### Corpus boundary and census

The derived registry covers four feature specs, 37 admitted concepts, and 34 authored edges; it reports no duplicate IDs, type drift, or relationship violations ([CONCEPT-REGISTRY.json:3-14](projects/domainspec-v2/definitions/CONCEPT-REGISTRY.json), [CONCEPT-REGISTRY.json:876-895](projects/domainspec-v2/definitions/CONCEPT-REGISTRY.json)). That proves identifier consistency, not semantic uniqueness.

Only 23 of 31 active relationship labels occur in current feature graphs. `belongs-to`, `composes`, `emits`, `owns`, `produces-for`, `reflects`, `shapes`, and `triggers-cross` lack live-feature witnesses; some have fixtures or residue only.

### Findings by candidate

| Candidate | Literal evidence | D20–D25 consequence | Verdict |
|---|---|---|---|
| `creates` edge + `creation_targets` | The same node authors both facts ([create-player-operation.json:7-10](projects/domainspec-v2/impl/spec/features/ui-profile-create-player/nodes/create-player-operation.json)); D26 declares the biconditional ([DEFINITIONS.md:1183-1201](projects/domainspec-v2/definitions/DEFINITIONS.md)). | Current D20 rejects either omission/mismatch in both Markdown and minted compiler ([relationship-signatures.ts:577-595](projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts), [relationship-signatures.ts:600-639](projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts), [compiler.ts:488-529](projects/domainspec-v2/impl/tools/minted-project/compiler.ts)). D22/D25 graph and per-node projections include the edge. D23 is not independent: the edge path is exactly recoverable from the attribute. D24 is unchanged. | **Semantic duplication with enforced parity.** Select one canonical authoring form and generate the other; preserve the current mismatch check at the canonical/generated boundary. |
| Form attributes + edges | `submission_action` duplicates `submits`; `target_interface` duplicates `contracts` in one source record ([create-player-form.json:7-17](projects/domainspec-v2/impl/spec/features/ui-profile-create-player/nodes/create-player-form.json)). | Removing attributes fails formation because both are required ([form.schema.yml:20-25](projects/domainspec-v2/impl/spec/meta-types/ui/form.schema.yml)); removing edges changes D22/D25 graph/traversal but no parity validator was found. | **Uncontrolled duplicate facts.** Drift can pass. Either derive edges from attributes or replace reference attributes with canonical edges. |
| Guard attribute + edge | `source_rule=CanCreatePlayer` duplicates `mirrors -> CanCreatePlayer` ([create-player-guard.json:7-17](projects/domainspec-v2/impl/spec/features/ui-profile-create-player/nodes/create-player-guard.json)). | Attribute removal fails formation ([guard.schema.yml:14-16](projects/domainspec-v2/impl/spec/meta-types/ui/guard.schema.yml)); edge removal only changes D22/D25. A mismatched rule reference and edge currently have no named D20 check. | **Uncontrolled duplicate fact.** Strong next test case for the general single-authoring rule. |
| Binding attribute + edge | `mode=mutate`, `target_kind=Operation`, `target_ref=CreatePlayer` duplicates `mutates -> CreatePlayer` ([create-player-binding.json:7-20](projects/domainspec-v2/impl/spec/features/ui-profile-create-player/nodes/create-player-binding.json)). | Body fields establish the durable Binding formation and differ from a pure edge ([binding.schema.yml:36-41](projects/domainspec-v2/impl/spec/meta-types/ui/binding.schema.yml)); nevertheless, the endpoint reference is duplicated and not parity-checked. | **Concept is non-duplicate; endpoint fact is duplicate.** Retain Binding because cache/mapping/lifecycle change D20/D21, but single-author its endpoint. |
| `owns` / `owned-by` | Root authority marks `owned-by` generated from `owns` ([relationships.yml:517-526](projects/domainspec-v2/definitions/relationships/relationships.yml)). Authored `owned-by` is explicitly rejected ([relationship-signatures.ts:473-484](projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts), [validate-relationships.test.ts:69-74](projects/domainspec-v2/impl/tools/tests/validate-relationships.test.ts)). | D20 distinguishes canonical from generated; D22 allows reverse navigation; D25 may generate it without creating second authority. | **Correct orthogonal pattern.** This is the reusable precedent. |
| `enforces-cross` | Deprecated as `enforces + feature-scope metadata` ([relationships.yml:542-547](projects/domainspec-v2/definitions/relationships/relationships.yml)). | No distinct D20–D25 result survives after scope is carried separately. | **Correct collapse precedent.** |
| `produces` vs `emits` | Valid fixture contains both `Operation produces Event` and `Entity emits Event` ([valid/SPEC.md:21-23](projects/domainspec-v2/impl/spec/__fixtures__/relationships/valid/SPEC.md)); reversed endpoint fixtures fail. | Different D20 endpoints and D23 paths: operation completion versus entity state announcement. | **Genuinely distinct relationships**, not synonymous facts. |
| `creates` vs `produces-for` | `creates` is same-feature and effect-bound; `produces-for` is cross-feature ([relationships.yml:52-82](projects/domainspec-v2/definitions/relationships/relationships.yml)). Cross-feature fixture passes only for `produces-for` ([validate-relationships.test.ts:35-50](projects/domainspec-v2/impl/tools/tests/validate-relationships.test.ts)). | Different D20 scope/effect decisions and D23 paths. | **Genuinely distinct**, even though both are `Operation → Entity`. |
| Adapter / State Indicator candidates | Adapter is one Mapping node with alias metadata, not a second node; State Indicator is a projection/role and no edge is authored ([SPEC.md:206-224](projects/domainspec-v2/impl/spec/features/ui-profile-create-player/SPEC.md)). | Avoids duplicate DS-D1 identities while preserving D22/D25 representation handles. | **Correct concept-level normalization.** |
| Generated graph/manifest copies | Outputs declare `generated-semantic-read-model` and `generated-provenance-read-model` ([graph.json:1-10](projects/domainspec-v2/impl/spec/features/ui-profile-create-player/generated/graph.json), [source-manifest.json:1-5](projects/domainspec-v2/impl/spec/features/ui-profile-create-player/generated/source-manifest.json)). | D22/D25 only; source paths and digests preserve provenance. | **Repeated serialization, not semantic duplication.** |

### Multiplicity audit

`multiplicity` belongs to the normative DS-D8 tuple ([DEFINITIONS.md:1127-1140](projects/domainspec-v2/definitions/DEFINITIONS.md)), but both executable relationship types omit the field ([relationship-signatures.ts:4-17](projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts), [compiler.ts:58-71](projects/domainspec-v2/impl/tools/minted-project/compiler.ts)). The validators enforce label, endpoint, scope, and source-effect—but not degree constraints. Changing multiplicity therefore changes the authority digest and generated receipts, but no semantic D20/D21 decision.

Specific evidence:

- `creates: many_to_many` explicitly permits several creator Operations per Entity ([decision:142-147](projects/domainspec-v2/authority/decisions/2026-07-22-operation-creates-entity.md)). Current witnesses are only `CreatePlayer → Player` and `GenerateSettlement → SettlementTransaction`; neither direction of many-to-many is witnessed.
- Unique creation ownership is absent. The precise candidate invariant is `∀ EntityType E, |creator_operations(E)| ≤ 1`. Whether one Operation may create several Entity types is a separate invariant.
- `orchestrates: one_to_many_ordered` has a positive one-to-many witness—one workflow targets two Operations ([agent-execution-orchestrator/SPEC.md:36-37](projects/domainspec-v2/impl/spec/features/agent-execution-orchestrator/SPEC.md))—but no edge ordinal is stored, so “ordered” is not executable.
- A legitimate many-to-many case is `enforces`: several Rules may independently gate one Operation, and one reusable Rule may gate several Operations. The relation has distinct D20 endpoints and D23 “check-before-mutation” behavior ([relationships.yml:101-114](projects/domainspec-v2/definitions/relationships/relationships.yml)); the current corpus witnesses only isolated pairs, so its degree claim still needs a multi-edge fixture.

### Executable fixture proposals

1. **Unique creator negative:** `CreatePlayer` and `ImportPlayer` both `creates Player`, with matching effects. Reject on the unique-creator invariant.
2. **Creator target-arity discriminator:** one Operation creates `Order` and `OrderLine`. This decides independently whether source arity is one or many.
3. **Legitimate M:N positive:** `RuleA → OpA`, `RuleA → OpB`, `RuleB → OpA` via `enforces`; all pass.
4. **One-to-many negative:** two Operations `produces` the same Event concept; reject target indegree greater than one.
5. **Many-to-one negative:** one Form `submits` to two Actions; reject source outdegree greater than one.
6. **Single-authoring drift negatives:** `Guard.source_rule=A` but `mirrors → B`; Form attributes name A while edges target B; Binding `target_ref=A` but `mutates → B`.
7. **Generated inverse positive/negative:** authored `owns` produces reverse navigation; authored `owned-by` remains rejected.
8. **Creates canonicalization pair:** accept a source containing only the selected canonical form and deterministically generate the other; mutation of generated output must fail provenance/parity validation.

### Conclusion

The strongest corpus-supported generalization is not “all edges must be one-to-one.” It is:

> Every semantic fact has one canonical authored representation; additional edges, attributes, inverses, and views must be derived or must prove an independently changing D20–D25 consequence.

Cardinality remains orthogonal to that rule. Some relations are legitimately many-to-many, but every declared degree constraint needs executable graph-level witnesses. `creates` currently has neither unique-creator enforcement nor evidence for its permissive many-to-many declaration.

### Robot-talks confrontation — Shannon

**Initial position:** The corpus already contains good generated-view and alias precedents, but applies them inconsistently: several edge/attribute pairs independently author one recoverable fact, while multiplicity remains recorded but unexecuted.

**ACCEPT — Lawvere and Spivak:** I accept that existing authority does not entail individual-concept uniqueness, canonical-fact single authorship, or any particular multiplicity. The registry only detects identical IDs and same-name type drift (`aggregate-concept-registry.ts:191-213`); differently named but semantically identical concepts pass. Likewise, both executable relationship representations omit `multiplicity` (`relationship-signatures.ts:4-17`; `compiler.ts:58-71`). This confirms their proposed DomainSpec-local specialization and their refusal to widen `CAV2-D22`.

**NARROW — Lawvere’s “relationship-type minimality is entailed”:** D3/D18 provide the necessary vocabulary, but not a closed sufficient test. D18 literally accepts any changed D20–D25 property, while D22 says projection change does not automatically justify authored authority and D25 permits generated-output change. A generator can therefore echo a candidate edge and manufacture its own witness. Spivak’s anti-laundering qualification is required before relationship-type minimality can be called operationally entailed.

**Empirical duplication versus semantic distinction:** Equal or repeated representation is not enough to collapse an element. Generated graph and manifest copies are legitimate because they declare generated authority and retain provenance. Guard versus Rule and Binding versus a pure relation remain distinct because formation, decision ownership, cache/mapping structure, and allowed edge participation change. By contrast, `Guard.source_rule=A` plus `Guard --mirrors--> A`, Form reference attributes plus matching edges, and `creation_targets` plus `creates` encode recoverable endpoint facts twice. Their additional serialization does not supply independent meaning.

**Executable gap versus paper sufficiency:** Paper authority can establish intended semantics and owner routing, but it cannot prove enforcement. `creates` parity is executable in both directions; unique creator ownership and every multiplicity constraint are not. Similarly, `orchestrates` is declared ordered but compiled edges carry no ordinal. A paper rule is sufficient for governance status only when labeled normative-but-unexecuted; an enforcement claim requires discriminating positive and negative fixtures.

**Final position:** Preserve CAV2 unchanged; add narrow DomainSpec rules for individual-concept non-collapse, one canonical authored representation per equivalent fact, generated provenance, and anti-laundered D20–D25 witnesses. Keep graph multiplicity and runtime instance count independent, then make selected graph cardinalities executable. Surviving owner decisions are which representation owns `creates`/`creation_targets`, whether creator uniqueness is required, and whether one Operation may target several Entity types.

## Agent 3 — ontology and governance specialization

## Spivak explorer return

### Initial position

The desired quality rule should not become a new CAV2 primitive called “model orthogonality.” The live authority already provides the basis, but at different layers:

```text
CAV2-D29  independent axes
    └── CAV2-D16  explicit coupling when independence fails

CAV2-D22  non-redundant classification admission
    ├── DomainSpec D6 / DS-D1  meta-type non-collapse
    └── DomainSpec D3/D18     relationship-type non-collapse
```

Two narrower DomainSpec gaps remain:

1. semantic non-collapse among individual Concept Registry nodes, as opposed to DS-D1 meta-types;
2. single canonical ownership of one fact across edges, attributes, aliases, and generated projections.

`creates` and `creation_targets` are not orthogonal: D26 explicitly couples them with a biconditional. That makes the coupling visible and CAV2-D16-compliant, but it still leaves two independently authored encodings of the same fact. Existing authority does not say one must be generated.

Cardinality is separate. Orthogonality cannot imply `one_to_one`, `one_to_many`, or unique creation ownership.

### Authority-routing matrix

| Concern | Existing owner and exact evidence | Proposed treatment | Owner gate / operational seat |
|---|---|---|---|
| General ontology shape | CAV2-D19 defines ontology as typed nodes, typed relations, provenance, confidence, state, and gates ([CAV2 definitions:881](</home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:881>)). Its boundary says ontology is not automatic authority ([line 960](</home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:960>)). | Reference only as structural framing. It does not entail graph minimality or fact uniqueness. | No CAV2 change. DomainSpec semantics remain in DomainSpec definitions. |
| Independent model axes | CAV2-D29 says authority-bearing axes are independently variable unless an explicit relation, schema rule, validator, gate, or decision couples them ([line 1800](</home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:1800>)). | Reference directly to keep concept identity, edge identity, representation form, graph multiplicity, runtime cardinality, and authority posture separate. | DomainSpec definitions-governance if a local decision procedure is needed. |
| Explicit dependency | CAV2-D16 requires a typed relation when objects cannot vary independently, including endpoints, relation kind, owner, evidence, and effect ([line 652](</home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:652>)). | Reference directly. Use it to expose coupling, not to claim that coupling is duplication or promotion. | Concrete dependency belongs in DomainSpec authority/schema; enforcement belongs in validators. |
| Classification minimality | CAV2-D22 admits a classifier only when it adds information not derivable from labels, fields, or typed relations ([line 1232](</home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:1232>)). Its operational scope is taxonomy, ontology, status, confidence, node-type, and similar labels ([line 1269](</home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:1269>)). | DomainSpec may cite it and create narrow local specializations. Applying it directly to every concept instance or fact representation would silently widen its scope. | DomainSpec definitions-governance. No CAV2 redefinition. |
| CAV2 primitive versus DS-D1 type | CAV2-D31 permits lower-layer specialization but forbids silent redefinition ([line 1970](</home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:1970>)); its boundary explicitly says a CAV2 primitive is not a DS-D1 meta-type ([line 2021](</home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:2021>)). | Do not call DomainSpec concepts or meta-types CAV2 primitives. | Any new CAV2 primitive would require CAV2 definitions-governance; none is justified here. |
| DS-D1 meta-type identity | D6 requires exactly one meta-type per concept and adds a node-side non-collapse challenge based on structural or authority-resolved edge witnesses ([DomainSpec definitions:230](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:230>), [line 250](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:250>)). | Reuse for the meta-type alphabet. Do not extend it to individual domain concepts: D6 explicitly distinguishes a meta-type from a concept. | Definitions owner. The challenge remains partly staged: its checker still labels itself `PROPOSED`, and its review acknowledges undetected “laundered” edge witnesses. |
| Individual Concept Registry identity | The aggregator detects duplicate IDs and same-name type drift ([aggregate-concept-registry.ts:191](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/tools/aggregate-concept-registry.ts:191>)); it does not compare lifecycle, identity criteria, ownership, behavior, or graph role across differently named IDs. | Add a narrow local **concept non-collapse procedure**, not a new CAV2 term. A second concept must name an independently owned identity/lifecycle/behavior/relationship consequence. | Definition/gate first; registry analysis and validator afterwards. |
| Relationship-type identity | D3 requires an edge type to add a non-redundant code/composition distinction ([DomainSpec definitions:109](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:109>)). D18 admits a relationship when removal changes at least one D20–D25 property ([line 723](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:723>)). | Reuse, but resolve a live ambiguity: D18’s existential test is broader than D3. A projection alone can satisfy the literal D18 set, while D22 says projection change does not automatically justify an authored relationship ([line 861](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:861>)). | Definitions owner must clarify which consequences are sufficient and prohibit self-created witnesses. |
| Witness laundering | D25 counts changed generated artifacts ([line 974](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:974>)). A candidate edge could otherwise “prove” itself by making a generator echo it. The D6 review documents the analogous undetected laundered-edge problem ([D6 review:51](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/reviews/2026-07-08-d6-node-noncollapse.md:51>)). | Specialize non-collapse with an independence/provenance condition: the separating consequence cannot exist only because the candidate was inserted. | Definitions owner; validators carry provenance-aware checks. |
| Aliases and inverses | `owns` declares `owned-by` as generated inverse; `owned-by` is explicitly noncanonical ([relationships.yml:261](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:261>), [line 517](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:517>)). `belongs-to` remains canonical because membership is not custody inverse. | Preserve this pattern: an alias or exact inverse points to one canonical target and is never a second authored node/edge. | Root relationship/representation policy plus validator. No new global definition unless generalized beyond relationships. |
| Compositions | D23 admits a distinction only when the typed composition path changes and rejects an existing path plus metadata ([DomainSpec definitions:896](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:896>)). | A relation wholly recoverable as path composition should be generated unless it has an independent semantic or validation consequence. | Definitions owner for admission; generator for projection. |
| Canonical fact ownership | No reviewed definition says one semantic fact has exactly one authored authority. D16 permits explicit coupled representations. | This is the narrow missing specialization: choose one authored authority per fact; classify equivalent forms as generated projections with provenance. | DomainSpec definitions-governance first, then schemas/validators/generators. |
| Multiplicity | DS-D8 owns graph-level multiplicity as part of the signature tuple ([DomainSpec definitions:1127](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:1127>)). | Keep multiplicity independent from non-collapse and runtime instance count. Unique creation ownership must be an explicit DS-D8 constraint supported by witnesses. | DS-D8 owner decision and cardinality validator. |
| `creates` / `creation_targets` | D26 states `O --creates--> E iff E ∈ O.creation_targets` ([DomainSpec definitions:1184](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:1184>)). Current decision deliberately requires both directions and assigns `many_to_many` ([decision:138](</home/vrondelli/projects/domainspec-core/projects/domainspec-v2/authority/decisions/2026-07-22-operation-creates-entity.md:138>)). | Current state is explicit coupling, not hidden coupling. To satisfy single authorship, the owner must choose either canonical edge → generated effect, or canonical effect → generated edge. Do not derive that direction—or creator uniqueness—from “orthogonality.” | Definitions-governance decision; then DS-D8/schema/validator/generated-view synchronization. |

### Counterexamples

Collapse cases:

- `Player` and `AccountHolder` have different IDs but identical identity, lifecycle, owner, operations, and relationship neighborhood. The current registry accepts both; one should be an alias or be removed.
- Authoring both `owns(A,B)` and `owned-by(B,A)` stores one fact twice. Current authority correctly makes the inverse generated.
- A direct `depends-on` edge that merely abbreviates an existing typed path adds navigation, not canonical meaning.
- A candidate relationship that passes D25 only because its generator copies the new label is a circular non-collapse proof.

Distinct-meaning cases:

- Entity and Value Object may share fields but remain distinct because identity versus no-identity changes formation and validation.
- `owns` and `belongs-to` share Entity endpoints and reverse-looking multiplicities, but custody/lifecycle responsibility differs from membership/classification.
- `creates` and `produces-for` share Operation→Entity endpoints but differ in scope, creation effect, allow/reject behavior, and generated trace.
- A genuinely plural association can remain `many_to_many` when its relationship meaning is independent and non-derived.

### Verdict

Use CAV2 as the basis, but do not widen it. The smallest coherent DomainSpec improvement is:

```text
existing type non-collapse
+ existing relationship non-collapse
+ new local fact single-authorship rule
+ new local individual-concept non-collapse procedure
+ anti-laundering requirement for every separating witness
```

No files were modified.

### Robot-talks confrontation — Spivak

**Initial position:** CAV2 already supplies the orthogonality/coupling basis, while DomainSpec needs only narrow local specializations for individual-concept non-collapse, canonical-fact single authorship, and witness independence—not a new root definition.

**ACCEPT — Shannon:** I accept the distinction between repeated serialization and semantic duplication. Generated graph/manifest copies carrying generated authority and source provenance are projections, not competing facts. By contrast, an authored edge and authored attribute related by an exact biconditional assert the same proposition twice and require parity enforcement. This distinction is supported by the existing `owns → generated owned-by` pattern and by D22/D25’s explicit non-authoritative projection boundary.

**ACCEPT — Lawvere:** I accept that CAV2-D22 cannot be applied directly to every model element. Its owned scope is classifier/label/grouping admission; CAV2-D31 permits lower-layer specialization but forbids silent redefinition. The repair therefore belongs in DomainSpec and must cite CAV2-D16/D22/D29 without transferring or expanding CAV2 authority.

**NARROW — Lawvere:** “Relationship-type minimality is entailed” is too strong. D3 requires different code/composition, while D18 literally permits eligibility when any D20–D25 property changes. Yet D22 says projection change alone does not automatically justify authored authority, and D25 can be satisfied circularly if a generator merely echoes the candidate. Existing relationship non-collapse is substantial but incomplete until sufficiency and anti-laundering are clarified.

**NARROW — Shannon:** Calling `creates + creation_targets` “consistency-by-duplication” accurately describes representation, but current authority deliberately admits that dual authored form through D26’s typed biconditional. CAV2-D16 permits explicit coupling; it does not require one side to be generated. Therefore this is a model-quality pressure, not a present authority violation. A local single-authorship rule and owner decision must precede canonicalizing either direction.

Likewise, Adapter/State Indicator normalization is useful evidence, but it comes from a synthetic UI profile with deferred merge/split candidates. It is a precedent, not yet a general DomainSpec authority rule.

**Predicted disagreement — serialized duplication versus semantic identity:** identical bytes or repeated nodes in generated projections are harmless when authority posture and provenance remain one-way. Semantic duplication exists when two authored model elements claim the same identity or proposition and neither has an independent identity, lifecycle, validation, composition, ownership, or generation consequence. Conversely, similar structure does not collapse `Invoice` and `Receipt` if those independently owned consequences differ.

**Predicted disagreement — specialization versus unnecessary root definition:** no new CAV2 definition survives. Reuse D6 for meta-type kinds and D3/D18 for relationship types; add DomainSpec-local procedures for concept instances and canonical facts, plus an anti-laundering condition. Keep schema, validator, alias, inverse, and generated-view mechanics downstream of that owner-approved semantic rule.

**Final position:** the converged result is local single authorship plus concept-instance non-collapse and provenance-independent witnesses, with cardinality remaining a separate DS-D8 axis. Surviving dissent: D3/D18 sufficiency needs owner clarification; current `creates` dual authorship remains valid until that gate changes it; UI normalization examples cannot alone establish a general rule.

## Connections

- derives: `./findings.md`
