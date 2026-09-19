# Categorical Language Critique Lane

## Scope

This lane stress-tests the hypothesis that the DomainSpec language should start as a category-theory-oriented contract language. The useful version of that hypothesis is modest: category theory can provide a small language for typed artifacts, valid transformations, composition, identity, and authority-preserving projections. It should not become the user-facing syntax, the proof burden, or a replacement for concrete DomainSpec and Arcanum artifact evidence.

The critique is bounded by the current handoff and context pack. `projects/domainspec-language/DOMAINSPEC-LANGUAGE-HANDOFF.md` requires a generic language for contracts, schemas, iteration records, examples, validations, blockers, lifecycle states, and promotion status. `projects/domainspec-language/CONTEXT-PACK.md` names the first evidence set: dispatch-spec route schema, invoke handoff, Craft interface contract/schema/example/validation, and Craft interaction contract/schema/example/validation. The dispatch route adds an explicit rule for this lane: every categorical term must map back to a concrete DomainSpec or Arcanum artifact path and must remain explanatory until a decision gate approves language semantics.

## Useful Formal Concepts

`Object` is useful if it means a typed artifact with identity, owner, lifecycle state, and validation surface. Good DomainSpec objects include `contract`, `schema`, `iteration`, `use_case`, `example_fixture`, `validator`, `handoff`, `receipt`, `gate`, `decision`, `blocker`, and `definition`. This helps because the language needs to distinguish semantic agreement from structural representation and from change history.

`Morphism` is useful if it means an allowed, auditable transformation between typed artifacts. Examples include contract-to-schema implementation, schema-to-example fixture validation, handoff-to-receipt return, receipt-to-local-application, blocker-to-refined-blocker, candidate-definition-to-promoted-definition, and draft-to-validated lifecycle movement. This helps validation and traceability because each transformation can require inputs, outputs, owner authority, and evidence.

`Composition` is useful for chained workflows where the output of one valid transformation becomes the input to another. Craft interaction shows this clearly: `prepare_handoff` creates one owner capability handoff, `receive_receipt` records the native verdict, and `apply_receipt` applies it locally only under policy. Dispatch routes also compose steps with declared inputs, outputs, gates, observability, and stop conditions. The language should model composition as a validation concern: the composite is valid only when every intermediate boundary and receipt remains valid.

`Identity` is useful as a preservation rule. A schema that represents a contract must preserve the contract identity it claims to implement. A Markdown view must not become the state owner when YAML is declared the source of truth. A receipt must preserve the native producer verdict instead of rewriting it. Identity also helps lifecycle: an iteration changes a known artifact from previous state to next state rather than silently creating an unrelated artifact.

`Product` is useful if kept concrete: a bundled artifact that combines independent dimensions without collapsing them. A language design package may combine contract, schema, iteration, examples, validators, and open decisions as coordinated parts. A dispatch step combines capability, pattern, inputs, outputs, techniques, and stop conditions. The value is completeness checking: all required dimensions are present.

`Pullback` is useful only as an internal design metaphor for compatibility across shared evidence. For example, a Craft interaction ledger row and a dispatch receipt can be checked against a shared `capability_ref`, status, artifact, and validation boundary. A future DomainSpec crosswalk can align DomainSpec taxonomy and Arcanum taxonomy through shared owners and evidence paths. Use the plain term `compatibility check` in artifacts unless the formal term earns its keep.

`Functor` is useful at projection boundaries, not as a broad abstraction. A schema can be a structure-preserving projection of a contract into machine-checkable fields. A Markdown summary can be a projection of a YAML ledger into a human-readable view. A dispatch route can be projected into runtime handoff requirements, but the projection must not promote runtime success from route-shape success. This helps preserve authority boundaries.

`Validation as structure-preserving mapping` is highly useful. Validators should prove that a representation preserves required structure: required fields, allowed enums, reference integrity, lifecycle state, source ownership, gate behavior, and receipt requirements. This maps directly to `dispatch.schema.yml`, Craft ledger validation rules, and the handoff activation gates.

`Lifecycle transition` is useful as a typed morphism guarded by evidence. The handoff asks the language to represent draft, refined, gated, implemented, validated, promoted, superseded, and blocked. Those states should not be passive labels. Moving between them should require the right owner, validation result, and iteration record.

`Promotion authority` is one of the most useful formal boundaries. Candidate definitions remain local unless promoted by an owner route. Arcanum artifacts can be mapped as evidence, but lifecycle and promotion authority stay with their owning sigil, spell, formulae, or framework package. A formal language should make promotion impossible to imply accidentally.

## Concepts To Avoid Or Defer

Avoid making category theory the user-facing grammar. DomainSpec users need to write contracts, schemas, iterations, blockers, fixtures, and gates. They should not need to write `Obj`, `Hom`, `Cat`, `F`, natural transformations, or diagrams unless a specialized research artifact asks for them.

Avoid universal constructions as first-class vocabulary in the first version. Products and pullbacks may help the designers reason about bundles and compatibility, but the language can say `bundle`, `projection`, `compatibility_check`, and `shared_evidence` instead.

Defer natural transformations. They might eventually describe migrations between schema versions or translations between syntax surfaces, but the first design has more urgent needs: contract/schema separation, lifecycle states, validation authority, fixtures, and iteration records.

Avoid treating every relationship as a morphism. Some relations are evidence links, containment, ownership, dependency, reference integrity, source authority, or temporal ordering. Overloading them all as morphisms would obscure validation.

Avoid treating composition as proof of semantic success. Dispatch route validation is route-shape evidence only. Invoke plan output is authoring/planning evidence, not execution evidence. Task-session pass still needs recomposition evidence before Craft closure. Composition must carry verdict boundaries forward.

Avoid category-theory terms that do not change validation, composition, authority, traceability, or iteration. If a term cannot produce a required field, a gate, a validation rule, a better fixture, or a clearer receipt, leave it out.

## Concrete Evidence Mappings

`projects/domainspec-language/DOMAINSPEC-LANGUAGE-HANDOFF.md` maps to the top-level language problem: contract, schema, and iteration must be separate document kinds. This supports the object model: semantic contract object, structural schema object, and iteration/change object.

`projects/domainspec-language/CONTEXT-PACK.md` maps to the evidence boundary: the language needs source authority, validation authority, lifecycle states, first-class gaps/blockers, definitions, examples as fixtures, and handoffs as bounded contracts.

`arcanum/formulae/dispatch-spec/dispatch.schema.yml` maps to schema object, route composition, gate object, subagent lifecycle object, receipt object, boundary evidence, and validation authority. The schema requires route fields such as `dispatch_id`, `intent`, `mode`, `steps`, `gates`, and `observability`; it also names stage receipts and lifecycle fields such as `spawn_status`, `join_status`, `close_status`, `residue`, and `reroute`.

`arcanum/spells/invoke/handoff.md` maps to handoff object, projection boundary, activation gate, and context-preserving transformation. Handoff mode converts a prior session plus a new prompt into a bounded artifact and next route without mutating the target sigil, spell, project, or work-pack.

`arcanum/development/craft/CRAFT-INTERFACE.md` maps to method morphisms and identity constraints. Methods such as `start_project`, `state`, `describe`, `add_blocker`, `refine_blocker`, `open_decision`, and `decide` define inputs, writes, returns, and invariants. The storage contract keeps `.craft/ledger.yml` as source of truth and `CRAFT.md` as view.

`arcanum/development/craft/CRAFT-INTERFACE-LEDGER-SCHEMA.yml` maps to schema-backed validation rules. Examples include exactly one current `next_move` for active contexts, parent and recomposition paths for non-root contexts, blocked direct resolution of raw blockers, local-only candidate definitions unless owner-promoted, and closure requiring validation plus recomposition evidence.

`arcanum/development/craft/CRAFT-INTERACTION-CONTRACT.md` maps to authority-preserving composition. Craft owns route memory and recursive ledger state; the called capability owns its native artifact contract, validation, and verdict. `classify_route`, `prepare_handoff`, `receive_receipt`, `apply_receipt`, and `open_residue` form a useful transformation chain.

`arcanum/development/craft/CRAFT-INTERACTION-LEDGER-SCHEMA.yml` maps to handoff and receipt objects. It requires one owner capability per `route_handoff`, one handoff per `receipt`, native verdict preservation, blocked receipt closure prevention, route-shape-only dispatch evidence, recomposition evidence for task-session closure, and authoring/planning-only invoke output.

`arcanum/development/craft/CRAFT-INTERFACE-VALIDATION.md` and `arcanum/development/craft/CRAFT-INTERACTION-VALIDATION.md` map to validation as structure preservation. They check method coverage, schema review, fixture review, and hard gates without claiming runtime helper or promotion readiness.

`projects/domainspec-language/research/domainspec-language-category-contract-research.dispatch.json` maps to the lane authority itself. It permits `category_theory_contract_modeling` only when each formal concept maps to existing evidence, blocks parser work before design approval, requires concrete path evidence, and keeps promotion with DomainSpec/Arcanum owners.

## Proposed Minimal Formal Vocabulary

Use `artifact_kind` for typed objects: `contract`, `schema`, `iteration`, `fixture`, `validator`, `handoff`, `receipt`, `gate`, `decision`, `blocker`, `definition`, `use_case`.

Use `artifact_id`, `owner`, `source_authority`, `validation_authority`, and `lifecycle_state` for identity and authority preservation.

Use `implements`, `validates`, `projects_to`, `derives_from`, `hands_off_to`, `receives_from`, `applies_to`, `promotes_to`, `supersedes`, and `blocks` as named relation or transformation types. These are more usable than raw `morphism`.

Use `composition_rule` for allowed chains. A composition rule should name input kind, output kind, required intermediate artifacts, allowed owners, gates, and receipt requirements.

Use `identity_rule` for preservation requirements. Examples: preserve contract id across schema implementation, preserve source-of-truth owner across views, preserve native verdict across receipts, preserve previous artifact identity across iteration.

Use `projection` for structure-preserving mappings from richer artifacts to narrower artifacts, such as contract-to-schema, ledger-to-summary, route-to-runtime-handoff, and design-to-fixture-plan.

Use `compatibility_check` for the small subset of pullback-like checks where two artifacts must agree through shared fields, shared evidence, or shared authority.

Use `promotion_rule` for owner-reviewed movement from candidate or local state to active, canonical, or promoted state.

## Gaps And Risks

The current evidence strongly supports typed artifacts and authority-preserving transformations, but it does not yet prove that category theory should be the public conceptual frame. The public language may be clearer if it uses contract-native words while category theory remains an internal design discipline.

The first design still needs a syntax decision. YAML-first, DSL-first, or dual-surface syntax should remain decision-gated because syntax can accidentally collapse contract and schema or promote a representation before the model is stable.

The category model can overfit to Arcanum/Craft if the first fixtures do not include at least one non-Craft route-oriented artifact such as dispatch-spec or invoke handoff.

Validation authority is not yet implemented for the future DomainSpec language. Current validators can validate dispatch and Craft candidate artifacts, but a language validator must wait until design and work-pack approval.

Promotion semantics are high risk. Candidate definitions, local Craft contracts, and research crosswalks must not be promoted by vocabulary alone. The language needs explicit owner, gate, evidence, and receipt fields for promotion.

Lifecycle transitions need more precision. The handoff names states, but the first design should specify which transitions are allowed, which owner may perform each transition, and which evidence is required.

Compatibility vocabulary needs restraint. Pullback-like reasoning may help with taxonomy crosswalks and shared receipt fields, but using the term directly could make ordinary artifact compatibility harder to review.

## Recommended Next Artifacts

Create `research/category-contract-model-frame.md` as a design-facing frame that uses plain DomainSpec vocabulary with a short appendix mapping the internal category-theory concepts.

Create `research/formal-vocabulary-decision.md` or fold the choice into the planned syntax and authority decision gate. The decision should ask whether category theory remains internal, appears as optional explanatory notes, or becomes part of the public language.

Create `research/language-lifecycle-transition-table.md` with allowed states, transitions, owners, required evidence, validation authority, and failure behavior.

Create `research/contract-schema-iteration-fixture.yml` as a small fixture that includes one contract, one schema projection, one iteration record, one validator binding, one example fixture, and one promotion rule.

Create `research/authority-preserving-composition-rules.md` for handoff-to-receipt, contract-to-schema, schema-to-fixture, dispatch-route-to-stage-receipt, and candidate-definition-to-promotion chains.

Create a first validation plan with at least two fixture families: Craft interface or interaction plus dispatch-spec or invoke handoff.

## Receipt

- dispatch_id: domainspec-language-category-contract-research-20260608
- step_id: step-03-categorical-model-frame; step-05-synthesis-design-outline
- capability_ref: distill
- status: pass
- artifacts: projects/domainspec-language/research/lanes/categorical-language-critique-lane.md
- validation: Checked required report structure; grounded formal terms in concrete paths from handoff, context pack, dispatch schema, invoke handoff, Craft contracts, Craft schemas, and Craft validation notes; no parser or validator implementation attempted.
- observer_status: not_emitted; local lane report only
- blockers: none
- residue: Public-facing language should probably avoid direct category-theory terms until syntax and authority decision gate resolves the vocabulary boundary.
- handoff_note: Use this lane as critique input for `research/category-contract-model-frame.md`, `research/language-design-package-outline.md`, and the syntax/authority decision gate.
- agent_id: codex-categorical-language-critic-lane
- role_id: categorical-language-critic
- spawn_status: spawned
- join_status: completed
- close_status: closed
- reroute: none
