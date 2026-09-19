# Contract Schema Ledger Pattern Lane

## Scope

This lane maps reusable contract, schema, ledger, fixture, validator, receipt,
handoff, blocker, and lifecycle patterns for the DomainSpec language research
dispatch. It treats Craft as one high-signal fixture, not as the canonical
language owner. The lane also samples dispatch-spec, invoke handoff, task-session
work-pack and receipt surfaces, and Inventory evidence-card work because those
artifacts show the same boundary problem under different owners.

The research boundary comes from the handoff: the next language pass must design
contract, schema, and iteration records before parser implementation, must avoid
Craft-specific terminology as the generic scope, and must not choose YAML-only,
DSL-only, or dual-surface syntax without a recorded decision
(`projects/domainspec-language/DOMAINSPEC-LANGUAGE-HANDOFF.md:1-91`).

## High-Value Existing Artifacts

- Craft interface contract: `arcanum/development/craft/CRAFT-INTERFACE.md:8-28`
  defines purpose, source-of-truth boundary, and local-only authority. Its method
  sections show a reusable contract form: inputs, writes, returns, and invariants
  for operations such as `start_project`, `state`, `add_blocker`,
  `refine_blocker`, `next`, and decisions
  (`arcanum/development/craft/CRAFT-INTERFACE.md:29-205`).
- Craft interface ledger schema:
  `arcanum/development/craft/CRAFT-INTERFACE-LEDGER-SCHEMA.yml:1-16` separates
  schema identity and source policy from the contract text. It then expresses
  row families, required fields, references, enums, and validation rules, such as
  local candidate definitions, gaps, active-next-move invariants, raw-blocker
  closure blocking, and work-pack placement
  (`arcanum/development/craft/CRAFT-INTERFACE-LEDGER-SCHEMA.yml:44-181`).
- Craft interaction contract:
  `arcanum/development/craft/CRAFT-INTERACTION-CONTRACT.md:7-15` makes the
  owner split explicit: Craft owns route memory and recursive ledger state, while
  called capabilities own native artifact contracts, validation, and verdicts.
  Its methods model classification, handoff creation, receipt capture,
  application, and residue opening
  (`arcanum/development/craft/CRAFT-INTERACTION-CONTRACT.md:16-143`).
- Craft interaction schema:
  `arcanum/development/craft/CRAFT-INTERACTION-LEDGER-SCHEMA.yml:40-168`
  provides a compact schema for `route_handoffs`, `receipts`, and
  `route_events`. Its rules enforce one owner capability per handoff, one handoff
  per receipt, native verdict preservation, blocked receipt behavior, dispatch
  pass as route-shape-only, and task-session recomposition before closure
  (`arcanum/development/craft/CRAFT-INTERACTION-LEDGER-SCHEMA.yml:168-189`).
- Craft examples as fixtures:
  `arcanum/development/craft/CRAFT-INTERFACE-EXAMPLE.yml:1-7` and
  `arcanum/development/craft/CRAFT-INTERACTION-EXAMPLE.yml:1-5` bind schemas to
  concrete candidate-local fixture instances. The interface example demonstrates
  root and child contexts, artifacts, definitions, gaps, typed blockers,
  decisions, relations, and recomposition
  (`arcanum/development/craft/CRAFT-INTERFACE-EXAMPLE.yml:8-157`). The
  interaction example demonstrates handoffs, receipts, events, residue, and
  recomposition across invoke, dispatch-spec, task-session, and decision-gate
  (`arcanum/development/craft/CRAFT-INTERACTION-EXAMPLE.yml:57-248`).
- Craft validation notes:
  `arcanum/development/craft/CRAFT-INTERFACE-VALIDATION.md:21-83` and
  `arcanum/development/craft/CRAFT-INTERACTION-VALIDATION.md:21-80` are
  narrative validation receipts. They do not replace schemas; they record method
  coverage, schema review, fixture review, hard gates, pass status, and deferred
  residue.
- Dispatch-spec schema and validator:
  `arcanum/formulae/dispatch-spec/dispatch.schema.yml:1-13` defines route
  document shape, while the Python validator states it goes beyond JSON Schema
  to enforce governance rules
  (`arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py:1-7`).
  Dispatch-spec is especially strong for receipt requirements, subagent
  lifecycle, gate actions, observability, boundary evidence, state namespaces,
  and promotion splits
  (`arcanum/formulae/dispatch-spec/dispatch.schema.yml:130-208`,
  `arcanum/formulae/dispatch-spec/dispatch.schema.yml:279-330`,
  `arcanum/formulae/dispatch-spec/dispatch.schema.yml:451-531`,
  `arcanum/formulae/dispatch-spec/dispatch.schema.yml:620-699`).
- Dispatch validator authority:
  `arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py:397-503` checks
  schema errors, duplicate steps, input chaining, parallel join policy,
  evidence artifacts, observability, subagent permissions, native stage
  receipts, and capability references. It returns `pass`, `flag`, or `block`
  and exits nonzero only on block
  (`arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py:617-647`).
- Invoke handoff:
  `arcanum/spells/invoke/handoff.md:9-22` defines handoff as a session/thread
  start artifact for continuity, not lifecycle execution. It requires prompt,
  source session reference, handoff type, Context Builder selection, selected and
  excluded context, gaps, next prompt, next route, provenance, observability, and
  an output shape
  (`arcanum/spells/invoke/handoff.md:23-35`,
  `arcanum/spells/invoke/handoff.md:92-123`,
  `arcanum/spells/invoke/handoff.md:134-170`).
- Task-session work-pack surface:
  `arcanum/development/craft/CRAFT-INTERFACE-WORK-PACK.md:6-105` shows a task
  contract with inputs, output files, required methods, implementation rules,
  validation commands, done criteria, and expected result. Its second task
  captures interaction-specific owner boundaries and recomposition criteria
  (`arcanum/development/craft/CRAFT-INTERFACE-WORK-PACK.md:106-205`).
- Native receipt contract:
  `arcanum/development/craft/work-packs/native-stage-execution-receipts/receipt-contract.md:3-39`
  defines receipt as execution closeout evidence, distinct from owner artifact
  and handoff prompt. It requires status, evidence kind, handoff path, artifacts,
  validation, blockers, and recovery path rules
  (`arcanum/development/craft/work-packs/native-stage-execution-receipts/receipt-contract.md:40-110`).
- Inventory evidence-card schema and validator:
  `arcanum/arcana/inventory/development/templates/evidence-card-schema.md:1-10`
  marks a development schema template as non-canonical and points to the
  machine-readable owner. Its field model preserves source refs, authority
  level, capture metadata, promotion status, owner, handoff targets, trace, and
  residue
  (`arcanum/arcana/inventory/development/templates/evidence-card-schema.md:11-76`).
  The fixture validator enforces required fields, controlled vocabularies,
  selectors, owner/status pairing, relation non-authority notices, evidence-set
  shape, handoff notices, and invalid example coverage
  (`arcanum/arcana/inventory/scripts/validate-evidence-card-fixtures.sh:43-205`).
- Inventory EvidenceSet candidate:
  `arcanum/arcana/inventory/development/refinement-runs/20260527T160759Z-evidenceset-schema/SCHEMA-CANDIDATE.md:1-12`
  is a useful non-ledger example of candidate-only schema evolution. It groups
  evidence-card IDs with inclusion and exclusion reasons, index terms, handoff
  target, synthesis note, residue, status, and promotion owner while explicitly
  rejecting ontology authority, Context Builder replacement, and lifecycle
  management
  (`arcanum/arcana/inventory/development/refinement-runs/20260527T160759Z-evidenceset-schema/SCHEMA-CANDIDATE.md:13-103`).

## Reusable Language Concepts

- `contract` as semantic agreement: purpose, owner, authority, methods,
  invariants, lifecycle state, gates, expected evidence, residue behavior, and
  downstream obligations. Craft method contracts and interaction capability
  contracts are the strongest current examples
  (`arcanum/development/craft/CRAFT-INTERFACE.md:29-205`,
  `arcanum/development/craft/CRAFT-INTERACTION-CONTRACT.md:144-239`).
- `schema` as representation authority: fields, enums, required keys,
  references, row families, controlled vocabularies, and rule IDs. Schema
  documents can extend other schemas without owning the semantic contract
  (`arcanum/development/craft/CRAFT-INTERFACE-LEDGER-SCHEMA.yml:14-16`,
  `arcanum/development/craft/CRAFT-INTERACTION-LEDGER-SCHEMA.yml:6-8`).
- `ledger` as ordered state memory: context rows, artifacts, descriptions,
  typed items, decisions, relations, route handoffs, receipts, route events,
  gaps, and recomposition. Ledger entries should keep both containment
  relations and cross-capability handoff relations visible
  (`arcanum/development/craft/CRAFT-INTERFACE-EXAMPLE.yml:8-157`,
  `arcanum/development/craft/CRAFT-INTERACTION-EXAMPLE.yml:57-248`).
- `fixture` as executable example candidate: examples should cite schema refs
  and versions, carry candidate/local status, and include enough positive and
  negative cases to validate the intended shape
  (`arcanum/development/craft/CRAFT-INTERFACE-EXAMPLE.yml:1-7`,
  `arcanum/arcana/inventory/scripts/validate-evidence-card-fixtures.sh:193-198`).
- `validator` as authority surface: schemas decide structural shape, but
  validators may add governance rules that are not expressible in basic schema,
  such as subagent authorization, native receipt coverage, command-interface
  boundaries, and promotion split violations
  (`arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py:397-560`).
- `receipt` as closeout evidence: receipts should distinguish handoff prepared,
  route shape passed, authoring completed, and execution actually attempted.
  This prevents planning or dispatch validation from being mistaken for task
  execution
  (`arcanum/development/craft/CRAFT-INTERACTION-CONTRACT.md:92-119`,
  `arcanum/development/craft/work-packs/native-stage-execution-receipts/receipt-contract.md:36-39`).
- `iteration` as first-class change record: the current repository expresses
  iteration through refresh reports, validation notes, work-pack done criteria,
  receipt status, gaps, residue, and promotion status rather than one shared
  artifact kind. The DomainSpec language should unify these into an explicit
  delta record with changed artifact, reason, previous and next state, changed
  obligations, validations run, decisions opened or closed, blockers created or
  resolved, and promotion status.
- `handoff` as bounded continuation contract: invoke handoff and Craft route
  handoffs both require source context, selected/excluded context or conditions,
  expected outputs, expected receipt fields, owner boundary, gaps, and next
  route
  (`arcanum/spells/invoke/handoff.md:66-123`,
  `arcanum/development/craft/CRAFT-INTERACTION-LEDGER-SCHEMA.yml:40-84`).
- `blocker`, `gap`, `decision`, and `residue` as typed records, not loose prose.
  Craft schemas and examples model status, severity, treatment, owner, evidence,
  closure condition, and recomposition evidence
  (`arcanum/development/craft/CRAFT-INTERFACE-LEDGER-SCHEMA.yml:99-135`,
  `arcanum/development/craft/CRAFT-INTERFACE-EXAMPLE.yml:71-126`).
- `lifecycle_state` as scoped and owner-specific: examples already include
  `candidate-local`, `candidate-local-fixture`, `pass`, `flag`, `block`,
  `planned`, `active`, `completed`, `blocked`, `superseded`, `promote-pending`,
  `rejected`, and `waived`. The language should not force one global enum until
  it can map states by artifact kind and owner.

## Category-Theory Mapping Candidates

- Contract object: a typed semantic object whose identity is its purpose,
  owner, authority, methods, invariants, and obligations. Evidence:
  `arcanum/development/craft/CRAFT-INTERFACE.md:8-28` and
  `arcanum/development/craft/CRAFT-INTERACTION-CONTRACT.md:7-15`.
- Schema object: a typed representation object that implements part of a
  contract by providing field structure, enums, references, and validation rule
  identifiers. Evidence:
  `arcanum/development/craft/CRAFT-INTERFACE-LEDGER-SCHEMA.yml:1-17` and
  `arcanum/formulae/dispatch-spec/dispatch.schema.yml:1-13`.
- Implements morphism: `contract -> schema`, preserving semantic obligations as
  structural checks where possible. Example: Craft interface contract requires
  `.craft/ledger.yml` as source of truth and local candidate definitions; the
  schema encodes those policies and row families
  (`arcanum/development/craft/CRAFT-INTERFACE.md:15-28`,
  `arcanum/development/craft/CRAFT-INTERFACE-LEDGER-SCHEMA.yml:5-13`,
  `arcanum/development/craft/CRAFT-INTERFACE-LEDGER-SCHEMA.yml:70-98`).
- Validates morphism: `schema + fixture + validator -> verdict`. Example:
  dispatch schema plus validator yields pass, flag, or block; Inventory
  evidence-card fixtures are checked by jq validation rules
  (`arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py:397-647`,
  `arcanum/arcana/inventory/scripts/validate-evidence-card-fixtures.sh:62-205`).
- Example-of morphism: `fixture -> schema`, where an example must declare
  `schema_ref`, `schema_version`, and status. Craft examples and Inventory pilot
  fixtures provide the pattern
  (`arcanum/development/craft/CRAFT-INTERFACE-EXAMPLE.yml:1-7`,
  `arcanum/development/craft/CRAFT-INTERACTION-EXAMPLE.yml:1-5`).
- Handoff morphism: `owner_context -> target_capability`, preserving source
  artifacts, conditions, expected outputs, expected receipt fields, and next
  route while not transferring owner authority
  (`arcanum/development/craft/CRAFT-INTERACTION-LEDGER-SCHEMA.yml:40-84`,
  `arcanum/spells/invoke/handoff.md:92-123`).
- Receipt morphism: `target_capability_result -> owner_ledger_event`, preserving
  native verdict and adding local application policy. Evidence:
  `arcanum/development/craft/CRAFT-INTERACTION-EXAMPLE.yml:127-213`.
- Iteration delta morphism: `artifact_state_n -> artifact_state_n+1`, carrying
  reason, changed fields, changed obligations, validation result, residue, and
  promotion state. Current evidence is distributed across validation notes,
  receipt contracts, refresh reports, and candidate schema statuses; this needs
  a first-class DomainSpec artifact.
- Boundary functor candidate: map an artifact from one owner namespace into a
  research or handoff namespace while preserving authority labels and preventing
  promotion. Dispatch boundary evidence and state namespaces are the strongest
  current shape
  (`projects/domainspec-language/research/domainspec-language-category-contract-research.dispatch.json:483-560`).
- Composition law candidate: route validation, invoke planning, and task-session
  execution compose only if each morphism preserves its authority boundary. A
  dispatch pass is route-shape evidence only; invoke plan is authoring evidence;
  task-session pass requires recomposition before Craft closure
  (`arcanum/development/craft/CRAFT-INTERACTION-LEDGER-SCHEMA.yml:181-189`).

## Gaps And Risks

- No single iteration/change-record artifact exists yet. The handoff asks for
  changed artifact, reason, previous and next state, changed obligations, changed
  fields, examples, validations, decisions, blockers, and promotion status, but
  those pieces are currently scattered across validation notes, receipts,
  refresh reports, work packs, and ledgers.
- Lifecycle states are useful but not normalized. `status` means different
  things for contract candidates, fixture instances, receipt verdicts, handoffs,
  tasks, dispatch validation, and promotion. A shared language should define
  state namespaces before defining one global enum.
- Validation authority can be obscured if category language gets too abstract.
  The dispatch itself warns that categorical terms must map back to concrete
  paths and remain explanatory until decision-gate approval
  (`projects/domainspec-language/research/domainspec-language-category-contract-research.dispatch.json:31-58`).
- Schema authority is not always canonical. Inventory's evidence-card schema
  template explicitly says it is non-canonical and points elsewhere for the
  machine-readable schema
  (`arcanum/arcana/inventory/development/templates/evidence-card-schema.md:1-10`).
  The language must include `canonical_ref`, `candidate_ref`, or
  `authority_level` fields rather than assuming every schema-like artifact is
  authoritative.
- Examples need both positive and negative fixture coverage. Craft has positive
  examples and validation narratives; Inventory has invalid example coverage
  checks. A first language fixture plan should combine both patterns.
- Handoff boundaries are easy to collapse. Invoke handoff is not execution,
  dispatch validation is not execution, and task-session receipt still needs
  recomposition before parent closure
  (`arcanum/spells/invoke/handoff.md:111-123`,
  `arcanum/development/craft/CRAFT-INTERACTION-VALIDATION.md:65-80`).
- Promotion remains owner-gated. Research artifacts can recommend candidates but
  cannot promote inventory, ontology, glossary, sigil, spell, or language
  semantics without owner review
  (`projects/domainspec-language/research/domainspec-language-category-contract-research.dispatch.json:448-560`).

## Recommended Next Artifacts

- `DOMAIN-LANGUAGE-CONTRACT-KINDS.md`: define generic `contract`, `schema`,
  `ledger`, `fixture`, `validator`, `receipt`, `handoff`, `iteration`, `decision`,
  `blocker`, `gap`, and `residue` kinds without using Craft as the root
  taxonomy.
- `DOMAIN-LANGUAGE-TOP-LEVEL-FIELDS.yml`: candidate structural field model with
  `id`, `kind`, `version`, `status`, `owner`, `authority_level`,
  `canonical_ref`, `implements`, `requires_schema`, `fixtures`, `validators`,
  `lifecycle`, `blockers`, `decisions`, `residue`, and `promotion`.
- `DOMAIN-LANGUAGE-ITERATION-RECORD.yml`: first-class change record for
  contract/schema evolution, with before/after references, reason, changed
  obligations, changed fields, fixture deltas, validations run, decisions,
  blockers, residue, and promotion status.
- `DOMAIN-LANGUAGE-FIXTURE-PLAN.md`: first validation fixture plan using Craft
  plus at least one non-Craft fixture, preferably dispatch-spec and invoke
  handoff, matching the dispatch fixture-diversity gate
  (`projects/domainspec-language/research/domainspec-language-category-contract-research.dispatch.json:455-459`).
- `DOMAIN-LANGUAGE-VALIDATION-AUTHORITY.md`: decide which checks belong in
  schema, which checks belong in validator scripts, and which checks remain
  human/owner decisions.
- `DOMAIN-LANGUAGE-CATEGORY-MAPPING.md`: keep the category-theory model as a
  grounded explanatory layer: objects are artifact kinds, morphisms are
  implement/validate/example/handoff/receipt/iterate transformations, and
  composition is valid only when authority boundaries are preserved.

## Receipt

- dispatch_id: `domainspec-language-category-contract-research-20260608`
- step_id: `step-02-repository-evidence-fanout`
- capability_ref: `inventory`
- status: `pass`
- artifacts:
  `projects/domainspec-language/research/lanes/contract-schema-ledger-pattern-lane.md`
- validation: Report structure completed with concrete path citations; source
  artifacts read from the assigned handoff, context pack, dispatch JSON, Craft
  contracts/schemas/examples/validation notes, dispatch-spec schema and
  validator, invoke handoff, Craft work-pack/receipt surfaces, and Inventory
  evidence-card surfaces. No parser or validator implementation was attempted.
- observer_status: `not_run`
- blockers: `none`
- residue: First-class iteration/change-record artifact remains missing; syntax
  strategy and validation authority still require later decision-gate review.
- handoff_note: Parent synthesis should merge this lane with DomainSpec evidence,
  Arcanum taxonomy, and categorical-language critique lanes before promoting any
  language semantics.
- agent_id: `codex-contract-schema-ledger-lane`
- role_id: `contract-schema-ledger-mapper`
- spawn_status: `spawned`
- join_status: `completed`
- close_status: `closed`
- reroute: `parent_synthesis`
