# Agent identity, data custody, human autonomy, and private CAV2

## Verdict in plain language

The DOCX is a conversational concept draft. It is not a peer-reviewed paper, a validated scientific or clinical framework, a legal instrument, or evidence of a working system. Its strongest idea is nevertheless useful after correction: an AI agent should be able to prove which contextual software instance is acting, while a separate, purpose-bound grant and a current authorization decision control whether that agent may use a specific data resource. A mediated runtime can then record a bounded computation receipt, and private CAV2 can inspect a privacy-limited claim submission as evidence without automatically granting it ontology status or authority. [EV-01, EV-03, EV-05, EV-08]

This composition protects human autonomy only if refusal, withdrawal, correction, deletion, appeal, non-retaliation, and accountable review remain real options. Identity does not create permission; consent does not create ambient authorization; a receipt does not prove truth or compliance; and CAV2 evidence does not promote itself. [EV-02, EV-03, EV-05, EV-07, EV-08]

The resulting proposal is a candidate architecture and witness plan. No witness ran. The non-vacuity execution gate therefore failed, even though the repaired positive and negative cases now specify different observable outcomes. [EV-07]

## Evidence register

The bracketed references in this document bind claims to the supplied explorer and reviewer returns and, through them, to the named primary sources. A source being observed does not make the proposed composition implemented or admitted.

| ID | Primary source identity or repository evidence | Explorer/reviewer return | What the evidence can support |
|---|---|---|---|
| EV-01 | DOCX `sha256:3153a4ced4a268294e9695e75618448f75737ac101a06534e31544ad8b7e8c54`; human prompts and generated expansions identified by OOXML paragraph selectors | Kahneman explorer return `sha256:684b6ec2168e811f9e2ad38f602c00c164e0bcdfa699cc0ab72c3a72dc81c4bf`, §§1, 3 | Artifact classification and authorship boundaries; content observed, not independently validated |
| EV-02 | DOI `10.1037/0022-3514.79.5.701`; DOI `10.1038/s41562-025-02194-6`; DOI `10.2196/50253`; DOI `10.1111/peps.12514`; Regulation (EU) 2024/1689, Recital 44 and Art. 5(1)(f) | Kahneman explorer return, §§2–6; Lakatos review `sha256:f6084fbe43e6cd15680c001e52024e995f941267a511a4062e3ed2086922fa89` | Limits on persuasion, burnout, monitoring, mental-state inference, and human-control claims; no causal or clinical reproduction |
| EV-03 | W3C Controlled Identifiers 1.0 REC 2025-05-15; W3C VC Data Model 2.0 REC 2025-05-15; SPIFFE commit `dc4e9d9b4eff8aa181a54cd330ff9f877186060e`; RFCs 9396, 9635, 8707, 9449, and 9700 | Hewitt explorer return `sha256:69efc77b96051629e8165f0e0a6027a92dc163250e43753f03e71417d44559a5`; Lakatos owner review | Identity, credential, authentication, authorization-detail, grant, audience, resource, proof-of-possession, and security distinctions; composition remains unverified |
| EV-04 | Solid Protocol 0.11; Dataspace Protocol 2024-1; ODRL 2.2; ISO/IEC TS 27560:2023; PROV-O; RFC 9943; 2026 AIP, AI-Agent Authorization, DAAP, Transaction Token, Agent Operation Authorization, authorization-receipt, and actor-receipt drafts | Lakatos review, owner matrix and exact repairs | Precedent and owner boundaries. Active drafts are volatile and non-authoritative, but defeat broad novelty claims |
| EV-05 | Private CAV2 owner snapshot at parent HEAD `ab46061bf14db23a01054c2fd3fafec60fb5eb2f`; `AUTHORITY-MODEL.md`, canonical definitions including CAV2-D35/D40/D49, and candidate `NODE-MODEL.md`, `RELATION-MODEL.md`, `LIFECYCLE-MODEL.md` | Quine review `sha256:3ae9bf3c4415a2553afc3ba1302e9a7d33a20c06d37cdf527a0ace2a96b669f1`; Lakatos review | Active authority, owner-route, evidence, ChallengeContract, and Decision semantics; proposed relations remain unadmitted and unexecuted |
| EV-06 | `AgentPermissionKernel.lean`, submodule commit `c087ed7278028b460ee231a6c1178210f599a54f`, lines 89–164 | Lakatos review, CAN-05 | A generic executable default-deny evaluator and soundness theorem exist. They were not rebuilt; task mapping, policy profile, integration, and conformance are absent |
| EV-07 | Fixed witness design, negative controls, falsifiers, and dispositions | Popper review `sha256:1bbc4941756469ad5677cc99c80b1bbd6890d0f95b01b7d1aaacf5b5633f1672` | Falsifiable differential design only. Zero controls executed; non-vacuity execution gate failed |
| EV-08 | Independent term, envelope, relation, and non-collapse tests against current CAV2 contracts | Quine review, term-boundary table and exact repairs | Duplicate types killed, role distinctions retained, and candidate prose repaired; no owner admission |

## Corrected thesis

Adaptive AI can add profiling, personalization, feedback, optimization, and scale to familiar forms of influence. A defensible response is not to claim that literature and AI are equivalent manipulation systems, that neurochemical mechanisms install beliefs, that biometrics expose inner truth, or that monitoring reliably predicts or eliminates burnout. It is to design bounded data use around comprehensible purpose, contextual agent authentication, explicit operational grants, current policy evaluation, observable execution, revocation, remedy, and an owner-gated evidence route. [EV-01, EV-02]

Agent identity and data custody can compose with private CAV2 as follows: external systems retain identity operations, custody, operational grants, runtime enforcement, and factual execution observations; a narrow adapter submits only a scoped derived claim with source, transformation, receipt, validity, and omission references; CAV2 independently decides whether that submission becomes Evidence, supports an ontology candidate, enters a challenge, receives an owner-routed verdict, or appears in an authorized projection. Every transition is conditional and separately owned. [EV-03, EV-05, EV-08]

The contribution that survives is narrow: a profile of owned primitives, explicit non-collapse rules, a private CAV2 ingress adapter, and a bounded witness suite. No broad universal identity, authorization, receipt, sovereignty, or novelty claim survives the precedent review. [EV-04]

## Terms that must not collapse

```text
credential != authentication != authorization
delegation != authorization
consent != authorization
custody != data subjecthood != data control
provenance != evidence != confidence
authorization != CAV2 authority
ontology candidate != owner-routed Decision != authorized projection
```

`AgentIdentityEnvelope` identifies and authenticates a contextual agent instance by binding agent, principal/operator, workload/runtime, audience, authentication evidence, validity, recovery, and revocation references. It grants no operational permission or CAV2 authority. An `AgentIdentityAttestation` is only one independently issued, expiring, and revocable evidence member inside that envelope. [EV-03, EV-08]

“Sovereign data” is retained only as an umbrella policy objective for custody, purpose limitation, access, export, correction, deletion, revocation, retention, and remedy. It is not a schema type, an ownership proof, a legal conclusion, or a synonym for local storage. [EV-04, EV-08]

## Explicit, non-automatic architecture and data flow

| Edge | Relation, owner, and evidence | Permitted effect | Forbidden inference |
|---|---|---|---|
| 1 | A request producer creates `PurposeBoundComputationRequest` referencing an `AgentIdentityEnvelope`, `DataUseGrant`, and opaque `DataResourceRef`, with exact bindings [EV-03, EV-08] | Supplies inputs for evaluation | A reference does not authenticate, authorize, or prove truth |
| 2 | The resource/access-policy owner issues `AuthorizationDecision` after evaluating the exact request under current identity/key, policy, time, audience, environment, source, use-count, and revocation state [EV-03, EV-06] | Records permit or deny | The generic Lean theorem does not prove this task mapping or integration |
| 3 | A permit enables one mediated computation attempt under runtime-policy ownership | Allows only the bound attempt | Permit does not establish correctness, legal compliance, or CAV2 authority |
| 4 | The runtime/evidence producer issues a `ComputationReceipt` for measured reads, outputs, disclosures, side effects, retention, cancellation, and omissions [EV-04, EV-08] | Records bounded observations | A receipt does not prove hidden-use absence, truth, erasure, or compliance |
| 5 | An external submitter creates `DerivedClaimSubmission` referencing output, provenance, and receipt | Opens a private ingress request | The submitter cannot assign CAV2 confidence, challenge, residue, owner route, or lifecycle status |
| 6 | A private CAV2 adapter may accept the submission as Evidence after validation [EV-05] | May create candidate-local evidence | No automatic ontology or authority effect |
| 7 | An ontology candidate owner may use Evidence to support a candidate | Records support for a candidate | Inventory and Evidence are not source authority; repetition is not a verdict |
| 8 | The candidate may request the existing CAV2-D40 `ChallengeContract` and an admitted owner gate [EV-05, EV-08] | Opens challenge and decision routing | The proposal does not redefine `ChallengeContract` |
| 9 | The narrowest admitted owner route records an existing Decision/verdict, with accountable human review where required [EV-05] | May pass, flag, block, defer, reject, or supersede | There is no new `OwnerDecision` type; an agent-authored record is not automatically human review |
| 10 | An authorized projection owner may reflect an admitted Decision | Updates a permitted read model | Candidate view is not authorized projection; there is no silent promotion |

Raw biometric, emotional, conversational, memory, health, and surveillance data stays in the externally owned `DataCustodyStore`. CAV2 receives only bounded references, policy decisions, receipts, provenance, and claim submissions. This is a proposed privacy boundary, not evidence that leakage controls work. [EV-02, EV-05, EV-07]

## Owners and non-collapse boundaries

| Role or owner | Owns | Does not thereby own or prove |
|---|---|---|
| Natural person / data subject | Refusal, withdrawal, correction, deletion, and appeal where applicable | Storage operation, authorization policy, or CAV2 promotion |
| `data_controller` | Purposes and means under the applicable regime | Identifier administration or physical custody |
| `custodian` | Storage and enforcement operations | Data subjecthood, lawful basis, or CAV2 authority |
| `identity_controller` | Identifier bindings, recovery, and rotation | Resource-use permission |
| Grantor role | Declared `basis_ref` and optional `consent_record_ref`; grant issuance within its competence | A CAV2 owner route or ambient permission |
| Resource/access-policy owner | Operational permit/deny rules for exact resource actions | Truth, compliance, or canonical admission |
| Runtime/evidence producer | Observations about a bounded attempt | Absence of hidden processing or undiscovered copies |
| External submitter | Scope and references in `DerivedClaimSubmission` | CAV2 confidence, challenge, lifecycle, or authority |
| Ontology candidate owner | Candidate modeling and supporting evidence | Owner verdict or authorized projection |
| Narrowest admitted CAV2 owner route | Governance Decision within its scope | Operational authorization outside that scope |
| Authorized projection owner | Permitted reflection of an admitted Decision | Retrospective proof that source processing was compliant |

A bare `controller` is forbidden because identity control, data control, and custody change independently. Likewise, one agent may process many subjects, one subject may be processed by many agents, and workload identity may persist while persona or credentials change. [EV-08]

## Consent, grant, authorization, use, and revocation lifecycle

1. **Declare basis and choices.** The grantor records `grantor_role`, a declared `basis_ref`, and an optional `consent_record_ref`. If consent applies, its scope and withdrawal route are explicit. Consent is neither always the applicable basis nor an authorization decision. Power-imbalanced settings require non-biometric alternatives, non-retaliation, appeal, and worker or affected-person governance. [EV-02, EV-03, EV-04, EV-08]
2. **Issue a bounded grant.** `DataUseGrant` binds grantee, resource, action, purpose, audience, environment, validity, retention, disclosure, use count, and revocation reference. `DelegationGrant` exists only as a strict subtype with a parent, depth, and provably narrower rights. [EV-03, EV-08]
3. **Authenticate context.** The evaluator checks agent instance, presented key, workload/runtime, audience, validity, recovery state, and revocation state. Credential possession alone is insufficient. [EV-03, EV-08]
4. **Request one action.** `PurposeBoundComputationRequest` binds the envelope and grant to source digest, purpose, audience, code/model/configuration digest, output schema, and execution limits. The request cannot authorize itself. [EV-08]
5. **Authorize at use time.** The access-policy owner returns a current permit or deny for the exact request. Absence, mismatch, expiry, exhaustion, or revocation denies before source read. [EV-03, EV-06, EV-07]
6. **Mediate and observe.** A permit enables one bounded attempt. The runtime enforces read, disclosure, network, persistence, and output-schema limits, then records a receipt including omissions. [EV-07, EV-08]
7. **Route a privacy-limited claim.** Only the allowed derived output and references enter the CAV2 adapter. Evidence may remain candidate-local with `authority_effect:none`; it cannot promote itself. [EV-05, EV-07]
8. **Handle revocation explicitly.** Revocation before evaluation must deny with zero reads. Revocation during execution must cancel, quarantine output, and block dependent candidates. Deletion must make the source unreadable and route prior dependent candidates for owner review. A failed unlearning obligation must be recorded as failure, not renamed erasure. Revocation cannot retroactively prove that completed processing, cached data, model influence, or undiscovered copies disappeared. [EV-07]
9. **Obtain governance disposition separately.** Only an admitted CAV2 owner route may record the relevant Decision. Consent, authorization, computation success, receipt validity, confidence, or candidate retention cannot substitute for it. [EV-05, EV-08]

## Fixed positive and negative witness suite

All cases clone the same synthetic fixture before exactly one mutation:

```text
data:
  SD1 = {"subject":"synthetic-A","birth_date":"2000-01-01"}
  resource_ref = SR1
  deletion_handle = DEL1
identity:
  agent_instance = agent:age-checker:test
  key_fingerprint = K-A
  runtime_digest = R1
  audience = rp.test
grant:
  G1, one use, revocation_ref REV1
  action = derive:age-over-threshold
  purpose = age-eligibility
  evaluation_time = 2026-08-03T12:00:00Z
  output_schema = {"age_over_18": boolean}
  prohibit raw export, enrichment, training, retention,
           onward disclosure, and delegation
request:
  Q1 binds G1, identity/key, SR1 and H(SD1), purpose,
  audience, code digest, policy version, schema
limits:
  source reads = 1; network writes = 0; persistent writes = 0
```

Every run must expose `authn_result`, `authz_reason`, `source_read_count`, `output_count`, `disclosure_count`, `network_write_count`, `persistent_write_count`, `receipt_verification`, `candidate_state`, `authority_state`, and `decision_reviewer_ref`. [EV-07]

The positive expectation is:

```text
AUTHN_OK -> AUTHZ_PERMIT -> READ_1
-> {"age_over_18":true}
-> RECEIPT_VALID
-> CANDIDATE_ONLY / authority_effect:none
-> Decision{
     owner_route:"cav2-research-candidate-owner",
     decision_reviewer_ref:"human-reviewer:test-01",
     disposition:"retain_candidate_for_challenge"
   }
```

The reviewer reference is a fixed synthetic actor, not evidence of an admitted real owner. Neither CAV2 nor the relying party receives the birth date. [EV-07]

| ID | Single mutation | Required terminal state | Immediate falsifier |
|---|---|---|---|
| W-N1 | Omit `G1` | `AUTHZ_DENY(grant_absent)`; reads `0` | Any read, output, or candidate |
| W-N2A | Purpose becomes `training` | `AUTHZ_DENY(purpose_mismatch)`; reads `0` | Consent or identity acts as ambient permission |
| W-N2B | Audience differs from `rp.test` | `AUTHZ_DENY(audience_mismatch)`; reads `0` | Wrong audience receives use |
| W-N2C | Substitute another authenticated agent | `AUTHZ_DENY(grantee_mismatch)`; reads `0` | Different agent uses `G1` |
| W-N2D | Expected agent signs with `K-B` | `AUTHN_FAIL(key_mismatch)`; reads `0` | Identifier equality bypasses key proof |
| W-R1 | Revoke `G1` before evaluation | `AUTHZ_DENY(grant_revoked)`; reads `0` | Revoked grant reaches a read |
| W-R2 | Revoke during execution | Cancel; quarantine output; block dependent candidate | Output escapes containment |
| W-N3A | Mutate `H(SD1)` | `DENY(source_digest_mismatch)` | Mismatched source is used |
| W-N3B | Tombstone `SR1` | `DENY(source_deleted)`; prior candidate blocked for review | Deleted source is read or old candidate remains promotable |
| W-N3C | Inject a failed unlearning obligation | `BLOCK(unlearning_unproven)` with failure receipt | Erasure or unlearning is claimed |
| W-L1 | Attempt output `birth_year:2000` | Schema violation; quarantine; no candidate | Extra inference reaches CAV2 or relying party |
| W-L2 | Attempt cache or network write | Runtime abort; retention-violation receipt; no candidate | Side effect succeeds or is unobserved |
| W-P1 | Service actor attempts promotion without a signed Decision | `DENY(owner_decision_absent)`; candidate remains non-authoritative | Receipt or confidence changes authority |

The suite fails if a negative reaches the positive state, a denial occurs after reading or disclosure, exact read and egress counts cannot be observed, bindings are incomplete, the birth date leaves custody, the owner decision is absent or falsely attributed, injected leakage is undetectable, or a service promotes automatically. Leakage cases test only injected observable attempts; they cannot prove the absence of hidden processing. [EV-07]

**Execution status: `FAIL_NON_VACUITY_GATE_WITH_REPAIRABLE_DESIGN`.** The cases are differential and falsifiable on paper, but zero witnesses ran and no receipts were retained. Therefore no safeguard has been shown to enforce custody, prevent leakage, propagate revocation, or stop promotion. [EV-07]

## Risks and minimum safeguards

| Risk | Minimum safeguard | Remaining limit |
|---|---|---|
| Correlation | Pairwise identifiers, audience restriction, selective disclosure, no default equivalence links | Metadata may still link identities; unexecuted [EV-03, EV-07] |
| Recovery or impersonation | Multiple authenticators, rotation, prior-key invalidation, proof-of-possession, short validity | Recovery and compromised authorized runtimes remain risks [EV-03] |
| Confused deputy or over-delegation | Bind principals, resources, actions, purposes, audiences, and environment; strict attenuation; no wildcards | No task-specific attenuation proof [EV-04, EV-06] |
| Revocation and caching | Online checks, bounded grants, cancellation, quarantine, cache invalidation | Completed processing may persist [EV-07] |
| Inference or model retention | Output-schema enforcement, local derivation, anti-join rules, privacy budgets, lineage | Hidden leakage and model influence remain possible [EV-02, EV-07] |
| Receipt laundering | Bind decision, request, source, policy, code, output, counts, gaps, and forks | A receipt proves an issuer statement, not truth or compliance [EV-04, EV-08] |
| Coercive monitoring | Non-biometric alternative, refusal, non-retaliation, appeal, worker governance, no consequential mental-state inference | Consent may remain power-imbalanced [EV-02, EV-04] |
| Erasure versus audit | Separate personal data from privacy-safe transition evidence; require explicit privacy and legal decisions | Digests and metadata may remain linkable; legal classification unresolved [EV-04, EV-07] |

## Candidate-versus-canonical and built-versus-unbuilt boundaries

| Surface | Observed now | Not established |
|---|---|---|
| CAV2 authority semantics | Authority kinds, narrow owner routing, evidence ceilings, CAV2-D40 `ChallengeContract`, Decision/verdict routing, and candidate-versus-projection distinctions are active in the inspected private snapshot [EV-05] | No proposed identity, grant, receipt, or ingress relation is admitted; no owner Decision exists |
| Generic permission kernel | Repository contains a generic executable default-deny evaluator and soundness theorem [EV-06] | It was not rebuilt; no task mapping, policy profile, integration, or conformance witness exists |
| Identity and authorization standards | Stable standards own relevant primitives, while 2026 drafts overlap the chain [EV-03, EV-04] | No one final standard owns the whole chain; selected profiles and volatile versions are unpinned |
| Candidate interfaces | Reviewer-tested names and boundaries are coherent after duplicate killing and splitting [EV-08] | No canonical schema, runtime mediation, leakage observer, receipt implementation, or adapter was built |
| Inventory | CAV2 has an observed discovery/non-authority pattern [EV-05] | No target-local machine index and no authority effect |
| Ontology | Current CAV2 models supply candidate read-model semantics [EV-05] | Proposed schemas are not live, admitted, executable, promoted, or projected |
| Witnesses | Fixed differential expectations and falsifiers exist [EV-07] | Zero executions, retained receipts, or non-vacuity proof |
| External effects | None evidenced | No legal compliance, clinical efficacy, workplace deployment, publication, public-Arcanum transfer, deployment, or production readiness |

The source boundary also forbids wholesale copying of emerging drafts, cloning stable standards under local names, or moving private CAV2 semantics into public Arcanum. References and narrow profiles may be candidates; authority and publication require their own owners and gates. [EV-04, EV-05]

## Final five-column verdict matrix

“Witnessed” distinguishes source observation from operational execution. No row contains an executed end-to-end witness.

| Subject / ID | Owner | Witnessed | Sound | Verdict |
|---|---|---|---|---|
| DOCX artifact | DOCX authors/contributors; research route classifies it | Source-observed only | Yes, at concept-draft ceiling | `BOUND`: conversational concept draft; not a peer-reviewed paper or validated framework [EV-01, EV-02] |
| Broad novelty | Standards and protocol owners | Precedents source-observed | No | `KILL`: broad “precedent-clean” or universal-model claim; retain only narrow private CAV2 adapter, non-collapse profile, and witness novel-attempt [EV-04] |
| CAN-01 store/ref | External custodian and data controller in their distinct scopes | Owner/precedent observed; no runtime witness | Yes after rename | `RENAME`: `SubjectDataStore/Ref` becomes `DataCustodyStore` and `DataResourceRef`; subject relation stays separate; candidate and unbuilt [EV-04, EV-08] |
| CAN-02 identity pair | Selected identity, credential, and workload standards owners | Standards observed; profile unexecuted | Yes after nesting | `KILL_DUPLICATE_AND_NEST`: one `AgentIdentityEnvelope`; attestation only an independently revocable member; profile unbuilt [EV-03, EV-04, EV-08] |
| CAN-03 grant pair | Grantor role plus resource/access-policy owner | Standards observed; task grant unexecuted | Yes after subtype rule | `KILL_ALIAS_AND_SUBTYPE`: retain `DataUseGrant`; allow `DelegationGrant` only as strict attenuated subtype; not canonical or built [EV-03, EV-04, EV-08] |
| CAN-04 request | Request producer; access-policy owner evaluates it | Precedent observed; request unexecuted | Candidate-sound | `SURVIVE_BUILD_FROM_OWNED`: `PurposeBoundComputationRequest`; no clean object novelty; adapter/witness only novel-attempt [EV-04, EV-08] |
| CAN-05 authorization decision | Resource/access-policy owner | Generic kernel source-observed; task mapping unexecuted | Generic theorem only | `SURVIVE_CORRECTED`: `AuthorizationDecision` may map to existing default-deny kernel; rebuild, mapping, integration, and conformance absent [EV-06] |
| CAN-06 receipt pair | Access-policy owner for decision; runtime/evidence producer for attempt | Standards observed; profiles unexecuted | Yes after duplicate removal | `KILL_DUPLICATE`: deny remains `AuthorizationDecision`; retain one `ComputationReceipt` for an attempted execution; unbuilt [EV-04, EV-08] |
| CAN-07 claim envelope | External submitter; private CAV2 evidence route after ingress | Boundary source-observed; adapter unexecuted | Yes after replacement | `KILL_AND_REPLACE`: use `DerivedClaimSubmission` without CAV2-owned lifecycle fields; narrow adapter candidate and unbuilt [EV-04, EV-08] |
| CAN-08 Inventory evidence | Existing CAV2 Inventory owner | Existing pattern observed | Yes at discovery ceiling | `REFERENCE_OWNER`: reuse the non-authority Inventory evidence pattern; target-local index absent [EV-05] |
| CAN-09 ontology slash-name | Ontology candidate owner; authorized projection owner separately | Semantics observed; proposal unexecuted | No as slash type | `KILL_AND_SPLIT`: separate ontology candidate from authorized projection; schema/integration candidate and unbuilt [EV-05, EV-08] |
| CAN-10 ChallengeContract | Existing CAV2-D40 owner | Canonical mechanism observed; proposal instance unexecuted | Yes by reuse | `KILL_REDEFINITION_REUSE`: reuse existing `ChallengeContract`; do not redefine it [EV-05, EV-08] |
| CAN-11 OwnerDecision | Narrowest admitted CAV2 owner route | Governance semantics observed; proposal decision absent | No as new type | `KILL_NEW_TYPE_REUSE`: reuse existing owner-routed Decision/verdict record; no admission or promotion [EV-05, EV-08] |
| WIT-P1 positive | Evaluator, runtime/evidence producer, and synthetic reviewer route | Unexecuted | Differential after repair | `SURVIVE_WITH_REPAIR`: fixed fixture, time, observation fields, receipt bindings, and synthetic reviewer disposition added [EV-07] |
| WIT-N1 absent grant | Access-policy evaluator | Unexecuted | Supplemental | `SURVIVE_SUPPLEMENTAL`: zero-read denial remains useful but cannot substitute for wrong-agent/key cases [EV-07] |
| WIT-N2 combined purpose/audience | Access-policy evaluator | Unexecuted | No as combined case | `KILL_AND_SPLIT`: W-N2A purpose, W-N2B audience, W-N2C wrong agent, W-N2D wrong key [EV-07] |
| WIT-R1 pre-use revocation | Grant/revocation owner and evaluator | Unexecuted | Differential after repair | `SURVIVE_WITH_REPAIR`: require online revocation observation and zero reads [EV-07] |
| WIT-R2 mid-run revocation | Revocation owner, runtime, and candidate owner | Unexecuted | Supplemental | `SURVIVE_SUPPLEMENTAL`: cancellation, quarantine, and dependent-candidate states are explicit [EV-07] |
| WIT-N3 combined source/deletion/unlearning | Custodian, evaluator, and obligation owner | Unexecuted | No as combined case | `KILL_AND_SPLIT`: W-N3A digest mismatch, W-N3B deletion, W-N3C failed unlearning [EV-07] |
| W-L1 inference leakage | Runtime/output-schema enforcer and independent observer | Unexecuted | Candidate-sound | `ADD_SURVIVOR`: quarantine extra inference and create no candidate; detects only the injected observable leak [EV-07] |
| W-L2 retention leakage | Runtime/side-effect enforcer and independent observer | Unexecuted | Candidate-sound | `ADD_SURVIVOR`: abort cache/network write, record violation, create no candidate; hidden leakage remains possible [EV-07] |
| W-P1 automatic promotion | CAV2 owner gate | Unexecuted | Candidate-sound | `ADD_SURVIVOR`: deny without signed owner Decision and keep candidate non-authoritative [EV-05, EV-07] |
| Non-vacuity | Independent evaluator and witness owner | Zero witnesses executed | Not yet | `DEFER / FAIL_EXECUTION_GATE`: falsifiable design survives; enforcement claims are killed until the matrix runs with retained receipts [EV-07] |
| Legal, clinical, workplace, and complete privacy effects | Applicable legal, clinical, organizational, and affected-person owners | Literature observed; no task execution | No conclusion | `DEFER_OR_REJECT`: no legal determination, clinical efficacy, workplace readiness, or complete privacy guarantee [EV-02, EV-04] |
| Private CAV2 integration and authority | Admitted CAV2 schema, evidence, ontology, and authority owners | Current semantics observed; proposal unexecuted | Not yet | `DEFER`: no admitted relation, executable lifecycle, owner Decision, authority promotion, or authorized projection [EV-05, EV-06, EV-08] |

## Closing boundary

The corrected result is useful precisely because it is narrower than the DOCX’s ambition. It describes how contextual agent identity, external data custody, purpose-bound operational authorization, observable computation, and private CAV2 governance could interoperate without collapsing their owners or effects. It also supplies a fixed way to disprove the design. Until the complete witness matrix runs, task-specific formal mapping is checked, schemas and adapters receive owner admission, and revocation, leakage, erasure, and review produce retained evidence, the work remains candidate-only and unbuilt. It supports no claim of implementation, legal compliance, ontology admission, authority promotion, publication, deployment, or production readiness. [EV-05, EV-06, EV-07, EV-08]
