# Ontology Knowledge Lifecycle Authority Findings

Status: repaired synthesis
Date: 2026-06-21
Dispatch: 2026-06-21-ontology-knowledge-lifecycle-authority

## Conclusion

Ontology is not the lifecycle authority. It can classify, relate, project, trace, and request promotion, but it does not decide adopted lifecycle status.

The durable model is a two-axis authority split:

| Axis | Owns | Does not own |
| --- | --- | --- |
| `evidence_authority` | What a source, selector, inventory evidence card, runtime observation, proof artifact, or validation result actually says. | Adoption, scope, canonical wording, or promoted status. |
| `promotion_authority` | Owner routes, governance gates, PromotionRecords, definitions, constitutions, decisions, promoted specs, runtime owner decisions, and release/stability gates. | Raw-source truth or observed facts outside its evidence surface. |

In v2 terms, ontology scope is semantic and traceability-scoped. Authority remains with raw sources, owner artifacts, owner routes, runtime owner surfaces, and PromotionRecord or owner decisions.

## Source Shape

CyberAlchemy v2 already separates sources, inventory, ontology, research, authority, implementation, validation, observability, and ops (`cyberAlchemy-v2/README.md:60-67`). Its authority rule says authority should live in the narrowest responsible surface, while research, inventory, ontology, observability, and ops provide evidence or explanation but do not become authority without a promotion route (`cyberAlchemy-v2/authority/README.md:24-35`).

The v2 ontology README makes the candidate boundary explicit: ontology is a project-local candidate map for meaning, relations, confidence, and promotion requests, and it cannot promote itself or redefine definitions, constitutions, specs, capabilities, runtime behavior, or public claims (`cyberAlchemy-v2/ontology/README.md:3-12`).

The generated-projection rule matches that split: generated skills, commands, runtimes, and host projections must trace to canonical source before influencing contracts or capability definitions (`cyberAlchemy-v2/authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md:101-115`). The same constitution requires scattered definitions, glossaries, constitutions, axioms, quality rules, and anti-patterns to be staged in import ledgers before promotion (`cyberAlchemy-v2/authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md:177-216`).

The candidate promotion ladder is already present: source evidence -> import candidate -> inventory candidate -> ontology candidate -> definition, constitution, decision, or spec proposal -> local authority -> implemented behavior -> stable repository asset (`cyberAlchemy-v2/authority/promotion-policy.md:8-18`). Required gates include definitions-governance, discipline-governance, constitution-governance, authority import, decision-gate, and task-session (`cyberAlchemy-v2/authority/promotion-policy.md:20-29`).

## Generic Authority Movement Protocol

Use this as the general protocol for definitions, constitutions, axioms, disciplines, decisions, specs, and implementation claims:

```yaml
authority_movement_envelope:
  subject_identity:
    id: stable id or candidate id
    kind: definition | constitution | axiom | discipline | decision | spec | implementation_claim
    owner_surface: narrowest responsible owner
  source_provenance:
    sources: path#line selectors or observed run ids
    source_posture: public | private | mixed | generated | runtime | research | proof | human_decision
    source_claims: pointer-backed claims only
  inventory_evidence:
    evidence_cards: []
    evidence_sets: []
    confidence: evidence confidence only
  candidate_semantics:
    ontology_candidates: []
    typed_relations: []
    contradictions: []
    unresolved_terms: []
  gate_tests:
    required_routes: []
    forbidden_shortcuts: []
    promotion_blockers: []
  owner_decision:
    decision_owner: ""
    decision_record: ""
    adopted_status: candidate | reviewed | promoted | rejected | retired
    use_scope: ""
  promotion_record:
    id: ""
    source_inputs: []
    evidence_confidence: ""
    commitment_confidence: ""
    contradiction_path: ""
    retirement_path: ""
  authority_artifact:
    canonical_path: ""
    artifact_kind: ""
    validation_surface: ""
  generated_projection:
    projection_paths: []
    canonical_source_trace: []
  operational_invariants:
    runtime_guards: []
    validation_guards: []
    observability_guards: []
```

This envelope allows multiple provenances without collapsing them. A definition, constitution, axiom, discipline, or spec can derive from domain work, operational DAG results, research, proof work, human decisions, AI-assisted synthesis, or runtime telemetry, but those inputs enter as source/evidence channels. They only become adopted authority after the owner route decides scope and status.

## Promotion Routes

Definitions: if a term becomes load-bearing across artifacts, route through definitions-governance. Its authority rule says only the consuming project's configured canonical definitions source may define normative semantics, while narrative, runtime, planning, and copied artifacts may explain or reference definitions but should not redefine them (`arcanum/arcana/definitions-governance/SKILL.md:102-109`).

Constitutions: if a structural rule should constrain future artifacts, route through constitution-governance. Constitution creation requires scope, owner, authority level, selection predicates, rules, examples/non-examples, validation adapters, promotion boundary, and retirement or split triggers (`arcanum/arcana/constitution-governance/SKILL.md:88-97`).

Axioms: keep the route stricter. The current promotion lifecycle says a reviewed item may become an axiom only through an axiom gate with invariant-bearing test, dependency review, strong evidence, contradiction review, and explicit commitment; repeated observation alone is a forbidden shortcut (`arcanum/development/cyberalchemy-ontology-lifecycle/PROMOTION-LIFECYCLE.md:96-100`). Current v2 constitution imports stage constitution and axiom sources as candidates, not as adopted axioms (`cyberAlchemy-v2/authority/imports/constitutions/MANIFEST.md:7-19`).

Disciplines: use the same authority movement envelope, but the owner route is discipline-governance. A discipline should not become a constitution unless the recurring practice becomes a structural rule that constrains artifacts.

## Idempotency And Nearby Primitives

Idempotency should not be a global axiom by default. It is better treated as an owner-scoped operational invariant that may become a default constitution or axiom only inside domains where repeat execution is load-bearing and testable.

Current witnesses support owner-scoped idempotency and deterministic behavior:

| Primitive candidate | Current evidence | Status |
| --- | --- | --- |
| Append-only ledger | Dispatch ledger uses exactly two appends and never edits existing rows (`implementation/domainspec/internal_tools/subagents-dispatch-hooks/docs/LEDGER-MODEL.md:39-51`). The hook blocks direct edits to the ledger and allows sanctioned appender writes (`implementation/domainspec/internal_tools/subagents-dispatch-hooks/hooks/enforce-append-only-dispatch.cjs:4-29`, `implementation/domainspec/internal_tools/subagents-dispatch-hooks/hooks/enforce-append-only-dispatch.cjs:79-98`). | Owner-scoped runtime invariant. |
| Idempotent registry writes | The appender no-ops if a dispatch is already registered or a close row is already present (`implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/register-dispatch/append-dispatch.cjs:336-359`). | Implemented owner-scoped behavior. |
| Deterministic generation | Test derivation output says it is auto-generated and deterministic (`implementation/domainspec/tools/test-derivation-engine/src/emit/tests.ts:80-88`, `implementation/domainspec/tools/test-derivation-engine/src/emit/tests.ts:334-341`), and tests assert byte stability across two emissions (`implementation/domainspec/tools/test-derivation-engine/src/emit/tests.test.ts:114-120`). | Implemented and tested in that tool. |
| Deterministic projection | Knowledge graph rebuild sorts concepts and edges before saving projection (`implementation/domainspec/backend/src/modules/knowledge-graph/application/rebuild-mirror-projection.ts:129-157`), with server coverage for rebuild and latest snapshot reads (`implementation/domainspec/backend/src/server.test.ts:581-605`). | Implemented projection behavior. |
| Idempotency monitoring | Observability rule O9 requires monitors for documented idempotency rules (`implementation/domainspec/OBSERVABILITY.md:282-306`), with a player-makeup P0 alert for idempotency violation (`validation/poker-team/infra/alerts/player-makeup.rules.yml:55-63`). | Monitoring precedent, not global axiom. |
| Typestate/confluence | Prior formalization frames close-row lifecycle and G-Set confluence as operational candidates, while noting unenforced or component-only status (`implementation/domainspec/internal_tools/subagents-dispatch-hooks/formalization/dispatch-formal-guarantees/research/findings.md:49-80`, `implementation/domainspec/internal_tools/subagents-dispatch-hooks/formalization/dispatch-formal-guarantees/research/findings.md:96-107`). | Candidate formal/operational precedent. |

Nearby primitive candidates to keep in the v2 top layer:

- explicit typed relations when orthogonality is absent
- source/promoted separation
- candidate/promoted separation
- evidence confidence separated from commitment confidence
- append-only history for governance ledgers
- idempotent writes for repeatable registry operations
- deterministic generation for generated projections
- contradiction path before overwrite
- retirement path instead of deletion
- bounded recursion or loop caps for recursive methods and agent routes
- canonical-source trace before generated projection use

## Non-Vacuity Witness

There is no complete implemented source-to-authority-to-runtime lifecycle path for CyberAlchemy ontology yet. The best witness is review-only and candidate/synthetic.

| Stage | Best current witness | Status |
| --- | --- | --- |
| Source | CAOL first slice explicitly aims to prove a candidate ontology lifecycle with a review-only PromotionRecord fixture and no canonical ontology entries (`arcanum/development/cyberalchemy-ontology-lifecycle/FIRST-WORKING-SLICE.md:13-15`). It names required fixture fields (`arcanum/development/cyberalchemy-ontology-lifecycle/FIRST-WORKING-SLICE.md:62-84`). | Source evidence. |
| InventoryEvidence | A generic evidence card records a source evidence -> inventory read model -> ontology candidate map -> owner-gated promotion control loop (`.arcanum/inventory/entries/evidence-cards/2026-06-18-dispersed-knowledge-cards.md:358-373`). | Generic precedent, not CAOL-specific card. |
| OntologyCandidate | CAOL architecture includes node types for SourceSelector, InventoryEvidence, PromotionRecord, OntologyCandidate, Constitution, and Axiom (`arcanum/development/cyberalchemy-ontology-lifecycle/ONTOLOGY-ARCHITECTURE.md:143-155`). | Candidate design. |
| Owner route | CAOL architecture includes a review owner matrix and blocks promotion when owner is unknown (`arcanum/development/cyberalchemy-ontology-lifecycle/ONTOLOGY-ARCHITECTURE.md:271-281`). | Candidate route design. |
| PromotionRecord | CAOL L0 fixture is review-only and does not promote ontology knowledge, mutate canonical files, or change runtime behavior (`arcanum/development/cyberalchemy-ontology-lifecycle/first-slice/promotion-record-fixture.md:10-14`). Its table carries id, claim, source inputs, provenance, candidate status, confidence split, review owner, gate result, use scope, contradiction path, retirement path, route impact, bridge validation, and expiry (`arcanum/development/cyberalchemy-ontology-lifecycle/first-slice/promotion-record-fixture.md:18-34`). | Candidate review artifact. |
| Validation | Validation passes the review-only fixture and states it does not mutate canonical ontology, runtime, skill, sigil, spell, or observability files (`arcanum/development/cyberalchemy-ontology-lifecycle/first-slice/validation-result.md:12-14`). Checklist confirms candidate status, source pointers, confidence split, review owner, bridge outcome, signal truth guard, narrow use scope, and no canonical mutation (`arcanum/development/cyberalchemy-ontology-lifecycle/first-slice/validation-result.md:20-29`). | Review-only validation. |
| Runtime guard | Idempotency and deterministic projection precedents exist in other owner surfaces, but there is no CAOL-local idempotency/quota guard tied to a PromotionRecord. | Missing. |

Verdict: the lifecycle idea is non-vacuous as a candidate design, but incomplete as an implemented authority path. Missing pieces are a CAOL-specific InventoryEvidence card, a CAOL EvidenceSet, an accepted ontology candidate under the v2 route, owner decision record, promoted artifact or projection, and CAOL-local idempotency/quota guard tied to the PromotionRecord.

## Inventory Backfill Candidates

Do not add these as promoted authority yet. These are candidate entry ideas for a future owner-gated inventory backfill; this artifact does not authorize or perform inventory mutation.

| Candidate id | Type | Purpose |
| --- | --- | --- |
| `caol-l0-promotion-record-fixture` | evidence-card | Capture the review-only PromotionRecord fixture with candidate/promoted boundary visible. |
| `caol-lifecycle-envelope-contract` | evidence-card | Capture the required lifecycle envelope fields and forbidden shortcuts. |
| `caol-nonvacuity-witness-path` | evidence-set | Tie source -> inventory -> ontology candidate -> promotion record -> owner route -> validation into one trace. |
| `caol-axiom-admission-blocker` | contradiction/open-question card | Record that axiom admission is blocked until invariant-bearing test, dependency review, contradiction review, and explicit commitment exist. |
| `caol-idempotency-owner-guard-precedents` | evidence-set | Gather owner-scoped idempotency, append-only, deterministic generation, and projection precedents without claiming global axiom status. |

## Reviewer Disposition

| Reviewer gate | Result | Repair applied |
| --- | --- | --- |
| Russell definitional gate | Fix required. | Removed any claim that ontology owns lifecycle authority; split evidence authority from promotion authority. |
| Bourbaki non-vacuity gate | Fix required. | Added concrete witness ladder and marked missing CAOL-specific pieces. |
| Meadows owner-boundary gate | Keep with repairs. | Demoted primitive language to owner-scoped candidates unless promoted by the relevant route. |

## Final Shape

The authority movement chain should read:

```text
raw source / owner artifact
  -> source selector
  -> InventoryEvidence
  -> OntologyCandidate or semantic/traceability request
  -> PromotionRecord draft
  -> owner route decision
  -> authority artifact or rejected/deferred candidate
  -> generated projection only with canonical-source trace
  -> operational guard owned by the relevant runtime/validation surface
```

The next valid move is inventory backfill plus owner-gated promotion, not canonical mutation, axiom admission, or treating ontology/read models as adopted authority.
