## Definitional-soundness verdict

`BLOCK_PENDING_REPAIR`. The synthesis preserves several important distinctions, but its linear architecture collapses roles, treats duplicate names as coequal types, and imports CAV2-owned lifecycle fields into externally produced envelopes.

### Term-boundary table

| Terms | Independent identity/consequence test | Verdict |
|---|---|---|
| natural person / data subject | The same person can be a data subject for dataset A but not B; data-subject rights attach to the data relation, not personhood generally. | Keep distinct. |
| data subject / agent instance | One agent can process many subjects; one subject can be processed by many agents. Substitution changes privacy obligations versus runtime provenance. | Keep distinct. |
| agent instance / persona / workload identity | A runtime may change persona without changing authentication; credentials may rotate without changing the runtime; one persona may span several runtimes. | Keep all three distinct. |
| controller | Changing the identity controller changes identifier administration; changing the data controller changes purposes/means. Neither necessarily changes custody. | Ban bare `controller`; require `identity_controller`, `data_controller`, or `custodian`. |
| credential / authentication | A valid credential may be presented by the wrong claimant; authentication may use an authenticator that is not a credential. | Keep distinct. |
| authentication / authorization | The negative witness authenticates the same agent yet denies access when the grant is absent/revoked. | Keep distinct; this is the strongest surviving boundary. |
| delegated capability / authorization | A delegation is an input to a policy decision; a valid delegation may still be denied for audience, environment, purpose, time, or revocation. | Keep distinct. |
| consent / authorization | Consent can exist while a request is denied; authorization can rest on another declared basis. | Keep distinct. |
| purpose limitation / authorization | Purpose limitation constrains processing; it does not itself permit processing. | Keep distinct. |
| custody / data subject / data controller | Migrating storage changes custodian without necessarily changing subject or controller. | Keep distinct. |
| memory / derived data | Memory is a functional class spanning source records, summaries, embeddings, or recall state; derived data is produced by transformation. Either may exist without the other. | Keep distinct; never make memory identity. |
| derived data / provenance | Identical outputs can have different derivation histories; identical transformation shapes can produce different outputs. | Keep distinct. |
| provenance / evidence | Provenance states origin and transformation; it can accurately trace a false or unusable claim. Evidence is support evaluated for a claim. | Keep distinct; current CAV2-D35 explicitly says provenance is not proof. |
| evidence / confidence | Evidence is a support object or authority posture; confidence is one lifecycle-axis value. More confidence creates no evidence. | Keep distinct; confidence belongs on the CAV2 candidate posture, not the runtime receipt. |
| ontology candidate / owner decision | Modeling a candidate changes no authority; an admitted owner verdict may change lifecycle state. | Keep distinct. |
| owner decision / authority | A decision is an owned artifact/verdict; authority is the scoped right or responsibility that lets an effect count. A candidate decision record is not automatically a human decision. | Keep distinct. |
| authorization / authority | Authorization permits an operational action on a resource. CAV2 authority determines what may count within a governance scope. | Keep distinct. |

### Envelope and relation identity tests

| Proposed object | Consequence test | Verdict |
|---|---|---|
| `SubjectDataStore` / `SubjectDataRef` | A store’s custodian can change without changing any data subject. The names falsely bind custody to subjecthood. | Rename to `DataCustodyStore` and `DataResourceRef`; represent `relates_to_data_subject` separately. |
| `AgentIdentityEnvelope` / `AgentIdentityAttestation` | The draft specifies no behavior that distinguishes them. | Kill the synonym pair. Keep an envelope only if an attestation is defined as one issuer-signed, independently expiring/revocable evidence member inside it. |
| `DataUseGrant` / `DelegationGrant` | A direct grant has no parent or attenuation proof; a delegated grant must. | Keep `DataUseGrant`; permit `DelegationGrant` only as a strict subtype with parent reference, depth, and provable attenuation. Otherwise kill the alias. |
| `PurposeBoundComputationRequest` | Same identity and grant can support multiple requests whose action, purpose, output, or limits produce different decisions. | Survives. |
| `AuthorizationDecision` | The same request can produce permit or deny under different policy/revocation state, changing whether any read may occur. | Survives as an independently owned record. |
| `DataUseReceipt` / `ComputationReceipt` | Existing schemas overlap in decision, activity, inputs, outputs, and policy observations; the draft gives no independent identity rule. | Kill coequal receipt types. Preserve the `AuthorizationDecision` record and one `ComputationReceipt` for an attempted execution. |
| `DerivedClaimEnvelope` | Its confidence, challenge contract, residue, and owner route duplicate the current CAV2 candidate-node contract. | Kill as a CAV2 concept. Replace with an external `DerivedClaimSubmission` carrying only claim, source/transformation refs, receipt refs, expiry, and omissions. |
| `InventoryEvidence` | Already appears as current candidate ontology concept/read-model evidence. | Reference its real Inventory owner; do not redefine or claim it is canonical. |
| `OntologyCandidate/View` | Candidate status and projection/view state have different owners and effects. | Split into ontology candidate and authorized ontology projection; kill the slash-name. |
| `ChallengeContract` | Current CAV2-D40 already defines it and explicitly excludes confidence/verdict. | Reuse exactly; no new candidate definition. |
| `OwnerDecision` | Current model uses the Decision authority kind and a PromotionRecord-compatible record; `concept.decision` is not a human decision by itself. | Kill as a new type; reference the owner-routed Decision/verdict record. |

Every unlabeled arrow in the proposed architecture fails the current relation contract because it does not declare endpoints, owner, evidence, effect, or forbidden collapse. Replace the pipeline with:

```text
PurposeBoundComputationRequest
  references AgentIdentityEnvelope, DataUseGrant, DataResourceRef
AuthorizationDecision
  evaluates request under policy and revocation state
permit
  enables one mediated computation attempt
ComputationReceipt
  observes that attempt
DerivedClaimSubmission
  references output, provenance, and receipt
CAV2 Evidence
  may support an ontology candidate
ontology candidate
  requests an owner gate
owner-routed Decision
  records the verdict
authorized projection
  may reflect that verdict
```

No edge is automatic.

### Collapse findings and exact repairs

1. Replace “meaningful choices remain human-owned” with role-specific ownership. Natural persons/data subjects may own refusal, withdrawal, correction, and appeal where applicable; data controllers determine purposes/means; resource-policy owners define operational permission; CAV2 owner routes decide promotion.

2. Replace “Agency requires…” with “Human-autonomy safeguards require…”. Otherwise human agency is lexically collapsed with software-agent identity.

3. Do not reify “sovereign data” as a type or contract. Retain it only as an umbrella policy objective for custody, use, correction, revocation, export, and remedy.

4. Replace `SubjectDataStore` throughout. A subject is not necessarily the custodian, controller, grantor, or store owner.

5. Move `evidence_confidence`, `commitment_confidence`, `challenge_contract`, `residue`, and `owner_route` out of the externally produced derived-claim payload. Those are CAV2-owned candidate/lifecycle assignments.

6. Replace bare `grantor authority basis` with explicit `grantor_role`, `basis_ref`, and optional `consent_record_ref`; CAV2 authority must not be confused with operational grant-issuing competence.

7. Remove `DataUseReceipt` from the coequal receipt pair unless a separate event-family identity rule is supplied. A deny produces an `AuthorizationDecision`; an actual attempt produces a `ComputationReceipt`.

8. Replace “narrowest accountable human owner” with “narrowest admitted owner route, with accountable human review where required.” Current CAV2 authority does not define every owner as a natural person.

### Surviving candidate prose

- `AgentIdentityEnvelope`: a context-bound aggregation of agent-instance, principal/operator, workload/runtime, audience, authentication-evidence, validity, and recovery references. It grants no permission or CAV2 authority. An attestation, if present, is independently issued and revocable evidence inside the envelope.

- `DataUseGrant`: a policy-evaluable authorization input binding grantor role and basis, grantee, resource, action, purpose, audience, environment, validity, retention, disclosure, and revocation. A delegated subtype additionally binds a parent grant and proves attenuation.

- `PurposeBoundComputationRequest`: one requested action binding identity, grant, resource references, purpose, code/model/configuration, allowed output, and execution limits. It cannot authorize itself.

- `AuthorizationDecision`: an access-policy owner’s permit/deny evaluation of the exact request under current policy, time, audience, environment, and revocation state.

- `ComputationReceipt`: bounded observations about one permitted computation attempt, including bindings, runtime/configuration digests, start/end/cancellation state, outputs, and omissions. It proves neither hidden-use absence, truth, compliance, nor erasure.

- `DerivedClaimSubmission`: an external ingress payload containing a scoped claim, source/transformation references, computation-receipt references, validity/expiry, and disclosed omissions. CAV2 independently decides whether and how it becomes evidence or candidate material.

`action_id=spawn-0007`  
`role_id=reviewer-quine`  
`status=complete`  
`validation=BLOCK_PENDING_REPAIR — all proposed envelopes and relations received independent consequence/identity tests; duplicate candidates killed; current CAV2 definitions and ontology contracts verified directly`  
`blockers=ambiguous human/owner role claims; unlabeled automatic-looking relation chain; duplicate slash-named interfaces; external DerivedClaimEnvelope improperly carries CAV2-owned lifecycle fields; no owner decision admitting identity/data contracts`  
`artifact_inputs=dispatch-sheet.json sha256:b97cca7d120e58b1f2b8add6bd4aae61b259d31d93e5c79bef70081388390a52; SYNTHESIS-DRAFT.md sha256:a4c19b4ecd7141cffda7fe574896bba751018ce4c0d36fc88ae093e03e58bc82; explorer-wiener.md sha256:c87e5a77a333c556e28c26e5f7e8e05563d4864694be9523c52e5aa19c5982ae; explorer-hewitt.md sha256:69efc77b96051629e8165f0e0a6027a92dc163250e43753f03e71417d44559a5; AUTHORITY-MODEL.md sha256:8e9d39eb39399cef051b71eb1d37daaad87c2409329151a077e01c5a772b3407; boundaries.md sha256:c84aa3d66fe82137a50c9e6a3059f5e5300b51dc638f5e48fa1c00311a5cdf63; DEFINITIONS.md sha256:b38cb3cd4cb03f3984091a6721af65da9df7fe4838f6a4a12a824b9763a7475c; ontology/README.md sha256:1ab0357cb5150dd817753a31996845d819921b9b3d3d826edbe15b59e7f73352; NODE-MODEL.md sha256:aca62f215147e1919e2affa91a5625c74e54e0d791c7d4e124f6d00db671a25a; RELATION-MODEL.md sha256:19b5614eed1032711dfa37f76605b87f3421ee707fc7c8b99fd909ddb1cb543f; LIFECYCLE-MODEL.md sha256:00636be3a4919b82ec3904d96de1084c7219d710eb9d29d9acd192e78d59b476`
