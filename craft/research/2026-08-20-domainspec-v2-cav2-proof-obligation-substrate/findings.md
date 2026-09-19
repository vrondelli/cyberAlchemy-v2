# Findings: the smallest authority-correct proof and obligation substrate

Status: evidence-closed research finding; owner adoption and implementation are blocked.

## Decision and claim ceiling

The recommended design is **TOP-03: a shared syntax-only envelope with owner-local schemas, owner-local catalogs, and derived projections**. It is a conditional design recommendation, not an adopted substrate. It may proceed only if a named syntax owner publishes exact syntax bytes and DomainSpec and CyberAlchemy v2 (CAV2) each perform an explicit, version-exact adoption act. The common layer may provide identity, digest, and reference syntax; it may not define record kinds, relation meanings, lifecycle transitions, obligation status or discharge, authority kinds, promotion, attestation, or publication semantics. [E-TOP-03; E-SHARED-OWNER]

If those conditions are not ratified, **TOP-02: two independent owner-local registries with a derived crosswalk** activates automatically. TOP-02 is the current authority-correct fallback. It is not evidence that the substrate is non-vacuous. [E-TOP-02; E-SHARED-OWNER]

**TOP-01, one cross-project canonical semantic registry, is rejected** because it would create a competing semantic and authority owner across two separately governed systems. [E-TOP-01]

This research selects an architecture and a non-executed candidate Work Pack only. It does **not** establish canonical adoption, a complete executed DomainSpec EVF proof witness, obligation discharge, deterministic CAV2 enforcement, promotion, publication, release, deployment, or production readiness. Dirty and untracked EVF bytes remain candidates. [E-DS-EVF; E-CAV2-AUTHORITY; E-PUBLIC]

## Substrate boundary

The smallest common unit is an addressable envelope, not a semantic record model. Its permitted fields are:

```text
syntax_schema_uri
owner_namespace
record_id
record_version
record_digest { algorithm, value }
owner_schema_ref { owner_namespace, id, version, digest }
semantic_owner_ref { owner_namespace, id, version, digest }
lifecycle_authority_ref { owner_namespace, id, version, digest }
promotion_authority_ref { owner_namespace, id, version, digest }
publication_authority_ref { owner_namespace, id, version, digest }
authority_kind_ref { owner_namespace, id, version, digest }
external_mapping_refs[] { adapter_owner_ref, id, version, digest }
provenance_refs[] { producer_owner_ref, id, version, digest }
source_bindings[] { repository_identity, path, selector, digest, size?, source_posture_ref }
typed_refs[] { reference_type_ref, target_owner_namespace, target_id, target_version, target_digest }
assertion_limit
materialization_origin_ref
authority_posture_ref
record_currentness_ref
obligation_status_ref
evaluation_outcome_ref
projection_freshness_ref
classification_ref
audience_ref
owner_payload_digest
```

Every field ending in `_ref` is opaque to the common layer and must be owner-qualified and version-exact. `owner_payload_digest` binds bytes but does not interpret them. `assertion_limit` bounds reporting; it is not a claim, proof status, receipt outcome, or authorization. The common validator may check field presence, identifier and digest syntax, and structural completeness only. [E-TOP-03; P-RFC6920]

The common layer is forbidden from enumerating record kinds, relation kinds, lifecycle events or transitions, obligation statuses or discharge rules, authority postures or authority-kind meanings, evaluation outcomes, attestation meanings, or publication policy. Owner schemas alone interpret payloads and opaque references. [E-TOP-03; E-CAV2-AUTHORITY]

## Owner and canonicality matrix

| Surface | Semantic or lifecycle owner | Canonicality in current evidence | Substrate treatment | Must not become | Evidence |
|---|---|---|---|---|---|
| DomainSpec meta-types and Rule-to-Operation relationship | DomainSpec | Current DomainSpec semantic authority; the relationship validator was observed executed-pass | Exact immutable source binding; DomainSpec-local schema and catalog entry only after owner adoption | CAV2-owned meaning or shared semantics | [E-DS-SEMANTICS] |
| EVF predicate, obligation, runtime contract, binding, and receipt schema | DomainSpec candidate owners | Dirty or untracked candidate bytes; execution and promotion unverified | Freeze exact path, selector, digest, and posture; adapt locally without copying meaning | Canonical proof, discharge, or shared authority | [E-DS-EVF] |
| CAV2 authority, claim-proof, privacy, and promotion rules | CAV2 authority and promotion owners | Current private CAV2 authority; deterministic authority-kind enforcement is unbuilt | Exact immutable source binding; CAV2-local adapters and decisions | Owner of DomainSpec semantics | [E-CAV2-AUTHORITY] |
| Shared envelope syntax | No current owner | Unowned and unadopted | Conditional TOP-03 only after a named owner and exact two-owner adoption; otherwise absent under TOP-02 | Semantic registry, definitions owner, lifecycle owner, or promotion route | [E-TOP-03; E-SHARED-OWNER] |
| DomainSpec owner-local catalog | DomainSpec | Proposed, unbuilt | Canonical only if DomainSpec adopts it through its own route | Cross-project or CAV2 catalog | [E-DS-SEMANTICS; E-TOP-02] |
| CAV2 owner-local catalog | CAV2 | Proposed, unbuilt | Canonical only if CAV2 adopts it through its own route | DomainSpec catalog or public projection | [E-CAV2-AUTHORITY; E-TOP-02] |
| Observation, proof object, checker evidence, or evaluator receipt | Producing observation, formal-system, checker, or evaluator owner respectively | Producer-owned artifact or exact immutable pointer | Preserve producer identity, exact bytes, scope, and result type | Semantic authority, lifecycle decision, or self-promotion | [E-EVIDENCE] |
| Attestation statement, mechanism metadata, and verifier receipt | Statement producer, CAV2 mechanism owner, and verifier owner respectively | CAV2-local where applicable; only L1 content-integrity behavior was locally executed | Three separate exact pointers or owner-adopted records | Truth, actor identity, authorization, promotion, or discharge | [E-ATTESTATION; P-IN-TOTO] |
| Crosswalk, proof-obligation index, and human page | Projection owner | Derived and unbuilt | Regenerate from exact owner sources and a digest-bound manifest | Canonical source, Inventory, discharge record, or promotion decision | [E-PROJECTION] |
| Publication authorization | Named publishing principal plus required source owners | Missing | Exact owner-local decision pointer required before any public output | Visibility flag, freshness result, semantic truth, or promotion | [E-PUBLIC] |
| External standard mapping | Adapter owner plus each local semantic owner | Design precedent only | Typed, versioned adapter reference with explicit non-proof limit | External authority over local owner decisions | [P-SACM; P-PROV; P-OSLC; P-SHACL; P-RFC6920; P-IN-TOTO] |

## Record taxonomy and non-collapse rules

This taxonomy is a candidate documentation denominator. Under TOP-03, the names and meanings below remain owner-local payload semantics; the shared envelope cannot enumerate or reduce them. [E-TOP-03]

| Record or artifact | Minimum meaning | Never equivalent to | Evidence |
|---|---|---|---|
| Proof claim | An owner-local proposition whose reportable reach is bounded by an assertion limit | Proof object, evidence, pass result, receipt, discharge, or promotion | [E-EVIDENCE; P-SACM] |
| Obligation | An owner-local requirement to establish or refute a claim under named inputs and policy | Predicate, evaluation attempt, receipt, or discharged status | [E-DS-EVF; P-WHY3] |
| Predicate | An owner-owned semantic condition over a subject | Obligation lifecycle, executable test, result, or proof | [E-DS-EVF] |
| Binding | Version- and digest-exact links from a predicate or obligation to sources, fixtures, runtime, evaluator, policy, and configuration | Authorization, currentness, execution, or success | [E-DS-EVF; P-RFC6920] |
| Observational evidence | An observation scoped to producer, subject, method, and inputs | Formal proof object, receipt, lifecycle decision, or semantic authority | [E-EVIDENCE] |
| Formal proof object | An artifact owned by a formal system and bound to its definitions and checker | Test evidence, checker execution evidence, proof status, or owner acceptance | [E-EVIDENCE; P-WHY3] |
| Proof-checker execution evidence | An exact record of a checker invocation and outcome | The proof object, semantic truth, owner acceptance, or discharge | [E-EVIDENCE; P-SHACL] |
| Evaluator receipt | An exact typed record emitted by an evaluator for a bounded execution | Observation, semantic authority, lifecycle decision, or promotion | [E-DS-EVF; E-EVIDENCE] |
| Lifecycle decision | An explicit decision by the owner-local lifecycle authority | Evidence, receipt, successful evaluation, attestation, or promotion | [E-CAV2-AUTHORITY; P-WHY3] |
| Attestation statement | A producer's statement about a subject and predicate | Attestation mechanism, verifier receipt, statement truth, actor identity, or authorization | [E-ATTESTATION; P-IN-TOTO] |
| Attestation mechanism metadata | CAV2-local mechanism identity and parameters | Statement, verifier result, truth, actor identity at L1, or promotion | [E-ATTESTATION] |
| Attestation verifier receipt | A verifier-owned result over exact statement and envelope bytes | Statement, semantic truth, discharge, or publication authorization | [E-ATTESTATION; P-IN-TOTO] |
| Canonical source | An artifact admitted by its narrowest legitimate owner and authority route | A generated page, Inventory entry, digest, schema validity, receipt, or attestation | [E-TOP-01; E-CAV2-AUTHORITY] |
| Derived projection | A reproducible read model over exact owner sources | Canonical source, owner resolution, lifecycle decision, Inventory, or publication permission | [E-PROJECTION] |

Seven axes must remain orthogonal: materialization origin, authority posture, record currentness, obligation status, evaluation outcome, projection freshness, and publication authorization. In particular, generated does not mean non-canonical, canonical does not mean current or passed, current does not mean discharged, passed does not mean discharged or promoted, fresh does not mean authorized for publication, and published does not mean true or proved. [E-TOP-03; E-PROJECTION; E-PUBLIC]

Evaluation outcome must retain four independent dimensions: case polarity, expected subject outcome, observed subject outcome, and harness outcome. A negative case in which the subject is accepted when rejection was expected is a harness failure, not a domain pass. [E-DS-EVF]

## Identity, version, supersession, and reopening

The following are candidate contract rules, not adopted lifecycle semantics:

1. `owner_namespace + record_id` is the stable owner-scoped identity. `record_version` identifies an immutable version, while `record_digest` binds the exact bytes and names its algorithm. A digest proves byte identity only. [E-TOP-03; P-RFC6920]
2. Every semantic, lifecycle, promotion, publication, authority-kind, provenance, mapping, source, and typed reference must resolve to an explicit owner, ID, version, and digest. A path without version and digest is not sufficient for a current proof-obligation binding. [E-TOP-03; E-DS-EVF]
3. A byte change creates a new digest and must create a new owner-recognized version; an existing version or receipt is never rewritten to cover new bytes. [P-PROV; P-RFC6920]
4. Supersession is directional owner-local metadata. The superseded version stays addressable; currentness is separately resolved by the record owner and cannot be inferred from file existence, generation time, or digest validity. [E-TOP-03; P-PROV]
5. An evaluation attempt is bound to the exact input versions, evaluator, verifier, policy, configuration, and runtime. If any bound input changes or becomes superseded, the prior attempt remains historical evidence but cannot establish current status. [E-EVIDENCE; P-WHY3]
6. Reopening never mutates prior evidence or receipts. The obligation lifecycle owner issues a new owner-local decision referencing the old decision and the changed or newly admitted inputs; the old discharge, if any, becomes historical. The common layer only carries opaque `obligation_status_ref` and `record_currentness_ref` values. [E-TOP-03; P-WHY3]
7. DomainSpec and CAV2 must define and validate their lifecycle vocabularies separately. No shared transition table may infer discharge, promotion, or publication. [E-CAV2-AUTHORITY; E-TOP-03]

## Source-to-evidence-to-receipt binding contract

The proposed trace is:

```text
owner semantic source
  -> predicate
  -> obligation
  -> exact binding
  -> fixture + runtime + evaluator/verifier/policy/configuration
  -> generated test or formal obligation
  -> subject/checker execution evidence
  -> evaluator or checker receipt
  -> owner-local lifecycle decision
  -> derived machine index and human projection
```

Each arrow is a typed, version- and digest-exact reference; it transfers neither authority nor truth. Evidence and receipts remain producer-owned. Only the named lifecycle authority may decide discharge, reopen, kill, or refusal, and only a named promotion or publication authority may perform its distinct decision. [E-DS-EVF; E-EVIDENCE; E-CAV2-AUTHORITY; E-PROJECTION]

At minimum, an executable attempt must bind semantic sources, predicate, obligation, fixture, runtime preimage or postimage, evaluator and verifier identity, policy, configuration, generated artifact, child result, and receipt schema. A projection must additionally bind its generator identity/version/digest, owner catalog or adapter digests, mapping adapters, privacy and projection policies, any publication authorization, and output digest. [E-DS-EVF; E-PROJECTION]

## Promotion and private/public boundaries

DomainSpec retains DomainSpec meaning and obligation lifecycle. CAV2 retains CAV2 authority kinds, claim-proof bounds, privacy rules, promotion prerequisites, and CAV2 attestation. CAV2's apex role does not make it the owner of DomainSpec semantics. [E-DS-SEMANTICS; E-CAV2-AUTHORITY]

Adoption, successful evaluation, discharge, promotion, and publication are five distinct acts. None can be inferred from a schema pass, hash match, receipt, attestation, generated page, or Inventory entry. Evidence and receipts cannot self-promote. [E-EVIDENCE; E-CAV2-AUTHORITY; E-PROJECTION]

Private DomainSpec or CAV2 payloads and mechanisms require a named classification, audience, channel, publishing principal, and exact source-owner authorization before a public projection. This research authorizes no public Arcanum artifact and no copying of private prose or mechanisms into a public surface. [E-PUBLIC]

## Human and machine documentation layout

| Layer | Machine form | Human form | Authority and generation rule | Current status |
|---|---|---|---|---|
| Owner source | Existing owner-native semantic and governance files | Existing owner-authored explanations | Canonical only through the owner's existing authority route | Existing, with the EVF candidate caveat [E-DS-SEMANTICS; E-DS-EVF; E-CAV2-AUTHORITY] |
| Owner-local catalog or adapter | Owner-schema records containing exact pointers or explicitly adopted owner records | Owner-local catalog guide | Meaning and lifecycle are validated only by that owner; path and adoption remain owner decisions | Unbuilt [E-TOP-02; E-TOP-03] |
| Cross-project machine index | Proposed `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/candidate/projections/proof-obligation-index.v1.json` | None | Derived navigation only; it cannot discover the repository, replace Inventory, resolve owners, discharge, promote, or authorize publication | Unbuilt and unverified [E-PROJECTION] |
| Projection manifest | Digest-bound generator, input, adapter, mapping, policy, authorization, and output record; path unresolved | Short generation and limitation note | Must be generated before either projection and must make freshness reproducible | Missing [E-PROJECTION] |
| Human proof/obligation page | Generated from the same admitted manifest and index | Claim, owner, scope, inputs, attempts, current owner decision, counter-evidence, and assertion limit | A read model only; it must visibly label candidate, currentness, execution, and publication state | Path unresolved and unbuilt [E-PROJECTION; P-SACM] |
| Public projection | Privacy-filtered generated subset | Audience-specific page | Requires exact publication authorization from the publishing principal and required source owners | Blocked by GATE-08 [E-PUBLIC] |

No owner-catalog path is selected by this research. Selecting one before GATE-01 and the owner-local adoption decisions would imply authority that the evidence does not establish. [E-SHARED-OWNER]

## Index and validator contracts

The machine index is a derived navigation surface across exact proof-claim, obligation, binding, evidence, receipt, and owner-local status pointers. It must bind the generator, syntax or both owner-local envelope digests, owner catalogs or adapters, mapping adapters, projection and privacy policies, any publication authorization, and the output digest. It has no power to discover authority, mutate or replace Inventory, discharge an obligation, promote a source, or authorize publication. [E-PROJECTION]

The proposed validation split is deliberately non-overlapping:

| Owner | Proposed validator contracts | Allowed checks | Forbidden interpretation |
|---|---|---|---|
| Shared syntax owner, if ratified | `COMMON-VAL-SYNTAX` | Field presence, identifier syntax, digest syntax, reference completeness | Kind and relation meanings, authorization, lifecycle, discharge, promotion |
| DomainSpec | `DS-VAL-SOURCE-RESOLUTION`, `DS-VAL-EXACT-BINDING`, `DS-VAL-RECORD-CURRENTNESS`, `DS-VAL-SEMANTIC-ADMISSION`, `DS-VAL-RELATION-DERIVATION`, `DS-VAL-EVALUATOR-RECEIPT`, `DS-VAL-OBLIGATION-LIFECYCLE` | DomainSpec meaning, obligations, binding currentness, evaluation and lifecycle inputs | CAV2 promotion or publication authorization |
| CAV2 | `CAV2-VAL-AUTHORITY-KIND`, `CAV2-VAL-AUTHORITY-POSTURE`, `CAV2-VAL-PRIVACY`, `CAV2-VAL-PROMOTION-PREREQUISITES`, `CAV2-VAL-ATTESTATION` | CAV2 authority, privacy, promotion prerequisites, and CAV2 attestation | DomainSpec meaning or discharge |
| Projection owner | `PROJ-VAL-CROSS-PROJECT-MAPPING`, `PROJ-VAL-EXACT-REGENERATION`, `PROJ-VAL-FRESHNESS`, `PROJ-VAL-PUBLICATION-AUTHORIZATION` | Mapping resolution, regeneration, freshness, privacy filtering, authorization binding | Granting publication, promoting sources, mutating Inventory |
| Aggregate command owner | `AGGREGATE-VALIDATION-ORCHESTRATOR` | Ordered invocation, typed result preservation, fail-closed exit propagation | Reinterpreting owner verdicts, granting authority, turning indeterminate into pass |

These contract names describe planned validators; they are not evidence that the validators exist. Aggregate validation must preserve the first failing or indeterminate typed owner result; a later successful check cannot erase it. [E-DS-EVF; E-CAV2-AUTHORITY; E-PROJECTION]

## Worked DomainSpec EVF positive-chain example — blocked, not proof

`DS-EVF-POS-01` below is an editorial example ID, not a canonical record ID. It documents the intended complete chain while making every missing link explicit.

| Stage | Exact current or planned binding | Proof label |
|---|---|---|
| Semantic owner | `projects/domainspec-v2/definitions/DEFINITIONS.md`, lines 1057-1151, DS-D1 and DS-D8, sha256 `04541ad0f1cb995324950fa2c04a839a236aff1cda168e1767bb2b67a7adcc4d` | Observed DomainSpec semantic authority [E-DS-SEMANTICS] |
| Meta-type registry | `projects/domainspec-v2/definitions/meta-types/meta-types.yml`, complete registry, sha256 `4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede` | Observed [E-DS-SEMANTICS] |
| Rule-to-Operation relationship | `projects/domainspec-v2/definitions/relationships/relationships.yml`, lines 1-18 and 101-113, sha256 `ffc97f2c358e4bebeebd8ceeb25aef59628be9c970cf6a7e510f7a37c9876d9f` | Observed; current relationship validator executed-pass [E-DS-SEMANTICS] |
| Predicate | `projects/domainspec-v2/development/evolvable-validation-framework/semantic-source/key-door-predicate.v1.json`, lines 1-28, sha256 `1e8d49d55c463e98d012775f6d39b79d50d50faaaffbf2930528811b073fc94b` | Observed candidate; promotion unverified [E-DS-EVF] |
| Obligation | `projects/domainspec-v2/development/evolvable-validation-framework/contracts/key-door-obligations.v1.json`, lines 1-16, sha256 `0abb0901bb8ac659e1d26ec2611e5926a74fede5f35bba27ee4de99de354af62` | Observed candidate; discharge unverified [E-DS-EVF] |
| Runtime contract | `projects/domainspec-v2/development/evolvable-validation-framework/contracts/key-door-runtime.v1.json`, lines 5-10, sha256 `40c9f27244dc7bfe4e955f595ae4924a442c8948dc43830ca57c8de998fb861f` | Planned-create candidate [E-DS-EVF] |
| Binding | `projects/domainspec-v2/development/evolvable-validation-framework/fixtures/SWU-GCP-001/key-door-binding.v1.json`, lines 53-59, sha256 `ae49a8b33aa3b1c7b20691252e41461769762ea6bae77c4585b182c8d08e0a08`; declares the runtime source absent and requires a postimage digest | Observed candidate with currentness blocker [E-DS-EVF] |
| Runtime postimage | `projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/fixtures/key-door-runtime.ts`, sha256 `1ba24134f1bb2180abfae7af037238413d55ffe7abbf8fde11020128f5ceb0e8`, 323 bytes | Observed untracked postimage [E-DS-EVF] |
| Evaluator, verifier, policy, and configuration | No version- and digest-exact bindings | Missing; unverified [E-DS-EVF] |
| Generated test and child result | No admitted artifact or execution result | Missing; unexecuted [E-DS-EVF] |
| Positive and negative evaluator receipts | Receipt schema exists at `projects/domainspec-v2/development/evolvable-validation-framework/contracts/evolvable-validation-receipt.v1.schema.json`, sha256 `d52e86e7604bf8f041edb33eeec9dfc5838238940b53508abb8f68e42be834ee`; no bound receipt exists | Schema observed; receipts missing [E-DS-EVF] |
| Validation receipt, independent replay, lifecycle decision, projection manifest, and output | No admitted artifacts | Missing; unexecuted and unverified [E-DS-EVF; E-PROJECTION] |

The first planned stop is `DS-VAL-BINDING-CURRENTNESS`, before generated-test execution, because the binding declares an absent runtime while an untracked postimage now exists and no exact postimage digest has been admitted. The validator and rejection receipt themselves are missing, so this is an observed currentness blocker, not an executed rejection and not a successful negative control. Consequently the example cannot support completeness, non-vacuity, discharge, reproducibility, or execution-readiness claims. [E-DS-EVF]

## Worked negative-control contract — unmaterialized and unexecuted

`NV-N05-FAILED-NEGATIVE-CONTROL` tests whether result dimensions remain non-collapsed:

| Field | Contract value |
|---|---|
| Fixture ID/version | `domainspec.evf.negative.failed-control@v1` |
| Planned path | `projects/domainspec-v2/development/evolvable-validation-framework/fixtures/proof-obligation-substrate/v1/failed-negative-control.v1.json` |
| Fixture digest | `null` because the bytes do not exist |
| Expected validator | `DS-VAL-EVALUATOR-RECEIPT` |
| First stop | Case classification before receipt admission |
| Case polarity | `negative` |
| Expected subject outcome | `reject` |
| Observed subject outcome | `accept` |
| Harness outcome | `fail` |
| Forbidden effects | Domain pass, positive receipt, discharge, validator-readiness claim |
| Current proof label | Version-exact plan only; fixture missing, unexecuted, receipt missing |

If the eventual subject accepts the negative case, the harness must fail and refuse receipt admission; acceptance cannot be normalized into a pass. The contract is discriminating as a research design, but it is not content-exact or executed evidence until bytes, digest, invocation, and receipt exist. [E-DS-EVF; P-SHACL]

The required negative suite is:

| Case | ID/version | Expected validator and first stop | Current proof label |
|---|---|---|---|
| Missing source | `domainspec.evf.negative.missing-source@v1` | `DS-VAL-SOURCE-RESOLUTION`; before derivation or execution | Fixture and receipt missing; unexecuted |
| Digest mismatch | `domainspec.evf.negative.digest-mismatch@v1` | `DS-VAL-EXACT-BINDING`; before currentness or execution | Fixture and receipt missing; unexecuted |
| Stale superseded record | `domainspec.evf.negative.stale-superseded@v1` | `DS-VAL-RECORD-CURRENTNESS`; owner-local supersession resolution | Fixture and receipt missing; unexecuted |
| Unauthorized semantic source | `domainspec.evf.negative.unauthorized-source@v1` | `DS-VAL-SEMANTIC-ADMISSION`; DomainSpec semantic-owner admission | Fixture and receipt missing; unexecuted |
| Failed negative control | `domainspec.evf.negative.failed-control@v1` | `DS-VAL-EVALUATOR-RECEIPT`; case classification before receipt admission | Fixture and receipt missing; unexecuted |
| Reopened obligation | `domainspec.evf.negative.reopened-obligation@v1` | `DS-VAL-OBLIGATION-LIFECYCLE`; owner-local lifecycle reduction | Fixture and receipt missing; unexecuted |
| Unknown cross-project authority kind | `projection.cross-project.negative.unknown-authority-kind@v1` | `PROJ-VAL-CROSS-PROJECT-MAPPING` composed with `CAV2-VAL-AUTHORITY-KIND`; before projection | Fixture and receipt missing; unexecuted |

All seven are version-exact fixture contracts but not content-exact fixtures: every fixture digest is null because the bytes do not exist. [E-DS-EVF; E-CAV2-AUTHORITY; E-PROJECTION]

## Migration and compatibility inventory

| Existing surface | Preserve | Candidate migration action | Compatibility and authority limit | Evidence |
|---|---|---|---|---|
| DomainSpec definitions, meta-types, and relationships | Existing bytes, IDs, meanings, and validation route | Add exact owner-local pointers or adapters only after DomainSpec adoption | Never duplicate or reinterpret meaning in the shared layer or CAV2 | [E-DS-SEMANTICS] |
| EVF predicate, obligation, runtime, binding, fixtures, and receipt schema | Exact dirty/untracked posture, selectors, and digests | Freeze an inventory of candidate bytes; supersede stale binding; bind missing evaluator/runtime evidence | Do not promote, discharge, or call complete before execution | [E-DS-EVF] |
| CAV2 definitions, authority model, constitutions, boundaries, promotion, and validation | Private canonical sources and narrowest-owner routes | Add CAV2-local adapters only after authority-kind, residue, and provenance gates resolve | Never copy private mechanisms into public Arcanum or make CAV2 own DomainSpec meaning | [E-CAV2-AUTHORITY; E-PUBLIC] |
| CAV2 L1 attestation specimen | Statement, mechanism, verifier separation and exact local results | Reference as a CAV2-local integrity example | L1 does not establish statement truth, L2, actor identity, promotion, or publication | [E-ATTESTATION] |
| Inventory | Existing discovery/read-model role | No migration; projections may link to but never mutate or replace it | Inventory is neither canonical authority nor proof | [E-PROJECTION] |
| Research artifacts and future crosswalk/index/pages | Candidate status and exact generation inputs | Keep under research until owners adopt source artifacts and authorize publication | Generated outputs remain derived even when fresh | [E-PROJECTION; E-PUBLIC] |
| External standards | Versioned selectors and explicit non-proof limits | Use only through owner-adopted mapping adapters | No external source can decide local truth, authority, discharge, or promotion | [P-SACM; P-PROV; P-OSLC; P-SHACL; P-RFC6920; P-IN-TOTO] |

No package root, public API, compatibility promise, or canonical path migration is authorized by this research. [E-TOP-03; E-PUBLIC]

## Unresolved owner decisions

| Gate | Required decision | Decision owners |
|---|---|---|
| GATE-01 | Name a shared syntax owner, canonical source, authority ceiling, and exact two-owner adoption acts; otherwise activate TOP-02 | DomainSpec owner, CAV2 owner, proposed syntax owner |
| GATE-02 | Resolve `O_spec` semantic ownership versus `O_gen` output | DomainSpec semantic and derivation owners |
| GATE-03 | Map CAV2 adapters to existing authority kinds or invoke definitions governance | CAV2 definitions and authority-kind owners |
| GATE-04 | Resolve residue as kind versus attribute | CAV2 ontology and decision owners |
| GATE-05 | Adopt separate owner-local lifecycle vocabularies and transitions | DomainSpec and CAV2 lifecycle owners separately |
| GATE-06 | Resolve `process_origin` and declared versus attested provenance | CAV2 canonical-artifact and attestation owners |
| GATE-07 | Define cross-project mapping semantics, owner, and conflict route | Both source owners plus mapping owner |
| GATE-08 | Name publication authority, classification, audience, channel, and publishing principal | Source owners and publishing principal |

These are owner gates, not gaps that research may fill by inference. [E-SHARED-OWNER; E-CAV2-AUTHORITY; E-PUBLIC]

The distinct evidence-readiness blockers are:

- `EVF-READINESS-001`: the complete positive chain is missing.
- `EVF-CURRENTNESS-001`: the exact stale-runtime binding condition is observed, but its validator and rejection receipt are missing.
- `NEGATIVE-FIXTURE-READINESS-001`: seven fixture byte sets, digests, executions, and receipts are missing.
- `PROJECTION-READINESS-001`: generator, input, policy, authorization, output, and reproducibility bindings are missing.

These blockers prohibit claims of complete witness, non-vacuity, discharge, reproducibility, execution readiness, projection readiness, or canonical adoption. [E-DS-EVF; E-PROJECTION]

## Dependency-ordered non-executed Work Pack

Every step below is **not executed**.

| ID | Depends on | Owner | Task |
|---|---|---|---|
| WP-00 | — | Named decision owners | Resolve GATE-01 through GATE-08 and write boundaries. |
| WP-01 | WP-00 | Research candidate owner | Freeze paths, selectors, digests, versions, and dirty/untracked posture. |
| WP-02 | WP-01 | Ratified syntax owner, or each owner separately | Author syntax-only fixtures for TOP-03, or two local envelopes plus a derived adapter for TOP-02. |
| WP-03 | WP-02 | DomainSpec semantic owner | Author DomainSpec-local schemas and exact adapters without duplicating sources. |
| WP-04 | WP-00, WP-02 | CAV2 governance owners | Repair drift, resolve residue and `process_origin`, and author CAV2-local adapters. |
| WP-05 | WP-03, WP-04 | Respective validator owners | Implement separate common, DomainSpec, CAV2, and projection validators; aggregate only by orchestration. |
| WP-06 | WP-05 | Fixture owners | Materialize and digest-bind the seven negative fixtures and positive-chain inputs. |
| WP-07 | WP-06 | DomainSpec EVF execution owner | Supersede the stale runtime binding, bind evaluator and verifier, add commands and tests to the existing package, and execute positive and negative cases. |
| WP-08 | WP-07 | DomainSpec obligation lifecycle authority | Issue discharge, reopen, kill, or refusal; receipts do not self-discharge. |
| WP-09 | WP-03, WP-04, WP-05, WP-07 | Projection owner | Generate the bounded index, crosswalk, pages, and manifest with privacy and authorization checks. |
| WP-10 | WP-08, WP-09 | Independent reviewers and separate promotion owners | Re-run reviews and request separate adoption, discharge, promotion, and publication decisions. |

The dependency order prevents implementation from standing in for unresolved authority and prevents execution evidence from standing in for lifecycle, promotion, or publication decisions. [E-TOP-03; E-CAV2-AUTHORITY; E-EVIDENCE; E-PUBLIC]

## Evidence register

All evidence labels below are transcribed from the evidence-closed synthesis. “Observed” means inspected source evidence; “executed” is used only where the explorer reported a local execution; “unverified” marks absent adoption, implementation, or execution. External precedents constrain design but carry no local semantic or governance authority.

### Repository-local claims

- **E-TOP-01** — Direct sources: `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md`, selectors `#authority-rule`, `#narrowest-owner-rule`, `#non-collapse-rules`, sha256 `8e9d39eb39399cef051b71eb1d37daaad87c2409329151a077e01c5a772b3407`; `cyberAlchemy-v2/authority/boundaries.md`, selectors `#source-and-read-model`, `#public-and-private`, sha256 `c84aa3d66fe82137a50c9e6a3059f5e5300b51dc638f5e48fa1c00311a5cdf63`. Explorer: `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/receipts/explorer-cav2.json`, sha256 `72a67edb4b597191a04d2d4feb8e3d96c39324e3b4be82eb8e97b4b9a4f7b439`. Proof label: observed CAV2-local owner separation and private/public boundary.
- **E-TOP-02** — Direct source: `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/research.md`, selector `#explorer-return-2-beer-cav2 /topology_assessment/alternatives/1`, sha256 `5142c1f177cdcf8bdbdfc4760c14071c458e1ef59c35eec1859fb2134a2a7513`. Explorer: `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/receipts/explorer-cav2.json`, sha256 `72a67edb4b597191a04d2d4feb8e3d96c39324e3b4be82eb8e97b4b9a4f7b439`. Proof label: observed design evidence; canonical adoption and non-vacuity unverified.
- **E-TOP-03** — Direct sources: `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/research.md`, selector `#explorer-return-2-beer-cav2 /topology_assessment/recommended`, sha256 `5142c1f177cdcf8bdbdfc4760c14071c458e1ef59c35eec1859fb2134a2a7513`; OMG SACM 2.3, sections 11.8-11.14 and Annex D.4; W3C PROV-O Recommendation, sections 1 and 3 including Bundle, Attribution, Revision, Generation, and Invalidation. Explorers: `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/receipts/explorer-cav2.json`, sha256 `72a67edb4b597191a04d2d4feb8e3d96c39324e3b4be82eb8e97b4b9a4f7b439`; `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/receipts/explorer-precedent.json`, sha256 `1c8740b7152e62c3b817551e075cd106544204de084569b978efbcb2b8d6a61b`. Proof label: observed design evidence; local owner, adoption, and non-vacuity unverified.
- **E-SHARED-OWNER** — Direct source: `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/research.md`, selector `#explorer-return-2-beer-cav2 /owner_map/shared-record-schema`, sha256 `5142c1f177cdcf8bdbdfc4760c14071c458e1ef59c35eec1859fb2134a2a7513`. Explorer: `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/receipts/explorer-cav2.json`, sha256 `72a67edb4b597191a04d2d4feb8e3d96c39324e3b4be82eb8e97b4b9a4f7b439`. Proof label: observed owner blocker; no shared owner or adoption act exists.
- **E-DS-SEMANTICS** — Direct sources: `projects/domainspec-v2/definitions/DEFINITIONS.md`, lines 1057-1151, DS-D1 and DS-D8, sha256 `04541ad0f1cb995324950fa2c04a839a236aff1cda168e1767bb2b67a7adcc4d`; `projects/domainspec-v2/definitions/meta-types/meta-types.yml`, complete registry, sha256 `4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede`; `projects/domainspec-v2/definitions/relationships/relationships.yml`, lines 1-18 and 101-113, sha256 `ffc97f2c358e4bebeebd8ceeb25aef59628be9c970cf6a7e510f7a37c9876d9f`. Explorer: `receipts/explorer-domainspec.json`, sha256 `4bccb5c956497d0a6af03661c82ace0c70e2bef61b93f3d7403fa5172d074af3`. Proof label: observed current DomainSpec semantic authority; relationship validator executed-pass.
- **E-DS-EVF** — Direct sources: `projects/domainspec-v2/development/evolvable-validation-framework/semantic-source/key-door-predicate.v1.json`, lines 1-28, sha256 `1e8d49d55c463e98d012775f6d39b79d50d50faaaffbf2930528811b073fc94b`; `projects/domainspec-v2/development/evolvable-validation-framework/contracts/key-door-obligations.v1.json`, lines 1-16, sha256 `0abb0901bb8ac659e1d26ec2611e5926a74fede5f35bba27ee4de99de354af62`; `projects/domainspec-v2/development/evolvable-validation-framework/contracts/key-door-runtime.v1.json`, complete record and lines 5-10, sha256 `40c9f27244dc7bfe4e955f595ae4924a442c8948dc43830ca57c8de998fb861f`; `projects/domainspec-v2/development/evolvable-validation-framework/fixtures/SWU-GCP-001/key-door-binding.v1.json`, complete record and lines 53-59, sha256 `ae49a8b33aa3b1c7b20691252e41461769762ea6bae77c4585b182c8d08e0a08`; `projects/domainspec-v2/development/evolvable-validation-framework/contracts/evolvable-validation-receipt.v1.schema.json`, complete schema, sha256 `d52e86e7604bf8f041edb33eeec9dfc5838238940b53508abb8f68e42be834ee`. Explorer: `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/receipts/explorer-domainspec.json`, sha256 `4bccb5c956497d0a6af03661c82ace0c70e2bef61b93f3d7403fa5172d074af3`. Proof label: observed dirty or untracked candidate bytes; execution, discharge, and promotion unverified.
- **E-CAV2-AUTHORITY** — Direct sources: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`, selectors `#cav2-d23-authority-lifecycle-axis`, `#cav2-d38-claim-proof-bound`, `#cav2-d48-authority-promotion-lifecycle`, `#cav2-d49-closed-authority-kind-enumeration`, `#cav2-d51-canonical-artifact`, sha256 `b38cb3cd4cb03f3984091a6721af65da9df7fe4838f6a4a12a824b9763a7475c`; `cyberAlchemy-v2/authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md`, selectors `#cav2-c2-authority-layer-separation`, `#cav2-c11-import-before-promotion`, `#cav2-c18-artifact-admission-before-mutation`, sha256 `ba1339cf6f2ee6c4e2bf2bbf2f82d2fe90e497e7b32507d72dc6d5d4620339d4`. Explorer: `receipts/explorer-cav2.json`, sha256 `72a67edb4b597191a04d2d4feb8e3d96c39324e3b4be82eb8e97b4b9a4f7b439`. Proof label: observed CAV2-local authority and promotion boundaries; deterministic authority-kind enforcement unbuilt.
- **E-EVIDENCE** — Direct source: `cyberAlchemy-v2/validation/artifact-admission/receipt.schema.json`, lines 5-21 and 266-363, sha256 `ffde1ba68b8e025285cc291faf6597025fca023802d2920f2f47be8258a51c8a`; W3C SHACL Recommendation, sections 3.4-3.6; RFC 6920, sections 2 and 10. Explorers: `receipts/explorer-cav2.json`, sha256 `72a67edb4b597191a04d2d4feb8e3d96c39324e3b4be82eb8e97b4b9a4f7b439`; `receipts/explorer-precedent.json`, sha256 `1c8740b7152e62c3b817551e075cd106544204de084569b978efbcb2b8d6a61b`. Proof label: observed design evidence; no shared evidence ledger authorized.
- **E-PROJECTION** — Direct sources: `cyberAlchemy-v2/authority/boundaries.md`, selectors `#generated-and-canonical`, `#source-and-read-model`, `#research-and-specification`, sha256 `c84aa3d66fe82137a50c9e6a3059f5e5300b51dc638f5e48fa1c00311a5cdf63`; OASIS OSLC RM 2.1, sections 2.4 and 2.9. Explorers: `receipts/explorer-cav2.json`, sha256 `72a67edb4b597191a04d2d4feb8e3d96c39324e3b4be82eb8e97b4b9a4f7b439`; `receipts/explorer-precedent.json`, sha256 `1c8740b7152e62c3b817551e075cd106544204de084569b978efbcb2b8d6a61b`. Proof label: observed design evidence; projections unbuilt.
- **E-ATTESTATION** — Direct sources: `cyberAlchemy-v2/development/attestation-capability/SPEC.md`, selectors `#the-capability-contract`, `#the-upgrade-ladder-honest-about-cost`, `#boundary--internal-moat-adjacent`, sha256 `07ab5a84e60261c9fb8d2bd9baadf0d53f649cbaa3d5abefff32da4bec30fca2`; `cyberAlchemy-v2/development/attestation-capability/development/specimen/DEMO.md`, selectors `#discriminating-self-test-run-via-python3-attestpy-verify-artifact-claimed`, `#verdict`, sha256 `b4df95c7cc0840732588160719cd9e6622e99508bac9c968b4ddfcb538480d85`; in-toto Attestation Framework v1.2, Statement, Envelope, and test-result predicate links. Explorers: `receipts/explorer-cav2.json`, sha256 `72a67edb4b597191a04d2d4feb8e3d96c39324e3b4be82eb8e97b4b9a4f7b439`; `receipts/explorer-precedent.json`, sha256 `1c8740b7152e62c3b817551e075cd106544204de084569b978efbcb2b8d6a61b`. Proof label: locally executed L1 valid/tampered witness; L2, actor identity, and broader truth unverified.
- **E-PUBLIC** — Direct source: `cyberAlchemy-v2/authority/boundaries.md`, selector `#public-and-private`, sha256 `c84aa3d66fe82137a50c9e6a3059f5e5300b51dc638f5e48fa1c00311a5cdf63`. Explorer: `receipts/explorer-cav2.json`, sha256 `72a67edb4b597191a04d2d4feb8e3d96c39324e3b4be82eb8e97b4b9a4f7b439`. Proof label: observed private/public boundary; no publication authorized.

### External precedent and non-proof limits

- **P-SACM** — OMG SACM 2.3, sections 11.8-11.14 and Annex D.4. Explorer: `receipts/explorer-precedent.json`, sha256 `1c8740b7152e62c3b817551e075cd106544204de084569b978efbcb2b8d6a61b`. Proof label: observed external structural precedent for separating claims, assertion state, artifact citation, reasoning, and counter-evidence; it provides no local truth, authority, discharge, or adoption.
- **P-PROV** — W3C PROV-O Recommendation, sections 1 and 3, especially Bundle, Attribution, Revision, Generation, and Invalidation. Explorer: `receipts/explorer-precedent.json`, sha256 `1c8740b7152e62c3b817551e075cd106544204de084569b978efbcb2b8d6a61b`. Proof label: observed external precedent for provenance and immutable revision pointers; provenance does not certify truth or compliance.
- **P-WHY3** — Why3 1.8.2 documentation, sections 5.3-5.5. Explorer: `receipts/explorer-precedent.json`, sha256 `1c8740b7152e62c3b817551e075cd106544204de084569b978efbcb2b8d6a61b`. Proof label: observed external precedent for separating obligations from attempts and reopening stale results; a prior attempt is not current after bound inputs change.
- **P-OSLC** — OASIS OSLC RM 2.1, sections 2.4 and 2.9. Explorer: `receipts/explorer-precedent.json`, sha256 `1c8740b7152e62c3b817551e075cd106544204de084569b978efbcb2b8d6a61b`. Proof label: observed external precedent for provider-scoped IDs and typed links; a `validatedBy` link does not prove validation passed.
- **P-SHACL** — W3C SHACL Recommendation, sections 3.4-3.6. Explorer: `receipts/explorer-precedent.json`, sha256 `1c8740b7152e62c3b817551e075cd106544204de084569b978efbcb2b8d6a61b`. Proof label: observed external precedent for separating validator, input, and report; conformance is scoped and processor failure is indeterminate.
- **P-RFC6920** — RFC 6920, sections 2 and 10. Explorer: `receipts/explorer-precedent.json`, sha256 `1c8740b7152e62c3b817551e075cd106544204de084569b978efbcb2b8d6a61b`. Proof label: observed external precedent for named digest algorithms and exact-byte identity; digest equality proves integrity only.
- **P-IN-TOTO** — in-toto Attestation Framework v1.2, framework layering and Statement, Envelope, and test-result predicate links. Explorer: `receipts/explorer-precedent.json`, sha256 `1c8740b7152e62c3b817551e075cd106544204de084569b978efbcb2b8d6a61b`. Proof label: observed external precedent for statement, predicate, and envelope separation; authentication does not establish predicate truth or lifecycle authority.

## Final disposition

The research is writer-complete but not owner-complete or evidence-complete. TOP-03 remains a conditional syntax-only design; TOP-02 is the automatic authority-correct fallback. The next legitimate action is WP-00: obtain the eight named owner decisions. No canonical mutation, implementation, discharge, promotion, publication, release, deployment, or production claim follows from this document. [E-SHARED-OWNER; E-DS-EVF; E-CAV2-AUTHORITY; E-PUBLIC]
