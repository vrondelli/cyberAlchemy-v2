# SYNTHESIS-FINAL candidate: agent identity, data custody, human autonomy, and CAV2

> “Final” identifies the reconciled research artifact, not canonical admission, implementation, promotion, publication, deployment, or production readiness.

## Executive assessment

The DOCX is a conversational concept draft, not a paper, validated scientific framework, clinical protocol, legal instrument, or implemented system.

Its valuable core intuition survives correction:

> Adaptive AI can add profiling, personalization, feedback, optimization, and scale to ordinary influence. A defensible response should preserve human-autonomy safeguards: privacy, comprehensible purpose, refusal, withdrawal, correction, revocation, appeal, attribution, non-retaliation, and accountable review.

The draft overshoots when it claims or implies that Romantic literature and AI are equivalent manipulation systems; dopamine or neuroplasticity install beliefs; biometrics reveal inner emotional truth; AI reliably predicts or eliminates burnout; monitoring produces well-being; or DIDs, credentials, IPFS, blockchain, and ERC-7007 establish truth, authorization, ownership, persistence, or compensation.

Those propositions remain unsupported, causally unresolved, or unsafe. The defensible result is an unverified governance composition and falsifiable witness plan.

Novelty must also be narrow. No final standard owns the complete identity → grant → purpose/action binding → enforcement → receipt → CAV2 owner-gate chain. However, active 2026 IETF/NIST-related work on Agent Identity Protocol, AI-Agent Authorization, agent grants, transaction tokens, agent-operation authorization, authorization receipts, and actor receipts substantially overlaps it. These drafts are volatile and non-authoritative, but they preclude any broad “precedent-clean” or universal-model claim. The candidate contribution is limited to profiling owned primitives, enforcing non-collapse rules, defining a private CAV2 ingress adapter, and running bounded witnesses.

## Evidence register

References to a packet below incorporate its source identity, selector, return/review reference, scope, and status.

| Claim ID | Immutable source identity | Source-local selector | Return/review reference | Evidence scope and status |
|---|---|---|---|---|
| EV-01 | DOCX `sha256:3153a4ced4a268294e9695e75618448f75737ac101a06534e31544ad8b7e8c54` | Human prompts ¶38, 63–64, 110, 167, 190, 243, 291, 338, 394, 555, 575, 684, 709; generated expansions ¶55, 69–91, 129–155, 244–550, 575–708, 717–767 | Kahneman return `sha256:684b6ec2168e811f9e2ad38f602c00c164e0bcdfa699cc0ab72c3a72dc81c4bf`, §§1, 3 | Artifact classification/authorship; hash and OOXML inspection `EXECUTED`, content `OBSERVED` |
| EV-02 | DOI `10.1037/0022-3514.79.5.701`; DOI `10.1038/s41562-025-02194-6`; DOI `10.2196/50253`; DOI `10.1111/peps.12514`; Regulation (EU) 2024/1689 | Narrative experiments; personalized-persuasion design/limits; burnout review Results/Conclusions; monitoring/stress findings; Recital 44 and Art. 5(1)(f) | Kahneman return `sha256:684b…`, §§2–6 | Persuasion, health, monitoring, and mental-state-inference limits `OBSERVED`; no causal/clinical reproduction |
| EV-03 | W3C Controlled Identifiers 1.0 REC 2025-05-15; W3C VC Data Model 2.0 REC 2025-05-15; SPIFFE commit `dc4e9d9b4eff8aa181a54cd330ff9f877186060e`; RFC 9396, 9635, 8707, 9449, 9700 | CID §2.1.2; VC §§1.1, 2, 5.9; SPIFFE §§2, 4.1; authorization detail, grant, audience/resource, proof-of-possession, security sections | Hewitt return `sha256:69efc77b96051629e8165f0e0a6027a92dc163250e43753f03e71417d44559a5`, §§Main finding, Standards owners | Identity/authentication/authorization primitives `OBSERVED`; proposed composition `UNVERIFIED` |
| EV-04 | Lakatos review `sha256:f6084fbe43e6cd15680c001e52024e995f941267a511a4062e3ed2086922fa89` | `#Owner matrix` CAN-01–CAN-11; `#Exact synthesis repairs` | `spawn-0005` | 2026 precedent/status and owner checks `OBSERVED`; draft versions volatile and not final |
| EV-05 | CAV2 owner snapshot parent HEAD `ab46061bf14db23a01054c2fd3fafec60fb5eb2f`; `AUTHORITY-MODEL.md sha256:8e9d39eb…`; `DEFINITIONS.md sha256:b38cb3cd…`; `NODE-MODEL.md sha256:aca62f21…`; `RELATION-MODEL.md sha256:19b5614e…`; `LIFECYCLE-MODEL.md sha256:00636be3…` | Authority rule/Inventory role; CAV2-D35/D40/D49; node, relation, and lifecycle contracts | Quine review `sha256:3ae9bf3c4415a2553afc3ba1302e9a7d33a20c06d37cdf527a0ace2a96b669f1`; Lakatos review `sha256:f608…` | Active authority semantics and candidate ontology boundaries `OBSERVED`; no proposed relation admitted or executed |
| EV-06 | `AgentPermissionKernel.lean` submodule commit `c087ed7278028b460ee231a6c1178210f599a54f` | Lines 89–164; generic evaluator/default-deny/soundness theorem; Lakatos `#Owner matrix/CAN-05` | Lakatos review `sha256:f608…` | Generic executable kernel and proof `OBSERVED`; not rebuilt this run; task mapping, policy profile, integration, and conformance `UNVERIFIED` |
| EV-07 | Popper review `sha256:1bbc4941756469ad5677cc99c80b1bbd6890d0f95b01b7d1aaacf5b5633f1672` | `#Smallest concrete hand-built witness`, `#Negative controls`, `#Falsifiers`, `#Dispositions` | `spawn-0006` | Differential witness design `UNVERIFIED`; zero controls executed; non-vacuity gate currently failed |
| EV-08 | Quine review `sha256:3ae9bf3c4415a2553afc3ba1302e9a7d33a20c06d37cdf527a0ace2a96b669f1` | `#Term-boundary table`, `#Envelope and relation identity tests`, `#Collapse findings`, `#Surviving candidate prose` | `spawn-0007` | Independent consequence/identity tests `OBSERVED`; repaired interfaces remain candidate-only |

## Corrected conceptual model

**Agent identity** identifies and authenticates a contextual software-agent instance: principal/operator references, workload/runtime, audience, authentication evidence, validity, recovery, and revocation. It grants no operational permission or CAV2 authority.

**Sovereign data** is retained only as an umbrella policy objective. It groups custody, purpose limitation, access, export, correction, deletion, revocation, retention, and remedy. It is not a type, ownership proof, legal conclusion, or synonym for local storage.

**Human-autonomy safeguards** require role-specific rights and responsibilities:

- natural persons and data subjects exercise refusal, withdrawal, correction, deletion, and appeal where applicable;
- `data_controller` determines purposes and means under the applicable regime;
- `custodian` operates storage and enforcement;
- `identity_controller` administers identifier bindings;
- grantor roles supply a declared `basis_ref` and optional `consent_record_ref`;
- resource/access-policy owners define operational permission;
- runtime and evidence producers own execution observations;
- the narrowest admitted CAV2 owner route decides promotion, with accountable human review where required.

A bare `controller` is forbidden.

```text
credential ≠ authentication ≠ authorization
delegation ≠ authorization
consent ≠ authorization
custody ≠ subjecthood ≠ data control
provenance ≠ evidence ≠ confidence
authorization ≠ CAV2 authority
ontology candidate ≠ owner-routed Decision ≠ authorized projection
```

Evidence: EV-03, EV-05, EV-08.

## Surviving candidate types

- **`DataCustodyStore` / `DataResourceRef`:** an externally owned custody substrate and opaque, digest-bound resource reference. `relates_to_data_subject` is a separate relation.

- **`AgentIdentityEnvelope`:** context-bound aggregation of agent instance, principal/operator, workload/runtime, audience, authentication evidence, validity, recovery, and revocation references. An **`AgentIdentityAttestation`** is one issuer-signed, independently expiring and revocable evidence member inside the envelope.

- **`DataUseGrant`:** policy-evaluable input binding `grantor_role`, `basis_ref`, optional `consent_record_ref`, grantee, resource, action, purpose, audience, environment, validity, retention, disclosure, and revocation. **`DelegationGrant`** is only a strict attenuated subtype with parent grant, depth, and provably narrower rights.

- **`PurposeBoundComputationRequest`:** binds one action to identity envelope, grant, resource references, purpose, code/model/configuration, output schema, and execution limits. It cannot authorize itself.

- **`AuthorizationDecision`:** the access-policy owner’s permit/deny evaluation of the exact request under current identity/key, policy, time, audience, environment, source, use count, and revocation state.

- **`ComputationReceipt`:** bounded observations about one attempted computation: exact bindings, runtime/configuration digests, start/end/cancellation, reads, outputs, disclosures, side effects, retention result, and omissions. A denial remains an `AuthorizationDecision`; there is no coequal `DataUseReceipt`.

- **`DerivedClaimSubmission`:** external ingress payload containing only scoped claim, source/transformation references, computation-receipt references, validity/expiry, and disclosed omissions. Confidence, challenge, residue, owner route, and lifecycle status are assigned only inside CAV2.

Evidence: EV-03, EV-04, EV-08. All schemas remain `UNVERIFIED`.

## Explicit, non-automatic architecture edges

| Edge ID | Explicit relation and endpoints | Owner and evidence | Permitted effect | Forbidden collapse |
|---|---|---|---|---|
| EDGE-01 | `PurposeBoundComputationRequest references AgentIdentityEnvelope, DataUseGrant, DataResourceRef` | Request producer; exact hashes/references; EV-03, EV-08 | Supplies evaluation inputs only | Reference does not authenticate, authorize, or prove truth |
| EDGE-02 | `AuthorizationDecision evaluates PurposeBoundComputationRequest` under current policy/revocation state | Access-policy owner; EV-03, EV-06 | Records permit or deny | Generic Lean proof does not prove task mapping or integration |
| EDGE-03 | `permit enables one mediated computation attempt` | Runtime-policy owner; exact decision/request binding | Allows only the bounded attempt | Permit does not establish correctness, compliance, or CAV2 authority |
| EDGE-04 | `ComputationReceipt observes computation attempt` | Runtime/evidence producer; measured fields | Records bounded observations | Receipt does not prove hidden-use absence, truth, or erasure |
| EDGE-05 | `DerivedClaimSubmission references output, provenance, and ComputationReceipt` | External submitter/source owners | Creates an ingress request only | Submission does not assign confidence, challenge, lifecycle, or owner route |
| EDGE-06 | `CAV2 adapter may accept submission as Evidence` | CAV2 evidence route; validation evidence | Produces candidate-local evidence if gates pass | No automatic candidate, ontology, or authority effect |
| EDGE-07 | `Evidence may support ontology candidate` | Ontology candidate owner; current node/relation contract | Records candidate support | Inventory/evidence does not become source authority |
| EDGE-08 | `ontology candidate may request ChallengeContract and owner gate` | Existing CAV2-D40 and admitted owner route | Opens challenge/decision route | Candidate, confidence, or repetition is not verdict |
| EDGE-09 | `owner-routed Decision records verdict` | Narrowest admitted owner route, accountable human review where required | Pass/flag/block/defer/reject/supersede | No new `OwnerDecision` type; agent record alone is not human review |
| EDGE-10 | `authorized projection may reflect Decision` | Authorized projection owner | Updates a permitted read model | Candidate view is not an authorized projection; no silent promotion |

No edge is automatic. Evidence: EV-05, EV-08.

## CAV2 owner and non-collapse boundary

CAV2 already owns authority kinds, owner routes, promotion gates, provenance/evidence ceilings, ChallengeContract, Decision/verdict routing, and the distinction between candidate ontology state and authorized projection. Inventory remains a discovery read model.

External layers own identity operations, custody, operational grants, access-policy evaluation, runtime mediation, and factual execution observations. Raw biometric, emotional, conversational, memory, health, and surveillance data remains in `DataCustodyStore`. CAV2 receives bounded evidence, policy decisions, provenance references, receipts, and claim submissions.

Active authority semantics do not imply admitted identity/delegation relations, executable ontology lifecycle, or a validator for this proposal. No Living Archive ownership claim is supported.

## Repaired fixed witness

All cases clone the same fixture before one mutation:

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
  Q1 binds G1, identity/key, SR1 and digest H(SD1),
  purpose, audience, code digest, policy version, schema
limits:
  source reads = 1; network writes = 0; persistent writes = 0
```

Required observation fields are:

`authn_result`, `authz_reason`, `source_read_count`, `output_count`, `disclosure_count`, `network_write_count`, `persistent_write_count`, `receipt_verification`, `candidate_state`, `authority_state`, and `decision_reviewer_ref`.

Positive expectation:

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

The reviewer reference is a fixed synthetic witness actor, not evidence of a currently admitted real owner. Neither relying party nor CAV2 receives the birth date.

### Negative and revocation controls

| ID | Single mutation | Required terminal state | Immediate falsifier |
|---|---|---|---|
| W-N1 | Omit `G1` | `AUTHZ_DENY(grant_absent)`, reads `0` | Any read/output/candidate |
| W-N2A | Purpose becomes `training` | `AUTHZ_DENY(purpose_mismatch)`, reads `0` | Ambient permission |
| W-N2B | Audience differs from `rp.test` | `AUTHZ_DENY(audience_mismatch)`, reads `0` | Wrong audience receives use |
| W-N2C | Substitute another authenticated agent | `AUTHZ_DENY(grantee_mismatch)`, reads `0` | Different agent uses `G1` |
| W-N2D | Expected agent signs with `K-B` | `AUTHN_FAIL(key_mismatch)`, reads `0` | Identifier bypasses key proof |
| W-R1 | Revoke `G1` before evaluation | `AUTHZ_DENY(grant_revoked)`, reads `0` | Revoked grant reaches read |
| W-R2 | Revoke during execution | Cancel; quarantine output; block dependent candidate | Output escapes containment |
| W-N3A | Mutate `H(SD1)` | `DENY(source_digest_mismatch)` | Mismatched source used |
| W-N3B | Tombstone `SR1` | `DENY(source_deleted)`; prior candidate blocked for review | Deleted source read or old candidate remains promotable |
| W-N3C | Inject failed unlearning obligation | `BLOCK(unlearning_unproven)` with failure receipt | Erasure/unlearning claimed |
| W-L1 | Attempt output `birth_year:2000` | Schema violation; quarantine; no candidate | Extra inference disclosed |
| W-L2 | Attempt cache/network write | Runtime abort; retention-violation receipt | Side effect succeeds or is unobserved |
| W-P1 | Service actor attempts promotion without signed Decision | `DENY(owner_decision_absent)`; candidate stays non-authoritative | Receipt/confidence changes authority |

Leakage controls demonstrate detection only for injected observable attempts. They do not prove absence of hidden processing or undiscovered copies. The entire suite remains `UNVERIFIED` and unexecuted. Evidence: EV-07.

## Threat controls

| Threat | Minimum safeguard | Evidence ceiling |
|---|---|---|
| Correlation | Pairwise identifiers, audience restriction, selective disclosure, no default equivalence links | Metadata may still link; controls unexecuted |
| Recovery/impersonation | Multiple authenticators, rotation, prior-key invalidation, proof-of-possession, short validity | Recovery and compromised authorized runtimes remain risks |
| Confused deputy/over-delegation | Bind all principals/resources/actions/purposes/audiences; strict attenuation and no wildcards | Domain attenuation proof absent |
| Revocation/caching | Online checks, bounded grants, cancellation, quarantine, cache invalidation | Completed processing may persist |
| Inference/model retention | Output-schema enforcement, local derivation, anti-join rules, privacy budgets, lineage | Hidden leakage and model influence remain possible |
| Receipt laundering | Bind decision/request/source/code/output and observation counts; quarantine gaps/forks | Receipt proves an issuer statement, not compliance |
| Coercive monitoring | Non-biometric alternative, non-retaliation, appeal, worker governance, no consequential mental-state inference | Workplace consent may remain power-imbalanced |
| Erasure/audit conflict | Separate personal data from privacy-safe transition evidence; explicit privacy/legal decision | Digests or metadata may remain linkable |

Evidence: EV-02–EV-04, EV-07.

## Five-column final verdict matrix

| Subject / ID | Final disposition | Surviving form | Canonical/built boundary | Evidence |
|---|---|---|---|---|
| Store/ref CAN-01 | `RENAME` | `DataCustodyStore`, `DataResourceRef` | Candidate; external; not built | EV-04, EV-08 |
| Identity pair CAN-02 | `KILL_DUPLICATE_AND_NEST` | One `AgentIdentityEnvelope`; revocable attestation member | Standards owned; profile unbuilt | EV-03, EV-04, EV-08 |
| Grant pair CAN-03 | `KILL_ALIAS_AND_SUBTYPE` | `DataUseGrant`; strict attenuated `DelegationGrant` subtype | Not canonical/built | EV-04, EV-08 |
| Request CAN-04 | `SURVIVE_BUILD_FROM_OWNED` | `PurposeBoundComputationRequest` | Emerging precedent overlaps; CAV2 adapter/witness only novel-attempt | EV-04, EV-08 |
| Decision CAN-05 | `SURVIVE_CORRECTED` | `AuthorizationDecision` mapped to existing generic default-deny kernel | Kernel exists; task mapping, rebuild, integration, conformance absent | EV-06 |
| Receipt pair CAN-06 | `KILL_DUPLICATE` | `AuthorizationDecision` for deny; one `ComputationReceipt` for attempt | Profiles unbuilt | EV-04, EV-08 |
| Claim envelope CAN-07 | `KILL_AND_REPLACE` | External `DerivedClaimSubmission` stripped of CAV2 lifecycle fields | Narrow ingress adapter is candidate; not built | EV-04, EV-08 |
| Inventory CAN-08 | `REFERENCE_OWNER` | Existing non-authority Inventory evidence pattern | Pattern active; target-local index absent | EV-05 |
| Ontology slash-name CAN-09 | `KILL_AND_SPLIT` | Ontology candidate; separately authorized projection | Semantics active; proposed schema/integration unbuilt | EV-05, EV-08 |
| Challenge CAN-10 | `KILL_REDEFINITION_REUSE` | Existing CAV2-D40 `ChallengeContract` | Canonical mechanism; paper instance unexecuted | EV-05, EV-08 |
| OwnerDecision CAN-11 | `KILL_NEW_TYPE_REUSE` | Existing owner-routed Decision/verdict record | Governance active; proposal decision absent | EV-05, EV-08 |
| Witness WIT-N2 | `KILL_AND_SPLIT` | Separate purpose, audience, wrong-agent, wrong-key controls | Unexecuted | EV-07 |
| Witness WIT-N3 | `KILL_AND_SPLIT` | Separate digest mismatch, deletion, and unlearning controls | Unexecuted | EV-07 |

## Exact gaps and ceilings

1. No final standard owns the whole chain, but 2026 drafts substantially overlap it. Draft versions, intended repository/release/commit, and TCK posture are not pinned.
2. SPIFFE is pinned in explorer evidence to commit `dc4e…`, while live documentation reportedly identifies `v1.15.2`; one immutable profile must be selected.
3. DID 1.1 and BBS remain work in progress. ISO 27560:2023 is published but marked for revision.
4. The generic Lean evaluator and proof exist, but were not rebuilt. No task-specific mapping, policy profile, integration, or conformance witness exists.
5. No candidate schema, runtime mediation, leakage observer, receipt implementation, or witness suite was executed.
6. No owner Decision admits these contracts or relations.
7. CAV2 authority semantics are active; proposed ontology schemas and relations remain candidate read models, not executable authority transitions.
8. Erasure versus append-only audit and jurisdiction-specific legal classification remain unresolved.
9. No Living Archive ownership claim is supported.
10. No clinical efficacy, workplace deployment, legal compliance, ontology admission, publication, release, production readiness, or public-Arcanum transfer is supported.
11. Wholesale copying of emerging drafts, cloning stable standards under local names, or exporting private CAV2 semantics into public Arcanum is forbidden by the evidence boundary.

---

`action_id=spawn-0004`  
`role_id=synthesizer-simon`  
`feedback_loop=1/1`  
`status=complete_replacement_candidate`  
`validation=PASS_WITH_RESIDUE — reviewer repairs incorporated; duplicate types killed or split; architecture edges made explicit and non-automatic; novelty narrowed; Lean kernel status corrected; witness suite made differential and falsifiable; execution gate remains failed because no witness ran`  
`blockers=no executed witness or retained receipts; no task-specific Lean mapping/rebuild/integration/conformance; no admitted owner Decision; volatile draft versions unpinned; erasure/audit and legal classification unresolved`  
`review_inputs=SYNTHESIS-DRAFT.md sha256:a4c19b4ecd7141cffda7fe574896bba751018ce4c0d36fc88ae093e03e58bc82; reviewer-lakatos.md sha256:f6084fbe43e6cd15680c001e52024e995f941267a511a4062e3ed2086922fa89; reviewer-popper.md sha256:1bbc4941756469ad5677cc99c80b1bbd6890d0f95b01b7d1aaacf5b5633f1672; reviewer-quine.md sha256:3ae9bf3c4415a2553afc3ba1302e9a7d33a20c06d37cdf527a0ace2a96b669f1`
