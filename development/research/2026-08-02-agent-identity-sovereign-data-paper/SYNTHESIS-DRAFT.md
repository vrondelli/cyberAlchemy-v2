# Canonical compact synthesis: agent identity, sovereign data, and CAV2

## Executive assessment

The DOCX is a conversational concept draft, not a paper, validated framework, clinical protocol, legal instrument, or implemented system.

Its valuable core intuition survives correction:

> Adaptive AI can add profiling, personalization, feedback, optimization, and scale to ordinary influence. A human-centered response should preserve privacy, refusal, correction, revocation, appeal, attribution, and meaningful human choice.

The draft overshoots when it claims or implies that Romantic literature and AI are equivalent manipulation systems; dopamine or neuroplasticity install beliefs; biometrics reveal inner emotional truth; AI reliably predicts or eliminates burnout; monitoring produces well-being; or DIDs, credentials, IPFS, blockchain, and ERC-7007 establish truth, authorization, ownership, persistence, or compensation.

Those propositions are unsupported, causally unresolved, or unsafe. The defensible result is an unverified governance and architecture proposal.

## Evidence register

References to an evidence packet below incorporate all packet fields.

| Claim ID | Immutable source identity | Source-local selector | Explorer-return reference | Scope and status |
|---|---|---|---|---|
| EV-01 | DOCX `sha256:3153a4ced4a268294e9695e75618448f75737ac101a06534e31544ad8b7e8c54` | Human prompts ¶38, 63–64, 110, 167, 190, 243, 291, 338, 394, 555, 575, 684, 709; generated expansions ¶55, 69–91, 129–155, 244–550, 575–708, 717–767 | Kahneman return `sha256:684b6ec2168e811f9e2ad38f602c00c164e0bcdfa699cc0ab72c3a72dc81c4bf`, §§1, 3 | Artifact classification and authorship; `EXECUTED` hash/OOXML inspection, content `OBSERVED` |
| EV-02 | DOI `10.1037/0022-3514.79.5.701`; DOI `10.1038/s41562-025-02194-6`; DOI `10.2196/50253`; DOI `10.1111/peps.12514`; Regulation (EU) 2024/1689 | Green/Brock Abstract and Experiments 1–4; Salvi Abstract/design/limitations; Barac Abstract/Results/Conclusions; Ravid monitoring/stress findings; EU AI Act Recital 44 and Art. 5(1)(f) | Kahneman return `sha256:684b…`, §§2–6 | Narrative persuasion, burnout, monitoring, and mental-state inference; sources `OBSERVED`, no causal/clinical reproduction |
| EV-03 | W3C Controlled Identifiers 1.0 REC 2025-05-15; W3C VC Data Model 2.0 REC 2025-05-15; SPIFFE commit `dc4e9d9b4eff8aa181a54cd330ff9f877186060e` | CID §2.1.2; VC §§1.1, 2, 5.9; SPIFFE §§2, 4.1 | Hewitt return `sha256:69efc77b96051629e8165f0e0a6027a92dc163250e43753f03e71417d44559a5`, §§Main finding, Required type distinctions | Identity/authentication boundary; status/version checks `EXECUTED`, semantics `OBSERVED` |
| EV-04 | RFC 9635, RFC 9396, RFC 8707, RFC 9449, RFC 9700; W3C ODRL 2.2 REC 2018-02-15; W3C PROV-O REC 2013-04-30; RFC 9943 | Grants, `authorization_details`, resource/audience restriction, proof-of-possession, security BCP; ODRL permissions/prohibitions/duties; PROV use/generation/derivation; SCITT inclusion receipts | Hewitt return `sha256:69efc…`, §§Standards owners, Candidate interfaces | Authorization, policy, provenance, and receipt primitives `OBSERVED`; composed interfaces `UNVERIFIED` |
| EV-05 | Hewitt return `sha256:69efc77b96051629e8165f0e0a6027a92dc163250e43753f03e71417d44559a5` | `#Candidate agent identity interface`, `#Candidate data-use grant`, `#Candidate data-use receipt`, `#Smallest witnesses`, `#Threat controls` | `spawn-0002` | Proposed operational interfaces and witnesses; `UNVERIFIED`, not implemented |
| EV-06 | Wiener return `sha256:c87e5a77a333c556e28c26e5f7e8e05563d4864694be9523c52e5aa19c5982ae` | `#Typed composition map`, `#Ownership matrix`, `#Candidate interfaces`, `#Negative witnesses`, `#Failure and revocation routing`, `#Required non-collapse rules` | `spawn-0003` | CAV2 composition and live-source observations `OBSERVED`; candidate contracts/witnesses `UNVERIFIED` |
| EV-07 | DOI `10.1109/SP.2017.41`; Carlini et al., USENIX Security 2023; W3C Bitstring Status List 1.0 REC 2025-05-15; W3C BBS Cryptosuites CRD 2026-04-07 | Membership inference; training-data extraction results; credential status; selective disclosure/unlinkability | Hewitt return `sha256:69efc…`, §§Threat controls, Source manifest | Security precedents `OBSERVED`; end-to-end mitigations `UNVERIFIED` |

## Corrected DOCX verdict

- **DOCX-01 — valuable core, retained.** Adaptive AI can influence attention and choices through mechanisms distinct from fixed literary texts. Profiling, scale, feedback, and personalization create genuine autonomy and privacy concerns. Preserve this as normative intent and a testable thesis. Evidence: EV-01, EV-02.

- **DOCX-02 — causal and health claims, rejected.** “Belief installation,” dopamine rewiring, reliable burnout prediction, inner-state detection, and monitoring-produced well-being exceed the inspected evidence. Risk estimates are not diagnosis; context-sensitive signals are not emotional truth. Evidence: EV-02.

- **DOCX-03 — technical and legal claims, narrowed.** Identifiers, credentials, content addresses, signatures, and receipts can prove bounded technical relations. They do not establish truth, authorization, legal authorship, ownership, persistence, payment, or CAV2 authority. Evidence: EV-03, EV-04.

Human prompts principally supply questions and normative intent. Most detailed medical, biological, legal, and implementation claims are assistant-generated continuations. Neither provenance category establishes truth.

## Plain-language model

**Agent identity** answers: “Which contextual agent instance is making this request, using which authenticator, operator, runtime, session, audience, and validity window?” It supports provenance and authentication. It does not say what the agent may do.

**Sovereign data** means operational control over custody and use: where data is held and processed; who may access, derive, export, correct, or delete it; for what purpose; for how long; with what revocation and remedy. Local storage or a DID alone does not create sovereignty.

**Agency** requires more than identity or custody. It requires understandable choices, purpose binding, refusal without retaliation, correction, revocation, appeal, accountable decision-makers, and the practical ability to exercise those rights.

```text
authenticated(agent) ≠ authorized(agent, action, resource)
controlled(data) ≠ human agency
provenance or receipt ≠ truth, ownership, compliance, or authority
```

Meaningful choices remain human-owned: purpose, grant scope, delegation, disclosure, revocation, appeal, and any CAV2 promotion decision. Evidence: EV-03, EV-04.

## Minimal compositional architecture

```text
human-controlled SubjectDataStore
  -> opaque SubjectDataRef
  -> AgentIdentityEnvelope/Attestation
  -> DataUseGrant/DelegationGrant
  -> PurposeBoundComputationRequest
  -> independent AuthorizationDecision
  -> mediated purpose-bound computation
  -> ComputationReceipt + DataUseReceipt
  -> DerivedClaimEnvelope
  -> CAV2 EvidenceCard/candidate
  -> ChallengeContract
  -> narrowest human OwnerDecision
```

Typed responsibilities:

- **ARCH-01 — `SubjectDataStore` / `SubjectDataRef`:** raw sensitive data stays in the human-controlled or explicitly delegated substrate. It exposes opaque, digest-bound references and correction/deletion handles. Custody and integrity do not prove truth. Evidence: EV-06; `UNVERIFIED` contract.

- **ARCH-02 — `AgentIdentityEnvelope` / `AgentIdentityAttestation`:** binds contextual agent, operator/principal, authentication, audience, runtime digest, validity, revocation, and recovery generation. It carries `authority_effect:none`. Evidence: EV-03, EV-05; standards `OBSERVED`, schema `UNVERIFIED`.

- **ARCH-03 — `DataUseGrant` / `DelegationGrant`:** binds grantor authority basis, grantee, exact resource/action/purpose/audience/environment, validity, retention, transformations, onward disclosure, delegation depth, and revocation. Subject, grantor, data controller, custodian, and owner may differ. Evidence: EV-04–EV-06; `UNVERIFIED`.

- **ARCH-04 — `PurposeBoundComputationRequest`:** binds identity, grant, data references, action, purpose, code/model/config digests, allowed output, and execution limits. The requester and runtime cannot self-authorize. Evidence: EV-06; `UNVERIFIED`.

- **ARCH-05 — `AuthorizationDecision`:** an independent evaluator checks identity binding, grant, resource, action, purpose, audience, environment, time, policy version, and revocation. Missing or ambiguous inputs deny. Evidence: EV-03, EV-04; composition `UNVERIFIED`.

- **ARCH-06 — runtime and receipts:** computation occurs in the owning substrate where feasible. Receipts record permit/deny, bindings, source/output digests, disclosures, cancellation, retention/deletion state, omissions, and replay posture. Receipts cannot prove absence of hidden processing, truth, erasure, or compliance. Evidence: EV-04–EV-06; `UNVERIFIED`.

- **ARCH-07 — CAV2 ingress:** CAV2 receives bounded claims, policy decisions, provenance, digests, receipts, lifecycle status, and residue—not raw biometric, emotional, memory, conversational, or surveillance streams. Evidence enters as candidate/challenge material with no automatic promotion. Evidence: EV-06; CAV2 boundary `OBSERVED`, integration `UNVERIFIED`.

## CAV2 ownership and non-collapse boundary

- **OWN-01 — identity:** CAV2 owns provenance, traceability, evidence ceilings, and separation from authority. Identity providers and runtime owners own identifiers, authentication, rotation, compromise, expiry, and recovery. A canonical agent-identity contract is missing. Evidence: EV-06.

- **OWN-02 — data:** CAV2 owns public/private and source/read-model boundaries plus candidate/owner routing. Subjects, controllers, and delegated custodians own custody, access, retention, correction, deletion, export, and enforcement. A canonical sovereign-data contract and jurisdiction-specific interpretation are missing. Evidence: EV-06.

- **OWN-03 — authorization:** CAV2 owns gates after evidence ingress. The resource/access-policy owner owns operational permission. Consent, identity, custody, and ownership must not collapse into authorization. Evidence: EV-03, EV-04, EV-06.

- **OWN-04 — evidence lifecycle:** Inventory is discovery, not authority. Ontology is projection, not verdict. Confidence is not promotion. Challenge is a route, not a decision. Only an admitted narrowest owner may promote an existing authority kind. New authority kinds default-deny. Evidence: EV-06.

## Witness suite

| Claim ID | Witness | Required result | Evidence and status |
|---|---|---|---|
| WIT-P1 | Synthetic birth date in a local subject-controlled store; one authenticated agent gets a one-use grant only for `derive:age-over-threshold`, one relying party, no raw export, training, enrichment, onward disclosure, or delegation. | Return only `age_over_18:true`; emit bounded receipts and a non-authoritative CAV2 candidate. Acceptance requires proof that neither relying party nor CAV2 received the birth date. | EV-05; `UNVERIFIED`, not executed |
| WIT-N1 | Valid identity, no grant. | Deny before data read; `grant_absent` receipt; no claim or CAV2 candidate. | EV-05; `UNVERIFIED` |
| WIT-N2 | Valid identity and broad consent, wrong purpose or audience. | Deny; never reinterpret consent as ambient permission. | EV-06; `UNVERIFIED` |
| WIT-R1 | Grant revoked before execution. | Deny with bounded revocation evidence; no read or output. | EV-06; `UNVERIFIED` |
| WIT-R2 | Grant revoked during execution. | Cancel, quarantine output, block candidate use until containment is evidenced. | EV-06; `UNVERIFIED` |
| WIT-N3 | Source digest/validity mismatch or deletion/unlearning failure. | Invalidate dependants or block onward use; preserve failure receipt; never claim erasure without evidence. | EV-05, EV-06; `UNVERIFIED` |

## Threat and safeguard matrix

| Claim ID | Threat | Minimum safeguard | Residual risk and evidence |
|---|---|---|---|
| THR-01 | Cross-context correlation | Pairwise identifiers, single-audience assertions, selective disclosure, no default equivalence links. | Metadata, issuer keys, timing, and revealed attributes may still link. EV-07; primitives `OBSERVED`, composition `UNVERIFIED`. |
| THR-02 | Recovery takeover or impersonation | Multiple authenticators, offline recovery, notifications, rotation, proof-of-possession/mTLS, short validity. | Recovery and an already-compromised authorized runtime remain risks. EV-03, EV-05; `OBSERVED` basis, control suite `UNVERIFIED`. |
| THR-03 | Confused deputy and over-delegation | Bind client, principal, resource, action, purpose, audience, environment, parent grant, and maximum depth; prohibit wildcards. | Domain policy must prove child rights are narrower. EV-04, EV-05; `UNVERIFIED` integration. |
| THR-04 | Revocation race and cached use | Online checks for sensitive use, short grants, cancellation/quarantine, policy versioning, cache invalidation. | Completed processing and undiscovered copies may persist. EV-06, EV-07; `UNVERIFIED` end-to-end. |
| THR-05 | Inference or model retention | Local derivation, abstract predicates, anti-join rules, privacy budgets, lineage, separate training/retrieval/prompt governance. | Outputs and model behavior may still disclose source facts. EV-07; attacks `OBSERVED`, safeguards `UNVERIFIED`. |
| THR-06 | Receipt laundering | Bind grant, policy, input/output, decision, issuer, and optional transparency inclusion; quarantine gaps/forks. | Receipts attest issuer statements, not hidden-use absence, truth, or compliance. EV-04, EV-05; ceiling `OBSERVED`. |
| THR-07 | Coercive monitoring | No employment/pay/team consequences; non-biometric alternative; specific revocable opt-in; worker/union governance and appeal. | Workplace power imbalance can defeat nominal consent. EV-02; risk `OBSERVED`. |
| THR-08 | Erasure versus append-only audit | Retain only privacy-safe transition facts; require explicit privacy/legal decision. | Digests and metadata may remain personal or linkable. EV-06; resolution `UNVERIFIED`. |

## Five-column candidate verdict matrix

| Candidate / Claim ID | Verdict | Canonical/built boundary | Owner and non-collapse | Evidence/status |
|---|---|---|---|---|
| `SubjectDataStore` / `SubjectDataRef` — CAN-01 | Keep external. | Candidate contract; not built. | Human/controller/custodian owns raw data; CAV2 receives refs and claims only. | EV-06; `UNVERIFIED` |
| Identity Envelope/Attestation — CAN-02 | Build from owned standards; reconcile names first. | Not canonical or built. | Identity owner; provenance/authentication only. | EV-03, EV-05, EV-06; design `UNVERIFIED` |
| DataUse/Delegation Grant — CAN-03 | Build from authorization, policy, and consent-record precedents. | Not canonical or built; legal semantics unresolved. | Grant/resource-policy owner; consent and identity are not authorization. | EV-04–EV-06; `UNVERIFIED` |
| PurposeBoundComputationRequest — CAN-04 | Retain as minimal binding object. | Not canonical; runtime absent. | Policy/runtime owners; request cannot self-authorize. | EV-06; `UNVERIFIED` |
| AuthorizationDecision — CAN-05 | Required separate type. | Synthesized candidate; no evaluator or conformance witness. | Access-policy owner; authentication never entails permit. | EV-03, EV-04; basis `OBSERVED`, composition `UNVERIFIED` |
| DataUse/Computation Receipt — CAN-06 | Keep distinct profiles or tagged family pending owner decision. | Not canonical or built. | Evidence producer; receipt is not truth, erasure, or compliance. | EV-04–EV-06; `UNVERIFIED` |
| DerivedClaimEnvelope — CAN-07 | Retain as privacy-safe ingress candidate. | Not canonical, built, or admitted. | Source owners retain authority; claim carries expiry, omissions, residue, and challenge. | EV-06; `UNVERIFIED` |
| InventoryEvidence — CAN-08 | Reuse discovery pattern. | Pattern observed; target-local machine index missing. | Lookup only; no promotion. | EV-06; `OBSERVED` with snapshot gap |
| OntologyCandidate/View — CAN-09 | Reuse candidate projection; do not invent live relations yet. | Identity/delegation relations unadmitted. | Ontology cannot authorize, promote, or decide truth. | EV-06; pattern `OBSERVED`, integration `UNVERIFIED` |
| ChallengeContract — CAN-10 | Reuse contradiction/residue route. | No task-specific instance executed. | Challenge is not verdict. | EV-06; pattern `OBSERVED`, instance `UNVERIFIED` |
| OwnerDecision — CAN-11 | Required terminal governance gate. | No owner decision made. | Narrowest accountable human owner decides; new kinds default-deny. | EV-06; lifecycle `OBSERVED`, decision `UNVERIFIED` |

## Exact gaps and disagreements

1. Hewitt’s richer `AgentIdentityEnvelope` and Wiener’s narrower `AgentIdentityAttestation` are compatible but not proven identical; canonical naming and projection boundaries need an owner decision.
2. `DataUseGrant` versus `DelegationGrant`, and `DataUseReceipt` versus `ComputationReceipt`, have unresolved granularity.
3. No canonical agent-identity contract, sovereign-data contract, independent authorization relation, runtime mediation contract, privacy-safe receipt schema, or revocation-propagation contract exists.
4. No positive, negative, correction, deletion, mutation, or revocation witness was executed.
5. Erasure versus append-only audit remains unresolved.
6. Wiener provided underlying CAV2 paths and anchors but no Git commit or per-file hashes. The return is immutable; its underlying mutable source snapshot is not independently reproducible from the return alone.
7. One scientific-authority Inventory entry had stale line ranges; named anchors remained present. Inventory remains non-authority.
8. The Lean permission kernel was inspected, not rebuilt or executed.
9. No legal classification, ontology admission, implementation, publication, deployment, production-readiness, or promotion decision is supported.

The smallest defensible contribution is the typed composition, denial/revocation semantics, privacy boundary, and witness plan—not a new universal identity standard or a claim of sovereign agency.

---

`action_id=spawn-0004`  
`role_id=synthesizer-simon`  
`status=complete`  
`validation=PASS_WITH_RESIDUE — compact synthesis reconciles all three explorer returns; preserves disagreements; does not promote Inventory seeds; evidence ceilings and unverified interfaces are explicit`  
`blockers=immutable underlying CAV2 snapshot absent; canonical contracts and owner decisions absent; no implementation, conformance, legal determination, or executed witness`  
`artifact_inputs=research.md sha256:f776c297d700e03b0d05c23eeb0d3773a2a6a289cf19f187592522faab94f090; explorer-kahneman.md sha256:684b6ec2168e811f9e2ad38f602c00c164e0bcdfa699cc0ab72c3a72dc81c4bf; explorer-hewitt.md sha256:69efc77b96051629e8165f0e0a6027a92dc163250e43753f03e71417d44559a5; explorer-wiener.md sha256:c87e5a77a333c556e28c26e5f7e8e05563d4864694be9523c52e5aa19c5982ae`
