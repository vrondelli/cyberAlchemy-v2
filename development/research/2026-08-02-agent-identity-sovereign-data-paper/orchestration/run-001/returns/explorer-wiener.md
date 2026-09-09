# Explorer report — Wiener, Norbert

## Evidence status

Result: evidence-backed candidate composition; no canonical mutation, implementation, validation run, publication, or legal-compliance claim.

The four permitted Inventory seeds were checked against current owner/source bytes. The scientific-authority Inventory entry has stale line ranges, but its anchor-named definitions remain present and support the synthesis. The Lean permission kernel was inspected at source level, not rebuilt or executed. Inventory remains a non-authority discovery model.

## Typed composition map

| Stage | Candidate type/effect | Owner | Non-collapse |
| --- | --- | --- | --- |
| Subject-controlled data | `SubjectDataStore` issues opaque `SubjectDataRef`s carrying digest, classification, validity, retention, and correction/deletion handles. | Subject, data controller, or delegated store owner | Custody/integrity do not establish truth. Raw personal data does not become CAV2 evidence by availability. |
| Agent identity | `AgentIdentityAttestation` binds principal, issuer, agent software/runtime, session, authentication evidence, validity, and revocation handle. CAV2 `authority_effect: none`. | Identity provider and agent-runtime owner | Authentication and continuity establish provenance only, not authorization, conformance, truth, or authority. |
| Delegated capability | `DelegationGrant` binds grantor, grantee, exact resource/action scope, purpose, environment, expiry, revocation, and policy version. | Subject/resource and access-policy owners | Consent is not blanket authorization. The exact request requires independent authorization. |
| Purpose-bound computation | `PurposeBoundComputationRequest` binds identity, grant, purpose, data refs, code/model/config digests, allowed output, retention, and disclosure limits. | Authorization-policy and runtime owners | The grant/runtime cannot define its own successful evaluation; execution cannot bypass mediation. |
| Derived claim and receipt | `DerivedClaimEnvelope` plus `ComputationReceipt` binds source digests, transformation, runtime observation, output, omissions, policy decision, confidence, and replay posture. | Runtime/evidence producer; source owners retain source authority | A valid receipt is not semantic truth. Confidence is not promotion. Narrative is not evidence beyond cited supports. |
| Inventory evidence | EvidenceCard/EvidenceSet points to claim, receipt, sources, residue, and owner route. | Inventory route | Discovery/read model only; no promotion effect. |
| Ontology candidate/view | Current node contract: source refs, owner route, candidate status, split confidence, challenge contract, residue, and forbidden collapse. Candidate relations may include `supports_candidate`, `requests_promotion_gate`, and `uses_lifecycle_axis`. | Ontology route plus source-owner permission | Ontology models and projects; it cannot decide truth, authorization, promotion, or schema effects. |
| Challenge | `ChallengeContract` names admissible evidence, contradiction, validation, blocking questions, resolution gate, and residue route. | Relevant claim/authority owner | Route, not verdict or confidence axis. |
| Owner decision | Narrowest responsible owner records pass, flag, block, defer, reject, or supersede. Only an enumerated authority kind may enter its lifecycle. | Definitions, constitution, decision, spec, or other enumerated owner | An unenumerated identity/data authority kind defaults to blocked under CAV2-D49. |

```text
SubjectDataStore
  -> opaque source refs
  -> AgentIdentityAttestation + revocable DelegationGrant
  -> independent authorization
  -> PurposeBoundComputation
  -> DerivedClaimEnvelope + ComputationReceipt
  -> InventoryEvidence
  -> OntologyCandidate/View
  -> ChallengeContract
  -> OwnerDecision
  -> optional existing-kind authority or authorized projection
```

## Ownership matrix

| Concern | CAV2 already owns | External layer must own | Missing |
| --- | --- | --- | --- |
| Identity | Provenance, traceability, claim ceilings, and access-control/authority separation | Identifiers, credentials, authentication, continuity, rotation, compromise, expiry, revocation | Canonical agent-identity contract and cross-provider binding |
| Sovereign data | Public/private and source/read-model boundaries; candidate/owner routes | Custody, encryption, localization, access logs, retention, correction, deletion, export, subject control | Canonical sovereign-data contract; jurisdiction-specific interpretation |
| Consent/delegation | Gates and narrowest-owner routing | Grant capture, resource/purpose/action scope, expiry, revocation, enforcement | Independent identity + grant + purpose + resource + action + environment relation |
| Computation | Claim-proof and evidence postures | Mediation, byte/config binding, raw observation, cancellation, containment | Executable binding and negative-witness suite |
| Receipts | Provenance, traceability, append-only ledger pattern | Runtime facts, source/output digests, policy observations, replay inputs | Privacy-safe schema and erasure/audit reconciliation |
| Inventory | Candidate lookup, EvidenceCards/Sets, context routing | Source material remains source-owned | Target-local CAV2 machine index |
| Ontology | Candidate node, relation, lifecycle, projection, challenge, residue shapes | External identity/data semantics until promoted | Admitted live identity/delegation schema relations |
| Authority | Closed kinds, owner routes, promotion lifecycle, gates, decisions | Operational authorization in its own domain | Owner decision admitting contracts or integration |
| Publication | Boundary scrub and owner review | Credentials/personal data stay private to owner | Selected and reviewed public-safe integration package |

## Candidate interfaces

These are interface candidates only, not CAV2 definitions, schemas, authority kinds, or live ontology relations.

```text
AgentIdentityAttestation = {
  principal_ref, issuer_ref, agent_software_digest,
  runtime_or_session_ref, authentication_method,
  issued_at, expires_at, rotation_or_revocation_ref
}

DelegationGrant = {
  grantor_ref, grantee_principal_ref, resource_scope,
  allowed_actions, declared_purpose, environment_constraints,
  retention_and_disclosure_limits, issued_at, expires_at,
  revocation_ref, policy_version
}

PurposeBoundComputationRequest = {
  identity_attestation_ref, delegation_grant_ref, purpose,
  input_data_refs_and_digests, code_model_and_config_digests,
  requested_action, permitted_output_class,
  execution_and_retention_limits
}

DerivedClaimEnvelope = {
  claim_id, scoped_claim, source_and_transformation_provenance,
  computation_receipt_ref, evidence_confidence,
  commitment_confidence, validity_or_expiry,
  omissions_and_residue, challenge_contract_ref, owner_route
}

ComputationReceipt = {
  identity_grant_request_bindings, source_ref_digests,
  authorization_observation, runtime_and_configuration_digests,
  start_end_and_cancellation_state, output_digest,
  disclosed_omissions, replay_or_determinism_posture
}
```

CAV2 should receive bounded references, claims, decisions, and privacy-safe receipts—not raw biometric, emotional, conversational, memory, or surveillance streams.

## Positive witness

A minimal positive witness requires:

1. A subject-controlled store exposes one opaque, digest-bound data reference.
2. A valid attestation binds agent principal `A`.
3. The resource owner issues grant `G` to `A` for one action, resource, purpose, environment, and time window.
4. An independently defined evaluator checks the exact request and returns allow.
5. A mediated runtime executes bound code/model/config without unauthorized raw-data export.
6. It emits a claim and receipt with exact bindings, observations, output digest, omissions, and replay posture.
7. Inventory records evidence with source selectors and no promotion effect.
8. Ontology stages a candidate with split confidence, owner route, residue, forbidden collapses, and challenge contract.
9. Contradiction, source correction, binding failure, or revocation can challenge it.
10. The narrowest owner decides. If it should govern, it must be promoted as an existing kind such as Decision or Spec; otherwise it remains evidence/candidate material.

This witness is specified, not executed.

## Negative witnesses

| Case | Required result |
| --- | --- |
| Valid identity, no grant | Block before data access; identity remains provenance. |
| Broad consent, wrong purpose | Block; consent is not unconstrained authorization. |
| Valid grant, mismatched principal/session | Block and record binding residue. |
| Grant revoked before execution | Deny; emit only bounded denial/cancellation evidence. |
| Grant revoked during execution | Cancel/quarantine output; prohibit candidate use until containment is evidenced. |
| Data digest/validity mismatch | Invalidate claim and route dependants to challenge/drift review. |
| High-confidence narrative without support | Candidate/hypothesis only under CAV2-D38. |
| Inventory entry no longer source-corroborated | Prefer live sources, record staleness, block promotion. |
| Ontology marks candidate useful | No authority effect; owner decision remains required. |
| Owner rejects/defers | Route to typed residue; no authoritative projection. |
| New “Sovereign Data Claim” authority kind | Default-deny until kind, owner, and lifecycle are admitted. |

## Failure and revocation routing

| Trigger | Immediate effect | Owner |
| --- | --- | --- |
| Expired, unverifiable, rotated, or compromised identity | Block authentication/binding | Identity-provider/runtime-security owner |
| Missing, ambiguous, expired, or purpose-mismatched grant | Block authorization | Resource/access-policy owner |
| Unmediated runtime or unbound observation | Downgrade to demonstration or unusable evidence | Runtime/validation owner |
| Source correction or digest change | Invalidate/recompute projections; challenge dependants | Source owner, then candidate owner |
| Revocation before owner decision | Stop use, invalidate caches/views, block or defer candidate | Grant owner plus ontology/candidate owner |
| Revocation after promotion | Mark authority `drift-flagged`; owner decides active, superseded, deprecated, or blocked | Existing authority-kind owner |
| Forget/delete request | External store deletes owned data and rebuilds disposable projections; affected evidence owners remove derived copies where permitted | Data/privacy and evidence owners |
| Erasure conflicts with audit | Block retention assumptions; require privacy/legal decision | Privacy/legal owner |
| Unresolved contradiction | Block movement and route residue | Claim/authority owner |
| Stale Inventory/ontology | Fall back to governed sources; record read-model residue | Inventory/ontology route |

The append-only ledger pattern may retain non-sensitive transition facts, corrections, and revocations. It is not permission to retain personal data indefinitely; privacy/audit reconciliation is unresolved.

## Required non-collapse rules

- Identity is provenance/authentication input, not authorization, truth, conformance, or authority.
- Data custody is control, not proof that contents are true.
- Consent is not blanket authorization.
- Confidence is a lifecycle axis, not promotion.
- A receipt preserves bindings/observations; it does not author semantic truth.
- Inventory evidence is not source authority or promotion.
- Ontology is not an owner verdict.
- A challenge contract is not a decision.
- Narrative repetition or explanation quality is not evidence.
- Successful execution does not redefine a term, rule, or kind.
- Revocation opens the responsible owner route; ontology cannot silently demote authority.
- A new authority kind cannot govern until the closed enumeration is amended.

## Authority and public/private boundaries

- CyberAlchemy v2 is private and project-local, with current gate `flag`; it is neither standalone nor public.
- The ontology package is candidate/projection material. Its relations are not live vault edges or executable authority transitions.
- Inventory is non-authority; CAV2 has no target-local machine index.
- Raw personal data remains in its owning substrate. CAV2 receives bounded references, claims, policy decisions, and privacy-safe receipts.
- Public Arcanum may support public framework reasoning, but private CAV2, DomainSpec, validation, telemetry, sessions, and research prose must not be copied into Arcanum.
- Any public derivative requires boundary scrub and owner review.
- This report supports no promotion, implementation, deployment, publication, legal-compliance, or production-readiness claim.

## Missing architecture/evidence

1. Canonical agent-identity contract.
2. Canonical sovereign-data contract.
3. Independent authorization relation.
4. Runtime mediation and revocation-propagation contract.
5. Privacy-safe claim/receipt schema.
6. Erasure versus append-only audit decision.
7. Admitted identity/delegation ontology relations, if needed.
8. Target-local CAV2 machine Inventory index.
9. Jurisdiction-specific legal classification.
10. Executed positive, negative, mutation, correction, forget, and revocation witnesses.
11. Owner decisions selecting any definition, constitution, spec, implementation, or public route.

## Source selectors

59 selectors across 19 files:

- `cyberAlchemy-v2/README.md#repository-objective`; `#stable-thesis`; `#current-gate`
- `cyberAlchemy-v2/VALUE-AND-PHILOSOPHY-PROPOSITION.md#philosophy`; `#boundaries`
- `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md#authority-rule`; `#core-flow`; `#authority-kinds`; `#narrowest-owner-rule`; `#non-collapse-rules`
- `cyberAlchemy-v2/authority/promotion-policy.md#promotion-ladder`; `#required-gates`
- `cyberAlchemy-v2/authority/boundaries.md#public-and-private`; `#source-and-read-model`; `#research-and-specification`
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#cav2-d3-authority-layer`; `#cav2-d5-promotion-gate`; `#cav2-d19-ontology`; `#cav2-d23-authority-lifecycle-axis`; `#cav2-d26-append-only-event-ledger`; `#cav2-d34-authority`; `#cav2-d35-provenance`; `#cav2-d38-claim-proof-bound`; `#cav2-d40-challenge-contract`; `#cav2-d41-authority-model`; `#cav2-d48-authority-promotion-lifecycle`; `#cav2-d49-closed-authority-kind-enumeration`
- `cyberAlchemy-v2/ontology/README.md#repository-objective-role`
- `cyberAlchemy-v2/ontology/NODE-MODEL.md#node-concept-contract`; `#initial-node-concepts`
- `cyberAlchemy-v2/ontology/RELATION-MODEL.md#relation-contract`; `#allowed-candidate-relations`; `#schema-evolution-only-relations`
- `cyberAlchemy-v2/ontology/LIFECYCLE-MODEL.md#lifecycle-separation`; `#candidate-workflow-states`; `#typed-hole-rule`
- `.arcanum/inventory/entries/agent-satisfies-spec-current-state-research-strategy-result-synthesis.md#accepted-result`; `#next-human-action`
- `.arcanum/inventory/entries/scientific-authority-lifecycle-synthesis.md#provenance-spine`; `#relation-map`; `#scientific-method-reading`
- `.arcanum/inventory/entries/resonantos-living-archive-seam-and-owned-base-synthesis.md#the-seam-dispatch-1-living-archive-integration`; `#the-owned-base--importance-dispatch-2-owned-base-and-importance`
- `.arcanum/inventory/entries/augmentor-user-graph-reasoning-research-result-synthesis.md#accepted-architecture`; `#ownership-and-transfer-boundary`; `#verification-and-claim-boundary`
- `projects/domainspec-v2/development/research/2026-07-22-agent-satisfies-spec-current-state/findings.md#what-the-symbol-must-not-hide`; `#the-first-admissible-target`; `#required-semantic-chain`; `#collapse-tests`
- `domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean:89-164`
- `development/resonantos-integration/findings.md#additive-vs-overlap-verdict-matrix`; `#critical-claim--proof-correction-e1-caveat-1`
- `development/resonantos-integration/RESONANTOS-INTEGRATION-GUIDE.md#scope-tag-discipline--lifecycle-mapping`
- `research/2026-07-28-authority-memory-augmentor-integration/findings.md#non-collapsing-layers-and-ownership`; `#protected-user-handles`; `#bounded-query-reasoning-and-presentation`; `#literal-vertical-v0-witness`; `#user-experience-degraded-modes-and-privacy`

---
action_id: spawn-0003  
role_id: explorer-wiener  
status: complete  
validation: PASS_WITH_RESIDUE — read-only inspection; all four permitted Inventory claims checked against live sources; Lean inspected but not executed; integration witness not run  
blockers: canonical identity/data contracts absent; authorization/revocation semantics absent; target machine-index gap; legal classification out of scope; no executable integration witness  
source_selector_count: 59
