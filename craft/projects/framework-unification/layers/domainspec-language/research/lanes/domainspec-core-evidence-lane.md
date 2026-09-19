# DomainSpec Core Evidence Lane

## Scope

This lane maps DomainSpec Core evidence that can support a generic DomainSpec language for contracts, rules, schemas, taxonomies, relationships, constitutions, templates, validators, lifecycle states, examples, and iteration records.

The scan focused on:

- Canonical framework source under `implementation/domainspec/`.
- Root project documentation under `docs/`.
- Root project tooling under `tools/`.
- Root `validation/`, which exists but had no files to cite during this lane.
- Project-local DomainSpec bundles and research examples under `projects/whisky-doses/domainspec/` and `research/projects/domainspec/`.

This report is evidence inventory only. It does not choose syntax, promote ontology, implement a parser, or mutate DomainSpec Core artifacts.

## High-Value Existing Artifacts

### Canonical Source Surfaces

- `implementation/domainspec/README.md` is the best orientation source for the DomainSpec contract model. It states that DomainSpec provides a structured vocabulary, typed relationships, templates, an agent pipeline, traceability, and the framework assets consumer projects import. It also distinguishes pipeline stages from source artifacts and names `docs/`, `templates/`, `governance/`, `internal_tools/`, `tools/`, and `vault/` as framework surfaces.
- `implementation/domainspec/TAXONOMY.md` is the strongest source for language object types. It defines backend meta-concepts such as Entity, Value Object, Enum / Type, Operation, Query, Calculation, Rule, Policy, Workflow, Saga, Interface, Event, Mapping, and State Machine, plus UI meta-concepts such as Page, Component, Form, Guard, Binding, Adapter, and State Indicator.
- `implementation/domainspec/RELATIONSHIPS.md` is the strongest source for language morphisms or typed arrows. It defines canonical edge labels including `enforces`, `transitions`, `exposes`, `orchestrates`, `applies`, `maps`, `contracts`, `mirrors`, and cross-feature variants such as `produces-for`, `triggers-cross`, and `enforces-cross`.
- `implementation/domainspec/AXIOMS.md` and `implementation/domainspec/CONSTITUTION.md` form the semantic governance chain. The axioms state that semantic authority precedes implementation, decisions belong to the domain rather than adapters, governance must be computable, observation must be independent from execution, controls should shift left, and governance needs a feedback budget. The constitution binds these to concrete rules and gates such as `validate-governance-chain`, `validate-signals`, `validate-orphans`, and alignment/layering audits.
- `implementation/domainspec/CHANGELOG.md` is a framework-level iteration record. Its editing policy requires reverse chronological entries, sequential versions, one entry per version, semantic versioning rules, and separation between framework-level changes and project-specific feature docs.
- `implementation/domainspec/TEST-PIPELINE.md` maps documentation sections to test obligations. It is reusable evidence that a language record can specify derivations from states, operations, interfaces, events, queries, workflows, and mappings into executable validation families.
- `implementation/domainspec/OBSERVABILITY.md` maps documentation sections to metric obligations. It provides an outer-loop counterpart to `TEST-PIPELINE.md`, with derivation rules from states, operations, interfaces, events, queries, workflows, and SPEC capabilities into runtime metrics and monitors.
- `implementation/domainspec/templates/SPEC.md` is the key contract template. It includes ownership, capability map, domain concepts, concept registry, feature concept graph, aspect docs, cross-feature dependencies, produces-for consumers, stories, change history, and references.
- `implementation/domainspec/templates/rules.md` is the key rule-contract template. It requires stable rule identifiers, optional type and applies-to fields, formal predicate blocks, transition/decision/configuration tables, and explicit `Checked by:` links to `TEST-SPEC.md`.
- `implementation/domainspec/templates/work-pack.md` is a mature lifecycle and execution-boundary template. It includes planner control fields, task status, gate status, pipeline stage coverage, decision locks, blockers, closure obligations, and verification/audit tasks.
- `implementation/domainspec/templates/SIGNAL-SCHEMA.md` defines append-only JSONL signal envelopes, canonical constraints, signal types, session completeness invariants, and decision/proposal/pattern records.
- `implementation/domainspec/governance/tags/CODE-TAG-SCHEMA.md` is a compact schema/contract bridge for code annotations. It defines `domainspec.concept`, `domainspec.edges`, required fields, optional evidence fields, semantics, and positive/negative examples.
- `implementation/domainspec/backend/src/modules/knowledge-graph/infrastructure/markdown-feature-docs-parser.ts` is executable evidence that SPEC tables and relationship sections are parsed into concept definitions and relationship edges. It expects Concepts, Feature Concept Graph, Cross-Feature Dependencies, and Produces For sections.
- `implementation/domainspec/backend/src/modules/knowledge-graph/infrastructure/markdown-canonical-edge-vocabulary.ts` is executable evidence that `RELATIONSHIPS.md` is treated as canonical edge vocabulary for knowledge-graph projection.

### Validator And Tool Surfaces

- `implementation/domainspec/tools/validate-relationships.ts` validates edge labels in feature SPEC relationship tables against canonical labels from `RELATIONSHIPS.md`.
- `implementation/domainspec/tools/validate-work-pack-coverage.ts` validates work-pack task coverage against feature concepts and source aspect files.
- `implementation/domainspec/tools/validate-signals.ts` validates signal JSONL envelopes, enum fields, type/category mappings, duplicate-like records, and session completeness invariants.
- `implementation/domainspec/tools/validate-governance-chain.ts`, `implementation/domainspec/tools/validate-orphans.ts`, `implementation/domainspec/tools/detect-signals.ts`, and `implementation/domainspec/tools/build-telemetry-bundle.ts` are useful validator candidates for the future language authority map, even though this lane did not deep-read each implementation.
- Root `tools/check_research_structure.sh` validates research project required files, canonical references, dependency manifests, exports directories, README sections, and legacy compatibility aliases. This is useful for language-level project-contract validation outside the framework package itself.
- Root `tools/guard-shell` and `tools/terminal_guard.sh` are runtime guard surfaces. They are not semantic language sources, but they show how execution policies can be wrapped as operational gates.

### Root Docs And Project-Local Examples

- `docs/registry.md` is a project-level generated or maintained index whose source of truth is feature `SPEC.md` and frontend `UI-SPEC.md` concept tables. It is useful as a registry projection model, not the canonical owner of concept semantics.
- `docs/glossary.md` is a project-level ubiquitous-language table. It is useful evidence for definition records and see-also links, but the lane found it empty in this checkout.
- `docs/shared/governance-baseline.md` is a reusable cross-feature contract for backend authority, adapter consumption, behavior-change ordering, deterministic defaults, mandatory contracts, and feature readiness gates.
- `projects/whisky-doses/domainspec/README.md` identifies a thin runtime reference bundle. It explicitly says it is not the full framework or installer package and contains constraints, vocabulary, references, templates, and helper scripts for project-facing skills. Treat this as install/runtime evidence, not canonical source.
- `research/projects/domainspec/README.md` is a project-local research contract. It defines claims, experiments, telemetry schema, dependency policy, canonical file map, completeness dashboard, and evidence state. It is a good example of a DomainSpec-like research project contract and iteration program.

## Reusable Language Concepts

- Contract object: `implementation/domainspec/templates/SPEC.md`, `implementation/domainspec/templates/rules.md`, `docs/shared/governance-baseline.md`, and `implementation/domainspec/CONSTITUTION.md` all separate obligations, ownership, invariants, gates, and downstream evidence from pure structure.
- Schema object: `implementation/domainspec/templates/SIGNAL-SCHEMA.md` and `implementation/domainspec/governance/tags/CODE-TAG-SCHEMA.md` define field sets, required keys, enums, examples, constraints, and validation expectations.
- Taxonomy object: `implementation/domainspec/TAXONOMY.md` defines a reusable type universe for backend and UI concepts.
- Relationship object: `implementation/domainspec/RELATIONSHIPS.md` defines typed relationship labels, direction, source/target kinds, and usage intent.
- Validator morphism: `implementation/domainspec/tools/validate-relationships.ts`, `implementation/domainspec/tools/validate-work-pack-coverage.ts`, `implementation/domainspec/tools/validate-signals.ts`, and root `tools/check_research_structure.sh` provide executable transformations from artifact text or JSONL into PASS/FLAG/BLOCK-like outcomes.
- Derivation morphism: `implementation/domainspec/TEST-PIPELINE.md` and `implementation/domainspec/OBSERVABILITY.md` map documentation objects into tests, metrics, alerts, and runtime fidelity checks.
- Projection morphism: `implementation/domainspec/backend/src/modules/knowledge-graph/infrastructure/markdown-feature-docs-parser.ts` maps Markdown SPEC sections into concept and edge records; `implementation/domainspec/backend/src/modules/knowledge-graph/infrastructure/markdown-canonical-edge-vocabulary.ts` maps `RELATIONSHIPS.md` into a canonical edge set.
- Lifecycle state: `implementation/domainspec/templates/work-pack.md` has `not-started`, `in-progress`, `completed`, `skipped`, `ready`, `blocked`, planner gate `pass / block`, and readiness profiles. `projects/domainspec-language/DOMAINSPEC-LANGUAGE-HANDOFF.md` asks the future language to support draft, refined, gated, implemented, validated, promoted, superseded, and blocked.
- Iteration record: `implementation/domainspec/CHANGELOG.md` gives a versioned framework-change pattern; `implementation/domainspec/templates/work-pack.md` gives task/wave/decision/blocker evolution; `research/projects/domainspec/README.md` gives research-program progress, completeness, missing work, claim coverage, and canonical file map.
- Fixture/example record: `implementation/domainspec/governance/tags/CODE-TAG-SCHEMA.md` includes positive and negative examples; `projects/whisky-doses/domainspec/` is a runtime bundle fixture; `research/projects/domainspec/` is a research-project fixture.
- Authority boundary: `implementation/domainspec/AXIOMS.md`, `implementation/domainspec/CONSTITUTION.md`, `projects/whisky-doses/domainspec/README.md`, and `docs/registry.md` together show source authority, runtime bundle copies, and projection/index surfaces that must not be conflated.

## Category-Theory Mapping Candidates

- Objects: DomainSpec concepts from `implementation/domainspec/TAXONOMY.md`; contract artifacts from `implementation/domainspec/templates/SPEC.md`; schema artifacts from `implementation/domainspec/templates/SIGNAL-SCHEMA.md`; governance rule objects from `implementation/domainspec/CONSTITUTION.md`; iteration records from `implementation/domainspec/CHANGELOG.md` and `implementation/domainspec/templates/work-pack.md`.
- Morphisms: canonical relationships from `implementation/domainspec/RELATIONSHIPS.md`; validator functions from `implementation/domainspec/tools/`; derivation rules from `implementation/domainspec/TEST-PIPELINE.md` and `implementation/domainspec/OBSERVABILITY.md`; parser/projection functions from `implementation/domainspec/backend/src/modules/knowledge-graph/infrastructure/`.
- Identity and typing: concept IDs and taxonomy labels in `implementation/domainspec/templates/SPEC.md` and `implementation/domainspec/governance/tags/CODE-TAG-SCHEMA.md` can act as identity/type pairs.
- Composition: `RELATIONSHIPS.md` edges such as `orchestrates`, `maps`, `exposes`, `contracts`, `mirrors`, and cross-layer `fetches` / `mutates` can describe typed composition across domain, interface, UI, and implementation boundaries.
- Functor-like projections: Markdown feature docs to knowledge graph records in `markdown-feature-docs-parser.ts`; SPEC/aspect docs to tests in `TEST-PIPELINE.md`; SPEC/aspect docs to metrics in `OBSERVABILITY.md`; feature SPEC tables to root `docs/registry.md`.
- Natural transformation candidates: code tags in `CODE-TAG-SCHEMA.md` align code symbols with concept IDs and outbound edges, preserving the semantic relationship between spec concepts and implementation symbols.
- Monoidal/product-like candidates: work-pack task boards and pipeline stage coverage in `templates/work-pack.md` combine multiple obligations into a single execution boundary while preserving per-stage status.
- Terminal or blocked states: `templates/work-pack.md` and `templates/SIGNAL-SCHEMA.md` both encode terminal-ish outcomes and completeness expectations; these can ground a lifecycle category without inventing new status semantics.

These mappings should remain explanatory until the language design package and decision gate approve formal semantics.

## Gaps And Risks

- `validation/` exists at the repository root, but this lane found no files under it. Validation evidence is currently in `implementation/domainspec/tools/`, root `tools/`, and embedded schema docs rather than a unified root validation contract.
- `implementation/domainspec/README.md` still says 24 meta-types and 26 typed relationships, while observed `TAXONOMY.md` and `RELATIONSHIPS.md` headings currently present 25 meta-concepts and 29 relationships. The language design should treat the detailed taxonomy/relationship files as current evidence and flag count drift for owner review.
- Root `docs/registry.md` and `docs/glossary.md` are sparse project-local projections. They are useful shape examples but not enough evidence for a generic language without populated fixtures.
- `projects/whisky-doses/domainspec/` is explicitly a thin runtime reference bundle. Using it as canonical would violate the authority split; use it as an install/runtime fixture only.
- `research/projects/domainspec/` is a valuable research-project example, but it has its own canonical-only research contract and claim/experiment program. It should be a fixture, not the semantic owner of the generic language.
- `implementation/domainspec/governance/tags/CODE-TAG-SCHEMA.md` is strong schema evidence but narrower than the full language because it binds implementation symbols to concepts and edges, not arbitrary contracts, schemas, or iteration records.
- Category-theory terms can clarify typed objects and transformations, but they risk obscuring validation authority if not anchored to concrete files such as `TAXONOMY.md`, `RELATIONSHIPS.md`, `CONSTITUTION.md`, and validator scripts.

## Recommended Next Artifacts

- A `domain-language-evidence-inventory.md` synthesis that merges this lane with Arcanum and contract/schema/ledger lanes, with columns for artifact path, surface kind, language concept, authority level, validator/projection, and fixture suitability.
- A `contract-schema-iteration-crosswalk.md` that maps DomainSpec Core artifacts into the requested generic families: contract, schema, iteration, use case, example, validator, lifecycle state, blocker, decision, and definition.
- A `source-runtime-projection-authority-map.md` that explicitly separates canonical source (`implementation/domainspec/`), generated/index projections (`docs/registry.md`), install/runtime bundles (`projects/whisky-doses/domainspec/`), and project-local research fixtures (`research/projects/domainspec/`).
- A `category-contract-model-frame.md` that keeps category terms minimal: object, morphism, composition, projection, identity/type, fixture, validator, and lifecycle state. Every term should cite a concrete DomainSpec or Arcanum path.
- A `language-validation-authority-plan.md` that names existing validators and proposes which future validator should own language shape after the syntax decision gate.
- A small populated fixture set using one DomainSpec Core feature/spec fixture, one Arcanum dispatch/invoke fixture, and one project-local research fixture, so the language avoids Craft-only overfitting.

## Receipt

| Field | Value |
| --- | --- |
| dispatch_id | `domainspec-language-category-contract-research-20260608` |
| step_id | `step-02-repository-evidence-fanout` |
| capability_ref | `inventory` |
| status | `completed` |
| artifacts | `projects/domainspec-language/research/lanes/domainspec-core-evidence-lane.md` |
| validation | Manual path-cited evidence review completed; no parser, validator implementation, or other repository files modified. Root `validation/` checked and found empty in this lane. |
| observer_status | `not-emitted`; lane report records receipt only. |
| blockers | None for this lane. Count drift between `implementation/domainspec/README.md`, `implementation/domainspec/TAXONOMY.md`, and `implementation/domainspec/RELATIONSHIPS.md` should be owner-reviewed before promotion. |
| residue | Need parent synthesis to merge evidence with Arcanum lane, decide language syntax, and assign validation authority. |
| handoff_note | DomainSpec Core already provides strong typed-object, typed-arrow, contract, schema, validator, lifecycle, and iteration evidence. Treat `implementation/domainspec/` as canonical, root docs as projections/current project docs, root tools as research/runtime guards, `projects/whisky-doses/domainspec/` as runtime bundle fixture, and `research/projects/domainspec/` as project-local research fixture. |
| agent_id | `codex-domainspec-core-evidence-lane` |
| role_id | `domainspec-evidence-mapper` |
| spawn_status | `spawned-by-user` |
| join_status | `ready-for-parent-synthesis` |
| close_status | `closed` |
| reroute | `none` |
