# Arcanum Taxonomy Evidence Lane

## Scope

This lane maps existing Arcanum artifacts that can support a generic DomainSpec language for contracts, schemas, rules, lifecycle records, examples, validation, handoffs, and receipts. It treats Arcanum artifacts as evidence for the DomainSpec language design, not as promoted language semantics.

Boundaries from the dispatch:

- Parent dispatch: `projects/domainspec-language/research/domainspec-language-category-contract-research.dispatch.json`
- Step: `step-02-repository-evidence-fanout`
- Role: `arcanum-taxonomy-mapper`
- Write scope: this report only.
- Read-only evidence roots: `arcanum/`, especially `arcana/`, `spells/`, `formulae/`, `framework/`, `registry/`, `definitions/`, and selected `development/` candidate packs.
- Promotion rule: Arcanum artifacts may be mapped as reusable evidence, but lifecycle and promotion authority stays with their owning sigil, spell, formulae, framework, or definitions package.

Artifact strata used in this report:

- Canonical source surfaces: `arcanum/registry/SIGILS.md`, `arcanum/registry/SPELLS.md`, `arcanum/arcana/**/README.md`, `arcanum/arcana/**/SKILL.md`, `arcanum/spells/**/README.md`, `arcanum/spells/**/SKILL.md`, `arcanum/formulae/**/README.md`, `arcanum/formulae/**/SKILL.md`, `arcanum/framework/*.md`, `arcanum/definitions/DEFINITIONS.md`, `arcanum/definitions/DEFINITIONS-INDEX.md`.
- Generated/install/runtime surfaces: `arcanum/.codex/commands/`, `arcanum/.codex/hooks/`, `arcanum/.arcanum/observability/`, `arcanum/.arcanum/necronomicon/`, `arcanum/framework/observability/scripts/`.
- Development candidates and evidence packs: `arcanum/arcana/*/development/`, `arcanum/spells/*/development/`, `arcanum/formulae/dispatch-spec/development/`, `arcanum/development/craft/`, `arcanum/research/`.

## High-Value Existing Artifacts

1. Sigil taxonomy and tier model.

   The strongest Arcanum capability taxonomy is `arcanum/registry/SIGILS.md`. It names tiers (`Formulae`, `Transmutations`, `Arcana`), summaries, use conditions, and owning folders. `arcanum/arcana/README.md` further defines Arcana as autonomous orchestration sigils that coordinate evidence, roles, ambiguity, gates, and persistent state. This is reusable for DomainSpec language categories such as `capability_contract`, `orchestration_contract`, `bounded_transform`, and `deterministic_validation`.

2. Spell taxonomy and composition model.

   `arcanum/registry/SPELLS.md` and `arcanum/spells/README.md` define spells as compositions of sigils with ordered phases, shared artifacts, gates, handoffs, and observability. This gives DomainSpec a concrete model for a higher-order contract: a spell is not a new atomic behavior, but a compositional contract over existing behaviors. The spell registry also distinguishes canonical spell IDs, aliases, local adaptations, and local state under `.arcanum/spells/`.

3. Dispatch route contract and validator surface.

   `arcanum/formulae/dispatch-spec/README.md` is the best non-Craft evidence for a generic route contract. It separates route proposal from owner execution, maps capability references, frames, handles, trace events, gates, stop conditions, subagent strategy, boundary evidence, receipts, state namespaces, and promotion splits. `arcanum/formulae/dispatch-spec/dispatch.schema.yml` is a concrete schema for dispatch documents, including required top-level fields, step records, gate records, observability records, native stage receipts, subagent lifecycle, and boundary evidence. `arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py` is the deterministic validator authority for that route shape.

4. Dispatch fixtures and negative examples.

   `arcanum/formulae/dispatch-spec/development/fixtures/` contains pass, flag, and block fixtures such as `pass-boundary-evidence.json`, `pass-native-stage-receipts.json`, `block-promotion-split-violation.json`, `block-subagent-lifecycle-open-agent.json`, `block-missing-validation-evidence.json`, and `flag-unused-technique.json`. These are reusable as language validation fixture patterns because they prove that examples should include invalid states, weak-but-usable states, and accepted states.

5. Invoke lifecycle authoring.

   `arcanum/spells/invoke/README.md` defines Invoke as the front door for governed `define`, `design`, `plan`, `handoff`, and `refresh` artifacts before lifecycle execution. It explicitly separates Invoke authoring authority from `sigil-development`, `spellcraft`, and `task-session` lifecycle authority. `arcanum/spells/invoke/handoff.md` defines handoff type, context selection, coverage matrices, excluded context, gaps, blockers, next route, and provenance. `arcanum/spells/invoke/templates/` provides reusable document templates for architecture, implementation plans, work-packs, session handoffs, research, sigils, spells, and module formulae.

6. Refine lifecycle and dispatch-backed stages.

   `arcanum/arcana/refine/SKILL.md` defines a ten-stage refinement loop: Context Builder, Invoke Define, Interrogation, research decision, Distill, Invoke Design, Interrogation, Distill Repair, Invoke Plan, and final synthesis. It requires `REFINE-DISPATCH.json`, `RUN-MANIFEST.md`, `RUNTIME-HANDOFF.md`, `RESULT.md`, `evidence-index.json`, and stage artifacts under a run folder. This is high-value evidence for iteration records, stage receipts, owner handoffs, and non-executed planning before implementation.

7. Task Session execution contract.

   `arcanum/arcana/task-session/SKILL.md` defines bounded execution from an approved task or SWU. It requires scope resolution, context building, decision pack, gate evaluation, runtime selection, execution, validation, evidence synchronization, and report. It also distinguishes task completion evidence from reusable behavior experiment evidence. This is a reusable DomainSpec pattern for execution contracts and acceptance records.

8. Inventory evidence and read-model governance.

   `arcanum/arcana/inventory/SKILL.md` and `arcanum/arcana/inventory/development/SPEC.md` show a repository-local knowledge inventory that updates JSON indexes and Markdown records while keeping links and tags as Inventory read models, not downstream authority. `arcanum/arcana/inventory/templates/evidence-card.schema.yml`, `arcanum/arcana/inventory/templates/evidence-set.schema.yml`, and `arcanum/arcana/inventory/development/pilot/evidence-card/` provide concrete schema, fixture, retrieval, handoff, and invalid-example patterns.

9. Ontology governance and candidate branch model.

   `arcanum/arcana/ontology-vault/SKILL.md` governs ontology mapping, session distillation, confidence promotion, premise review, convention updates, and validation. It separates observed evidence, inference, synthesis, and decisions; it also distinguishes evidence confidence from commitment confidence. `arcanum/arcana/ontology-vault/development/BRANCH-AWARE-ONTOLOGY-SCHEMA-CANDIDATE.md` is a development candidate, not canonical, but it offers useful fields for `record_kind`, `lifecycle_status`, `claim_role`, `branch_context`, evidence refs, confidence, edges, and promotion blockers.

10. Glossary and definitions governance.

    `arcanum/definitions/DEFINITIONS.md` and `arcanum/definitions/DEFINITIONS-INDEX.md` are the current Arcanum-wide canonical definition surface for `contract` and `schema`, including aliases such as `handoff contract`, `output contract`, `dispatch schema`, and `ledger schema`. `arcanum/arcana/definitions-governance/SKILL.md` defines the rule that only the configured canonical source may define normative semantics. `arcanum/transmutations/feature-glossary/SKILL.md` and local glossaries such as `arcanum/formulae/dispatch-spec/development/GLOSSARY.md` show the parallel local-glossary pattern: explanatory, evidence-linked, and non-normative until promoted.

11. Constitutions and framework rules.

    `arcanum/framework/ARTIFACT-CONSTITUTION.md` defines artifact classes: source, durable evidence, generated, and local runtime. `arcanum/framework/SCHEMA-CONSTITUTION.md` sets canonical machine-readable schema format for new schema artifacts as `.schema.yml`, with validation through `arcanum/tools/validate-artifact-constitution.sh`. Related framework rules include `arcanum/framework/ARTIFACT-METADATA-CONSTITUTION.md` and `arcanum/framework/MARKDOWN-LINKING-CONSTITUTION.md`.

12. Observability and receipts.

    `arcanum/framework/observability/README.md` defines reusable sigil observability: meaningful invocations, quality-bar status, anti-pattern hits, workflow gaps, output-contract drift, observer recommendations, and reflection triggers. `arcanum/framework/observability/templates/invocation-envelope.json`, `arcanum/framework/observability/templates/observed-run-envelope.json`, and scripts under `arcanum/framework/observability/scripts/` provide the portable receipt substrate. `arcanum/.arcanum/observability/README.md` documents repository-local generated state: central JSONL invocation ledger, rebuildable `by-sigil/` and `by-capability/` indexes, hook evidence, run folders, and reflections.

13. Craft development package as example evidence, not owner.

    `arcanum/development/craft/CRAFT-INTERFACE.md`, `arcanum/development/craft/CRAFT-INTERFACE-LEDGER-SCHEMA.yml`, `arcanum/development/craft/CRAFT-INTERACTION-CONTRACT.md`, `arcanum/development/craft/CRAFT-INTERACTION-LEDGER-SCHEMA.yml`, examples, and validation notes are useful fixtures for contracts, ledgers, recursive project state, external capability calls, blockers, decisions, gaps, and definitions. They should remain one fixture family, not the generic language authority.

## Reusable Language Concepts

- `contract`: semantic obligations, authority, ownership, allowed behavior, gates, lifecycle, expected evidence, and downstream obligations. Evidence: `arcanum/definitions/DEFINITIONS.md`, `arcanum/spells/invoke/README.md`, `arcanum/formulae/dispatch-spec/README.md`, `arcanum/arcana/task-session/SKILL.md`.
- `schema`: structural representation and validation shape. Evidence: `arcanum/formulae/dispatch-spec/dispatch.schema.yml`, `arcanum/arcana/inventory/templates/evidence-card.schema.yml`, `arcanum/arcana/inventory/templates/evidence-set.schema.yml`, `arcanum/framework/SCHEMA-CONSTITUTION.md`.
- `artifact_class`: source, durable evidence, generated, local runtime. Evidence: `arcanum/framework/ARTIFACT-CONSTITUTION.md`.
- `capability_ref`: stable reference to a sigil, spell, formulae package, transmutation, runtime adapter, or transform. Evidence: `arcanum/registry/SIGILS.md`, `arcanum/registry/SPELLS.md`, `arcanum/formulae/dispatch-spec/development/GLOSSARY.md`.
- `step`: typed node with capability owner, pattern, inputs, outputs, stop conditions, and optional validation evidence. Evidence: `arcanum/formulae/dispatch-spec/dispatch.schema.yml`.
- `gate`: policy, decision, quality, promotion, validation, or human approval rule with `on_fail` behavior. Evidence: `arcanum/formulae/dispatch-spec/dispatch.schema.yml`, `arcanum/spells/invoke/README.md`, `arcanum/arcana/task-session/SKILL.md`.
- `handoff`: bounded transfer of context, obligation coverage, gaps, next route, provenance, and output paths. Evidence: `arcanum/spells/invoke/handoff.md`, `arcanum/framework/runtime/templates/RUNTIME-HANDOFF.md`, `arcanum/arcana/refine/SKILL.md`.
- `receipt`: structured proof that a step ran, blocked, validated, handed off, or produced residue. Evidence: `arcanum/formulae/dispatch-spec/dispatch.schema.yml`, `arcanum/framework/observability/templates/invocation-envelope.json`, `arcanum/arcana/task-session/SKILL.md`.
- `example_fixture`: valid, invalid, flag, and block cases that test language behavior rather than merely illustrate it. Evidence: `arcanum/formulae/dispatch-spec/development/fixtures/`, `arcanum/arcana/inventory/development/pilot/evidence-card/`, `arcanum/development/craft/*EXAMPLE.yml`.
- `local_glossary`: scoped, explanatory vocabulary that does not carry global authority. Evidence: `arcanum/transmutations/feature-glossary/SKILL.md`, `arcanum/formulae/dispatch-spec/development/GLOSSARY.md`, `arcanum/arcana/inventory/development/GLOSSARY.md`.
- `canonical_definition`: normative term source with indexes and drift checks. Evidence: `arcanum/definitions/DEFINITIONS.md`, `arcanum/definitions/DEFINITIONS-INDEX.md`, `arcanum/arcana/definitions-governance/SKILL.md`.
- `promotion_split`: rule that evidence can recommend but not promote without owner review. Evidence: `arcanum/formulae/dispatch-spec/README.md`, `arcanum/formulae/dispatch-spec/development/fixtures/block-promotion-split-violation.json`, `arcanum/arcana/ontology-vault/SKILL.md`.
- `state_namespace`: explicit owner/write-policy boundary for research artifacts, canonical packages, generated runtime, and local adaptations. Evidence: `projects/domainspec-language/research/domainspec-language-category-contract-research.dispatch.json`, `arcanum/framework/ARTIFACT-CONSTITUTION.md`, `arcanum/spells/README.md`.
- `observability_signal`: append-only evidence record for quality, gaps, output-contract drift, and reflection routing. Evidence: `arcanum/framework/observability/README.md`, `arcanum/.arcanum/observability/README.md`.

## Category-Theory Mapping Candidates

These mappings are explanatory candidates only. They should help the language design preserve contract/schema/iteration separation; they should not become formal language semantics without a later decision gate.

| Category-style concept | Arcanum evidence mapping | DomainSpec language use |
| --- | --- | --- |
| Object | A contract, schema, artifact, step, gate, receipt, glossary term, definition, or capability. | Type the things the language can name. |
| Morphism | A governed transformation: invoke authoring, refine stage, task-session execution, validator check, glossary extraction, ontology promotion review. | Model how one artifact state becomes another with owner and evidence. |
| Typed object | Sigil, spell, formulae, transmutation, source artifact, generated artifact, durable evidence, runtime artifact. | Prevent one syntax from hiding authority differences. |
| Functor-like projection | Inventory read models, glossary synthesis, context-builder packs, observability indexes. | Explain derived views that preserve references but do not become authority. |
| Natural transformation-like alignment | Contract-to-schema mapping, handoff-to-task-session route, business/system bridge in ontology-vault candidates. | Represent compatibility between two valid views without collapsing them. |
| Composition | Spell sequences, dispatch routes, refine stages, implementation readiness spell, task-session handoffs. | Require compatible outputs/inputs, gates, receipts, and owner boundaries. |
| Identity | No-op refresh, already-represented evidence, unchanged validated schema, preserved canonical definition. | Make no-op and unchanged state legitimate iteration outcomes. |
| Pullback-like join | Parent synthesis over fanout lanes, boundary evidence with receipts, ontology bridge validation requiring evidence from both sides. | Represent joins where multiple evidence sources must agree or expose residue. |
| Terminal/acceptance object | Validated artifact, promoted definition, completed task-session report, pass fixture. | Name acceptable end states and their required receipts. |
| Initial object | Handoff, seed, define artifact, target inference, route menu. | Name starting states before refinement, design, or execution. |
| Commutativity condition | Contract obligations, schema validation, validator output, observability receipt, and promotion guardrail agree. | Detect drift when a path validates structurally but violates authority or semantics. |

Concrete grounding:

- Dispatch composition: `arcanum/formulae/dispatch-spec/dispatch.schema.yml` defines objects (`steps`, `gates`, `observability`, `boundary_evidence`) and permitted morphism-like step patterns.
- Invoke/refine lifecycle: `arcanum/spells/invoke/README.md` and `arcanum/arcana/refine/SKILL.md` show transformations from intent to define/design/plan/handoff to execution-ready artifacts.
- Task execution: `arcanum/arcana/task-session/SKILL.md` shows a morphism from approved task context to validated completion evidence or blocked residue.
- Inventory projection: `arcanum/arcana/inventory/development/SPEC.md` explicitly keeps links and tags as read models, not authority.
- Ontology bridge: `arcanum/arcana/ontology-vault/SKILL.md` requires evidence on both business/system sides before asserting alignment.

## Gaps And Risks

- No unified DomainSpec language grammar exists yet. Arcanum has strong artifact contracts and schemas, but they are distributed by owner package.
- `contract` and `schema` are canonical Arcanum definitions, but many related language concepts remain local glossaries or candidate development terms. Promotion requires definitions-governance review.
- `arcanum/formulae/dispatch-spec/dispatch.schema.json` is present beside the preferred `.schema.yml`; `arcanum/framework/SCHEMA-CONSTITUTION.md` treats non-YML schema files as legacy or migration subjects, so new DomainSpec language schemas should prefer `.schema.yml`.
- `arcanum/arcana/ontology-vault/development/BRANCH-AWARE-ONTOLOGY-SCHEMA-CANDIDATE.md` is explicitly non-canonical. It is useful for language design but cannot be treated as the active ontology schema.
- `arcanum/arcana/inventory/development/SPEC.md` is draft. Inventory is excellent evidence for read models and evidence cards, but not a global promotion authority.
- Generated/runtime paths such as `arcanum/.arcanum/observability/`, `arcanum/.arcanum/necronomicon/`, and `arcanum/.codex/` prove install/runtime patterns but should not define canonical semantics unless the corresponding source package names them.
- Craft artifacts under `arcanum/development/craft/` are numerous and concrete, but the DomainSpec language handoff forbids making Craft the canonical scope.
- The category-theory framing can clarify objects, morphisms, projections, and composition, but it can also obscure practical validator authority. Every formal term must map back to concrete repository paths and reviewer-readable behavior.
- Observability receipts are strong as generated evidence, but they need a language-level decision about which receipt fields are required for `pass`, `flag`, `block`, and `not_run` states.
- Handoff, refresh, and no-op states already exist in Invoke, but the generic language still needs a small shared iteration record model across Invoke, Refine, Task Session, Dispatch Spec, Inventory, and Definitions Governance.

## Recommended Next Artifacts

1. `projects/domainspec-language/research/arcanum-artifact-type-crosswalk.md`

   Map Arcanum source, durable evidence, generated, and runtime classes to DomainSpec language document kinds. Include owner, canonical path, validation authority, generated/read-model status, and promotion rule.

2. `projects/domainspec-language/research/language-object-model-frame.md`

   Define candidate DomainSpec language objects: contract, schema, iteration, example fixture, validator, gate, handoff, receipt, glossary term, canonical definition, capability, route, and artifact class. Each object should cite at least one Arcanum and one non-Arcanum/DomainSpec source where possible.

3. `projects/domainspec-language/research/contract-schema-iteration-crosswalk.md`

   Crosswalk `contract`, `schema`, and `iteration` across `dispatch-spec`, `invoke`, `refine`, `task-session`, `inventory`, `ontology-vault`, definitions governance, and Craft examples.

4. `projects/domainspec-language/research/first-fixture-validation-plan.md`

   Select Craft plus at least one non-Craft fixture. Recommended non-Craft fixtures: `arcanum/formulae/dispatch-spec/development/fixtures/pass-boundary-evidence.json`, `arcanum/formulae/dispatch-spec/development/fixtures/block-promotion-split-violation.json`, `arcanum/spells/invoke/handoff.md`, and `arcanum/arcana/inventory/development/pilot/evidence-card/pilot-cards.json`.

5. `projects/domainspec-language/research/open-decisions-and-residue.md`

   Record unresolved choices: YAML-first vs DSL-first vs dual-surface syntax; whether category-theory vocabulary is internal-only or user-facing; which receipt fields are mandatory; which lifecycle states are shared; and how local glossaries become canonical definitions.

6. Future schema candidate, after design approval only:

   `projects/domainspec-language/schemas/domainspec-language.schema.yml`, governed by `arcanum/framework/SCHEMA-CONSTITUTION.md` and validated by a future language validator. Do not implement this before the design package and decision gate exist.

## Receipt

dispatch_id: `domainspec-language-category-contract-research-20260608`

step_id: `step-02-repository-evidence-fanout`

capability_ref: `inventory`

status: `pass`

artifacts:

- `projects/domainspec-language/research/lanes/arcanum-taxonomy-evidence-lane.md`

validation:

- Read required context: `projects/domainspec-language/DOMAINSPEC-LANGUAGE-HANDOFF.md`, `projects/domainspec-language/CONTEXT-PACK.md`, `projects/domainspec-language/research/domainspec-language-category-contract-research.dispatch.json`.
- Inspected Arcanum evidence roots: `arcanum/registry/`, `arcanum/arcana/`, `arcanum/spells/`, `arcanum/formulae/`, `arcanum/framework/`, `arcanum/definitions/`, `arcanum/development/craft/`.
- Classified evidence by canonical source, generated/install/runtime surface, and development candidate.
- Kept mutation scope to this report file only.

observer_status: `not_run`

blockers:

- None for this lane report.
- Later promotion remains blocked until DomainSpec language owner review and relevant Arcanum owner review.

residue:

- Need parent synthesis across DomainSpec evidence, contract/schema/ledger mapping, and formal-language critique lanes.
- Need decision gate for syntax and authority choices before parser or validator implementation.
- Need fixture diversity check: Craft plus at least one non-Craft fixture.

handoff_note: `Use this report as the Arcanum evidence input for taxonomy crosswalk, category-theory contract model framing, and first fixture selection. Treat development candidates and generated/runtime paths as evidence only, not canonical language semantics.`

agent_id: `codex-arcanum-taxonomy-lane`

role_id: `arcanum-taxonomy-mapper`

spawn_status: `spawned`

join_status: `completed`

close_status: `closed`

reroute: `parent_synthesis`
