Precedent gate: `PASS_WITH_RESIDUE`; no `KILL`.

The synthesis is right that no final standard owns the complete architecture. It is too generous about novelty, however: several 2026 Internet-Drafts now cover nearly the same identity → delegation → purpose/action binding → enforcement → receipt chain. Those drafts are unstable and non-authoritative, but they defeat any broad “precedent-clean composition” claim.

### Owner matrix

| Candidate | Precedent owner | Classification | Required narrowing |
|---|---|---|---|
| CAN-01 `SubjectDataStore/Ref` | [Solid Protocol 0.11](https://solidproject.org/TR/protocol) covers permissioned external storage but is not a W3C Standard; [Dataspace Protocol 2024-1](https://github.com/International-Data-Spaces-Association/ids-specification) covers catalogs, agreements, and transfers and has moved toward Eclipse ownership. | `build-from-owned` | Keep storage external. “Human-controlled” must mean evidenced custody/access/export/correction/deletion controls, not local storage or sovereignty by label. |
| CAN-02 identity envelope | [Controlled Identifiers 1.0](https://www.w3.org/TR/cid-1.0/) and [VC Data Model 2.0](https://www.w3.org/TR/vc-data-model/) are Recommendations; [SPIFFE](https://spiffe.io/docs/latest/spiffe-specs/) owns workload identity. 2026 [AIP](https://datatracker.ietf.org/doc/draft-aip-agent-identity-protocol/) and [AI-Agent Auth](https://datatracker.ietf.org/doc/draft-klrc-aiagent-auth/) drafts already propose agent/principal/runtime bindings. | `build-from-owned` | Select and profile one workload/credential stack; do not publish a universal identity model. DID 1.1 remains CR and BBS remains CR Draft. |
| CAN-03 data-use/delegation grant | [RFC 9396](https://www.rfc-editor.org/rfc/rfc9396.html), [RFC 9635](https://www.rfc-editor.org/rfc/rfc9635.html), [ODRL 2.2](https://www.w3.org/TR/odrl-model/), and [ISO/IEC TS 27560:2023](https://www.iso.org/standard/80392.html) own fine-grained rights, policy expressions, and consent records. [DAAP](https://datatracker.ietf.org/doc/draft-mishra-oauth-agent-grants/) is direct emerging agent-delegation precedent. | `build-from-owned` | Keep consent record, lawful basis, operational grant, and authorization decision as separate relations. |
| CAN-04 purpose-bound computation request | [Transaction Tokens](https://datatracker.ietf.org/doc/draft-ietf-oauth-transaction-tokens/) already bind identity, purpose, request context, and immutable transaction context; [Agent Operation Authorization](https://datatracker.ietf.org/doc/draft-liu-agent-operation-authorization/) binds agent identity, human intent evidence, context, and policy. | `build-from-owned` | No clean novelty for the request object. Novel-attempt is limited to the CAV2-specific projection/output/residue profile and witness. |
| CAN-05 authorization decision | OAuth/ODRL own protocol and policy inputs. More importantly, the repository already contains a generic default-deny evaluator and soundness theorem in [AgentPermissionKernel.lean](/home/vrondelli/projects/domainspec-core/domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean:89). | `already-deployed`, generic repository kernel only | Replace “no evaluator or conformance witness” with: “generic executable kernel and proof exist; task-specific request mapping, policy profiles, rebuild, integration, and conformance witness are absent.” |
| CAN-06 data-use/computation receipts | ISO 27560 owns consent record/receipt structure; [PROV-O](https://www.w3.org/TR/prov-o/) owns provenance relations; [RFC 9943](https://www.rfc-editor.org/rfc/rfc9943.html) owns transparency receipts. Current [authorization-receipt](https://datatracker.ietf.org/doc/draft-schrock-ep-authorization-receipts/) and [actor-receipt](https://www.ietf.org/archive/id/draft-mcguinness-oauth-actor-receipts-00.html) drafts overlap directly. | `build-from-owned` | Keep consent, authorization, computation, provenance, and transparency receipts as distinct profiles. SCITT supplies optional inclusion evidence, not a generic data-use receipt. |
| CAN-07 derived claim envelope | VC/PROV and active CAV2 provenance plus claim-proof rules own the components. | `precedent-clean -> novel-attempt`, only for the narrow CAV2 ingress adapter | Claim novelty only for the privacy-safe mapping into CAV2 candidate/challenge lifecycle, not for claims, provenance, credentials, or receipts generally. |
| CAN-08 Inventory evidence | CAV2 already deploys the discovery/non-authority role in [AUTHORITY-MODEL.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:122). | `already-deployed` pattern | Target-local machine index remains absent. |
| CAN-09 ontology candidate/view | The ontology definition is active, but [NODE-MODEL.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/ontology/NODE-MODEL.md:3), [RELATION-MODEL.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/ontology/RELATION-MODEL.md:3), and [LIFECYCLE-MODEL.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/ontology/LIFECYCLE-MODEL.md:3) explicitly remain candidate read models. | `already-deployed` semantics; schema/integration is `novel-attempt` | Do not call the proposed relations live, admitted, or executable. |
| CAN-10 challenge contract | `CAV2-D40` is an active canonical definition in [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:2553). | `already-deployed` governance mechanism | Only the paper-specific instance is unexecuted. |
| CAN-11 owner decision | The authority rule, closed kind enumeration, and narrowest-owner route are active in [AUTHORITY-MODEL.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23). | `already-deployed` governance mechanism | No decision for this proposal exists. |
| Human-control bundle | [EU AI Act Art. 5(1)(f)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32024R1689), the adopted 2025 [UNESCO Neurotechnology Recommendation](https://www.unesco.org/en/legal-affairs/recommendation-ethics-neurotechnology), and [NIST AI RMF 1.0](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) already own prohibition, autonomy, consent/withdrawal, oversight, and role-accountability precedents. | `build-from-owned` | Enumerate refusal, correction, revocation, appeal, responsible owner, and non-retaliation. Consent alone is especially inadequate under workplace power imbalance. |

### Exact synthesis repairs

1. Add a new evidence row for the 2026 NIST/IETF agent-identity, transaction-token, delegation, and receipt work. Amend “no current standard provides a complete contract” with: “No final standard does; several active Internet-Drafts substantially overlap the proposed composition and preclude broad novelty claims.”

2. Correct CAN-05 and gap 8: the Lean kernel is implemented at submodule commit `c087ed7278028b460ee231a6c1178210f599a54f`, file SHA-256 `f36d7e…`. It was not rebuilt this run and is not integrated with the proposed types.

3. Pin status drift:

   - ISO 27560:2023 remains published but is marked “to be revised”; ISO/IEC CD 27560.2 is underway.
   - The cited IDSA repository says ownership moved toward Eclipse; pin the intended repository, release, commit, and TCK posture.
   - SPIFFE evidence pins commit `dc4e…`, while live documentation reports `v1.15.2`; choose one immutable version.
   - DID 1.1 and BBS are work-in-progress, not Recommendations.

4. Separate active CAV2 authority semantics from candidate ontology schemas. “Observed” must not imply an admitted relation, executable lifecycle, or validator.

5. Make no Living Archive ownership claim. The permitted evidence contains no direct current Living Archive owner file; Inventory-derived seam claims are insufficient.

Wholesale-copy risk is highest if the paper copies a whole emerging AIP/DAAP/receipt draft, clones stable standards into locally renamed fields, or exports private CAV2 semantics into public Arcanum. The narrow adoption is references/profiles plus only the CAV2-specific adapter, non-collapse rules, and bounded witnesses.

`action_id=spawn-0005`  
`role_id=reviewer-lakatos`  
`status=complete`  
`validation=PASS_WITH_RESIDUE — primary owner/status checks completed; current emerging precedent added; CAV2 canonical-versus-candidate distinction verified; no writes`  
`blockers=Living Archive owner unverified; 2026 Internet-Drafts remain volatile; no proposal owner decision; Lean kernel not rebuilt; no integration or witness executed`  
`artifact_inputs=dispatch-sheet.json#groups[2].agents[0]; SYNTHESIS-DRAFT.md; explorer-hewitt.md sha256:69efc77b…; explorer-wiener.md sha256:c87e5a77…; explorer-kahneman.md sha256:684b6ec2…; CAV2 live owner snapshot parent HEAD ab46061bf14db23a01054c2fd3fafec60fb5eb2f; AgentPermissionKernel.lean submodule commit c087ed7278028b460ee231a6c1178210f599a54f`
