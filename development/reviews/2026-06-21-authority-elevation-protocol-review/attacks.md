# Authority Elevation Protocol Review - Attacker Returns

Dispatch: `2026-06-21-authority-elevation-protocol-review`

This file collects the six first-wave attacker returns used by the writer and verifier lanes.

## Rittel - Protocol Mechanics Under Contested Governance

Agent id: `019ee84b-8239-73d1-b29b-aa135b3c3860`

### Survivors After Attack

1. Decision-gate is named but not operationalized.

The draft says cross-context promotion may need a decision gate, but it does not say what the gate decides, what evidence counts, who owns the gate, or what happens after disagreement. This matters most for artifacts like `schema`, `constitution`, `discipline`, and `axiom`, where the source owner and target owner may both have legitimate authority.

2. Public/private boundary review is too reference-shaped.

The proposed rule says keep public/private provenance, but a promoted higher artifact can accidentally launder private assumptions into a generic public-sounding primitive. Boundary review needs to cover source content, implied obligations, examples, and naming, not just path provenance.

3. Conflicting authority contexts are modeled as single-source adaptation.

The current model works if `arcanum/schema` has one clean source and v2 simply generalizes it. It is weaker when `arcanum`, `domainspec-formalization`, `framework-unification`, and `ontology-vault` each imply incompatible schema notions. The protocol needs a merge/conflict lane, not only source-to-target elevation.

4. Rejection and blocked adoption are under-specified.

If a candidate is useful in origin but wrong for v2, the protocol needs a durable rejection or local-only record so the same candidate is not rediscovered repeatedly as novelty.

5. "Elevated" versus "only locally adapted" is fuzzy.

The draft lets a target create a local adaptation and link back, but does not make the threshold explicit for when that local adaptation becomes a higher reusable primitive.

### Fixes Proposed

1. Add a decision-gate contract:

Required fields:
- `question`: the disputed authority move.
- `contenders`: source artifacts or contexts.
- `decision_owner`: context or governance owner.
- `required_evidence`: minimal evidence classes.
- `verdict`: `promote`, `adapt`, `specialize`, `reject`, `defer`.
- `aftercare`: drift check, origin reference, or rejection note.

2. Add a boundary-review checklist:

For any public/general target:
- Does the candidate contain private source text?
- Does it imply private obligations or institutions?
- Does its example set leak private project shape?
- Does its name overclaim universality?
- Is the source path classified public, private, mixed, or unknown?

3. Allow multi-source authority records.

Instead of only:

```yaml
source_context: arcanum
target_context: cyberAlchemy-v2
```

support:

```yaml
sources:
  - context: arcanum
    role: originating schema vocabulary
  - context: framework-unification
    role: generalized target pressure
  - context: domainspec-formalization
    role: formal constraint evidence
conflict_status: reconciled | partial | unresolved
```

4. Create a rejection record schema.

Minimum:

```yaml
candidate: schema
source_context: arcanum
target_context: cyberAlchemy-v2
verdict: reject | local-only | defer
reason: ...
revisit_trigger: ...
```

5. Split `local-only adaptation` from `canonical elevation candidate`.

### Refuted Concerns

- A generic protocol is not inherently too abstract, if it is anchored by artifact-kind profiles.
- "Promotion" alone is insufficient; it cannot represent contested source-to-target movement before canonization.
- A simple hierarchy is insufficient; authority contexts are a graph with occasional upward generalization.

### Recommendation

Do not promote the current protocol as a constitution rule unchanged. It can pass as a candidate definition if it carries the contested-governance caveat. Before constitution-level use, add explicit decision-gate, boundary-review, multi-source, and rejection mechanics.

Best naming from this lens:

- Generic: `Authority Movement Protocol`
- Movement kind: `elevation`
- Gate event: `promotion`
- Artifact-specific profile: `Definition Elevation Profile`

## Bateson - Protocol Unification Across Artifact Types

Agent id: `019ee84b-7bc9-7a33-bb7e-94c2ac49a4f3`

### Survivors After Attack

1. The current primitive is still too definition-shaped.

The draft can be stretched to schema, constitutions, axioms, and disciplines, but its mechanics still assume the moved thing is a term-like artifact with semantic deltas and definition indexes. Constitutions and disciplines also move obligations, permissions, execution norms, enforcement surfaces, and lifecycle gates.

2. Promotion and elevation are entangled.

The draft uses "elevation" for cross-context upward movement and "promotion" for canonization, which is useful. But the proposed term "definition elevation protocol" risks hiding that promotion is a gate verdict, while elevation is a relation/movement pattern. They should be different axes.

3. The relationship vocabulary is not symmetric enough.

The protocol needs more than "origin reference" and "adapted from". Lower contexts can adopt, adapt, specialize, inherit under authority, reject, defer, supersede, and export candidates upward. A schema from Arcanum entering v2 is not the same relation as v2 schema being inherited by adjacent projects.

4. The ladder model fights the tower/context graph.

"Higher" is real when v2 is being used as a shared stable layer. But the protocol should model authority contexts as typed graph nodes, with elevation as one allowed movement direction. This avoids pretending every move is vertical.

5. Origin reference is too post-promotion-biased.

Origin relation must exist before promotion. Otherwise target contexts can debate a candidate without preserving why it is not already target-native.

6. Inheritance is feared but not typed.

The user wants Arcanum and Saturn to inherit definitions, governance, and constitutions from cyberAlchemy while still having their own. The protocol should not avoid inheritance; it should type it.

### Fixes Proposed

1. Top primitive should be:

`authority movement protocol`

Definition:

> A governed mechanism for moving, relating, adapting, rejecting, or canonizing authority artifacts between authority contexts while preserving source authority, target authority, deltas, gates, and drift obligations.

2. `definition elevation protocol` should become a profile:

> The artifact-kind profile of authority movement where the moved artifact is a definition.

3. Separate `movement_kind` from `gate_verdict`.

Example:

```yaml
movement_kind: elevation
artifact_kind: schema
source_context: arcanum
target_context: cyberAlchemy-v2
relation_mode: adapted_from
gate_verdict: candidate
```

Then later:

```yaml
gate_verdict: promoted
```

4. Required relation modes:

- `adopts_without_delta`
- `adapts_with_delta`
- `specializes_for_context`
- `inherits_under_owner`
- `elevates_to_higher_context`
- `rejects_for_context`
- `defers_pending_evidence`

5. Use a typed graph:

```yaml
authority_context:
  id: cyberAlchemy-v2
  role: stable-core
  may_receive_from:
    - arcanum
    - framework-unification
    - domainspec-formalization
  may_export_to:
    - arcanum
    - saturn
    - adjacent-contexts
```

6. General record name:

`authority_relation_record`

with artifact-kind-specific fields:

- definitions: semantic delta, canonical wording.
- constitutions: obligation delta, enforcement surface.
- axioms: dependency proof, contradiction scan.
- disciplines: practice scope, owner role, failure mode.
- schema: structural delta, validation surface.

7. Add inheritance relation:

`inherits_under_source_authority`

Meaning: the lower context uses the higher artifact without owning its canonical definition, unless it records a local adaptation.

### Recommendation

Do not canonize `definition elevation protocol` as the top primitive. Design the broader `authority movement protocol`, then define:

- `promotion`: an authorization event.
- `elevation`: a movement kind.
- `adaptation`: a relation mode.
- `inheritance`: a governed use relation.
- `definition elevation`: one artifact-kind profile.

## Russell - Promotion Sufficiency Attack

Agent id: `019ee84b-79cb-7230-a480-439c3de8a111`

### Claim Tested

"Promotion alone is enough. We do not need elevation as a primitive."

### Survivors After Attack

1. Promotion is not canonical authority yet in v2.

`cyberAlchemy-v2/authority/promotion-policy.md` exists, but it explicitly says it does not yet create independent canonical artifact definitions or enforcement schemas. So using "promotion" alone as the primitive would lean on a policy that is itself still provisional.

2. The adaptation-candidate state is central but missing from a simple promotion ladder.

The refine result already distinguishes source-originated artifacts from target-owned canonical artifacts. This intermediate state is exactly where "schema from Arcanum becomes a v2 candidate" lives. A binary promoted/not-promoted model loses that work.

3. The relation vocabulary is unstable.

The current files mix "promotion", "elevation", "inheritance", "adaptation", "origin", and "source authority" without a single typed relation model. Promotion can name one gate transition, but it cannot carry the whole relation vocabulary.

4. Authority context is still implicit.

The draft talks about "higher" and "lower" contexts, but does not yet define authority context as a primitive. Promotion without an explicit source/target authority context risks silently recanonizing origin terms in v2.

5. Promotion does not cover post-promotion origin/drift maintenance.

After promotion, origin contexts still need back-reference, compatibility checks, drift handling, and possible local override. Those are relation lifecycle concerns, not only promotion concerns.

### Refuted Concerns

1. "Elevation causes hidden takeover."

Refuted if elevation is defined as a candidate movement that preserves origin constraints and requires promotion for canonical authority.

2. "Higher tower prestige makes everything universal."

Refuted only if the protocol requires `target_scope` and `applicability_basis`.

3. "Inventory/ontology can absorb this without protocol."

Refuted. Inventory can index; ontology can map. Neither by itself decides authority movement.

4. "Structural enforcement should be done now."

Partially refuted. We need a record shape now, but executable validation can follow after the term model stabilizes.

### Recommended Resolution

Do not replace promotion with elevation.

Use:

- `promotion` for the owner-gated event that makes an artifact canonical in a target authority context.
- `elevation` for a governed movement where a source-context artifact is generalized or raised into a broader authority context as a candidate, preserving source constraints and requiring promotion before canonization.
- `authority movement protocol` for the generic mechanism across definitions, schemas, constitutions, axioms, disciplines, and methods.

Therefore the protocol should be:

> Authority movement is the generic primitive. Elevation is one movement kind. Promotion is the gate verdict that grants target authority.

## Shannon - Trace and Drift Survival Attack

Agent id: `019ee84b-8784-7622-8e88-724778170031`

### Survivors After Attack

1. The protocol is design-level, but drift survival needs a material schema.

The draft says origin reference and drift checks are required, but it does not yet define the minimal record fields that make a later agent able to answer:

- Where did this candidate come from?
- What exact source revision did it depend on?
- What target artifact accepted or rejected it?
- What local delta was introduced?
- Who must re-check it if origin changes?

2. Relation names drift between lanes.

The current vocabulary includes promotion, elevation, adaptation, inheritance, origin reference, lower context, higher schema, adjacent context, and tower. Without a small relation-name registry, the inventory will fragment the same relation into near-synonyms.

3. Evidence confidence is not carried as fields.

Evidence quality now appears in prose. For long-lived v2, a promoted artifact should preserve whether its source evidence is direct source, inferred synthesis, user intent, formal artifact, or local review.

4. Drift state can stale.

The protocol needs invalidation triggers or review horizons. Otherwise "source still valid" becomes a claim no one owns.

5. Use modes are implicit.

The same artifact can be used as source authority, local representation, adaptation candidate, promotion evidence, local canon, generated read model, or structural rule candidate. If use mode is not explicit, later searches will mix authoritative and non-authoritative material.

6. Structural delta is under-specified.

For schemas and constitutions, semantic delta is not enough. Need structural delta and enforcement delta.

### Minimal Origin-Reference Record Contract

```yaml
id: authority-relation/<stable-id>
artifact_kind: definition | schema | constitution | axiom | discipline | method | governance | inventory | ontology
artifact_name: schema
source_context: arcanum
source_ref:
  path: arcanum/definitions/...
  revision: <commit-or-version-or-inventory-snapshot>
  role: source-authority | evidence | example | conflicting-source
target_context: cyberAlchemy-v2
target_ref:
  path: cyberAlchemy-v2/authority/...
  revision: <commit-or-version-or-draft-run>
relation_mode: adopts_without_delta | adapts_with_delta | specializes_for_context | elevates_to_higher_context | inherits_under_source_authority | rejects_for_context | defers_pending_evidence
movement_kind: elevation | adoption | adaptation | specialization | inheritance | rejection | deferral
gate_verdict: candidate | promoted | rejected | deferred | local_only
use_mode: source-authority | local-representation | adaptation-candidate | promotion-evidence | local-canon | read-model | structural-rule-candidate
semantic_delta: required-if-changed
structural_delta: required-for-schema-or-constitution
enforcement_delta: required-if-obligations-change
evidence_confidence: direct | synthesized | inferred | contested | unknown
commitment_confidence: experimental | provisional | stable | constitutional
confidence_basis_ref: path-or-review-id
valid_until_or_trigger: date | source_revision_change | target_policy_change | manual_review
next_drift_check_owner: context-or-role
```

### Relation-Name Registry Requirements

Each relation must define:

- canonical name.
- aliases/deprecated names.
- allowed source endpoint types.
- allowed target endpoint types.
- whether it changes ownership.
- whether it requires a decision gate.
- whether it can be inherited downstream.
- drift owner.

### Recommendation

Pass the current idea as a governed design artifact, but block implementation until two things exist:

1. `authority_relation_record` contract.
2. `authority_relation_registry`.

Without those, the protocol will create prose agreement but not reusable inventory.

## Noether - Elevation Necessity Attack

Agent id: `019ee84b-7aa6-7a33-bb7e-94c2ac49a4f3`

### Claim Tested

"Promotion is enough; elevation is unnecessary."

### Survivors After Attack

1. Promotion is a standing-policy primitive, while elevation is still only a run-level concept.

The current v2 policy already has promotion language. The refine result invents elevation as a needed relation but does not yet anchor it in canonical v2 authority. That is a gap, not a reason to remove elevation.

2. Hierarchy is implied by tower language but not enforced by policy.

The user explicitly wants lower contexts like Arcanum and Saturn to inherit from cyberAlchemy while preserving their own local definitions. This requires an operation that can move candidate material upward and then expose it downward. Promotion alone only says "accepted here"; it does not explain the upward movement.

3. Lower-context use semantics can be lost after canonicalization.

If Arcanum's `schema` becomes v2 `schema`, the origin semantics may become invisible unless elevation records the original use and the target generalization separately.

4. Origin reference is a precondition, not aftercare.

The current draft treats origin reference mostly as post-promotion drift control. For elevation, origin reference should constrain promotion before it happens: a target cannot claim a generalized primitive unless it can say exactly what source obligations were kept, changed, or discarded.

5. Authority home is undecided.

The draft says the protocol itself may live as a definition first and later become constitutional. That is right, but it needs a two-artifact promotion path:

- definition: what elevation means.
- constitution/governance: what must happen when elevation is performed.

### Fixes Proposed

1. Add `elevation` as a distinct operation between source representation and local authority proposal.

2. Every elevation candidate must name:

- `source_context`
- `target_context`
- `tower_need`
- `altitude_delta`
- `semantic_delta`
- `structural_delta` when applicable
- `origin_constraints`
- `downstream_inheritance_policy`

3. Add lower-context preservation:

An elevated artifact must preserve:

- source-local meaning.
- target-generalized meaning.
- allowed downstream inheritance.
- forbidden reverse overwrite.

4. Split origin into:

- `origin_constraint`: before promotion.
- `origin_back_reference`: after promotion.

5. Promote two artifacts:

- `authority elevation` as a definition.
- `authority movement protocol` or `authority relation protocol` as the generalized governance mechanism.

### Recommendation

Do not treat this as ordinary promotion.

Use:

> elevation by typed adaptation

as the movement from a source context to a higher organizing context, and use:

> promotion

only for owner-gated canonicalization inside the target.

The next durable move should be both definitions-governance and constitution-governance: define the terms first, then encode the rule that no elevation may be promoted without origin constraints and downstream inheritance policy.

## Ashby - Lifecycle Control Attack

Agent id: `019ee84b-7e36-7ef3-92a0-352c945bbab0`

### Survivors After Attack

1. The protocol is definition-strong but authority-type weak.

It can explain how a term moves upward, but it does not yet give different lifecycle states for definitions, constitutions, axioms, disciplines, schemas, methods, and governance artifacts.

2. Constitution and axiom lifecycle are explicitly not ready.

The refine output itself says it is not yet ready to mutate constitutions. That should be preserved as a block, not softened into a general protocol.

3. Relation model is not executable enough.

"Origin reference", "adaptation", and "promotion" are meaningful but not yet constrained with allowed transitions.

4. "Flag" is too permissive near promotion boundaries.

For a canonical v2 artifact, unknown source authority should not be merely flagged. It should block promotion. It can be allowed for inventory representation, search, or local exploration.

5. Method/schema/spec/rule boundary is under-specified.

The user is moving toward all definitions inside v2. If "schema" becomes primitive, it may be a definition, a method, a validation artifact, and a discipline rule. The lifecycle must say which surface is authoritative.

### Fixes Proposed

Add a per-artifact lifecycle matrix:

```yaml
artifact_kind: definition
allowed_states:
  - observed
  - source-represented
  - adaptation-candidate
  - target-candidate
  - promoted-canonical
  - deprecated
gate_owner: definitions-governance
blocks:
  - unknown_source_authority
  - missing_semantic_delta
```

```yaml
artifact_kind: constitution
allowed_states:
  - observed
  - source-represented
  - governance-candidate
  - decision-gated
  - promoted-constitutional
  - superseded
gate_owner: constitution-governance
blocks:
  - missing_owner
  - missing_obligation_delta
  - missing_enforcement_surface
  - private_boundary_unreviewed
```

For every kind:

- artifact type.
- allowed states.
- transition names.
- required evidence.
- gate owner.
- block conditions.
- mutation scope.
- drift owner.

Also:

- `unknown_source_authority` blocks promotion.
- `unknown_source_authority` only flags representation/search.
- Create origin-reference schema before mutation.
- Create promotion-record schema before task-session mutation.

### Recommendation

Pass the current work as a non-executed `definition elevation protocol` design.

Do not pass it as full `authority elevation protocol` yet.

Next move:

1. Use definitions-governance to define:
   - authority context.
   - authority movement.
   - elevation.
   - promotion.
   - adaptation.
   - inheritance.
   - origin constraint.
2. Then use constitution-governance or invoke-design to define lifecycle/gate rules.

Best naming from lifecycle lens:

- `authority movement protocol` is the generic family.
- `definition elevation protocol` is the first profile.
- `promotion` is a transition verdict, not the whole mechanism.
