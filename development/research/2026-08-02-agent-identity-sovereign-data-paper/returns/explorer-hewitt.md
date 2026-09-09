# Explorer report — Hewitt, Carl

## Evidence status

- **Observed:** assigned dispatch object, strategy Inventory packet, and the primary/peer-reviewed sources in the manifest, checked 2026-08-03.
- **Executed:** source status/version checks and immutable Git HEAD resolution for SPIFFE and the IDSA Dataspace Protocol.
- **Unverified design:** candidate interfaces and witnesses below. No implementation, conformance suite, legal determination, or integration witness was executed.
- **Mutation:** none.

## Main finding

No current standard provides a complete “agent identity plus sovereign data” contract. The defensible architecture composes separately owned layers:

```text
identifier
  -> credential/key
  -> authentication
  -> independent access-policy decision
  -> bounded data-use grant
  -> enforcement in the owning data substrate
  -> derived claim + provenance + receipt
  -> CAV2 candidate/challenge/owner-decision lifecycle
```

A valid identifier or credential supports provenance and authentication. It does not itself establish authorization, claim truth, legal consent, semantic conformance, or CyberAlchemy authority.

W3C Controlled Identifiers explicitly separates authentication from authorization [S03, §2.1.2]. VC Data Model 2.0 states that verification does not establish claim truth or fitness for reliance [S04, §§1.1, 2, 5.9]. SPIFFE identifies workloads while leaving identity meaning and authorization policy to operators [S09, §§2, 4.1].

> **Agent identity must remain provenance and authentication input unless a separate access policy authorizes the requested action. Raw sensitive data must remain in its owning substrate.**

A found standards owner is **build-from-owned**, not novelty failure. The candidate contribution is the typed composition, failure semantics, receipts, and CAV2 integration boundary—not redefinition of DID, VC, OAuth/GNAP, SPIFFE, ODRL, PROV, consent records, or transparency receipts.

## Required type distinctions

| Type | Meaning | Must not collapse into |
|---|---|---|
| Identifier | Contextual name or URI for an entity/workload | Key, account, legal identity, permission |
| Identity controller | Entity able to update an identifier document or verification bindings | DID subject, data controller, authorized user |
| Key/authenticator | Proof material bound through a ceremony | Agent, persona, credential, permission |
| Credential/assertion | Issuer-authored claims plus integrity/authenticity mechanism | Truth, consent, current authorization |
| Authentication | Evidence a claimant controls a bound authenticator | Authorization |
| Authorization | Policy decision permitting an action on a resource | Identity recognition |
| Delegated capability/grant | Attenuated authority for bounded actions | Ownership, general agency, unlimited delegation |
| Persona | Deliberately presented interaction identity | Cryptographic or legal identity |
| Profile | Mutable preferences/descriptive projection | Authentication record or access policy |
| Memory | Source records, summaries, embeddings, or recall state | Identity, consent, provenance, authority |
| Data subject/PII principal | Natural person to whom personal data relates | Necessarily holder, grantor, custodian, controller |
| Data controller | Party determining purposes and means under applicable law | DID controller or storage operator |
| Custodian | Operational substrate controlling storage/enforcement | Necessarily owner, subject, or legal controller |
| Provenance | Relations among entities, activities, agents, sources, derivations | Truth or permission |
| Authority | Owner-admitted right to decide, govern, or promote in CAV2 | Identifier, signature, receipt, test result |

Schemas should use `identity_controller`, `data_controller`, and `custodian`; a bare `controller` is ambiguous.

## Standards and precedent owners

| Owner | Supported primitive | Evidence ceiling |
|---|---|---|
| W3C DID Core 1.0; DID 1.1 CR [S01–S02] | Identifier syntax, subject/controller distinction, verification methods, update/deactivation and recovery concepts | DID methods own operational semantics. A DID is not authorization, legal identity, or custody. DID 1.1 remains a Candidate Recommendation. |
| W3C Controlled Identifiers 1.0 [S03] | Controller documents and purpose-specific verification relationships | Capability relationships do not supply resource policy, consent, or enforcement. |
| W3C VC Data Model 2.0 [S04] | Issuer/holder/subject/verifier roles, credentials, presentations, status hooks | Verification proves authenticity/current status, not truth. It does not establish presentation authority. |
| W3C Bitstring Status List 1.0 [S05] | Credential revocation/suspension/status | Revocation does not retract disclosures, erase derivatives, or revoke independent tokens. |
| W3C BBS Cryptosuites CR Draft [S06] | Selective disclosure and unlinkable derived proofs | Not yet a Recommendation; metadata, revealed attributes and network behavior can still correlate. |
| NIST SP 800-63B-4/C-4 [S07–S08] | Authentication assurance, recovery, federation, audience restriction, subscriber-controlled wallets | Human subscriber guidance, not a universal agent/data contract. Recovery is an attack surface. |
| SPIFFE [S09] | Workload IDs, SVIDs, trust domains, Workload API | Strong software-runtime identity; human identity and authorization policy remain external. |
| GNAP/OAuth RAR/Resource Indicators/DPoP/BCP [S10–S14] | Delegation negotiation, rich rights, resource/audience restriction, sender-constrained tokens, revocation | Consent and policy meaning are application-specific; arbitrary rights lack a universal attenuation comparison. |
| Macaroons [S22] | Peer-reviewed contextual caveats and attenuating delegation | Research precedent, not IETF/W3C standard; bearer handling and root compromise remain risks. |
| Solid Protocol 0.11 [S15] | Permissioned access to externally stored data | Community Group Draft, not W3C Standard; storage location does not prove sovereignty. |
| IDSA Dataspace Protocol [S16] | Catalog, contract negotiation, transfer state machines | Active draft; contract negotiation is not natural-person consent or post-transfer enforcement. |
| W3C ODRL 2.2 [S17] | Permissions, prohibitions, duties, constraints, parties/assets/actions | Policy expression is not enforcement, legal validity, or proof of duty performance. |
| ISO/IEC TS 27560:2023 [S18] | Consent records and receipts | Under revision; a record does not prove consent was freely given or processing complied. |
| GDPR [S19] | Primary legal precedent for controller, purpose limitation, minimization, withdrawal, erasure | Jurisdiction-specific; consent is only one lawful basis, withdrawal is not retroactive, erasure has exceptions. |
| W3C PROV-O [S20] | Entity/activity/agent, use, generation, derivation, attribution, delegation | Provenance describes relations but does not prove truth, permission, or compliance. |
| IETF SCITT RFC 9943 [S21] | Signed statements, append-only transparency, inclusion receipts, non-equivocation | Receipt proves statement registration/inclusion; an issuer can still make a false statement. |

## Candidate agent identity interface

**Status: unverified design.** Permission-poor and provenance-rich.

```text
AgentIdentityEnvelope {
  version
  envelope_id
  agent_instance_id              // pairwise/context-bound
  subject_kind                   // software-agent
  identity_controller_ref
  operator_ref
  principal_ref?                 // human/org on whose behalf it may request
  context {
    trust_domain
    audience
    environment
  }
  authentication {
    method                       // SPIFFE SVID, DID proof, other profile
    verification_method_ref
    credential_ref
    issued_at
    expires_at
    assurance_profile
    status_ref
  }
  runtime {
    software_artifact_digest
    build_provenance_ref
    runtime_attestation_ref?
  }
  controller_chain[] {
    actor_ref
    relationship                 // operates, actsOnBehalfOf
    evidence_ref
  }
  recovery {
    policy_ref
    generation
    previous_keys_invalidated
  }
  proof
}
```

Required exclusions:

- raw personal, emotional, biometric, profile, memory, prompt, or conversation data;
- access rights, wildcard roles, or ambient authority;
- claims that the agent is human, conscious, truthful, conformant, approved, or authoritative;
- global identifiers where pairwise identifiers suffice;
- `alsoKnownAs` links by default;
- persona/profile fields except separately referenced, revocable projections.

## Candidate data-use grant

**Status: unverified design.** The grantor role is explicit because subject, legal controller, custodian, and owner may differ.

```text
DataUseGrant {
  version
  grant_id
  grantor {
    party_ref
    role                         // subject, authorized-party, controller, custodian
    authority_basis_ref
  }
  data_subject_refs[]
  data_controller_ref
  custodian_ref
  grantee_agent_envelope_hash
  resource_refs[]                // opaque handles
  actions[]
  purpose {
    governed_term
    human_explanation
  }
  lawful_basis_ref
  audiences[]
  execution_locations[]
  allowed_transformations[]
  derived_data {
    allowed_classes[]
    onward_disclosure
    training_use
    profile_enrichment
  }
  validity {
    not_before
    expires_at
    max_uses
  }
  delegation {
    allowed
    max_depth
    parent_grant_hash?
  }
  retention {
    raw_data
    derived_output_delete_by
    receipt_profile
  }
  revocation {
    status_ref
    check_mode
  }
  policy {
    profile
    policy_hash
    conflict_mode                // deny
  }
  proof
}
```

Fail closed if purpose, audience, action, resource, client binding, status, time, location, or policy version cannot be evaluated. Natural-language purpose alone is insufficient.

## Candidate data-use receipt

**Status: unverified design.** Use handles/digests, not raw sensitive values.

```text
DataUseReceipt {
  version
  receipt_id
  event_id
  request_id
  grant_id
  grant_hash
  agent_envelope_hash
  decision {
    effect                       // permit, deny
    reason_code
    policy_hash
    evaluated_at
    revocation_status
  }
  activity {
    action
    purpose_id
    started_at
    ended_at
    execution_location_claim
    attestation_ref?
  }
  inputs[] {
    resource_handle
    content_digest?
    classification
  }
  outputs[] {
    artifact_handle
    content_digest
    classification
    was_derived_from[]
  }
  disclosures[] {
    audience
    artifact_handle
  }
  retention_and_deletion {
    delete_by
    state                        // not-due, pending, completed, failed
    evidence_ref?
  }
  previous_receipt_hash?
  issuer_proof
  transparency_receipt_ref?
}
```

A receipt can support provenance, auditability and non-equivocation. It cannot prove no hidden processing occurred, the statement is true, legal compliance, successful erasure/unlearning, semantic correctness, or CAV2 promotion fitness.

## Threat controls

| Threat | Minimum control | Residual risk |
|---|---|---|
| Correlation/cross-context collapse | Pairwise identifiers, no default equivalence links, single-audience assertions, selective disclosure | Attributes, issuer keys, status, timing and metadata can still link |
| Key loss/recovery takeover | Multiple authenticators, offline recovery, notifications, rotation, prior-key invalidation | Recovery can preserve or grant attacker control |
| Impersonation | Phishing/replay resistance, proof-of-possession or mTLS, short validity | Compromised authorized runtime can appear legitimate |
| Confused deputy | Bind client, principal, resource, audience, action and purpose | Ambient or ambiguous “on behalf of” remains dangerous |
| Over-delegation | Attenuation, one-hop default, `max_depth`, no wildcards, parent hash | Domain policy must determine whether child rights are truly narrower |
| Consent withdrawal | Separate lifecycle; deny future use; enqueue deletion duties | Does not undo past lawful processing or prove erasure |
| Inference/aggregation | Abstract predicates, local derivation, anti-join rules, privacy budgets | Disclosed values and model behavior can still reveal sensitive facts |
| Model retention | Distinguish training/fine-tuning/retrieval/prompting/inference; lineage; unlearning state | Source deletion does not prove influence is absent from model |
| Revocation race | Online check for sensitive use, short-lived grants, event-time policy version | Completed processing and cached data persist |
| Receipt misuse | Sign and bind grant/policy/input/output/decision; optionally log hashes | Receipts attest issuer statements, not absence of unlogged actions |
| Custody breach | Raw data stays in owning substrate; capability-limited interface | “Local” does not prove trustworthy code or sole control |

Peer-reviewed membership-inference [S23] and training-data-extraction [S24] results justify treating derived artifacts and models as governed data, not disposable outputs.

## Failure and recovery states

- `identity_unresolved`, `authentication_failed`, `credential_expired_or_revoked`: deny; recover trust or reissue only through approved recovery; increment envelope generation and invalidate prior keys.
- `recovery_pending`: deny high-risk use and notify the subject/operator.
- `grant_absent`, `grant_ambiguous_or_overbroad`, `purpose_or_audience_mismatch`: deny; require a new explicit, narrower grant.
- `consent_withdrawn`: deny future use and enqueue retention/deletion obligations; do not silently substitute another lawful basis.
- `revocation_status_unknown`: deny sensitive operations.
- `custodian_unavailable`: do not export to a fallback substrate.
- `derived_lineage_missing`: quarantine output; recompute with complete provenance or discard.
- `deletion_pending`: block onward use. If deletion/model unlearning fails, preserve the failure receipt and do not claim erasure.
- `receipt_gap_or_log_fork`: quarantine dependent claims pending consistency evidence.
- `policy_conflict`: deny until explicit owner resolution creates a new policy version.
- `cross_context_linkage_detected`: stop identifier reuse, rotate pairwise identity, and sever optional equivalence links.

## Smallest witnesses

### Positive witness

**Unverified; not executed.**

A subject-controlled local store contains a synthetic birth date. An authenticated agent receives a one-use grant permitting only `derive:age-over-threshold` for one relying party, executed locally, with no raw export, training, profile enrichment, onward disclosure, or delegation.

Expected trace:

1. authenticate the exact agent instance;
2. validate the separate grant, audience, purpose, action, time and status;
3. derive locally;
4. return only `age_over_18: true`;
5. issue a signed receipt with handles/digests and lineage;
6. send CAV2 only the bounded claim and evidence references;
7. produce no authority or promotion effect.

Acceptance requires proof that neither the relying party nor CAV2 receives the birth date.

### Negative witness

**Unverified; not executed.**

Use the same valid agent identity but omit the grant or present a revoked grant.

Expected result:

- authorization denial;
- no raw resource read;
- no derived claim;
- denial receipt with `grant_absent` or `grant_revoked`;
- no CAV2 candidate.

This proves the intended non-vacuity condition:

```text
authenticated(agent) AND identifies(agent, envelope)
DOES NOT ENTAIL
authorized(agent, action, resource)
```

## Non-goals

- Universal/global agent identity.
- Proof of personhood, consciousness, benevolence, agency, or “human spirit.”
- Treating persona, profile, memory, embeddings, or conversation history as identity.
- Making CAV2 a personal-data store, wallet, identity provider, or consent authority.
- Importing raw personal, biometric, emotional, memory, or surveillance streams into CAV2.
- Declaring cross-jurisdiction legal compliance.
- Treating consent as the only lawful basis.
- Guaranteeing unlinkability, anonymity, erasure, or model unlearning from signatures or receipts.
- Treating credentials, policy documents, receipts, test passes, or implementations as truth or authority.
- Selecting production identity, wallet, authorization, data-space, or transparency technology before a bounded witness.
- Promoting definitions, ontology relations, constitutions, implementations, releases, deployments, or production-readiness claims from this research.

## CAV2 boundary

CAV2 may receive:

- contextual agent-envelope digest;
- grant and policy identity;
- permit/deny receipt;
- bounded derived claim or artifact digest;
- provenance/source references;
- explicit lifecycle status and evidence ceiling.

CAV2 must not receive:

- raw sensitive data;
- mutable personal memory;
- ambient access tokens;
- inferred authority edges.

The result enters CAV2 only as a candidate or challenge routed to an owner decision. Authentication success, receipt validity, narrative repetition, or implementation success cannot promote meaning or authority automatically.

## Source manifest — 26 sources

- **L01:** `dispatch-sheet.json#groups[0].agents[1]`.
- **L02:** `strategy-inventory-packet.json`, especially `design_consequences`, `unresolved_gaps`, `non_authority_notice`.
- **S01:** [W3C DID Core 1.0, 2022-07-19](https://www.w3.org/TR/2022/REC-did-core-20220719/).
- **S02:** [W3C DID 1.1 Candidate Recommendation, 2026-03-05](https://www.w3.org/TR/2026/CR-did-1.1-20260305/).
- **S03:** [W3C Controlled Identifiers 1.0, 2025-05-15](https://www.w3.org/TR/2025/REC-cid-1.0-20250515/).
- **S04:** [W3C VC Data Model 2.0, 2025-05-15](https://www.w3.org/TR/2025/REC-vc-data-model-2.0-20250515/).
- **S05:** [W3C Bitstring Status List 1.0, 2025-05-15](https://www.w3.org/TR/2025/REC-vc-bitstring-status-list-20250515/).
- **S06:** [W3C Data Integrity BBS Cryptosuites CR Draft, 2026-04-07](https://www.w3.org/TR/2026/CRD-vc-di-bbs-20260407/).
- **S07:** [NIST SP 800-63B-4](https://doi.org/10.6028/NIST.SP.800-63b-4).
- **S08:** [NIST SP 800-63C-4](https://doi.org/10.6028/NIST.SP.800-63c-4).
- **S09:** [SPIFFE specifications at commit `dc4e9d9b4eff8aa181a54cd330ff9f877186060e`](https://github.com/spiffe/spiffe/tree/dc4e9d9b4eff8aa181a54cd330ff9f877186060e/standards).
- **S10:** [RFC 9635, GNAP](https://www.rfc-editor.org/rfc/rfc9635.html).
- **S11:** [RFC 9396, OAuth Rich Authorization Requests](https://www.rfc-editor.org/rfc/rfc9396.html).
- **S12:** [RFC 8707, Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707.html).
- **S13:** [RFC 9449, OAuth DPoP](https://www.rfc-editor.org/rfc/rfc9449.html).
- **S14:** [RFC 9700, OAuth Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html).
- **S15:** [Solid Protocol 0.11.0, 2024-05-12](https://solidproject.org/TR/2024/protocol-20240512).
- **S16:** [IDSA Dataspace Protocol repository at commit `a4ec2aeb34dd9b7fc871d10d0b4e5c9826286e94`](https://github.com/International-Data-Spaces-Association/ids-specification/tree/a4ec2aeb34dd9b7fc871d10d0b4e5c9826286e94).
- **S17:** [W3C ODRL Information Model 2.2](https://www.w3.org/TR/2018/REC-odrl-model-20180215/).
- **S18:** [ISO/IEC TS 27560:2023](https://www.iso.org/standard/80392.html).
- **S19:** [Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng).
- **S20:** [W3C PROV-O](https://www.w3.org/TR/2013/REC-prov-o-20130430/).
- **S21:** [RFC 9943, SCITT Architecture](https://www.rfc-editor.org/rfc/rfc9943.html).
- **S22:** Birgisson et al., [“Macaroons,” NDSS 2014](https://research.google/pubs/macaroons-cookies-with-contextual-caveats-for-decentralized-authorization-in-the-cloud/).
- **S23:** Shokri et al., [“Membership Inference Attacks Against Machine Learning Models,” IEEE S&P 2017](https://doi.org/10.1109/SP.2017.41).
- **S24:** Carlini et al., [“Extracting Training Data from Diffusion Models,” USENIX Security 2023](https://www.usenix.org/conference/usenixsecurity23/presentation/carlini).

---

`action_id=spawn-0002`  
`role_id=explorer-hewitt`  
`status=complete`  
`validation=canonical compact report; read-only; assigned prompt completed; official source status/version checks performed; immutable SPIFFE and IDSA commits resolved; no integration witness executed`  
`blockers=none for research report; implementation, conformance, legal classification, and witnesses remain explicitly unverified`  
`source_manifest_count=26`
