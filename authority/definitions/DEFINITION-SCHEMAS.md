# CyberAlchemy v2 Definition Schemas

Status: active
Owner: definitions-governance
Canonical definitions source: [DEFINITIONS.md](DEFINITIONS.md)
Lookup index: [DEFINITIONS-INDEX.md](DEFINITIONS-INDEX.md)
Last updated: 2026-08-30

## Purpose

This registry tracks the schemas carried by canonical CyberAlchemy v2
definitions, so a definition's structural shape is kept *with* the definition and
is also discoverable as a first-class, trackable artifact. A schema here is a
documentary record of the shape a definition's formal voice asserts; a
machine-checkable validator is a deferred follow-up unless a row says otherwise.

## Rule

Every canonical definition that asserts a record, tuple, field set, or structural
contract in its formal voice must:

1. carry a colocated `### Schema` section in [DEFINITIONS.md](DEFINITIONS.md)
   with a stable schema handle bound to the definition ID and per-field meanings,
   and
2. appear as a row in **Tracked Schemas** below.

A definition whose formal voice is an equation or relation rather than a
structural record is reviewed case-by-case; an equation is tracked as a schema
only when it defines a structural contract consumers must satisfy. Schema changes
follow `CAV2-D25` schema amendment witness, and any coupling between a schema
field and another authority axis follows `CAV2-D16` typed coupling invariant.

## Schema handle convention

`<DEF-ID>-SCHEMA` for the primary schema of a definition;
`<DEF-ID>-SCHEMA-<n>` when a definition carries more than one.

## Tracked Schemas

| Schema handle | Definition | Term | Shape | Status | Witness |
| --- | --- | --- | --- | --- | --- |
| `CAV2-D23-SCHEMA` | [CAV2-D23](DEFINITIONS.md#cav2-d23-authority-lifecycle-axis) | authority lifecycle axis | `L(a) = (kind, status, evidence, commitment, provenance, owner, residue)` | tracked (documentary) | review; machine validator deferred |
| `CAV2-D51-SCHEMA` | [CAV2-D51](DEFINITIONS.md#cav2-d51-canonical-artifact) | canonical artifact | `CA(a) = (..., process_origin, ...)`; `ProcessOrigin = (producer_ref, process_ref, process_version_ref, origin_statement_ref, origin_assurance, mechanism_ref?, verifier_receipt_ref?, claim_limit)` | tracked (documentary) | Gate 06 owner decision; validator and five fixture classes deferred |
| `CAV2-D57-SCHEMA` | [CAV2-D57](DEFINITIONS.md#cav2-d57-exact-publication-authorization) | exact publication authorization | `PublicationAuthorization = (release_authorizations, exact_output_approval, publication_receipt?)` with exact source, policy, output, audience, and channel bindings | tracked (documentary) | Gate 08 owner decision; no present publication effect |
| `CAV2-D58-SCHEMA` | [CAV2-D58](DEFINITIONS.md#cav2-d58-constitution) | constitution | `Constitution = (id, version, scope, subject_kinds, selectors, rules, policies, precedence, composition, owner_route, authority_level, validation_bindings, downstream_effect, challenge_route, retirement_or_split_rule)` | tracked (documentary) | owner-requested definition repair; no constitution or validator activation |
| `CAV2-D59-SCHEMA` | [CAV2-D59](DEFINITIONS.md#cav2-d59-goal) | goal | `Goal = (id, project_ref, outcome, rationale, thesis_refs, scope, exclusions, owner_route, success_conditions, evidence_requirements, evidence_refs, lifecycle_state, target_horizon?, revision_history, challenge_route)` | tracked (documentary) | owner-requested product-foundation model; candidate instance validator in `goals/` |
| `CAV2-D60-SCHEMA` | [CAV2-D60](DEFINITIONS.md#cav2-d60-project) | project | `Project = (id, name, purpose, scope, exclusions, owner_routes, goal_refs, research_refs, experiment_refs, evidence_index, thesis_refs, instance_binding_refs, construction_binding_refs, lifecycle_state, challenge_route)` | tracked (documentary) | `CAV2-PROJECT-SCHEMA-AMEND-D64-001` plus `CAV2-GOAL-PACKAGE-SCHEMA-AMEND-D65-CONSTRUCTION-BINDING-001`; v3 candidate multi-Project validator and empty Project-owned binding registries in `goals/`; proposed Project may coordinate a draft Goal, active Project requires an active Goal |
| `CAV2-D61-SCHEMA` | [CAV2-D61](DEFINITIONS.md#cav2-d61-research) | research | `Research = (id, project_ref, goal_refs, question, scope, sources, method, evidence_aggregate, counterevidence, findings_refs, limitations, created, last_updated, owner_route, challenge_route)` | tracked (documentary) | owner-requested product-foundation model; private record validator in `research/` |
| `CAV2-D62-SCHEMA` | [CAV2-D62](DEFINITIONS.md#cav2-d62-experiment) | experiment | `Experiment = (id, project_ref, goal_refs, research_refs, question_or_hypothesis, subject, protocol_ref, conditions, variables_or_interventions, measures, environment, prerequisites, stop_rules, run_refs, evidence_refs, findings_refs, limitations, created, last_updated, owner_route, challenge_route)` | tracked (documentary) | owner-requested product-foundation model; private record validator in `experiments/` |
| `CAV2-D63-SCHEMA` | [CAV2-D63](DEFINITIONS.md#cav2-d63-product-thesis) | product thesis | `ProductThesis = (id, product_ref, participants, problem, value_proposition, value_mechanism, first_order_principles, intended_outcomes, boundaries, hypotheses, evidence_routes, counterevidence_routes, revision_criteria, owner_route, commitment_state, revision_history, challenge_route)` | tracked (documentary) | owner-requested product-foundation correction; private record validator in `product/` |
| `CAV2-D64-SCHEMA` | [CAV2-D64](DEFINITIONS.md#cav2-d64-recursive-instance-ownership-invariant) | recursive instance ownership invariant | `RecursiveInstanceBinding = (binding_id, project_ref, model_ref, model_version_ref, model_authority_claim, instance_ref, instance_kind, instance_authority_claim, relation_kind, inherited_contract_ref, extension_scope, adoption_decision_ref, adoption_owner_route, adoption_posture, conformance_ref, lifecycle_state, altitude, evidence_refs, challenge_route, drift_owner_route, drift_route, recomposition_route, recursion_budget_or_stop, terminal_owner_or_handoff, authority_effect)` | tracked (documentary) | closed Project registry under `CAV2-PROJECT-SCHEMA-AMEND-D64-001`; separate candidate D34 and inherited-contract prerequisite registries under `CAV2-GOAL-PACKAGE-SCHEMA-AMEND-D64-PREREQ-001`; adoption-envelope preparation under `CAV2-GOAL-PACKAGE-SCHEMA-AMEND-D64-ADOPTION-CANDIDATE-001`; frozen `instance_of` relation candidate under `CAV2-GOAL-PACKAGE-SCHEMA-AMEND-D64-RELATION-CANDIDATE-001`; exact admitted typed-relation witness under `CAV2-GOAL-PACKAGE-SCHEMA-AMEND-D64-RELATION-ADMISSION-001`; exact D48 owner gate presented but unselected; zero concrete bindings, owner adoption, conformance, kernel, and enforcement remain deferred |
| `CAV2-D65-SCHEMA` | [CAV2-D65](DEFINITIONS.md#cav2-d65-domainspec-governed-construction-invariant) | prototype-first DomainSpec construction invariant | `ConstructionBinding = (construction_id, project_ref, subject_ref, definition_prototype_refs+digests, ontology_scaffold_refs+digests, product_capability_prototype_refs+digests, business_prototype_refs+digests, domainspec_project_ref, domainspec_profile_ref, domainspec_language_refs+digests, source_set_ref+digest, compiler_ref+version+digest, compiled_graph_ref+digest, system_ontology_ref+digest, implementation_prototype_ref+digest?, testable_product_candidate_ref+digest?, product_test_contract_ref?, product_test_evidence_refs, product_approval_ref?, product_approval_candidate_digest?, post_approval_decision_refs, contributor_routes, stage_states, evidence_refs, challenge_route, drift_route, authority_effect)` | tracked (documentary plus prototype machine contract), revision 2 | parallel prototype registries, schemas, deterministic freezer/evaluator, exact test evidence, and hostile tests under `ontology/governance/`; the current exact candidate is product-approval-request eligible but has no product approval, authority eligibility, admission, activation, cutover, publication, release, or deployment effect; legacy Project and Governance revision-1 bindings remain quarantined diagnostics |
| `CAV2-D66-SCHEMA` | [CAV2-D66](DEFINITIONS.md#cav2-d66-context) | context | `Context = (id, kind, product_ref, project_ref?, goal_ref?, bounded_context_refs, purpose, consumer_refs, intended_uses, subject_scope, source_policy_refs, owner_route, lifecycle_state, revision_history, challenge_route)` | tracked (documentary) | first closed candidate contract under `context/schemas/context.schema.json`; Context instances, Views, resolver contracts, and runtime evidence remain separately owned |
| `CAV2-D67-SCHEMA` | [CAV2-D67](DEFINITIONS.md#cav2-d67-product-capability) | product capability | `ProductCapability = (id, product_ref, outcome, scope, exclusions, participant_refs, consumer_refs, input_contract_refs, output_contract_refs, context_policy_refs, owner_routes, lifecycle_posture, realization_refs, evidence_refs, revision_history, challenge_route, authority_effect)` with `lifecycle_posture = (kind, status, status_vocabulary_ref, evidence, commitment, provenance, owner, residue_refs)` per `CAV2-D23` | tracked (documentary) | first private canonical-reference and business-system bridge package under `capability/`; capability instances remain module-owned, and realization, conformance, maturity, adoption, permission, and authority stay separate |

## Backlog: schema-bearing definitions not yet tracked

These definitions assert record/tuple/structural shapes in their formal voice but
do not yet have a colocated `### Schema` section or a Tracked Schemas row. They
are queued for promotion into tracked schemas in a later definitions-governance
pass. This list is explicit so the gap is visible, not silently truncated.

| Definition | Term | Embedded shape (in Formal Interpretation) |
| --- | --- | --- |
| CAV2-D16 | typed coupling invariant | `R(A, B)` record: endpoints, relation type, direction, owner, evidence, effect |
| CAV2-D18 | residue | residue record: operation, preservation condition, remainder, type, evidence, owner, treatment |
| CAV2-D19 | ontology | `O_U = (N, E, B, R, C, P, G)` |
| CAV2-D20 | Craft method | `L_S = (C, B, E, D, G, A, N, R)` |
| CAV2-D21 | four-facet action method | `F(a) = (K_a, S_a, H_a, M_a, R_a)` |
| CAV2-D25 | schema amendment witness | `A = (owner, scope, source, delta, compatibility, witness, residue)` |
| CAV2-D26 | append-only event ledger | event record + `P(E) = fold(apply, initial_state, E)` |
| CAV2-D27 | residue entropy | `H(R) = sum negMulLog(rho(x))` / `S_f(m') = log |fiber_f(m')|` (equation — review whether it is a structural contract) |
| CAV2-D30 | bounded recursive self-application | recursive-step record: source, target, altitude, owner, gate, residue/state, recomposition, stop |
| CAV2-D32 | method | `M = (scope, inputs, actions, roles, gates, outputs, evidence, residue_rule, validation_rule, recomposition_rule, boundary)` |
| CAV2-D33 | definition | `Definition = (id, term, status, aliases, normative_voice, plain_language_voice, domain_context_voice, boundary, provenance_or_sources, consumers, index_entry, drift_route)` |
| CAV2-D35 | discipline | `Discipline = (id, name, trigger, practice, evidence, owner_route, hardening_route, source_or_provenance, residue)` |
| CAV2-D36 | decision | `Decision = (id, question, options_considered, chosen_option, rationale, owner_route, evidence, effect, status, residue)` |
| CAV2-D37 | spec | `Spec = (id, scope, contract_kind, interface_or_shape, obligations, validation_surface, owner_route, source_or_provenance, promotion_state, residue)` |

Definitions whose formal voice is a pure equation, predicate, or non-structural
relation — for example `CAV2-D17` reflection tower method, `CAV2-D28` value-cycle
edge guard, and `CAV2-D29` axis orthogonality invariant — are out of scope unless
a later review finds they assert a structural contract.

## Open Questions

### OQ-1. Documentary schema now, machine-checkable schema later?

Context: tracked schemas are currently documentary records colocated with their
definitions. `CAV2-D21` (machine-checkable view) and `CAV2-D25` (schema amendment
witness) point toward eventual validators. Recommendation: keep documentary
tracking as the baseline; promote a schema to machine-checkable form only when an
implementation or validation surface needs it, recording the witness here.
Status: OPEN.
