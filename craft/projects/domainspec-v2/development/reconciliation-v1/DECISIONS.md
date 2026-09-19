# DomainSpec reconciliation decision register

Status: candidate recommendations, not owner decisions or canonical admission.
Authority effect: none. Package: DSV2-RECONCILIATION-001.

The purpose of this register is to make implementation choices explicit without
turning this planning request into a repeated interview. Existing evidenced owner
choices are reused, not silently reopened. The recommendations below are not new
approvals. An executing unit must identify which choices its prototype needs;
canonical promotion and external effects remain later, separately owned stages.

Do not treat an unresolved decision as a global serial blocker. Continue units
that do not consume it. Independent review roles are proposed responsibilities,
not assigned people or authorization to dispatch agents.

## Decisions already preserved by this plan

- Existing DomainSpec meanings remain the authority; this plan introduces no new
  canonical metatype, graph verb, ontology admission or baseline.
- DomainSpec remains generic and independent of AlchLang/ARE configuration;
  AlchLang is an authoring frontend and consumer.
- The previous four-product completion scope and explicit UI exclusion for v1.0
  remain unchanged. Saga's retired identity is not reactivated.
- Prior frozen baselines, accepted packages, owner receipts and imported Lean
  evidence are immutable history.
- Prototype construction remains definitions/ontology/model/code/test first,
  then product approval, then separate admission/publication decisions.

## DEC-01

### What counts as reconciled?

- Owner role: DomainSpec product owner; no person assigned by this plan.
- Status: recommendation, not selected.
- Proposed direction: Use three named outcomes: inventory-reconciled, tested-product-reconciled, canonically-reconciled. Treat publication/deployment as separate.
- Boundary: Do not call unsupported but documented behavior implemented. Account for all capabilities while preserving explicit release exclusions.
- Actual gate: Before closing the support contract and again at DSR-042.
- Affected work: DSR-003, DSR-035, DSR-042.
- Selection evidence required: an explicit decision tied to the exact candidate
  contract/version; a chat summary or changed status field is not an admission.

## DEC-02

### How are missing BMC receipts handled?

- Owner role: Relationship owner and evidence custodian; no person assigned by this plan.
- Status: recommendation, not selected.
- Proposed direction: Recover exact bytes if available; otherwise mark unavailable and create a new candidate evidence epoch. Preserve N01-N45 source decisions without fabricating their missing closeout.
- Boundary: An old label, memory or new hash cannot recreate an old admission. Existing explicit choices need not be re-interviewed unless evidence or meaning conflicts.
- Actual gate: Before asserting recovered closure or using that closure as an admission prerequisite.
- Affected work: DSR-004, DSR-008.
- Selection evidence required: an explicit decision tied to the exact candidate
  contract/version; a chat summary or changed status field is not an admission.

## DEC-03

### What should be reused from the historical v3 candidate?

- Owner role: SFOL/TDE/EVF owners; no person assigned by this plan.
- Status: recommendation, not selected.
- Proposed direction: Reconstruct in a durable isolated folder; reuse only controls whose correspondence to the current contract passes fresh tests.
- Boundary: The temporary checkout is gone. Historical 128-test evidence is not a fresh result or canonical integration. Preserve v1/v2 preimages.
- Actual gate: Before selecting recovered bytes for DSR-022/023.
- Affected work: DSR-005, DSR-022.
- Selection evidence required: an explicit decision tied to the exact candidate
  contract/version; a chat summary or changed status field is not an admission.

## DEC-04

### Which relationship constraint model controls new profiles?

- Owner role: Relationship meaning and compiler owners; no person assigned by this plan.
- Status: recommendation, not selected.
- Proposed direction: Use explicit orthogonal constraint profiles, qualified endpoints, closure evidence, ownership dimensions and membership kinds. Keep legacy behavior version-bound.
- Boundary: D29/D30 vocabulary is canonical; its typed facts and validator binding are not already implemented. Do not silently reinterpret old multiplicity labels.
- Actual gate: At the candidate contract boundary for DSR-010; canonical promotion only after product testing and approval.
- Affected work: DSR-008, DSR-010.
- Selection evidence required: an explicit decision tied to the exact candidate
  contract/version; a chat summary or changed status field is not an admission.

## DEC-05

### How do field types, references and persistence compose?

- Owner role: Type-system and persistence owners; no person assigned by this plan.
- Status: recommendation, not selected.
- Proposed direction: Keep scalar/declared-type/optional/list/set/sum structure. Distinguish entity embedding, identity references, field projections, semantic relationships and storage bindings.
- Boundary: Public Alch reference notation such as Order.id is not declared supported by this plan. An Entity is not automatically a table; a record is not automatic DDL.
- Actual gate: Before finalizing new type/profile syntax or provider-specific storage generation.
- Affected work: DSR-009, DSR-014, DSR-028.
- Selection evidence required: an explicit decision tied to the exact candidate
  contract/version; a chat summary or changed status field is not an admission.

## DEC-06

### How are domain edges, composition and pure calculations reconciled?

- Owner role: Composition and Alch meaning owners; no person assigned by this plan.
- Status: recommendation, not selected.
- Proposed direction: Retain three explicit representations: domain graph, composition-reference graph and typed value bindings. Allow explicit computed mapper inputs and lawful declared calls; eliminate fabricated evaluation Operations.
- Boundary: Canonical maps and scoped maps-to have different endpoint contracts. Do not admit a new DS-D8 edge by naming a dependency. Preserve legacy profiles separately.
- Actual gate: Before modifying pure calculation lowering or selected composition contracts.
- Affected work: DSR-011, DSR-013, DSR-014, DSR-037.
- Selection evidence required: an explicit decision tied to the exact candidate
  contract/version; a chat summary or changed status field is not an admission.

## DEC-07

### How does Policy reuse Rules?

- Owner role: Behavior meaning owner; no person assigned by this plan.
- Status: recommendation, not selected.
- Proposed direction: Make declared Rule references the primary candidate authoring contract; Policy selects a strategy and does not execute it by implication. Adapt legacy inline predicates explicitly.
- Boundary: A strategy selector is not a Boolean Rule. Do not duplicate rule authority in generated authoring examples or silently change existing typed-policy semantics.
- Actual gate: Before changing the candidate public Policy contract.
- Affected work: DSR-015.
- Selection evidence required: an explicit decision tied to the exact candidate
  contract/version; a chat summary or changed status field is not an admission.

## DEC-08

### What are event and workflow occurrence identities?

- Owner role: State Machine and Workflow owners; no person assigned by this plan.
- Status: State Machine corrected versioned source and explicit legacy migration selected by the user's `yes` on 2026-09-09; Workflow versioned occurrence identities and explicit legacy migration selected by `yes apply it` on 2026-09-09. No canonical admission.
- State Machine construction binding: [decision and exact candidate contract](profile-compiler-reconciliation/STATE-MACHINE-DECISION.md#gate-and-continuation).
- Workflow construction binding: [decision and exact candidate contract](profile-compiler-reconciliation/WORKFLOW-OCCURRENCE-DECISION.md#gate-result-and-independent-work).
- Proposed direction: Separate trigger-event input from output event intent; keep guard bindings explicit. Introduce step occurrence identity and qualified Operation references independent of concept adjacency.
- Boundary: No unadmitted State Machine output edge is invented. Repeated occurrence is not duplicate Operation identity; runtime effects are not concept-level emits multiplicity.
- Actual gate: Before finalizing versioned transition/step schemas.
- Affected work: DSR-016, DSR-017.
- Selection evidence required: an explicit decision tied to the exact candidate
  contract/version; a chat summary or changed status field is not an admission.

## DEC-09

### What does composition assurance actually prove?

- Owner role: Assurance and formal-provider owners; no person assigned by this plan.
- Status: recommendation, not selected.
- Proposed direction: Version checked interchange and provider claim scope; cover composition identity, dependencies, binding and selected semantics. Keep compilation, preservation, provider proof and runtime evidence separate.
- Boundary: A graph-consistency proof is not general behavioral correctness. Unsupported provider scope is explicit and cannot satisfy a required proof cell.
- Actual gate: Before DSR-020 proof-profile selection and DSR-023 EVF join.
- Affected work: DSR-020, DSR-023.
- Selection evidence required: an explicit decision tied to the exact candidate
  contract/version; a chat summary or changed status field is not an admission.

## DEC-10

### Which FormalClaim versions and projections are supported?

- Owner role: Formalization meaning, TDE and EVF owners; no person assigned by this plan.
- Status: recommendation, not selected.
- Proposed direction: Review v4 definition-bound authoring as the candidate target, retain exact v2 intake compatibility, and declare preservation-backed adapters. Reuse historical v3 controls selectively.
- Boundary: FormalClaim carrier, SFOL logic profile, API version and provider profile are different axes. V4 is not currently adopted; no silent version relabeling.
- Actual gate: Before introducing a new supported CLI/formalization profile.
- Affected work: DSR-022, DSR-023, DSR-037.
- Selection evidence required: an explicit decision tied to the exact candidate
  contract/version; a chat summary or changed status field is not an admission.

## DEC-11

### Which bounded runtime provider is the first proof target?

- Owner role: Recovery, persistence and toolchain owners; no person assigned by this plan.
- Status: recommendation, not selected.
- Proposed direction: Prefer an existing local PostgreSQL transactional-outbox test binding as a prototype starting point after capability review; keep provider-neutral contracts and SQLite custody distinct.
- Boundary: This is a recommendation, not provider selection or production authority. Durable claims require crash/fencing/replay evidence; live credentials require a separate envelope.
- Actual gate: Before provider-specific DSR-025/028 execution; does not block unrelated local work.
- Affected work: DSR-025, DSR-028, DSR-043.
- Selection evidence required: an explicit decision tied to the exact candidate
  contract/version; a chat summary or changed status field is not an admission.

## DEC-12

### What is the lifecycle and guarantee scope of application runtime?

- Owner role: Application and security product owners; no person assigned by this plan.
- Status: recommendation, not selected.
- Proposed direction: Expose reviewed application commands as an explicit candidate/experimental profile; specify buffered HTTP, streaming, custody and outbound guarantees separately. Use local deterministic adapters first.
- Boundary: A successful inference demo does not prove a generic secure service. OAuth, encryption, external effects and rendering retain explicit adapters/owners.
- Actual gate: Before making new public support or security guarantees.
- Affected work: DSR-026, DSR-027, DSR-043.
- Selection evidence required: an explicit decision tied to the exact candidate
  contract/version; a chat summary or changed status field is not an admission.

## DEC-13

### Which exact candidate, version and release scope are selected?

- Owner role: Product, baseline and release owners; no person assigned by this plan.
- Status: recommendation, not selected.
- Proposed direction: Keep @10 and old accepted archives immutable; propose a new candidate identity and deliberate package/profile version. Preserve completion-dag/v2's four-product scope and UI exclusion.
- Boundary: Product approval precedes separate canonical admission/publication decisions; no implementation, commit, release or cutover is authorized by this plan.
- Actual gate: At DSR-035 freeze, after DSR-036 tests, and before any external release.
- Affected work: DSR-035, DSR-036, DSR-039, DSR-040.
- Selection evidence required: an explicit decision tied to the exact candidate
  contract/version; a chat summary or changed status field is not an admission.

## Open Questions

The thirteen decisions above own the unresolved design, profile, provider and
release choices. They belong in this private engineering plan, not in user-facing
product documentation. DSR-034 must publish supported behavior and limitations
from the selected tested support matrix; it must not copy this open-question
register into the product guide.
